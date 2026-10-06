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

**Phase 1 — faithful port (complete, 2026-10-04).** Same markup, same CSS, same JS,
content hardcoded. Goal is a site that looks and behaves identically, with the
repetition removed into components. No redesigns, no Sanity, no image
pipeline yet; one new thing at a time.

- Done: every page — `index`, `weddings`, `corporate`, `celebrations`,
  `gallery`, and the four packages at `/weddings/packages/{reception,banquet,
high-tea,beverage}` (the agreed URL scheme). `menu.html` is deliberately not
  ported (parked restaurant content).
- `main.js` split into per-component scripts (see Current structure).
- Next: decide what sections the package pages carry (Visit, enquiry,
  gallery) and in what order — open question with the user.
- Package styles merged 2026-10-05: `PackageTierSection.css` is shared by all four
  pages; `ReceptionStations.css` is Reception's Stations section only. A
  computed-style diff (`scripts/style-snapshot.mjs`, before vs after)
  showed zero change on Reception. `package-tiers.js` is the one tier controller for all four (2026-10-05);
  `reception-package.js` holds only the Stations controllers.
- **Use a key, never a path:** `src/lib/images.ts` looks photos up as
  `"venue/ballroom-night"`; an unknown key fails the build. Render with
  `<Photo src="key" alt sizes>` (any photo), `<HeroImage>` (page heroes),
  `<NavPanelPhoto>` (dropdown panels, lazy via data-src), or `getImage()`
  for CSS backgrounds (see `MobileMenu`).
- **Always build from the untouched originals.** Resizing an already-
  compressed web copy compresses twice (measured 40.7 vs 43.2 dB PSNR, at a
  larger file). Originals come from the prototype's `images/originals/`
  (25 JPEGs). Photos without one are listed in `WEB_COPY_ONLY` in
  `images.ts` — served untouched at their own size, with only smaller
  variants generated — and that list is the request list for Bacchus.
  When an original arrives: replace the file, delete its entry.
- AVIF first with a WebP fallback, each at its own quality (hence
  `getImage()` twice rather than `<Picture>`).
- `sizes` must describe the real drawn width — object-fit cover, scale
  animations, grid columns — or browsers pick a file that's too small.
- `<picture>` is `display: contents` sitewide, so it never affects layout;
  any `> img` child selector needs a `> picture > img` twin.

**Phase 3** —
Sanity (schemas already drafted in `../bacchus-prototype/sanity/`). **Phase 4**
— Vercel deploy, forms, payments.

## Current structure

- `src/layouts/BaseLayout.astro` — `<head>`, grain, nav, drawer, Visit
  section, footer, the script. Props: `title`, `showEnquireLink`,
  `menuBackgroundImage`. Has a named slot `after-footer` for page overlays.
- **Pages compose; components hold the markup.** A page file is
  frontmatter plus a list of sections (the homepage is ~45 lines). Content
  that repeats or will come from Sanity lives in `src/data/` and is rendered
  with `map()`; one-off copy stays in the component that shows it.
- **Import with the path aliases** (`tsconfig.json`): `@components/…`,
  `@layouts/…`, `@data/…`, `@lib/…`, `@scripts/…`, `@styles/…`,
  `@assets/…` — never `../../../`, so files can move without breaking
  imports.
- `src/components/`, grouped by what the component is for:
  - `ui/` — small reusable parts: `Photo`, `HeroImage`, `GalleryTile`,
    `Lightbox`, `CheckList`, `SocialLinks`, `ArrowIcon`, `Particles`.
  - `forms/` — form controls: `FormField` (label, error, notes), `TextInput`
    (every input and the textarea), `ChipGroup`, `OptionCardGroup`. Used by
    the enquiry wizard and the waitlist popover.
  - `layout/` — chrome on every page: `SiteHeader`, `MobileMenu`,
    `SiteFooter`, `VisitSection`.
  - `nav/` — `NavDropdown` (one desktop dropdown), `MobileNavGroup` (one
    drawer group), `NavChevron`, `NavItemIcon`, `NavPanelPhoto`. Both bars
    render from `src/data/navigation.ts`.
  - `sections/` — sections several pages share: `HeroFrame` (the hero
    shell) and `PageHero` on top of it, `IntroSplit`, `FaqSection`,
    `ProcessSteps`, `GalleryPreview`, `Testimonials`, `OccasionCards`,
    `PhotoCarousel`.
  - `enquiry/` — `EnquirySection` (layout) → `EnquiryForm` (the wizard) →
    `EnquiryStepOccasion` / `Specifics` / `Details` / `Review`, plus
    `EnquirySentPanel`, `EnquiryTrustRail`, `AvailabilityCalendar`,
    `AvailabilityModal`, `WaitlistPopover`.
  - `packages/` — `PackageTierSection` (the tier section all four package
    pages share) with `PackageDish`, `PackageMenuGroup`, `PackageMenuItem`,
    `PackageMenuNote`; Reception's `ReceptionStations` → `StationsBrowser`
    → `StationCard`.
  - `home/`, `weddings/` — sections only one page uses (`HomeHero`,
    `HomeStory`, `HomeEventsSection`, `WeddingsPackages`,
    `WeddingsAvailability`, …).
