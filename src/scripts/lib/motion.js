// True when the visitor has asked their OS for reduced motion. Read once at
// load, as main.js always did.
export const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

// When an entrance animation fires: once the element's top has come 20% of
// the way up from the bottom of the viewport. Was 8% until 2026-10-05,
// which revealed photo strips, dish tiles and the stations browser while
// only a sliver of them was on screen, so most of the animation played
// where nobody was looking. One value for every reveal on the site, so they
// all feel the same; tune it here.
export const REVEAL_ROOT_MARGIN = "0px 0px -20% 0px"
// The scroll-settle backstops sweep in anything whose top is above this
// fraction of the viewport height — the same line as the rootMargin.
export const REVEAL_SWEEP_LINE = 0.8

// True once the page can't scroll any further. With the trigger line 20%
// up, an element near the very end of a page might never reach it, so the
// backstops reveal everything still on screen once the bottom is reached.
export const isScrolledToBottom = () => {
  const doc = document.documentElement
  return window.scrollY + window.innerHeight >= doc.scrollHeight - 2
}
