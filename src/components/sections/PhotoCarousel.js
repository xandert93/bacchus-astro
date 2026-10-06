// The drag/swipe photo strip (#carView / #carTrack): homepage "Across the
// estate" and every package page's "closer look". No-ops without it.

import { reduce } from "@scripts/lib/motion.js"

// ---------- Carousel ----------
var track = document.getElementById("carTrack"),
  view = document.getElementById("carView")
if (track && view) {
  var slides = [].slice.call(track.children)
  var prev = document.getElementById("prev"),
    next = document.getElementById("next")
  var bar = document.getElementById("carBar"),
    now = document.getElementById("carNow"),
    total = document.getElementById("carTotal")
  var index = 0,
    drag = null,
    autoTimer = null

  const cstep = () => {
    var r = slides[0].getBoundingClientRect()
    return r.width + parseFloat(getComputedStyle(track).gap || 0)
  }
  // How far the track can travel before its last slide sits flush with
  // the right edge of the view. Everything below is derived from this
  // one number, in real pixels — the version this replaces estimated it
  // by ROUNDING view.clientWidth / cstep() to a whole number of visible
  // slides, which is wrong at any width where a fractional number
  // actually show (~1.4 cards peeking in, say), and the error ran in
  // whichever direction the rounding happened to go.
  const maxOffset = () => Math.max(0, track.scrollWidth - view.clientWidth)
  // CEIL, not floor. Travel is almost never a whole number of steps —
  // with five slides and a part-slide of overhang, maxOffset/cstep comes
  // out at something like 2.3. Flooring that to 2 stops the track one
  // whole step short of the end, which is what left the last slide
  // clipped in half with no way to reach the rest of it, by click, drag
  // or swipe alike (go() clamps all three to this). Ceiling to 3 gives
  // the track somewhere to go; render() then clamps that last step's
  // OFFSET to maxOffset so it lands flush against the end instead of
  // overshooting into blank space. The final step is therefore a short
  // one — deliberately, since the alternative is an unreachable slide.
  const maxIndex = () => {
    var step = cstep()
    return step > 0 ? Math.ceil(maxOffset() / step) : 0
  }
  // What the counter names. index is a scroll POSITION, not a slide, and
  // once more than one slide fits on screen no single number can honestly
  // stand for "where you are" — which is why this reports a RANGE of
  // slides rather than a number.
  //
  // Two single-number rules were tried first and both produced a visible
  // wart. `index + 1` never reached "5 / 5" even with the fifth slide
  // fully on screen, because there are only four scroll positions for
  // five slides at that width. Switching to "the last slide, once at the
  // end of the track" did reach 5 / 5, but then skipped a number on the
  // way — 1, 2, 3, 5 — and pressing Next on 3 / 5 jumped straight to
  // 5 / 5, which reads as broken even though the carousel is behaving.
  // Giving every slide its own position was rejected too: the last two
  // positions clamp to the same scroll offset (see maxIndex), so Next
  // would change the number without moving anything, and a dead press is
  // worse than a skipped number.
  //
  // So: "1–2 / 5", "2–3 / 5", "4–5 / 5". Sequential, always ends on the
  // real total, and it describes what is actually on screen. Where only
  // one slide fits — every mobile width — first and last coincide and it
  // renders as the plain "2 / 5" it always was.
  //
  // FULLY visible, not merely intersecting: at these widths a third slide
  // is usually peeking in by a sliver, and counting that would claim more
  // than the visitor can really see.
  const visibleSlideRange = () => {
    var windowStart = offsetFor(index)
    var windowEnd = windowStart + view.clientWidth
    var base = slides[0].offsetLeft
    var first = -1,
      last = -1
    slides.forEach((slide, i) => {
      var left = slide.offsetLeft - base
      // 1px of tolerance: these are fractional at most viewport widths.
      if (left >= windowStart - 1 && left + slide.offsetWidth <= windowEnd + 1) {
        if (first === -1) first = i
        last = i
      }
    })
    // Nothing fits whole (a slide wider than its window). Fall back to the
    // scroll position itself rather than reporting an empty range.
    if (first === -1) return { first: index, last: index }
    return { first: first, last: last }
  }
  // The committed pixel offset for an index, clamped to the end of
  // travel. Shared by render() and the drag's own live transform so both
  // agree on where a given index actually sits — reading it only inside
  // render() would mean a drag starting on the final (short) step
  // computed its base from the unclamped index * cstep() and jumped
  // forward the moment it was grabbed.
  const offsetFor = (i) => Math.min(i * cstep(), maxOffset())
  const render = (animate) => {
    track.style.transition = animate === false ? "none" : ""
    track.style.transform = "translate3d(" + -offsetFor(index) + "px,0,0)"
    if (prev) prev.disabled = index <= 0
    if (next) next.disabled = index >= maxIndex()
    var range = visibleSlideRange()
    if (now)
      now.textContent =
        range.first === range.last
          ? String(range.first + 1)
          : // En dash, not a hyphen: this is a range, and it matches the
            // site's typography elsewhere.
            range.first + 1 + "–" + (range.last + 1)
    // Written from here rather than left hardcoded in the markup, so the
    // two halves of the counter can never disagree.
    if (total) total.textContent = String(slides.length)
    // Fills by the LAST slide on screen, so it reads full exactly when
    // the final slide is visible — which is also when the counter reads
    // "… / total".
    if (bar) bar.style.transform = "scaleX(" + (range.last + 1) / slides.length + ")"
  }
  const go = (i) => {
    index = Math.max(0, Math.min(maxIndex(), i))
    render()
  }
  if (prev)
    prev.addEventListener("click", () => {
      go(index - 1)
      pauseAuto()
    })
  if (next)
    next.addEventListener("click", () => {
      go(index + 1)
      pauseAuto()
    })
  window.addEventListener("resize", () => {
    go(index)
  })
  window.addEventListener("load", () => {
    render(false)
  })

  const down = (x) => {
    drag = { x: x, start: index, moved: 0 }
    view.classList.add("drag")
    track.style.transition = "none"
    pauseAuto()
  }
  const move = (x) => {
    if (!drag) return
    drag.moved = x - drag.x
    track.style.transform =
      "translate3d(" + (-offsetFor(drag.start) + drag.moved) + "px,0,0)"
  }
  const up = () => {
    if (!drag) return
    track.style.transition = ""
    var shift = Math.round(-drag.moved / cstep())
    go(
      drag.start +
        (Math.abs(drag.moved) > cstep() * 0.12
          ? shift === 0
            ? drag.moved < 0
              ? 1
              : -1
            : shift
          : 0),
    )
    drag = null
    view.classList.remove("drag")
  }
  view.addEventListener("pointerdown", (e) => {
    down(e.clientX)
  })
  window.addEventListener(
    "pointermove",
    (e) => {
      if (drag) {
        e.preventDefault()
        move(e.clientX)
      }
    },
    { passive: false },
  )
  window.addEventListener("pointerup", up)
  view.addEventListener("dragstart", (e) => {
    e.preventDefault()
  })
  view.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(index + 1)
    if (e.key === "ArrowLeft") go(index - 1)
  })
  view.setAttribute("tabindex", "0")

  // ---- Trackpad wheel paging ----
  // A two-finger trackpad swipe is a native "wheel" event with a
  // horizontal deltaX — not a drag — and it already works for free on
  // the reception page's stations carousel, because that one is a real
  // overflow-x scroll container the browser handles for itself. This
  // carousel is transform-based (no native scroll surface), so the same
  // gesture has to be built by hand here. Deliberately coarse — one
  // slide per gesture via go(), the same step every click/arrow-key
  // commit already uses — rather than a 1:1 scrub of the transform:
  // wheel events arrive as a bursty stream of small deltas, not an
  // absolute position the way a pointer drag does, so treating it as
  // continuous input would mean reconstructing momentum from scratch for
  // very little gain on what's a discrete, five-slide carousel.
  var wheelDeltaX = 0,
    wheelLocked = false
  var WHEEL_STEP_PX = 40 // accumulated deltaX that commits one slide
  var WHEEL_LOCK_MS = 350 // ignore further wheel input until this settles
  view.addEventListener(
    "wheel",
    (e) => {
      // A mouse's plain vertical wheel, or a trackpad swipe that's
      // mostly vertical, is an ordinary page-scroll — leave it alone
      // entirely (no preventDefault) so the page scrolls as expected.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      // A clearly-horizontal swipe is ours from here, even before the
      // step threshold below is reached — also doubles as the fix for a
      // real browser quirk: an un-prevented strong horizontal trackpad
      // swipe can trigger the browser's own back/forward page
      // navigation gesture.
      e.preventDefault()
      if (wheelLocked) return
      wheelDeltaX += e.deltaX
      if (Math.abs(wheelDeltaX) < WHEEL_STEP_PX) return
      go(index + (wheelDeltaX > 0 ? 1 : -1))
      pauseAuto()
      wheelDeltaX = 0
      wheelLocked = true
      setTimeout(() => {
        wheelLocked = false
      }, WHEEL_LOCK_MS)
    },
    { passive: false },
  )

  const pauseAuto = () => {
    clearInterval(autoTimer)
    autoTimer = null
  }
  const startAuto = () => {
    if (reduce || autoTimer) return
    autoTimer = setInterval(() => {
      go(index >= maxIndex() ? 0 : index + 1)
    }, 5200)
  }
  var carObs = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        e.isIntersecting ? startAuto() : pauseAuto()
      })
    },
    { threshold: 0.4 },
  )
  carObs.observe(view)
  view.addEventListener("mouseenter", pauseAuto)
}
