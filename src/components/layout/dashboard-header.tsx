"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { locales, useI18n, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

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
    <Button
      type="button"
      onClick={() => {
        const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
        setManualMode(nextMode);
        applyTheme(nextMode);
      }}
      className="px-0"
      aria-label={`Theme mode: ${mode}. Activate to change`}
    >
      {mode === "dark" ? "🌙" : "☀️"}
    </Button>
  );
}

export function DashboardHeader({
  fetchedAt,
  isRefreshing = false,
  isStale = false,
}: {
  fetchedAt?: number;
  isRefreshing?: boolean;
  isStale?: boolean;
}) {
  const { locale, setLocale, t, formatDate } = useI18n();

  function localeLabel(value: Locale): string {
    return value === "ru" ? "Русский" : value === "zh" ? "中文" : "English";
  }

  return (
    <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-orange-500">Polymarket</span>
          <span className="px-2 text-slate-400">/</span>
          <span className="text-cyan-500">Kalshi</span>
          <span className="ml-2">{t("dashboardTitleData")}</span>
        </h1>
        {fetchedAt ? (
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p>{t("updated", { date: formatDate(fetchedAt) })}</p>
            <p className="mt-1 flex items-center justify-end gap-1.5 font-semibold">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${
                  isRefreshing ? "bg-blue-500" : isStale ? "bg-slate-400" : "bg-emerald-500"
                }`}
              />
              {isRefreshing ? t("refreshing") : isStale ? t("cachedData") : t("freshData")}
            </p>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <label className="flex min-h-8.5 items-center gap-2 text-sm">
            <span className="sr-only">{t("language")}</span>
            <span className="relative inline-flex">
              <Select
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                aria-label={t("language")}
                className="appearance-none pl-2 pr-4"
              >
                {locales.map((item) => (
                  <option key={item} value={item}>
                    {localeLabel(item)}
                  </option>
                ))}
              </Select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-current"
              />
            </span>
          </label>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
