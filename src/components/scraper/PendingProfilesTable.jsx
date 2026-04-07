import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reportClientError } from "@/utils/reportClientError";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function copyText(label, text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch (err) {
    reportClientError(
      "PendingProfilesTable/clipboard",
      err,
      "Could not copy to clipboard."
    );
  }
}

/**
 * @param {object} props
 * @param {import("@/api/scraperApi").PendingProfile[]} props.profiles
 * @param {boolean} [props.isLoading]
 * @param {boolean} [props.isValidating]
 * @param {(username: string) => void} [props.onProfileUrlClick]
 * @param {(profile: import("@/api/scraperApi").PendingProfile) => void | Promise<void>} [props.onQualifySeed]
 * @param {string | null} [props.qualifyingUsername] - lowercase username while request in flight
 * @param {string} [props.className]
 */
function PendingProfilesTable({
  profiles,
  isLoading = false,
  isValidating = false,
  onProfileUrlClick,
  onQualifySeed,
  qualifyingUsername = null,
  className,
}) {
  const showInitialLoader = isLoading && profiles.length === 0;

  if (showInitialLoader) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Loading profiles…
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center text-sm text-muted-foreground",
          className
        )}
      >
        No pending profiles yet. Run a scrape from Home, then open Table and
        press Refresh.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-md border",
        isValidating && "opacity-80",
        className
      )}
    >
      {isValidating ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[1px]">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium shadow">
            Refreshing…
          </span>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-center tabular-nums">#</TableHead>
            <TableHead className="min-w-[120px]">Username</TableHead>
            <TableHead className="min-w-[140px]">Name</TableHead>
            <TableHead className="min-w-[200px]">URL</TableHead>
            <TableHead className="min-w-[128px] whitespace-nowrap">
              Seed
            </TableHead>
            <TableHead className="w-[104px] whitespace-nowrap">
              Followers
            </TableHead>
            <TableHead className="w-[104px] whitespace-nowrap">
              Following
            </TableHead>
            <TableHead className="min-w-[160px]">Status</TableHead>
            <TableHead className="min-w-[220px]">Bio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile, index) => {
            const url =
              typeof profile.url === "string" && profile.url.trim()
                ? profile.url.trim()
                : typeof profile.input_url === "string" && profile.input_url
                ? profile.input_url
                : "";
            const rowKey = profile.username || profile.id || `row-${index}`;
            const isCheckedRow = profile.status === "checked";
            const uname = String(profile.username || "").toLowerCase();
            const isQualified = profile.is_qualified_seed === true;
            const isQualifying = qualifyingUsername === uname;
            return (
              <TableRow
                key={`${rowKey}-${index}`}
                className={cn(
                  isCheckedRow &&
                    "bg-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-950"
                )}
              >
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {(index + 1).toString()}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex max-w-[200px] items-center gap-0.5">
                    <span className="min-w-0 truncate">{profile.username}</span>
                    {profile.username ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Copy username ${profile.username}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void copyText("Username", profile.username);
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {profile.full_name || "—"}
                </TableCell>
                <TableCell className="max-w-[320px]">
                  {url ? (
                    <div className="flex max-w-full items-center gap-0.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          onProfileUrlClick?.(
                            typeof profile.username === "string"
                              ? profile.username
                              : ""
                          )
                        }
                        className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-pink-600 hover:underline dark:text-pink-400"
                      >
                        <span className="truncate">{url}</span>
                        <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label="Copy profile URL"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void copyText("URL", url);
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant={isQualified ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 whitespace-nowrap px-2 text-xs"
                    disabled={
                      isQualified ||
                      isQualifying ||
                      !onQualifySeed ||
                      !profile.username
                    }
                    onClick={() => onQualifySeed?.(profile)}
                  >
                    {isQualified
                      ? "Qualified Seed"
                      : isQualifying
                      ? "Saving…"
                      : "Qualify Seed"}
                  </Button>
                </TableCell>
                <TableCell className="tabular-nums">
                  {profile.followers_count != null
                    ? Number(profile.followers_count).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {profile.follows_count != null
                    ? Number(profile.follows_count).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      profile.status === "pending" &&
                        "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
                      profile.status === "checked" &&
                        "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
                      profile.status === "error" &&
                        "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
                      !profile.status && "bg-muted text-muted-foreground"
                    )}
                  >
                    {profile.status ?? "—"}
                  </span>
                  {profile.has_external_url ? (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ext.
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-[320px] truncate text-muted-foreground">
                  {profile.bio || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default PendingProfilesTable;