- `.button` is deliberately NOT a component: it is a sitewide primitive
  (global.css) that scripts also create (Reception's stage "Add to
  selection") and other components style in context (`.nav-cta
:global(.button)`), so its styles must stay global anyway.
- `EnquirySection` props: `eventType` (sets the selected chip AND the
  initial visibility of every field enquiry.js toggles per type, so there is no
  post-load flash), `datePicker` (`inline` compact calendar, or `modal` for
  weddings, which has the full diary on the page), `eyebrow`, `railPhoto`;
  named slots `heading` and `lead`.
- Package pages (`src/pages/weddings/packages/`) are thin: hero, the
  shared `PackageTierSection` fed from `src/data/packages/<package>.ts`,
  the photo strip, enquiry. The package stylesheets are imported by the
  components that need them (`PackageTierSection.css`, `PackageDish.css`, `ReceptionStations.css`,
  each beside its component); only Beverage's page-specific overrides are
  imported by its page. Scripts: `package-tiers.js` / `reception-package.js`,
  which `import "./tabs.js"` themselves so `window.BacchusTabs` exists
  before they run.
- `src/data/gallery.ts` — the full gallery's photos and filters.
- `src/data/enquiry.ts` — event types and chip notes. Read by both
  `EnquirySection.astro` and `enquiry.js` — one list.
- `src/data/packages/` — the four packages' tiers and menus
  (`types.ts` has the shape, shaped for the drafted Sanity schemas) and
  Reception's sixteen stations. Catalogue house-style notes live at the top
  of each file.
- `src/data/navigation.ts` — both nav menus, for the bar and the drawer.
- `src/data/testimonials.ts` — the four testimonials. `Testimonials.astro`
  renders the picker cards and dots from it at build time; `testimonials.js`
  renders the active quote (it has to measure it to cap it at five lines).
- **Styles: global.css holds only what is genuinely sitewide** (cleaned
  2026-10-06, 10,299 lines down to ~870): design tokens, the reset and base
  element styles, the shared primitives (`.button` family, `.eyebrow`,
  `.lead`, headings, `.link-underline-inline`, `.wrap`, section padding,
  `.on-dark`, `.section-head`, `.split`, `.arch`), and sitewide behaviour
  hooks (`[data-reveal]`, the scroll lock, safe reveals, reduced motion).
  Everything else lives with what it styles: a component's or page's own
  scoped `<style>`, or, for styles several pages share without one owning
  component, a plain stylesheet those pages import (`tabs.css`,
  `gallery-grid.css`).
  **Keep it that way: a new rule goes in the file that renders the element.**
  **Where a stylesheet file lives says who owns it:** a plain `.css` file
  with one owner sits beside that owner and is named after it
  (`packages/PackageTierSection.css` beside `PackageTierSection.astro`; a
  page's own sheet beside the page with a leading underscore, `_beverage.css`,
  which Astro never treats as a route). `src/styles/` holds only files with
  no single owner: `global.css`, the shared `tabs.css` and `gallery-grid.css`,
  and the parked `secure-booking.css`.
  Elements a SCRIPT creates (calendar cells, particles, the testimonial
  quote's `<em>`) and elements rendered through a slot or by a child
  component don't carry the file's scoping attribute, so their rules wrap
  them in `:global()`, e.g. `.availability-grid :global(.availability-cell)`.
  `@keyframes` names are never scoped by Astro, so a component's keyframes
  live in its own `<style>` too; `shake` and `btn-shimmer-sweep` stay global
  because more than one component uses them.
- `src/styles/secure-booking.css` — the prototype's deposit page styles,
  parked: nothing imports it until that page is ported (roadmap step 4).
- Moving styles: `scripts/scope-styles.mjs <target> --select <regex>`
  moves matching rules out of global.css (or out of another file with
  `--from <file>`, or copies with `--keep`) and wraps foreign elements in
  `:global()` itself; take a
  `scripts/style-snapshot.mjs` baseline before, re-snapshot after,
  `scripts/style-diff.mjs` must show 0 changes, and
  `scripts/state-diff.mjs <old dist> <new dist>` must say "same" for every
  interaction state. When markup moves into components or data, also run
  `scripts/markup-diff.mjs <old dist> <new dist>`: it compares every
  element's tag, attributes and text, which the style snapshot can't see.
  `scripts/list-selectors.mjs <file>` lists a file's rules for planning. Expect run-to-run noise of a few hundredths of a pixel
  in mobile text widths (seen between two snapshots of the SAME build), and
  in the photo carousel's transition timing; anything else is real. If
  Playwright fails with "Target page, context or browser has been closed",
  that's the machine running out of headroom with too many parallel
  browsers, not the site — `--workers=2` passes. A baseline taken on an
  earlier DAY shows calendar cells changing state (the seeded statuses are
  relative to today), so re-take it. Node in Git Bash: `/tmp` means
  `C:\tmp`, not Git Bash's `/tmp`.
- `src/scripts/` — one module per feature, each loaded by the component or
  page that needs it, so a page only ships the JS it uses. `BaseLayout` loads
  `site.js` (loaded class, particles, `[data-reveal]`, safe reveals) and
  `site-nav.js` (bar, drawer, dropdowns). Components: `testimonials.js`,
  `enquiry.js` (EnquiryForm; imports `availability.js`), `faq.js`, `lightbox.js`,
  `photo-carousel.js` (PhotoCarousel). Pages: `tabs.js` + `home.js` (homepage), `availability.js` +
  `weddings.js`, `gallery-filter.js`, `package-tiers.js` /
  `reception-package.js`. Shared helpers in `src/scripts/lib/`:
  `motion.js` (reduced motion), `scroll-lock.js`, `safe-reveal.js`,
  `availability-hooks.js` (the two calls enquiry needs from the calendar).
- **Scroll lock:** every overlay calls `lockScroll(owner)` /
  `unlockScroll(owner)` — never touches body overflow itself. Where scrollbars
  take up space (desktop) the lock pins the page (body `position: fixed` at
  its scroll offset) and keeps the root's scrollbar track, so nothing shifts
  and no blank strip appears; on phones it's plain `overflow: hidden`, since
  pinning there moves scrollY to 0 and mobile Chrome's address bar reappears
  and resizes the viewport. (Padding the page by the scrollbar width was tried first
  and left a bright strip — see `lib/scroll-lock.js`.) Code that reads
  `window.scrollY` on scroll should ignore events while `isScrollLocked()`.
- **One lightbox:** `Lightbox.astro` + `lightbox.js` serve every photo on the
  site. Group photos with `data-lb-group`; `#ggrid .gallery-item`s group
  automatically and follow the gallery filter.
- **Entrance animations on content that must not go missing** use
  `data-reveal-safe` (one block) or `data-reveal-group` (children stagger in
  from the right) — see `lib/safe-reveal.js`. Visible by default; only armed
  below the fold, never in an inactive tier.
- Hero photos settle in (`.hero-media` scale 1.08 → 1), transform-only so
  Largest Contentful Paint isn't delayed.
- `/weddings/packages` redirects to `/weddings#packages` (`astro.config.mjs`).
- `src/assets/images/` — every photo, by subject; see Phase 2 above.

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
- **Whitespace is JSX-style (Astro 7's default `compressHTML: "jsx"`).** A
  line break between text and an inline element is DELETED, not rendered as a
  space. Write the space explicitly with `{" "}` at the end of the line
  (Prettier preserves these and adds them itself when it re-wraps a line that
  had a space). Porting the prototype lost 54 spaces this way ("ourBanquet",
  "RedLeicester") until a rendered-text diff against the prototype caught
  them. `compressHTML: true` (HTML rules) was tried and rejected: Prettier's
  Astro plugin formats with JSX rules, so the two would fight.
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
