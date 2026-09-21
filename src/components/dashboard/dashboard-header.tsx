"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { locales, useI18n, type Locale } from "@/lib/i18n";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "prediction-markets-theme";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function applyTheme(mode: ThemeMode): void {
  const dark = mode === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function subscribeToSystemTheme(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToStoredTheme(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredTheme(): ThemeMode | null {
  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(storedMode) ? storedMode : null;
}

function ThemeToggle() {
  const systemMode = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    (): ThemeMode => "light",
  );
  const storedMode = useSyncExternalStore(subscribeToStoredTheme, getStoredTheme, () => null);
  const [manualMode, setManualMode] = useState<ThemeMode | null>(null);
  const mode = manualMode ?? storedMode ?? systemMode;

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return (
    <button
      type="button"
      onClick={() => {
        const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
        setManualMode(nextMode);
        applyTheme(nextMode);
      }}
      className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-semibold dark:border-slate-700"
      aria-label={`Theme mode: ${mode}. Activate to change`}
    >
      {mode === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

export function DashboardHeader({ fetchedAt }: { fetchedAt?: number }) {
  const { locale, setLocale, t, formatDate } = useI18n();

  function localeLabel(value: Locale): string {
    return value === "ru" ? "Русский" : value === "zh" ? "中文" : "English";
  }

  return (
    <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
        {t("rawDataExplorer")}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("dashboardTitle")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            {t("dashboardDescription")}
          </p>
        </div>
        {fetchedAt ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("updated", { date: formatDate(fetchedAt) })}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <span className="sr-only">{t("language")}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              aria-label={t("language")}
              className="min-h-11 rounded-md border border-slate-300 bg-transparent px-1 text-sm dark:border-slate-700"
            >
              {locales.map((item) => (
                <option key={item} value={item}>
                  {localeLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
