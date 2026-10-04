# Bacchus — Astro build

Production rebuild of the Bacchus site (restaurant + events venue, Mdina,
Malta). The vanilla HTML prototype lives next door in `../bacchus-prototype`
and stays the source of truth for **design decisions, content facts and the
known-bugs list** — read its `CLAUDE.md` before changing anything visual. Don't
duplicate that file's content here; this file only covers what is specific to
the Astro project.

The prototype is frozen as of 2026-10-02 except for pitch-critical fixes, so
changes are not made in two places.

## The user is learning Astro

Never used Astro before this project; wants to learn it as we go. Knows React
(props, components), Next.js (layouts, file-based routing) and some Vue
(slots), so map Astro concepts onto those and spend the words on where Astro
differs. When an Astro concept appears for the first time, explain briefly
what it is, why Astro does it that way, and what it gains this site compared
with the prototype. Once per concept, not every time.

**Also new to Vitest and Playwright, and wants to do them hands-on (stated
2026-10-04).** For the next several times a test is about to be written or
run, don't just do it: walk the user through it step by step (what to type,
where, what output to expect) so they can try it themselves and report
back. Only take over once they say they're comfortable. Full note in the prototype's `CLAUDE.md` under "How
this user likes to work".

## Migration plan

**Phase 1 — faithful port (in progress).** Same markup, same CSS, same JS,
content hardcoded. Goal is a site that looks and behaves identically, with the
repetition removed into components. No redesigns, no Sanity, no image
pipeline yet; one new thing at a time.

- Done: every page — `index`, `weddings`, `corporate`, `celebrations`,
  `gallery`, and the four packages at `/weddings/packages/{reception,banquet,
high-tea,beverage}` (the agreed URL scheme). `menu.html` is deliberately not
  ported (parked restaurant content).
- Next, to finish phase 1: split `main.js` into per-component scripts.
- Phase-1 debt worth knowing: `reception-package.css` and `package-page.css`
  are two drifted copies of the same package styles; `reception-package.js`
  likewise contains its own copy of `package-tiers.js`'s tier controller.
  Merge each pair deliberately, not as a side effect of other work.

**Phase 2** — `astro:assets` for images (resizing + `srcset`). **Phase 3** —
Sanity (schemas already drafted in `../bacchus-prototype/sanity/`). **Phase 4**
— Vercel deploy, forms, payments.

## Current structure

- `src/layouts/BaseLayout.astro` — `<head>`, grain, nav, drawer, Visit
  section, footer, the script. Props: `title`, `showEnquireLink`,
  `menuBackgroundImage`. Has a named slot `after-footer` for page overlays.
- `src/components/` — chrome (`SiteHeader`, `MobileMenu`, `SocialLinks`,
  `VisitSection`, `SiteFooter`), shared sections (`PageHero`,
  `EnquirySection`, `FaqSection`, `ProcessSteps`, `GalleryPreview`,
  `Testimonials`, `OccasionCards`, `WaitlistPopover`, `Lightbox`) and small parts
  (`CheckList`, `ArrowIcon`). Repeating content (FAQ entries, process
  steps, gallery photos, checklist items) is passed as arrays and rendered
  with `map()` — the shape Sanity data will arrive in later.
- `EnquirySection` props: `eventType` (sets the selected chip AND the
  initial visibility of every field main.js toggles per type, so there is no
  post-load flash), `datePicker` (`inline` compact calendar, or `modal` for
  weddings, which has the full diary on the page), `eyebrow`, `railPhoto`;
  named slots `heading` and `lead`.
- Package pages (`src/pages/weddings/packages/`) import their own CSS
  after `BaseLayout` (`package-page.css` + `package-dish-placeholders.css` /
  `package-beverage.css`, or `reception-package.css`) and their own script
  (`package-tiers.js` / `reception-package.js`). Those scripts
  `import "./main.js"` themselves, so main.js has always run first
  (`window.BacchusTabs`) regardless of `<script>` order. Small CSS files are
  inlined into the page by Astro (`build.inlineStylesheets: "auto"`), after
  the linked ones, so cascade order is preserved.
- `src/data/gallery.ts` — the full gallery's photos and filters.
- `src/data/enquiry.ts` — event types and chip notes. `CHIP_NOTES` is
  duplicated in `main.js` until that file is split; change both.
- `src/styles/global.css` — the prototype's `styles.css`, copied verbatim,
  imported once by the layout. Splitting it into component-scoped styles is
  a later job.
