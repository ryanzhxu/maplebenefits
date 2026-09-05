/**
 * Anonymous, best-effort event beacon. No client id is generated or
 * stored — events carry only a path or a bare completion signal, never
 * assessment answers.
 */
export function track(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({ event, ...data });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
    }
  } catch {
    // Tracking must never break the page.
  }
}
