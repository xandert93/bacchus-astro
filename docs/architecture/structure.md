# Code structure

Where things live in `src/` and the rules that keep it that way. The short
version is in `CLAUDE.md`; this is the full map.

---

## Pages and layout

- `src/layouts/BareLayout.astro`: the head and global styles only, for
  tooling pages like `/sandboxes`. Both layouts share
  `components/layout/SiteHead.astro`.
- `src/layouts/BaseLayout.astro`: `<head>`, grain, nav, drawer, Visit
  section, footer, the sitewide script. Props: `title`, `showEnquireLink`,
  `menuBackgroundImage`, `showVisitSection`, `checkout` (SiteHeader's
  checkout bar, filled from the `header` slot, and no drawer) and `noIndex`.
  Has a named slot `after-footer` for page overlays.
- `/secure-booking`, the deposit page (a draft), is a checkout: brand-only bar, no
  drawer, kept out of search results, never linked from the site. It reads
  the placeholder booking in `src/data/demo-booking.ts`.
- **Pages compose; components hold the markup.** A page file is frontmatter
  plus a list of sections (the homepage is about 45 lines). Content that
  repeats or will come from Sanity lives in `src/data/` and is rendered with
  `map()`; one-off copy stays in the component that shows it.
- **Import with the path aliases** (`tsconfig.json`): `@components/…`,
  `@layouts/…`, `@data/…`, `@lib/…`, `@scripts/…`, `@styles/…`,
  `@assets/…`, never `../../../`, so files can move without breaking
  imports.
- Package pages (`src/pages/weddings/packages/`) are thin: hero, the shared
  `PackageTierSection` fed from `src/data/packages/<package>.ts`, the photo
  strip, enquiry. Only Beverage has page-specific overrides
  (`_beverage.css`, imported by its page).
- `/weddings/packages` redirects to `/weddings#packages` (`astro.config.mjs`).

---

## Draft pages

Unfinished pages live on `main` but are never built for the live site, so
there is no long-lived branch to keep rebasing (trunk-based development).

- **Where**: the page in `src/drafts/`, outside `src/pages/`, with its own
  files beside it. Each draft is one entry in `src/drafts/registry.ts`
  (route, page file, stage, description, dates), alongside the prototype's
  sandboxes.
- **Who builds them**: `src/integrations/draft-pages.ts` adds their routes
  in `astro dev`, and in any build run with `INCLUDE_DRAFTS=true` (the
  Playwright build; later, Vercel's preview builds). A plain `astro build`,
  the live site, leaves them out, and fails if a draft got in anyway.
- **`/sandboxes`** (`src/drafts/sandboxes.astro`, on `BareLayout`) lists
  every draft and prototype sandbox by stage. The footer links to it only
  when drafts are built (`import.meta.env.DRAFTS_INCLUDED`). Prototype copies
  show only on a machine that has `public/prototype/`.
- **Tests**: the Playwright build includes drafts, so a draft goes in
  `tests/e2e/pages.spec.ts` like any page.
- **Finishing a draft**: move its page into `src/pages/` and remove its
  registry entry.

---

## Components

`src/components/`, grouped by what the component is for:

- `ui/`: small reusable parts. `Button`, `Photo`, `HeroImage`,
  `GalleryTile`, `Lightbox`, `CheckList`, `SocialLinks`, `ArrowIcon`,
  `Particles`, `ProposedBadge` (the pill on every link to an unbuilt page),
  `FaqAccordion` (the questions and answers inside `FaqSection`, also used
  on its own).
- `forms/`: form controls. `FormField` (label, error, notes), `TextInput`
  (every input and the textarea), `ChipGroup`, `OptionCardGroup`. Used by the
  enquiry wizard and the waitlist popover.
- `layout/`: chrome on every page. `SiteHeader`, `MobileMenu`,
  `SiteFooter`, `VisitSection`.
- `nav/`: `NavDropdown` (one desktop dropdown), `MobileNavGroup` (one drawer
  group), `NavChevron`, `NavItemIcon`, `NavPanelPhoto`. Both bars render from
  `src/data/navigation.ts`.
- `sections/`: sections several pages share. `HeroFrame` (the hero shell)
  and `PageHero` on top of it, `IntroSplit`, `FaqSection`, `ProcessSteps`,
  `GalleryPreview`, `Testimonials`, `OccasionCards`, `PhotoCarousel`.
- `enquiry/`: `EnquirySection` (layout) → `EnquiryForm` (the wizard) →
  `EnquiryStepOccasion` / `Specifics` / `Details` / `Review`, plus
  `EnquirySentPanel`, `EnquiryTrustRail`, `AvailabilityCalendar`,
  `AvailabilityModal`, `WaitlistPopover`.
- `packages/`: `PackageTierSection` (the tier section all four package pages
  share) with `PackageDish`, `PackageMenuGroup`, `PackageMenuItem`,
  `PackageMenuNote`; Reception's `ReceptionStations` → `StationsBrowser` →
  `StationCard`.
- `home/`, `weddings/`: sections only one page uses (`HomeHero`,
  `HomeStory`, `HomeEventsSection`, `WeddingsPackages`,
  `WeddingsAvailability`, …).
- `secure-booking/`: the deposit page's sections (`SecureBookingHero`,
  `BookingSummary`, `DepositPaymentOptions` with its `BankDetailRow`s,
  `PaymentSupport`, `PaymentFaq`, `BookingAssurances`, `PaymentHelpButton`),
  the `SecureBookingIntro` heading block they share, `SecureCheckoutBadge`
  for the bar, and `SecureBookingIcon`, the page's line icons.

