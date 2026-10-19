// Shared library: i18n, data store, status logic, time zones, rendering helpers.
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = u => /^(https?:)?\/\//i.test(u || "") ? u : "";

const T = {
  ar: { today: "مباريات اليوم", tomorrow: "مباريات الغد", yesterday: "مباريات الأمس", soon: "ستبدأ بعد قليل", upcoming: "لم تبدأ", live: "مباشر",
    finished: "انتهت المباراة", none: "لا يوجد مباريات هذا اليوم", more: "تحميل المزيد", watch: "شاهد", search: "ابحث عن فريق أو بطولة…",
    servers: "سيرفرات البث", times: "التوقيت في عدة دول", pens: "ركلات الترجيح", embed: "كود بطاقة المباراة", inTz: "بتوقيت",
    notfound: "المباراة غير موجودة", nostream: "لا يوجد بث متاح حاليا", channel: "القناة", commentator: "المعلق", admin: "لوحة التحكم",
    other: "EN", loading: "جاري التحميل…", startsIn: "تبدأ بعد", footer: "جميع الحقوق محفوظة", back: "عودة للمباريات",
    schedule: "جدول المباريات", postponed: "مؤجلة", details: "التفاصيل", about: "من نحن", privacy: "الخصوصية", terms: "الشروط", contact: "اتصل بنا", guides: "أدلة", liveNow: "مباشر الآن", noLive: "لا توجد مباريات مباشرة الآن", news: "آخر الأخبار", readMore: "اقرأ المزيد", nonews: "لا توجد أخبار بعد" },
  en: { today: "Today's matches", tomorrow: "Tomorrow", yesterday: "Yesterday", soon: "Starting soon", upcoming: "Not started", live: "LIVE",
    finished: "Full time", none: "No matches on this day", more: "Load more", watch: "Watch", search: "Search team or league…",
    servers: "Stream servers", times: "Kick-off time by country", pens: "Penalties", embed: "Match card embed code", inTz: "Time zone",
    notfound: "Match not found", nostream: "No stream available yet", channel: "Channel", commentator: "Commentator", admin: "Admin",
    other: "ع", loading: "Loading…", startsIn: "Starts in", footer: "All rights reserved", back: "Back to matches",
    schedule: "Match schedule", postponed: "Postponed", details: "Details", about: "About", privacy: "Privacy", terms: "Terms", contact: "Contact", guides: "Guides", liveNow: "Live now", noLive: "No live matches right now", news: "Latest news", readMore: "Read more", nonews: "No news yet" },
};

const COUNTRIES = {
  "Europe/London": ["بريطانيا", "United Kingdom"], "Europe/Paris": ["فرنسا", "France"], "Europe/Berlin": ["ألمانيا", "Germany"],
  "Europe/Madrid": ["إسبانيا", "Spain"], "Europe/Rome": ["إيطاليا", "Italy"], "Asia/Riyadh": ["السعودية", "Saudi Arabia"], "Africa/Cairo": ["مصر", "Egypt"], "Africa/Casablanca": ["المغرب", "Morocco"],
  "Africa/Algiers": ["الجزائر", "Algeria"], "Africa/Tunis": ["تونس", "Tunisia"], "Asia/Baghdad": ["العراق", "Iraq"],
  "Asia/Dubai": ["الإمارات", "UAE"], "Asia/Amman": ["الأردن", "Jordan"], "Africa/Khartoum": ["السودان", "Sudan"],
  "Asia/Muscat": ["عُمان", "Oman"], "Asia/Kuwait": ["الكويت", "Kuwait"], "Asia/Qatar": ["قطر", "Qatar"], "Asia/Beirut": ["لبنان", "Lebanon"],
};

