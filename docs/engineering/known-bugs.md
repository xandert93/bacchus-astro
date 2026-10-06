# Known bugs (don't reintroduce)

Bugs that were found and fixed, kept as the lesson each one taught. Code
comments cite them by number ("CLAUDE.md bug #14", "bug #2"): the numbers
are permanent, so **never renumber; add new ones at the end.**

When a fix touches one of these areas, consider encoding the bug as a test.

Three are still **open**: #28 (desktop part), #31 and #34 (desktop part).

---

## Contents

- **CSS cascade and specificity**: #2, #5, #10, #14, #15, #22, #29
- **Transitions and timing**: #1, #7, #12, #17, #34
- **Touch and hover**: #11, #19, #28, #29, #30, #35
- **Layout and sizing**: #8, #13, #20, #21, #23, #24
- **JavaScript state**: #4, #9, #16, #25, #32, #33, #34
- **Performance and rendering**: #26, #27, #31, #32
- **Other**: #3, #6, #18, #36

---

## 1. Image reveals need a frame boundary

Gate scroll reveals on the image having loaded, and wait two
`requestAnimationFrame`s before adding the reveal class. Otherwise there's no
frame to animate from and the transition is skipped.

## 2. Same-specificity `transition` rules replace each other whole

Two equally specific rules setting `transition` on one element don't merge:
the later one wins outright and the other's properties are lost. Caused the
"grey blob, then instant snap" bug. Arrange rules so they can't both apply.

## 3. Don't animate `clip-path` on a flex container

Fragile across browsers (the mobile menu). Use opacity and scale.

## 4. Shared scripts must survive missing elements

One null reference once killed everything after it in the script, including
the burger menu. Any code for a page-specific widget must do nothing, cleanly,
when its markup isn't on the page.

## 5. Generic class names collide

A calendar cell named `.section-padding` inherited a global utility of the
same name. Check a name isn't already used before adding it.

## 6. Buttons in a form submit by default

Set `type="button"` on every button that isn't the submit. (`<Button>` does
this by default.)

## 7. A class swap in the same tick can skip its transition

Swapping a class straight after rebuilding the DOM can be merged into one
paint with nothing to animate from. Sequence it on a fixed `setTimeout`
(fade out → swap → fade in). Nested `requestAnimationFrame`s can still be
merged.

## 8. Newsreader sits high in its line box

Centred correctly by the numbers, it still looks too high next to a
same-sized element: a bias in the font, not the CSS. Nudge it a px or two, or
use Inter where the serif isn't needed.

## 9. `form.reset()` doesn't clear hidden inputs

