# French + Punjabi Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen MapleBenefits' i18n system from 3 locales (en, zh-Hant, zh-Hans) to 5
(+ fr, pa) without touching any of the 1,042 existing `tri()` call sites, and
translate one pilot benefit (Canada Child Benefit, `ccb`) end-to-end into
French and Punjabi to prove the pattern.

**Architecture:** `Locale` widens to a 5-member union; `LocalizedString`
changes from a hand-written fixed shape to one derived from `Locale`, so it
automatically follows any future widening. `tri()` (3-arg, positional) is
untouched and keeps compiling. A new `L()` helper (object-shaped, any subset
of locales) is added for content that needs more than three languages — used
only by the `ccb` pilot in this pass. Every place that currently assumes
exactly `{en, zh-Hant, zh-Hans}` — the two Intl-tag branches in
`format.ts`, the two display-polish lookup maps, and the UI dictionary type —
gets widened to tolerate a locale it has no entry for, falling back to
English or to "no styling applied," per the design doc.

**Tech Stack:** Next.js (static export) + TypeScript (strict) + Vitest (node
environment) + `Intl.NumberFormat` / `Intl.DateTimeFormat`.

**Spec:** `docs/superpowers/specs/2026-09-03-french-punjabi-i18n-design.md`

## Global Constraints

- `Locale` becomes `"en" | "zh-Hant" | "zh-Hans" | "fr" | "pa"`. No other
  locale is added in this pass.
- `tri()` keeps its exact 3-argument signature — zero of the 1,042 existing
  call sites change.
- `src/i18n/dictionaries.ts` (UI chrome: nav, buttons, assessment flow) gets
  **no** fr/pa content this pass. It stays English for those two locales;
  `t()`'s existing per-key fallback to `EN_DICT` already covers the gap —
  this is a documented non-goal, not an oversight.
- Only benefit `ccb` (Canada Child Benefit) gets fr/pa content this pass. No
  other benefit, and no intake question, changes.
- No RTL support. No province-name-prefix data for fr/pa — `stripLevelPrefix`
  falls back to showing the full, untrimmed name for those two locales; this
  is documented as correct, not a bug.
- Dollar figures stay language-neutral: `fmt()` in `src/lib/figures.ts`
  always renders `$8,157` (en-CA digit grouping) regardless of locale — this
  is pre-existing behavior for zh-Hant/zh-Hans and is **not** changed for
  fr/pa. Do not write French-style `8 157 $` into any figure-derived copy;
  literal dollar amounts inside hand-written prose (e.g. `estimatedValue`)
  should match this same `$X,XXX` convention for consistency with the rest
  of the ccb entry.
- French `ccb` copy is adapted from CCA's own official French pages (fetched
  2026-09-03): the overview page
  (`https://www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants-apercu.html`),
  "Combien vous pourriez recevoir"
  (`.../allocation-canadienne-enfants/combien-recevoir.html`), "Comment faire
  une demande" (`.../allocation-canadienne-enfants/comment-demande.html`),
  and "Qui peut faire une demande"
  (`.../allocation-canadienne-enfants/qui-demande.html`). Official name:
  "Allocation canadienne pour enfants". Punjabi `ccb` copy has no official
  source and is AI-translated, matching the trust tier zh-Hant/zh-Hans
  content already carries.
