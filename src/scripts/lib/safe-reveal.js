// Entrance animations that can never leave content missing.
//
// The package pages had every per-item entrance switched off on 2026-10-01,
// because content was going permanently invisible on phones: an observer
// that missed an element left it at opacity 0 forever. This is the safe way
// back. The rule is VISIBLE BY DEFAULT — nothing is hidden by CSS alone:
//
//   • An element is only hidden ("armed") by this script, at load, and only
//     if it is still below the fold. If the script never runs, or the
//     element is already on screen, it simply shows. Nothing above the fold
//     ever flashes out and back in.
//   • Elements inside an inactive tab panel (a package tier you haven't
//     switched to) are never armed — they appear as they always have.
//   • Revealing uses a zero threshold, also fires for anything already
//     scrolled PAST (a fast fling), and a scroll-settle sweep backs it up —
//     the same three guards as site.js's [data-reveal] observers.
//
// Two forms:
//   data-reveal-safe   — the element fades and lifts in as one block
//                        (a tier's whole menu).
//   data-reveal-group  — its direct children slide in from the right one
//                        after another (the signature dish tiles, the photo
//                        strips). The stagger is capped so a long strip
//                        doesn't keep someone waiting.

const STAGGER_MS = 90
const MAX_STAGGER_STEPS = 5
const SWEEP_LIMIT = 0.92 // matches the -8% bottom rootMargin below
const REVEAL_MS = 800 // matches the CSS transition on .reveal-armed

const pending = []

function isBelowFold(el) {
  return el.getBoundingClientRect().top > window.innerHeight
}

function isInInactiveTab(el) {
  const panel = el.closest(".tab-panel")
  return !!panel && !panel.classList.contains("active")
}

function arm(trigger, items) {
  items.forEach((item) => item.classList.add("reveal-armed"))
  pending.push({ trigger, items })
}

function reveal(entry) {
  const at = pending.indexOf(entry)
  if (at === -1) return
  pending.splice(at, 1)
  observer.unobserve(entry.trigger)
  entry.items.forEach((item) => {
    item.classList.add("reveal-in")
    // Hand the element back once its entrance has finished. The armed
    // classes replace the element's own transition list (and carry a
    // delay), so leaving them on would slow every later transition on it —
    // a tile's hover, say — which is CLAUDE.md bug #2 by another route.
    // Removing them at rest changes nothing visible: both states are
    // opacity 1, no transform.
    const delay = parseFloat(item.style.getPropertyValue("--reveal-delay")) || 0
    setTimeout(
      () => {
        item.classList.remove("reveal-armed", "reveal-armed-horizontal", "reveal-in")
        item.style.removeProperty("--reveal-delay")
      },
      delay + REVEAL_MS + 100,
    )
  })
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting && e.boundingClientRect.top >= 0) return
      const entry = pending.find((p) => p.trigger === e.target)
      if (entry) reveal(entry)
    })
  },
  { threshold: 0, rootMargin: "0px 0px -8% 0px" },
)

document.querySelectorAll("[data-reveal-safe]").forEach((el) => {
  if (!isBelowFold(el) || isInInactiveTab(el)) return
  arm(el, [el])
})

document.querySelectorAll("[data-reveal-group]").forEach((group) => {
  if (!isBelowFold(group) || isInInactiveTab(group)) return
  const items = [...group.children]
  items.forEach((item, i) => {
    item.style.setProperty(
      "--reveal-delay",
      Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS + "ms",
    )
    item.classList.add("reveal-armed-horizontal")
  })
  arm(group, items)
})

pending.forEach((entry) => observer.observe(entry.trigger))

// Backstop: once scrolling settles, reveal anything whose trigger is now on
// screen or above it, in case an observer entry was missed.
let sweepTimer = null
function sweep() {
  pending.slice().forEach((entry) => {
    if (entry.trigger.getBoundingClientRect().top < window.innerHeight * SWEEP_LIMIT) {
      reveal(entry)
    }
  })
  if (!pending.length) window.removeEventListener("scroll", onScroll)
}
function onScroll() {
  clearTimeout(sweepTimer)
  sweepTimer = setTimeout(sweep, 120)
}
if (pending.length) window.addEventListener("scroll", onScroll, { passive: true })
