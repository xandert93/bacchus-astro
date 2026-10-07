// Every media query on the site, defined once.
//
// CSS uses them as custom media, `@media (--below-desktop) { … }`, which
// postcss.config.mjs fills in at build time from this file (custom media is
// the CSS standard for named queries; browsers don't support it yet, so the
// build does it). Scripts and `<img sizes>` import the same values from here,
// so a breakpoint changed in this file changes everywhere at once.
//
// Each breakpoint is the width, in px, at which the WIDER layout starts.
// For every one there are two queries: `--from-<name>` (that width and up)
// and `--below-<name>` (anything narrower). They're written in range syntax,
// `(width < 980px)` / `(width >= 980px)`, so a pair can never leave a gap or
// overlap between them, which the old `max-width: 979.98px` habit existed to
// avoid (the .98 breakpoint pairing).
//
// Restart the dev server after editing this file: the PostCSS config only
// reads it at startup.

export const breakpoints = {
  // ---- Sitewide ----
  // Phones below; tablet layouts from here.
  tablet: 621,
  // The burger nav takes over below, and two-column blocks stack
  // (docs/design/decisions.md: four items, two buttons and the logo need
  // about 890px).
  desktop: 980,

  // ---- Shared by a few components ----
  // Below: the availability calendar and the occasion chips tighten up for
  // the smallest phones.
  largePhone: 481,
  // Below: the nav dropdown's items go to one column. 621 to 699px is the
  // stations and wedding triptych's small-button band (the non-shrinking button
  // overflow). From here, Beverage's lists go to two columns.
  wideTablet: 700,
  // Below: hero content sits higher and the homepage scroll cue hides. The
  // prototype's burger cut-over; the burger itself moved to `desktop`.
  heroFull: 821,

  // ---- One component each ----
  // EnquiryStepReview: each review row's label and answer sit side by side
  // from here, stacked below.
  enquiryReviewColumns: 521,
  // EnquiryForm: the wizard's step tabs show their labels from here.
  wizardStepLabels: 561,
  // HomeStory and HomeEventsSection: text beside the photo from here; below,
  // the photo moves above the text.
  homeTwoColumn: 761,
  // HomeStory and HomeEventsSection: the lead keeps its reading measure
  // from here; below, it runs the full width.
  homeLeadMeasure: 901,
  // PackageTierSection: the desktop tier layout and the sticky tier switch
  // from here; the stacked mobile layout below.
  packageTiersDesktop: 841,
  // ReceptionStations: the desktop index from here; the mobile and tablet
  // view, with category tabs, below.
  stationsDesktop: 860,
  // The enquiry form beside its trust rail from here; one column below.
  enquiryTwoColumn: 921,
  // ReceptionStations, hybrid layout: two cards plus a peek from here; one
  // card plus a peek from 980px up to this.
  stationsHybridWide: 1122,
  // SiteHeader and NavDropdown: full nav spacing from here; tighter spacing
  // from 980px up to this, so the bar still fits.
  navFull: 1180,

  // ---- The deposit page ----
  // Carried over from the outside (Lovable) design the page ports, whose
  // breakpoints were Tailwind's sm, md and lg. Kept to that page only.
  // From here: the header badge and the help button show their labels, the
  // booking summary sits in its card, and the support cards go to two
  // columns.
  secureBookingSmall: 640,
  // From here: the three assurances at the foot of the page sit in a row.
  secureBookingMedium: 768,
  // From here: the booking summary and the two ways to pay go side by side,
  // and the support cards go to three columns.
  secureBookingLarge: 1024,
}

// Pointer and preference queries, named so their intent reads in place.
export const hover = "(hover: hover)"
export const noHover = "(hover: none)"
export const reducedMotion = "(prefers-reduced-motion: reduce)"

const queriesFor = (toQuery) =>
  Object.fromEntries(
    Object.entries(breakpoints).map(([name, width]) => [name, toQuery(width)]),
  )

// For scripts and `<img sizes>`: `window.matchMedia(from.desktop)`.
export const from = queriesFor((width) => `(width >= ${width}px)`)
export const below = queriesFor((width) => `(width < ${width}px)`)

// The CSS definitions, in custom media syntax, for postcss.config.mjs.
const kebabCase = (name) => name.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())
export const customMediaDefinitions = [
  ...Object.keys(breakpoints).flatMap((name) => [
    `@custom-media --from-${kebabCase(name)} ${from[name]};`,
    `@custom-media --below-${kebabCase(name)} ${below[name]};`,
  ]),
  `@custom-media --hover ${hover};`,
  `@custom-media --no-hover ${noHover};`,
  `@custom-media --reduced-motion ${reducedMotion};`,
].join("\n")
