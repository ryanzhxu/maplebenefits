import { completionRate, emptyBlob, topEntries } from "../src/lib/stats";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function renderTable(title, rows, [keyLabel, valueLabel]) {
  const body = rows
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${value}</td></tr>`)
    .join("");
  return `
    <section>
      <h2>${title}</h2>
      <table>
        <thead><tr><th>${keyLabel}</th><th>${valueLabel}</th></tr></thead>
        <tbody>${body || '<tr><td colspan="2">No data yet</td></tr>'}</tbody>
      </table>
    </section>`;
}

function renderStat(value, label) {
  return `<div class="stat"><span class="n">${value}</span><span class="l">${label}</span></div>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) {
    return new Response("Not found", { status: 404 });
  }

  if (!env.STATS) {
    return new Response("Stats KV namespace not configured yet.", { status: 200 });
  }

  const [allRaw, dayRaw] = await Promise.all([
    env.STATS.get("agg:all"),
    env.STATS.get(`agg:d:${today()}`),
  ]);
  const all = allRaw ? JSON.parse(allRaw) : emptyBlob();
  const day = dayRaw ? JSON.parse(dayRaw) : emptyBlob();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>MapleBenefits — stats</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 780px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  h1 { margin-bottom: 0.25rem; }
  .subtitle { color: #666; margin-top: 0; }
  section { margin-bottom: 2rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; }
  .stat-row { display: flex; gap: 2rem; flex-wrap: wrap; }
  .stat .n { font-size: 2rem; font-weight: 700; display: block; }
  .stat .l { color: #666; font-size: 0.85rem; }
</style>
</head>
<body>
  <h1>MapleBenefits stats</h1>
  <p class="subtitle">Anonymous, aggregate only — no answers, no per-visitor identifiers. Generated ${new Date().toISOString()}</p>

  <section>
    <h2>Traffic</h2>
    <div class="stat-row">
      ${renderStat(day.visits, "visits today")}
      ${renderStat(all.visits, "visits all-time")}
    </div>
  </section>

  <section>
    <h2>Questionnaire completion</h2>
    <div class="stat-row">
      ${renderStat(all.assessStarted, "started (all-time)")}
      ${renderStat(all.assessCompleted, "completed (all-time)")}
      ${renderStat(completionRate(all) + "%", "completion rate")}
    </div>
  </section>

  ${renderTable("Top benefits (all-time)", topEntries(all.benefits, 10), ["Benefit", "Views"])}
  ${renderTable("Geography — today", topEntries(day.geo, 10), ["Region", "Visits"])}
  ${renderTable("Geography — all-time", topEntries(all.geo, 10), ["Region", "Visits"])}
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
