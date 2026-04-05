import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { reportClientError } from "@/utils/reportClientError";
import { ChevronLeft, ChevronRight, RefreshCw, Table2 } from "lucide-react";
import {
  getApiErrorMessage,
  getPendingProfilesPage,
  patchProfilesChecked,
} from "@/api/scraperApi";
import PendingProfilesTable from "@/components/scraper/PendingProfilesTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { pendingProfilesSwrKey } from "@/lib/pendingProfilesSwr";

/** @param {readonly [string, number]} key */
async function pendingProfilesFetcher([, pageNum]) {
  return getPendingProfilesPage(pageNum);
}

function TablePage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    pendingProfilesSwrKey(page),
    pendingProfilesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      keepPreviousData: true,
      onError: (err) => {
        reportClientError("TablePage/profiles", err, getApiErrorMessage(err));
      },
    }
  );

  const markQueueRef = useRef(new Set());
  const flushTimerRef = useRef(null);

  const flushMarkedUsernames = useCallback(async () => {
    const usernames = [...markQueueRef.current];
    markQueueRef.current.clear();
    flushTimerRef.current = null;
    if (usernames.length === 0) return;
    try {
      await patchProfilesChecked(usernames);
    } catch (e) {
      reportClientError("TablePage/markChecked", e, getApiErrorMessage(e));
      const revert = new Set(usernames.map((u) => u.toLowerCase()));
      mutate(
        (current) => {
          if (!current?.success || !current.data?.data) return current;
          return {
            ...current,
            data: {
              ...current.data,
              data: current.data.data.map((p) =>
                revert.has(String(p.username).toLowerCase())
                  ? { ...p, status: "pending" }
                  : p
              ),
            },
          };
        },
        { revalidate: false }
      );
    }
  }, [mutate]);

  const scheduleMarkChecked = useCallback(
    (username) => {
      const u = String(username).trim().toLowerCase();
      if (!u) return;

      mutate(
        (current) => {
          if (!current?.success || !current.data?.data) return current;
          return {
            ...current,
            data: {
              ...current.data,
              data: current.data.data.map((p) =>
                String(p.username).toLowerCase() === u
                  ? { ...p, status: "checked" }
                  : p
              ),
            },
          };
        },
        { revalidate: false }
      );

      markQueueRef.current.add(u);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(() => {
        void flushMarkedUsernames();
      }, 2000);
    },
    [mutate, flushMarkedUsernames]
  );

  useEffect(() => {
    const queueRef = markQueueRef;
    const timerRef = flushTimerRef;
    return () => {
      const timerId = timerRef.current;
      if (timerId) {
        clearTimeout(timerId);
        timerRef.current = null;
      }
      const pending = [...queueRef.current];
      queueRef.current.clear();
      if (pending.length > 0) {
        void patchProfilesChecked(pending).catch((e) => {
          console.error("[TablePage/unmount flush]", e);
        });
      }
    };
  }, []);

  const pagination = data?.success ? data.data?.pagination : undefined;
  const profiles =
    data?.success && data.data?.data
      ? data.data.data
      : /** @type {import("@/api/scraperApi").PendingProfile[]} */ ([]);

  const currentPage = pagination?.current_page ?? page;
  const totalPages = pagination?.total_pages ?? 0;
  const totalDocs = pagination?.total ?? 0;
  const pageSize = pagination?.page_size ?? 100;

  const handleRefresh = () => {
    void mutate();
  };

  const goPrev = () => {
    const p = pagination?.prev_page;
    if (p != null) setPage(p);
  };

  const goNext = () => {
    const p = pagination?.next_page;
    if (p != null) setPage(p);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-pink-600 dark:text-pink-400">
          Pending leads
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Profile queue
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Rows come from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            GET /api/scraper/profiles
          </code>
          . Open a profile URL to highlight it and mark it reviewed (optimistic,
          saved after 2s debounce). Use{" "}
          <Link
            to="/home"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Home
          </Link>{" "}
          to run the scraper.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-muted/40 p-2">
              <Table2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Pending profiles
              </h2>
              <p className="text-sm text-muted-foreground">
                {pagination ? (
                  <>
                    {totalDocs.toLocaleString()} total · {pageSize} per page ·
                    SWR (no refetch on focus)
                  </>
                ) : error ? (
                  <span className="text-destructive">
                    {getApiErrorMessage(error)}
                  </span>
                ) : (
                  "Loading…"
                )}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto"
            onClick={handleRefresh}
            disabled={isLoading || isValidating}
          >
            <RefreshCw
              className={`size-4 ${isValidating ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <Separator />

        <PendingProfilesTable
          profiles={profiles}
          isLoading={isLoading}
          isValidating={isValidating}
          onProfileUrlClick={scheduleMarkChecked}
        />

        {pagination && totalPages > 0 ? (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">{currentPage}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={
                  isLoading || isValidating || !pagination.has_prev_page
                }
                onClick={goPrev}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={
                  isLoading || isValidating || !pagination.has_next_page
                }
                onClick={goNext}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default TablePage;
