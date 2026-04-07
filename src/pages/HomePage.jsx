import { Loader2, Play } from "lucide-react";
import QualifiedSeedsHomeCard from "@/components/scraper/QualifiedSeedsHomeCard";
import {
  getApiErrorMessage,
  joinMessageWithDuplicates,
  postTriggerScrape,
} from "@/api/scraperApi";
import { useScrapeFormStore } from "@/stores/scrapeFormStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseSeedUsernames } from "@/utils/parseUsernameLines";
import { cn } from "@/lib/utils";

function HomePage() {
  const inputsText = useScrapeFormStore((s) => s.inputsText);
  const followingLimit = useScrapeFormStore((s) => s.followingLimit);
  const chunkLimit = useScrapeFormStore((s) => s.chunkLimit);
  const followersMin = useScrapeFormStore((s) => s.followersMin);
  const followersMax = useScrapeFormStore((s) => s.followersMax);
  const token = useScrapeFormStore((s) => s.token);
  const isRunning = useScrapeFormStore((s) => s.isRunning);
  const banner = useScrapeFormStore((s) => s.banner);

  const setInputsText = useScrapeFormStore((s) => s.setInputsText);
  const setFollowingLimit = useScrapeFormStore((s) => s.setFollowingLimit);
  const setChunkLimit = useScrapeFormStore((s) => s.setChunkLimit);
  const setFollowersMin = useScrapeFormStore((s) => s.setFollowersMin);
  const setFollowersMax = useScrapeFormStore((s) => s.setFollowersMax);
  const setToken = useScrapeFormStore((s) => s.setToken);
  const setIsRunning = useScrapeFormStore((s) => s.setIsRunning);
  const setBanner = useScrapeFormStore((s) => s.setBanner);

  const handleRunScrape = async () => {
    const setValidationError = (message) => {
      console.error("[HomePage/validation]", message);
      setBanner({ variant: "error", message });
    };

    const parsed = parseSeedUsernames(inputsText);
    if (!parsed.ok) {
      setValidationError(parsed.error);
      return;
    }
    const inputs = parsed.usernames;
    if (!token.trim()) {
      setValidationError("Apify API token is required.");
      return;
    }

    const flRaw = followingLimit.trim();
    const clRaw = chunkLimit.trim();
    const fl = flRaw === "" ? undefined : Number(followingLimit);
    const cl = clRaw === "" ? undefined : Number(chunkLimit);
    if (fl !== undefined && (!Number.isInteger(fl) || fl < 1 || fl > 5000)) {
      setValidationError(
        "Following limit must be an integer between 1 and 5000."
      );
      return;
    }
    if (cl !== undefined && (!Number.isInteger(cl) || cl < 1 || cl > 1000)) {
      setValidationError("Chunk limit must be an integer between 1 and 1000.");
      return;
    }

    const fMinRaw = followersMin.trim();
    const fMaxRaw = followersMax.trim();
    const fMin = fMinRaw === "" ? 500 : Number(followersMin);
    const fMax = fMaxRaw === "" ? 50000 : Number(followersMax);
    if (!Number.isInteger(fMin) || fMin < 1) {
      setValidationError("Minimum followers must be a positive integer.");
      return;
    }
    if (!Number.isInteger(fMax) || fMax < 1) {
      setValidationError("Maximum followers must be a positive integer.");
      return;
    }
    if (fMin > fMax) {
      setValidationError(
        "Minimum followers must be less than or equal to maximum."
      );
      return;
    }

    const payload = {
      inputs,
      token: token.trim(),
      followersMin: fMin,
      followersMax: fMax,
      ...(fl !== undefined ? { followingLimit: fl } : {}),
      ...(cl !== undefined ? { chunkLimit: cl } : {}),
    };

    setIsRunning(true);
    setBanner({
      variant: "running",
      message:
        "Pipeline is running… You can switch to Table; this will finish in the background.",
    });

    try {
      const res = await postTriggerScrape(payload);
      if (res?.success && res.data) {
        setBanner({
          variant: "success",
          message: res.data.message ?? "Pipeline completed.",
          payload: res.data,
        });
      } else {
        const rawMsg =
          res && typeof res.message === "string" ? res.message : "";
        const dupes = Array.isArray(res?.duplicates) ? res.duplicates : [];
        const msg =
          joinMessageWithDuplicates(rawMsg, dupes) ||
          "Scrape finished but the response was unexpected.";
        console.error("[HomePage/scrape]", res);
        setBanner({ variant: "error", message: msg, payload: res });
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      console.error("[HomePage/scrape]", err);
      setBanner({ variant: "error", message: msg });
    } finally {
      setIsRunning(false);
    }
  };

  const panelTone = banner
    ? {
        running:
          "border-amber-200/90 bg-amber-50/90 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-50",
        success:
          "border-green-300/90 bg-green-50/95 text-green-950 shadow-sm dark:border-green-800 dark:bg-green-950/40 dark:text-green-50",
        error:
          "border-red-300/90 bg-red-50/95 text-red-950 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-50",
      }[banner.variant]
    : "border-violet-100/80 bg-card/40 dark:border-violet-900/40";

  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-10 py-10 lg:px-8">
      {banner ? (
        <header
          className={cn(
            "rounded-xl border p-5 sm:p-6 transition-colors duration-200",
            panelTone
          )}
        >
          <div
            className={cn(
              "mt-4 rounded-lg border px-4 py-3 text-sm",
              banner.variant === "running" &&
                "border-amber-300/70 bg-white/60 dark:border-amber-800 dark:bg-black/20",
              banner.variant === "success" &&
                "border-green-400/60 bg-white/70 dark:border-green-700 dark:bg-black/25",
              banner.variant === "error" &&
                "border-red-400/60 bg-white/70 dark:border-red-800 dark:bg-black/25"
            )}
          >
            <div className="flex items-start gap-2">
              {banner.variant === "running" ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-amber-700 dark:text-amber-300" />
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium leading-snug">{banner.message}</p>
                {banner.variant === "success" && banner.payload != null ? (
                  <pre className="max-h-48 overflow-auto rounded-md border border-green-200/80 bg-white/80 p-3 text-xs leading-relaxed text-green-900 dark:border-green-900 dark:bg-green-950/50 dark:text-green-100">
                    {JSON.stringify(banner.payload, null, 2)}
                  </pre>
                ) : null}
                {banner.variant === "error" &&
                banner.payload &&
                typeof banner.payload === "object" ? (
                  <pre className="max-h-40 overflow-auto rounded-md border border-red-200/80 bg-white/80 p-3 text-xs leading-relaxed text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
                    {JSON.stringify(banner.payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="rounded-none lg:rounded-lg h-full min-h-0 min-w-0 border-violet-100/80 shadow-md dark:border-violet-900/40">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg border bg-violet-50/80 p-2 dark:bg-violet-950/40">
                <Play className="size-5 text-violet-700 dark:text-violet-300" />
              </div>
              <div className="space-y-1">
                <CardTitle>Scrape pipeline</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="seed-usernames">Seed usernames</Label>
              <Textarea
                id="seed-usernames"
                placeholder={"sam.22\nalt.mina"}
                value={inputsText}
                onChange={(e) => setInputsText(e.target.value)}
                className="min-h-[140px] font-mono text-sm"
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                One username per line (e.g.{" "}
                <code className="rounded bg-muted px-0.5">sam.22</code>). A
                leading <code className="rounded bg-muted px-0.5">@</code> is
                optional and is stripped before the request.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="following-limit">Following limit</Label>
                <Input
                  id="following-limit"
                  inputMode="numeric"
                  placeholder="500"
                  value={followingLimit}
                  onChange={(e) => setFollowingLimit(e.target.value)}
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  Apify &quot;resultsLimit&quot; (1–5000). Leave blank to omit
                  and use server default.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chunk-limit">Chunk size</Label>
                <Input
                  id="chunk-limit"
                  inputMode="numeric"
                  placeholder="500"
                  value={chunkLimit}
                  onChange={(e) => setChunkLimit(e.target.value)}
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  Profiles per batch for the detail actor (1–1000). Blank =
                  server default.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="followers-min">Min followers (filter)</Label>
                <Input
                  id="followers-min"
                  inputMode="numeric"
                  placeholder="500"
                  value={followersMin}
                  onChange={(e) => setFollowersMin(e.target.value)}
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  Lower bound for the &quot;followers + URL&quot; save rule.
                  Default 500.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="followers-max">Max followers (filter)</Label>
                <Input
                  id="followers-max"
                  inputMode="numeric"
                  placeholder="50000"
                  value={followersMax}
                  onChange={(e) => setFollowersMax(e.target.value)}
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  Upper bound for the same rule. Default 50,000.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apify-token">Apify API token</Label>
              <Input
                id="apify-token"
                type="password"
                autoComplete="off"
                placeholder="apify_api_…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleRunScrape}
                disabled={isRunning}
                className="gap-2 bg-violet-600 hover:bg-violet-600/90 dark:bg-violet-600 dark:hover:bg-violet-600/90"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Running pipeline…
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    Run scrape
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex min-h-0 min-w-0 flex-col lg:h-full lg:min-h-0">
          <QualifiedSeedsHomeCard />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
