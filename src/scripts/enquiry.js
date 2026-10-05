// The four-step enquiry wizard (#enquire). Loaded by EnquirySection.astro,
// which also pulls in the availability calendar its date field embeds.

import { reduce } from "./lib/motion.js"
import { availabilityHooks } from "./lib/availability-hooks.js"
import "./availability.js"
import { CHIP_NOTES } from "../data/enquiry"

// ---------- Enquiry form ----------
// On pages with a calendar embedded in the "Preferred date" field (Weddings only —
// dates are exclusive there), switch between it and a plain date input depending on
// whether "Wedding" is the selected event type. Pages without this dual field
// (dateNativeWrap/dateCalWrap absent) are untouched by any of this.
var dateNativeWrap = document.getElementById("dateNativeWrap"),
  dateCalWrap = document.getElementById("dateCalWrap")
var dateNative = document.getElementById("dateNative")
// Backup date is a plain informational field (see CLAUDE.md) — Bacchus's own
// reference in case the first choice is taken, not a second live availability
// check, so it only makes sense next to the exclusive Wedding date picker.
var backupDateField = document.getElementById("backupDateField")
var backupDate = document.getElementById("backupDate")
var enqToday = new Date()
enqToday.setHours(0, 0, 0, 0)
function isoOfDate(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  )
}
// Minimum-notice floors on the native date fields, mirroring the wedding
// calendar's own 3-month minimum below (WEDDING_MIN_NOTICE_MONTHS) —
// placeholders, not confirmed Bacchus policy, same "illustrative only"
// status as the rest of this mock data (see CLAUDE.md). Corporate/
// Celebration/Other enquiries use the plain dateNative field and get a
// shorter 2-week floor instead, since they don't take over the whole
// estate the way a wedding does. A backup date is still a wedding date,
// so it shares the 3-month floor rather than today's.
var minBookableDateForm = new Date(
  enqToday.getFullYear(),
  enqToday.getMonth() + 3,
  enqToday.getDate(),
)
var maxBackupDate = new Date(
  enqToday.getFullYear(),
  enqToday.getMonth() + 24,
  enqToday.getDate(),
)
if (dateNative) {
  var minNonWedding = new Date(enqToday)
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
document.querySelectorAll('input[type="date"]').forEach(function (el) {
  el.classList.toggle("has-value", !!el.value)
  el.addEventListener("input", function () {
    el.classList.toggle("has-value", !!el.value)
  })
})

// Guest count: the hint below it switches copy depending on event type
// (a wedding books the whole estate regardless of headcount, so the
// per-space suggestions below don't apply to it), and the spaces/event-
// style fields toggle opposite each other the same way the date field
// does. Guarded throughout — pages without the new fields simply skip
// this block's effects, since the elements it looks up won't exist.
var guests = document.getElementById("guests")
var guestHint = document.getElementById("guestHint")
var spacesField = document.getElementById("spacesField")
var eventStyleField = document.getElementById("eventStyleField")
function hintFor(v) {
  if (!guestHint) return
  var et = document.getElementById("eventtype")
  var isWedding = !et || et.value === "Wedding"
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
function syncSpacesField() {
  if (!spacesField || !eventStyleField) return
  var et = document.getElementById("eventtype")
  var isWedding = !et || et.value === "Wedding"
  spacesField.style.display = isWedding ? "none" : ""
  eventStyleField.style.display = isWedding ? "" : "none"
  hintFor(guests ? parseInt(guests.value, 10) : NaN)
}

var lastDateMode = null
function syncDateMode() {
  if (!dateNativeWrap || !dateCalWrap) return
  var et = document.getElementById("eventtype")
  var isWedding = !et || et.value === "Wedding"
  var isActualTransition = lastDateMode !== null && lastDateMode !== isWedding
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
      var dateField = document.getElementById("date")
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
      // (opacity+lift, not clip-path — see CLAUDE.md's known-bugs list).
      // .is-revealed is added on a double-rAF, one real painted frame after display
      // switches from none, since toggling display and opacity/transform
      // in the same tick can get coalesced into a single paint with no
      // in-between frame to animate from (see bug #1 in CLAUDE.md).
      dateCalWrap.style.display = ""
      dateCalWrap.classList.remove("is-revealed")
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
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
  dateNative.addEventListener("change", function () {
    var dateField = document.getElementById("date")
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
var chipNote = document.getElementById("chipNote")
// The notes themselves live in src/data/enquiry.ts, shared with
// EnquirySection.astro, which renders the initial one on the server — one
// list, so the server-rendered note and the swapped-in ones can't drift.
var CHIP_NOTE_FADE_MS = 200
function syncChipNote(isInitial) {
  if (!chipNote) return
  var et = document.getElementById("eventtype")
  var text = CHIP_NOTES[(et && et.value) || "Wedding"] || ""
  if (isInitial) {
    chipNote.textContent = text
    return
  }
  // Same fixed-clock fade-out/swap/fade-in as the availability widget's
  // picked-date swap above (see CLAUDE.md bug #7) — a synchronous class+text
  // swap in one tick can get coalesced into a single paint with nothing to
  // transition from.
  chipNote.classList.add("swapping")
  window.setTimeout(function () {
    chipNote.textContent = text
    window.setTimeout(function () {
      chipNote.classList.remove("swapping")
    }, 20)
  }, CHIP_NOTE_FADE_MS)
}
syncChipNote(true)

var chipsEl = document.getElementById("chips")
if (chipsEl) {
  chipsEl.addEventListener("click", function (e) {
    var c = e.target.closest(".chip")
    if (!c) return
    chipsEl.querySelectorAll(".chip").forEach(function (x) {
      x.classList.remove("is-selected")
    })
    c.classList.add("is-selected")
    var et = document.getElementById("eventtype")
    if (et) et.value = c.dataset.v
    syncDateMode()
    syncChipNote()
  })
}
var preferEl = document.getElementById("prefer")
if (preferEl) {
  preferEl.addEventListener("click", function (e) {
    var c = e.target.closest(".chip")
    if (!c) return
    preferEl.querySelectorAll(".chip").forEach(function (x) {
      x.classList.remove("is-selected")
    })
    c.classList.add("is-selected")
    var pv = document.getElementById("preferVal")
    if (pv) pv.value = c.dataset.v
  })
}

// ---------- Guest stepper ----------
if (guests) {
  document.querySelectorAll("[data-step-by]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = parseInt(guests.value || "70", 10)
      v = Math.min(500, Math.max(1, v + parseInt(b.dataset.stepBy, 10)))
      guests.value = v
      hintFor(v)
      // So the input picks up its :focus-within styling from a +/- click
      // too, not just from clicking directly into it.
      guests.focus()
    })
  })
  guests.addEventListener("input", function () {
    hintFor(parseInt(guests.value, 10))
  })
}

// ---------- Multi-select spaces (non-Wedding only) ----------
var spacesWrap = document.getElementById("spaces")
if (spacesWrap) {
  spacesWrap.addEventListener("click", function (e) {
    var opt = e.target.closest(".option-card")
    if (!opt) return
    if (opt.dataset.v === "Not sure yet") {
      var was = opt.classList.contains("is-selected")
      spacesWrap.querySelectorAll(".option-card").forEach(function (o) {
        o.classList.remove("is-selected")
      })
      if (!was) opt.classList.add("is-selected")
    } else {
      var notSure = spacesWrap.querySelector('[data-v="Not sure yet"]')
      if (notSure) notSure.classList.remove("is-selected")
      opt.classList.toggle("is-selected")
    }
  })
}
function chosenSpaces() {
  if (!spacesWrap) return []
  return [].slice
    .call(spacesWrap.querySelectorAll(".option-card.is-selected"))
    .map(function (o) {
      return o.dataset.v
    })
}

// ---------- Event style (Wedding only, single-select) ----------
var eventStyleWrap = document.getElementById("eventStyle")
if (eventStyleWrap) {
  eventStyleWrap.addEventListener("click", function (e) {
    var opt = e.target.closest(".option-card")
    if (!opt) return
    var was = opt.classList.contains("is-selected")
    eventStyleWrap.querySelectorAll(".option-card").forEach(function (o) {
      o.classList.remove("is-selected")
    })
    // Re-clicking the already-selected card deselects it, same convention
    // as the "Not sure yet" toggle above.
    if (!was) opt.classList.add("is-selected")
    var styleVal = document.getElementById("eventStyleVal")
    if (styleVal) styleVal.value = was ? "" : opt.dataset.v
  })
}

// ---------- "Anything else" character count ----------
;(function () {
  var msg = document.getElementById("msg")
  var ring = document.getElementById("msgCharRing")
  var num = document.getElementById("msgCharNum")
  if (!msg || !ring || !num) return
  var LIMIT = 500
  var CIRCUMFERENCE = 87.96 // 2 * PI * r(14), matches the ring's SVG circle radius
  function update() {
    var used = msg.value.length
    var remaining = LIMIT - used
    num.textContent = remaining
    var fill = ring.querySelector(".character-ring-fill")
    fill.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(used / LIMIT, 1))
    // Green (default, no class) -> amber -> red as room runs out.
    ring.classList.toggle("near-limit", remaining <= 50)
    ring.classList.toggle("amber", remaining > 50 && remaining <= 200)
  }
  msg.addEventListener("input", update)
  update()
})()

var form = document.getElementById("form")
if (form) {
  function bad(el, cond) {
    el.closest(".field").classList.toggle("bad", !cond)
    return cond
  }
  var defaultEventType = (document.getElementById("eventtype") || {}).value || "Wedding"

  var MONTHS_FORM = [
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
  var DAYS_FORM = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]
  function fmtDate(d) {
    return (
      DAYS_FORM[d.getDay()] +
      " " +
      d.getDate() +
      " " +
      MONTHS_FORM[d.getMonth()] +
      " " +
      d.getFullYear()
    )
  }
  // #date's value is human-formatted when it came from the Wedding
  // calendar (see writeFieldFromSelected() below) but raw ISO when it
  // came from the plain native field (see dateNative's change handler
  // above) — dataset.iso is reliably ISO either way, so reformat from
  // that rather than guessing which shape #date.value is in.
  function niceDate() {
    var dt = document.getElementById("date")
    if (!dt) return null
    var iso = dt.dataset.iso
    if (!iso) return dt.value ? dt.value : null
    var d = new Date(iso + "T00:00:00")
    return isNaN(d) ? dt.value : fmtDate(d)
  }
  function val(id) {
    var el = document.getElementById(id)
    if (!el) return null
    var v = el.value
    return v && v.trim() ? v.trim() : null
  }
  function fullName() {
    var firstNameEl = document.getElementById("firstName"),
      lastNameEl = document.getElementById("lastName")
    if (firstNameEl || lastNameEl)
      return [val("firstName"), val("lastName")].filter(Boolean).join(" ") || null
    return val("name")
  }

  // ---------- Wizard step controller ----------
  // Steps are optional: pages without .wizard-step wrappers just skip straight to
  // the plain submit-validation path below (steps.length === 0).
  var steps = [].slice.call(form.querySelectorAll(".wizard-step"))
  var stepTabs = [].slice.call(form.querySelectorAll(".wizard-step-tab"))
  var lineSegs = [].slice.call(
    form.querySelectorAll(".wizard-progress-line .wizard-progress-segment"),
  )
  var backBtn = form.querySelector(".wizard-back-link")
  var nextBtn = form.querySelector(".wizard-next-button")
  var submitBtn = form.querySelector(".wizard-submit-button")
  var totalSteps = steps.length
  var currentStep = 1
  var maxStepReached = 1
  var stepTitleEl = document.getElementById("stepTitle")
  var stickyTextEl = document.getElementById("stickyText")
  var reviewEl = document.getElementById("review")
  var TITLES = [
    "The <em>occasion</em>",
    "The <em>specifics</em>",
    "Your <em>details</em>",
    "Review &amp; <em>send</em>",
  ]

  function stepChecks(stepNum) {
    var checks = []
    if (stepNum === 1) {
      var dt = document.getElementById("date")
      if (dt) checks.push([dt, !!dt.value])
      // Optional field — only validated once something's actually entered.
      if (backupDate && backupDate.value) {
        var bd = new Date(backupDate.value + "T00:00:00")
        if (isNaN(bd) || bd < enqToday || bd > maxBackupDate) {
          var bdErr = document.getElementById("backupDateErr")
          if (bdErr)
            bdErr.textContent =
              "Enter a date between today and " + fmtDate(maxBackupDate) + "."
          checks.push([backupDate, false])
        }
      }
    } else if (stepNum === 2) {
      var g = document.getElementById("guests")
      if (g) {
        var gv = Number(g.value)
        var gErr = document.getElementById("guestsErr")
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
      var firstNameEl = document.getElementById("firstName"),
        lastNameEl = document.getElementById("lastName")
      if (firstNameEl) checks.push([firstNameEl, firstNameEl.value.trim().length > 0])
      if (lastNameEl) checks.push([lastNameEl, lastNameEl.value.trim().length > 0])
      var n = document.getElementById("name")
      if (n) checks.push([n, n.value.trim().length > 1])
      var em = document.getElementById("email"),
        ph = document.getElementById("phone")
      if (em) checks.push([em, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())])
      if (ph) checks.push([ph, ph.value.trim().length > 5])
    }
    return checks
  }

  function validateStep(stepNum) {
    var ok = true,
      firstBad = null
    stepChecks(stepNum).forEach(function (pair) {
      var passed = bad(pair[0], pair[1])
      if (!passed && !firstBad) firstBad = pair[0]
      ok = ok && passed
    })
    if (firstBad) firstBad.focus()
    return ok
  }

  // ---------- Review (only on pages with a review/#review step) ----------
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
    })
  }
  function rows(list) {
    return list
      .map(function (r) {
        // Free text (Notes) gets the full card width instead of sharing the
        // fixed label column with short single-line answers.
        var full = r[0] === "Notes" ? " review-row-full" : ""
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
  }
  function buildReview() {
    var backup = val("backupDate")
    if (backup) {
      var bd = new Date(backup + "T00:00:00")
      if (!isNaN(bd)) backup = fmtDate(bd)
    }
    var sp = chosenSpaces()
    // A wedding books the whole estate regardless of guest count, so
    // there's no spaces answer to show, not even a blank "Not given" row.
    var isWedding = val("eventtype") === "Wedding"
    var specificsRows = [["Guests", val("guests") ? val("guests") + " expected" : null]]
    if (isWedding) specificsRows.push(["Style", val("eventStyleVal")])
    if (!isWedding) specificsRows.push(["Spaces", sp.length ? sp.join(", ") : null])
    specificsRows.push(["Notes", val("msg")])
    var groups = [
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
      .map(function (g) {
        return (
          "<div class='review-group'><div class='review-head'><h4>" +
          g[0] +
          "</h4><button type='button' class='review-edit-button' data-edit='" +
          g[1] +
          "'><svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/></svg><span>Edit</span></button></div><dl class='review-rows'>" +
          rows(g[2]) +
          "</dl></div>"
        )
      })
      .join("")
  }
  if (reviewEl) {
    reviewEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-edit]")
      if (b) showStep(parseInt(b.dataset.edit, 10))
    })
  }

  var STEP_FADE_MS = 180
  var stepFadeTimer = null

  function showStep(n) {
    currentStep = n
    if (n > maxStepReached) maxStepReached = n
    if (n === totalSteps && reviewEl) buildReview()
    stepTabs.forEach(function (t) {
      var tn = Number(t.dataset.goto)
      t.classList.toggle("active", tn === n)
      t.classList.toggle("done", tn < n)
      t.disabled = tn > maxStepReached
    })
    lineSegs.forEach(function (seg, i) {
      seg.classList.toggle("done", n > i + 1)
    })
    // A class, not inline style.visibility directly — lets CSS handle it
    // (see .wizard-back-hidden in styles.css).
    if (backBtn) backBtn.classList.toggle("wizard-back-hidden", n === 1)
    var onLastStep = n === totalSteps
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

    function afterSwap() {
      var card = form.getBoundingClientRect()
      if (card.top < 0)
        window.scrollTo({
          top: window.scrollY + card.top - 90,
          behavior: reduce ? "auto" : "smooth",
        })
    }

    var current = steps.filter(function (s) {
      return s.classList.contains("active")
    })[0]
    var target = steps.filter(function (s) {
      return Number(s.dataset.step) === n
    })[0]
    if (!target || target === current) return

    clearTimeout(stepFadeTimer)
    if (!current || reduce) {
      steps.forEach(function (s) {
        s.classList.toggle("active", s === target)
      })
      afterSwap()
      return
    }
    current.classList.add("leaving")
    stepFadeTimer = setTimeout(function () {
      current.classList.remove("active", "leaving")
      target.classList.add("active", "entering")
      stepFadeTimer = setTimeout(function () {
        target.classList.remove("entering")
      }, 30)
      afterSwap()
    }, STEP_FADE_MS)
  }

  function goToNextStep() {
    if (!validateStep(currentStep)) return
    showStep(Math.min(totalSteps, currentStep + 1))
  }

  if (totalSteps) {
    if (nextBtn) nextBtn.addEventListener("click", goToNextStep)
    if (backBtn)
      backBtn.addEventListener("click", function () {
        showStep(Math.max(1, currentStep - 1))
      })
    stepTabs.forEach(function (t) {
      t.addEventListener("click", function () {
        var tn = Number(t.dataset.goto)
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
    form.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || currentStep >= totalSteps) return
      if (!e.target || e.target.tagName !== "INPUT") return
      e.preventDefault()
      goToNextStep()
    })
    showStep(1)
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault()
    // Review/consent step — pages without it (not yet migrated) have no
    // #consent element, so this gate is a no-op for them.
    var consent = document.getElementById("consent")
    var consentWrap = document.getElementById("consentWrap")
    if (consent && consentWrap && !consent.checked) {
      consentWrap.classList.remove("bad")
      void consentWrap.offsetWidth
      consentWrap.classList.add("bad")
      return
    }
    var allOk = true
    for (var s = 1; s <= (totalSteps || 1); s++) {
      if (!validateStep(s)) allOk = false
    }
    if (!allOk) {
      var badField = form.querySelector(".field.bad input, .field.bad textarea")
      if (badField) {
        var stepEl = badField.closest(".wizard-step")
        if (stepEl && totalSteps) showStep(Number(stepEl.dataset.step))
        badField.focus()
      }
      return
    }
    var dt = document.getElementById("date"),
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

    var sentEl = document.getElementById("sent")
    if (sentEl) {
      // New review/success flow (see enquiry section markup) — send is
      // deliberately delayed to read as real work happening, matching the
      // sitewide "Sending…" convention.
      if (submitBtn) {
        submitBtn.disabled = true
        var submitLabel = submitBtn.querySelector("span")
        if (submitLabel) submitLabel.textContent = "Sending…"
      }
      setTimeout(function () {
        var sentLine = document.getElementById("sentLine")
        if (sentLine) {
          sentLine.textContent =
            "Thank you, " +
            (val("firstName") || "") +
            " — your enquiry for " +
            (niceDate() || "your date") +
            " is with our events team."
        }
        var sentCopyLine = document.getElementById("sentCopyLine")
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
        var sentTop = sentEl.getBoundingClientRect().top
        window.scrollTo({
          top: window.scrollY + sentTop - 90,
          behavior: reduce ? "auto" : "smooth",
        })
      }, 900)
      return
    }

    // Old inline-message pages (not yet migrated to the review/sent flow).
    var okMsg = document.getElementById("ok")
    if (okMsg) {
      // display defaults to none (see styles.css) so the invisible thank-you
      // text doesn't sit in the wiz-nav flex row inflating every step's height
      // before a real submit ever happens. Switching display and opacity in
      // the same tick would skip the fade (no frame boundary to animate
      // across — see bug #1 in CLAUDE.md), so the display change is given a
      // frame to paint before .show (opacity/transform) is added.
      okMsg.style.display = "block"
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          okMsg.classList.add("show")
        })
      })
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
    document.querySelectorAll("#chips .chip").forEach(function (c) {
      c.classList.toggle("is-selected", c.dataset.v === defaultEventType)
    })
    syncChipNote(true)
    if (totalSteps) showStep(1)
  })
  form.querySelectorAll("input").forEach(function (i) {
    i.addEventListener("input", function () {
      i.closest(".field").classList.remove("bad")
    })
  })
}
