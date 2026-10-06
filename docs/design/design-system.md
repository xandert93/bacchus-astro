# Design system

The look and the rules that keep it consistent. **Don't change any of this
without discussing it first.** For why specific features work the way they do,
see `decisions.md`.

---

## Palette

- **Ink** `--ink: #1c1a16`: a deliberately warm near-black.
- **Limestone and parchment**, **bronze and gold** accents, **oxblood**,
  **bottle green**.
- Chosen from the building's real materials (stone, iron, wine), not from
  generic "AI site" defaults.
- **Oxblood means "illustrative / unconfirmed"** sitewide. On dark
  backgrounds use `--oxblood-on-dark`, as `--green-on-dark` does for green.
- **Availability colours** (`--avail-green-*`, `--avail-amber-*`,
  `--avail-grey-*`) are additions for the calendar's three states, not changes
  to the core palette.

---

## Type

Three fonts, each with one job. Don't blur the roles.

| Font       | Used for                                          |
| ---------- | ------------------------------------------------- |
| Fraunces   | Headings only                                     |
| Newsreader | Body copy and any sentence-case text              |
| Inter      | Uppercase UI only: nav, buttons, labels, eyebrows |

Newsreader sits slightly high in its line box, so centring it next to an icon
or border can need a 1–2px nudge (bug #8).

---

## Buttons

- Pill-shaped.
- On hover: one crossfade plus a diagonal sheen sweep.
- Every button is the `<Button>` component (see the project `CLAUDE.md`).

---

## Motion

- **The portcullis bar-rise** on hero load is the signature device. Hero
  content animates in _after_ it has fully lifted, not alongside it.
- **Reveal on scroll** uses opacity plus a small lift. Never `clip-path`,
  which caused a real bug.
- **Content must never depend on an animation to become visible.** If the
  animation fails, the content must still be there. No entrance effect is
  worth losing information (bug #36).
- **Respect `prefers-reduced-motion`** everywhere: `@media (--reduced-motion)`
  in CSS, `reducedMotion` from `media-queries.js` in scripts.

---

## Layout and responsiveness

- **Check every change at every breakpoint**: mobile, tablet, laptop,
  desktop. Not just the one it was built at.
- **Prefer `clamp()`** over fixed sizes plus a breakpoint override.
- **Every breakpoint is named, and defined once** in
  `src/lib/media-queries.js`. CSS writes `@media (--below-desktop)` or
  `@media (--from-tablet) and (--below-desktop)`, never a pixel value;
  scripts and `<img sizes>` import `from` / `below` from the same file. Add
  a new breakpoint there, with a comment saying what changes at it, rather
  than writing a number in a component.
- **Breakpoint pairs never leave a gap**: the named queries use range syntax
  (`width < 980px` / `width >= 980px`), so a pair always meets exactly. This
  replaces the old `979.98px` / `980px` habit (bug #22).
- **Tablet starts at 621px; desktop at 980px.** Below 980px, the burger
  menu takes over and two-column blocks stack.
- **On mobile, the image comes first.** Any two-column copy + image block puts
  the image above the text once it stacks.

---

## Shapes

- **The arch** (large top corners, small bottom corners) echoes the venue's
  stone archways. It is a **homepage accent**, not a sitewide shape: the
  history photo, the Visit section photo (also on every page), the kitchen dish
  photos and the events tab photos.
- Don't extend it to other pages' images unless the client asks.
- Variants are modifier classes always paired with the base (`.arch
.arch-dish`), never ancestor selectors (`.dish .arch`), which can clash
  (bug #2).

---

## Spacing details

- **Hero rhythm**: crumb (not on the homepage) → heading → one paragraph →
  buttons, with a uniform 24px between each. Gallery and Menu heroes have no
  buttons on purpose.
- **Equal numbers don't always look equal.** A bordered element (chips, cards)
  directly under a label needs a few px more room than a plain input, even
  with the same margin.
- **Divided lists** put dividers between items only, never above the first or
  below the last. They are a different component from check lists, which have
  no dividers. Their vertical spacing is three linked values (bug #23).

---

## Interaction

- **Hover effects are for mice only.** Wrap `:hover` in
  `@media (--hover)` and give touch its own `:active` feedback (bug #19).
- **Not-currently-available isn't an error.** A booked date or a disabled step
  uses `cursor: auto`, not `not-allowed`.
- **Swipe components start native** (CSS scroll-snap), never a hand-rolled
  pointer drag (bugs #30 and #35).
- **Don't hide overflowing tabs behind a hidden scrollbar.** If a small, fixed
  number of items doesn't fit, make them fit (bug #13).

---

## Naming

- **No abbreviated class names** (`pk-card`). Use full, self-describing
  kebab-case, roughly the component name spelled out:
  `.package-dining-card` ↔ `<PackageDiningCard>`. Longer is fine.
- **Check a short or common class name isn't already in use** before adding it
  (bug #5).

---

## Imagery

- **Real Bacchus photography only.** Never add fabricated or stock images; ask
  the client instead. The one exception (the station images) is in
  `docs/content/client-facts.md`.
- The logo is the client's real mark.
