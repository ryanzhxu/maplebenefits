# French + Punjabi Support — Design

Status: approved 2026-09-03.

## Problem

MapleBenefits supports English, Traditional Chinese, and Simplified Chinese
today. `LocalizedString` is a fixed three-key object shape and `tri(en, hant,
hans)` is a positional three-argument helper used 1,042 times across 18 region
files plus 209 more times in `deep-content.ts`. Neither scales past three
languages: widening `tri()`'s own signature would touch every existing call
site, and a fixed object shape means every new language edits the type by
hand instead of the type following `Locale`.

Two languages are being added first: **French** (Canada's other official
language — federal and most provincial benefit pages already publish an
official French version, so copy can be sourced and verbatim-quoted the same
way dollar figures already are) and **Punjabi** (large and growing population
share in Canada, no official-source parallel text available for most program
pages, so content is AI-translated — the same tier of trust the existing
zh-Hant/zh-Hans content already carries).

Scope for this pass: architecture plus one pilot benefit (Canada Child
Benefit, `ccb`), translated end-to-end, as a proof of the pattern. Not the
full ~1,250-string content backlog across all 75 benefits — that is separate,
follow-on content work per language, once the pattern is proven.

## Non-goals for this pass

- Translating `src/i18n/dictionaries.ts` (UI chrome — nav, buttons, assessment
  flow). It stays English for fr/pa; `t()` already falls back per-key to
  `EN_DICT`, so nothing breaks, it just isn't translated yet.
- Any benefit besides `ccb`.
- RTL support — not needed for French or Punjabi.
- Province-name-prefix stripping (`stripLevelPrefix`) for the two new locales
  — falls back to showing the full name, which is correct, just not trimmed.
- A new intake question. None is needed; fr/pa are display languages only,
  they don't add eligibility logic.

## Design

### 1. Types & authoring (`src/types/benefit.ts`, `src/data/tri.ts`)

`Locale` widens to `"en" | "zh-Hant" | "zh-Hans" | "fr" | "pa"`.
`LocalizedString` changes from a hand-written fixed shape to one derived from
`Locale`:

```ts
export type LocalizedString =
  | string
  | ({ en: string } & Partial<Record<Exclude<Locale, "en">, string>>);
```

A future language then only touches the `Locale` union — this type follows
automatically. `tri()` is untouched, so all 1,042 existing call sites keep
compiling with zero risk. A new helper is added alongside it for content that
needs more than three languages:

```ts
export function L(
  strings: { en: string } & Partial<Record<Locale, string>>,
): LocalizedString {
  return strings;
}
```

Used only for the `ccb` pilot content in this pass.

### 2. Formatting layer (`src/lib/format.ts`)

`formatMoney` and `formatDate` currently branch `locale === "en" ? "en-CA" :
"zh-Hant-HK"` — a binary, not a lookup, so it silently mis-tags any locale
that isn't `"en"`. Replaced with a `Record<Locale, string>` map: `fr` →
`fr-CA` (real French-Canadian number formatting, e.g. `1 234 $`), `pa` →
`pa`. `zh-Hans` keeps its existing `zh-Hant-HK` tag — a pre-existing quirk,
not touched here.

`PERIOD_LABEL` (`/year`, `/month`, `one-time`) and `UP_TO` (`up to `) gain
real fr/pa translations — every benefit card needs these regardless of pilot
scope, and the set is small enough to do properly rather than fall back.

### 3. Display-polish maps (`src/lib/format.ts`)

`LEVEL_NAME_PREFIXES`'s inner map becomes `Partial<Record<Locale, string[]>>`
(consumed via `?.[locale] ?? []` already, so a missing fr/pa entry is a safe
no-op — the province prefix just isn't hidden yet for those locales).
`MIN_REMAINDER` gains a `?? 6` fallback for the same reason. No new
province-name translations required.

### 4. UI chrome dictionary (`src/i18n/dictionaries.ts`)

`DICTIONARIES` changes from `Record<Locale, Loose<Dict>>` to `Partial<Record<Locale,
Loose<Dict>>>` — otherwise TypeScript would require full fr/pa dictionaries to
exist just to type-check, forcing the UI-chrome translation into this pass.
No fr/pa dictionary content is added. `t()`'s existing fallback (look up the
active locale, fall back to `EN_DICT` per key) already handles the gap.

### 5. Language switcher (`src/i18n/locale.ts`, `src/components/LanguageSwitcher.tsx`)

`LOCALE_LABELS`, `LOCALE_SHORT`, and `LOCALE_HTML_LANG` gain entries: French
("Français" / "FR" / "fr-CA"), Punjabi ("ਪੰਜਾਬੀ" / "ਪੰ" / "pa"). The existing
segmented-button row layout is kept as-is — five short codes still fit;
revisit only if a sixth language is added later.

### 6. Pilot content: Canada Child Benefit (`ccb`)

`src/data/benefits/federal-family-tax.ts` (~13 strings: name, description,
estimated value, 2 eligibility reasons, 2 application steps + 1 tip, 2
required documents, processing time, payment frequency) and its
`src/data/deep-content.ts` entry (6 strings: 3 eligibility details, 3
good-to-know items) — 19 English strings total, translated into fr and pa via
`L()`. French copy is sourced from CCB's own official French canada.ca page
(fetched via `scripts/crawl/fetch.ts` per the repo's normal sourcing
discipline). Punjabi has no official source and is AI-translated.

### Testing

`npm test && npx tsc --noEmit && npm run build` (the repo's own verify
command) after the change. `src/lib/format.test.ts` hardcodes
`["en", "zh-Hant", "zh-Hans"]` for its own assertions — those remain valid
and are not modified; no new test is required for fr/pa specifically since
the pilot is exercised through the existing benefit-data and format tests
once `ccb`'s content includes fr/pa keys.

## Follow-on work (explicitly out of scope here)

- Translate `dictionaries.ts` UI chrome into fr and pa.
- Translate the remaining ~74 benefits' content into fr and pa.
- Decide whether `tri()` call sites should ever migrate to `L()`, or whether
  the two helpers coexist indefinitely (three-language content has no reason
  to change).
