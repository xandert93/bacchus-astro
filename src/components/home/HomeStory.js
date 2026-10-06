// The 1657 / 2 / 35+ facts count up the first time they scroll into view.
// Loaded by HomeStory.astro.

var counted = false
var facts = document.getElementById("facts")
if (facts) {
  var factObs = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (!e.isIntersecting || counted) return
        counted = true
        facts.querySelectorAll(".fact-number").forEach((el) => {
          var target = parseInt(el.dataset.count, 10)
          var suffix = el.dataset.suffix || ""
          var plain = el.dataset.plain === "1"
          var from = plain ? Math.max(0, target - 140) : 0
          var start = null,
            dur = 1500
          const step = (ts) => {
            if (!start) start = ts
            var p = Math.min((ts - start) / dur, 1)
            var eased = 1 - Math.pow(1 - p, 3)
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
