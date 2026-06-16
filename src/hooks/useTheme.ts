"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/constants";

export type Theme = "light" | "night";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial = stored === "night" ? "night" : "light";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "night");
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle("dark", next === "night");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "night" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
