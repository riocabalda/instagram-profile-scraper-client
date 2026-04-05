import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const THEME_STORAGE_KEY = "instagram-app-theme";

/**
 * @typedef {Object} ThemeState
 * @property {boolean} isDarkMode
 * @property {() => void} toggleDarkMode
 * @property {(isDark: boolean) => void} setDarkMode
 * @property {() => void} initializeTheme
 */

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false,

      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        get().applyTheme(isDark);
      },

      toggleDarkMode: () => {
        const newValue = !get().isDarkMode;
        set({ isDarkMode: newValue });
        get().applyTheme(newValue);
      },

      applyTheme: (isDark) => {
        if (typeof window === "undefined") return;

        const htmlElement = document.documentElement;
        if (isDark) {
          htmlElement.classList.add("dark");
        } else {
          htmlElement.classList.remove("dark");
        }
      },

      initializeTheme: () => {
        const { isDarkMode } = get();
        get().applyTheme(isDarkMode);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
      }),
    },
  ),
);