- `src/scripts/main.js` — the prototype's `main.js`, copied verbatim and
  bundled as a module. Checked before the move: no undeclared globals, so
  module strict mode doesn't break it.
- `public/images/` — copied from the prototype minus `originals/`. Served
  as-is from `/images/...`. Moves to `src/assets/` in phase 2.

## Conventions

- Comments in markup use `{/* */}`, not `<!-- -->` — JSX-style comments are
  stripped at build, HTML comments ship to every visitor.
- Links use extensionless routes (`/weddings`), not `weddings.html`. Pages not
  yet ported 404 in dev — expected.
- The prototype's footer "Sandboxes" link was dropped deliberately: the
  sandboxes are pitch material and do not belong on the production site.
- Extract a component when the second copy is ported, not before — what
  varies between pages is only visible with two side by side. (The enquiry
  wizard was extracted this way, after diffing all five prototype copies.)
- The new nav reaches every ported page, including ones that had the old
  flat nav in the prototype. The mobile drawer still needs its first review
  (open item in the prototype's `CLAUDE.md`).
- **Swapping an existing `<img>`'s `src` must wait on `img.decode()` before
  revealing it.** Browsers keep painting the previous bitmap until the new
  one is decoded, so any reused image (lightbox, stations stage) flashes
  the old photo otherwise. Found and fixed in three separate controllers
  (2026-09-30 and 2026-10-04) because each had its own copy — one reason
  the lightbox becomes a single component in the main.js split.
- Commits: Conventional Commits, **always with a scope**:
  `type(scope): description` — e.g. `feat(weddings): port weddings page`,
  `fix(nav): ...`, `chore(repo): ...`. Lower-case imperative description, no
  trailing full stop. Scope is the area touched (a page, a component, `nav`,
  `enquiry`, `tooling`, `repo`). **No Claude co-author or attribution lines**,
  ever.

## Git workflow

Repo: `github.com/xandert93/bacchus-astro` (private), default branch `main`.

- **Every feature or fix gets its own branch off `main`**, named
  `type/short-description` using the same types as commits
  (`feat/gallery-page`, `fix/testimonials-touch-autoplay`). One branch per
  independent change, so each can be reviewed, merged or dropped alone.
- Commit on the branch in `type(scope): description` form, as small logical
  commits.
- Before merging: `npm run check` at 0 errors, `npm run build` clean, and
  `npm run test:e2e` green when the change touches anything tested.
- Merge back with `git merge --no-ff <branch>` and git's default message
  (`Merge branch '<branch>'`), so the history shows each change as one
  group; then delete the branch. Merge commits are the one exception to the
  `type(scope)` format.
- `main` should always build and pass. Tiny docs-only edits to this file may
  go straight to `main`.
- **Claude does not push.** The user pushes `main` (and any branch they want
  on GitHub). If a change ever wants review on GitHub first, push the branch
  and open a pull request instead of merging locally.

## Checks and tests

- `npm run format` / `npm run format:check` — Prettier with
  `prettier-plugin-astro`, `printWidth: 90`. Format-on-save is set in
  `.vscode/settings.json`.

- `npm run check` — `astro check`: TypeScript across `.astro` and `.ts`
  files, including component props. Must stay at 0 errors.
- `npm run test:e2e` — Playwright, against a production build served by
  `astro preview` on port 4322 (never the dev server). Two projects:
  `desktop` runs everything; `mobile` (Pixel 7) runs only tests tagged
  `@mobile`. Specs live in `tests/e2e/`.
- When fixing a bug, add a test that fails without the fix — and confirm it
  does fail against the old code, as was done for the nav underline.
  Prototype bugs worth encoding as tests when their area is touched are in
  the prototype's "Known bugs fixed" list.
- Vitest is planned for pure logic (availability status, date maths, quote
  templating) once that logic is split out of `main.js`; nothing to unit
  test yet.

## Development

Start the dev server in background mode: `astro dev --background` (manage with
`astro dev stop`, `astro dev status`, `astro dev logs`). The user runs
`npm run dev` themselves. Build with `npm run build`.

Docs: https://docs.astro.build — this project is on Astro 7.x. Consult before
related work:
[routing](https://docs.astro.build/en/guides/routing/),
[components](https://docs.astro.build/en/basics/astro-components/),
[styling](https://docs.astro.build/en/guides/styling/),
[content collections](https://docs.astro.build/en/guides/content-collections/).
