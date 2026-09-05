import { completionRate, dateRange, emptyBlob, scalePoints, topEntries } from "../src/lib/stats";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const CHART_PADDING = 28;
const DAY_OPTIONS = [7, 30, 90];
const DEFAULT_DAYS = 30;

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function clampDays(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DAYS;
  return Math.min(n, 90);
}

function renderTile(value, label, variant = "") {
  return `<div class="tile ${variant}"><span class="tile-n">${value}</span><span class="tile-l">${label}</span></div>`;
}

function renderTable(title, rows, [keyLabel, valueLabel]) {
  const body = rows
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${value}</td></tr>`)
    .join("");
  return `
    <section class="card">
      <h2>${title}</h2>
      <table>
        <thead><tr><th>${keyLabel}</th><th>${valueLabel}</th></tr></thead>
        <tbody>${body || '<tr><td colspan="2">No data yet</td></tr>'}</tbody>
      </table>
    </section>`;
}

function renderChart(dates, values, days, keyParam) {
  const points = scalePoints(values, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING);
  const linePath = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const dots = points
    .map((p) => `<circle class="chart-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5"></circle>`)
    .join("");
  const gridLines = [0, 0.5, 1]
    .map((f) => {
      const y = CHART_PADDING + (CHART_HEIGHT - CHART_PADDING * 2) * f;
      return `<line class="chart-grid" x1="${CHART_PADDING}" y1="${y.toFixed(1)}" x2="${CHART_WIDTH - CHART_PADDING}" y2="${y.toFixed(1)}"></line>`;
    })
    .join("");
  const max = Math.max(...values, 1);

  const toggle = DAY_OPTIONS.map((d) => {
    const cls = d === days ? "range-link active" : "range-link";
    return `<a class="${cls}" href="?key=${encodeURIComponent(keyParam)}&days=${d}">${d}d</a>`;
  }).join("");

  const chartData = JSON.stringify(dates.map((date, i) => ({ date, visits: values[i] })));

  return `
    <section class="card">
      <div class="card-head">
        <h2>Daily visits</h2>
        <div class="range-toggle">${toggle}</div>
      </div>
      <div class="chart-wrap">
        <svg id="chart-svg" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" preserveAspectRatio="none">
          ${gridLines}
          <polyline class="chart-line" points="${linePath}"></polyline>
          ${dots}
        </svg>
        <div id="chart-tooltip" class="chart-tooltip"></div>
        <div class="chart-axis"><span>0</span><span>max ${max}</span></div>
      </div>
    </section>
    <script id="chart-data" type="application/json">${chartData}</script>
    <script>
      (function () {
        var data = JSON.parse(document.getElementById("chart-data").textContent);
        var svg = document.getElementById("chart-svg");
        var tooltip = document.getElementById("chart-tooltip");
        var dots = svg.querySelectorAll(".chart-dot");
        dots.forEach(function (dot, i) {
          function show() {
            var d = data[i];
            if (!d) return;
            tooltip.textContent = d.date + ": " + d.visits;
            var rect = svg.getBoundingClientRect();
            var scaleX = rect.width / svg.viewBox.baseVal.width;
            var scaleY = rect.height / svg.viewBox.baseVal.height;
            var cx = parseFloat(dot.getAttribute("cx")) * scaleX;
            var cy = parseFloat(dot.getAttribute("cy")) * scaleY;
            tooltip.style.opacity = "1";
            tooltip.style.left = cx + "px";
            tooltip.style.top = Math.max(cy - 32, 0) + "px";
          }
          dot.addEventListener("mouseenter", show);
          dot.addEventListener("touchstart", show);
          dot.addEventListener("mouseleave", function () {
            tooltip.style.opacity = "0";
          });
        });
      })();
    </script>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key") ?? "";

  if (!env.STATS_KEY || keyParam !== env.STATS_KEY) {
    return new Response("Not found", { status: 404 });
  }

  if (!env.STATS) {
    return new Response("Stats KV namespace not configured yet.", { status: 200 });
  }

  const days = clampDays(url.searchParams.get("days"));
  const dates = dateRange(days);
  const dayKeys = dates.map((d) => `agg:d:${d}`);

  const kv = await env.STATS.get([...dayKeys, "agg:all"], "json");
  const all = kv.get("agg:all") ?? emptyBlob();
  const dayBlobs = dayKeys.map((k) => kv.get(k) ?? emptyBlob());
  const today = dayBlobs[dayBlobs.length - 1] ?? emptyBlob();
  const visitsByDay = dayBlobs.map((b) => b.visits);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>MapleBenefits — stats</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Manrope:wght@800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f6f8fb;
    --surface: #ffffff;
    --ink: #0f1b2d;
    --muted: #5a6b82;
    --line: #e3e9f2;
    --brand: #1b4fd6;
    --brand-dark: #163fab;
    --brand-soft: #eaf1ff;
    --maple: #d64545;
    --eligible: #17864a;
    --eligible-soft: #e6f6ec;
    --radius: 14px;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Geist", ui-sans-serif, system-ui, sans-serif;
    background: var(--bg);
    color: var(--ink);
    max-width: 860px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
  }
  header { margin-bottom: 1.75rem; }
  .wordmark {
    font-family: "Manrope", ui-sans-serif, system-ui, sans-serif;
    font-weight: 800;
    font-size: 1.5rem;
    letter-spacing: -0.01em;
  }
  .wordmark .maple { color: var(--maple); }
  .wordmark .brand { color: var(--brand); }
  .wordmark .stats-label { color: var(--muted); font-weight: 600; }
  .subtitle { color: var(--muted); font-size: 0.85rem; margin: 0.35rem 0 0; }

  .hero {
    background: var(--brand-soft);
    border-radius: var(--radius);
    padding: 1.75rem 1.5rem;
    margin-bottom: 1.25rem;
  }
  .hero-number { font-size: 3.25rem; font-weight: 700; color: var(--brand-dark); line-height: 1; }
  .hero-label { color: var(--muted); font-size: 0.9rem; margin-top: 0.35rem; }

  .tile-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
  .tile {
    flex: 1 1 120px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 0.9rem 1rem;
  }
  .tile-brand { background: var(--eligible-soft); border-color: transparent; }
  .tile-n { display: block; font-size: 1.5rem; font-weight: 700; }
  .tile-brand .tile-n { color: var(--eligible); }
  .tile-l { color: var(--muted); font-size: 0.8rem; }

  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.5rem;
  }
  .card h2 { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; }
  .card-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  .card-head h2 { margin: 0; }

  .range-toggle { display: flex; gap: 0.35rem; }
  .range-link {
    text-decoration: none;
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
  }
  .range-link.active { background: var(--brand-soft); color: var(--brand); }

  .chart-wrap { position: relative; margin-top: 0.5rem; }
  #chart-svg { width: 100%; height: 180px; overflow: visible; }
  .chart-grid { stroke: var(--line); stroke-width: 1; }
  .chart-line { fill: none; stroke: var(--brand); stroke-width: 2; }
  .chart-dot { fill: var(--brand); cursor: pointer; }
  .chart-dot:hover { fill: var(--brand-dark); }
  .chart-tooltip {
    position: absolute;
    transform: translate(-50%, -100%);
    background: var(--ink);
    color: #fff;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s ease;
    white-space: nowrap;
  }
  .chart-axis { display: flex; justify-content: space-between; color: var(--muted); font-size: 0.75rem; margin-top: 0.4rem; }

  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.45rem 0.5rem; border-bottom: 1px solid var(--line); font-size: 0.9rem; }
  th { color: var(--muted); font-weight: 600; }
</style>
</head>
<body>
  <header>
    <div class="wordmark"><span class="maple">maple</span><span class="brand">benefits</span><span class="stats-label"> stats</span></div>
    <p class="subtitle">Anonymous, aggregate only — no answers, no per-visitor identifiers. Generated ${new Date().toISOString()}</p>
  </header>

  <div class="hero">
    <div class="hero-number">${all.visits}</div>
    <div class="hero-label">visits, all-time</div>
  </div>

  <div class="tile-row">
    ${renderTile(today.visits, "visits today")}
    ${renderTile(all.assessStarted, "questionnaire started")}
    ${renderTile(all.assessCompleted, "questionnaire completed")}
    ${renderTile(completionRate(all) + "%", "completion rate", "tile-brand")}
  </div>

  ${renderChart(dates, visitsByDay, days, keyParam)}

  ${renderTable("Top benefits (all-time)", topEntries(all.benefits, 10), ["Benefit", "Views"])}
  ${renderTable("Geography — today", topEntries(today.geo, 10), ["Region", "Visits"])}
  ${renderTable("Geography — all-time", topEntries(all.geo, 10), ["Region", "Visits"])}
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
