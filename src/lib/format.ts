/**
 * Formatting helpers for money, dates, and amount estimates.
 */

import type { AmountEstimate, BenefitLevel, Locale } from "@/types/benefit";

const MONEY_LOCALE: Record<Locale, string> = {
  en: "en-CA",
  "zh-Hant": "zh-Hant-HK",
  "zh-Hans": "zh-Hant-HK",
  fr: "fr-CA",
  pa: "pa",
};

export function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(MONEY_LOCALE[locale], {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const PERIOD_LABEL: Record<
  AmountEstimate["period"],
  Record<Locale, string>
> = {
  year: { en: "/year", "zh-Hant": "／年", "zh-Hans": "／年", fr: "/année", pa: "/ਸਾਲ" },
  month: { en: "/month", "zh-Hant": "／月", "zh-Hans": "／月", fr: "/mois", pa: "/ਮਹੀਨਾ" },
  "one-time": {
    en: "one-time",
    "zh-Hant": "一次性",
    "zh-Hans": "一次性",
    fr: "unique",
    pa: "ਇੱਕ ਵਾਰ",
  },
};

const UP_TO: Record<Locale, string> = {
  en: "up to ",
  "zh-Hant": "最多 ",
  "zh-Hans": "最多 ",
  fr: "jusqu'à ",
  pa: "ਵੱਧ ਤੋਂ ਵੱਧ ",
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

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-CA",
  "zh-Hant": "zh-Hant",
  "zh-Hans": "zh-Hant",
  fr: "fr-CA",
  pa: "pa",
};

export function formatDate(isoDate: string, locale: Locale): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  // isoDate is a bare calendar date ("YYYY-MM-DD"), parsed as UTC midnight.
  // Pinning the formatter to UTC keeps the displayed day fixed regardless of
  // the viewer's timezone -- otherwise the static-export build (UTC) and a
  // Canadian browser (west of UTC) render different calendar days for the
  // same string, which React reports as a hydration mismatch.
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/* -------------------------------------------------------------------------
 * Hiding a redundant province prefix
 *
 * Most provincial programs are named after their province ("BC Bus Pass
 * Program", "Ontario Child Benefit"). Wherever a LevelBadge already shows the
 * province directly above the name, repeating it reads as noise -- especially
 * in a list filtered to one province, where every card starts the same way.
 *
 * This is a DISPLAY concern only. `benefit.name` keeps the official program
 * name, because it also feeds the page <title>, the JSON-LD, the browse search
 * index, and the bare cross-reference pills in related/prerequisite lists,
 * which carry no badge. It is also the name someone needs when they apply.
 * ---------------------------------------------------------------------- */

/**
 * Prefixes to hide, per level and locale. Longest first, so "Newfoundland and
 * Labrador" is tried before "Newfoundland" and "British Columbia" before "BC".
 */
const LEVEL_NAME_PREFIXES: Partial<
  Record<BenefitLevel, Partial<Record<Locale, string[]>>>
> = {
  "provincial-bc": {
    en: ["British Columbia", "BC"],
    "zh-Hant": ["卑詩省", "卑詩"],
    "zh-Hans": ["不列颠哥伦比亚省", "不列颠哥伦比亚"],
  },
  "provincial-on": {
    en: ["Ontario"],
    "zh-Hant": ["安大略省", "安大略"],
    "zh-Hans": ["安大略省", "安大略"],
  },
  "provincial-ab": {
    en: ["Alberta"],
    "zh-Hant": ["亞伯達省", "亞伯達"],
    "zh-Hans": ["阿尔伯塔省", "阿尔伯塔"],
  },
  "provincial-mb": {
    en: ["Manitoba"],
    "zh-Hant": ["緬尼托巴省", "緬尼托巴"],
    "zh-Hans": ["曼尼托巴省", "曼尼托巴"],
  },
  "provincial-sk": {
    en: ["Saskatchewan"],
    "zh-Hant": ["薩斯喀徹溫省", "薩斯喀徹溫"],
    "zh-Hans": ["萨斯喀彻温省", "萨斯喀彻温"],
  },
  "provincial-ns": {
    en: ["Nova Scotia"],
    "zh-Hant": ["新斯科舍省", "新斯科舍"],
    "zh-Hans": ["新斯科舍省", "新斯科舍"],
  },
  "provincial-nb": {
    en: ["New Brunswick"],
    "zh-Hant": ["新不倫瑞克省", "新不倫瑞克"],
    "zh-Hans": ["新不伦瑞克省", "新不伦瑞克"],
  },
  "provincial-pe": {
    en: ["Prince Edward Island", "PEI"],
    "zh-Hant": ["愛德華王子島省", "愛德華王子島"],
    "zh-Hans": ["爱德华王子岛省", "爱德华王子岛"],
  },
  "provincial-nl": {
    en: ["Newfoundland and Labrador", "Newfoundland", "NL"],
    "zh-Hant": ["紐芬蘭與拉布拉多", "紐芬蘭"],
    "zh-Hans": ["纽芬兰与拉布拉多", "纽芬兰"],
  },
};

/**
 * Shortest remainder still worth showing on its own.
 *
 * "Ontario Works" would otherwise become "Works", which names nothing. English
 * needs a few characters to stay meaningful; Chinese carries far more per
 * character, so "安大略工作援助" shortens to "工作援助" and reads correctly.
 */
const MIN_REMAINDER: Partial<Record<Locale, number>> = { en: 6, "zh-Hant": 2, "zh-Hans": 2 };

/**
 * Drop a leading province name from an already-resolved benefit name.
 *
 * Use ONLY where a LevelBadge sits beside the name. Returns the name unchanged
 * when it carries no province prefix, when the level is federal, or when what
 * would remain is too short to stand alone.
 */
export function stripLevelPrefix(
  name: string,
  level: BenefitLevel,
  locale: Locale,
): string {
  for (const prefix of LEVEL_NAME_PREFIXES[level]?.[locale] ?? []) {
    if (!name.startsWith(prefix)) continue;
    // English separates the prefix with a space; Chinese runs it together.
    const rest = name.slice(prefix.length).replace(/^[\s :-]+/, "");
    if (rest.length >= (MIN_REMAINDER[locale] ?? 6)) return rest;
    return name;
  }
  return name;
}
