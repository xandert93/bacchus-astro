// The testimonials carousel (#testimonials). Loaded by Testimonials.astro.

import { reduce } from "./lib/motion.js"

// ---------- Testimonials rotator ----------
// Content lives here (not in the page) so the same markup on index.html/weddings.html
// shares one source.
;(function () {
  var section = document.getElementById("testimonials")
  var quoteBox = document.getElementById("tQuoteBox")
  var quoteEl = document.getElementById("tQuote")
  var metaEl = document.getElementById("tMeta")
  var cardsWrap = document.getElementById("tCards")
  var dotsWrap = document.getElementById("tDots")
  var prevBtn = document.getElementById("tPrev")
  var nextBtn = document.getElementById("tNext")
  var ringFill = document.getElementById("tRingFill")
  var starsWrap = document.getElementById("tStars")
  if (
    !section ||
    !quoteBox ||
    !quoteEl ||
    !metaEl ||
    !cardsWrap ||
    !dotsWrap ||
    !prevBtn ||
    !nextBtn ||
    !ringFill ||
    !starsWrap
  )
    return
  var stars = [].slice.call(starsWrap.children)
  // Keep in sync with the r="23" on #tRingFill/.testimonial-ring-track in the markup.
  var T_RING_CIRC = 2 * Math.PI * 23
  ringFill.style.strokeDasharray = String(T_RING_CIRC)

  // <em> markers below become real <em> elements (see tBuildQuoteNodes) —
  // color/italic already come for free from the existing .quote blockquote em
  // rule (color: gold-2) plus <em>'s default browser italic, which nothing
  // in this stylesheet resets. Safe to author as inline markup here since
  // this is our own hardcoded array, not remote/user content.
  var items = [
    {
      quote:
        "We would like to express our appreciation and thanks for the <em>impeccable service you offered us on our wedding day</em>.",
      name: "Mandy & Gabriel Camenzuli",
      category: "Wedding celebration",
      location: "Malta",
      date: "26 April 2014",
      rating: 5,
    },
    {
      quote:
        "Thank you from the bottom of our hearts to all who shared our marriage in presence and thought! We had a <em>magical time and are still in a trance</em>!",
      name: "Mel & James Zammit",
      category: "Wedding celebration",
      location: "Malta",
      rating: 5,
    },
    {
      quote:
        "Had our wedding at Bacchus and I would definitely recommend it. <em>Food, venue and service were impeccable.</em> Thanks to Francois and his team our special day was extra special.",
      name: "Marvin W",
      category: "Wedding celebration",
      location: "Malta",
      rating: 5,
    },
    {
      quote:
        "Cannot thank them enough. An impeccable service from start to finish. They gave us a plenty of choice and helped us all way through. <em>The service on the day was impeccable and the food was sublime</em> with good portion sizes.",
      name: "Daniela C",
      category: "Wedding celebration",
      location: "Malta",
      rating: 5,
    },
  ]

  var tActive = 0,
    tFadeTimer = null,
    tRafId = null,
    tCycleStart = null,
    tProgress = 0
  var T_FADE_MS = 220
  var T_CYCLE_MS = 8000

  items.forEach(function (item, i) {
    var card = document.createElement("button")
    card.type = "button"
    card.className = "testimonial-card"
    card.setAttribute("role", "tab")
    card.setAttribute("aria-label", "Read testimonial from " + item.name)
    card.innerHTML =
      '<span class="testimonial-card-name"></span><span class="testimonial-card-category"></span>'
    card.querySelector(".testimonial-card-name").textContent = item.name
    card.querySelector(".testimonial-card-category").textContent = item.category
    card.addEventListener("click", function () {
      tShow(i)
    })
    cardsWrap.appendChild(card)

    var dot = document.createElement("span")
    dot.className = "testimonial-dot"
    dotsWrap.appendChild(dot)
  })
  var cards = [].slice.call(cardsWrap.children)
  var dots = [].slice.call(dotsWrap.children)

  var T_MAX_LINES = 5

  // Turns <em>...</em> markers in a quote string into real <em> elements
  // (plain text elsewhere) — safe here since `text` only ever comes from
  // our own hardcoded items array above, never remote/user content.
  function tBuildQuoteNodes(text) {
    var frag = document.createDocumentFragment()
    var re = /<em>(.*?)<\/em>/g
    var lastIndex = 0,
      m
    while ((m = re.exec(text))) {
      if (m.index > lastIndex)
        frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)))
      var em = document.createElement("em")
      em.textContent = m[1]
      frag.appendChild(em)
      lastIndex = re.lastIndex
    }
    if (lastIndex < text.length)
      frag.appendChild(document.createTextNode(text.slice(lastIndex)))
    return frag
  }

  // Builds the quote as DOM nodes (open-mark span, body, optional close-mark
  // span) rather than one textContent string, so the “ “ characters can be
  // styled (.testimonial-quote-mark) independently of the quote body. Truncated text
  // gets an ellipsis instead of the closing mark, so `closed` is omitted.
  function tSetQuoteContent(text, closed) {
    quoteEl.textContent = ""
    var open = document.createElement("span")
    open.className = "testimonial-quote-mark"
    open.textContent = "“"
    quoteEl.appendChild(open)
    quoteEl.appendChild(tBuildQuoteNodes(text))
    if (closed) {
      var close = document.createElement("span")
      close.className = "testimonial-quote-mark"
      close.textContent = "”"
      quoteEl.appendChild(close)
    }
  }

  function tRender(i) {
    var item = items[i]
    tSetQuoteContent(item.quote, true)
    var lineHeight = parseFloat(getComputedStyle(quoteEl).lineHeight)
    if (lineHeight) {
      var maxHeight = lineHeight * T_MAX_LINES + 1
      // Word-split on the <em>-stripped text, not item.quote directly — an
      // </em> could otherwise land past the cut and leave an emphasis span
      // unclosed. The truncated result is always rendered as plain text
      // (tSetQuoteContent falls back to that automatically when there's no
      // <em> marker left to match), which is an acceptable simplification
      // since none of the current quotes actually reach the 5-line cap.
      var words = item.quote.replace(/<\/?em>/g, "").split(" ")
      while (words.length > 1 && quoteEl.scrollHeight > maxHeight) {
        words.pop()
        tSetQuoteContent(words.join(" ") + "…", false)
      }
    }
    metaEl.textContent = ""
    var nameEl = document.createElement("div")
    nameEl.className = "testimonial-meta-name"
    nameEl.textContent = item.name
    metaEl.appendChild(nameEl)
    var sub = [item.category, item.location]
    if (item.date) sub.push(item.date)
    var subEl = document.createElement("div")
    subEl.className = "testimonial-meta-sub"
    subEl.textContent = sub.join(" · ")
    metaEl.appendChild(subEl)
    stars.forEach(function (s, si) {
      s.classList.toggle("is-empty", si >= item.rating)
    })
    cards.forEach(function (c, ci) {
      c.classList.toggle("is-active", ci === i)
      c.setAttribute("aria-selected", ci === i ? "true" : "false")
    })
    dots.forEach(function (d, di) {
      d.classList.toggle("is-active", di === i)
    })
  }

  function tResetTimer() {
    tProgress = 0
    tCycleStart = null
    ringFill.style.strokeDashoffset = String(T_RING_CIRC)
  }

  // Quote+meta text length varies per testimonial, which otherwise changes
  // .testimonial-quote-box's height on every swap and shifts everything below it
  // (cards, controls, footer) — reserve height for the tallest combination
  // up front instead. Re-measured on load/resize since the box's width and
  // the Fraunces web font (loaded with font-display: swap) both affect wrap.
  function tMeasureMinHeight() {
    quoteBox.style.minHeight = "0px"
    var max = 0
    items.forEach(function (item, i) {
      tRender(i)
      max = Math.max(max, quoteBox.offsetHeight)
    })
    tRender(tActive)
    quoteBox.style.minHeight = max + "px"
  }

  function tFade(el, out) {
    // Inline styles, not a .testimonial-fade-out class: #tQuote/#tMeta carry data-reveal
    // for the page's scroll-in animation, and once scrolled into view they get
    // .is-revealed added, and [data-reveal].is-revealed (attribute+class, specificity 0,2,0) beats
    // a plain single-class rule (0,1,0) — a class-based fade toggle here is
    // permanently a no-op. Inline styles always win over any stylesheet rule,
    // so setting them directly sidesteps the collision instead of trying to
    // out-specify it. Clearing them (empty string) lets [data-reveal].is-revealed's
    // opacity:1/transform:none reassert itself for the fade back in.
    // Also drop the inline --d custom property here (once, on the first
    // fade-out): [data-reveal] sets transition-delay: var(--d, 0ms)
    // separately from its transition shorthand, so it survives the rule
    // above and keeps applying to every later transition on this element —
    // meant only for the one-time page-load reveal stagger (120ms/200ms),
    // it would otherwise desync the quote/meta fade on every rotation.
    if (out) el.style.removeProperty("--d")
    el.style.opacity = out ? "0" : ""
    el.style.transform = out ? "translateY(6px)" : ""
  }

  function tShow(i) {
    tActive = (i + items.length) % items.length
    tResetTimer()
    tSync()
    if (reduce) {
      tRender(tActive)
      return
    }
    clearTimeout(tFadeTimer)
    tFade(quoteEl, true)
    tFade(metaEl, true)
    starsWrap.classList.remove("is-in-view")
    tFadeTimer = setTimeout(function () {
      tRender(tActive)
      // A second, short timeout — not nested requestAnimationFrame — gives the
      // browser a paint boundary between the content swap and the style
      // change. Doing both in the same tick lets it coalesce into one paint
      // with no in-between frame to animate the fade-back-in across (bug #7
      // in CLAUDE.md); this mirrors the wizard's showStep() sequencing. Same
      // reasoning applies to re-adding is-in here rather than alongside the
      // tRender() call above — it needs its own frame boundary to replay the
      // stars' staggered entrance instead of snapping straight to visible.
      tFadeTimer = setTimeout(function () {
        tFade(quoteEl, false)
        tFade(metaEl, false)
        starsWrap.classList.add("is-in-view")
      }, 30)
    }, T_FADE_MS)
  }

  // No explicit tPause() here — tShow() calls tSync() itself, which is the
  // single source of truth for whether the loop should be running.
  prevBtn.addEventListener("click", function () {
    tShow(tActive - 1)
  })
  nextBtn.addEventListener("click", function () {
    tShow(tActive + 1)
  })

  // requestAnimationFrame, not a fixed-interval tick: elapsed real time since
  // tCycleStart drives the percentage every frame (~60fps) so the ring's
  // conic-gradient edge sweeps continuously instead of jumping in visible
  // steps. tCycleStart is derived from the current tProgress on (re)start,
  // so pausing/resuming (hover, scrolling out of view, manual nav) picks up
  // from wherever the ring was rather than resetting or skipping ahead.
  function tTickFrame(now) {
    if (tCycleStart === null) tCycleStart = now - (tProgress / 100) * T_CYCLE_MS
    tProgress = Math.min(100, ((now - tCycleStart) / T_CYCLE_MS) * 100)
    ringFill.style.strokeDashoffset = String(T_RING_CIRC * (1 - tProgress / 100))
    // tRafId must be nulled *before* tShow() — tShow() calls tSync(), whose
    // tStart() no-ops if tRafId is still truthy. A completed animation
    // frame's id is stale (it already fired), but nothing else clears it,
    // so leaving it set here would make the very next cycle's tStart() call
    // think a frame is already pending and refuse to schedule a new one —
    // exactly the "completes once, then never restarts" bug this replaces.
    if (tProgress >= 100) {
      tRafId = null
      tShow(tActive + 1)
      return
    }
    tRafId = requestAnimationFrame(tTickFrame)
  }
  function tPause() {
    if (tRafId) cancelAnimationFrame(tRafId)
    tRafId = null
    tCycleStart = null
  }
  function tStart() {
    if (reduce || tRafId) return
    tRafId = requestAnimationFrame(tTickFrame)
  }
  // Single source of truth for whether the loop should be running, recomputed
  // on every relevant state change (visibility, hover, a new testimonial
  // shown) instead of scattering one-off tStart()/tPause() calls that each
  // only covered their own trigger and left the others with no way back in.
  var tHovering = false,
    tInView = false
  function tSync() {
    if (!reduce && tInView && !tHovering) tStart()
    else tPause()
  }
  var tObs = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        tInView = e.isIntersecting
        tSync()
      })
    },
    { threshold: 0.4 },
  )
  tObs.observe(section)
  // Mouse only. On touch, browsers fire a compatibility mouseenter after
  // a tap but no mouseleave until the visitor taps somewhere else, so
  // tapping the next arrow used to pause autoplay — the ring visibly
  // stopped — until the next tap elsewhere. pointerType filters that out;
  // a tap has no hover to pause for.
  nextBtn.addEventListener("pointerenter", function (e) {
    if (e.pointerType !== "mouse") return
    tHovering = true
    tSync()
  })
  nextBtn.addEventListener("pointerleave", function (e) {
    if (e.pointerType !== "mouse") return
    tHovering = false
    tSync()
  })

  tRender(0)
  starsWrap.classList.add("is-in-view")
  tMeasureMinHeight()
  window.addEventListener("load", tMeasureMinHeight)
  window.addEventListener("resize", tMeasureMinHeight)
})()
