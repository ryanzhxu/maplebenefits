/** Tunables for the crawl automation. One place, so a run is easy to reason about. */
import path from "node:path";
import { execFileSync } from "node:child_process";

/**
 * Repo root, from git rather than from `import.meta` or `__dirname`.
 *
 * The crawl scripts run under tsx (CommonJS, since the package sets no
 * "type"), under vitest (ESM), and from launchd with an arbitrary working
 * directory. Asking git is the one method correct in all three.
 */
export const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: __dirname,
  encoding: "utf-8",
}).trim();
export const DATA_DIR = path.join(REPO_ROOT, "data/crawl");
export const CACHE_DIR = path.join(DATA_DIR, "cache");
export const EVIDENCE_DIR = path.join(DATA_DIR, "evidence");
export const STATE_FILE = path.join(DATA_DIR, "state.json");
export const QUEUE_FILE = path.join(DATA_DIR, "queue.json");
export const LOG_DIR = path.join(DATA_DIR, "logs");

/** Contact string in the User-Agent, so site operators can reach a human. */
export const USER_AGENT =
  "MapleBenefitsBot/1.0 (non-commercial benefits directory; +https://maplebenefits.pages.dev; ryan.xu282@gmail.com)";

/** Minimum delay between requests to the SAME host. Politeness, not speed. */
export const PER_HOST_DELAY_MS = 2_000;
export const REQUEST_TIMEOUT_MS = 30_000;
export const MAX_RETRIES = 3;

/** Disk cache TTL. A re-run inside this window does not re-hit the network. */
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Blast radius: the most benefits one run may change. A run proposing more
 * than this stops and emails instead of merging. One bad run must never be
 * able to rewrite the registry.
 */
export const MAX_BENEFITS_CHANGED_PER_RUN = 8;

/**
 * Default sanity band. A figure moving more than this fraction quarantines
 * rather than merging. Overridable per figure via `Figure.band`.
 */
export const DEFAULT_BAND = 0.25;

export const NOTIFY_EMAIL = "ryan.xu282@gmail.com";

/** Jurisdictions the discovery lane may propose benefits for. */
export const IN_SCOPE_LEVELS = [
  "federal",
  "provincial-bc",
  "provincial-on",
  "provincial-ab",
  "provincial-mb",
  "provincial-sk",
  "provincial-ns",
  "provincial-nb",
  "provincial-pe",
  "provincial-nl",
] as const;

/**
 * Quebec is deliberately out of scope: doing it properly needs a French
 * locale, which Ryan deprioritized. Territories are English-first and are
 * intended for discovery, but have no benefits yet.
 */
export const OUT_OF_SCOPE_NOTE = "Quebec excluded pending a French locale.";
