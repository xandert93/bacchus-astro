# Known bugs

Bugs found in the Astro build, written up once they're understood. Started
fresh on 2026-10-06; the prototype's list is retired.

Every entry gets a test that fails without the fix (see `CLAUDE.md`, "Checks
and tests"). Add new entries at the end and never renumber, so code comments
can cite them.

---

## Entry format

```md
## 1. Short name of the bug

**Symptom**: what was seen, where, and on which device or viewport.

**Cause**: the real root cause, not just where it showed up.

**Fix**: what changed, and the file it lives in.

**Test**: the spec that guards it (`tests/e2e/…`).

**Rule**: the lesson to apply elsewhere, if there is one.
```

---

## 1. Reception's stations script stopped on load

**Symptom**: on `/weddings/packages/reception`, at every viewport, the
console showed "Cannot access 'rowKeys' before initialization" and the rest
of the Stations script never ran. Found 2026-10-06, before it reached `main`.

**Cause**: converting `function rowKeys() {}` to `const rowKeys = () => {}`.
A function declaration is hoisted: it exists from the top of its scope. A
`const` doesn't exist until its line has run. The loop that builds the
station rows passed `rowKeys` to `addEventListener` a few lines above its
definition, and that loop runs straight away. ESLint's
`no-use-before-define` didn't flag it, because the reference sits inside a
`forEach` callback and the rule is set to ignore references from nested
functions (most of those only run later, on a click).

**Fix**: both `rowKeys` handlers moved above the loops that use them, in
`src/components/packages/ReceptionStations.js`.

**Test**: `tests/e2e/pages.spec.ts` now loads every page, the gallery and
the four package pages included, and fails on any script error.

**Rule**: define a `const` function above any code that runs on load and
uses it, even inside a callback. Every page is in the page test for this
reason; add new pages to it as they're ported.

---

## 2. A script tag mentioned in a comment broke the dev server

**Symptom**: `npm run dev` printed a red "Failed to run dependency scan"
error with "PARSE_ERROR … on the site is processed, which makes it
deferred". Pages still loaded, but it looked like the server had failed.
Every branch had it; `npm run build` and the tests never showed it. Found
2026-10-07.

**Cause**: at startup the dev server (Vite) scans every `.astro` file for
the scripts it imports, so it can bundle their dependencies ahead of time. It
finds them by searching the source for `<script` as plain text, comments
included. A comment in `src/pages/gallery.astro` explaining `is:inline`
said "Every other <script> on the site is processed…", so the scan took that
as the start of a real script and tried to parse the prose after it as
JavaScript. The build doesn't run this scan, so only the dev server hit it.

**Fix**: the comment says "script element" instead, in
`src/pages/gallery.astro`.

**Test**: `tests/e2e/source.spec.ts` fails if any `.astro` file has
`<script` anywhere other than a real script element.

**Rule**: never write a tag's name with its angle bracket in a comment in an
`.astro` file. Say "script element", or put it in backticks without the
bracket.

---

## 3. Every enquiry failed on the live site

**Symptom**: on the live site (2026-10-17), every enquiry showed "Sorry, your
enquiry didn't send", with the write token set. The Worker's log said
`EnvInvalidVariables: SANITY_API_READ_TOKEN is missing`. Locally, in
`npm run dev` and `astro preview`, enquiries went through.

**Cause**: Astro reads and checks **every** secret in the `env.schema`
whenever the Worker handles a request, not only the one the code asks for.
`SANITY_API_READ_TOKEN` was declared required. It only exists while the
site builds, never in the Worker, so the check threw before the endpoint ran.
Locally the token was always to hand, which hid it.

**Fix**: the read token is optional in the schema (`astro.config.mjs`), and
the Sanity client stops the build itself if it's missing
(`src/lib/sanity/client.ts`), so a build without it still fails at once.

**Test**: none automated: the test build always has the token, so it can't
reproduce the Worker lacking one. Checked by posting to the live endpoint
after the deploy.

**Rule**: a secret that only the build has must be optional in
`env.schema`. Only secrets every Worker request can see may be required.

---

## 4. Enquiries failed on the dev server after it restarted

**Symptom**: on `npm run dev` (2026-10-17), the enquiry form showed "Sorry,
your enquiry didn't send". The endpoint answered with a 500: "The file does
not exist at `.vite/deps_ssr/@sanity_client.js`". Pages still loaded.

**Cause**: the dev server runs the endpoint in Cloudflare's runtime, and Vite
bundles a dependency the first time something asks for it. `@sanity/client`
was first asked for by the first enquiry, so Vite re-bundled while the server
was running, and the endpoint asked for the new file before it existed. A
restart (a changed config, say) could leave it pointing at a file that never
arrived.

**Fix**: `@sanity/client` is bundled as the dev server starts
(`vite.ssr.optimizeDeps.include` in `astro.config.mjs`). Checked by sending
an enquiry, restarting the server through a config change, and sending
another.

**Still happens** (2026-10-17) after a change to the `env` settings in
`astro.config.mjs` while the dev server is running: the server restarts
itself, but the endpoint keeps asking for the old bundled files (this time
`astro_env_runtime.js`). Stopping and starting the dev server clears it.

**Test**: none automated: the tests run against a production build, which
doesn't use Vite's dev bundling. If it comes back, stop the dev server and
start it again; if that isn't enough, delete `node_modules/.vite` as well.

**Rule**: a package the Worker code imports should be listed in
`vite.ssr.optimizeDeps.include`, so the dev server never re-bundles mid-run.

---

## 5. A new enquiry took minutes to show on the calendar

**Symptom**: on the live site (2026-10-17), after sending a wedding enquiry,
refreshing the page didn't mark the date "Enquiries received". A few minutes
later it did.

**Cause**: two caches added on purpose, both too slow for this. The
availability endpoint read Sanity through its CDN, which can lag the database
by a minute or more, and told browsers they could reuse its answer for 60
seconds. (Not a rebuild: the rebuild-on-publish webhook ignores bookings, and
the calendar fetches live data on every visit.)

**Fix**: the endpoint reads straight from the database
(`src/lib/sanity/live-client.ts`) and answers with `Cache-Control: no-store`
(`src/pages/api/availability.ts`). Its two queries are now one request.

**Test**: none automated: caching only shows against the live Sanity CDN.
Checked on the live site by enquiring and refreshing.

**Rule**: anything a visitor expects to see change straight after their own
action is read uncached.

---

## 6. The deposit page showed every state message at once

**Symptom**: opening a deposit link (2026-10-18) showed "One moment",
"This link isn't working", "Thank you", "Your date is confirmed" and "This
quote is closed" stacked together.

**Cause**: each message is hidden with the `hidden` attribute until the page
picks one, but the message's own class sets `display: flex`. The browser's
rule for `hidden` is a plain `display: none` with the lowest priority of all,
so any author rule that sets `display` beats it. Four elements on the
Reception stations page had already been patched one by one for the same
reason.

**Fix**: one rule in `src/styles/global.css`,
`[hidden] { display: none !important; }`, and the four patches removed.

**Test**: none automated (no new tests this session, at the user's call).

**Rule**: `hidden` always means hidden. To show and hide something with a
transition, use a class, not the attribute.

---

## 7. The wedding calendar lost its footer and waitlist hint

**Symptom**: picking a date on the weddings page's calendar showed nothing
under it: no "Selected · date", no "Enquire now", and the quick-pick
modal had no "Use this date". The "Date unavailable? Tap it to join the
waitlist" hint had gone too. Reported 2026-10-19.

**Cause**: the change that made the calendar live (2026-10-17, commit
a7caa57) replaced the "illustrative only" notice with the minimum-notice
note, and the edit deleted everything between them as well: the waitlist
hint and the whole footer. The styles and the script that drive them were
untouched, so nothing errored; the elements simply weren't there.

**Fix**: the hint and footer restored as they were, above the notice.

**Test**: none automated (no new tests this session, at the user's call).

**Rule**: when replacing one block of markup, check the diff for anything
else removed with it.
