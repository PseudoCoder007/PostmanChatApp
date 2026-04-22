import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "postmanchat.theme";

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Ignore storage failures and use the default theme.
  }
  return "dark";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => getPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Ignore storage failures and keep the theme in memory.
      }
    }
  }, [theme]);

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