- Verify command for the whole pass: `npm test && npx tsc --noEmit && npm run
  build` (from CLAUDE.md / the design doc's own Testing section).

---

## Task 1: Widen `Locale` / `LocalizedString`, add the `L()` helper

**Files:**
- Modify: `src/types/benefit.ts:16-25`
- Modify: `src/data/tri.ts`
- Test: `src/data/tri.test.ts` (new)

**Interfaces:**
- Produces: `Locale = "en" | "zh-Hant" | "zh-Hans" | "fr" | "pa"` (exported
  from `src/types/benefit.ts`, re-exported from `src/i18n/locale.ts` — no
  change needed there, it already does `export type { Locale };`).
- Produces: `LocalizedString = string | ({ en: string } &
  Partial<Record<Exclude<Locale, "en">, string>>)`.
- Produces: `L(strings: { en: string } & Partial<Record<Locale, string>>):
  LocalizedString` from `src/data/tri.ts`, alongside the existing `tri()`.
- Consumes: nothing from earlier tasks (this is the foundation task).

- [ ] **Step 1: Write the failing test**

Create `src/data/tri.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { L, tri } from "@/data/tri";
import { resolve } from "@/i18n/locale";

describe("tri", () => {
  it("still builds an en/zh-Hant/zh-Hans object", () => {
    const s = tri("Hello", "你好(繁)", "你好(简)");
    expect(resolve(s, "en")).toBe("Hello");
    expect(resolve(s, "zh-Hant")).toBe("你好(繁)");
    expect(resolve(s, "zh-Hans")).toBe("你好(简)");
  });

  it("falls back to English for fr/pa, which tri() never sets", () => {
    const s = tri("Hello", "你好(繁)", "你好(简)");
    expect(resolve(s, "fr")).toBe("Hello");
    expect(resolve(s, "pa")).toBe("Hello");
  });
});

describe("L", () => {
  it("carries a translation for every locale it is given", () => {
    const s = L({ en: "Hello", fr: "Bonjour", pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ" });
    expect(resolve(s, "en")).toBe("Hello");
    expect(resolve(s, "fr")).toBe("Bonjour");
    expect(resolve(s, "pa")).toBe("ਸਤ ਸ੍ਰੀ ਅਕਾਲ");
  });

  it("falls back to English when a locale is omitted", () => {
    const s = L({ en: "Hello", fr: "Bonjour" });
    expect(resolve(s, "pa")).toBe("Hello");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/tri.test.ts`
Expected: FAIL — `L` is not exported from `@/data/tri` (and `resolve(s,
"fr")` / `"pa"` are not yet valid `Locale` values, so this also fails to
type-check).

- [ ] **Step 3: Widen the types and add `L()`**

In `src/types/benefit.ts`, replace lines 16-25:

```ts
export type Locale = "en" | "zh-Hant" | "zh-Hans";

/** A string that may carry translations. Plain strings are treated as English. */
export type LocalizedString =
  | string
  | {
      en: string;
      "zh-Hant"?: string;
      "zh-Hans"?: string;
    };
```

with:

```ts
export type Locale = "en" | "zh-Hant" | "zh-Hans" | "fr" | "pa";

/** A string that may carry translations. Plain strings are treated as English. */
export type LocalizedString =
  | string
  | ({ en: string } & Partial<Record<Exclude<Locale, "en">, string>>);
```

In `src/data/tri.ts`, add `L()` alongside `tri()`:

```ts
import type { Locale, LocalizedString } from "@/types/benefit";

/** Terse constructor for a trilingual string. */
export function tri(en: string, hant: string, hans: string): LocalizedString {
  return { en, "zh-Hant": hant, "zh-Hans": hans };
}

/** Constructor for content needing more than three languages. */
export function L(
  strings: { en: string } & Partial<Record<Locale, string>>,
): LocalizedString {
  return strings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/tri.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Type-check the whole repo**

Run: `npx tsc --noEmit`
Expected: no errors. This is the real regression check for this task — it
confirms all 1,042 existing `tri()` call sites still satisfy the widened
`LocalizedString` type with zero changes.

- [ ] **Step 6: Commit**

```bash
git add src/types/benefit.ts src/data/tri.ts src/data/tri.test.ts
git commit -m "$(cat <<'EOF'
Widen Locale to include fr/pa and add L() for multi-locale content

tri() is untouched so all existing call sites keep compiling. L() is a new
helper for content needing more than three languages, used by the ccb pilot.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WSB7p85sMLhBr5PUwRFCQo
EOF
)"
```

---

## Task 2: Formatting layer supports fr/pa

**Files:**
- Modify: `src/lib/format.ts`
- Test: `src/lib/format.test.ts` (extend — add new `describe` blocks; the
  existing `stripLevelPrefix` tests and their hardcoded `["en", "zh-Hant",
  "zh-Hans"]` locale array are untouched)

**Interfaces:**
- Consumes: `Locale` from Task 1.
- Produces: no signature changes — `formatMoney`, `formatDate`,
  `formatEstimate`, `stripLevelPrefix` keep their existing signatures; only
  their internal locale-to-Intl-tag lookups and the two display-polish maps
  widen to tolerate fr/pa.

- [ ] **Step 1: Write the failing tests**

In `src/lib/format.test.ts`, change the import line from:

```ts
import { stripLevelPrefix } from "@/lib/format";
```

to:

```ts
import { formatDate, formatEstimate, formatMoney, stripLevelPrefix } from "@/lib/format";
```

Then append these new `describe` blocks at the end of the file (after the
existing `"stripLevelPrefix over the live registry"` block — do not modify
anything above them):

```ts
describe("formatMoney for fr and pa", () => {
  it("uses a real Intl locale tag, not the zh-Hant-HK fallback", () => {
    expect(formatMoney(1234, "fr")).toMatch(/1[\s ]234/);
    expect(formatMoney(1234, "pa")).toContain("1,234");
  });
});

describe("formatDate for fr", () => {
  it("renders French month names", () => {
    expect(formatDate("2026-09-03", "fr")).toContain("septembre");
  });
});

describe("formatEstimate for fr and pa", () => {
  it("renders the period and up-to labels in each language", () => {
    expect(formatEstimate({ low: 100, high: 100, period: "year" }, "fr")).toContain("/année");
    expect(formatEstimate({ low: 0, high: 100, period: "year" }, "fr")).toContain("jusqu'à");
    expect(formatEstimate({ low: 100, high: 100, period: "year" }, "pa")).toContain("/ਸਾਲ");
    expect(formatEstimate({ low: 0, high: 100, period: "year" }, "pa")).toContain("ਵੱਧ ਤੋਂ ਵੱਧ");
  });
});

