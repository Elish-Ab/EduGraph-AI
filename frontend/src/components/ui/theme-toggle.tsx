"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        collapsed && "justify-center px-2"
      )}
      title={isDark ? "Switch to day mode" : "Switch to night mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 shrink-0 text-primary" />
      ) : (
        <Moon className="w-4 h-4 shrink-0 text-primary" />
      )}
      {!collapsed && (
        <span>{isDark ? "Day mode" : "Night mode"}</span>
      )}
    </button>
  );
}
