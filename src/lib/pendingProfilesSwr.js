export const PENDING_PROFILES_SWR_KEY = "pending-profiles";

/** @param {number} page */
export function pendingProfilesSwrKey(page) {
  return [PENDING_PROFILES_SWR_KEY, page];
}
