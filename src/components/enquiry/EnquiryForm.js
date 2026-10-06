// The four-step enquiry wizard (#enquire). Loaded by EnquirySection.astro,
// which also pulls in the availability calendar its date field embeds.

import { reduce } from "@scripts/lib/motion.js"
import { availabilityHooks } from "@scripts/lib/availability-hooks.js"
import "./AvailabilityCalendar.js"
import { CHIP_NOTES } from "@data/enquiry"

// ---------- Enquiry form ----------
// On pages with a calendar embedded in the "Preferred date" field (Weddings only —
// dates are exclusive there), switch between it and a plain date input depending on
// whether "Wedding" is the selected event type. Pages without this dual field
// (dateNativeWrap/dateCalWrap absent) are untouched by any of this.
const dateNativeWrap = document.getElementById("dateNativeWrap"),
  dateCalWrap = document.getElementById("dateCalWrap")
const dateNative = document.getElementById("dateNative")
// Backup date is a plain informational field — Bacchus's own
// reference in case the first choice is taken, not a second live availability
// check, so it only makes sense next to the exclusive Wedding date picker.
const backupDateField = document.getElementById("backupDateField")
const backupDate = document.getElementById("backupDate")
const enqToday = new Date()
enqToday.setHours(0, 0, 0, 0)
const isoOfDate = (d) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0")
// Minimum-notice floors on the native date fields, mirroring the wedding
// calendar's own 3-month minimum below (WEDDING_MIN_NOTICE_MONTHS) —
// placeholders, not confirmed Bacchus policy, same "illustrative only"
// status as the rest of this mock data (docs/content/client-facts.md). Corporate/
// Celebration/Other enquiries use the plain dateNative field and get a
// shorter 2-week floor instead, since they don't take over the whole
// estate the way a wedding does. A backup date is still a wedding date,
// so it shares the 3-month floor rather than today's.
const minBookableDateForm = new Date(
  enqToday.getFullYear(),
  enqToday.getMonth() + 3,
  enqToday.getDate(),
)
const maxBackupDate = new Date(
  enqToday.getFullYear(),
  enqToday.getMonth() + 24,
  enqToday.getDate(),
)
if (dateNative) {
  const minNonWedding = new Date(enqToday)
  minNonWedding.setDate(minNonWedding.getDate() + 14)
  dateNative.min = isoOfDate(minNonWedding)
}
if (backupDate) {
  backupDate.min = isoOfDate(minBookableDateForm)
  backupDate.max = isoOfDate(maxBackupDate)
}
// Native <input type="date"> has no ::placeholder — its empty "dd/mm/yyyy"
// and its filled value share one `color`, so .has-value stands in for the
// placeholder/filled split every other field gets for free (see styles.css).
document.querySelectorAll('input[type="date"]').forEach((el) => {
  el.classList.toggle("has-value", !!el.value)
  el.addEventListener("input", () => {
    el.classList.toggle("has-value", !!el.value)
  })
})

// Guest count: the hint below it switches copy depending on event type
// (a wedding books the whole estate regardless of headcount, so the
// per-space suggestions below don't apply to it), and the spaces/event-
// style fields toggle opposite each other the same way the date field
// does. Guarded throughout — pages without the new fields simply skip
// this block's effects, since the elements it looks up won't exist.
const guests = document.getElementById("guests")
const guestHint = document.getElementById("guestHint")
const spacesField = document.getElementById("spacesField")
const eventStyleField = document.getElementById("eventStyleField")
const hintFor = (v) => {
  if (!guestHint) return
  const et = document.getElementById("eventtype")
  const isWedding = !et || et.value === "Wedding"
  if (isWedding) {
    guestHint.innerHTML =
      "A flexible estimate is perfect — final numbers come much later."
    return
  }
  // Space names/capacities here are the same unconfirmed placeholders used
  // elsewhere on the prototype (see the capacity disclaimer under the
  // "spaces" field) — not a claim about real venue layout.
  if (!v || isNaN(v)) {
    guestHint.innerHTML = "Most events here sit between 40 and 180 guests."
    return
  }
  if (v <= 40)
    guestHint.innerHTML = "<b>The Secret Garden</b> suits a party this size beautifully."
  else if (v <= 70)
    guestHint.innerHTML =
      "<b>The Secret Garden</b> or <b>the Terrace</b> would both work."
  else if (v <= 180)
    guestHint.innerHTML =
      "<b>Prince De Redin Hall</b> seats this comfortably, terrace for drinks."
  else
    guestHint.innerHTML =
      "Above 180 we'd plan a larger-format reception across the estate — do mention it below and we'll talk through the options."
}
const syncSpacesField = () => {
  if (!spacesField || !eventStyleField) return
  const et = document.getElementById("eventtype")
  const isWedding = !et || et.value === "Wedding"
  spacesField.style.display = isWedding ? "none" : ""
  eventStyleField.style.display = isWedding ? "" : "none"
  hintFor(guests ? parseInt(guests.value, 10) : NaN)
}

