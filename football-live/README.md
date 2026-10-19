# football-live

Static Arabic (RTL) football fixtures and live scores landing page. No build step.

- Data: [TheSportsDB](https://www.thesportsdb.com/api.php) free API (`eventsday.php`); "today" refreshes every 60s.
- Watch links: add official/licensed broadcaster URLs in `WATCH_LINKS` in `app.js`.
- Deploy: GitHub Pages (Settings > Pages > Deploy from branch `main` / root).

Richer live data alternatives: football-data.org, API-Football (api-sports.io). They need an API key, so proxy them through a small server or serverless function.