describe("stripLevelPrefix for a locale with no prefix data yet", () => {
  it("returns the name unchanged for fr and pa (documented safe no-op)", () => {
    expect(stripLevelPrefix("Ontario Child Benefit", "provincial-on", "fr")).toBe(
      "Ontario Child Benefit",
    );
    expect(stripLevelPrefix("Ontario Child Benefit", "provincial-on", "pa")).toBe(
      "Ontario Child Benefit",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL to even run — `formatDate`, `formatEstimate`, `formatMoney`
are not exported as named imports yet from a test-file perspective this
compiles fine (they already are exported), but `"fr"`/`"pa"` are not valid
`Locale` values yet in this file's context if Task 1 were not already
merged. Since Task 1 lands first, the actual failure here is assertion
failures: `formatMoney(1234, "fr")` currently uses the `zh-Hant-HK` tag
(wrong grouping), `formatDate(..., "fr")` renders in `zh-Hant`, and the
`PERIOD_LABEL`/`UP_TO` lookups throw or return `undefined` for a `fr`/`pa`
key that does not exist on those `Record<Locale, string>` objects.

- [ ] **Step 3: Implement**

In `src/lib/format.ts`, replace the `formatMoney` function (lines 7-14):

```ts
export function formatMoney(amount: number, locale: Locale): string {
  const loc = locale === "en" ? "en-CA" : "zh-Hant-HK";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}
```

with:

```ts
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
```

Replace `PERIOD_LABEL` and `UP_TO` (lines 16-33):

```ts
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
```

with:

```ts
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
```

Replace `formatDate` (lines 72-81):

```ts
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
```

with:

```ts
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
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
```

Widen `LEVEL_NAME_PREFIXES`'s type (lines 101-103) — data below it is
unchanged:

```ts
const LEVEL_NAME_PREFIXES: Partial<
  Record<BenefitLevel, Record<Locale, string[]>>
> = {
```

becomes:

```ts
const LEVEL_NAME_PREFIXES: Partial<
  Record<BenefitLevel, Partial<Record<Locale, string[]>>>
> = {
```

Widen `MIN_REMAINDER` (line 158) and its one call site (line 176):

```ts
const MIN_REMAINDER: Record<Locale, number> = { en: 6, "zh-Hant": 2, "zh-Hans": 2 };
```

becomes:

```ts
const MIN_REMAINDER: Partial<Record<Locale, number>> = { en: 6, "zh-Hant": 2, "zh-Hans": 2 };
```

and:

```ts
    if (rest.length >= MIN_REMAINDER[locale]) return rest;
```

becomes:

```ts
    if (rest.length >= (MIN_REMAINDER[locale] ?? 6)) return rest;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS — all existing tests plus the new ones (11 `describe`
blocks total).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "$(cat <<'EOF'
Support fr/pa in money/date formatting and display-polish maps

Replace the binary en-vs-everything-else Intl locale branch in formatMoney
and formatDate with a per-locale lookup, add real fr-CA/pa Intl tags, and
add fr/pa period and up-to labels. Widen the two display-polish maps
(LEVEL_NAME_PREFIXES, MIN_REMAINDER) to tolerate a locale with no entry,
falling back to no-op / 6 as already documented.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WSB7p85sMLhBr5PUwRFCQo
EOF
)"
```

---

## Task 3: UI chrome dictionary type widens (no fr/pa content added)

**Files:**
- Modify: `src/i18n/dictionaries.ts:531`

**Interfaces:**
- Consumes: `Locale` from Task 1.
- Produces: `DICTIONARIES: Partial<Record<Locale, Loose<Dict>>>` — same
  runtime object (still only `en`, `zh-Hant`, `zh-Hans` keys), wider type.
  `LocaleProvider.tsx`'s `t()` needs no change: `lookup(DICTIONARIES[locale],
  path)` already passes into a function typed `(dict: unknown, ...)`, and
  `lookup` already returns `undefined` for a missing/undefined `dict`
  without throwing, so a `fr`/`pa` lookup already falls through to the
  `EN_DICT` fallback one line below.

This is a type-only change with no new runtime behavior, so there is no new
test to write — the check is that the repo still type-checks, which is
exactly the ripple effect the design doc calls out (widening `Locale`
without this change would force `DICTIONARIES` to require full fr/pa
dictionaries just to satisfy `Record<Locale, Loose<Dict>>`).

- [ ] **Step 1: Confirm the current failure**

Run: `npx tsc --noEmit`
Expected (before this task, with Task 1 already merged): a type error on
`src/i18n/dictionaries.ts:531` — `Property 'fr' is missing in type '{ en:
...; "zh-Hant": ...; "zh-Hans": ...; }' but required in type 'Record<Locale,
Loose<Dict>>'` (or the `pa` equivalent).

- [ ] **Step 2: Widen the type**

Change:

```ts
export const DICTIONARIES: Record<Locale, Loose<Dict>> = {
  en,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};
```

to:

```ts
export const DICTIONARIES: Partial<Record<Locale, Loose<Dict>>> = {
  en,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};
```

- [ ] **Step 3: Verify the type-check passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run the full test suite as a smoke check**

Run: `npm test`
Expected: PASS — this file's runtime object did not change, only its type,
so nothing that touches `t()` or `DICTIONARIES` should behave differently.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/dictionaries.ts
git commit -m "$(cat <<'EOF'
Widen DICTIONARIES type to Partial so fr/pa don't need full UI dictionaries

fr and pa are display languages for benefit content only this pass — UI
chrome stays English via t()'s existing per-key EN_DICT fallback. Without
this, widening Locale would force full fr/pa dictionaries into this pass
just to type-check.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WSB7p85sMLhBr5PUwRFCQo
EOF
)"
```

---

## Task 4: Language switcher offers French and Punjabi

**Files:**
- Modify: `src/i18n/locale.ts`
- Test: `src/i18n/locale.test.ts` (new)

**Interfaces:**
- Consumes: `Locale` from Task 1.
- Produces: `LOCALES` now includes `"fr"` and `"pa"`; `LOCALE_LABELS`,
  `LOCALE_SHORT`, `LOCALE_HTML_LANG` have entries for both.
- `src/components/LanguageSwitcher.tsx` needs **no code change** — it
  already does `{LOCALES.map((l) => ...)}`, so adding to `LOCALES` is what
  makes the two new buttons appear. (The design doc's section 5 discusses
  `LOCALE_LABELS`/`LOCALE_SHORT`/`LOCALE_HTML_LANG` explicitly but the
  switcher only renders locales that are in `LOCALES` — that array must
  widen too, or fr/pa become selectable nowhere in the UI despite having
  labels.)

- [ ] **Step 1: Write the failing test**

Create `src/i18n/locale.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, LOCALE_HTML_LANG } from "@/i18n/locale";

describe("locale metadata", () => {
  it("includes French and Punjabi in the switchable locale list", () => {
    expect(LOCALES).toContain("fr");
    expect(LOCALES).toContain("pa");
  });

  it("has a label, short code, and html-lang tag for every locale", () => {
    for (const locale of LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
      expect(LOCALE_SHORT[locale]).toBeTruthy();
      expect(LOCALE_HTML_LANG[locale]).toBeTruthy();
    }
  });

  it("labels French and Punjabi correctly", () => {
    expect(LOCALE_LABELS.fr).toBe("Français");
    expect(LOCALE_SHORT.fr).toBe("FR");
    expect(LOCALE_HTML_LANG.fr).toBe("fr-CA");
    expect(LOCALE_LABELS.pa).toBe("ਪੰਜਾਬੀ");
    expect(LOCALE_SHORT.pa).toBe("ਪੰ");
    expect(LOCALE_HTML_LANG.pa).toBe("pa");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n/locale.test.ts`
Expected: FAIL — `LOCALES` does not contain `"fr"`/`"pa"` yet, and
`LOCALE_LABELS`/`LOCALE_SHORT`/`LOCALE_HTML_LANG` have no entries for them
(also a `tsc` error once strict-checked, since these are typed
`Record<Locale, string>` and are now missing required keys).

- [ ] **Step 3: Implement**

In `src/i18n/locale.ts`, change:

```ts
export const LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans"];
```

to:

```ts
export const LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans", "fr", "pa"];
```

Change:

```ts
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
};
```

to:

```ts
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
  fr: "Français",
  pa: "ਪੰਜਾਬੀ",
};
```

Change:

```ts
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁",
  "zh-Hans": "简",
};
```

to:

```ts
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁",
  "zh-Hans": "简",
  fr: "FR",
  pa: "ਪੰ",
};
```

Change:

```ts
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en-CA",
  "zh-Hant": "zh-Hant",
  "zh-Hans": "zh-Hans",
};
```

to:

```ts
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en-CA",
  "zh-Hant": "zh-Hant",
  "zh-Hans": "zh-Hans",
  fr: "fr-CA",
  pa: "pa",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/i18n/locale.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locale.ts src/i18n/locale.test.ts
