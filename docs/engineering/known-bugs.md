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
