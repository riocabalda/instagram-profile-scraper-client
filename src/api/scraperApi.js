import axios from "axios";
import { apiClient, SCRAPER_TRIGGER_TIMEOUT_MS } from "./client";

/**
 * @typedef {object} PaginationMeta
 * @property {number} total
 * @property {number} page_size
 * @property {number} total_pages
 * @property {number} current_page
 * @property {boolean} has_prev_page
 * @property {boolean} has_next_page
 * @property {number|null} prev_page
 * @property {number|null} next_page
 */

/**
 * @typedef {object} PendingProfile
 * @property {string} id
 * @property {string} username
 * @property {string} [full_name]
 * @property {string} [url]
 * @property {string} [input_url]
 * @property {number} [followers_count]
 * @property {number} [follows_count]
 * @property {string} [bio]
 * @property {string} [status]
 * @property {boolean} [has_external_url]
 * @property {boolean} [is_qualified_seed]
 * @property {string} [createdAt]
 */

/**
 * @typedef {object} QualifiedSeedRow
 * @property {string} username
 * @property {number} following
 */

/**
 * @param {{ inputs: string[]; token: string; followingLimit?: number; chunkLimit?: number; followersMin?: number; followersMax?: number }} payload
 */
export async function postTriggerScrape(payload) {
  const { data } = await apiClient.post("/api/scraper/trigger", payload, {
    timeout: SCRAPER_TRIGGER_TIMEOUT_MS,
  });
  return data;
}

/**
 * @param {number} page
 * @returns {Promise<{ success: boolean; data: { data: PendingProfile[]; pagination: PaginationMeta } }>}
 */
export async function getPendingProfilesPage(page) {
  const { data } = await apiClient.get("/api/scraper/profiles", {
    params: { page },
  });
  return data;
}

/**
 * @param {string[]} usernames
 * @returns {Promise<{ success: boolean; data: { modifiedCount: number; matchedCount: number } }>}
 */
export async function patchProfilesChecked(usernames) {
  const { data } = await apiClient.patch("/api/scraper/profiles", {
    usernames,
  });
  return data;
}

/**
 * @returns {Promise<{ success: boolean; data: { deletedCount: number } }>}
 */
export async function deletePendingProfiles() {
  const { data } = await apiClient.delete("/api/scraper/profiles/pending");
  return data;
}

/**
 * @param {{ username: string; following: number }} payload
 * @returns {Promise<{ success: boolean; data: { username: string; following: number } }>}
 */
export async function postQualifiedSeed(payload) {
  const { data } = await apiClient.post("/api/scraper/qualified-seeds", payload);
  return data;
}

/**
 * @param {string} username
 * @returns {Promise<{ success: boolean; data: { username: string } }>}
 */
export async function deleteQualifiedSeed(username) {
  const { data } = await apiClient.delete("/api/scraper/qualified-seeds", {
    params: { username },
  });
  return data;
}

/**
 * @param {number} followingLimit
 * @returns {Promise<{ success: boolean; data: QualifiedSeedRow[] }>}
 */
export async function getQualifiedSeedsList(followingLimit) {
  const { data } = await apiClient.get("/api/scraper/qualified-seeds", {
    params: { followingLimit },
  });
  return data;
}

/**
 * All qualified seeds: no following max filter; excludes pipeline input usernames.
 * @returns {Promise<{ success: boolean; data: QualifiedSeedRow[] }>}
 */
export async function getQualifiedSeedsListAll() {
  const { data } = await apiClient.get("/api/scraper/qualified-seeds", {
    params: { all: true },
  });
  return data;
}

/**
 * @param {string} [message]
 * @param {unknown[]} [duplicates]
 * @returns {string}
 */
export function joinMessageWithDuplicates(message, duplicates) {
  const m = typeof message === "string" ? message.trim() : "";
  const d =
    Array.isArray(duplicates) && duplicates.length > 0
      ? duplicates.map((x) => String(x).trim()).filter((s) => s.length > 0)
      : [];
  const suffix = d.length > 0 ? ` — ${d.join(", ")}` : "";
  if (m && d.length > 0) return `${m}${suffix}`;
  if (m) return m;
  if (d.length > 0) {
    return `Duplicate usernames: ${d.join(", ")}`;
  }
  return "";
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getApiErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const ax =
      /** @type {import("axios").AxiosError<{ message?: string; errors?: { msg?: string; path?: string }[]; duplicates?: string[] }>} */ (
        error
      );
    const data = ax.response?.data;
    const msg = typeof data?.message === "string" ? data.message : "";
    const dupesRaw = data?.duplicates;
    const joined = joinMessageWithDuplicates(
      msg,
      Array.isArray(dupesRaw) ? dupesRaw : []
    );
    if (joined) return joined;

    const errs = data?.errors;
    if (Array.isArray(errs) && errs.length > 0) {
      const parts = errs
        .map((e) => (typeof e?.msg === "string" ? e.msg : null))
        .filter(Boolean);
      if (parts.length) return parts.slice(0, 3).join("; ");
    }
    if (typeof ax.message === "string") return ax.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
