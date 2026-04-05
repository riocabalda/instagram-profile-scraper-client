import { toast } from "sonner";

/**
 * Logs to the console for debugging and shows a Sonner toast (user-facing).
 * @param {string} scope - Short label, e.g. "HomePage/scrape"
 * @param {unknown} caughtValue - Original error or detail (logged as-is)
 * @param {string} toastMessage - Message shown in the toaster
 */
export function reportClientError(scope, caughtValue, toastMessage) {
  console.error(`[${scope}]`, caughtValue);
  toast.error(toastMessage);
}