// apiUrl: use "/api/data" once the domain is on Cloudflare and the Worker route is enabled.
const DEF = { siteName: "Football Live", lang: "en", theme: "light", brand: "#9a1500", accent: "#0f4c81", tz: "Europe/Paris", durationMin: 120,
  soonMin: 60, apiUrl: "https://football-live-api.visaabache.workers.dev", dayShift: 2, siteUrl: "https://football-live.site/", desc: "Live football scores, today's fixtures and match schedule in your time zone.", descAr: "جدول مباريات اليوم والغد والأمس مع النتائج المباشرة بتوقيتك المحلي.", social: { x: "", facebook: "", youtube: "", telegram: "" }, pageSize: 10, defaultDay: 0, homeUrl: "", adTop: "", adBottom: "",
  countries: ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Africa/Cairo"] };

// ---------- store ----------
function seed() {
  const h = 3600e3, now = Date.now(), iso = ms => new Date(ms).toISOString();
  return {
    settings: {}, sample: true,
    leagues: [{ id: 1, name: "الدوري الإنجليزي الممتاز", nameEn: "Premier League" }, { id: 2, name: "دوري أبطال أوروبا", nameEn: "Champions League" }],
    teams: [
      { id: 1, name: "ليفربول", nameEn: "Liverpool" }, { id: 2, name: "أرسنال", nameEn: "Arsenal" }, { id: 3, name: "ريال مدريد", nameEn: "Real Madrid" },
      { id: 4, name: "بايرن ميونخ", nameEn: "Bayern Munich" }, { id: 5, name: "مانشستر سيتي", nameEn: "Man City" }, { id: 6, name: "برشلونة", nameEn: "Barcelona" },
    ],
    news: [],
    matches: [
      { id: 1, league: 1, home: 1, away: 2, start: iso(now - 0.5 * h), end: "", homeScore: 1, awayScore: 0, channel: "beIN Sports 1", commentator: "—",
        servers: [{ name: "سيرفر 1", url: "" }] },
      { id: 2, league: 2, home: 3, away: 4, start: iso(now + 0.5 * h), end: "", servers: [] },
      { id: 3, league: 2, home: 5, away: 6, start: iso(now + 5 * h), end: "", servers: [] },
      { id: 4, league: 1, home: 2, away: 5, start: iso(now - 26 * h), end: "", homeScore: 1, awayScore: 1, penH: 4, penA: 3, servers: [] },
      { id: 5, league: 1, home: 6, away: 1, start: iso(now + 26 * h), end: "", servers: [] },
    ],
  };
}
async function loadData() {
  try { const d = localStorage.getItem("fl_data"); if (d) return JSON.parse(d); } catch {}
  try { const r = await fetch("data.json", { cache: "no-cache" }); if (r.ok) return await r.json(); } catch {}
  return seed();
}
function saveData(d) { localStorage.setItem("fl_data", JSON.stringify(d)); }

// ---------- state ----------
let D, S, L;
const UI = (() => { try { return JSON.parse(localStorage.getItem("fl_ui")) || {}; } catch { return {}; } })();
const saveUI = () => { try { localStorage.setItem("fl_ui", JSON.stringify(UI)); } catch {} };
const t = k => T[L][k] ?? k;
const TZ = () => UI.tz || S.tz;
const nm = o => (L === "en" && o.nameEn) ? o.nameEn : o.name;
const byId = (arr, id) => arr.find(x => x.id == id) || { name: "?" };

function applyTheme() {
  const r = document.documentElement;
  r.dataset.theme = UI.theme || S.theme;
  r.lang = L; r.dir = L === "ar" ? "rtl" : "ltr";
  r.style.setProperty("--brand", S.brand); r.style.setProperty("--blue", S.accent);
}

// ---------- time & status ----------
const locale = () => L === "ar" ? "ar-u-nu-latn" : "en-GB"; // Arabic text with Western digits (0-9)
const fmtTime = (ms, tz = TZ()) => new Date(ms).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });
// A "day" rolls over after dayShift hours (default 2 AM) so late-night matches stay on the previous day.
const dayKey = (ms, tz = TZ()) => new Date(ms - S.dayShift * 3600e3).toLocaleDateString("sv", { timeZone: tz });
function dayKeyOffset(off) {
  const d = new Date(dayKey(Date.now()) + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + off); return d.toISOString().slice(0, 10);
}
function status(m, now = Date.now()) {
  if (m.apiStatus === "POSTPONED") return "postponed";
  if (m.apiStatus === "FINISHED") return "finished";
  if (m.apiStatus === "IN_PLAY" || m.apiStatus === "PAUSED") return "live";
  const s = +new Date(m.start), e = m.end ? +new Date(m.end) : s + S.durationMin * 60000;
  if (now < s) return s - now <= S.soonMin * 60000 ? "soon" : "upcoming";
  return now <= e ? "live" : "finished";
}
function tzOffset(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(ms).map(x => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}
const inputToUtc = (str, tz) => { const g = Date.parse(str + "Z"); return g - tzOffset(g, tz); };
const utcToInput = (iso, tz) => iso ? new Date(+new Date(iso)).toLocaleString("sv", { timeZone: tz }).slice(0, 16).replace(" ", "T") : "";

// ---------- rendering ----------
function badge(t) {
  const u = safeUrl(t.logo);
  return u ? `<img loading="lazy" src="${esc(u)}" alt="">` : `<i class="ini">${esc((nm(t) || "?").trim()[0])}</i>`;
}
function card(m) {
  const h = byId(D.teams, m.home), a = byId(D.teams, m.away), st = status(m);
  const hasScore = m.homeScore !== undefined && m.homeScore !== "" && m.homeScore !== null;
  let mid = st === "upcoming" || st === "postponed" || st === "soon" && !hasScore ? fmtTime(+new Date(m.start)) : `${esc(m.homeScore ?? 0)} - ${esc(m.awayScore ?? 0)}`;
  if (m.penH !== undefined && m.penH !== "" && m.penH !== null) mid += `<small class="pen">(${esc(m.penH)}-${esc(m.penA)}) ${t("pens")}</small>`;
  return `<a class="match ${st}" href="match?id=${m.id}">
    <span class="team">${badge(h)}${esc(nm(h))}</span>
    <span class="mid">${mid}<small class="st">${t(st)}</small></span>
    <span class="team">${badge(a)}${esc(nm(a))}</span>
    <span class="watch ${st === "finished" ? "off" : ""}">${st === "live" ? "● " : ""}${(m.servers || []).some(x => safeUrl(x.url)) ? t("watch") : t("details")}</span></a>`;
}
function header() {
  const q = UI.embed ? "" : `<header class="top"><div class="wrap bar">
    <a class="logo" href="index.html?home=0">${esc(S.siteName)}</a>
    <nav><a href="index.html?day=0&home=0">${t("today")}</a><a href="index.html?day=1&home=0">${t("tomorrow")}</a><a href="index.html?day=-1&home=0">${t("yesterday")}</a></nav>
    <span class="soc">${[["x", "𝕏"], ["facebook", "f"], ["youtube", "▶"], ["telegram", "✈"]].filter(([k]) => safeUrl(S.social?.[k]))
      .map(([k, g]) => `<a class="ib s-${k}" href="${esc(S.social[k])}" target="_blank" rel="noopener" aria-label="${k}">${g}</a>`).join("")}</span>
    <button id="lang" class="ib">${t("other")}</button><button id="theme" class="ib" aria-label="theme">◐</button></div></header>`;
  $("#hdr").innerHTML = q;
  if (UI.embed) return;
  $("#lang").onclick = () => { UI.lang = L === "ar" ? "en" : "ar"; saveUI(); location.reload(); };
  $("#theme").onclick = () => { UI.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; saveUI(); applyTheme(); };
}
function footer() {
  if (UI.embed) { $("#ftr").innerHTML = ""; return; }
  $("#ftr").innerHTML = `<footer class="wrap foot"><span>© ${esc(S.siteName)} — ${t("footer")}</span><span class="fl"><a href="about">${t("about")}</a><a href="guides">${t("guides")}</a><a href="privacy">${t("privacy")}</a><a href="terms">${t("terms")}</a><a href="contact">${t("contact")}</a></span></footer>`;
}
function tzSelect() {
  const all = Object.keys(COUNTRIES);
  if (!all.includes(S.tz)) all.unshift(S.tz);
  return `<select id="tzsel" class="tz">${all.map(z => `<option value="${esc(z)}" ${z === TZ() ? "selected" : ""}>${t("inTz")} ${esc(COUNTRIES[z] ? COUNTRIES[z][L === "ar" ? 0 : 1] : z)}</option>`).join("")}</select>`;
}

// Sets title, description, canonical, hreflang, Open Graph/Twitter tags and optional JSON-LD.
function seo({ title, desc, path = "", type = "website", ld }) {
  const base = (S.siteUrl || "").replace(/\/?$/, "/"), url = base + path;
  const set = (sel, make, attrs) => { let e = document.head.querySelector(sel); if (!e) { e = document.createElement(make); document.head.append(e); } Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); };
  document.title = title;
  const d = desc || (L === "ar" ? S.descAr : S.desc);
  set('meta[name=description]', "meta", { name: "description", content: d });
  set('link[rel=canonical]', "link", { rel: "canonical", href: url });
  const sep = path.includes("?") ? "&" : "?";
  [["en", url + sep + "lang=en"], ["ar", url + sep + "lang=ar"], ["x-default", url]].forEach(([l, h]) =>
    set('link[hreflang="' + l + '"]', "link", { rel: "alternate", hreflang: l, href: h }));
  [["og:title", title], ["og:description", d], ["og:url", url], ["og:type", type], ["og:site_name", S.siteName], ["og:locale", L === "ar" ? "ar_AR" : "en_GB"]]
    .forEach(([p, c]) => set('meta[property="' + p + '"]', "meta", { property: p, content: c }));
  [["twitter:card", "summary"], ["twitter:title", title], ["twitter:description", d]].forEach(([n, c]) => set('meta[name="' + n + '"]', "meta", { name: n, content: c }));
  if (ld) { let e = document.getElementById("ld"); if (!e) { e = document.createElement("script"); e.id = "ld"; e.type = "application/ld+json"; document.head.append(e); } e.textContent = JSON.stringify(ld); }
}

// Merge auto-updated matches from the Worker API (read-only, never saved back by the admin).
let BASE;
async function refreshApi() {
  if (!BASE || !S.apiUrl) return;
  try {
    const r = await fetch(S.apiUrl, { cache: "no-cache" });
    if (!r.ok) return;
    const a = await r.json();
    if (!Array.isArray(a.matches)) return;
    D = { ...BASE, leagues: [...BASE.leagues, ...a.leagues], teams: [...BASE.teams, ...a.teams],
      matches: [...(BASE.sample ? [] : BASE.matches), ...a.matches] };
  } catch {}
}
async function boot(opts = {}) {
  D = await loadData();
  S = { ...DEF, ...D.settings };
  if (!opts.admin && !opts.static) {
    BASE = D;
    if (D.sample) D = { ...D, matches: [] }; // never show the demo matches to visitors, even if the API is unreachable
    await refreshApi();
  }
  const ql = new URLSearchParams(location.search).get("lang");
  if (ql === "ar" || ql === "en") { UI.lang = ql; saveUI(); }
  L = UI.lang || S.lang;
  if (opts.embed) UI.embed = true;
  applyTheme(); header(); footer();
  return D;
}
