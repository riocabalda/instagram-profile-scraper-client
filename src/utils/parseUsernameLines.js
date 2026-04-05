/**
 * One Instagram handle per line. An optional leading "@" is stripped before
 * sending; backend normalizes to lowercase.
 *
 * @param {string} text
 * @returns {{ ok: true; usernames: string[] } | { ok: false; error: string }}
 */
export function parseSeedUsernames(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: "Add at least one username (one per line)." };
  }

  const usernames = [];
  for (let i = 0; i < lines.length; i += 1) {
    let handle = lines[i];
    if (handle.startsWith("@")) {
      handle = handle.slice(1).trim();
    }
    if (!handle) {
      return {
        ok: false,
        error: `Line ${i + 1}: username is empty.`,
      };
    }
    if (/\s/.test(handle) || handle.includes("@")) {
      return {
        ok: false,
        error: `Line ${i + 1}: use a single handle only (no spaces or @).`,
      };
    }
    usernames.push(handle);
  }

  return { ok: true, usernames };
}