let lastDateMode = null
const syncDateMode = () => {
  if (!dateNativeWrap || !dateCalWrap) return
  const et = document.getElementById("eventtype")
  const isWedding = !et || et.value === "Wedding"
  const isActualTransition = lastDateMode !== null && lastDateMode !== isWedding
  if (isActualTransition) {
    if (isWedding) {
      // Coming back to Wedding: restore whatever date was already picked on the
      // calendar before switching away — its selection is never cleared below,
      // so this just re-syncs #date to match it instead of leaving it empty.
      if (availabilityHooks.restoreField) availabilityHooks.restoreField()
    } else {
      // Leaving Wedding: clear #date itself, so a wedding date can't silently
      // ride along into a Corporate/Celebration submission — but deliberately
      // leave the calendar widget's own picked state alone (no availReset()
      // here) so it's still there if the visitor switches back to Wedding.
      const dateField = document.getElementById("date")
      if (dateField) {
        dateField.value = ""
        dateField.dataset.iso = ""
        dateField.closest(".field").classList.remove("bad")
      }
      if (dateNative) dateNative.value = ""
      if (backupDate) backupDate.value = ""
    }
  }
  lastDateMode = isWedding
  dateNativeWrap.style.display = isWedding ? "none" : ""
  if (backupDateField) backupDateField.style.display = isWedding ? "" : "none"
  if (isWedding) {
    if (isActualTransition) {
      // Fade + lift in when switching to Wedding from another event type
      // (opacity+lift, not clip-path, which once broke the mobile menu).
      // .is-revealed is added on a double-rAF, one real painted frame after display
      // switches from none, since toggling display and opacity/transform
      // in the same tick can get coalesced into a single paint with no
      // in-between frame to animate from (see the reveal frame-gap bug).
      dateCalWrap.style.display = ""
      dateCalWrap.classList.remove("is-revealed")
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dateCalWrap.classList.add("is-revealed")
        })
      })
    } else {
      // Initial page load, already the default — shown as-is, no fade.
      dateCalWrap.style.display = ""
      dateCalWrap.classList.add("is-revealed")
    }
  } else {
    dateCalWrap.style.display = "none"
    dateCalWrap.classList.remove("is-revealed")
  }
  syncSpacesField()
}
syncDateMode()
if (dateNative) {
  dateNative.addEventListener("change", () => {
    const dateField = document.getElementById("date")
    if (dateField) {
      dateField.value = dateNative.value
      dateField.dataset.iso = dateNative.value
      dateField.closest(".field").classList.remove("bad")
    }
  })
}

