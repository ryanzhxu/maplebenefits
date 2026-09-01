/**
 * Formatting helpers for money, dates, and amount estimates.
 */

import type { AmountEstimate, Locale } from "@/types/benefit";

export function formatMoney(amount: number, locale: Locale): string {
  const loc = locale === "en" ? "en-CA" : "zh-Hant-HK";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const PERIOD_LABEL: Record<
  AmountEstimate["period"],
  Record<Locale, string>
> = {
  year: { en: "/year", "zh-Hant": "／年", "zh-Hans": "／年" },
  month: { en: "/month", "zh-Hant": "／月", "zh-Hans": "／月" },
  "one-time": {
    en: "one-time",
    "zh-Hant": "一次性",
    "zh-Hans": "一次性",
  },
};

const UP_TO: Record<Locale, string> = {
  en: "up to ",
  "zh-Hant": "最多 ",
  "zh-Hans": "最多 ",
};

/** Render an estimate as a human string, e.g. "$1,200–$2,400/year". */
export function formatEstimate(
  estimate: AmountEstimate,
  locale: Locale,
): string {
  const period = PERIOD_LABEL[estimate.period][locale];
  if (estimate.low === estimate.high) {
    return `${formatMoney(estimate.high, locale)}${
      estimate.period === "one-time" ? " " + period : period
    }`;
  }
  if (estimate.low === 0) {
    return `${UP_TO[locale]}${formatMoney(estimate.high, locale)}${
      estimate.period === "one-time" ? " " + period : period
    }`;
  }
  const dash = "–";
  return `${formatMoney(estimate.low, locale)}${dash}${formatMoney(
    estimate.high,
    locale,
  )}${estimate.period === "one-time" ? " " + period : period}`;
}

/** Months since an ISO date. Used for the data-freshness warning. */
export function monthsSince(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return 0;
  return (
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth())
  );
}

export function isStale(isoDate: string, maxMonths = 6): boolean {
  return monthsSince(isoDate) > maxMonths;
}

export function formatDate(isoDate: string, locale: Locale): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const loc = locale === "en" ? "en-CA" : "zh-Hant";
  return new Intl.DateTimeFormat(loc, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
