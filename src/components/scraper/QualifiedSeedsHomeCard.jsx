import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, Leaf, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteQualifiedSeed,
  getApiErrorMessage,
  getQualifiedSeedsList,
  getQualifiedSeedsListAll,
} from "@/api/scraperApi";
import { reportClientError } from "@/utils/reportClientError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function instagramProfileUrl(username) {
  const u = String(username ?? "").trim();
  if (!u) return "";
  return `https://www.instagram.com/${encodeURIComponent(u)}/`;
}

async function copyToClipboard(text, successMessage) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (err) {
    reportClientError(
      "QualifiedSeedsHomeCard/clipboard",
      err,
      "Could not copy to clipboard."
    );
  }
}

async function copyUsername(label, text) {
  await copyToClipboard(text, `${label} copied`);
}

function QualifiedSeedsHomeCard() {
  const [followingLimit, setFollowingLimit] = useState("500");
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [rows, setRows] = useState(
    /** @type {{ username: string; following: number }[]} */ ([])
  );
  const [selectedIndices, setSelectedIndices] = useState(() => new Set());
  const [deletingForUsername, setDeletingForUsername] = useState(
    /** @type {string | null} */ (null)
  );
  const selectAllRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const handleFetch = async () => {
    const raw = followingLimit.trim();
    const n = raw === "" ? NaN : Number(followingLimit);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Following limit must be a non-negative integer.");
      return;
    }

    setLoading(true);
    try {
      const res = await getQualifiedSeedsList(n);
      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        setSelectedIndices(new Set());
        toast.success(
          res.data.length === 0
            ? "No qualified seeds match this filter."
            : `Loaded ${res.data.length} qualified seed(s).`
        );
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      reportClientError("QualifiedSeedsHomeCard/fetch", err, msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    setLoadingAll(true);
    try {
      const res = await getQualifiedSeedsListAll();
      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        setSelectedIndices(new Set());
        toast.success(
          res.data.length === 0
            ? "No qualified seeds in the database."
            : `Loaded ${res.data.length} seed(s) (full list).`
        );
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      reportClientError("QualifiedSeedsHomeCard/fetchAll", err, msg);
    } finally {
      setLoadingAll(false);
    }
  };

  const busy = loading || loadingAll || deletingForUsername != null;

  const selectedRows = useMemo(() => {
    const ordered = [...selectedIndices].sort((a, b) => a - b);
    return ordered.map((i) => rows[i]).filter((r) => r != null);
  }, [rows, selectedIndices]);

  const sumFollowingSelected = useMemo(
    () =>
      selectedRows.reduce(
        (sum, r) =>
          sum +
          (Number.isFinite(Number(r.following)) ? Number(r.following) : 0),
        0
      ),
    [selectedRows]
  );

  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;
  const someSelected = selectedIndices.size > 0 && !allSelected;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someSelected;
  }, [someSelected]);

  const toggleRow = (index) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIndices(new Set());
    else setSelectedIndices(new Set(rows.map((_, i) => i)));
  };

  const handleDeleteRow = async (username) => {
    const u = String(username ?? "").trim();
    if (!u) return;

    setDeletingForUsername(u);
    try {
      const res = await deleteQualifiedSeed(u);
      if (res?.success) {
        setRows((prev) => prev.filter((r) => r.username !== u));
        setSelectedIndices(new Set());
        toast.success(`Removed @${u} from qualified seeds.`);
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      reportClientError("QualifiedSeedsHomeCard/delete", err, msg);
    } finally {
      setDeletingForUsername(null);
    }
  };

  const handleBulkCopyUsernames = () => {
    const lines = selectedRows
      .map((r) => String(r.username ?? "").trim())
      .filter((u) => u.length > 0);
    if (lines.length === 0) return;
    void copyToClipboard(
      lines.join("\n"),
      `${lines.length} username${
        lines.length === 1 ? "" : "s"
      } copied (one per line)`
    );
  };

  return (
    <Card className="rounded-none lg:rounded-lg flex min-h-[756px] max-h-[1000px] max-w-full min-w-0 lg:max-h-[756px] flex-1 flex-col border-emerald-100/80 shadow-md dark:border-emerald-900/40 lg:h-full lg:min-h-0">
      <CardHeader className="shrink-0">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-emerald-50/80 p-2 dark:bg-emerald-950/40">
            <Leaf className="size-5 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="space-y-1">
            <CardTitle>Qualified seeds</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              List seeds at or below a following count, excluding original
              pipeline input usernames.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col space-y-6 pt-0">
        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xs flex-1 space-y-2">
            <Label htmlFor="qualified-following-limit">
              Following limit (max)
            </Label>
            <Input
              id="qualified-following-limit"
              inputMode="numeric"
              placeholder="500"
              value={followingLimit}
              onChange={(e) => setFollowingLimit(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Button
              type="button"
              className="gap-2 bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-600 dark:hover:bg-emerald-600/90"
              onClick={() => void handleFetch()}
              disabled={busy}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Get Qualified Seeds"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 shrink-0"
              onClick={() => void handleFetchAll()}
              disabled={busy}
            >
              {loadingAll ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </>
              ) : (
                "Get all seeds"
              )}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div>
            <span>Total seeds: {rows.length}</span>
          </div>
          <div className="border rounded-lg h-full min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
            <Table containerClassName="h-full min-h-0 min-w-0 max-w-full">
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[44px] px-2">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      role="checkbox"
                      checked={allSelected}
                      onChange={() => toggleSelectAll()}
                      aria-label="Select all rows"
                      className="mt-[5px] h-4 w-4 cursor-pointer rounded border border-input text-emerald-600 accent-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center tabular-nums" />
                  <TableHead>Username</TableHead>
                  <TableHead className="w-[120px]">Following</TableHead>
                  <TableHead className="min-w-[180px]">URL</TableHead>
                  <TableHead className="w-[52px] px-2 text-right">
                    <span className="sr-only">Delete</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const href = instagramProfileUrl(row.username);
                  const isSelected = selectedIndices.has(index);
                  return (
                    <TableRow
                      key={`${row.username}-${index}`}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "border-b border-border",
                        isSelected && "bg-emerald-50/80 dark:bg-emerald-950/30"
                      )}
                    >
                      <TableCell className="px-2">
                        <input
                          type="checkbox"
                          role="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(index)}
                          aria-label={`Select ${
                            row.username || `row ${index + 1}`
                          }`}
                          className="mt-[5px] h-4 w-4 cursor-pointer rounded border border-input text-emerald-600 accent-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        />
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {(index + 1).toString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex max-w-[200px] items-center gap-0.5">
                          <span className="min-w-0 truncate">
                            {row.username}
                          </span>
                          {row.username ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                              aria-label={`Copy username ${row.username}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyUsername("Username", row.username);
                              }}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.following != null
                          ? Number(row.following).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-w-0 max-w-full items-center gap-1 truncate text-pink-600 hover:underline dark:text-pink-400"
                          >
                            <span className="truncate">{href}</span>
                            <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-right">
                        {row.username ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete qualified seed ${row.username}`}
                            disabled={busy}
                            onClick={() => void handleDeleteRow(row.username)}
                          >
                            {deletingForUsername === row.username ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex shrink-0 flex-col gap-3 border rounded-lg px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm tabular-nums text-foreground">
              <span className="font-medium">{selectedIndices.size}</span>
              {" selected · "}
              <span className="text-muted-foreground">
                Sum of following:
              </span>{" "}
              <span className="font-medium">
                {sumFollowingSelected.toLocaleString()}
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => handleBulkCopyUsernames()}
            >
              <Copy className="size-3.5" />
              Copy usernames
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default QualifiedSeedsHomeCard;