### `<Button>`

Every button is `<Button>` (`ui/Button.astro`).

- `href` makes an `<a>`; `as="span"` a decorative pill inside a card that is
  itself the link; otherwise a `<button>` (`type="button"` by default).
- `variant` (gradient · ghost · dark · light · gold-outline), `small`,
  `shimmer` and `arrow` (the trailing `ArrowIcon`) set the look. Any other
  attribute, or a `class`, goes straight onto the element, so parents still
  style buttons in context. `Button.astro` owns every `.button` style.
- **A button a script adds is copied from a hidden `<template>` Button**,
  never built with `createElement`, so it carries the component's scoping
  like the rest. Reception's stage "Add to selection" does this, from
  `StationsBrowser`.

### `<EnquirySection>`

- `eventType` sets the selected chip AND the initial visibility of every
  field `EnquiryForm.js` toggles per type, so there is no flash after load.
- `datePicker`: `inline` (the compact calendar) or `modal` (weddings, which
  has the full diary on the page).
- Also `eyebrow` and `railPhoto`; named slots `heading` and `lead`.

---

## Data

- `src/data/navigation.ts`: both nav menus, for the bar and the drawer.
- `src/data/gallery.ts`: the full gallery's photos and filters.
- `src/data/enquiry.ts`: event types and chip notes. Read by both
  `EnquirySection.astro` and `EnquiryForm.js`: one list.
- `src/data/packages/`: the four packages' tiers and menus (`types.ts` has
  the shape, modelled on the drafted Sanity schemas) and Reception's sixteen
  stations. Catalogue house-style notes are at the top of each file.
- `src/data/contact.ts`: the venue's phone and email, for the Visit section
  and the deposit page's support cards.
- `src/data/demo-booking.ts`: the deposit page's placeholder booking, in
  the shape a real one will take.
- `src/data/testimonials.ts`: the four testimonials. `Testimonials.astro`
  renders the picker cards and dots from it at build time; `Testimonials.js`
  renders the active quote (it has to measure it to cap it at five lines).
- `src/lib/media-queries.js`: every breakpoint and media query, for CSS,
  scripts and `<img sizes>` (see `docs/design/design-system.md`).
- `src/lib/images.ts`: every photo, by key (see
  `docs/engineering/images.md`).

---

## Styles

- **`global.css` holds only what is genuinely sitewide**: design tokens, the
  reset and base element styles, the shared primitives (`.eyebrow`, `.lead`,
  headings, `.link-underline-inline`, `.wrap`, section padding, `.on-dark`,
  `.section-head`, `.split`, `.arch`), and sitewide behaviour hooks
  (`[data-reveal]`, the scroll lock, safe reveals, reduced motion). Cleaned
  on 2026-10-06 from 10,299 lines to about 570.
- Everything else lives with what it styles: a component's or page's own
  scoped `<style>`, or, for styles several pages share without one owning
  component, a plain stylesheet those pages import (`tabs.css`,
  `gallery-grid.css`). **A new rule goes in the file that renders the
  element.**
