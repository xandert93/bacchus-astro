// One page-scroll lock for every overlay: the mobile drawer, the lightbox and
// the weddings quick-pick modal.
//
// Two ways of locking, chosen by whether the browser's scrollbar takes up
// space:
//
//   • Classic scrollbar (most desktop browsers): the page is PINNED — body
//     position: fixed at its scroll offset — and the root keeps its
//     scrollbar track (overflow-y: scroll). Nothing changes width, so
//     nothing shifts, and there's no gap where the scrollbar was; only the
//     thumb disappears.
//   • Overlay scrollbars (phones, tablets, macOS by default): plain
//     overflow: hidden, because there is no scrollbar width to lose.
//
// History, so neither is re-tried:
//   1. 2026-10-04: overflow hidden + padding the page by the scrollbar width.
//      No shift, but the 15px strip the scrollbar left showed the page's
//      near-white background — a bright flash beside every dark overlay.
//      (`scrollbar-gutter: stable` has the same strip, permanently.)
//   2. 2026-10-05: pinning everywhere. Fixed the strip, but on phones it
//      caused a flash of its own: pinning drops window.scrollY to 0, and
//      mobile Chrome shows its address bar whenever the page is at the
//      top, so the viewport resized under the opening overlay and again on
//      close. Phones never had the strip problem, so they don't pin.
//
// Keyed by owner rather than counted, so a close path that runs without its
// open (the drawer's bfcache guard does) can't release someone else's lock.

const holders = new Set()
const root = document.documentElement
let pinnedScrollY = null

export function lockScroll(owner) {
  if (holders.size === 0) {
    const hasScrollbar = window.innerWidth - root.clientWidth > 0
    root.classList.add("is-scroll-locked")
    if (hasScrollbar) {
      pinnedScrollY = window.scrollY
      root.classList.add("is-scroll-locked-pinned")
      document.body.style.top = -pinnedScrollY + "px"
    }
  }
  holders.add(owner)
}

export function unlockScroll(owner) {
  if (!holders.delete(owner) || holders.size > 0) return
  root.classList.remove("is-scroll-locked", "is-scroll-locked-pinned")
  if (pinnedScrollY === null) return
  document.body.style.top = ""
  // Back to exactly where the visitor was, instantly: the site sets
  // scroll-behavior: smooth on <html>, which would otherwise animate this
  // from the top of the page.
  window.scrollTo({ top: pinnedScrollY, behavior: "instant" })
  pinnedScrollY = null
}

export function isScrollLocked() {
  return holders.size > 0
}
