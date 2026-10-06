// The 1657 / 2 / 35+ facts count up the first time they scroll into view.
// Loaded by HomeStory.astro.

let counted = false
const facts = document.getElementById("facts")
if (facts) {
  const factObs = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (!e.isIntersecting || counted) return
        counted = true
        facts.querySelectorAll(".fact-number").forEach((el) => {
          const target = parseInt(el.dataset.count, 10)
          const suffix = el.dataset.suffix || ""
          const plain = el.dataset.plain === "1"
          const from = plain ? Math.max(0, target - 140) : 0
          const dur = 1500
          let start = null
          const step = (ts) => {
            if (!start) start = ts
            const p = Math.min((ts - start) / dur, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            el.textContent =
              Math.round(from + (target - from) * eased) + (p === 1 ? suffix : "")
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        })
      })
    },
    { threshold: 0.4 },
  )
  factObs.observe(facts)
}
