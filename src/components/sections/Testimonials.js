// The testimonials carousel (#testimonials). Loaded by Testimonials.astro.

import { reduce } from "@scripts/lib/motion.js"

// ---------- Testimonials rotator ----------
;(() => {
  const section = document.getElementById("testimonials")
  const quoteBox = document.getElementById("tQuoteBox")
  const quoteEl = document.getElementById("tQuote")
  const metaEl = document.getElementById("tMeta")
  const cardsWrap = document.getElementById("tCards")
  const dotsWrap = document.getElementById("tDots")
  const prevBtn = document.getElementById("tPrev")
  const nextBtn = document.getElementById("tNext")
  const ringFill = document.getElementById("tRingFill")
  const starsWrap = document.getElementById("tStars")
  const dataEl = document.getElementById("testimonialsData")
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
    !starsWrap ||
    !dataEl
  )
    return
  const stars = [].slice.call(starsWrap.children)
  // Keep in sync with the r="23" on #tRingFill/.testimonial-ring-track in the markup.
  const T_RING_CIRC = 2 * Math.PI * 23
  ringFill.style.strokeDasharray = String(T_RING_CIRC)

  // The testimonials come from Sanity at build time. Testimonials.astro
  // renders the picker cards and dots from them, and writes the same list
  // into the page as JSON for this script, since the browser can't query
  // Sanity itself. <em> markers become real <em> elements (see
  // tBuildQuoteNodes) — the gold comes from Testimonials.astro's .quote
  // blockquote em rule, the italic from <em>'s own default.
  const items = JSON.parse(dataEl.textContent)

  let tActive = 0,
    tFadeTimer = null,
    tRafId = null,
    tCycleStart = null,
    tProgress = 0
  const T_FADE_MS = 220
  const T_CYCLE_MS = 8000

  // Cards and dots are rendered by Testimonials.astro, one per item, in order.
  const cards = [].slice.call(cardsWrap.children)
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      tShow(i)
    })
  })
  const dots = [].slice.call(dotsWrap.children)

  const T_MAX_LINES = 5

  // Turns <em>...</em> markers in a quote string into real <em> elements
  // (plain text elsewhere). Every piece goes in as a text node, never as
  // HTML, so nothing in a quote can inject markup.
  const tBuildQuoteNodes = (text) => {
    const frag = document.createDocumentFragment()
    const re = /<em>(.*?)<\/em>/g
    let lastIndex = 0,
      m
    while ((m = re.exec(text))) {
      if (m.index > lastIndex)
        frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)))
      const em = document.createElement("em")
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
  const tSetQuoteContent = (text, closed) => {
    quoteEl.textContent = ""
    const open = document.createElement("span")
    open.className = "testimonial-quote-mark"
    open.textContent = "“"
    quoteEl.appendChild(open)
    quoteEl.appendChild(tBuildQuoteNodes(text))
    if (closed) {
      const close = document.createElement("span")
      close.className = "testimonial-quote-mark"
      close.textContent = "”"
      quoteEl.appendChild(close)
    }
  }

  const tRender = (i) => {
    const item = items[i]
    tSetQuoteContent(item.quote, true)
    const lineHeight = parseFloat(getComputedStyle(quoteEl).lineHeight)
    if (lineHeight) {
      const maxHeight = lineHeight * T_MAX_LINES + 1
      // Word-split on the <em>-stripped text, not item.quote directly — an
      // </em> could otherwise land past the cut and leave an emphasis span
      // unclosed. The truncated result is always rendered as plain text
      // (tSetQuoteContent falls back to that automatically when there's no
      // <em> marker left to match), which is an acceptable simplification
      // since none of the current quotes actually reach the 5-line cap.
      const words = item.quote.replace(/<\/?em>/g, "").split(" ")
      while (words.length > 1 && quoteEl.scrollHeight > maxHeight) {
        words.pop()
        tSetQuoteContent(words.join(" ") + "…", false)
      }
    }
    metaEl.textContent = ""
    const nameEl = document.createElement("div")
    nameEl.className = "testimonial-meta-name"
    nameEl.textContent = item.name
    metaEl.appendChild(nameEl)
    const sub = [item.category, item.location]
    if (item.date) sub.push(item.date)
    const subEl = document.createElement("div")
    subEl.className = "testimonial-meta-sub"
    subEl.textContent = sub.join(" · ")
    metaEl.appendChild(subEl)
    stars.forEach((s, si) => {
      s.classList.toggle("is-empty", si >= item.rating)
    })
    cards.forEach((c, ci) => {
      c.classList.toggle("is-active", ci === i)
      c.setAttribute("aria-selected", ci === i ? "true" : "false")
    })
    dots.forEach((d, di) => {
      d.classList.toggle("is-active", di === i)
    })
  }

  const tResetTimer = () => {
    tProgress = 0
    tCycleStart = null
    ringFill.style.strokeDashoffset = String(T_RING_CIRC)
  }

  // Quote+meta text length varies per testimonial, which otherwise changes
  // .testimonial-quote-box's height on every swap and shifts everything below it
  // (cards, controls, footer) — reserve height for the tallest combination
  // up front instead. Re-measured on load/resize since the box's width and
  // the Fraunces web font (loaded with font-display: swap) both affect wrap.
  const tMeasureMinHeight = () => {
    quoteBox.style.minHeight = "0px"
    let max = 0
    items.forEach((item, i) => {
      tRender(i)
      max = Math.max(max, quoteBox.offsetHeight)
    })
    tRender(tActive)
    quoteBox.style.minHeight = max + "px"
  }

  const tFade = (el, out) => {
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

  const tShow = (i) => {
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
    tFadeTimer = setTimeout(() => {
      tRender(tActive)
      // A second, short timeout — not nested requestAnimationFrame — gives the
      // browser a paint boundary between the content swap and the style
      // change. Doing both in the same tick lets it coalesce into one paint
      // with no in-between frame to animate the fade-back-in across (the
      // same-tick class-swap bug); this mirrors the wizard's showStep() sequencing. Same
      // reasoning applies to re-adding is-in here rather than alongside the
      // tRender() call above — it needs its own frame boundary to replay the
      // stars' staggered entrance instead of snapping straight to visible.
      tFadeTimer = setTimeout(() => {
        tFade(quoteEl, false)
        tFade(metaEl, false)
        starsWrap.classList.add("is-in-view")
      }, 30)
    }, T_FADE_MS)
  }

  // No explicit tPause() here — tShow() calls tSync() itself, which is the
  // single source of truth for whether the loop should be running.
  const tPrev = () => {
    tShow(tActive - 1)
  }
  const tNext = () => {
    tShow(tActive + 1)
  }
  prevBtn.addEventListener("click", tPrev)
  nextBtn.addEventListener("click", tNext)

  // A decisive horizontal swipe on the quote steps prev/next, the same as
  // the arrows — the lightbox's gesture, touch and pen only: with a mouse,
  // dragging across the quote is how a visitor selects its text.
  let tSwipe = null
  quoteBox.addEventListener("pointerdown", (e) => {
    tSwipe = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY }
  })
  quoteBox.addEventListener("pointerup", (e) => {
    if (!tSwipe) return
    const dx = e.clientX - tSwipe.x
    const dy = e.clientY - tSwipe.y
    tSwipe = null
    if (Math.abs(dx) <= 50 || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) tNext()
    else tPrev()
  })
  quoteBox.addEventListener("pointercancel", () => {
    tSwipe = null
  })

  // requestAnimationFrame, not a fixed-interval tick: elapsed real time since
  // tCycleStart drives the percentage every frame (~60fps) so the ring's
  // conic-gradient edge sweeps continuously instead of jumping in visible
  // steps. tCycleStart is derived from the current tProgress on (re)start,
  // so pausing/resuming (hover, scrolling out of view, manual nav) picks up
  // from wherever the ring was rather than resetting or skipping ahead.
  const tTickFrame = (now) => {
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
  const tPause = () => {
    if (tRafId) cancelAnimationFrame(tRafId)
    tRafId = null
    tCycleStart = null
  }
  const tStart = () => {
    if (reduce || tRafId) return
    tRafId = requestAnimationFrame(tTickFrame)
  }
  // Single source of truth for whether the loop should be running, recomputed
  // on every relevant state change (visibility, hover, a new testimonial
  // shown) instead of scattering one-off tStart()/tPause() calls that each
  // only covered their own trigger and left the others with no way back in.
  let tHovering = false,
    tInView = false
  const tSync = () => {
    if (!reduce && tInView && !tHovering) tStart()
    else tPause()
  }
  const tObs = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
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
  nextBtn.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return
    tHovering = true
    tSync()
  })
  nextBtn.addEventListener("pointerleave", (e) => {
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
