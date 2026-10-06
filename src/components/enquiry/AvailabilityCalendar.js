// The illustrative availability calendar (every .availability instance on
// the page), the weddings quick-pick modal, and the waitlist popover for
// booked dates. Imported by EnquiryForm.js and by the weddings page.

import { availabilityHooks } from "@scripts/lib/availability-hooks.js"
import { lockScroll, unlockScroll } from "@scripts/lib/scroll-lock.js"

// ---------- Mock wedding-date availability widget (illustrative concept — not live data) ----------
// A page can have more than one instance (e.g. a showcase calendar plus a compact one
// embedded in the enquiry form). Browsing months is independent per instance, but picking
// a date is shared: every instance re-syncs to show the same selected date, and all of
// them write to the same #date field.
;(function () {
  // Every .availability is a calendar (AvailabilityCalendar.astro). The
  // enquiry form's sent panel used to borrow the class for its card styling
  // and had to be excluded here — it threw on render() and took the modal
  // wiring below down with it. It has its own class now.
  var availEls = document.querySelectorAll(".availability")
  if (!availEls.length) return
  var names = [
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
  var today = new Date()
  var minMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  var maxMonth = new Date(today.getFullYear(), today.getMonth() + 24, 1) // ~2yr wedding-booking horizon
  // Minimum lead time before a wedding date can be booked at all — a
  // single-wedding-a-day exclusive venue can't turn around catering,
  // staffing and supplier coordination overnight. 3 months is a
  // reasonable placeholder, not a confirmed Bacchus policy — same
  // "illustrative only" status as the rest of this mock data, flag for
  // the client before treating it as real (see CLAUDE.md).
  var WEDDING_MIN_NOTICE_MONTHS = 3
  var minBookableDate = new Date(
    today.getFullYear(),
    today.getMonth() + WEDDING_MIN_NOTICE_MONTHS,
    today.getDate(),
  )
  var selected = null // { iso, status, dd, yy, mm }
  var instances = []
  // Set only while the quick-pick modal is open and its pick hasn't been
  // confirmed yet: undefined = "mirrors the committed `selected`" (nothing
  // touched this time), null = "staged to clear", an object = "staged to
  // this date". Keeps a date picked inside the modal from updating the
  // background page (the form's summary, the "Pick a date"/"Change date"
  // button label) until the client actually clicks "Use this date".
  var modalPending

  function seededStatus(y, m, d) {
    var seed = (y * 421 + (m + 1) * 37 + d * 13) % 10
    if (seed <= 5) return "open"
    if (seed <= 7) return "interest"
    return "taken"
  }
  function isoOf(y, m, d) {
    return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0")
  }
  function sameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  }

  var FADE_MS = 200

  function applyPickedContent(el) {
    el.classList.remove("status-open", "status-interest")
    el.classList.add("show", "status-" + selected.status)
    var dateEl = el.querySelector(".availability-picked-date"),
      statusEl = el.querySelector(".availability-picked-status")
    if (dateEl)
      dateEl.textContent = selected.dd + " " + names[selected.mm] + " " + selected.yy
    if (statusEl)
      statusEl.textContent =
        selected.status === "open" ? "Available" : "Enquiries received"
  }

  function writeFieldFromSelected() {
    var dateField = document.getElementById("date")
    if (!dateField || !selected) return
    dateField.value = selected.dd + " " + names[selected.mm] + " " + selected.yy
    dateField.dataset.iso = selected.iso
    var f = dateField.closest(".field")
    if (f) f.classList.remove("bad")
  }

  function updatePickedPanels() {
    // weddings.html's wizard step 1 has a "go to calendar" button whose label
    // reflects whether a date is already picked — kept in sync here alongside
    // the panels themselves, since both are driven by the same `selected` state.
    var changeBtn = document.getElementById("availChangeBtn")
    if (changeBtn) {
      // .textContent on the button itself would wipe its calendar icon <svg>
      // too, not just the label — target the inner <span> instead.
      var changeBtnLabel = changeBtn.querySelector("span")
      if (changeBtnLabel)
        changeBtnLabel.textContent = selected ? "Change date" : "Pick a date"
    }
    // Class, not id — weddings.html's #availability card and the quick-pick
    // modal both have their own live footer label, driven off the same class
    // rather than fighting over one id between two elements.
    document.querySelectorAll(".availability-foot-label").forEach(function (el) {
      el.classList.remove("status-open", "status-interest")
      var dateEl = el.querySelector(".availability-foot-label-date"),
        statusEl = el.querySelector(".availability-picked-status")
      if (selected) {
        // "show" only actually does anything for #availPicked (the wizard's
        // own inline calendar, styles.css), which starts display:none until
        // a date is picked — the diary showcase/modal's own .availability-foot-label
        // has no such rule and stays visible with its static "No date
        // selected" fallback either way, so toggling this class is harmless
        // there.
        el.classList.add("show", "status-" + selected.status)
        if (dateEl)
          dateEl.textContent =
            "Selected · " +
            selected.dd +
            " " +
            names[selected.mm].slice(0, 3) +
            " " +
            selected.yy
        if (statusEl)
          statusEl.textContent =
            selected.status === "open" ? "Available" : "Enquiries received"
      } else {
        el.classList.remove("show")
        if (dateEl) dateEl.textContent = "No date selected"
        if (statusEl) statusEl.textContent = ""
      }
    })
    // Not scoped to instances[] (grid widgets) — a page can also have a plain
    // .availability-picked summary panel with no calendar grid attached (weddings.html's
    // wizard step 1), so every .availability-picked on the page is kept in sync here.
    document.querySelectorAll(".availability-picked").forEach(function (el) {
      if (!selected) {
        el.classList.remove("show", "status-open", "status-interest", "swapping")
        var dateEl = el.querySelector(".availability-picked-date"),
          statusEl = el.querySelector(".availability-picked-status")
        if (dateEl) dateEl.textContent = "No date selected"
        if (statusEl) statusEl.textContent = ""
        return
      }
      if (!el.classList.contains("show")) {
        // First reveal on this instance — no prior state to fade from, just show it.
        applyPickedContent(el)
        return
      }
      // Switching between two already-visible picks: fade out fully, THEN swap color + text,
      // THEN fade back in — on a fixed clock (not requestAnimationFrame, which can coalesce
      // steps into the same paint and skip the fade entirely).
      var target = selected
      el.classList.add("swapping")
      window.setTimeout(function () {
        if (selected !== target) return // a newer pick has already taken over
        applyPickedContent(el)
        window.setTimeout(function () {
          el.classList.remove("swapping")
        }, 20)
      }, FADE_MS)
    })
  }

  function pick(iso, status, dd, yy, mm, cellEl) {
    // Full re-render is only actually needed when some instance has to jump to a
    // different month to show the newly picked date. If every instance is already
    // showing the right month (the common case — there's only ever one instance per
    // page now), just move the "picked" class between the old and new cell directly
    // instead of tearing the grid down and rebuilding it: that's what lets
    // .availability-cell's background-color/color transition actually animate, since a
    // freshly-recreated cell has no prior frame on the same element to animate from.
    var dateField = document.getElementById("date")
    var targetMonth = new Date(yy, mm, 1)
    var needsMonthChange = instances.some(function (inst) {
      return !sameMonth(inst.state.view, targetMonth)
    })

    if (selected && selected.iso === iso) {
      selected = null
      if (dateField) {
        dateField.value = ""
        dateField.dataset.iso = ""
      }
      updatePickedPanels()
      if (needsMonthChange) {
        instances.forEach(function (inst) {
          inst.render()
        })
      } else {
        // querySelectorAll, not querySelector — a page can have more than one
        // grid instance now (weddings.html's showcase + its quick-pick modal),
        // and only clearing the first match left the other instance's cell
        // stuck showing "picked" after a deselect.
        document.querySelectorAll(".availability-cell.picked").forEach(function (c) {
          c.classList.remove("picked")
        })
      }
      return
    }
    selected = { iso: iso, status: status, dd: dd, yy: yy, mm: mm }
    updatePickedPanels()
    if (needsMonthChange) {
      instances.forEach(function (inst) {
        inst.state.view = new Date(yy, mm, 1)
        inst.render()
      })
    } else {
      document.querySelectorAll(".availability-cell.picked").forEach(function (c) {
        c.classList.remove("picked")
      })
      // Only the cell actually clicked is known here — every other instance
      // showing the same month gets its matching cell picked up on its next
      // render() (the needsMonthChange branch above), or already shows it
      // correctly if it was already on this month from a previous sync.
      if (cellEl) cellEl.classList.add("picked")
      document.querySelectorAll(".availability-grid").forEach(function (grid) {
        if (grid.contains(cellEl)) return
        var match = [].slice
          .call(grid.querySelectorAll(".availability-cell"))
          .find(function (c) {
            return c.textContent.trim() === String(dd) && !c.classList.contains("blank")
          })
        if (match) match.classList.add("picked")
      })
    }
    writeFieldFromSelected()
  }

  // Cells inside the quick-pick modal stage into modalPending instead of
  // committing straight to `selected` — see modalPending's own comment
  // above for why. Every other instance (the showcase grid, and the modal
  // grid when the modal isn't actually open) commits immediately via
  // pick() as before.
  function handleCellClick(iso, status, dd, yy, mm, cellEl) {
    if (
      availModal &&
      availModal.classList.contains("show") &&
      availModal.contains(cellEl)
    ) {
      stageModalPick(iso, status, dd, yy, mm, cellEl)
    } else {
      pick(iso, status, dd, yy, mm, cellEl)
    }
  }
  function stageModalPick(iso, status, dd, yy, mm, cellEl) {
    var current = modalPending !== undefined ? modalPending : selected
    var next =
      current && current.iso === iso
        ? null
        : { iso: iso, status: status, dd: dd, yy: yy, mm: mm }
    modalPending = next
    if (modalInstance) {
      modalInstance.el
        .querySelectorAll(".availability-cell.picked")
        .forEach(function (c) {
          c.classList.remove("picked")
        })
    }
    if (next && cellEl) cellEl.classList.add("picked")
    var footEl = availModal.querySelector(".availability-foot-label")
    if (footEl) {
      footEl.classList.remove("status-open", "status-interest")
      var dateEl = footEl.querySelector(".availability-foot-label-date"),
        statusEl = footEl.querySelector(".availability-picked-status")
      if (next) {
        footEl.classList.add("status-" + next.status)
        if (dateEl)
          dateEl.textContent =
            "Selected · " + next.dd + " " + names[next.mm].slice(0, 3) + " " + next.yy
        if (statusEl)
          statusEl.textContent =
            next.status === "open" ? "Available" : "Enquiries received"
      } else {
        if (dateEl) dateEl.textContent = "No date selected"
        if (statusEl) statusEl.textContent = ""
      }
    }
    if (availModalDone) availModalDone.disabled = !next
  }
  // Applies whatever's staged (or does nothing if the client never touched
  // the calendar this time round) to the real, shared `selected` state —
  // only called from "Use this date". A full re-render of every instance
  // is simplest/safest here: this only runs on a deliberate confirm click,
  // not on every hover/click while browsing, so the extra re-render cost
  // doesn't matter, and it guarantees the showcase grid and the modal grid
  // agree rather than relying on the partial DOM patching pick() does for
  // the common single-instance case.
  function commitModalPending() {
    if (modalPending === undefined) return
    var dateField = document.getElementById("date")
    selected = modalPending
    if (!selected && dateField) {
      dateField.value = ""
      dateField.dataset.iso = ""
    }
    modalPending = undefined
    updatePickedPanels()
    instances.forEach(function (inst) {
      inst.render()
    })
    if (selected) writeFieldFromSelected()
  }
  availabilityHooks.reset = function () {
    selected = null
    updatePickedPanels()
    instances.forEach(function (inst) {
      inst.render()
    })
  }
  availabilityHooks.restoreField = writeFieldFromSelected

  // ---------- Waitlist prompt on a Booked date ----------
  // Ported from sandboxes/waitlist-prompt.html once the anchored-popover
  // treatment was chosen there over an inline-panel-below-the-grid
  // alternative (kept in that sandbox for reference). First shipped on
  // .availability.diary (weddings.html's showcase + quick-pick modal), then
  // extended to .availability.compact (the enquiry-form date-pickers on
  // index/corporate/celebrations/gallery.html) — see CLAUDE.md's waitlist
  // roadmap entry.
  //
  // A single shared popover per page (position:fixed, markup duplicated once
  // per page like every other widget here — see the wizard/testimonials
  // markup for the same pattern) rather than one per grid, since only one
  // can ever be open at a time even where a page has two instances
  // (weddings.html's showcase + modal). Everything below no-ops via the
  // `if (wlPop)` guard on any page without that markup, same as every other
  // optional widget in this file (bug #4).
  var wlPop = document.getElementById("wlPopover")
  var wireWaitlistGrid = function () {} // no-op unless wlPop exists, replaced below
  if (wlPop) {
    var wlDateEl = document.getElementById("wlPopoverDate")
    var wlBodyEl = wlPop.querySelector(".wl-popover-body")
    var wlSuccessEl = wlPop.querySelector(".wl-popover-success")
    var wlEmailInput = document.getElementById("wlPopEmail")
    var wlNameInput = document.getElementById("wlPopName")
    var wlEmailOut = document.getElementById("wlPopoverEmailOut")
    var wlForm = document.getElementById("wlPopoverForm")
    var wlCloseBtn = document.getElementById("wlPopoverClose")
    var wlActiveCell = null
    var wlCloseTimer = null
    // Hover-capable pointers (mouse/trackpad) open the popover as a preview on
    // hover rather than a click — a touch device has no "hover" to borrow, so
    // it gets the original tap-to-open behavior instead. Checked once at load,
    // not live — a device doesn't switch input capability mid-session. The
    // hint text next to the legend (see weddings.html) is split the same way,
    // via @media(hover) in styles.css, so it never disagrees with this.
    var wlHoverCapable = window.matchMedia("(hover: hover)").matches

    var wlFormatIso = function (iso) {
      var parts = iso.split("-")
      return +parts[2] + " " + names[+parts[1] - 1] + " " + parts[0]
    }
    var wlPosition = function () {
      if (!wlActiveCell) return
      var pad = 12,
        gap = 10
      var cellRect = wlActiveCell.getBoundingClientRect()
      var popRect = wlPop.getBoundingClientRect()
      var width = popRect.width,
        height = popRect.height
      var spaceBelow = window.innerHeight - cellRect.bottom
      var placement =
        spaceBelow > height + gap + pad
          ? "bottom"
          : cellRect.top > height + gap + pad
            ? "top"
            : "bottom"
      var top =
        placement === "bottom" ? cellRect.bottom + gap : cellRect.top - height - gap
      top = Math.max(pad, Math.min(top, window.innerHeight - height - pad))
      var left = cellRect.left + cellRect.width / 2 - width / 2
      left = Math.max(pad, Math.min(left, window.innerWidth - width - pad))
      wlPop.style.left = left + "px"
      wlPop.style.top = top + "px"
      wlPop.dataset.placement = placement
      var arrowLeft = cellRect.left + cellRect.width / 2 - left
      arrowLeft = Math.max(18, Math.min(arrowLeft, width - 18))
      wlPop.style.setProperty("--wl-arrow-left", arrowLeft + "px")
    }
    var wlClose = function () {
      wlPop.classList.remove("show")
      if (wlActiveCell) wlActiveCell.classList.remove("wl-active")
      wlActiveCell = null
    }
    var wlOpenFor = function (cellEl) {
      var isSame = wlActiveCell === cellEl
      if (wlActiveCell) wlActiveCell.classList.remove("wl-active")
      if (isSame) {
        wlClose()
        return
      }
      wlActiveCell = cellEl
      wlActiveCell.classList.add("wl-active")
      wlDateEl.textContent = wlFormatIso(cellEl.dataset.iso)
      wlBodyEl.hidden = false
      wlSuccessEl.hidden = true
      wlEmailInput.value = ""
      wlNameInput.value = ""
      wlPop.classList.add("show")
      // Position after "show" so width/height reflect the real (unclamped)
      // rendered size — opacity:0 still lays the box out at full size, but
      // this keeps the measurement after any layout-affecting class change.
      wlPosition()
    }
    var wlClearCloseTimer = function () {
      clearTimeout(wlCloseTimer)
      wlCloseTimer = null
    }
    // ~250ms, not instant — the popover sits a real gap below/above the cell
    // (see wlPosition above), and an instant close would fire while the
    // pointer is still crossing that gap on its way in. Same hover-intent
    // delay already used for the nav dropdown proposal (sandboxes/navbar.html).
    var wlScheduleClose = function () {
      wlClearCloseTimer()
      wlCloseTimer = setTimeout(function () {
        // Don't close out from under someone who's actually typing — the
        // pointer leaving after they've clicked into a field shouldn't
        // discard what's already been entered. Only hover-triggered opens
        // ever reach this timer; an explicit close (X, Escape, click
        // elsewhere) still works regardless.
        if (wlPop.contains(document.activeElement)) return
        // Nor out from under someone who just submitted — clicking "Join
        // the waitlist" swaps in the (shorter) success message, which can
        // leave the pointer sitting outside the popover's new, smaller box
        // even though it never actually moved (the button it was over is
        // now hidden). Without this, the confirmation could fade before
        // it's even been read.
        if (!wlSuccessEl.hidden) return
        wlClose()
      }, 250)
    }
    var wlTakenCellFrom = function (e) {
      return e.target.closest(".availability-cell.taken")
    }

    // Called once per .diary/.compact grid found below — a .taken cell only
    // ever gets a real click listener from this file when open/interest (see
    // render() below), so a Booked cell's hover/click has to be caught via
    // delegation on the grid itself, which also survives the grid being
    // rebuilt wholesale on every prev/next (a listener on an individual
    // cell wouldn't).
    wireWaitlistGrid = function (grid) {
      if (wlHoverCapable) {
        grid.addEventListener("mouseover", function (e) {
          var cellEl = wlTakenCellFrom(e)
          if (!cellEl) return
          wlClearCloseTimer()
          if (cellEl === wlActiveCell) return
          wlOpenFor(cellEl)
        })
        grid.addEventListener("mouseout", function (e) {
          var cellEl = wlTakenCellFrom(e)
          if (!cellEl) return
          // relatedTarget is where the pointer is actually headed — if
          // that's the popover itself, its own mouseenter below cancels the
          // timer anyway, so skip scheduling one at all rather than have it
          // flash a close-then-cancel.
          if (wlPop.contains(e.relatedTarget)) return
          wlScheduleClose()
        })
      } else {
        grid.addEventListener("click", function (e) {
          var cellEl = wlTakenCellFrom(e)
          if (cellEl) {
            wlOpenFor(cellEl)
            return
          }
          // Any other tap inside the grid (an open/enquiries-received date,
          // a blank padding cell) is unrelated to the waitlist — close
          // rather than leave a stale prompt open against the wrong date.
          if (wlPop.classList.contains("show")) wlClose()
        })
      }
    }

    if (wlHoverCapable) {
      wlPop.addEventListener("mouseenter", wlClearCloseTimer)
      wlPop.addEventListener("mouseleave", wlScheduleClose)
    }
    if (wlCloseBtn) wlCloseBtn.addEventListener("click", wlClose)
    // "submit", not a click on the button — a real <form> (see the markup)
    // means Enter in either field fires this too, not just clicking the button.
    if (wlForm) {
      wlForm.addEventListener("submit", function (e) {
        // Native constraint validation (required + type="email" on the field
        // itself) already ran before this event could even fire — nothing
        // left to check here, just stop the actual (non-existent) form
        // navigation.
        e.preventDefault()
        wlEmailOut.textContent = wlEmailInput.value
        wlBodyEl.hidden = true
        wlSuccessEl.hidden = false
      })
    }
    document.addEventListener("click", function (e) {
      if (
        wlPop.classList.contains("show") &&
        !wlPop.contains(e.target) &&
        !e.target.closest(".availability-grid")
      )
        wlClose()
    })
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && wlPop.classList.contains("show")) wlClose()
    })
    // Capture phase, not bubble — a "scroll" event never bubbles, so a plain
    // window listener only ever fires for the page's own scroll, not for
    // scrolling *inside* something like .availability-modal (position:fixed
    // + its own overflow-y:auto, so it scrolls itself rather than the
    // page). The modal is exactly where this cell can be reached from, and
    // it's the more likely one to actually need scrolling on a short mobile
    // viewport — a capture-phase listener on window still gets invoked as
    // the event travels down to whatever actually scrolled, bubbling or not.
    window.addEventListener(
      "scroll",
      function () {
        if (wlPop.classList.contains("show")) wlPosition()
      },
      true,
    )
    window.addEventListener("resize", function () {
      if (wlPop.classList.contains("show")) wlPosition()
    })
  }

  availEls.forEach(function (el) {
    var monthEl = el.querySelector(".availability-month"),
      gridEl = el.querySelector(".availability-grid")
    if (el.classList.contains("diary") || el.classList.contains("compact"))
      wireWaitlistGrid(gridEl)
    var prevBtn = el.querySelector(".availability-prev"),
      nextBtn = el.querySelector(".availability-next")
    // Opens on the first month that actually has bookable dates, not the
    // current month — every day in the 3-month minimum-notice window is
    // "taken" regardless, so starting there would mean clicking forward
    // 3 times before seeing anything clickable. Backward navigation to
    // today's month is still allowed (see minMonth below), just not
    // where the calendar opens by default.
    var state = {
      view: new Date(minBookableDate.getFullYear(), minBookableDate.getMonth(), 1),
    }

    function render() {
      var view = state.view
      monthEl.textContent = names[view.getMonth()] + " " + view.getFullYear()
      gridEl.innerHTML = ""
      var first = new Date(view.getFullYear(), view.getMonth(), 1)
      var startDow = (first.getDay() + 6) % 7 // Monday-first
      var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
      for (var i = 0; i < startDow; i++) {
        var blank = document.createElement("div")
        blank.className = "availability-cell blank"
        gridEl.appendChild(blank)
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var cell = document.createElement("div")
        // <= not < : covers both "today or earlier" (can't book the past)
        // and, since minBookableDate is always >= today, the minimum
        // 3-month wedding lead-time window in one comparison.
        var isBeforeMinNotice =
          new Date(view.getFullYear(), view.getMonth(), d) <= minBookableDate
        var status = isBeforeMinNotice
          ? "taken"
          : seededStatus(view.getFullYear(), view.getMonth(), d)
        var iso = isoOf(view.getFullYear(), view.getMonth(), d)
        cell.className = "availability-cell " + status
        // Exposed on every cell regardless of status (not just the ones that get a
        // click listener below) so other code — e.g. the waitlist-prompt sandbox —
        // can read a cell's date without duplicating this render loop's own date math.
        cell.dataset.iso = iso
        if (
          view.getFullYear() === today.getFullYear() &&
          view.getMonth() === today.getMonth() &&
          d === today.getDate()
        )
          cell.classList.add("today")
        if (selected && selected.iso === iso) cell.classList.add("picked")
        cell.textContent = d
        if (!isBeforeMinNotice && status !== "taken") {
          cell.addEventListener(
            "click",
            (function (ymIso, st, dd, yy, mm, el) {
              return function () {
                handleCellClick(ymIso, st, dd, yy, mm, el)
              }
            })(iso, status, d, view.getFullYear(), view.getMonth(), cell),
          )
        }
        gridEl.appendChild(cell)
      }
      // Pad only to the end of the current week row (not a fixed 6 rows/42 cells —
      // that used to be deliberate, to stop content below the grid shifting as you
      // paged between months, but a month with fewer real weeks was then trailed by
      // a whole extra row of invisible .blank cells, which is what was actually
      // creating the oversized gap before the picked-date panel. Accepted trade-off:
      // paging to a month with a different row count now does shift that panel.
      var totalSoFar = startDow + daysInMonth
      var paddedTotal = Math.ceil(totalSoFar / 7) * 7
      for (var t = totalSoFar; t < paddedTotal; t++) {
        var trailing = document.createElement("div")
        trailing.className = "availability-cell blank"
        gridEl.appendChild(trailing)
      }
      if (prevBtn) prevBtn.disabled = sameMonth(view, minMonth)
      if (nextBtn) nextBtn.disabled = sameMonth(view, maxMonth)
    }

    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        if (prevBtn.disabled) return
        state.view.setMonth(state.view.getMonth() - 1)
        render()
      })
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        if (nextBtn.disabled) return
        state.view.setMonth(state.view.getMonth() + 1)
        render()
      })

    instances.push({ el: el, state: state, render: render })
  })

  instances.forEach(function (inst) {
    inst.render()
  })

  var goToFormBtn = document.getElementById("goToFormBtn")
  if (goToFormBtn) {
    goToFormBtn.addEventListener("click", function () {
      var f = document.getElementById("form")
      if (f) f.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  // Quick-pick modal — weddings.html only. Its wizard step 1 has no calendar
  // grid of its own, just a picked-date summary; "Pick a date" used to
  // scroll up to the real #availability section, leaving the form and losing
  // your place in it. Note that section now sits directly above the form
  // (moved 2026-09-23 — it and the form are one continuous act, and they
  // used to be five sections apart), so the scroll would be short rather
  // than the page-length trip this was originally written against. The
  // modal still earns its keep: a short scroll out of a part-filled
  // multi-step form is still a scroll out of it, and the wizard's own step
  // position is easy to lose. This opens a second grid instance instead —
  // same shared `selected` state, synced both ways via the generic
  // instances[]/.availability-picked/.availability-foot-label plumbing above, no special
  // casing needed here beyond opening/closing and picking the right month.
  var availModal = document.getElementById("availModal")
  var availChangeBtn = document.getElementById("availChangeBtn")
  var availModalDone = document.getElementById("availModalDone")
  if (availModal && availChangeBtn) {
    var modalInstance = instances.filter(function (inst) {
      return availModal.contains(inst.el)
    })[0]
    function openAvailModal() {
      // Always discard any leftover staged pick from a previous visit that
      // was closed without confirming, and re-render so the grid reflects
      // the real committed `selected` rather than a stale staged highlight.
      modalPending = undefined
      if (modalInstance) {
        if (selected) {
          var selMonth = new Date(selected.yy, selected.mm, 1)
          if (!sameMonth(modalInstance.state.view, selMonth))
            modalInstance.state.view = selMonth
        }
        modalInstance.render()
      }
      if (availModalDone) availModalDone.disabled = !selected
      availModal.classList.add("show")
      lockScroll("availability-modal")
    }
    function closeAvailModal() {
      modalPending = undefined
      availModal.classList.remove("show")
      unlockScroll("availability-modal")
    }
    availChangeBtn.addEventListener("click", openAvailModal)
    availModal.querySelectorAll("[data-avail-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeAvailModal)
    })
    if (availModalDone) {
      availModalDone.addEventListener("click", function () {
        if (availModalDone.disabled) return
        commitModalPending()
        closeAvailModal()
      })
    }
    availModal.addEventListener("click", function (e) {
      if (e.target === availModal) closeAvailModal()
    })
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && availModal.classList.contains("show")) closeAvailModal()
    })
  }
})()
