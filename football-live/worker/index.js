// Cloudflare Worker: collects fixtures/live scores and serves them to the site as JSON.
// Sources: API-Football (if env.AF_KEY is set; many leagues, live) otherwise football-data.org (env.FD_TOKEN).
// Cloudflare KV free plan allows ~1000 writes/day, so writes are kept low (cron every 2 min, AF calls throttled).
const DAY = 864e5, iso = ms => new Date(ms).toISOString().slice(0, 10);

// API-Football league ids to show (edit freely). 39 Premier League, 140 La Liga, 135 Serie A, 78 Bundesliga, 61 Ligue 1,
// 2 Champions League, 3 Europa League, 848 Conference League, 40 Championship, 94 Primeira Liga, 88 Eredivisie, 203 Super Lig,
// 233 Egypt Premier League, 307 Saudi Pro League, 200 Morocco Botola, 186 Algeria Ligue 1, 1 World Cup, 4 Euro, 6 Africa Cup, 9 Copa America
const AF_LEAGUES = new Set([39, 140, 135, 78, 61, 2, 3, 848, 40, 94, 88, 203, 233, 307, 200, 186, 1, 4, 6, 9]);
const AF_LIVE = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "SUSP", "INT"]);
const AF_DONE = new Set(["FT", "AET", "PEN"]);

async function put(env, data) {
  await env.DATA.put("data", JSON.stringify(data));
  return data;
}

