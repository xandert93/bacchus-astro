// One page-scroll lock for every overlay: the mobile drawer, the lightbox and
// the weddings quick-pick modal. Each used to set document.body.style.overflow
// itself.
//
// Why it compensates: on a desktop browser with a classic scrollbar, hiding
// the page's overflow removes the scrollbar, the page gets ~15px wider, and
// everything centred shifts sideways behind the overlay as it animates in —
// then back again on close. So before locking, this measures the scrollbar
// and pads the page (and the fixed nav, which isn't inside the page's flow)
// by exactly that much for as long as the lock is held, and nothing moves.
// On phones and on macOS's overlay scrollbars the measured width is 0 and the
// padding is a no-op.
//
// Why not `scrollbar-gutter: stable` (one line of CSS): it reserves the
// gutter permanently, and full-viewport fixed overlays can't paint into a
// reserved gutter, so every dark overlay would show a pale strip down its
// right edge.
//
// Keyed by owner rather than counted, so a close path that runs without its
// open (the drawer's bfcache guard does) can't unlock someone else's lock.

var holders = new Set()
var root = document.documentElement

export function lockScroll(owner) {
  if (holders.size === 0) {
    // Measured BEFORE locking, while the scrollbar still exists.
    var scrollbarWidth = window.innerWidth - root.clientWidth
    root.style.setProperty("--scrollbar-compensation", scrollbarWidth + "px")
    root.classList.add("is-scroll-locked")
  }
  holders.add(owner)
}

export function unlockScroll(owner) {
  if (!holders.delete(owner) || holders.size > 0) return
  root.classList.remove("is-scroll-locked")
  root.style.removeProperty("--scrollbar-compensation")
}

export function isScrollLocked() {
  return holders.size > 0
}
