import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import { useThemeStore } from "@/stores/themeStore";

function App() {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-background to-background transition-colors duration-300 dark:from-violet-950/25 dark:via-background dark:to-background">
        <Navigation />
        <Outlet />
      </div>
    </TooltipProvider>
  );
}

export default App;
