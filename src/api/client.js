import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL;
const baseURL =
  typeof rawBase === "string" ? rawBase.replace(/\/$/, "") : "";

/** Long-running Apify pipeline — override with VITE_SCRAPER_TIMEOUT_MS if needed. */
export const SCRAPER_TRIGGER_TIMEOUT_MS = Number(
  import.meta.env.VITE_SCRAPER_TIMEOUT_MS ?? 600_000,
);

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
