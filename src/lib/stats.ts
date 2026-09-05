/**
 * Pure aggregation logic for the /stats page. No PII, no per-visitor
 * identifier — inputs are a request path and Cloudflare's edge geo, output
 * is anonymous counters. Framework-free so it can run both in a Cloudflare
 * Pages Function and under vitest.
 */

export interface StatsBlob {
  visits: number;
  geo: Record<string, number>;
  benefits: Record<string, number>;
  assessStarted: number;
  assessCompleted: number;
}

export type TrackEvent =
  | { type: "pageview"; path: string }
  | { type: "assess_completed" };

const MAX_GEO_KEYS = 300;

export function emptyBlob(): StatsBlob {
  return { visits: 0, geo: {}, benefits: {}, assessStarted: 0, assessCompleted: 0 };
}

/** "CA·BC", "CA" (no region), or "unknown" (no country). */
export function geoKey(country?: string | null, region?: string | null): string {
  if (!country) return "unknown";
  return region ? `${country}·${region}` : country;
}

/** Extracts the benefit id from a `/benefits/<id>/` path, else null. */
export function parseBenefitId(path: string): string | null {
  const match = /^\/benefits\/([^/]+)\/?$/.exec(path);
  return match ? match[1] : null;
}

/** True for the assessment questionnaire page itself (not /assess/results/). */
export function isAssessPath(path: string): boolean {
  return path === "/assess" || path === "/assess/";
}

/** Merges one event into a blob, returning a new blob (input untouched). */
export function mergeEvent(
  blob: StatsBlob,
  event: TrackEvent,
  geo: string,
): StatsBlob {
  const next: StatsBlob = {
    visits: blob.visits,
    geo: { ...blob.geo },
    benefits: { ...blob.benefits },
    assessStarted: blob.assessStarted,
    assessCompleted: blob.assessCompleted,
  };

  if (event.type === "assess_completed") {
    next.assessCompleted += 1;
    return next;
  }

  next.visits += 1;
  next.geo[geo] = (next.geo[geo] ?? 0) + 1;
  capGeo(next.geo);

  const benefitId = parseBenefitId(event.path);
  if (benefitId) {
    next.benefits[benefitId] = (next.benefits[benefitId] ?? 0) + 1;
  } else if (isAssessPath(event.path)) {
    next.assessStarted += 1;
  }

  return next;
}

/** Bounds distinct geo keys by dropping the least-frequent ones. */
function capGeo(geo: Record<string, number>): void {
  const keys = Object.keys(geo);
  if (keys.length <= MAX_GEO_KEYS) return;
  const sorted = keys.sort((a, b) => geo[a] - geo[b]);
  for (const key of sorted.slice(0, keys.length - MAX_GEO_KEYS)) {
    delete geo[key];
  }
}

/** Completion percentage, 0 when nobody has started yet. */
export function completionRate(blob: StatsBlob): number {
  if (blob.assessStarted === 0) return 0;
  return Math.round((blob.assessCompleted / blob.assessStarted) * 100);
}

/** Top `n` entries of a counter record, highest first. */
export function topEntries(
  record: Record<string, number>,
  n: number,
): Array<[string, number]> {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/** ISO `YYYY-MM-DD` keys for the last `days` days (UTC), oldest first, ending at `end`. */
export function dateRange(days: number, end: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

/** Maps values onto pixel coordinates for an SVG line chart. */
export function scalePoints(
  values: number[],
  width: number,
  height: number,
  padding = 20,
): Array<{ x: number; y: number }> {
  if (values.length === 0) return [];
  const max = Math.max(...values, 1); // avoid divide-by-zero when every value is 0
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + innerHeight - (v / max) * innerHeight,
  }));
}