git commit -m "$(cat <<'EOF'
Add French and Punjabi to the language switcher

LanguageSwitcher.tsx needs no change — it already renders one button per
entry in LOCALES.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WSB7p85sMLhBr5PUwRFCQo
EOF
)"
```

---

## Task 5: Pilot content — Canada Child Benefit (fr + pa)

**Files:**
- Modify: `src/data/benefits/federal-family-tax.ts:119-211` (the `ccb`
  object only — leave `ccbEstimate`'s dynamic `note` at lines 111-116 as a
  `tri()` call, untouched; it is not part of the design doc's itemized
  pilot-content list)
- Modify: `src/data/deep-content.ts:93-128` (the `ccb` entry in `DEEP`)
- Test: `src/data/benefits/federal-family-tax.test.ts` (new)

**Interfaces:**
- Consumes: `L()` from Task 1.
- Produces: nothing new — `ccb: Benefit` and `DEEP.ccb: DeepContent` keep
  their existing shapes; only the `LocalizedString` values inside them
  change from `tri(...)` to `L({...})`.

- [ ] **Step 1: Write the failing test**

Create `src/data/benefits/federal-family-tax.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getBenefit } from "@/data/benefits";
import { DEEP } from "@/data/deep-content";
import { resolve } from "@/i18n/locale";