- **Where a file lives says who owns it.** A `.css` or `.js` file with one
  owner sits beside that owner and is named after it
  (`packages/PackageTierSection.css` beside `PackageTierSection.astro`). A
  page's own file sits beside the page with a leading underscore
  (`_beverage.css`, `_gallery.js`; a draft's `_secure-booking.css`), which Astro never
  treats as a route. `src/styles/` holds only files with no single owner:
  `global.css` and the shared `tabs.css` and `gallery-grid.css`.
- **`_secure-booking.css` is one page-level stylesheet**, not a `<style>` per
  component: it was ported whole, in its own `secure-booking-*` namespace.
  Splitting it into the components is a later pass.
- **Elements without the file's scoping attribute need `:global()`.** That
  means elements a script creates (calendar cells, particles, the
  testimonial quote's `<em>`) and elements rendered through a slot or by a
  child component: `.availability-grid :global(.availability-cell)`.
- **`@keyframes` names are never scoped by Astro**, so a component's
  keyframes live in its own `<style>`. `shake` and `btn-shimmer-sweep` stay
  global because more than one component uses them.

---

## Scripts

- **Scripts sit beside what they drive**, named after it, and the component
  loads its own (`<script>import "./EnquiryForm.js"</script>`). A page ships
  only the JS for the components it renders and never has to know which
  scripts they need.
- Component scripts: `EnquiryForm.js` (imports `AvailabilityCalendar.js` so
  the calendar runs first), `AvailabilityCalendar.js` (every calendar, the
  quick-pick modal and the waitlist popover), `Testimonials.js`,
  `FaqAccordion.js`, `Lightbox.js`, `PhotoCarousel.js`,
  `PackageTierSection.js` (the one tier controller for all four package
  pages), `ReceptionStations.js` (Reception's Stations only), `HomeStory.js`
  (the counters), `HomeMarquee.js`, `WeddingsPackages.js` (the triptych's
  row reveal). The two package scripts `import "@scripts/tabs.js"`
  themselves, so the tabs exist before they run. The gallery page's filter
  seed is `pages/_gallery.js`.
- `src/scripts/` keeps only what has no single owner: `site.js` (loaded
  class, particles, `[data-reveal]`, safe reveals; loaded by `BaseLayout`),
  `site-nav.js` (bar, drawer and dropdowns together), `tabs.js` (the
  homepage tabs and the package tier switcher), and `lib/`: `motion.js`
  (reduced motion), `scroll-lock.js`, `safe-reveal.js`,
  `availability-hooks.js` (the two calls enquiry needs from the calendar).

### Shared behaviour

- **Scroll lock:** every overlay calls `lockScroll(owner)` /
  `unlockScroll(owner)` and never touches body overflow itself. Where
  scrollbars take up space (desktop) the lock pins the page (body
  `position: fixed` at its scroll offset) and keeps the root's scrollbar
  track, so nothing shifts and no blank strip appears. On phones it's plain
  `overflow: hidden`, since pinning there moves `scrollY` to 0, and mobile
  Chrome's address bar reappears and resizes the viewport. (Padding the page
  by the scrollbar width was tried first and left a bright strip; see
  `lib/scroll-lock.js`.) Code that reads `window.scrollY` on scroll should
  ignore events while `isScrollLocked()`.
- **One lightbox:** `Lightbox.astro` + `Lightbox.js` serve every photo on the
  site. Group photos with `data-lb-group`; `#ggrid .gallery-item`s group
  automatically and follow the gallery filter.
- **Entrance animations on content that must not go missing** use
  `data-reveal-safe` (one block) or `data-reveal-group` (children stagger in
  from the right); see `lib/safe-reveal.js`. Visible by default; only armed
  below the fold, never in an inactive tier.
- **Hero photos settle in** (`.hero-media` scale 1.08 → 1), transform-only so
  Largest Contentful Paint isn't delayed.
- **Swapping an existing `<img>`'s `src` must wait on `img.decode()`** before
  revealing it. Browsers keep painting the previous bitmap until the new one
  is decoded, so any reused image (lightbox, stations stage) otherwise
  flashes the old photo. Found and fixed in three separate controllers
  (2026-09-30 and 2026-10-04), each with its own copy: one reason the
  lightbox became a single component.
