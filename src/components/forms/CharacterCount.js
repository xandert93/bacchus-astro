// Keeps every character ring (CharacterCount.astro) in step with its
// textarea: the characters left, the ring filling as they're used, and its
// colour turning amber, then red, as they run out.

/** The ring's circumference: 2 × π × its radius of 14. */
const CIRCUMFERENCE = 87.96

/** Amber from 40% of the limit left, red from 10%: 200 and 50 of 500. */
const AMBER_SHARE = 0.4
const RED_SHARE = 0.1

document.querySelectorAll("[data-character-count]").forEach((counter) => {
  const input = document.getElementById(counter.dataset.characterCount)
  const ring = counter.querySelector(".character-ring")
  const number = counter.querySelector(".character-ring-number")
  const fill = counter.querySelector(".character-ring-fill")
  const limit = Number(counter.dataset.limit)
  if (!input || !ring || !number || !fill || !limit) return

  const update = () => {
    const used = input.value.length
    const remaining = limit - used
    number.textContent = remaining
    fill.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(used / limit, 1))
    ring.classList.toggle("near-limit", remaining <= limit * RED_SHARE)
    ring.classList.toggle(
      "amber",
      remaining > limit * RED_SHARE && remaining <= limit * AMBER_SHARE,
    )
  }

  input.addEventListener("input", update)
  update()
})