describe("ccb pilot: French and Punjabi content", () => {
  const ccb = getBenefit("ccb")!;

  it("has the official French name and a distinct Punjabi name", () => {
    expect(resolve(ccb.name, "fr")).toBe("Allocation canadienne pour enfants");
    expect(resolve(ccb.name, "pa")).not.toBe(resolve(ccb.name, "en"));
  });

  it("translates description and estimated value", () => {
    expect(resolve(ccb.description, "fr")).not.toBe(resolve(ccb.description, "en"));
    expect(resolve(ccb.description, "pa")).not.toBe(resolve(ccb.description, "en"));
    expect(resolve(ccb.estimatedValue, "fr")).not.toBe(resolve(ccb.estimatedValue, "en"));
    expect(resolve(ccb.estimatedValue, "pa")).not.toBe(resolve(ccb.estimatedValue, "en"));
  });

  it("translates every application step, its tips, and required documents", () => {
    for (const step of ccb.applicationSteps) {
      expect(resolve(step.title, "fr")).not.toBe(resolve(step.title, "en"));
      expect(resolve(step.title, "pa")).not.toBe(resolve(step.title, "en"));
      expect(resolve(step.description, "fr")).not.toBe(resolve(step.description, "en"));
      expect(resolve(step.description, "pa")).not.toBe(resolve(step.description, "en"));
      for (const tip of step.tips ?? []) {
        expect(resolve(tip, "fr")).not.toBe(resolve(tip, "en"));
        expect(resolve(tip, "pa")).not.toBe(resolve(tip, "en"));
      }
    }
    for (const doc of ccb.requiredDocuments) {
      expect(resolve(doc, "fr")).not.toBe(resolve(doc, "en"));
      expect(resolve(doc, "pa")).not.toBe(resolve(doc, "en"));
    }
  });

  it("translates processing time and payment frequency", () => {
    expect(resolve(ccb.processingTime, "fr")).not.toBe(resolve(ccb.processingTime, "en"));
    expect(resolve(ccb.paymentFrequency, "pa")).not.toBe(resolve(ccb.paymentFrequency, "en"));
  });

  it("translates the deep-content eligibility details and good-to-know items", () => {
    const deep = DEEP.ccb;
    for (const item of deep.eligibilityDetails ?? []) {
      expect(resolve(item, "fr")).not.toBe(resolve(item, "en"));
      expect(resolve(item, "pa")).not.toBe(resolve(item, "en"));
    }
    for (const item of deep.goodToKnow ?? []) {
      expect(resolve(item, "fr")).not.toBe(resolve(item, "en"));
      expect(resolve(item, "pa")).not.toBe(resolve(item, "en"));
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/benefits/federal-family-tax.test.ts`
Expected: FAIL — every `resolve(..., "fr")` / `resolve(..., "pa")` currently
equals the English fallback, since `ccb` and `DEEP.ccb` are still built with
`tri()` (en/zh-Hant/zh-Hans only).

- [ ] **Step 3: Translate `ccb` in `federal-family-tax.ts`**

In `src/data/benefits/federal-family-tax.ts`, add `L` to the import:

```ts
import { L, tri } from "@/data/tri";
```

Replace the `ccb` object's `tri(...)` calls (lines 122-135, 141-162,
168-196, 198-201, 206-207) with `L({...})` calls carrying the same
zh-Hant/zh-Hans text plus new fr/pa translations, leaving everything else
in the object (ids, `check`, `estimateAmount`, urls, `tags`,
`relatedBenefits`, `lastUpdated`, `figures`, and the `ccbEstimate` function
including its `note: tri(...)`) exactly as-is:

```ts
export const ccb: Benefit = {
  id: "ccb",
  figures: CCB_FIGURES,
  name: L({
    en: "Canada Child Benefit",
    "zh-Hant": "加拿大兒童福利",
    "zh-Hans": "加拿大儿童福利",
    fr: "Allocation canadienne pour enfants",
    pa: "ਕੈਨੇਡਾ ਬਾਲ ਭੱਤਾ",
  }),
  shortName: "CCB",
  category: "family",
  level: "federal",
  description: L({
    en: "A tax-free monthly payment to help families with the cost of raising children under 18. Lower-income families receive more. Children with a disability can get an extra amount.",
    "zh-Hant": "免稅的每月款項，協助家庭負擔養育 18 歲以下子女的開支。低收入家庭獲得較多。有殘障的子女可獲額外款項。",
    "zh-Hans": "免税的每月款项，帮助家庭负担养育 18 岁以下子女的开支。低收入家庭获得较多。有残障的子女可获额外款项。",
    fr: "Un montant mensuel non imposable pour aider les familles à subvenir aux besoins de leurs enfants de moins de 18 ans. Les familles à faible revenu reçoivent davantage. Un enfant handicapé peut donner droit à un montant supplémentaire.",
    pa: "18 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਦੇ ਬੱਚਿਆਂ ਦੀ ਪਰਵਰਿਸ਼ ਦੇ ਖਰਚੇ ਵਿੱਚ ਮਦਦ ਲਈ ਇੱਕ ਟੈਕਸ-ਮੁਕਤ ਮਹੀਨਾਵਾਰ ਭੁਗਤਾਨ। ਘੱਟ ਆਮਦਨ ਵਾਲੇ ਪਰਿਵਾਰਾਂ ਨੂੰ ਵੱਧ ਰਕਮ ਮਿਲਦੀ ਹੈ। ਅਪਾਹਜਤਾ ਵਾਲੇ ਬੱਚਿਆਂ ਲਈ ਵਾਧੂ ਰਕਮ ਮਿਲ ਸਕਦੀ ਹੈ।",
  }),
  estimatedValue: L({
    en: "Up to $8,157/year per child under 6, $6,883/year per child 6-17",
    "zh-Hant": "每名 6 歲以下子女最多每年 $8,157，6-17 歲每年 $6,883",
    "zh-Hans": "每名 6 岁以下子女最多每年 $8,157，6-17 岁每年 $6,883",
    fr: "Jusqu'à $8,157/année par enfant de moins de 6 ans, $6,883/année par enfant de 6 à 17 ans",
    pa: "6 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਦੇ ਹਰ ਬੱਚੇ ਲਈ ਵੱਧ ਤੋਂ ਵੱਧ $8,157/ਸਾਲ, 6-17 ਸਾਲ ਦੇ ਬੱਚੇ ਲਈ $6,883/ਸਾਲ",
  }),
  contextFields: ["hasChildren", "numberOfChildren", "childrenUnder6", "youngestChildAge", "familyIncome", "filedTaxes"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: L({
        en: "You have children under 18 in your care.",
        "zh-Hant": "你有 18 歲以下的子女受你照顧。",
        "zh-Hans": "你有 18 岁以下的子女受你照顾。",
        fr: "Vous avez des enfants de moins de 18 ans à votre charge.",
        pa: "ਤੁਹਾਡੀ ਦੇਖਭਾਲ ਵਿੱਚ 18 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਦੇ ਬੱਚੇ ਹਨ।",
      }),
      failReason: L({
        en: "The Canada Child Benefit is for people caring for a child under 18.",
        "zh-Hant": "加拿大兒童福利適用於照顧 18 歲以下子女的人士。",
        "zh-Hans": "加拿大儿童福利适用于照顾 18 岁以下子女的人士。",
        fr: "L'Allocation canadienne pour enfants est destinée aux personnes qui s'occupent d'un enfant de moins de 18 ans.",
        pa: "ਕੈਨੇਡਾ ਬਾਲ ਭੱਤਾ ਉਹਨਾਂ ਲੋਕਾਂ ਲਈ ਹੈ ਜੋ 18 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਦੇ ਬੱਚੇ ਦੀ ਦੇਖਭਾਲ ਕਰਦੇ ਹਨ।",
      }),
      missingField: "hasChildren",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: false,
      passReason: L({
        en: "You file taxes, which is how the benefit is calculated.",
        "zh-Hant": "你有報稅，這是計算福利的方式。",
        "zh-Hans": "你有报税，这是计算福利的方式。",
        fr: "Vous produisez une déclaration de revenus, ce qui permet de calculer le montant de l'allocation.",
        pa: "ਤੁਸੀਂ ਟੈਕਸ ਭਰਦੇ ਹੋ, ਜਿਸ ਦੇ ਆਧਾਰ 'ਤੇ ਭੱਤੇ ਦੀ ਗਣਨਾ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।",
      }),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: (ctx) => ccbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: L({
        en: "Register the birth or apply online",
        "zh-Hant": "登記出生或網上申請",
        "zh-Hans": "登记出生或网上申请",
        fr: "Enregistrez la naissance ou faites une demande en ligne",
        pa: "ਜਨਮ ਦਰਜ ਕਰੋ ਜਾਂ ਆਨਲਾਈਨ ਅਰਜ਼ੀ ਦਿਓ",
      }),
      description: L({
        en: "For a newborn, you can apply through the provincial birth registration. Otherwise apply through CRA My Account or Form RC66.",
        "zh-Hant": "新生兒可透過省級出生登記申請；其他情況可透過 CRA My Account 或 RC66 表格申請。",
        "zh-Hans": "新生儿可通过省级出生登记申请；其他情况可通过 CRA My Account 或 RC66 表格申请。",
        fr: "Pour un nouveau-né, vous pouvez faire la demande lors de l'enregistrement de la naissance auprès de la province. Sinon, faites la demande dans Mon dossier de l'ARC ou avec le formulaire RC66.",
        pa: "ਨਵਜੰਮੇ ਬੱਚੇ ਲਈ, ਤੁਸੀਂ ਸੂਬਾਈ ਜਨਮ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਰਾਹੀਂ ਅਰਜ਼ੀ ਦੇ ਸਕਦੇ ਹੋ। ਨਹੀਂ ਤਾਂ, CRA My Account ਜਾਂ ਫਾਰਮ RC66 ਰਾਹੀਂ ਅਰਜ਼ੀ ਦਿਓ।",
      }),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview/canada-child-benefit-apply.html",
    },
    {
      order: 2,
      title: L({
        en: "File taxes every year",
        "zh-Hant": "每年報稅",
        "zh-Hans": "每年报税",
        fr: "Produisez une déclaration de revenus chaque année",
        pa: "ਹਰ ਸਾਲ ਟੈਕਸ ਭਰੋ",
      }),
      description: L({
        en: "Both parents must file taxes each year, even with no income, so the CRA can keep paying the benefit.",
        "zh-Hant": "父母雙方每年都必須報稅（即使沒有收入），稅務局才能持續發放福利。",
        "zh-Hans": "父母双方每年都必须报税（即使没有收入），税务局才能持续发放福利。",
        fr: "Les deux parents doivent produire une déclaration de revenus chaque année, même sans revenu, pour que l'ARC puisse continuer à verser l'allocation.",
        pa: "ਦੋਵਾਂ ਮਾਪਿਆਂ ਨੂੰ ਹਰ ਸਾਲ ਟੈਕਸ ਭਰਨਾ ਜ਼ਰੂਰੀ ਹੈ, ਭਾਵੇਂ ਆਮਦਨ ਨਾ ਵੀ ਹੋਵੇ, ਤਾਂ ਜੋ CRA ਭੱਤਾ ਦੇਣਾ ਜਾਰੀ ਰੱਖ ਸਕੇ।",
      }),
      tips: [
        L({
          en: "If your child is approved for the Disability Tax Credit, you also get the Child Disability Benefit automatically.",
          "zh-Hant": "如子女獲批殘疾稅務抵免，你亦會自動獲得兒童殘障福利。",
          "zh-Hans": "如子女获批残疾税务抵免，你亦会自动获得儿童残障福利。",
          fr: "Si votre enfant est approuvé pour le crédit d'impôt pour personnes handicapées, vous recevez aussi automatiquement la prestation pour enfants handicapés.",
          pa: "ਜੇ ਤੁਹਾਡੇ ਬੱਚੇ ਨੂੰ ਡਿਸਏਬਿਲਿਟੀ ਟੈਕਸ ਕ੍ਰੈਡਿਟ ਲਈ ਮਨਜ਼ੂਰੀ ਮਿਲਦੀ ਹੈ, ਤਾਂ ਤੁਹਾਨੂੰ ਆਪਣੇ ਆਪ ਚਾਈਲਡ ਡਿਸਏਬਿਲਿਟੀ ਬੈਨੀਫ਼ਿਟ ਵੀ ਮਿਲ ਜਾਂਦਾ ਹੈ।",
        }),
      ],
    },
  ],
  requiredDocuments: [
    L({
      en: "Social Insurance Number",
      "zh-Hant": "社會保險號碼",
      "zh-Hans": "社会保险号码",
      fr: "Numéro d'assurance sociale",
      pa: "ਸੋਸ਼ਲ ਇੰਸ਼ੋਰੈਂਸ ਨੰਬਰ",
    }),
    L({
      en: "Proof of birth (if asked)",
      "zh-Hant": "出生證明（如需要）",
      "zh-Hans": "出生证明（如需要）",
      fr: "Preuve de naissance (si demandée)",
      pa: "ਜਨਮ ਦਾ ਸਬੂਤ (ਜੇ ਮੰਗਿਆ ਜਾਵੇ)",
    }),
  ],
  applicationUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview/canada-child-benefit-apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html",
  processingTime: L({
    en: "Usually 8 weeks",
    "zh-Hant": "通常 8 星期",
    "zh-Hans": "通常 8 星期",
    fr: "Habituellement 8 semaines",
    pa: "ਆਮ ਤੌਰ 'ਤੇ 8 ਹਫ਼ਤੇ",
  }),
  paymentFrequency: L({
    en: "Monthly",
    "zh-Hant": "每月",
    "zh-Hans": "每月",
    fr: "Mensuel",
    pa: "ਮਹੀਨਾਵਾਰ",
  }),
  tags: ["family", "children", "low-income", "disability"],
  relatedBenefits: ["bc-family-benefit", "cgeb", "dtc"],
  lastUpdated: "2026-09-01",
};
```

Note: `ccbEstimate`'s `note: tri(...)` field (the dynamic "Calculated from
your family income…" string, lines 111-116) is **not** touched — it is not
in the design doc's itemized pilot-content list, and stays a 3-locale
`tri()` call like every other benefit's dynamic estimate note.

- [ ] **Step 4: Translate the `ccb` entry in `deep-content.ts`**

Add `L` to the import in `src/data/deep-content.ts`:

```ts
import { L, tri } from "@/data/tri";
```

Replace the `ccb` entry (lines 93-128) with:

```ts
  ccb: {
    eligibilityDetails: [
      L({
        en: "You must live with a child under 18 and be primarily responsible for their care.",
        "zh-Hant": "你須與 18 歲以下子女同住，並主要負責照顧。",
        "zh-Hans": "你须与 18 岁以下子女同住，并主要负责照顾。",
        fr: "Vous devez habiter avec un enfant de moins de 18 ans et être la personne principalement responsable de ses soins.",
        pa: "ਤੁਹਾਨੂੰ 18 ਸਾਲ ਤੋਂ ਘੱਟ ਉਮਰ ਦੇ ਬੱਚੇ ਨਾਲ ਰਹਿਣਾ ਚਾਹੀਦਾ ਹੈ ਅਤੇ ਉਸਦੀ ਦੇਖਭਾਲ ਲਈ ਮੁੱਖ ਤੌਰ 'ਤੇ ਜ਼ਿੰਮੇਵਾਰ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।",
      }),
      L({
        en: "You must be a resident of Canada for tax purposes; at least one parent must meet a status requirement (citizen, PR, protected person, or certain temporary residents).",
        "zh-Hant": "你須為加拿大稅務居民；至少一名家長須符合身份要求（公民、永久居民、受保護人士或某些臨時居民）。",
        "zh-Hans": "你须为加拿大税务居民；至少一名家长须符合身份要求（公民、永久居民、受保护人士或某些临时居民）。",
        fr: "Vous devez être résident du Canada aux fins de l'impôt; au moins un parent doit répondre à une exigence de statut (citoyen, résident permanent, personne protégée ou certains résidents temporaires).",
        pa: "ਤੁਹਾਨੂੰ ਟੈਕਸ ਦੇ ਮੰਤਵ ਲਈ ਕੈਨੇਡਾ ਦਾ ਨਿਵਾਸੀ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ; ਘੱਟੋ-ਘੱਟ ਇੱਕ ਮਾਪੇ ਨੂੰ ਸਟੇਟਸ ਦੀ ਸ਼ਰਤ ਪੂਰੀ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ (ਨਾਗਰਿਕ, ਪੀ.ਆਰ., ਸੁਰੱਖਿਅਤ ਵਿਅਕਤੀ, ਜਾਂ ਕੁਝ ਅਸਥਾਈ ਨਿਵਾਸੀ)।",
      }),
      L({
        en: "The amount is based on adjusted family net income, number of children, and their ages.",
        "zh-Hant": "金額按經調整家庭淨收入、子女數目及年齡計算。",
        "zh-Hans": "金额按经调整家庭净收入、子女数目及年龄计算。",
        fr: "Le montant est calculé selon le revenu net rajusté de la famille, le nombre d'enfants et leur âge.",
        pa: "ਰਕਮ ਪਰਿਵਾਰ ਦੀ ਸੋਧੀ ਹੋਈ ਸ਼ੁੱਧ ਆਮਦਨ, ਬੱਚਿਆਂ ਦੀ ਗਿਣਤੀ ਅਤੇ ਉਹਨਾਂ ਦੀ ਉਮਰ 'ਤੇ ਆਧਾਰਿਤ ਹੁੰਦੀ ਹੈ।",
      }),
    ],
    goodToKnow: [
      L({
        en: "If your child is approved for the Disability Tax Credit, the Child Disability Benefit (up to about $3,400/year) is added automatically.",
        "zh-Hant": "如子女獲批殘疾稅務抵免，兒童殘障福利（最多約每年 $3,400）會自動加入。",
        "zh-Hans": "如子女获批残疾税务抵免，儿童残障福利（最多约每年 $3,400）会自动加入。",
        fr: "Si votre enfant est approuvé pour le crédit d'impôt pour personnes handicapées, la prestation pour enfants handicapés (jusqu'à environ $3,400/année) s'ajoute automatiquement.",
        pa: "ਜੇ ਤੁਹਾਡੇ ਬੱਚੇ ਨੂੰ ਡਿਸਏਬਿਲਿਟੀ ਟੈਕਸ ਕ੍ਰੈਡਿਟ ਲਈ ਮਨਜ਼ੂਰੀ ਮਿਲਦੀ ਹੈ, ਤਾਂ ਚਾਈਲਡ ਡਿਸਏਬਿਲਿਟੀ ਬੈਨੀਫ਼ਿਟ (ਲਗਭਗ $3,400/ਸਾਲ ਤੱਕ) ਆਪਣੇ ਆਪ ਜੁੜ ਜਾਂਦਾ ਹੈ।",
      }),
      L({
        en: "Both parents must file taxes every year — even with no income — or payments can stop.",
        "zh-Hant": "父母雙方每年都必須報稅（即使沒有收入），否則款項可能停止。",
        "zh-Hans": "父母双方每年都必须报税（即使没有收入），否则款项可能停止。",
        fr: "Les deux parents doivent produire une déclaration de revenus chaque année — même sans revenu — sinon les paiements peuvent cesser.",
        pa: "ਦੋਵਾਂ ਮਾਪਿਆਂ ਨੂੰ ਹਰ ਸਾਲ ਟੈਕਸ ਭਰਨਾ ਜ਼ਰੂਰੀ ਹੈ — ਭਾਵੇਂ ਆਮਦਨ ਨਾ ਵੀ ਹੋਵੇ — ਨਹੀਂ ਤਾਂ ਭੁਗਤਾਨ ਰੁਕ ਸਕਦੇ ਹਨ।",
      }),
      L({
        en: "In shared custody, each parent can receive 50% of the amount.",
        "zh-Hant": "共同撫養下，每名家長可獲一半金額。",
        "zh-Hans": "共同抚养下，每名家长可获一半金额。",
        fr: "En cas de garde partagée, chaque parent peut recevoir 50 % du montant.",
        pa: "ਸਾਂਝੀ ਕਸਟਡੀ ਵਿੱਚ, ਹਰੇਕ ਮਾਪੇ ਨੂੰ ਰਕਮ ਦਾ 50% ਮਿਲ ਸਕਦਾ ਹੈ।",
      }),
    ],
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/benefits/federal-family-tax.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Run the full data test suite**

Run: `npx vitest run src/data/benefits.test.ts src/lib/figures.test.ts`
Expected: PASS — confirms `ccb`'s `figures` and `check` logic (untouched)
still validate, and `SITE.benefitCount` is unaffected (no benefit added or
removed).

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/data/benefits/federal-family-tax.ts src/data/deep-content.ts src/data/benefits/federal-family-tax.test.ts
git commit -m "$(cat <<'EOF'
Translate the Canada Child Benefit pilot into French and Punjabi

French copy is adapted from CCB's official French canada.ca pages
(overview, "combien-recevoir", "comment-demande", "qui-demande", fetched
2026-09-03). Punjabi has no official source and is AI-translated, the same
trust tier zh-Hant/zh-Hans content already carries. Proves the L() pattern
end-to-end on one benefit before the remaining ~74-benefit backlog.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WSB7p85sMLhBr5PUwRFCQo
EOF
)"
```

---

## Task 6: Full verification

No code changes — this task is the pass-wide acceptance gate from the design
doc's Testing section, run after Tasks 1-5 are all committed.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — every existing test (including `src/lib/format.test.ts`'s
hardcoded `["en", "zh-Hant", "zh-Hans"]` assertions, unmodified) plus the
four new test files from Tasks 1, 2, 4, and 5.

- [ ] **Step 2: Type-check the whole repo**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build the static export**

Run: `npm run build`
Expected: succeeds. This confirms `/benefits/[id]`'s `generateStaticParams`,
`sitemap.ts`, and `opengraph-image.tsx` — none of which key off `Locale` —
are unaffected, and that the widened types don't break the production
build (locale switching is client-side only via `LocaleProvider` +
`localStorage`; there is no per-locale route to statically generate).

- [ ] **Step 4: Manual smoke check (optional but recommended)**

Run: `npm run dev`, open `http://localhost:3000/benefits/ccb`, and click
through the language switcher's new "FR" and "ਪੰ" buttons. Confirm the
benefit name, description, application steps, and deep-content sections
switch to the French/Punjabi copy written in Task 5, and that every other
benefit page still falls back to English under FR/ਪੰ (since only `ccb` has
content — this is the documented, correct behavior for this pass).
