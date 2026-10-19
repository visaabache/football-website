# football-live

Football fixtures and live scores in English and Arabic (RTL). Static pages plus a small Cloudflare Worker for data.

- **Site** (`*.html`, `lib.js`, `style.css`): no framework. `node tools/build.js` copies the public files into `dist/`, which is deployed with `npx wrangler deploy` (see `wrangler.toml`). `node tools/sitemap.js` rebuilds `sitemap.xml` and `robots.txt`.
- **Data** (`worker/`): a Worker on a 2-minute cron caches fixtures in KV and serves them as JSON. It uses API-Football when `AF_KEY` is set, otherwise football-data.org (`FD_TOKEN`). Setup steps are in `worker/wrangler.toml`.
- **API-Football free plan (100 requests/day):** the Worker makes at most one call per run and spends the budget on live matches. While a match is in play its day is re-fetched every 4–30 minutes (sized so the budget lasts until midnight UTC); otherwise today is fetched every 2 h and yesterday/tomorrow every 6 h. Usage is read from the API's rate-limit headers and 5 calls are kept spare.
- **Admin** (`admin.html`): edits are saved in your browser only. To publish them, export `data.json` (Admin > Backup), add it to the repo and redeploy.
- **Watch links:** only add official or licensed broadcaster URLs as stream servers.
