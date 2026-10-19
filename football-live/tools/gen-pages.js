// Generates the static content pages (About, Privacy, Terms, Contact, Guides). Run: node tools/gen-pages.js
// Edit SITE / EMAIL / OWNER below, then re-run, then: node tools/build.js && npx wrangler deploy
const fs = require("fs");
const SITE = "Football Live";
const DOMAIN = "football-live.site";
const EMAIL = "contact@football-live.site"; // set up a real mailbox (e.g. Cloudflare Email Routing) before applying to AdSense
const UPDATED = "9 October 2026";

const page = (file, title, desc, body) => {
  const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | ${SITE}</title>
<meta name="description" content="${desc}">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div id="hdr"></div>
<main class="wrap"><article class="card pad prose">
${body}
</article></main>
<div id="ftr"></div>
<script src="lib.js"></script>
<script>
(async () => {
  await boot({ static: true });
  seo({ title: ${JSON.stringify(title + " | " + SITE)}, desc: ${JSON.stringify(desc)}, path: ${JSON.stringify(file.replace(".html", ""))}, type: "article" });
})();
</script>
</body>
</html>
`;
  fs.writeFileSync(file, html);
};

const GUIDES = [
  ["guide-european-leagues", "A Guide to Europe's Top Football Leagues",
    "How the Premier League, La Liga, Serie A, Bundesliga and Ligue 1 are structured, when seasons run, and how European qualification works.",
    `<h1>A Guide to Europe's Top Football Leagues</h1>
<p>Five domestic leagues dominate European club football by audience and money: England's Premier League, Spain's La Liga, Italy's Serie A, Germany's Bundesliga and France's Ligue 1. They share the same basic idea, a season-long table in which every club plays every other club home and away, but the details differ.</p>
<h2>Size and format</h2>
<p>The Premier League, La Liga and Serie A each have 20 clubs, so a season is 38 matches per team. The Bundesliga and Ligue 1 have 18 clubs, which means 34 matches per team. In all five, a win earns three points, a draw one and a defeat none. The club with the most points at the end is champion.</p>
<h2>Promotion and relegation</h2>
<p>The bottom clubs in each top division drop to the second tier and are replaced by the best clubs from below. The numbers vary by country, and some leagues add play-off matches for one of the places, so it is worth checking each league's current rules at the start of a season.</p>
<h2>When the season runs</h2>
<p>Most European leagues start in August and finish in May, with a winter break whose length depends on the country. Matches are usually played on weekends, with some games moved to weekday evenings to fit broadcasting schedules and European competitions.</p>
<h2>Qualifying for Europe</h2>
<p>The highest-placed clubs in each league qualify for UEFA competitions the following season: the Champions League for the top places, then the Europa League and the Conference League. Since the 2024-25 season the Champions League uses a single league phase of 36 clubs followed by knockout rounds, replacing the old group stage. Exact qualification spots per country depend on UEFA's rankings, so they can change from year to year.</p>
<h2>Reading fixtures on this site</h2>
<p>Our match schedule groups games by competition and shows the kick-off in your chosen time zone. Pick a different country in the selector at the top of the schedule to see how the same fixture falls in other regions, and use the Live now button to see only matches in progress.</p>`],
  ["guide-watch-football-legally", "How to Watch Football Legally in Europe",
    "Why live football rights are split by country, how to find the official broadcaster for your match, and why unlicensed streams are risky.",
    `<h1>How to Watch Football Legally in Europe</h1>
<p>Live football is sold through broadcasting rights, and those rights are sold country by country. A match shown by one broadcaster at home can be on a completely different service in another country. That is why searching for "where to watch" often gives confusing answers.</p>
<h2>Start with the competition's official page</h2>
<p>Leagues and UEFA publish "where to watch" pages that list the licensed broadcasters in each country. This is the most reliable starting point because it is maintained by the rights holder. Open it, choose your country, and you will see which television channel or streaming service carries your match.</p>
<h2>Free-to-air and subscription services</h2>
<p>In many countries a limited number of matches are shown on free channels, while most are behind a subscription. Some broadcasters offer day passes or monthly plans without a long contract, which can suit fans who only follow one team. Check the cancellation terms before you subscribe.</p>
<h2>Highlights and scores without a subscription</h2>
<p>Even without a subscription you can follow a match through live scores, official club and league highlights, and the radio commentary many public broadcasters provide online. This site lists fixtures, results and live scores so you know what is on and when.</p>
<h2>Why we do not link to unlicensed streams</h2>
<p>Unlicensed streams infringe copyright, often carry aggressive advertising and malware, and can disappear mid-match. We only link to official sources. If a site offers every match for free with no explanation of who holds the rights, treat that as a warning sign.</p>
<h2>Practical tips</h2>
<p>Check the kick-off time in your own time zone, since fixtures are usually announced in local time at the stadium. Look for the broadcaster a day ahead so there is time to sign in, and test your connection before big matches.</p>`],
  ["guide-match-times-time-zones", "Football Match Times and Time Zones Explained",
    "Why kick-off times differ between countries, how daylight saving time shifts fixtures twice a year, and how to read match times on this site.",
    `<h1>Football Match Times and Time Zones Explained</h1>
<p>A match announced for 20:45 may be at a very different time of day for you. Kick-offs are normally set in the local time of the stadium, so fans in other countries have to convert them.</p>
<h2>UTC as a common reference</h2>
<p>Computer systems store times in UTC, a global reference that does not change with the seasons. Our schedule stores every kick-off in UTC and converts it to the time zone you select, which avoids mistakes when clocks change.</p>
<h2>Daylight saving time</h2>
<p>Most European countries move their clocks forward on the last Sunday of March and back on the last Sunday of October. During that period the gap between Europe and countries that do not change their clocks grows or shrinks by an hour. A fixture that is fixed to the same local time can therefore move by an hour for fans elsewhere.</p>
<h2>Late-night matches</h2>
<p>Some matches start after 23:00 in the region where you live. On this site the day changes at 02:00, so a game that starts at 23:30 still appears on the day it was scheduled instead of jumping to the next one.</p>
<h2>Kick-off in several countries</h2>
<p>Each match page shows the kick-off time in several countries, which is useful if you follow a team with friends and family abroad. The status of a match is updated automatically as it moves from "not started" to "starting soon", "live" and "full time".</p>
<h2>Postponements</h2>
<p>Matches can be moved for weather, security or scheduling reasons. Our data is refreshed automatically, but always check with the league or your broadcaster close to kick-off.</p>`],
];

page("about.html", "About", `About ${SITE}: live football fixtures, scores and match times in your time zone.`, `<h1>About ${SITE}</h1>
<p>${SITE} is an independent website that helps football fans find out what is on, when, and how it ended. We publish daily fixtures, live scores and results for the major competitions, with kick-off times converted to the time zone you choose.</p>
<h2>What you will find here</h2>
<p>A schedule for yesterday, today and tomorrow, a Live now filter that shows only matches in progress, and a page for every match with its competition, teams, kick-off times in several countries and a short summary. We also publish written guides about how leagues work and how to follow football from anywhere.</p>
<h2>Where our data comes from</h2>
<p>Fixtures and scores are retrieved automatically from football-data.org and refreshed throughout the day. Scores can be a minute or two behind the stadium, so please do not use this site for betting or time-critical decisions.</p>
<h2>Watching matches</h2>
<p>We do not host or link to unlicensed video streams. Where we link to a broadcaster, it is the official rights holder.</p>
<h2>Contact</h2>
<p>Corrections and questions are welcome. See our <a href="contact">contact page</a>.</p>`);

page("contact.html", "Contact", `Contact ${SITE} with corrections, feedback or business questions.`, `<h1>Contact us</h1>
<p>We read every message. Write to us if you spot an incorrect fixture or score, want to report a problem with the site, or have a question about advertising or partnerships.</p>
<p>Email: <a href="mailto:${EMAIL}">${EMAIL}</a></p>
<p>We try to reply within a few working days. Please include the page address and, for score corrections, the match and the correct result.</p>
<p>Website: ${DOMAIN}</p>`);

page("privacy.html", "Privacy Policy", `How ${SITE} handles data, cookies and advertising.`, `<h1>Privacy Policy</h1>
<p>Last updated: ${UPDATED}</p>
<p>This policy explains what information ${SITE} (${DOMAIN}) collects when you visit and how it is used.</p>
<h2>Information we store on your device</h2>
<p>To remember your choices, the site stores small settings in your browser's local storage, such as your language, light or dark theme and selected time zone. This stays on your device and is not sent to us.</p>
<h2>Server logs</h2>
<p>Our hosting provider, Cloudflare, processes requests to deliver the site and protect it from abuse. This normally includes your IP address, browser type and the pages requested.</p>
<h2>Advertising and cookies</h2>
<p>We may show advertising served by Google AdSense and other partners. Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and other sites on the internet. You can opt out of personalised advertising at <a href="https://www.google.com/settings/ads" rel="noopener">Google Ads Settings</a>, or at <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>.</p>
<p>Visitors in the European Economic Area, the United Kingdom and Switzerland are asked for their consent to cookies and personalised advertising through a consent message before such ads are shown.</p>
<h2>External links</h2>
<p>Our pages may link to other websites, such as broadcasters and leagues. We are not responsible for their content or privacy practices.</p>
<h2>Your rights</h2>
<p>Depending on where you live, you may have rights to access, correct or delete personal data, or to object to its processing. We do not ask visitors to create accounts. To make a request, email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
<h2>Children</h2>
<p>The site is not directed at children under 13 and we do not knowingly collect their personal information.</p>
<h2>Changes</h2>
<p>We may update this policy and will change the date above when we do.</p>`);

page("terms.html", "Terms of Use", `Terms of use for ${SITE}.`, `<h1>Terms of Use</h1>
<p>Last updated: ${UPDATED}</p>
<p>By using ${DOMAIN} you agree to these terms.</p>
<h2>Information only</h2>
<p>Match times, scores and other content are provided for general information. We work to keep them accurate but cannot guarantee that they are complete, up to date or error-free. Do not rely on the site for betting, financial or other time-critical decisions.</p>
<h2>Intellectual property</h2>
<p>Team names, competition names and logos belong to their owners and are used to identify the matches they relate to. Our own text, design and code may not be copied or republished without permission.</p>
<h2>No video content</h2>
<p>We do not host broadcasts. Any link to a broadcaster is to an official service, and your use of that service is subject to its own terms.</p>
<h2>Links to other sites</h2>
<p>We are not responsible for the content or practices of external websites.</p>
<h2>Limitation of liability</h2>
<p>To the extent permitted by law, we are not liable for losses arising from your use of the site or from errors or interruptions in it.</p>
<h2>Changes and contact</h2>
<p>We may change these terms from time to time. Questions can be sent to <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`);

page("guides.html", "Football Guides", `Guides to European football leagues, legal ways to watch, and match times across time zones.`,
  `<h1>Football Guides</h1><p>Practical, plain-language guides for fans.</p><div class="glist">` +
  GUIDES.map(([f, t, d]) => `<a href="${f}"><b>${t}</b>${d}</a>`).join("") + `</div>`);
GUIDES.forEach(([f, t, d, body]) => page(f + ".html", t, d, body + `\n<p><a href="guides">All guides</a></p>`));
console.log("generated", 5 + GUIDES.length, "pages");