// Helper line under the event-type chips: swaps copy per chip (Other's job
// is reassurance — the chip is an intentional catch-all for enquiries that
// don't fit the other three, so it needs to say we'll still follow up, not
// just restate the notice-period fact — Corporate/Celebration's is that
// notice period, and Wedding's points at the calendar right below it).
// Replaces the old dateNativeNote paragraph under the date field, which
// said the same notice-period thing further down the form for the same
// three chips — kept in one place instead of two.
const chipNote = document.getElementById("chipNote")
// The notes themselves live in src/data/enquiry.ts, shared with
// EnquirySection.astro, which renders the initial one on the server — one
// list, so the server-rendered note and the swapped-in ones can't drift.
const CHIP_NOTE_FADE_MS = 200
const syncChipNote = (isInitial) => {
  if (!chipNote) return
  const et = document.getElementById("eventtype")
  const text = CHIP_NOTES[(et && et.value) || "Wedding"] || ""
  if (isInitial) {
    chipNote.textContent = text
    return
  }
  // Same fixed-clock fade-out/swap/fade-in as the availability widget's
  // picked-date swap above (see the same-tick class-swap bug) — a synchronous class+text
  // swap in one tick can get coalesced into a single paint with nothing to
  // transition from.
  chipNote.classList.add("swapping")
  window.setTimeout(() => {
    chipNote.textContent = text
    window.setTimeout(() => {
      chipNote.classList.remove("swapping")
    }, 20)
  }, CHIP_NOTE_FADE_MS)
}
syncChipNote(true)

const chipsEl = document.getElementById("chips")
if (chipsEl) {
  chipsEl.addEventListener("click", (e) => {
    const c = e.target.closest(".chip")
    if (!c) return
    chipsEl.querySelectorAll(".chip").forEach((x) => {
      x.classList.remove("is-selected")
    })
    c.classList.add("is-selected")
    const et = document.getElementById("eventtype")
    if (et) et.value = c.dataset.v
    syncDateMode()
    syncChipNote()
  })
}
const preferEl = document.getElementById("prefer")
if (preferEl) {
  preferEl.addEventListener("click", (e) => {
    const c = e.target.closest(".chip")
    if (!c) return
    preferEl.querySelectorAll(".chip").forEach((x) => {
      x.classList.remove("is-selected")
    })
    c.classList.add("is-selected")
    const pv = document.getElementById("preferVal")
    if (pv) pv.value = c.dataset.v
  })
}

// ---------- Guest stepper ----------
if (guests) {
  document.querySelectorAll("[data-step-by]").forEach((b) => {
    b.addEventListener("click", () => {
      let v = parseInt(guests.value || "70", 10)
      v = Math.min(500, Math.max(1, v + parseInt(b.dataset.stepBy, 10)))
      guests.value = v
      hintFor(v)
      // So the input picks up its :focus-within styling from a +/- click
      // too, not just from clicking directly into it.
      guests.focus()
    })
  })
  guests.addEventListener("input", () => {
    hintFor(parseInt(guests.value, 10))
  })
}

// ---------- Multi-select spaces (non-Wedding only) ----------
const spacesWrap = document.getElementById("spaces")
if (spacesWrap) {
  spacesWrap.addEventListener("click", (e) => {
    const opt = e.target.closest(".option-card")
    if (!opt) return
    if (opt.dataset.v === "Not sure yet") {
      const was = opt.classList.contains("is-selected")
      spacesWrap.querySelectorAll(".option-card").forEach((o) => {
        o.classList.remove("is-selected")
      })
      if (!was) opt.classList.add("is-selected")
    } else {
      const notSure = spacesWrap.querySelector('[data-v="Not sure yet"]')
      if (notSure) notSure.classList.remove("is-selected")
      opt.classList.toggle("is-selected")
    }
  })
}
const chosenSpaces = () => {
  if (!spacesWrap) return []
  return [].slice
    .call(spacesWrap.querySelectorAll(".option-card.is-selected"))
    .map((o) => o.dataset.v)
}

// ---------- Event style (Wedding only, single-select) ----------
const eventStyleWrap = document.getElementById("eventStyle")
if (eventStyleWrap) {
  eventStyleWrap.addEventListener("click", (e) => {
    const opt = e.target.closest(".option-card")
    if (!opt) return
    const was = opt.classList.contains("is-selected")
    eventStyleWrap.querySelectorAll(".option-card").forEach((o) => {
      o.classList.remove("is-selected")
    })
    // Re-clicking the already-selected card deselects it, same convention
    // as the "Not sure yet" toggle above.
    if (!was) opt.classList.add("is-selected")
    const styleVal = document.getElementById("eventStyleVal")
    if (styleVal) styleVal.value = was ? "" : opt.dataset.v
  })
}

