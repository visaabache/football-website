// Copies only the public site files into ./dist (what gets deployed to Cloudflare Pages).
const fs = require("fs");
const files = ["index.html", "match.html", "news.html", "admin.html", "lib.js", "style.css", "_headers", "robots.txt", "sitemap.xml", "data.json",
  "about.html", "contact.html", "privacy.html", "terms.html", "guides.html", "guide-european-leagues.html", "guide-match-times-time-zones.html", "guide-watch-football-legally.html"];
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist");
for (const f of files) if (fs.existsSync(f)) fs.copyFileSync(f, "dist/" + f);
console.log("dist/ ready:", fs.readdirSync("dist").join(", "));
