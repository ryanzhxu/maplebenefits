import { emptyBlob, geoKey, mergeEvent } from "../src/lib/stats";

const MAX_PATH_LENGTH = 200;
const DAY_TTL_SECONDS = 60 * 60 * 24 * 120; // ~120 days

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseEvent(body) {
  if (body?.event === "assess_completed") return { type: "assess_completed" };
  if (body?.event === "pageview" && typeof body.path === "string") {
    return { type: "pageview", path: body.path.slice(0, MAX_PATH_LENGTH) };
  }
  return null;
}

// Best-effort: this must never throw or slow down the page it's called
// from, and it never records answer content or a per-visitor identifier —
// only an anonymous path/event and Cloudflare's own edge geo.
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.STATS) return new Response(null, { status: 204 });

    const event = parseEvent(await request.json());
    if (!event) return new Response(null, { status: 204 });

    const geo = geoKey(request.cf?.country, request.cf?.region);
    const allKey = "agg:all";
    const dayKey = `agg:d:${today()}`;

    const [allRaw, dayRaw] = await Promise.all([
      env.STATS.get(allKey),
      env.STATS.get(dayKey),
    ]);

    const allBlob = mergeEvent(allRaw ? JSON.parse(allRaw) : emptyBlob(), event, geo);
    const dayBlob = mergeEvent(dayRaw ? JSON.parse(dayRaw) : emptyBlob(), event, geo);

    await Promise.all([
      env.STATS.put(allKey, JSON.stringify(allBlob)),
      env.STATS.put(dayKey, JSON.stringify(dayBlob), { expirationTtl: DAY_TTL_SECONDS }),
    ]);

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
