"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Locale, LocalizedString } from "@/types/benefit";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_HTML_LANG,
  resolve as resolveLocalized,
  SWITCHER_LOCALES,
} from "./locale";
import { DICTIONARIES, EN_DICT } from "./dictionaries";

const STORAGE_KEY = "mb.locale";

type TVars = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a UI string by dot-path key, with English fallback. */
  t: (key: string, vars?: TVars) => string;
  /** Resolve a LocalizedString from the data layer. */
  r: (value: LocalizedString | undefined) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function lookup(dict: unknown, path: string[]): unknown {
  let cur: unknown = dict;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as object)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

function interpolate(str: string, vars?: TVars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, name) =>
    name in vars ? String(vars[name]) : m,
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from a ?lang= share link, else localStorage, after mount
  // (avoids SSR mismatch). The URL param wins so a shared link always lands
  // on the intended locale, and persists it for the visitor's next visit.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (isLocale(fromUrl) && SWITCHER_LOCALES.includes(fromUrl)) {
        setLocaleState(fromUrl);
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
        return;
      }
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, []);

  // Keep <html lang> in sync for accessibility and SEO.
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: TVars) => {
      const path = key.split(".");
      const localized = lookup(DICTIONARIES[locale], path);
      if (typeof localized === "string") return interpolate(localized, vars);
      const english = lookup(EN_DICT, path);
      if (typeof english === "string") return interpolate(english, vars);
      return key; // last-resort: show the key so gaps are visible
    },
    [locale],
  );

  const r = useCallback(
    (value: LocalizedString | undefined) => resolveLocalized(value, locale),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, r }),
    [locale, setLocale, t, r],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
