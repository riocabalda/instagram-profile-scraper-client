import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, postQualifiedSeed } from "@/api/scraperApi";
import { reportClientError } from "@/utils/reportClientError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SaveQualifiedSeedCard() {
  const [username, setUsername] = useState("");
  const [following, setFollowing] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const u = String(username ?? "").trim();
    if (!u) {
      toast.error("Username is required.");
      return;
    }
    const raw = following.trim();
    if (raw === "") {
      toast.error("Following is required.");
      return;
    }
    const n = Number(following);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Following must be a non-negative integer.");
      return;
    }

    setSaving(true);
    try {
      const res = await postQualifiedSeed({ username: u, following: n });
      if (res?.success && res.data) {
        toast.success(
          `Saved @${res.data.username} (${Number(
            res.data.following,
          ).toLocaleString()} following).`,
        );
        setUsername("");
        setFollowing("");
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      reportClientError("SaveQualifiedSeedCard/save", err, msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-none lg:rounded-lg border-emerald-100/80 shadow-md dark:border-emerald-900/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-emerald-50/80 p-2 dark:bg-emerald-950/40">
            <Leaf className="size-5 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="space-y-1">
            <CardTitle>Save qualified seed</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Store a username and its following count in the qualified seed
              list. A leading @ is optional.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="save-qualified-username">Username</Label>
            <Input
              id="save-qualified-username"
              placeholder="..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={saving}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="save-qualified-following">Following</Label>
            <Input
              id="save-qualified-following"
              inputMode="numeric"
              placeholder="500"
              value={following}
              onChange={(e) => setFollowing(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-600/90 dark:bg-emerald-600 dark:hover:bg-emerald-600/90"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Qualified Seed"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SaveQualifiedSeedCard;
