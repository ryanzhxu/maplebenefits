/**
 * Polite fetcher for official government pages.
 *
 * Rules it enforces, in order: the URL must be on the official-domain
 * allowlist, robots.txt must permit the path, one request at a time per host
 * with a delay between them, and a disk cache so a re-run inside the TTL costs
 * the site nothing. This crawler visits public pages of public services; it
 * should be invisible in their logs.
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { isOfficialUrl } from "../../src/lib/figures";
import {
  CACHE_DIR,
  CACHE_TTL_MS,
  MAX_RETRIES,
  PER_HOST_DELAY_MS,
  REQUEST_TIMEOUT_MS,
  USER_AGENT,
} from "./config";

export interface FetchResult {
  url: string;
  status: number;
  html: string;
  fetchedAt: string;
  fromCache: boolean;
}

export class FetchError extends Error {
  constructor(
    readonly url: string,
    readonly reason: "not-official" | "robots-denied" | "http-error" | "network",
    message: string,
  ) {
    super(message);
  }
}

const lastHitByHost = new Map<string, number>();
const robotsByHost = new Map<string, string[]>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cacheKey = (url: string) => crypto.createHash("sha1").update(url).digest("hex");

/** Wait out the per-host delay, then record this request's time. */
async function throttle(host: string): Promise<void> {
  const last = lastHitByHost.get(host);
  if (last !== undefined) {
    const wait = PER_HOST_DELAY_MS - (Date.now() - last);
    if (wait > 0) await sleep(wait);
  }
  lastHitByHost.set(host, Date.now());
}

async function rawGet(url: string): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: controller.signal,
    });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Disallow rules for `User-agent: *`. A missing or unreadable robots.txt is
 * treated as "no restrictions", which is the documented default.
 */
async function disallowedPaths(origin: string): Promise<string[]> {
  const cached = robotsByHost.get(origin);
  if (cached) return cached;
  let rules: string[] = [];
  try {
    await throttle(new URL(origin).host);
    const { status, body } = await rawGet(`${origin}/robots.txt`);
    if (status === 200) {
      let inStar = false;
      for (const line of body.split("\n")) {
        const text = line.split("#")[0].trim();
        const [rawKey, ...rest] = text.split(":");
        if (!rest.length) continue;
        const key = rawKey.trim().toLowerCase();
        const value = rest.join(":").trim();
        if (key === "user-agent") inStar = value === "*";
        else if (inStar && key === "disallow" && value) rules.push(value);
      }
    }
  } catch {
    rules = [];
  }
  robotsByHost.set(origin, rules);
  return rules;
}

async function robotsAllows(url: string): Promise<boolean> {
  const u = new URL(url);
  const rules = await disallowedPaths(u.origin);
  return !rules.some((rule) => u.pathname.startsWith(rule));
}

async function readCache(url: string): Promise<FetchResult | undefined> {
  const file = path.join(CACHE_DIR, `${cacheKey(url)}.json`);
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf-8")) as FetchResult;
    if (Date.now() - new Date(parsed.fetchedAt).getTime() > CACHE_TTL_MS) return undefined;
    return { ...parsed, fromCache: true };
  } catch {
    return undefined;
  }
}

async function writeCache(result: FetchResult): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${cacheKey(result.url)}.json`);
  await fs.writeFile(file, JSON.stringify(result), "utf-8");
}

/**
 * Fetch one official page. Throws FetchError with a machine-readable `reason`
 * so the caller can distinguish "we must not crawl this" from "the site is
 * having a bad day" — only the latter is worth retrying later.
 */
export async function fetchOfficial(url: string, opts: { noCache?: boolean } = {}): Promise<FetchResult> {
  if (!isOfficialUrl(url)) {
    throw new FetchError(url, "not-official", `refusing to fetch off-allowlist URL: ${url}`);
  }
  if (!opts.noCache) {
    const hit = await readCache(url);
    if (hit) return hit;
  }
  if (!(await robotsAllows(url))) {
    throw new FetchError(url, "robots-denied", `robots.txt disallows ${url}`);
  }

  const host = new URL(url).host;
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await throttle(host);
    try {
      const { status, body } = await rawGet(url);
      if (status === 200) {
        const result: FetchResult = {
          url,
          status,
          html: body,
          fetchedAt: new Date().toISOString(),
          fromCache: false,
        };
        await writeCache(result);
        return result;
      }
      // 4xx other than 429 will not fix itself; stop retrying.
      if (status < 500 && status !== 429) {
        throw new FetchError(url, "http-error", `HTTP ${status} for ${url}`);
      }
      lastError = `HTTP ${status}`;
    } catch (err) {
      if (err instanceof FetchError) throw err;
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt < MAX_RETRIES) await sleep(PER_HOST_DELAY_MS * 2 ** attempt);
  }
  throw new FetchError(url, "network", `${MAX_RETRIES} attempts failed for ${url}: ${lastError}`);
}