Hidden inputs holding derived state (the calendar's date) must be cleared by
hand after a reset.

## 10. Inline styles beat every media query

An inline `grid-template-columns` silently overrode the mobile layout. Put
layout in classes, and give desktop-only rules a `min-width` query that can't
overlap the mobile `max-width` ones.

## 11. Drag components need `touch-action`

Without `touch-action: pan-y`, touch can't tell a sideways drag from a page
scroll, and the drag never starts.

## 12. Inline `transitionDelay` delays every transition

A stagger delay set from JS also delayed the link's hover colour. Put the
delay in a custom property (`var(--m-delay, 0s)`) used only on the entering
transitions, and set that from JS.

## 13. Hidden-scrollbar overflow is invisible

A tab bar overflowed on mobile and clipped "Celebrations" to "CELEB" with no
hint it scrolled. For a small, fixed number of items, make them fit (equal
widths) instead of scrolling.

## 14. A new override can be less specific than the rule it fights

`.quote blockquote` beat a later `.testimonial-quote`, so every "make it
smaller" did nothing. Before relying on an override, check what already
targets the element and how specifically.

## 15. A class toggle can lose to an existing state class

A fade class lost to `[data-reveal].is-revealed`, so it toggled in the DOM
with no visible effect. Inline styles from JS sidestep the fight.

## 16. A self-stopping animation loop needs one restart path

The testimonial timer stopped at 100% and some actions never restarted it.
Route every change through one function that decides play or pause.

## 17. `nth-child` stagger delays apply in both directions

Leaving was delayed too, so the fifth star never animated out before coming
back in. Scope stagger delays to the entering state only.

## 18. `-webkit-line-clamp` fails on centred text

It can silently not clamp at all. For centred text, measure in JS and trim
words until it fits.

## 19. Ungated `:hover` sticks on touch

A tapped control stays in its hover style until something else is tapped.
Wrap `:hover` in `@media (hover: hover)` and give touch its own `:active`
feedback.

- The test is "is the element still visible after the tap?", not "is it a
  link?". Links to unbuilt pages go nowhere, and even a real navigation leaves
  the element on screen during the fade.
- Gate on pointer type, never on viewport width: a narrow laptop window still
  has a mouse.
- `[aria-current="page"]` is not a hover state; keep it outside the gate.

## 20. A non-shrinking button sets the breakpoint

A `flex-shrink: 0`, `nowrap` button overflows its card instead of shrinking.
In a fluid column the minimum width comes from the button, measured with the
container's padding. Fixed with a small-button band at 621–699.98px.

## 21. `aspect-ratio` on a stretched grid item runs backwards

When a row's height is set first, the ratio computes a width from it and
forces a minimum height. Set `aspect-ratio: auto` explicitly there; a ratio
is fine once the item owns its own row.

## 22. Whole-number breakpoint pairs leave a gap

`max-width: 980px` / `min-width: 981px` misses 980.01–980.99px (zoom,
fractional pixel ratios). Write every `max-width` .02 below its partner:
`979.98px` / `980px`.

## 23. Divided-list spacing is three linked values

On the divided lists: the grid gap is zero, an optical nudge
(`--tab-panel-item-optical-nudge`) moves Newsreader down, and the bullet
position derives from that nudge. Change one, check the other two. Package
menus reuse this component.

## 24. Stacked grids need one shared gap token

Two grids stacked to read as one set of columns drifted apart. Use one token
(`--package-grid-column-gap`), not two equal numbers.

## 25. Seed CSS-driven state before the markup it styles

The gallery filter is pure CSS, but the radio was checked from a script at
the end of the page, so every photo flashed first. Set it with an inline
script placed before the grid. Deferring it brings the flash back.

## 26. Reveal the whole tile, not just its image

The expand badge sat on a blank card while the photo faded in. Hide it until
the tile is revealed and fade it in with the image. Gate this on
`[data-reveal="img"]`, or tiles that never reveal lose the badge for good.

## 27. Invisible elements can still cost a layer

`opacity: 0` elements with `backdrop-filter` (gallery tags on touch) were
still composited every frame. Use `display: none` where they can never
show.

## 28. On touch, a slow selection transition feels like lag

Without hover to preview it, a 0.3s fade is the "did my tap work?" delay.
Shortened under `@media (hover: none)`, changing duration only.

**Open:** the same lag on desktop. The shorter duration there is unverified;
slow image loading is a likelier cause.

## 29. Touch holds `:active` past the click

A toggle button flashed white because `:active` was still on when its pressed
state flipped. Toggles get no press fill on touch; the state change is the
feedback. Check what a toggle looks like mid-flip, not only at rest.

## 30. JS drag fights the scroll container's CSS

`scroll-behavior: smooth` eased every drag step, and mandatory scroll-snap
pulled the track back. Turn both off while dragging; restore snapping only
once the release glide has settled.

## 31. Rotating chevron shimmers (open)

Two real faults fixed: the box must match the viewBox ratio (3:2) with
whole-pixel centres (12×8, 18×12), and the glyph has its own layer. Neither
cured it.

**Untested:** check another screen or pixel ratio first (cheaper), then try a
thicker stroke or a filled triangle.

## 32. Element scroll events don't reach `window`

The "pause effects while scrolling" guard listened on `window`; once the
drawer scrolled inside its own container, it stopped firing. When a scroll
container moves, recheck every listener that watched the old one.

- The grain overlay (blended over the whole viewport) is also hidden while
  the drawer is open.
- The nav bar's blur is off while the drawer is open.
- The drawer's reset waits until its fade-out ends.
- `scrollbar-gutter: stable` stops a reflow when the drawer starts to scroll.
- Ruled out: the drawer's centring doesn't jump.

## 33. A breakpoint hides a control, not its state

Opening the drawer on tablet and widening the window left the page unable to
scroll. Anything a breakpoint hides needs a `matchMedia` change listener to
undo its state: above all scroll locks, focus traps and `aria-expanded`. The
same applies to an open desktop panel when the window narrows.

## 34. Back/forward cache restores a half-finished fade

Tapping a link starts the menu's fade-out; the page is frozen mid-fade and
shows it on Back. Android's back-swipe preview is a screenshot taken at that
moment, so nothing done on return can fix it.

**Fix the departure, not the arrival**: close instantly, with transitions
off, inside the click that navigates.

- Two forced reflows: one before the menu closes, one before transitions come
  back on.
- Only for links that leave the page; others keep the animated close.
- On restore, close menus and overlays but keep where the visitor was
  (scroll, carousel, filter, wizard step). Don't replay entrance animations.
- Don't opt out of the cache (`no-store`); it slows every Back.
- The transition kill switch is `!important` on purpose (a dozen selectors
  would otherwise need out-specifying), and is released after two nested
  `requestAnimationFrame`s, not one.

**Open, desktop dropdown:** still flashed on Back after four attempts (last
recorded 2026-10-02). The panel stays open while any of three things holds
it (`.is-open`, hover, `:focus-within`), and clearing all three is fragile.
**Try next**: one `.is-dismissed` class that forces it closed with
`!important`, set on a navigating click and cleared on the next open and on
`pageshow`.

## 35. Pointer events can't stop a page scroll

The package tier swipe stuttered: a hand-rolled drag called
`preventDefault()` on `pointermove`, which doesn't stop scrolling, so the page
scrolled and the tiers slid at the same time. `touch-action` is fixed when the
gesture starts, so JS can't win that race. Replaced with native scroll-snap.
**Build every swipe component on native scrolling.**

## 36. Content hidden until animated can stay hidden

Package menu items went missing on mobile for two separate reasons:

- An observer with `threshold: 0.18` can never fire for a block taller than
  about 5.5 screens, and a fast fling can skip it; the callback also dropped
  elements without unobserving them.
- Every menu item also inherited a homepage list rule starting it at
  `opacity: 0`, which nobody looked at for three attempts.

The fix was to remove the per-item animation: **content is visible by
default**, and no entrance effect is worth losing information. Look for every
rule that can hide an element, not just the obvious one.
