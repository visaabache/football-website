// Usage: node tools/sitemap.js [https://your-site-url/]
// Reads data.json (export it from Admin > Backup) and writes sitemap.xml + robots.txt.
const fs = require("fs");
let data = {};
try { data = JSON.parse(fs.readFileSync("data.json", "utf8")); } catch { console.warn("No data.json found: writing static pages only."); }
const API = process.argv[3] || data.settings?.apiUrl || "https://football-live-api.visaabache.workers.dev";
const base = (process.argv[2] || data.settings?.siteUrl || "https://football-live.site/").replace(/\/?$/, "/");
(async () => {
  try { const r = await fetch(API); const a = await r.json(); data.matches = [...(data.matches || []), ...(a.matches || [])]; console.log("API matches:", (a.matches || []).length); }
  catch (err) { console.warn("Could not read API (" + err.message + "): sitemap will skip live matches."); }
  const e = s => s.replace(/&/g, "&amp;");
  const urls = [["", "daily", "1.0"], ["index.html?day=1", "daily", "0.8"], ["index.html?day=-1", "daily", "0.5"]];
  ["about", "guides", "guide-european-leagues", "guide-watch-football-legally", "guide-match-times-time-zones", "privacy", "terms", "contact"].forEach(p => urls.push([p, "monthly", "0.5"]));
  (data.matches || []).forEach(m => urls.push([`match?id=${m.id}`, "hourly", "0.7", m.start]));
  (data.news || []).forEach(n => urls.push([`news?id=${n.id}`, "weekly", "0.6", n.date]));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.map(([p, f, pr, d]) => {
      const u = e(base + p), sep = p.includes("?") ? "&amp;" : "?";
      return `  <url><loc>${u}</loc>${d ? `<lastmod>${new Date(d).toISOString().slice(0, 10)}</lastmod>` : ""}<changefreq>${f}</changefreq><priority>${pr}</priority>` +
        `<xhtml:link rel="alternate" hreflang="en" href="${u}${sep}lang=en"/><xhtml:link rel="alternate" hreflang="ar" href="${u}${sep}lang=ar"/></url>`;
    }).join("\n") + `\n</urlset>\n`;
  fs.writeFileSync("sitemap.xml", xml);
  fs.writeFileSync("robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\n\nSitemap: ${base}sitemap.xml\n`);
  console.log(`sitemap.xml: ${urls.length} URLs for ${base}`);
})();