// ---------- football-data.org ----------
async function refreshFD(env) {
  const now = Date.now();
  const r = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${iso(now - DAY)}&dateTo=${iso(now + 3 * DAY)}`, { headers: { "X-Auth-Token": env.FD_TOKEN } });
  if (!r.ok) throw new Error("football-data.org responded " + r.status);
  const { matches = [] } = await r.json();
  const leagues = new Map(), teams = new Map();
  const out = matches.map(m => {
    leagues.set("fd-l" + m.competition.id, { id: "fd-l" + m.competition.id, name: m.competition.name, nameEn: m.competition.name, logo: m.competition.emblem });
    for (const t of [m.homeTeam, m.awayTeam]) if (t.id) teams.set("fd-t" + t.id, { id: "fd-t" + t.id, name: t.shortName || t.name, nameEn: t.shortName || t.name, logo: t.crest });
    const pen = m.score.penalties, ft = m.score.fullTime;
    // On shoot-outs fullTime includes the penalties, so subtract them to get the match score.
    const sub = (v, p) => v == null ? v : v - (p ?? 0);
    return { id: "fd-" + m.id, league: "fd-l" + m.competition.id, home: "fd-t" + m.homeTeam.id, away: "fd-t" + m.awayTeam.id, start: m.utcDate, end: "",
      apiStatus: m.status, homeScore: sub(ft.home, pen?.home), awayScore: sub(ft.away, pen?.away),
      ...(pen && pen.home != null ? { penH: pen.home, penA: pen.away } : {}), servers: [] };
  }).filter(m => m.home !== "fd-tnull" && m.away !== "fd-tnull");
  return put(env, { updated: new Date().toISOString(), source: "football-data.org", leagues: [...leagues.values()], teams: [...teams.values()], matches: out });
}

// ---------- API-Football (api-sports.io) ----------
function mapAF(f) {
  const s = f.fixture.status.short;
  const apiStatus = AF_LIVE.has(s) ? "IN_PLAY" : s === "HT" ? "PAUSED" : AF_DONE.has(s) ? "FINISHED" : ["PST", "CANC", "ABD", "AWD", "WO"].includes(s) ? "POSTPONED" : "SCHEDULED";
  const pen = f.score?.penalty;
  return { id: "af-" + f.fixture.id, league: "af-l" + f.league.id, home: "af-t" + f.teams.home.id, away: "af-t" + f.teams.away.id, start: f.fixture.date, end: "",
    apiStatus, homeScore: f.goals.home, awayScore: f.goals.away,
    ...(pen && pen.home != null ? { penH: pen.home, penA: pen.away } : {}), servers: [],
    _l: { id: "af-l" + f.league.id, name: f.league.name, nameEn: f.league.name, logo: f.league.logo },
    _h: { id: "af-t" + f.teams.home.id, name: f.teams.home.name, nameEn: f.teams.home.name, logo: f.teams.home.logo },
    _a: { id: "af-t" + f.teams.away.id, name: f.teams.away.name, nameEn: f.teams.away.name, logo: f.teams.away.logo } };
}
// Free plan = 100 requests/day AND a small per-minute limit, so each run makes at most ONE call:
// today's fixtures every 20 min (72/day), then yesterday and tomorrow once every 3 h each (16/day).
async function refreshAF(env) {
  const now = Date.now();
  const meta = JSON.parse(await env.DATA.get("af_meta") || "{}");
  if (now < (meta.retry || 0)) return null; // backing off after an error
  const day = now - (meta.today || 0) > 20 * 60e3 ? ["today", 0]
    : now - (meta.yest || 0) > 3 * 3600e3 ? ["yest", -DAY]
    : now - (meta.tomo || 0) > 3 * 3600e3 ? ["tomo", DAY] : null;
  if (!day) return null; // throttled: nothing to do
  const store = JSON.parse(await env.DATA.get("af_store") || "{}");
  const r = await fetch("https://v3.football.api-sports.io/fixtures?date=" + iso(now + day[1]), { headers: { "x-apisports-key": env.AF_KEY } });
  const j = r.ok ? await r.json() : {};
  const err = !r.ok ? "HTTP " + r.status : j.errors && Object.keys(j.errors).length ? JSON.stringify(j.errors).slice(0, 200) : "";
  if (err) { await env.DATA.put("af_meta", JSON.stringify({ ...meta, retry: now + 3 * 60e3 })); throw new Error("API-Football: " + err); }
  for (const f of j.response || []) if (AF_LEAGUES.has(f.league.id)) store[f.fixture.id] = mapAF(f);
  for (const k of Object.keys(store)) if (now - Date.parse(store[k].start) > 3 * DAY) delete store[k];
  await env.DATA.put("af_meta", JSON.stringify({ ...meta, [day[0]]: now, retry: 0 }));
  await env.DATA.put("af_store", JSON.stringify(store));
  const list = Object.values(store), leagues = new Map(), teams = new Map();
  const matches = list.map(({ _l, _h, _a, ...m }) => { leagues.set(_l.id, _l); teams.set(_h.id, _h); teams.set(_a.id, _a); return m; });
  return put(env, { updated: new Date().toISOString(), source: "api-football", leagues: [...leagues.values()], teams: [...teams.values()], matches });
}

async function refresh(env) {
  if (env.AF_KEY) {
    try {
      const d = await refreshAF(env);
      if (d) { if (await env.DATA.get("af_error")) await env.DATA.delete("af_error"); return d; }
      return JSON.parse(await env.DATA.get("data") || "null") || {};
    } catch (e) { if (!env.FD_TOKEN) throw e; await env.DATA.put("af_error", new Date().toISOString() + " " + e.message); }
  }
  const d = await refreshFD(env);
  if (await env.DATA.get("error")) await env.DATA.delete("error");
  return d;
}

const STALE_MS = 3 * 60e3;
const track = env => e => env.DATA.put("error", new Date().toISOString() + " " + (e && e.message || e));
let inflight = null; // one refresh at a time per Worker instance

export default {
  scheduled: (_e, env, ctx) => ctx.waitUntil(refresh(env).catch(track(env))),
  async fetch(req, env, ctx) {
    const h = { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=30" };
    let body = await env.DATA.get("data");
    if (!body) { try { body = JSON.stringify(await refresh(env)); } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: h }); } }
    else {
      // Cron backup: if the cached data is older than a few minutes, refresh in the background (one at a time, via a short-lived lock).
      const age = Date.now() - Date.parse(JSON.parse(body).updated || 0);
      if (age > STALE_MS && !inflight) {
        inflight = (async () => {
          if (await env.DATA.get("lock")) return; // another instance is already refreshing
          await env.DATA.put("lock", "1", { expirationTtl: 120 });
          await refresh(env);
        })().catch(track(env)).finally(() => { inflight = null; });
        ctx.waitUntil(inflight);
      }
    }
    const err = await env.DATA.get("error"), afErr = await env.DATA.get("af_error");
    if (err) h["x-last-error"] = err.slice(0, 200);
    if (afErr) h["x-af-error"] = afErr.slice(0, 300); // why API-Football was skipped (falls back to football-data.org)
    return new Response(body, { headers: h });
  },
};
