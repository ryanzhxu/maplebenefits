/**
 * Milestone notification for unattended runs.
 *
 * Ryan asked for a concise email at each milestone. A launchd job cannot send
 * one directly on this machine: there is no configured Mail.app or MTA, and
 * headless `claude -p` has no Gmail tool. The route that works today with no
 * stored credential is a GitHub issue -- `gh` is already authenticated here,
 * and GitHub emails the repo owner when an issue is opened.
 *
 * Every milestone is also written to disk before any delivery is attempted, so
 * a run's history survives even when delivery fails.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { LOG_DIR, NOTIFY_EMAIL } from "./config";

export type MilestoneKind = "progress" | "quarantine" | "failure";

export interface Milestone {
  kind: MilestoneKind;
  /** One line. Becomes the issue title, so keep it concrete. */
  title: string;
  /** Plain text, concise -- a few lines, not a report. */
  body: string;
}

const MILESTONE_DIR = path.join(LOG_DIR, "milestones");

function queueToFile(m: Milestone, at: string): string {
  fs.mkdirSync(MILESTONE_DIR, { recursive: true });
  const file = path.join(MILESTONE_DIR, `${at.replace(/[:.]/g, "-")}-${m.kind}.json`);
  fs.writeFileSync(file, `${JSON.stringify({ ...m, at, to: NOTIFY_EMAIL }, null, 2)}\n`);
  return file;
}

function tryGithubIssue(m: Milestone): boolean {
  const title = `[crawl] ${m.title}`;
  const withLabels = ["issue", "create", "--title", title, "--body", m.body, "--label", "crawl-automation"];
  const withoutLabels = ["issue", "create", "--title", title, "--body", m.body];

  for (const args of [withLabels, withoutLabels]) {
    try {
      execFileSync("gh", args, { stdio: ["ignore", "ignore", "pipe"] });
      return true;
    } catch {
      // The label may not exist on the repo yet. Fall through and retry
      // without it rather than lose a notification over something cosmetic.
    }
  }
  return false;
}

/** Record a milestone and deliver it by the best channel available. */
export function notify(m: Milestone): { via: "github" | "file"; file: string } {
  const at = new Date().toISOString();
  const file = queueToFile(m, at);
  return { via: tryGithubIssue(m) ? "github" : "file", file };
}
