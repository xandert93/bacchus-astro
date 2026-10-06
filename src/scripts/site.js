// Sitewide behaviour every page needs, loaded once by BaseLayout:
// the .loaded class the hero entrance waits on, the footer year, the
// ambient particles, and the scroll reveals for [data-reveal].

import {
  isScrolledToBottom,
  reduce,
  REVEAL_ROOT_MARGIN,
  REVEAL_SWEEP_LINE,
} from "./lib/motion.js"
import "./lib/safe-reveal.js"

requestAnimationFrame(() => {
  document.body.classList.add("loaded")
})
const yrEl = document.getElementById("yr")
if (yrEl) yrEl.textContent = new Date().getFullYear()

// ---------- Ambient particles ----------
if (!reduce) {
  ;[
    ["particles", 20],
    ["particles2", 10],
  ].forEach((cfg) => {
    const pf = document.getElementById(cfg[0])
    if (!pf) return
    for (let pi = 0; pi < cfg[1]; pi++) {
      const p = document.createElement("div")
      p.className = "particle"
      p.style.left = Math.random() * 100 + "%"
      p.style.animationDuration = 9 + Math.random() * 10 + "s"
      p.style.animationDelay = Math.random() * 12 + "s"
      pf.appendChild(p)
    }
  })
}

// ---------- Scroll reveals ----------
// A reveal observer must never be able to lose an element: anything it
// drops stays at opacity 0 forever, i.e. content silently missing from
// the page. Both observers below used to run at threshold: 0.18 and act
// only `if (e.isIntersecting)`, dropping every other entry without
// unobserving, and that could strand an element two ways — both of them
// specific to narrow screens, which is why it went unnoticed so long:
//
//   1. 18% of a TALL element is a lot of pixels. Single-column mobile
//      layouts make blocks far taller than their desktop equivalents,
//      and anything taller than ~5.5 viewports can never be 18% visible
//      at once, so the callback never fires for it at all.
//   2. A crossing can be missed outright. Intersection state is sampled
//      per rendering step, so a fling scroll carrying an element from
//      below the fold to above it within one step delivers a single
//      entry reading isIntersecting: false — dropped, still hidden, and
//      (having never been unobserved) left waiting for a crossing that
//      only comes if the visitor scrolls back up.
//
// Hence threshold 0, plus the already-scrolled-past case handled rather
// than ignored, plus revealSweeper below as a backstop. reception-
// package.html carries the same three fixes on its own .package-reveal
// observer, which is where this was first caught — a whole menu group at
// a time was vanishing out of the middle of a tier column.
//
// Everything here only ever makes MORE content visible, never less: the
// worst case of getting it wrong is something revealing a little earlier
// than intended.

// Shared backstop for both observers. Sweeps only what is still waiting,
// once scrolling settles, and unhooks itself when nothing is left.
const revealPending = []
let revealSweepTimer = null
const revealSweep = () => {
  if (!revealPending.length) return
  const limit = window.innerHeight * (isScrolledToBottom() ? 1 : REVEAL_SWEEP_LINE)
  revealPending.slice().forEach((entry) => {
    const r = entry.el.getBoundingClientRect()
    // Horizontal check as well as vertical: an element parked off-screen
    // inside a horizontal scroller still has an ordinary vertical rect,
    // and sweeping those in would spend their entrance before they are
    // ever scrolled to.
    if (r.right > 0 && r.left < window.innerWidth && r.top < limit) entry.show()
  })
}
const queueRevealSweep = () => {
  if (!revealPending.length) {
    window.removeEventListener("scroll", queueRevealSweep)
    return
  }
  clearTimeout(revealSweepTimer)
  revealSweepTimer = setTimeout(revealSweep, 120)
}
const trackReveal = (el, show) => {
  const entry = {
    el: el,
    show: () => {
      const at = revealPending.indexOf(entry)
      if (at !== -1) revealPending.splice(at, 1)
      show()
    },
  }
  revealPending.push(entry)
  return entry
}
window.addEventListener("scroll", queueRevealSweep, { passive: true })
window.addEventListener("load", revealSweep)

const revObs = new IntersectionObserver(
  (es) => {
    es.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        const entry = e.target.__revealEntry
        if (entry) entry.show()
        revObs.unobserve(e.target)
      }
    })
  },
  { threshold: 0, rootMargin: REVEAL_ROOT_MARGIN },
)
document.querySelectorAll('[data-reveal]:not([data-reveal="img"])').forEach((el) => {
  el.__revealEntry = trackReveal(el, () => {
    el.classList.add("is-revealed")
    revObs.unobserve(el)
  })
  revObs.observe(el)
})

document.querySelectorAll('[data-reveal="img"]').forEach((wrap) => {
  const img = wrap.querySelector("img")
  let seen = false,
    loaded = !img || img.complete
  const reveal = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wrap.classList.add("is-revealed")
      })
    })
  }
  const tryReveal = () => {
    if (seen && loaded) reveal()
  }
  if (img && !loaded)
    img.addEventListener("load", () => {
      loaded = true
      tryReveal()
    })
  // The sweep marks it SEEN rather than revealing it directly, so the
  // image-load gate and the double requestAnimationFrame (CLAUDE.md bug
  // #1 — without both, the transition can be skipped entirely) still
  // decide when it actually appears.
  const entry = trackReveal(wrap, () => {
    seen = true
    tryReveal()
  })
  const imgObs = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          entry.show()
          imgObs.unobserve(wrap)
        }
      })
    },
    { threshold: 0, rootMargin: REVEAL_ROOT_MARGIN },
  )
  imgObs.observe(wrap)
})
