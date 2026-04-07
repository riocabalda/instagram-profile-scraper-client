import { useEffect, useState } from "react";
import { Instagram, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/themeStore";

function Navigation() {
  const [navigation, setNavigation] = useState("");
  const location = useLocation();
  const isTablePage = navigation === "/table";
  const { isDarkMode, toggleDarkMode, initializeTheme } = useThemeStore();

  useEffect(() => {
    setNavigation(location.pathname || "");
  }, [location.pathname]);

  useEffect(() => {
    initializeTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className="border-b border-violet-100/80 bg-card/50 backdrop-blur dark:border-violet-900/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Instagram className="size-3.5 text-pink-600" aria-hidden />
            <span className="hidden lg:block leading-none">
              Instagram profile toolkit
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex gap-6">
            <Link
              to="/home"
              className="text-sm font-medium transition-colors hover:text-foreground"
              onClick={() => setNavigation("home")}
            >
              Home
            </Link>
            <Link
              to="/table"
              className="text-sm font-medium transition-colors hover:text-foreground"
              onClick={() => setNavigation("table")}
            >
              Table
            </Link>
            <div
              className={`absolute bottom-0 h-0.5 bg-pink-600 transition-all duration-300 ease-out ${
                !isTablePage ? "-left-[5.5px] w-12" : "left-[55px] w-12"
              }`}
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-6">
            {isDarkMode ? (
              <Moon className="size-4 text-muted-foreground" />
            ) : (
              <Sun className="size-4 text-muted-foreground" />
            )}
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