// ---------- "Anything else" character count ----------
;(() => {
  const msg = document.getElementById("msg")
  const ring = document.getElementById("msgCharRing")
  const num = document.getElementById("msgCharNum")
  if (!msg || !ring || !num) return
  const LIMIT = 500
  const CIRCUMFERENCE = 87.96 // 2 * PI * r(14), matches the ring's SVG circle radius
  const update = () => {
    const used = msg.value.length
    const remaining = LIMIT - used
    num.textContent = remaining
    const fill = ring.querySelector(".character-ring-fill")
    fill.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(used / LIMIT, 1))
    // Green (default, no class) -> amber -> red as room runs out.
    ring.classList.toggle("near-limit", remaining <= 50)
    ring.classList.toggle("amber", remaining > 50 && remaining <= 200)
  }
  msg.addEventListener("input", update)
  update()
})()

const form = document.getElementById("form")
if (form) {
  const bad = (el, cond) => {
    el.closest(".field").classList.toggle("bad", !cond)
    return cond
  }
  const defaultEventType = (document.getElementById("eventtype") || {}).value || "Wedding"

  const MONTHS_FORM = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const DAYS_FORM = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]
  const fmtDate = (d) =>
    DAYS_FORM[d.getDay()] +
    " " +
    d.getDate() +
    " " +
    MONTHS_FORM[d.getMonth()] +
    " " +
    d.getFullYear()
  // #date's value is human-formatted when it came from the Wedding
  // calendar (see writeFieldFromSelected() below) but raw ISO when it
  // came from the plain native field (see dateNative's change handler
  // above) — dataset.iso is reliably ISO either way, so reformat from
  // that rather than guessing which shape #date.value is in.
  const niceDate = () => {
    const dt = document.getElementById("date")
    if (!dt) return null
    const iso = dt.dataset.iso
    if (!iso) return dt.value ? dt.value : null
    const d = new Date(iso + "T00:00:00")
    return isNaN(d) ? dt.value : fmtDate(d)
  }
  const val = (id) => {
    const el = document.getElementById(id)
    if (!el) return null
    const v = el.value
    return v && v.trim() ? v.trim() : null
  }
  const fullName = () => {
    const firstNameEl = document.getElementById("firstName"),
      lastNameEl = document.getElementById("lastName")
    if (firstNameEl || lastNameEl)
      return [val("firstName"), val("lastName")].filter(Boolean).join(" ") || null
    return val("name")
  }

  // ---------- Wizard step controller ----------
  // Steps are optional: pages without .wizard-step wrappers just skip straight to
  // the plain submit-validation path below (steps.length === 0).
  const steps = [].slice.call(form.querySelectorAll(".wizard-step"))
  const stepTabs = [].slice.call(form.querySelectorAll(".wizard-step-tab"))
  const lineSegs = [].slice.call(
    form.querySelectorAll(".wizard-progress-line .wizard-progress-segment"),
  )
  const backBtn = form.querySelector(".wizard-back-link")
  const nextBtn = form.querySelector(".wizard-next-button")
  const submitBtn = form.querySelector(".wizard-submit-button")
  const totalSteps = steps.length
  let currentStep = 1
  let maxStepReached = 1
  const stepTitleEl = document.getElementById("stepTitle")
  const stickyTextEl = document.getElementById("stickyText")
  const reviewEl = document.getElementById("review")
  const TITLES = [
    "The <em>occasion</em>",
    "The <em>specifics</em>",
    "Your <em>details</em>",
    "Review &amp; <em>send</em>",
  ]

  const stepChecks = (stepNum) => {
    const checks = []
    if (stepNum === 1) {
      const dt = document.getElementById("date")
      if (dt) checks.push([dt, !!dt.value])
      // Optional field — only validated once something's actually entered.
      if (backupDate && backupDate.value) {
        const bd = new Date(backupDate.value + "T00:00:00")
        if (isNaN(bd) || bd < enqToday || bd > maxBackupDate) {
          const bdErr = document.getElementById("backupDateErr")
          if (bdErr)
            bdErr.textContent =
              "Enter a date between today and " + fmtDate(maxBackupDate) + "."
          checks.push([backupDate, false])
        }
      }
    } else if (stepNum === 2) {
      const g = document.getElementById("guests")
      if (g) {
        const gv = Number(g.value)
        const gErr = document.getElementById("guestsErr")
        if (!gv || gv < 1) {
          if (gErr) gErr.textContent = "Enter an expected guest count."
          checks.push([g, false])
        } else if (gv > 500) {
          if (gErr)
            gErr.textContent =
              "That's a large gathering — let's talk directly rather than guess a number here."
          checks.push([g, false])
        } else {
          checks.push([g, true])
        }
      }
    } else if (stepNum === 3) {
      const firstNameEl = document.getElementById("firstName"),
        lastNameEl = document.getElementById("lastName")
      if (firstNameEl) checks.push([firstNameEl, firstNameEl.value.trim().length > 0])
      if (lastNameEl) checks.push([lastNameEl, lastNameEl.value.trim().length > 0])
      const n = document.getElementById("name")
      if (n) checks.push([n, n.value.trim().length > 1])
      const em = document.getElementById("email"),
        ph = document.getElementById("phone")
      if (em) checks.push([em, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())])
      if (ph) checks.push([ph, ph.value.trim().length > 5])
    }
    return checks
  }

  const validateStep = (stepNum) => {
    let ok = true,
      firstBad = null
    stepChecks(stepNum).forEach((pair) => {
      const passed = bad(pair[0], pair[1])
      if (!passed && !firstBad) firstBad = pair[0]
      ok = ok && passed
    })
    if (firstBad) firstBad.focus()
    return ok
  }

  // ---------- Review (only on pages with a review/#review step) ----------
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    )
  const rows = (list) =>
    list
      .map((r) => {
        // Free text (Notes) gets the full card width instead of sharing the
        // fixed label column with short single-line answers.
        const full = r[0] === "Notes" ? " review-row-full" : ""
        return (
          "<div class='review-row" +
          full +
          "'><dt>" +
          esc(r[0]) +
          "</dt><dd class='" +
          (r[1] ? "" : "empty") +
          "'>" +
          esc(r[1] || "Not given") +
          "</dd></div>"
        )
      })
      .join("")
  const buildReview = () => {
    let backup = val("backupDate")
    if (backup) {
      const bd = new Date(backup + "T00:00:00")
      if (!isNaN(bd)) backup = fmtDate(bd)
    }
    const sp = chosenSpaces()
    // A wedding books the whole estate regardless of guest count, so
    // there's no spaces answer to show, not even a blank "Not given" row.
    const isWedding = val("eventtype") === "Wedding"
    const specificsRows = [["Guests", val("guests") ? val("guests") + " expected" : null]]
    if (isWedding) specificsRows.push(["Style", val("eventStyleVal")])
    if (!isWedding) specificsRows.push(["Spaces", sp.length ? sp.join(", ") : null])
    specificsRows.push(["Notes", val("msg")])
    const groups = [
      [
        "The occasion",
        1,
        [
          ["Event type", val("eventtype")],
          ["Preferred date", niceDate()],
          ["Alternative date", backup],
        ],
      ],
      ["The specifics", 2, specificsRows],
      [
        "Your details",
        3,
        [
          ["Name", fullName()],
          ["Email", val("email")],
          ["Phone", val("phone")],
          ["Contact by", val("preferVal")],
        ],
      ],
    ]
    reviewEl.innerHTML = groups
      .map(
        (g) =>
          "<div class='review-group'><div class='review-head'><h4>" +
          g[0] +
          "</h4><button type='button' class='review-edit-button' data-edit='" +
          g[1] +
          "'><svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/></svg><span>Edit</span></button></div><dl class='review-rows'>" +
          rows(g[2]) +
          "</dl></div>",
      )
      .join("")
  }
  if (reviewEl) {
    reviewEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-edit]")
      if (b) showStep(parseInt(b.dataset.edit, 10))
    })
  }

  const STEP_FADE_MS = 180
  let stepFadeTimer = null

  const showStep = (n) => {
    currentStep = n
    if (n > maxStepReached) maxStepReached = n
    if (n === totalSteps && reviewEl) buildReview()
    stepTabs.forEach((t) => {
      const tn = Number(t.dataset.goto)
      t.classList.toggle("active", tn === n)
      t.classList.toggle("done", tn < n)
      t.disabled = tn > maxStepReached
    })
    lineSegs.forEach((seg, i) => {
      seg.classList.toggle("done", n > i + 1)
    })
    // A class, not inline style.visibility directly — lets CSS handle it
    // (see .wizard-back-hidden in styles.css).
    if (backBtn) backBtn.classList.toggle("wizard-back-hidden", n === 1)
    const onLastStep = n === totalSteps
    if (nextBtn) nextBtn.style.display = onLastStep ? "none" : ""
    if (submitBtn) {
      submitBtn.style.display = onLastStep ? "" : "none"
      submitBtn.disabled = !onLastStep
    }
    if (stepTitleEl && TITLES[n - 1]) stepTitleEl.innerHTML = TITLES[n - 1]
    if (stickyTextEl) {
      stickyTextEl.textContent = onLastStep
        ? "Private & without obligation · reply within two working days"
        : "Private & without obligation · nothing is sent until you review it"
    }

    const afterSwap = () => {
      const card = form.getBoundingClientRect()
      if (card.top < 0)
        window.scrollTo({
          top: window.scrollY + card.top - 90,
          behavior: reduce ? "auto" : "smooth",
        })
    }

    const current = steps.filter((s) => s.classList.contains("active"))[0]
    const target = steps.filter((s) => Number(s.dataset.step) === n)[0]
    if (!target || target === current) return

    clearTimeout(stepFadeTimer)
    if (!current || reduce) {
      steps.forEach((s) => {
        s.classList.toggle("active", s === target)
      })
      afterSwap()
      return
    }
    current.classList.add("leaving")
    stepFadeTimer = setTimeout(() => {
      current.classList.remove("active", "leaving")
      target.classList.add("active", "entering")
      stepFadeTimer = setTimeout(() => {
        target.classList.remove("entering")
      }, 30)
      afterSwap()
    }, STEP_FADE_MS)
  }

  const goToNextStep = () => {
    if (!validateStep(currentStep)) return
    showStep(Math.min(totalSteps, currentStep + 1))
  }

  if (totalSteps) {
    if (nextBtn) nextBtn.addEventListener("click", goToNextStep)
    if (backBtn)
      backBtn.addEventListener("click", () => {
        showStep(Math.max(1, currentStep - 1))
      })
    stepTabs.forEach((t) => {
      t.addEventListener("click", () => {
        const tn = Number(t.dataset.goto)
        if (tn <= maxStepReached) showStep(tn)
      })
    })
    // Enter in a text field on steps 1–3 acts like clicking "Continue" —
    // validates just the current step and advances one, same as
    // goToNextStep() above. Without this, Enter here would fall through to
    // the browser's own implicit-submit behavior instead: this form has
    // exactly one type="submit" button (on step 4, Review), so per the
    // HTML spec that's the default target for Enter in ANY text input
    // anywhere in the form, regardless of which step is visually showing.
    // That's not a no-op today — it runs the full submit handler below,
    // which validates all four steps at once and jumps to the first
    // invalid one, or — if steps 1–3 already happen to be valid — actually
    // sends the enquiry immediately, skipping Review entirely. Scoped to
    // currentStep < totalSteps (i.e. not the Review step itself) so
    // step 4's own Enter behavior is untouched — reaching the real submit
    // button IS the correct action there. Scoped to tagName === "INPUT"
    // specifically — a <textarea> (the message field) needs Enter to stay
    // a newline, and this only ever needs to fire for genuine single-line
    // text fields, not the step-1 event-type chips or the Continue/Back
    // buttons themselves (all real <button> elements, which already have
    // their own correct native Enter-activates-the-button behavior).
    form.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || currentStep >= totalSteps) return
      if (!e.target || e.target.tagName !== "INPUT") return
      e.preventDefault()
      goToNextStep()
    })
    showStep(1)
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    // Review/consent step — pages without it (not yet migrated) have no
    // #consent element, so this gate is a no-op for them.
    const consent = document.getElementById("consent")
    const consentWrap = document.getElementById("consentWrap")
    if (consent && consentWrap && !consent.checked) {
      consentWrap.classList.remove("bad")
      void consentWrap.offsetWidth
      consentWrap.classList.add("bad")
      return
    }
    let allOk = true
    for (let s = 1; s <= (totalSteps || 1); s++) {
      if (!validateStep(s)) allOk = false
    }
    if (!allOk) {
      const badField = form.querySelector(".field.bad input, .field.bad textarea")
      if (badField) {
        const stepEl = badField.closest(".wizard-step")
        if (stepEl && totalSteps) showStep(Number(stepEl.dataset.step))
        badField.focus()
      }
      return
    }
    const dt = document.getElementById("date"),
      et = document.getElementById("eventtype")
    console.log("Enquiry submitted:", {
      name: fullName(),
      email: val("email"),
      phone: val("phone"),
      eventType: et ? et.value : null,
      date: dt ? dt.value : null,
      dateIso: dt ? dt.dataset.iso || null : null,
      backupDate: val("backupDate"),
      guests: val("guests"),
      spaces: chosenSpaces(),
      eventStyle: val("eventStyleVal"),
      message: val("msg"),
      contactPref: val("preferVal"),
    })

    const sentEl = document.getElementById("sent")
    if (sentEl) {
      // New review/success flow (see enquiry section markup) — send is
      // deliberately delayed to read as real work happening, matching the
      // sitewide "Sending…" convention.
      if (submitBtn) {
        submitBtn.disabled = true
        const submitLabel = submitBtn.querySelector("span")
        if (submitLabel) submitLabel.textContent = "Sending…"
      }
      setTimeout(() => {
        const sentLine = document.getElementById("sentLine")
        if (sentLine) {
          sentLine.textContent =
            "Thank you, " +
            (val("firstName") || "") +
            " — your enquiry for " +
            (niceDate() || "your date") +
            " is with our events team."
        }
        const sentCopyLine = document.getElementById("sentCopyLine")
        if (sentCopyLine)
          sentCopyLine.textContent =
            "A copy is on its way to " + (val("email") || "your inbox") + "."
        form.style.display = "none"
        sentEl.classList.add("show")
        // Not scrollIntoView({block:"center"}) — on mobile the success
        // panel is taller than the viewport, so centering it pushes the
        // seal/heading above the visible area. Manual offset instead,
        // landing the panel's own top just below the fixed nav (90px,
        // same offset used for the step-change scroll above).
        const sentTop = sentEl.getBoundingClientRect().top
        window.scrollTo({
          top: window.scrollY + sentTop - 90,
          behavior: reduce ? "auto" : "smooth",
        })
      }, 900)
      return
    }

    form.reset()
    // form.reset() does not clear type="hidden" inputs in practice (verified —
    // it resets visible text/number/etc. controls but leaves hidden ones alone),
    // so #date needs an explicit clear. availReset() also clears the calendar
    // widget's own internal "selected" state and un-highlights its picked cell,
    // which form.reset() has no way to touch since that's plain DOM, not a
    // form control.
    if (dt) {
      dt.value = ""
      dt.dataset.iso = ""
    }
    if (availabilityHooks.reset) availabilityHooks.reset()
    if (et) et.value = defaultEventType
    document.querySelectorAll("#chips .chip").forEach((c) => {
      c.classList.toggle("is-selected", c.dataset.v === defaultEventType)
    })
    syncChipNote(true)
    if (totalSteps) showStep(1)
  })
  form.querySelectorAll("input").forEach((i) => {
    i.addEventListener("input", () => {
      i.closest(".field").classList.remove("bad")
    })
  })
}
