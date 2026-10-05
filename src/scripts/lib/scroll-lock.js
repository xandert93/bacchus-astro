// One page-scroll lock for every overlay: the mobile drawer, the lightbox and
// the weddings quick-pick modal.
//
// How it locks: the page is pinned in place (body position: fixed, offset by
// the current scroll) rather than having its overflow hidden, and on a
// browser with a classic scrollbar the root keeps `overflow-y: scroll`, so
// the scrollbar's track STAYS where it is. Nothing changes width, so nothing
// shifts, and there's no gap where a scrollbar used to be. Only the thumb
// disappears, because there's briefly nothing to scroll.
//
// History, so it isn't re-tried: the first version (2026-10-04) hid the
// overflow and padded the page by the scrollbar's width. That stopped the
// shift, but the 15px strip the scrollbar left behind showed the page's own
// near-white background, which read as a bright flash beside a dark overlay
// as it faded in and out. `scrollbar-gutter: stable` has the same strip
// problem permanently. Pinning the page avoids the strip entirely, and is
// also what actually stops iOS Safari scrolling underneath an overlay,
// which `overflow: hidden` on the body doesn't.
//
// Keyed by owner rather than counted, so a close path that runs without its
// open (the drawer's bfcache guard does) can't release someone else's lock.

const holders = new Set()
const root = document.documentElement
let lockedScrollY = 0

export function lockScroll(owner) {
  if (holders.size === 0) {
    lockedScrollY = window.scrollY
    // Only reserve the track where a scrollbar actually takes up space;
    // forcing one onto a page that had none would itself cause a shift.
    const hasScrollbar = window.innerWidth - root.clientWidth > 0
    root.classList.toggle("is-scroll-locked-keep-scrollbar", hasScrollbar)
    root.classList.add("is-scroll-locked")
    document.body.style.top = -lockedScrollY + "px"
  }
  holders.add(owner)
}

export function unlockScroll(owner) {
  if (!holders.delete(owner) || holders.size > 0) return
  root.classList.remove("is-scroll-locked", "is-scroll-locked-keep-scrollbar")
  document.body.style.top = ""
  // Back to exactly where the visitor was, instantly: the site sets
  // scroll-behavior: smooth on <html>, which would otherwise animate this
  // from the top of the page.
  window.scrollTo({ top: lockedScrollY, behavior: "instant" })
}

export function isScrollLocked() {
  return holders.size > 0
}
