import { create } from "zustand";

/**
 * @typedef {Object} ScrapeBanner
 * @property {'running' | 'success' | 'error'} variant
 * @property {string} message
 * @property {unknown} [payload] - API `data` on success, for display
 */

export const useScrapeFormStore = create((set) => ({
  inputsText: "",
  followingLimit: "500",
  chunkLimit: "500",
  followersMin: "500",
  followersMax: "50000",
  token: "",

  /** True while POST /trigger is in flight (persists if you navigate away and back). */
  isRunning: false,

  /** Last run feedback shown in the header panel. */
  banner: /** @type {ScrapeBanner | null} */ (null),

  setInputsText: (inputsText) => set({ inputsText }),
  setFollowingLimit: (followingLimit) => set({ followingLimit }),
  setChunkLimit: (chunkLimit) => set({ chunkLimit }),
  setFollowersMin: (followersMin) => set({ followersMin }),
  setFollowersMax: (followersMax) => set({ followersMax }),
  setToken: (token) => set({ token }),

  setIsRunning: (isRunning) => set({ isRunning }),
  setBanner: (banner) => set({ banner }),
}));
