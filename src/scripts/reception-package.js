// Reception package page: tier controller, photo carousel, and the Stations
// section's controllers (stage, category tabs, carousel, lightbox). Was the
// page's inline <script>; carried over verbatim apart from this header.
//
// Imports tabs.js so window.BacchusTabs exists before this runs — see the
// same note in package-tiers.js.
import "./tabs.js"
import "./photo-carousel.js"

// Page-specific tier controller. Drives every way of changing tier —
// the tab bar, the tier cards, the sticky switcher and touch swipe —
// plus the #hash sync that makes a tier directly linkable without
// needing a separate page for each (see the "package switcher vs.
// separate pages" discussion in CLAUDE.md). main.js's shared tab
// helper still supplies the sliding pill and aria bookkeeping; the
// carousel below is this page's own. Guarded the same way every other
// page-specific script here is (bug #4 — no-ops if .tab-bar is absent).
;(function () {
  var tabs = [].slice.call(document.querySelectorAll(".tab-bar button"))
  if (!tabs.length) return
  var tierCards = [].slice.call(document.querySelectorAll(".package-tier-card"))
  var stickySwitch = document.getElementById("packageStickySwitch")
  var stickyBtns = stickySwitch
    ? [].slice.call(stickySwitch.querySelectorAll(".package-sticky-switch-btn"))
    : []
  // Wires up the sticky switcher's own sliding pill via the shared
  // implementation in main.js (window.BacchusTabs.initTabGroup) —
  // same mechanism the real tab bar uses, not a second hand-rolled
  // copy of the slide math. No panelSelector: this group only needs
  // its own active state and pill, never panels of its own (the
  // carousel below owns which tier is shown). Deliberately not given
  // the .tab-bar class, for the reason documented on
  // .package-sticky-switch's own CSS.
  var stickyGroup =
    stickySwitch && window.BacchusTabs
      ? window.BacchusTabs.initTabGroup(stickySwitch, {})
      : null

  // Keeps the card grid's selected state (checkmark, gold border,
  // which single card shows on mobile) matched to the active tier.
  // Called only from applyTierState below, so a card never drives
  // this state directly even when a card is what was clicked — there
  // is one path that decides the active tier, and this reflects it.
  function syncTierCards(tierKey) {
    tierCards.forEach(function (card) {
      var isActive = card.dataset.tierCard === tierKey
      card.classList.toggle("active", isActive)
      card.setAttribute("aria-pressed", isActive ? "true" : "false")
    })
  }

  // Same idea as syncTierCards, for the sticky switcher's own active
  // state and pill. Delegates to stickyGroup.selectTab (the shared
  // main.js mechanism) rather than toggling .active by hand, so a
  // tier changed from anywhere else slides this pill exactly as a
  // direct click on it would — one implementation, not two. Calling
  // selectTab rather than btn.click() also keeps it clear of this
  // group's own click listener, so it can't loop back into itself.
  function syncStickySwitch(tierKey) {
    if (!stickyGroup) return
    var btn = stickyBtns.filter(function (b) {
      return b.dataset.tierSwitch === tierKey
    })[0]
    if (btn) stickyGroup.selectTab(btn)
  }

  // ================= Tier carousel =================
  // All three tiers are laid out side by side at once in a flex track
  // (.panels) inside .package-tier-view, rather than main.js's usual
  // "show one .tab-panel, hide the rest". The window is a NATIVE
  // horizontal scroll-snap container (see its CSS above for why the
  // hand-rolled pointer drag this replaces could never work on
  // touch), so the browser owns all swiping and this file owns none
  // of it. Two ways to change tier, with deliberately different
  // motion:
  //
  //   • Click (tab bar, tier card, sticky switcher) — the window cuts
  //     straight to the new tier with no visible movement, and the
  //     content plays its vertical fade. Same as this page behaved
  //     before it had swipe at all.
  //   • Swipe — the browser scrolls and snaps; no fade at all, since
  //     the content is simply already there, the way a photo carousel
  //     behaves.
  //
  // Which tier is active is DERIVED FROM SCROLL POSITION, never
  // stored separately: a click scrolls, and the scroll handler is
  // what updates the tab bar, cards and sticky switcher. One-way
  // flow, so a swipe and a click cannot disagree about which tier is
  // showing — the same model the stations carousel on this page
  // already documents. Reception has exactly three tiers, so none of
  // this generalises to N slides.

  var view = document.getElementById("packageTierView")
  var track = document.getElementById("packageTierTrack")
  if (!view || !track) return

  var TIERS = ["daisy", "lavender", "rose"]
  // How long after the last scroll event the gesture counts as
  // finished. There is no scrollend event to rely on across the
  // browsers this has to work in, so settling is debounced instead.
  var SCROLL_SETTLE_MS = 140

  var index = 0

  function panelFor(tierKey) {
    return document.querySelector('.tab-panel[data-panel="' + tierKey + '"]')
  }
  function tabFor(tierKey) {
    return tabs.filter(function (b) {
      return b.dataset.tab === tierKey
    })[0]
  }
  // Distance from one slide's left edge to the next: the window's own
  // width plus the real gap between slides, measured rather than
  // hardcoded — same approach as the homepage carousel. Now used to
  // convert between scrollLeft and a tier index in both directions.
  function slideStep() {
    return view.clientWidth + parseFloat(getComputedStyle(track).gap || 0)
  }
  // Which tier the window is currently parked on (or nearest to,
  // mid-scroll). Rounding is what makes a half-finished swipe resolve
  // to whichever tier it is closest to.
  function indexFromScroll() {
    var step = slideStep()
    if (!step) return index
    return Math.max(0, Math.min(TIERS.length - 1, Math.round(view.scrollLeft / step)))
  }

  // ---- The two motions ----
  // Parks the window on a tier. Always instant: a click is the only
  // caller, and a click's motion is the content fade below, not
  // visible travel — which is also why .package-tier-view carries no
  // scroll-behavior: smooth. A swipe never comes through here at all;
  // the browser is already scrolling, and scrollLeft is where this
  // reads the result back from rather than something it sets.
  //
  // Writing scrollLeft (not scrollTo with a behavior) keeps it a
  // single synchronous jump that cannot interleave with a snap
  // animation already in flight.
  function positionWindow() {
    view.scrollLeft = index * slideStep()
  }
  // Remove, reflow, re-add restarts the animation even if it has
  // already run, so returning to an already-seen tier replays the
  // fade — re-adding an animation class without a reflow in between
  // is a silent no-op (same shape as CLAUDE.md bug #7).
  function playContentFade() {
    var panel = panelFor(TIERS[index])
    var content = panel && panel.querySelector(".package-tier-content")
    if (!content) return
    content.classList.remove("package-tier-fade-in")
    void content.offsetWidth
    content.classList.add("package-tier-fade-in")
  }
  // Keeps .package-tier-view's height matched to only the active
  // panel (see that class's own CSS comment for why this is needed at
  // all — the flex track otherwise sizes to the tallest of the three
  // tiers no matter which is showing). animate=false cuts straight to
  // the new height (init, resize — neither is "a tier change" with
  // motion of its own); true lets the CSS transition ease it,
  // alongside the content fade / swipe snap already playing.
  //
  // heightLocked is held for as long as the window is scrolling,
  // while expandViewForScroll() below owns the height instead.
  // Without it the observer further down would re-collapse the window
  // to the active panel mid-swipe, re-clipping the incoming tier that
  // expansion exists to stop clipping.
  var heightLocked = false
  var heightSettleTimer = null
  function syncViewHeight(animate) {
    var panel = panelFor(TIERS[index])
    if (!panel) return
    var h = panel.scrollHeight
    if (animate) {
      view.style.height = h + "px"
      return
    }
    view.style.transition = "none"
    view.style.height = h + "px"
    void view.offsetHeight
    view.style.transition = ""
  }
  // ---- Height while the window is scrolling ----
  // A swipe shows TWO panels at once, side by side, while the window
  // is only ever sized to ONE of them — so scrolling towards a taller
  // tier brought it in with its lower items cut off by the window's
  // own overflow, for the whole gesture. Expanding to the tallest of
  // the three for the duration means nothing is clipped while
  // anything is moving. A short tier briefly carries dead space below
  // it instead, which is the lesser evil of the two and only lasts
  // the gesture.
  //
  // Deliberately instant (animate=false): an animated height forces
  // layout and paint of a subtree holding all three full tier panels
  // on every frame it runs for, and doing that while the browser is
  // mid-scroll is exactly the kind of main-thread work that makes a
  // native scroll stutter — the one thing moving to native scrolling
  // was meant to stop. One instant resize as the scroll starts, one
  // eased settle once it has stopped.
  function tallestPanelHeight() {
    return TIERS.reduce(function (tallest, tierKey) {
      var panel = panelFor(tierKey)
      return panel ? Math.max(tallest, panel.scrollHeight) : tallest
    }, 0)
  }
  function expandViewForScroll() {
    clearTimeout(heightSettleTimer)
    heightLocked = true
    var h = tallestPanelHeight()
    if (!h) return
    view.style.transition = "none"
    view.style.height = h + "px"
    void view.offsetHeight
    view.style.transition = ""
  }
  // Armed by the scroll handler and re-armed on every scroll event,
  // so it only fires once the window has actually stopped — including
  // when a half-swipe snaps back to the tier it started from, which
  // changes no tier at all and so would otherwise leave the window
  // expanded indefinitely. Eased, not instant: by then the height is
  // the only thing moving, so it costs nothing to let it ease rather
  // than snapping the page shorter underfoot.
  function settleViewHeightAfterScroll() {
    clearTimeout(heightSettleTimer)
    heightSettleTimer = setTimeout(function () {
      heightLocked = false
      syncViewHeight(true)
    }, SCROLL_SETTLE_MS)
  }
  // ---- Keeping that height honest ----
  // The explicit height above was only ever (re)measured on init, on
  // a tier change, and on window resize. Any OTHER reason a panel's
  // own height changes went unnoticed, and since the window clips,
  // a height measured too short silently swallowed the bottom of the
  // panel — items simply missing, with nothing to hint why. The
  // webfonts are the clearest case: all three load async, and when
  // Fraunces/Newsreader/Inter swap in, line counts shift and every
  // panel's real height moves with them — no resize event fires for
  // that. The damage scales with how narrow the layout is, because
  // one column wraps far more lines than three, which is why this
  // showed up on phones and tablets specifically.
  //
  // Watching the panels themselves fixes the whole class of causes at
  // once (fonts, a late image decode, anything that reflows) rather
  // than chasing each trigger separately. Guarded for ResizeObserver
  // per CLAUDE.md bug #4 — where it's missing, behaviour is simply
  // what it was before.
  if (window.ResizeObserver) {
    var panelHeightObserver = new ResizeObserver(function () {
      if (heightLocked) return
      syncViewHeight(false)
    })
    TIERS.forEach(function (tierKey) {
      var panel = panelFor(tierKey)
      if (panel) panelHeightObserver.observe(panel)
    })
  }

  // ---- Committing a tier change ----
  // A second handle on main.js's shared tab-group helper for the real
  // .tab-bar (main.js already wired one itself on load). Holding one
  // here lets a swipe move the pill and set aria-selected directly,
  // instead of faking a click on the tab button to reach that.
  var tabGroup = window.BacchusTabs
    ? window.BacchusTabs.initTabGroup(tabs[0].closest(".tab-bar"), {
        panelSelector: ".tab-panel",
      })
    : null

  // Everything that isn't the track itself: the tab bar's pill and
  // aria state, the tier cards, the sticky switcher.
  function applyTierState(tierKey) {
    var btn = tabFor(tierKey)
    if (btn && tabGroup) tabGroup.selectTab(btn)
    syncTierCards(tierKey)
    syncStickySwitch(tierKey)
  }
  // The single path every tier change goes through, whichever control
  // triggered it.
  //
  // viaScroll distinguishes the two callers, and the difference is
  // not cosmetic: a click has to MOVE the window (positionWindow),
  // whereas a scroll has already moved it and must not be told to
  // move again — writing scrollLeft from inside a scroll handler is
  // how a scroll-driven carousel ends up fighting its own momentum.
  // It is also the "did this gesture have motion of its own" flag the
  // fade and reveal already keyed off.
  function goToIndex(newIndex, viaScroll) {
    newIndex = Math.max(0, Math.min(TIERS.length - 1, newIndex))
    var changed = newIndex !== index
    index = newIndex
    if (!viaScroll) positionWindow()
    if (!changed) return
    var tierKey = TIERS[index]
    history.replaceState(null, "", "#" + tierKey)
    applyTierState(tierKey)
    // Clicks still ease the height as part of their own motion. A
    // swipe's height is owned by expandViewForScroll() /
    // settleViewHeightAfterScroll() instead — animating it here as
    // well would put per-frame layout back underneath a live scroll,
    // which is exactly what those two exist to avoid.
    if (!viaScroll) syncViewHeight(true)
    if (!viaScroll) playContentFade()
  }

  // ---- Click triggers ----
  // Cards and sticky-switcher buttons call goToIndex directly rather
  // than proxying a click onto the tab button — goToIndex updates the
  // tab bar itself via applyTierState.
  function bindTierClicks(elements, tierKeyName) {
    elements.forEach(function (el) {
      el.addEventListener("click", function () {
        goToIndex(TIERS.indexOf(el.dataset[tierKeyName]))
      })
    })
  }
  bindTierClicks(tabs, "tab")
  bindTierClicks(tierCards, "tierCard")
  bindTierClicks(stickyBtns, "tierSwitch")

  // ---- Swipe ----
  // There is no swipe code any more, and that is the point. The
  // browser scrolls and snaps the window on its own; everything below
  // only WATCHES that happen and keeps the rest of the UI in step. A
  // swipe never writes scrollLeft (only positionWindow() does, for
  // clicks, resize and the initial landing), so a gesture in progress
  // and this file can never disagree about where the track is.
  //
  // Nothing anywhere writes to .panels any more, which is worth
  // stating outright: .panels is the scroll CONTENT now, so the old
  // drag's `track.style.transform` left in place alongside native
  // scrolling shifted it on top of the scroll offset, and the tier
  // the window had correctly scrolled to got pushed straight back
  // out of sight. That was a real build, and it looked exactly like
  // "the items are missing" — so if a transform ever reappears on
  // this element, that is the first thing to suspect.
  var scrollFrame = null
  var scrollingClassTimer = null

  // Suppresses the two effects that otherwise recompute against the
  // moving content every frame (see body.package-tier-dragging in the
  // <style> above). Re-armed on every scroll event and timed off
  // after the scroll settles — there is no event that reliably says
  // "a scroll has finished" in the browsers this has to support.
  function setScrollingState() {
    clearTimeout(scrollingClassTimer)
    document.body.classList.add("package-tier-dragging")
    scrollingClassTimer = setTimeout(function () {
      document.body.classList.remove("package-tier-dragging")
    }, SCROLL_SETTLE_MS + 60)
  }

  function readScrollPosition() {
    scrollFrame = null
    var i = indexFromScroll()
    if (i !== index) goToIndex(i, true)
  }
  // Whether the window is sitting exactly on the active tier, as
  // opposed to somewhere between two of them. This is what separates
  // a real swipe from the scroll event that a CLICK causes by writing
  // scrollLeft: a click lands exactly on a tier, so it reads as
  // parked and skips the motion handling below, which it must — the
  // click has already set the correct height itself, and letting the
  // swipe path also expand to the tallest tier made every click
  // flicker (right height, tallest, right height again).
  //
  // Derived from the scroll position rather than a "this scroll was
  // mine" flag on purpose: a flag set before writing scrollLeft
  // leaks when the write doesn't actually move anything (clicking the
  // tier already showing fires no scroll event at all), and would
  // then swallow the start of the next real swipe.
  function isParkedOnActiveTier() {
    var step = slideStep()
    return !step || Math.abs(view.scrollLeft - index * step) < 1
  }
  view.addEventListener(
    "scroll",
    function () {
      if (!isParkedOnActiveTier()) {
        setScrollingState()
        if (!heightLocked) expandViewForScroll()
      }
      // Armed unconditionally, and re-armed on every event, so it
      // fires once the window has come to rest — and so heightLocked
      // always has something coming to release it, whichever branch
      // above ran.
      settleViewHeightAfterScroll()
      // At most one position read per rendered frame; scroll events
      // fire faster than the display refreshes.
      if (scrollFrame === null) scrollFrame = requestAnimationFrame(readScrollPosition)
    },
    { passive: true },
  )
  // Re-parks the window: slideStep() is read live, so the scroll
  // offset that pointed at a tier before a resize or rotation would
  // otherwise point between two of them afterwards.
  //
  // The re-arm matters: heightLocked stays true through the settle
  // window after a scroll stops, and expandViewForScroll() clears
  // that pending settle. Without arming a fresh one here, a resize
  // landing in those few hundred milliseconds would strand the
  // window expanded with heightLocked on — which also disables the
  // observer above, so the height would stay wrong permanently.
  window.addEventListener("resize", function () {
    positionWindow()
    if (!heightLocked) {
      syncViewHeight(false)
      return
    }
    expandViewForScroll()
    settleViewHeightAfterScroll()
  })

  // ---- Initial state ----
  // Land on the #hash tier if it names a real one, otherwise whichever
  // tab the markup already marks active. No transition on first paint:
  // easing in from off-screen on load would read as an unwanted
  // animation. The content fade still plays, as it always did.
  var hashTier = location.hash.replace("#", "")
  var landedOnHash = TIERS.indexOf(hashTier) >= 0
  var startTier = landedOnHash ? hashTier : null
  if (!startTier) {
    var activeTab = document.querySelector(".tab-bar button.active")
    startTier = activeTab ? activeTab.dataset.tab : TIERS[0]
  }
  index = Math.max(0, TIERS.indexOf(startTier))
  positionWindow()
  applyTierState(TIERS[index])
  syncViewHeight(false)
  playContentFade()

  // Shows the sticky switcher once its trigger point has scrolled out
  // of view above AND hides it again once the NEXT section's own
  // eyebrow ("From the Reception", #closerLookEyebrow) starts
  // entering the viewport — otherwise it'd stay stuck onscreen well
  // into that next section. The top trigger differs by breakpoint:
  // mobile only shows the tab bar + one card (bug-fixed to collapse
  // to the active tier, see .package-tier-card's own mobile CSS), so
  // "past the tab bar" already means "past the switcher" there — but
  // desktop/tablet shows the tab bar AND all three full cards, so
  // the sticky switcher would otherwise appear while the cards
  // (which already let you switch tiers) are still fully on screen.
  // Tracking two independent "scrolled past" flags and picking the
  // one that applies at the current width — recomputed on every
  // observer fire and on resize — avoids running two different sets
  // of observers that would need tearing down/recreating across the
  // breakpoint.
  //
  // The hide trigger used to watch .panels (the tier content itself)
  // for its bottom edge scrolling above the viewport's top edge —
  // but the switcher visually sits ~90px down from that edge (below
  // the fixed nav), not at y=0, so there was a real gap: .panels'
  // bottom could still be a little below y=0 (not yet "passed" by
  // that check) while the next section's own eyebrow had already
  // scrolled up into the switcher's ~90px band, so the still-visible
  // switcher sat on top of it. Watching the next section's eyebrow
  // directly and hiding as soon as ANY of it is visible (plain
  // isIntersecting, no rect math needed) closes that gap — same fix
  // for both breakpoints, since the switcher's own vertical position
  // relative to that content is the same problem either way.
  //
  // Bug found 2026-09-21: pastBottom used to be set to plain
  // entries[0].isIntersecting, which only reports "is the eyebrow on
  // screen right now" — once it scrolled fully off the TOP of the
  // viewport too (further down into the carousel/footer), it stopped
  // intersecting and isIntersecting went back to false, so the
  // switcher popped back up over content it has nothing to do with.
  // Needs the same "scrolled past and staying past" shape as
  // pastTabBar/pastCards above (OR'd with isIntersecting itself, so
  // it still hides the instant the eyebrow first comes into view,
  // not only once fully scrolled past it).
  if (stickySwitch) {
    var tabBarEl = document.querySelector(".package-tabs-tabbar")
    var cardsEl = document.querySelector(".package-tier-cards")
    var nextEyebrowEl = document.getElementById("closerLookEyebrow")
    var desktopMQ = window.matchMedia("(min-width: 841px)")
    var pastTabBar = false,
      pastCards = false,
      pastBottom = false
    function updateStickyVisibility() {
      var pastTrigger = desktopMQ.matches ? pastCards : pastTabBar
      var visible = pastTrigger && !pastBottom
      stickySwitch.classList.toggle("is-visible", visible)
      stickySwitch.setAttribute("aria-hidden", visible ? "false" : "true")
    }
    if (tabBarEl) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0]
        pastTabBar = !entry.isIntersecting && entry.boundingClientRect.top < 0
        updateStickyVisibility()
      }).observe(tabBarEl)
    }
    if (cardsEl) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0]
        pastCards = !entry.isIntersecting && entry.boundingClientRect.top < 0
        updateStickyVisibility()
      }).observe(cardsEl)
    }
    if (nextEyebrowEl) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0]
        pastBottom = entry.isIntersecting || entry.boundingClientRect.top < 0
        updateStickyVisibility()
      }).observe(nextEyebrowEl)
    }
    window.addEventListener("resize", updateStickyVisibility)
  }
})()

// ---------- Stage controller ----------
// Originally the controller for real section A's standalone
// master-detail stage — restored on 2026-09-28 as a comparison
// fixture, deleted along with section A itself on 2026-09-29 once
// the comparison resolved. This controller was NOT deleted with it:
// section C's mobtab half (its mobile/tablet view, below 860px)
// reuses it directly, unmodified apart from the one isMobtabClone
// branch below, and is now the only thing still running it.
//
// RUNS ONCE PER [data-stations="stage"] ROOT — was written to
// support two (real section A's, and section C's mobtab clone)
// back when both existed; only one root matches now, but the loop
// was left as-is rather than collapsed back to a single
// querySelector, on the chance a second stage-shaped trial section
// is wanted again later. Every lookup inside is already
// root.querySelector(...)-scoped, never document.getElementById or
// an unscoped document.querySelector, so this remains safe either
// way.
//
// No longer "frozen" in the sense the comparison-fixture framing
// used to mean — there is no sibling restoration left to keep this
// byte-for-byte faithful to, so ordinary bug fixes and improvements
// are fine here now. isMobtabClone is the one branch worth reading
// before changing anything: it's what makes the mobile phone
// carousel behave differently (no filtering, all sixteen present)
// from the tablet thumbnails grid (still filters) within this same
// function — see that variable's own comment below for the full
// reasoning.
;[].slice
  .call(document.querySelectorAll('[data-stations="stage"]'))
  .forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll(".package-stations-category-tab"))
    var panel = root.querySelector("#stations-panel")
    var indexEl = root.querySelector(".package-stations-index")
    var stageEl = root.querySelector(".package-stations-stage")
    var thumbsEl = root.querySelector(".package-stations-thumbnails")
    var track = root.querySelector(".package-stations-card-list")
    var cardEls = [].slice.call(root.querySelectorAll(".package-station-card"))
    var nav = root.querySelector(".package-stations-carousel-nav")
    var prevBtn = root.querySelector("[data-carousel-prev]")
    var nextBtn = root.querySelector("[data-carousel-next]")
    var countCur = root.querySelector("[data-carousel-current]")
    var countTot = root.querySelector("[data-carousel-total]")
    var tabsEl = root.querySelector(".package-stations-category-tabs")
    if (!tabs.length || !stageEl || !track || !cardEls.length) return

    // SECTION C ONLY (2026-09-29) — the one behavioural branch in
    // this otherwise-frozen function. Real section A takes the
    // isMobtabClone === false path everywhere it's checked, which
    // is byte-for-byte its original behaviour — filtering by
    // category at every width, exactly as documented throughout
    // this function's own comments.
    //
    // The mobtab clone's TABLET view (621-859.98px, the
    // stage+thumbnails layout) is UNCHANGED too — thumbnails still
    // filter down to the selected category, reverted back to that
    // after a same-day round trip that briefly unhid them here as
    // well. Only the mobtab's PHONE carousel (<621px) takes the
    // true path below: nothing is ever hidden there, all sixteen
    // sit in the scroller at once, and a tab click scrolls to a
    // station instead of narrowing the set down to one category —
    // the same "categories are waypoints, not a filter" model
    // section B's own carousel controller already documents,
    // asked for here specifically for the phone carousel, not the
    // tablet thumbnails.
    var isMobtabClone = !!root.closest(".package-stations-hybrid-mobtab")

    var PLUS = "M12 5v14M5 12h14"
    var TICK = "M5 12l5 5 9-10"
    // Same 14-unit span/centering as PLUS/TICK above (5-19 out of
    // the shared 0 0 24 24 viewBox), so the hover-only "Remove"
    // icon reads as the same family rather than a mismatched size.
    var CROSS = "M5 5l14 14M19 5 5 19"
    // Gates the hover-to-"Remove" swap in paintAdd() below to real
    // pointer devices, matching this file's other hover/touch
    // splits (CLAUDE.md bug #19) — touch has no hover to trigger it
    // from, so there's nothing to gate wrong there either way, but
    // checking once here avoids a matchMedia() call on every
    // pointerenter.
    var supportsHover = window.matchMedia && window.matchMedia("(hover: hover)").matches
    var tabletDown = window.matchMedia("(max-width: 859.98px)")

    // ---- data, read once from the cards ----
    // dataset.labelFull fallback (2026-09-29, twenty-fifth pass) —
    // the one deliberate touch to this otherwise-frozen function,
    // needed now that the mobtab clone's tabs carry short visible
    // text ("Boards") plus a data-label-full attribute holding the
    // full name ("Boards & Cured"), matching the carousel
    // controller's own identical fallback a few hundred lines down.
    // Without it, the stage's own category eyebrow (built from this
    // groups array via groupLabel()) would have shortened to
    // "BOARDS" the moment the mobtab's visible tab text did.
    // Provably behaviour-neutral for real section A: it has no
    // data-label-full anywhere, so `|| t.textContent` is exactly
    // what already ran for it.
    var groups = tabs.map(function (t) {
      return {
        id: t.dataset.group,
        label: (t.dataset.labelFull || t.textContent).trim(),
        tab: t,
      }
    })
    var stations = cardEls.map(function (card) {
      var img = card.querySelector("img")
      return {
        id: card.dataset.station,
        group: card.dataset.group,
        name: card.querySelector(".package-station-card-name").textContent.trim(),
        price: card.querySelector(".package-station-price-amount").textContent.trim(),
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || "",
        // The <li> ELEMENTS, not their text. They were read as
        // textContent until the vegetarian badges were added
        // (2026-09-25), at which point the stage started rendering
        // the badge's letter as a bare "V" after the item name —
        // textContent flattens the circled marker to the character
        // inside it. fillStage() clones these instead, so anything
        // the card's markup carries reaches the stage intact.
        items: [].slice.call(card.querySelectorAll(".package-station-item-list li")),
        serve: card.querySelector(".package-station-serving-note").textContent.trim(),
        card: card,
        figure: card.querySelector("figure"),
      }
    })
    function byId(id) {
      for (var i = 0; i < stations.length; i++)
        if (stations[i].id === id) return stations[i]
      return null
    }
    function inGroup(g) {
      return stations.filter(function (s) {
        return s.group === g
      })
    }
    function groupLabel(g) {
      for (var i = 0; i < groups.length; i++)
        if (groups[i].id === g) return groups[i].label
      return ""
    }

    var state = { group: groups[0].id, selected: stations[0].id, added: {} }

    // ---- small DOM helpers ----
    function el(tag, cls, text) {
      var n = document.createElement(tag)
      if (cls) n.className = cls
      if (text != null) n.textContent = text
      return n
    }
    function svg(path, size, cls) {
      var ns = "http://www.w3.org/2000/svg"
      var s = document.createElementNS(ns, "svg")
      s.setAttribute("width", size)
      s.setAttribute("height", size)
      s.setAttribute("viewBox", "0 0 24 24")
      s.setAttribute("fill", "none")
      s.setAttribute("stroke", "currentColor")
      s.setAttribute("stroke-width", "2")
      s.setAttribute("stroke-linecap", "round")
      s.setAttribute("stroke-linejoin", "round")
      s.setAttribute("aria-hidden", "true")
      if (cls) s.setAttribute("class", cls)
      var p = document.createElementNS(ns, "path")
      p.setAttribute("d", path)
      s.appendChild(p)
      return s
    }
    function priceEl(amount) {
      var p = el("p", "package-station-price")
      p.appendChild(el("span", "package-station-price-amount", amount))
      p.appendChild(document.createTextNode(" "))
      p.appendChild(el("span", "package-station-price-unit", "per person"))
      return p
    }
    // The list form: "€12.50 pp" visually, "€12.50 per person" to a
    // screen reader. Desktop index rows only — the tablet thumbnails
    // have no width for the suffix and keep the bare amount.
    function listPriceEl(tag, cls, amount) {
      var n = el(tag, cls, amount)
      var short = el("span", "package-station-price-unit-short", "pp")
      short.setAttribute("aria-hidden", "true")
      n.appendChild(short)
      n.appendChild(el("span", "package-stations-visually-hidden", " per person"))
      return n
    }
    // .eyebrow, not a parallel class — with .eyebrow-static pinning
    // the ::before rule open, since this markup is rebuilt on every
    // selection and never gets an .is-revealed of its own.
    function eyebrowEl(tag, text) {
      return el(tag, "eyebrow eyebrow-static", text)
    }

    // ---- build: desktop index ----
    var rows = []
    if (indexEl) {
      groups.forEach(function (g) {
        var wrap = el("div", "package-stations-index-group")
        wrap.appendChild(eyebrowEl("h3", g.label))
        var ul = el("ul", "package-stations-index-list")
        ul.setAttribute("role", "list")
        inGroup(g.id).forEach(function (s) {
          var li = el("li")
          var b = el("button", "package-stations-index-row")
          b.type = "button"
          b.dataset.station = s.id
          b.setAttribute("aria-controls", "package-stations-stage")
          b.setAttribute("aria-current", "false")
          b.appendChild(el("span", "package-stations-index-row-name", s.name))
          var tick = svg(TICK, 14, "package-stations-index-row-added-marker")
          tick.removeAttribute("aria-hidden")
          tick.setAttribute("role", "img")
          tick.setAttribute("aria-label", "in your selection")
          tick.setAttribute("hidden", "")
          b.appendChild(tick)
          b.appendChild(el("span", "package-stations-index-row-spacer"))
          b.appendChild(listPriceEl("span", "package-stations-index-row-price", s.price))
          b.addEventListener("click", function () {
            select(s.id)
          })
          b.addEventListener("keydown", rowKeys)
          rows.push(b)
          li.appendChild(b)
          ul.appendChild(li)
        })
        wrap.appendChild(ul)
        indexEl.appendChild(wrap)
      })
    }

    // Up/Down/Home/End move through all sixteen in visual order and
    // select as they go, so the stage follows focus like a tab list.
    function rowKeys(e) {
      var i = rows.indexOf(e.currentTarget),
        n = i
      if (e.key === "ArrowDown") n = (i + 1) % rows.length
      else if (e.key === "ArrowUp") n = (i - 1 + rows.length) % rows.length
      else if (e.key === "Home") n = 0
      else if (e.key === "End") n = rows.length - 1
      else return
      e.preventDefault()
      select(rows[n].dataset.station)
      rows[n].focus()
    }

    // ---- build: stage ----
    var stage = {}
    ;(function buildStage() {
      var fig = el("figure", "package-stations-stage-figure")
      stage.img = el("img")
      stage.img.width = 880
      stage.img.height = 1100
      stage.img.decoding = "async"
      fig.appendChild(stage.img)

      stage.expand = el("button", "package-stations-stage-expand-button")
      stage.expand.type = "button"
      var ex = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      ex.setAttribute("width", "13")
      ex.setAttribute("height", "13")
      ex.setAttribute("viewBox", "0 0 14 14")
      ex.setAttribute("fill", "none")
      ex.setAttribute("aria-hidden", "true")
      ex.innerHTML =
        '<path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'
      stage.expand.appendChild(ex)
      fig.appendChild(stage.expand)
      // Hands off to the card's own <figure>, which the page's
      // lightbox controller already owns — so prev/next still runs
      // across all sixteen rather than needing a second entry point.
      //
      // Bound to the FIGURE, not to stage.expand: the whole
      // photograph is the hit target, and the button sits inside it
      // so its own clicks (and its Enter/Space, which fire a click)
      // bubble up to here. One listener, so nothing double-fires.
      fig.addEventListener("click", function () {
        var s = byId(state.selected)
        if (s && s.figure) s.figure.click()
      })

      var cap = el("div", "package-stations-stage-caption")
      stage.category = eyebrowEl("p", "")
      var title = el("div", "package-stations-stage-title")
      stage.name = el("h3", "package-stations-stage-name")
      stage.price = priceEl("")
      title.appendChild(stage.name)
      title.appendChild(stage.price)
      cap.appendChild(stage.category)
      cap.appendChild(title)

      var body = el("div", "package-stations-stage-body")
      stage.items = el("ul", "package-station-item-list")
      stage.items.setAttribute("role", "list")
      // SUPERSEDED (2026-09-30) — the gold diamond divider added
      // here fifteenth pass (2026-09-29), between the item list and
      // the serving note, matching the carousel cards' own divider
      // at the time. Removed on request, same call already made for
      // mobile's carousel cards a couple of passes ago — real A no
      // longer exists to keep in step with, so this only ever
      // affects mobtab's stage now, the same as everything else in
      // this function.
      stage.serve = el("p", "package-station-serving-note")

      // SUPERSEDED (2026-09-30) — .package-stations-stage-footer
      // used to wrap just this one button, for a border-top divider
      // (removed fifteenth pass) and later just for margin-top:auto
      // + its own padding-top. With both the divider and the border
      // gone, the wrapper had nothing left to do beyond holding a
      // single child — removed on request, and the button now
      // shares .package-station-card-body's own add-button rule
      // directly (see that rule's own comment) instead of a second,
      // parallel .package-stations-stage-footer one, so the two
      // contexts can't drift out of styling sync again.
      stage.add = el(
        "button",
        "button button-gradient button-small package-station-add-button",
      )
      stage.add.type = "button"
      stage.add.addEventListener("click", function () {
        toggle(state.selected)
      })

      body.appendChild(stage.items)
      body.appendChild(stage.serve)
      body.appendChild(stage.add)

      stageEl.appendChild(fig)
      stageEl.appendChild(cap)
      stageEl.appendChild(body)
    })()

    // ---- build: tablet thumbnails ----
    var thumbs = []
    if (thumbsEl) {
      thumbs = stations.map(function (s) {
        var li = el("li")
        li.dataset.group = s.group
        var b = el("button", "package-stations-thumbnail")
        b.type = "button"
        b.setAttribute("aria-controls", "package-stations-stage")
        b.setAttribute("aria-pressed", "false")
        var imgWrap = el("span", "package-stations-thumbnail-figure")
        var img = el("img")
        img.src = s.src
        img.alt = ""
        img.loading = "lazy"
        img.decoding = "async"
        imgWrap.appendChild(img)
        var meta = el("span", "package-stations-thumbnail-meta")
        meta.appendChild(el("span", "package-stations-thumbnail-name", s.name))
        // Bare amount, no "pp" — the thumbnails have no room for it
        // (see .package-stations-thumbnail-meta), and the stage
        // directly above them is already showing the selected
        // station's full "per person".
        meta.appendChild(el("span", "package-stations-thumbnail-price", s.price))
        b.appendChild(imgWrap)
        b.appendChild(meta)
        b.addEventListener("click", function () {
          select(s.id)
        })
        li.appendChild(b)
        thumbsEl.appendChild(li)
        return { li: li, btn: b, id: s.id, group: s.group }
      })
    }

    // ---- tabs ----
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        setGroup(t.dataset.group)
      })
      t.addEventListener("keydown", function (e) {
        var n = i
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length
        else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length
        else if (e.key === "Home") n = 0
        else if (e.key === "End") n = tabs.length - 1
        else return
        e.preventDefault()
        setGroup(tabs[n].dataset.group)
        tabs[n].focus()
      })
    })
    // The panel is only a tabpanel while the tabs are actually on
    // screen — above 860px there is no tablist for it to belong to.
    function syncPanelRole() {
      if (!panel) return
      if (tabletDown.matches) {
        panel.setAttribute("role", "tabpanel")
        panel.setAttribute(
          "aria-labelledby",
          "package-stations-category-tab-" + state.group,
        )
      } else {
        panel.removeAttribute("role")
        panel.removeAttribute("aria-labelledby")
      }
    }
    if (tabletDown.addEventListener) tabletDown.addEventListener("change", syncPanelRole)
    else if (tabletDown.addListener) tabletDown.addListener(syncPanelRole)

    // ---- add buttons on the cards ----
    root
      .querySelectorAll(".package-station-card .package-station-add-button")
      .forEach(function (b) {
        b.removeAttribute("hidden")
        b.addEventListener("click", function () {
          toggle(b.dataset.station)
        })
      })

    // ---- carousel (< 621px) ----
    // Native scroll-snap, not a pointer-drag component — which is
    // why CLAUDE.md bug #11's touch-action: pan-y isn't needed here.
    var carIndex = 0
    function visibleCards() {
      return cardEls.filter(function (c) {
        return !c.hidden
      })
    }
    function scrollToCard(i) {
      var list = visibleCards()
      i = Math.max(0, Math.min(list.length - 1, i))
      var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0
      track.scrollTo({ left: list[i].offsetLeft - track.offsetLeft - pad })
    }
    function syncCarousel() {
      var list = visibleCards()
      if (!list.length || !countCur || !countTot) return
      var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0
      var x = track.scrollLeft + pad + track.offsetLeft,
        best = 0,
        dist = Infinity
      list.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft - x)
        if (d < dist) {
          dist = d
          best = i
        }
      })
      carIndex = best
      countCur.textContent = String(best + 1)
      countTot.textContent = String(list.length)
      if (prevBtn) prevBtn.disabled = best === 0
      if (nextBtn) nextBtn.disabled = best === list.length - 1
    }
    // SECTION C ONLY (2026-09-29) — the tab bar used to only follow
    // a tab CLICK (via setGroup), never a swipe: this carousel's own
    // scroll listener updated the counter/arrows but never touched
    // state.group or the tabs, so the active tab (and the sliding
    // pill that watches it) sat frozen while swiping moved through
    // other categories entirely. Same one-way "derive everything
    // from scroll position" fix section B's own syncPosition()
    // already uses for its category buttons.
    //
    // BUG, caught the same day (twenty-sixth pass): this used to
    // live INSIDE syncCarousel() itself, which render() also calls
    // at the end of every run — including the ones triggered by
    // setGroup() (a tab click) and select() (a thumbnail click) at
    // TABLET widths, where the phone carousel is display: none and
    // its scrollLeft is stale (usually still 0, station #1). Every
    // tablet click was overwriting the state.group/state.selected
    // that click had JUST set, a few lines later in the SAME
    // render() call, with whatever the dormant phone carousel's
    // stale scroll position implied — station #1, Charcuterie
    // Table, every time, and the tab bar's aria-selected got reset
    // right back too. Pulled out into its own function, called ONLY
    // from the scroll listener below (a genuine scroll, not a
    // render() side effect) — render() itself no longer triggers
    // this at all. Deliberately still not calling render() from
    // here — that would arm the stage crossfade timer on every
    // scroll frame, for a stage this width never shows.
    function syncGroupFromScroll() {
      var list = visibleCards()
      var current = list[carIndex]
      if (!current) return
      state.selected = current.dataset.station
      state.group = current.dataset.group
      syncTabsAria()
    }
    var ticking = false
    // DEBOUNCED, not per-frame (2026-09-29) — a tab click also
    // scrolls this same track (scrollToCard, in setGroup below),
    // and that scroll — same as a swipe — fires many scroll events
    // as it animates smoothly toward its target. Calling
    // syncGroupFromScroll() on every one of those frames meant the
    // tab bar (and its pill) flickered through every category the
    // animation passed on its way to the clicked one — a visible
    // stutter on the very tab that was just clicked, right before
    // it settled on the correct one a moment later. The click
    // itself already sets state.group correctly via setGroup(), so
    // there's nothing to derive from the scroll until it's actually
    // finished — this only re-checks once 120ms has passed with no
    // further scroll events, which is after a swipe ends too, not
    // just after a click-triggered animation.
    var scrollSettleTimer = null
    track.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true
          requestAnimationFrame(function () {
            ticking = false
            syncCarousel()
          })
        }
        if (isMobtabClone) {
          clearTimeout(scrollSettleTimer)
          scrollSettleTimer = setTimeout(syncGroupFromScroll, 120)
        }
      },
      { passive: true },
    )
    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        scrollToCard(carIndex - 1)
      })
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        scrollToCard(carIndex + 1)
      })
    track.setAttribute("aria-roledescription", "carousel")
    track.setAttribute("aria-label", "Stations")

    // ---- stage crossfade ----
    // The site's established "swap content in place" device, copied
    // from main.js's testimonials rotator: fade out on a fixed
    // setTimeout clock, swap, fade back in. 220ms is that rotator's
    // own T_FADE_MS — this is the same kind of move (a panel of copy
    // being replaced) rather than the 180ms the lightbox and wizard
    // use for an image or a step.
    var STAGE_FADE_MS = 220
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    var stageFadeTimer = null

    function stageFade(out) {
      // Inline styles, not a class. Same reasoning as the rotator's
      // tFade(): the stage sits inside .package-stations-browser,
      // which carries data-reveal and picks up .is-revealed on
      // scroll — and [data-reveal].is-revealed is (0,2,0), so a
      // single-class toggle in here is the kind of silent no-op
      // CLAUDE.md bug #15 records. Inline always wins; clearing the
      // properties lets the stylesheet reassert itself.
      //
      // Fades the WHOLE stage, not its figure/caption/body
      // separately. Fading the children first was tried and left the
      // stage's own --ink-3 surface and border painted behind them
      // for the length of the swap — a large empty grey card sitting
      // in the middle of the section, which is the same artefact
      // CLAUDE.md's bug list calls the "grey blob". The box has to go
      // with its contents.
      //
      // Unlike the rotator's tFade this does not lift: the stage is a
      // bordered card rather than loose copy, and sliding the whole
      // panel 6px reads as the card itself moving. Opacity alone,
      // same as the lightbox's image crossfade.
      stageEl.style.opacity = out ? "0" : ""
    }

    // ---- state changes ----
    function select(id) {
      var s = byId(id)
      if (!s) return
      // Re-selecting the current station shouldn't replay the fade.
      var changed = id !== state.selected
      state.selected = id
      state.group = s.group // keeps the tabs in step across a resize
      render(changed)
    }
    function setGroup(g) {
      if (g === state.group) return
      state.group = g
      state.selected = inGroup(g)[0].id
      // SECTION C ONLY: track.scrollLeft = 0 (real section A's own
      // line, unchanged below) only lands on the right card because
      // filtering collapses every earlier group out of the layout,
      // so the new group's first card is always whatever is left at
      // position 0. With nothing hidden for the mobtab clone, 0
      // would just be station #1 regardless of which tab was
      // clicked — scrollToCard(), already this controller's own
      // helper for the phone carousel's prev/next arrows, finds the
      // actual card instead.
      if (isMobtabClone) {
        scrollToCard(stations.indexOf(byId(state.selected)))
      } else {
        track.scrollLeft = 0
      }
      render(true)
    }
    function toggle(id) {
      if (state.added[id]) delete state.added[id]
      else state.added[id] = true
      render()
    }

    // Hovering an already-added button now swaps its icon/label to
    // "Remove" (2026-09-30, on request — discussed first: this was
    // the right call since the button stays clickable to remove an
    // item in the "Added" state today, but nothing signals that).
    // Gated to supportsHover, matching the sitewide pointer/touch
    // split — touch users still just see "Added" at rest and
    // discover removal by tapping again, same as before.
    //
    // Implemented entirely inside paintAdd() rather than with
    // separate wiring at each of this file's three add-button call
    // sites (stage.add, the static card buttons, the carousel
    // controller's own copy): paintAdd() already runs on every
    // state change for every button, aria-pressed is already the
    // live source of truth, and stashing name on the element itself
    // (dataset.stationName) means the hover listener needs no
    // captured state of its own — it just re-reads the button and
    // calls back into this same function. The listener is wired
    // once per button (dataset.hoverWired guards against paintAdd's
    // own repeated calls re-attaching it) and pointerType is
    // checked so a touch device's brief synthetic pointerenter (some
    // browsers fire one on tap) can't get this stuck the way
    // CLAUDE.md bug #19 already catalogues for plain :hover.
    function paintAdd(btn, on, name) {
      if (!btn) return
      var wasOn = btn.getAttribute("aria-pressed") === "true"
      // Suppresses the "Remove" swap for exactly the hover session
      // a button was clicked during (2026-09-30, on request:
      // "shown after the first mouseexit... before that, Added" —
      // clicking "Add to selection" while the pointer is already
      // resting on it shouldn't instantly swap to "Remove" under
      // the user's own cursor; showing "Added" first, then arming
      // "Remove" only once they've actually moved away and back,
      // reads as a confirmation rather than a flicker). Only set
      // when this is a genuine off->on transition while already
      // hovering — a re-render that leaves `on` unchanged (a
      // crossfade refresh, say) never re-arms an already-cleared
      // suppression back on.
      if (on && !wasOn && btn.dataset.hovering === "1") {
        btn.dataset.suppressRemove = "1"
      }
      btn.setAttribute("aria-pressed", on ? "true" : "false")
      if (name) btn.dataset.stationName = name
      var showRemove =
        on && supportsHover && btn.dataset.hovering === "1" && !btn.dataset.suppressRemove
      var iconPath = showRemove ? CROSS : on ? TICK : PLUS
      var labelText = showRemove ? "Remove" : on ? "Added" : "Add to selection"
      // The station name as hidden text, so a screen reader doesn't
      // hear sixteen identical "Add to selection" buttons.
      var labelName = name || btn.dataset.stationName
      // Mutate the existing icon/label nodes in place rather than
      // clearing and rebuilding them on every call (2026-09-30,
      // REAL BUG, reported as "the add icon is now shifting
      // weirdly on hover"): paintAdd() now runs on every
      // pointerenter/pointerleave too, and rebuilding threw away
      // the SAME <svg> element .button:hover svg's own transform
      // transition (styles.css) was already tracking — a brand
      // new element has no prior frame to animate FROM, so that
      // transition (a smooth translateX(4px) slide on every other
      // button on the site) snapped instantly instead on this one.
      // Updating the existing path's `d` and the label's
      // textContent keeps the same nodes alive across a repaint,
      // so the transition keeps working exactly as it does
      // everywhere else. Only the very first paint (no existing
      // children yet) still builds from scratch.
      var iconEl = btn.querySelector(".package-station-add-button-icon")
      var labelEl = btn.querySelector(".package-station-add-button-label")
      var hiddenEl = btn.querySelector(".package-stations-visually-hidden")
      if (iconEl && labelEl) {
        var pathEl = iconEl.querySelector("path")
        if (pathEl) pathEl.setAttribute("d", iconPath)
        labelEl.textContent = labelText
        if (labelName) {
          if (hiddenEl) hiddenEl.textContent = " — " + labelName
          else
            btn.appendChild(
              el("span", "package-stations-visually-hidden", " — " + labelName),
            )
        } else if (hiddenEl) {
          hiddenEl.remove()
        }
      } else {
        btn.textContent = ""
        btn.appendChild(svg(iconPath, 14, "package-station-add-button-icon"))
        btn.appendChild(el("span", "package-station-add-button-label", labelText))
        if (labelName)
          btn.appendChild(
            el("span", "package-stations-visually-hidden", " — " + labelName),
          )
      }
      if (supportsHover && !btn.dataset.hoverWired) {
        btn.dataset.hoverWired = "1"
        btn.addEventListener("pointerenter", function (e) {
          if (e.pointerType && e.pointerType !== "mouse") return
          btn.dataset.hovering = "1"
          paintAdd(btn, btn.getAttribute("aria-pressed") === "true")
        })
        btn.addEventListener("pointerleave", function (e) {
          if (e.pointerType && e.pointerType !== "mouse") return
          delete btn.dataset.hovering
          // The suppression is scoped to ONE hover session, so any
          // exit clears it — the very next entry is free to show
          // "Remove" again, regardless of how the button got here.
          delete btn.dataset.suppressRemove
          paintAdd(btn, btn.getAttribute("aria-pressed") === "true")
        })
      }
    }

    // Everything the stage shows for one station, in one place, so
    // the crossfade can defer exactly this and nothing else.
    var stageFadeToken = 0

    function fillStage(sel) {
      stage.img.src = sel.src
      stage.img.alt = sel.alt
      stage.expand.setAttribute("aria-label", "Enlarge photo of " + sel.name)
      stage.category.textContent = groupLabel(sel.group)
      stage.name.textContent = sel.name
      stage.price.querySelector(".package-station-price-amount").textContent = sel.price
      stage.items.textContent = ""
      sel.items.forEach(function (li) {
        stage.items.appendChild(li.cloneNode(true))
      })
      stage.serve.textContent = sel.serve
      paintAdd(stage.add, !!state.added[sel.id], sel.name)
    }

    // fade is passed only when the SELECTED STATION changes — never
    // for toggling a station into the selection, which must repaint
    // its button immediately.
    // Pulled out of render() (2026-09-29) so the mobtab's phone-
    // carousel scroll sync below can refresh just the tabs —
    // which is what drives the sliding pill via its own
    // MutationObserver — without running all of render()'s other
    // work (the stage crossfade, thumbnails, index rows) on every
    // scroll frame, none of which the phone carousel needs or
    // even shows.
    function syncTabsAria() {
      tabs.forEach(function (t) {
        var on = t.dataset.group === state.group
        t.setAttribute("aria-selected", on ? "true" : "false")
        t.tabIndex = on ? 0 : -1
      })
    }
    function render(fade) {
      var sel = byId(state.selected)

      syncTabsAria()
      syncPanelRole()

      rows.forEach(function (r) {
        var id = r.dataset.station
        r.setAttribute("aria-current", id === state.selected ? "true" : "false")
        var tick = r.querySelector(".package-stations-index-row-added-marker")
        if (state.added[id]) tick.removeAttribute("hidden")
        else tick.setAttribute("hidden", "")
      })

      if (fade && !reduceMotion.matches) {
        clearTimeout(stageFadeTimer)
        stageFade(true)
        var fadeToken = ++stageFadeToken
        stageFadeTimer = setTimeout(function () {
          fillStage(byId(state.selected))
          // Fade back in only once the new photo can be painted — the
          // same stale-bitmap problem as the lightboxes: until decode
          // finishes, the browser keeps drawing the previous station's
          // photo, and it would show through the fade-in. The token
          // drops a slow decode that a newer selection has overtaken.
          function fadeIn() {
            if (fadeToken !== stageFadeToken) return
            // A second, short timeout rather than a nested
            // requestAnimationFrame — the browser can coalesce rAFs
            // into one paint, leaving no in-between frame for the
            // fade back in to animate across (CLAUDE.md bug #7).
            stageFadeTimer = setTimeout(function () {
              stageFade(false)
            }, 30)
          }
          if (stage.img.decode) stage.img.decode().then(fadeIn, fadeIn)
          else fadeIn()
        }, STAGE_FADE_MS)
      } else {
        fillStage(sel)
      }

      thumbs.forEach(function (t) {
        t.li.hidden = t.group !== state.group
        t.btn.setAttribute("aria-pressed", t.id === state.selected ? "true" : "false")
      })

      stations.forEach(function (s) {
        s.card.hidden = isMobtabClone ? false : s.group !== state.group
        paintAdd(
          s.card.querySelector(".package-station-add-button"),
          !!state.added[s.id],
          s.name,
        )
      })

      syncCarousel()
    }

    // ---- go ----
    ;[tabsEl, indexEl, stageEl, thumbsEl, nav].forEach(function (n) {
      if (n) n.removeAttribute("hidden")
    })
    root.classList.add("is-enhanced")
    render()
  })

// ---------- Mobtab sliding pill ----------
// Deliberately separate from the stage controller just above, not a
// change to it. Moves .package-stations-hybrid-mobtab's tab-bar
// pill to match whichever tab the stage controller marks
// aria-selected="true" — via a MutationObserver watching that one
// attribute, rather than a second click/keydown handler on the same
// buttons (which is what window.BacchusTabs.initTabGroup would have
// added — see the CSS comment on the pill rule for why that was
// skipped). This way there is exactly one system deciding which tab
// is selected, and this only ever reacts to it.
;(function () {
  var bar = document.querySelector(
    ".package-stations-hybrid-mobtab .package-stations-category-tabs",
  )
  if (!bar) return
  var pill = bar.querySelector(".pill")
  if (!pill) return
  // width/height + translate(x, y), not translateX with a fixed
  // top/bottom inset (2026-09-29) — the fixed inset only worked
  // because every tab sat in one row, where "container top + 5px"
  // and "this button's own top" were the same thing. The phone
  // grid wraps to two rows now, and offsetTop tells the two apart;
  // without it the pill still only moved sideways and stretched
  // across both rows in whichever column was active. Matches the
  // button's own offsetHeight exactly, same reasoning as width.
  function movePill(btn) {
    pill.style.width = btn.offsetWidth + "px"
    pill.style.height = btn.offsetHeight + "px"
    pill.style.transform = "translate(" + btn.offsetLeft + "px, " + btn.offsetTop + "px)"
  }
  // Was a local copy of this scroll math (built here 2026-09-29,
  // padding-aware since 2026-09-30); now delegates to the shared
  // one in main.js (window.BacchusTabs.ensureTabVisible), which
  // every other tab bar on the site also runs via initTabGroup —
  // same behaviour, one definition, so the next fix to it reaches
  // this bar too. This bar can't just use initTabGroup wholesale:
  // its selected state is driven by the phone carousel's scroll
  // position, not by clicks on these buttons, so the pill sync
  // below has to stay its own thing. Guarded per CLAUDE.md bug #4 —
  // if main.js somehow hasn't loaded, the tab bar still works,
  // it just won't auto-scroll.
  function ensureTabVisible(btn) {
    if (window.BacchusTabs && window.BacchusTabs.ensureTabVisible) {
      window.BacchusTabs.ensureTabVisible(bar, btn)
    }
  }
  // last tracks which button the pill/scroll are already settled on
  // (2026-09-30) — a tab click fires syncTabsAria() immediately via
  // render(), and the SAME click's own scrollToCard() then animates
  // the phone carousel, which settles ~120ms later and fires
  // syncGroupFromScroll()'s OWN syncTabsAria() call — a second,
  // redundant wave for a selection that hasn't actually changed.
  // setAttribute fires a mutation record regardless of whether the
  // value changed, so the MutationObserver runs syncPill() again
  // either way. Without this guard, that second call re-ran
  // ensureTabVisible() while the first call's smooth scroll on the
  // tab bar could still be mid-animation, recalculating a delta
  // against an in-between (not yet settled) bounding rect and
  // visibly correcting itself — the reported flicker.
  var last = null
  function syncPill() {
    var current = bar.querySelector('[aria-selected="true"]')
    if (current && current !== last) {
      last = current
      // Read before write (2026-09-29) — ensureTabVisible only
      // reads geometry (bar/btn's own getBoundingClientRect, never
      // the pill's), so it doesn't need movePill to have run
      // first. Calling it first instead of after avoids a forced
      // synchronous reflow: read-then-write lets the browser batch
      // normally, where write-then-read (movePill's style changes,
      // immediately followed by a geometry read) cannot be.
      ensureTabVisible(current)
      movePill(current)
    }
  }
  new MutationObserver(syncPill).observe(bar, {
    attributes: true,
    attributeFilter: ["aria-selected"],
    subtree: true,
  })
  // Forces a re-sync regardless of the `last` guard above — layout
  // can change the SAME button's own position/width on resize even
  // though the selection itself hasn't, which the guard would
  // otherwise (wrongly) skip.
  function forceSyncPill() {
    last = null
    syncPill()
  }
  window.addEventListener("load", forceSyncPill)
  window.addEventListener("resize", forceSyncPill)
  setTimeout(forceSyncPill, 400)
})()

// ---------- Reception stations controller ----------
// Originally ported by hand from Claude Design's v3 export
// (js/stations.js) as a master-detail browser; rebuilt on
// 2026-09-25 into ONE carousel with three ways to navigate it. The
// running total was already gone — see note 1 in this page's
// <style> header. Kept page-scoped rather than moved into main.js
// for the same reason the CSS is: page-scoped, not
// shared sitewide behavior main.js should carry for every page.
//
// The sixteen <li class="package-station-card"> in the markup are
// the single source of content, and they are now also the single
// PRESENTATION. There is no stage and no thumbnail strip to fill,
// so this script never copies a station's photo, items or serving
// note into a second element — which is most of why it is roughly
// half the size it was. What it builds is the desktop index
// (sixteen names and prices under six headings). What it wires is
// navigation: index rows, category buttons and arrows all resolve
// to "scroll the track to card N".
//
// NOTHING IS EVER HIDDEN. The previous version set card.hidden by
// category, which is what made the category buttons a tablist and
// what let a resize strand a visitor on a filtered set. All sixteen
// cards sit in the scroller at every width and the categories are
// waypoints into it. Which CONTROL is on screen is still decided
// entirely by CSS, so a resize needs nothing from JS beyond
// re-measuring (see the resize listener at the foot).
//
// The current station is DERIVED FROM SCROLL POSITION, never stored
// as a selection: whichever card is nearest the track's left edge
// is current, and the index row and category button follow it.
// Clicking either one scrolls, and the scroll handler then updates
// the highlight. One-way data flow, so there is no second source of
// truth to keep in step — the bug the old select()/setGroup() pair
// had to work at.
//
// Guarded per CLAUDE.md bug #4 — no-ops cleanly if the section
// isn't on the page, so it is safe to lift into main.js later.
//
// RUNS ONCE PER data-stations="carousel" SECTION. Written to
// support two — real section B's exact two-up build, and section
// C's desktop half, the peeking-card trial — back when both
// existed; B was deleted on 2026-09-29 once that comparison
// resolved, so only C's desktop half matches now. Left as a loop
// rather than collapsed back to a single document.querySelector,
// same reasoning as the stage controller above. Every closure below
// still belongs to one root regardless.
;[].slice
  .call(document.querySelectorAll('[data-stations="carousel"]'))
  .forEach(function (root, instance) {
    var catButtons = [].slice.call(
      root.querySelectorAll(".package-stations-category-tab"),
    )
    var tabsEl = root.querySelector(".package-stations-category-tabs")
    var indexEl = root.querySelector(".package-stations-index")
    var track = root.querySelector(".package-stations-card-list")
    var cardEls = [].slice.call(root.querySelectorAll(".package-station-card"))
    var nav = root.querySelector(".package-stations-carousel-nav")
    var prevBtn = root.querySelector("[data-carousel-prev]")
    var nextBtn = root.querySelector("[data-carousel-next]")
    var countCur = root.querySelector("[data-carousel-current]")
    var countTot = root.querySelector("[data-carousel-total]")
    var progressFill = root.querySelector("[data-carousel-progress]")
    if (!catButtons.length || !track || !cardEls.length) return

    var PLUS = "M12 5v14M5 12h14"
    var TICK = "M5 12l5 5 9-10"
    // Same 14-unit span/centering as PLUS/TICK above (5-19 out of
    // the shared 0 0 24 24 viewBox), so the hover-only "Remove"
    // icon reads as the same family rather than a mismatched size.
    var CROSS = "M5 5l14 14M19 5 5 19"
    // Gates the hover-to-"Remove" swap in paintAdd() below to real
    // pointer devices, matching this file's other hover/touch
    // splits (CLAUDE.md bug #19) — touch has no hover to trigger it
    // from, so there's nothing to gate wrong there either way, but
    // checking once here avoids a matchMedia() call on every
    // pointerenter.
    var supportsHover = window.matchMedia && window.matchMedia("(hover: hover)").matches
    // Only consulted by the "this moves" cue at the foot of this
    // function. Every other motion here is a scroll, and those are
    // already handled in CSS by scroll-behavior: auto under reduced
    // motion (section 9) — scrollTo honours the element's
    // scroll-behavior, so there is nothing for JS to branch on.
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    // Read off the element rather than hardcoded: the two carousel
    // sections carry different ids on their lists, because two
    // elements cannot share one. aria-controls has to name the one
    // in THIS section or it points at the other carousel.
    var LIST_ID = track.id

    // ---- data, read once from the cards ----
    // Only what the index needs. The old version also pulled each
    // station's src/alt/item <li>s/serving note out of its card
    // because the stage had to re-render all of it, including a
    // cloneNode dance so the vegetarian badges survived being read
    // as text. None of that is needed when the card itself is what
    // the visitor looks at.
    var stations = cardEls.map(function (card, i) {
      return {
        i: i,
        id: card.dataset.station,
        group: card.dataset.group,
        name: card.querySelector(".package-station-card-name").textContent.trim(),
        price: card.querySelector(".package-station-price-amount").textContent.trim(),
        card: card,
        addBtn: card.querySelector(".package-station-add-button"),
        badge: card.querySelector(".package-station-card-expand-badge"),
        row: null, // set when the index is built
      }
    })
    // data-label-full, not textContent. The buttons show the SHORT
    // label ("Boards", "Sea", "Fire") because six two- and
    // three-word labels in a scrolling row on a 360px phone is bug
    // #13 waiting to happen — but the index headings above the rows
    // want the full one ("Boards & Cured"), and the two are never on
    // screen together, since the buttons stop at 979.98px exactly
    // where the index starts. Reading the button's visible text
    // would have quietly retitled the index.
    var groups = catButtons.map(function (b) {
      return {
        id: b.dataset.group,
        label: (b.dataset.labelFull || b.textContent).trim(),
        button: b,
      }
    })
    var added = {}
    function inGroup(g) {
      return stations.filter(function (s) {
        return s.group === g
      })
    }

    // ---- small DOM helpers ----
    function el(tag, cls, text) {
      var n = document.createElement(tag)
      if (cls) n.className = cls
      if (text != null) n.textContent = text
      return n
    }
    function svg(path, size, cls) {
      var ns = "http://www.w3.org/2000/svg"
      var s = document.createElementNS(ns, "svg")
      s.setAttribute("width", size)
      s.setAttribute("height", size)
      s.setAttribute("viewBox", "0 0 24 24")
      s.setAttribute("fill", "none")
      s.setAttribute("stroke", "currentColor")
      s.setAttribute("stroke-width", "2")
      s.setAttribute("stroke-linecap", "round")
      s.setAttribute("stroke-linejoin", "round")
      s.setAttribute("aria-hidden", "true")
      if (cls) s.setAttribute("class", cls)
      var p = document.createElementNS(ns, "path")
      p.setAttribute("d", path)
      s.appendChild(p)
      return s
    }
    // The list form: "€12.50 pp" visually, "€12.50 per person" to a
    // screen reader. See .package-station-price-unit-short.
    function listPriceEl(cls, amount) {
      var n = el("span", cls, amount)
      var short = el("span", "package-station-price-unit-short", "pp")
      short.setAttribute("aria-hidden", "true")
      n.appendChild(short)
      n.appendChild(el("span", "package-stations-visually-hidden", " per person"))
      return n
    }
    // .eyebrow, not a parallel class — with .eyebrow-static pinning
    // the ::before rule open, since this markup is injected after the
    // scroll-reveal pass and never gets an .is-revealed of its own.
    function eyebrowEl(tag, text) {
      return el(tag, "eyebrow eyebrow-static", text)
    }
    // ---- build: desktop index ----
    // Built group by group, which is ALSO carousel order: the sixteen
    // <li>s in the markup are already laid out with each category's
    // cards contiguous and the categories in the same order as the
    // buttons. That is what lets one number — a station's index in
    // DOM order — address a row, a card and a scroll position at
    // once. Reorder the markup without reordering the buttons and the
    // index's Up/Down keys would start jumping around the track;
    // keep the two in step.
    var rows = []
    if (indexEl) {
      groups.forEach(function (g) {
        var wrap = el("div", "package-stations-index-group")
        wrap.appendChild(eyebrowEl("h3", g.label))
        var ul = el("ul", "package-stations-index-list")
        ul.setAttribute("role", "list")
        inGroup(g.id).forEach(function (s) {
          var li = el("li")
          var b = el("button", "package-stations-index-row")
          b.type = "button"
          b.dataset.station = s.id
          b.setAttribute("aria-controls", LIST_ID)
          b.setAttribute("aria-current", "false")
          b.appendChild(el("span", "package-stations-index-row-name", s.name))
          var tick = svg(TICK, 14, "package-stations-index-row-added-marker")
          tick.removeAttribute("aria-hidden")
          tick.setAttribute("role", "img")
          tick.setAttribute("aria-label", "in your selection")
          tick.setAttribute("hidden", "")
          b.appendChild(tick)
          b.appendChild(el("span", "package-stations-index-row-spacer"))
          b.appendChild(listPriceEl("package-stations-index-row-price", s.price))
          b.addEventListener("click", function () {
            goTo(s.i)
          })
          b.addEventListener("keydown", rowKeys)
          s.row = b
          rows.push(b)
          li.appendChild(b)
          ul.appendChild(li)
        })
        wrap.appendChild(ul)
        indexEl.appendChild(wrap)
      })
    }

    // Up/Down/Home/End move through all sixteen in visual order,
    // scrolling the track as they go so the carousel follows focus.
    function rowKeys(e) {
      var i = rows.indexOf(e.currentTarget),
        n = i
      if (e.key === "ArrowDown") n = (i + 1) % rows.length
      else if (e.key === "ArrowUp") n = (i - 1 + rows.length) % rows.length
      else if (e.key === "Home") n = 0
      else if (e.key === "End") n = rows.length - 1
      else return
      e.preventDefault()
      goTo(n)
      rows[n].focus()
    }

    // ---- the track ----
    // scrollTo(), not scrollIntoView(): the latter also scrolls the
    // PAGE to bring the track into view, which is wrong for a control
    // the visitor is already looking at — clicking an index row would
    // yank the section around under them.
    function trackPad() {
      return parseFloat(getComputedStyle(track).paddingLeft) || 0
    }
    function goTo(i) {
      i = Math.max(0, Math.min(stations.length - 1, i))
      track.scrollTo({
        left: stations[i].card.offsetLeft - track.offsetLeft - trackPad(),
      })
    }
    function goToGroup(g) {
      var first = inGroup(g)[0]
      if (first) goTo(first.i)
    }
    // 1px of tolerance, because a snapped scrollLeft is routinely
    // fractional (fractional viewport widths, device pixel ratios)
    // and an exact === would leave the arrows enabled at the ends.
    function atStart() {
      return track.scrollLeft <= 1
    }
    function atEnd() {
      return track.scrollLeft >= track.scrollWidth - track.clientWidth - 1
    }
    function nearestIndex() {
      var x = track.scrollLeft + trackPad() + track.offsetLeft,
        best = 0,
        dist = Infinity
      stations.forEach(function (s, i) {
        var d = Math.abs(s.card.offsetLeft - x)
        if (d < dist) {
          dist = d
          best = i
        }
      })
      return best
    }

    // ---- position -> highlight ----
    // The current station is the one nearest the left edge, EXCEPT at
    // the very end of the track, where it is the last station.
    // The exception is load-bearing, not a nicety: showing two cards
    // at a time means the furthest the track can scroll still leaves
    // the fifteenth card at the left edge, so a pure left-edge rule
    // can never make the sixteenth current — its index row would be
    // the one row in the column that never lights up, and the counter
    // would stop at 15 / 16. At the end of a list "the last one" is
    // also just the truer answer than "the one on the left".
    var current = -1
    function syncPosition() {
      var i = atEnd() ? stations.length - 1 : nearestIndex()
      current = i
      var s = stations[i]

      if (countCur) countCur.textContent = String(i + 1)
      if (countTot) countTot.textContent = String(stations.length)
      if (prevBtn) prevBtn.disabled = atStart()
      if (nextBtn) nextBtn.disabled = atEnd()
      // The rail fills by POSITION IN THE LIST, not by scroll
      // fraction. Scroll fraction would top out short of 1 — the
      // track cannot scroll past the point where the last two cards
      // are in view — and a progress rail that never fills reads as
      // broken. (i + 1) / 16 reaches exactly 1 on the last station,
      // which is also the one place syncPosition overrides the
      // left-edge rule, so the two agree by construction.
      if (progressFill)
        progressFill.style.transform = "scaleX(" + (i + 1) / stations.length + ")"

      stations.forEach(function (st) {
        if (st.row) st.row.setAttribute("aria-current", st === s ? "true" : "false")
      })
      catButtons.forEach(function (b) {
        b.setAttribute("aria-current", b.dataset.group === s.group ? "true" : "false")
      })
    }

    // rAF-throttled, same shape as the version this replaces.
    var ticking = false
    function queueSync() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(function () {
        ticking = false
        syncPosition()
        // Hoisted; no-ops on the sections that don't own the hash,
        // and until the "go" block has armed it.
        writeHash()
      })
    }
    track.addEventListener("scroll", queueSync, { passive: true })
    track.setAttribute("aria-roledescription", "carousel")
    track.setAttribute("aria-label", "Stations")

    // ---- controls ----
    catButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        goToGroup(b.dataset.group)
      })
    })
    // No roving tabindex and no Left/Right key handling. Both existed
    // because these were role="tab"s in a tablist, where the spec
    // asks for exactly one tab stop and arrow-key movement between
    // them. As plain navigation buttons the platform default is
    // correct: each is its own tab stop, Enter and Space activate.
    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        goTo(current - 1)
      })
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        goTo(current + 1)
      })

    // ---- Mouse drag-to-scroll ----
    // Touch swipe and trackpad wheel scroll both already work on
    // this track natively via the scroll-snap rule in the <style>
    // above (section 5) — a plain mouse is the one pointer with no
    // native gesture of its own on a hidden-scrollbar overflow-x
    // container, so this fills that one gap. pointerType is checked
    // so touch (and pen) never enter this path and their native
    // behaviour stays untouched. A finished drag commits through
    // goTo(nearestIndex()) — the same path every other control on
    // this carousel already uses to move it — rather than leaving
    // the track wherever the pointer happened to let go, which would
    // desync the index/counter/arrow-disabled state syncPosition()
    // maintains.
    //
    // Drag-start is deliberately scoped to .package-station-card-body
    // only (on request), not the whole card: the photo keeps cursor:
    // zoom-in and click-to-expand as its own, separate interaction,
    // and the "Add to selection" button keeps its own click
    // undisturbed. This scoping is also what the photo's click-to-
    // expand NEEDS to keep working at all — setPointerCapture()
    // below retargets the rest of this gesture's pointer events
    // (and, in practice, the mouse/click events a browser pairs with
    // them) to the track, so calling it on every mousedown
    // anywhere in the card, photo included, was silently swallowing
    // the figure's own click before it could ever reach the
    // lightbox's listener — not a separate bug, a direct consequence
    // of capturing too broadly. Starting the capture only on
    // .package-station-card-body sidesteps that entirely: a
    // mousedown on the figure is never captured, so its click
    // reaches the lightbox exactly as it did before this drag
    // existed.
    var drag = null // { startX, startScrollLeft, moved }
    var DRAG_CLICK_SUPPRESS_PX = 5 // below this, treat it as a click
    // A real drag ending on the "Add to selection" button must not
    // also fire that button's click — same click-after-drag problem
    // the homepage carousel's own drag doesn't have to solve, since
    // nothing inside its slides is itself clickable. Swallowed once,
    // on whatever element the pointer happens to release over.
    function suppressNextClick() {
      function swallow(e) {
        e.preventDefault()
        e.stopPropagation()
      }
      track.addEventListener("click", swallow, { capture: true, once: true })
      // A click from THIS gesture (released on something clickable)
      // fires synchronously, in the same task, right after pointerup
      // — so it's already caught and removed (once: true) by the time
      // this runs. A release over empty track space fires no click at
      // all, which would otherwise leave swallow() armed to eat the
      // next unrelated click whenever it happens; the timeout cleans
      // that dangling listener up instead.
      setTimeout(function () {
        track.removeEventListener("click", swallow, { capture: true })
      }, 0)
    }
    // Removing -unsnapped (so mandatory snapping comes back) is
    // debounced on the scroll settling rather than done on pointerup,
    // because the glide goTo() starts on release has to finish
    // first — see that class's own CSS comment. Re-armed by the
    // scroll listener below, and guarded so a drag that pauses
    // mid-gesture without moving doesn't get snapping restored
    // underneath it.
    var resnapTimer = null
    function queueResnap() {
      clearTimeout(resnapTimer)
      resnapTimer = setTimeout(function () {
        if (drag) return
        track.classList.remove("package-stations-card-list-unsnapped")
      }, 140)
    }
    // Gated on the class actually being present, so ordinary touch
    // and trackpad scrolling — which never sets it — does no timer
    // work at all.
    track.addEventListener(
      "scroll",
      function () {
        if (track.classList.contains("package-stations-card-list-unsnapped"))
          queueResnap()
      },
      { passive: true },
    )

    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return
      var body = e.target.closest(".package-station-card-body")
      if (!body || e.target.closest(".package-station-add-button")) return
      drag = { startX: e.clientX, startScrollLeft: track.scrollLeft, moved: 0 }
      clearTimeout(resnapTimer)
      track.classList.add("package-stations-card-list-dragging")
      track.classList.add("package-stations-card-list-unsnapped")
      track.setPointerCapture(e.pointerId)
    })
    track.addEventListener("pointermove", function (e) {
      if (!drag) return
      var dx = e.clientX - drag.startX
      drag.moved = Math.max(drag.moved, Math.abs(dx))
      track.scrollLeft = drag.startScrollLeft - dx
    })
    function endDrag() {
      if (!drag) return
      // Cursor and selection revert immediately; snapping does not
      // (queueResnap above).
      track.classList.remove("package-stations-card-list-dragging")
      if (drag.moved > DRAG_CLICK_SUPPRESS_PX) {
        suppressNextClick()
        goTo(nearestIndex())
      }
      drag = null
      queueResnap()
    }
    track.addEventListener("pointerup", endDrag)
    track.addEventListener("pointercancel", endDrag)
    track.addEventListener("dragstart", function (e) {
      e.preventDefault()
    })

    // ---- "Add to selection" ----
    // Hovering an already-added button now swaps its icon/label to
    // "Remove" (2026-09-30, on request — see the stage controller's
    // own copy of this function for the full reasoning; kept
    // identical here since the two paintAdd()s are already a
    // duplicated pair by this file's own convention). Gated to
    // supportsHover; touch discovers removal by tapping again, as
    // before.
    function paintAdd(btn, on, name) {
      if (!btn) return
      var wasOn = btn.getAttribute("aria-pressed") === "true"
      // Suppresses the "Remove" swap for exactly the hover session
      // a button was clicked during — see the stage controller's
      // own copy of this function for the full reasoning (kept
      // identical here, same duplication convention as the rest of
      // this pair).
      if (on && !wasOn && btn.dataset.hovering === "1") {
        btn.dataset.suppressRemove = "1"
      }
      btn.setAttribute("aria-pressed", on ? "true" : "false")
      if (name) btn.dataset.stationName = name
      var showRemove =
        on && supportsHover && btn.dataset.hovering === "1" && !btn.dataset.suppressRemove
      var iconPath = showRemove ? CROSS : on ? TICK : PLUS
      var labelText = showRemove ? "Remove" : on ? "Added" : "Add to selection"
      // The station name as hidden text, so a screen reader doesn't
      // hear sixteen identical "Add to selection" buttons.
      var labelName = name || btn.dataset.stationName
      // Mutate the existing icon/label nodes in place rather than
      // clearing and rebuilding them on every call (2026-09-30,
      // REAL BUG, reported as "the add icon is now shifting
      // weirdly on hover"): paintAdd() now runs on every
      // pointerenter/pointerleave too, and rebuilding threw away
      // the SAME <svg> element .button:hover svg's own transform
      // transition (styles.css) was already tracking — a brand
      // new element has no prior frame to animate FROM, so that
      // transition (a smooth translateX(4px) slide on every other
      // button on the site) snapped instantly instead on this one.
      // Updating the existing path's `d` and the label's
      // textContent keeps the same nodes alive across a repaint,
      // so the transition keeps working exactly as it does
      // everywhere else. Only the very first paint (no existing
      // children yet) still builds from scratch.
      var iconEl = btn.querySelector(".package-station-add-button-icon")
      var labelEl = btn.querySelector(".package-station-add-button-label")
      var hiddenEl = btn.querySelector(".package-stations-visually-hidden")
      if (iconEl && labelEl) {
        var pathEl = iconEl.querySelector("path")
        if (pathEl) pathEl.setAttribute("d", iconPath)
        labelEl.textContent = labelText
        if (labelName) {
          if (hiddenEl) hiddenEl.textContent = " — " + labelName
          else
            btn.appendChild(
              el("span", "package-stations-visually-hidden", " — " + labelName),
            )
        } else if (hiddenEl) {
          hiddenEl.remove()
        }
      } else {
        btn.textContent = ""
        btn.appendChild(svg(iconPath, 14, "package-station-add-button-icon"))
        btn.appendChild(el("span", "package-station-add-button-label", labelText))
        if (labelName)
          btn.appendChild(
            el("span", "package-stations-visually-hidden", " — " + labelName),
          )
      }
      if (supportsHover && !btn.dataset.hoverWired) {
        btn.dataset.hoverWired = "1"
        btn.addEventListener("pointerenter", function (e) {
          if (e.pointerType && e.pointerType !== "mouse") return
          btn.dataset.hovering = "1"
          paintAdd(btn, btn.getAttribute("aria-pressed") === "true")
        })
        btn.addEventListener("pointerleave", function (e) {
          if (e.pointerType && e.pointerType !== "mouse") return
          delete btn.dataset.hovering
          delete btn.dataset.suppressRemove
          paintAdd(btn, btn.getAttribute("aria-pressed") === "true")
        })
      }
    }
    function paintAdded(s) {
      paintAdd(s.addBtn, !!added[s.id], s.name)
      if (s.row) {
        var tick = s.row.querySelector(".package-stations-index-row-added-marker")
        if (added[s.id]) tick.removeAttribute("hidden")
        else tick.setAttribute("hidden", "")
      }
    }
    stations.forEach(function (s) {
      if (!s.addBtn) return
      s.addBtn.removeAttribute("hidden")
      s.addBtn.addEventListener("click", function () {
        if (added[s.id]) delete added[s.id]
        else added[s.id] = true
        // Repaints only the station that changed. The old version
        // re-rendered everything through one render() call, which it
        // had to because the stage held a second copy of whichever
        // station was selected.
        paintAdded(s)
      })
      paintAdded(s)
    })

    // ---- the lightbox's keyboard route ----
    // Each card's expand badge ships as a decorative aria-hidden
    // <span>; this swaps it for a real <button> naming its station.
    // Done here rather than in the markup only because the label has
    // to differ sixteen times ("Enlarge photo of Oyster Royale"), and
    // the name is already being read off the card two lines above —
    // hand-writing sixteen aria-labels would just be a second copy of
    // a string that can then fall out of step with the <h3>.
    //
    // Nothing is wired to it: a <button>'s Enter and Space fire a
    // click, which bubbles to the <figure>, which is where the
    // separate lightbox controller above already listens. Making it
    // focusable IS the fix. Losing it if JS is off costs nothing,
    // since the lightbox is JS too.
    stations.forEach(function (s) {
      if (!s.badge) return
      var b = el("button", s.badge.className)
      b.type = "button"
      b.setAttribute("aria-label", "Enlarge photo of " + s.name)
      while (s.badge.firstChild) b.appendChild(s.badge.firstChild)
      // The glyph was inside an aria-hidden <span> and so was hidden
      // with it; the button's own aria-label would take precedence
      // anyway, but marking it keeps the markup honest on its own.
      var glyph = b.querySelector("svg")
      if (glyph) glyph.setAttribute("aria-hidden", "true")
      s.badge.parentNode.replaceChild(b, s.badge)
      s.badge = b
    })

    // ---- deep linking ----
    // A URL that opens the page already parked on one station:
    // reception-package.html#oyster-royale (merged 2026-09-30; known
    // not to work correctly on mobile yet — see CLAUDE.md). Useful
    // for pointing a couple (or Bacchus) at a single item from an
    // email or a quote without saying "scroll down and find it".
    // Same idea as this page's own #rose, which addresses a tier.
    //
    // NO ids ARE ADDED TO THE CARDS. Giving a card id="oyster-royale"
    // would make the browser handle the hash itself on load — and it
    // would scroll the page vertically to that card AND the track
    // horizontally, both uncontrolled, before this script ran. It
    // would also force the slugs to be unique across all three
    // sections, i.e. prefixed and ugly. Matching the hash in JS
    // keeps the URL clean and the scrolling ours.
    //
    // OWNED BY THE FIRST CAROUSEL ONLY. Three sections showing the
    // same sixteen stations cannot all answer to #oyster-royale, and
    // two of them writing to history on scroll would fight. B owns
    // it; A and C ignore the hash entirely.
    var ownsHash = instance === 0
    function slug(name) {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }
    stations.forEach(function (s) {
      s.slug = slug(s.name)
    })
    // Put the WHOLE CARD on screen, third attempt and the one that
    // actually states the goal. The first centred
    // .package-stations-browser, which is ~700px tall, so its
    // midpoint landed halfway down the card's photograph. The second
    // scrolled the section to its top, which puts the heading, the
    // lead, the version banner and the category buttons on screen
    // and pushes the card you asked for below the fold — technically
    // "at the top of the thing", practically not showing you the
    // station at all.
    //
    // What a deep link owes you is the card, entire. So: measure the
    // band of viewport that isn't under the fixed nav, and centre
    // the card in it if it fits. If the card is taller than the band
    // — which it can be on a short laptop window, since a card runs
    // to roughly 640px — align its top instead and accept that the
    // button falls off the bottom, because the photograph and the
    // name are the part worth seeing.
    //
    // window.scrollTo rather than scrollIntoView: scrollIntoView has
    // no "fit this if you can, otherwise top-align" mode, and its
    // block: "nearest" does nothing at all when the element is
    // already partly visible.
    // Why this subtracts a transform, which is the part that took a
    // fourth attempt: .package-stations-browser carries data-reveal,
    // and [data-reveal] in styles.css is
    // `opacity: 0; transform: translateY(34px)` until the
    // scroll-reveal observer adds .is-revealed. So at the moment a
    // deep link runs — end of body, nothing revealed yet — every
    // card measures 34px LOWER than where it will end up. Scrolling
    // to put the measured top just under the nav therefore parked
    // the card's real top at 60px, i.e. about 14px underneath a 74px
    // fixed nav. That was the "top of the card still cut off".
    //
    // Reading the live matrix rather than hardcoding 34: the offset
    // belongs to a shared sitewide rule that can change, and more
    // than one ancestor could carry a transform. m42 is the
    // translateY component.
    function transformOffsetY(node) {
      var y = 0,
        el = node
      while (el && el !== document.body) {
        var t = getComputedStyle(el).transform
        if (t && t !== "none") {
          try {
            y += new DOMMatrixReadOnly(t).m42
          } catch (e) {
            // matrix(a, b, c, d, tx, ty) — sixth value.
            var parts = t.match(/matrix\(([^)]+)\)/)
            if (parts) y += parseFloat(parts[1].split(",")[5]) || 0
          }
        }
        el = el.parentElement
      }
      return y
    }
    function revealCard(card) {
      var navH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
        ) || 74
      var pad = 20
      var top = navH + pad
      var band = window.innerHeight - top - pad
      var rect = card.getBoundingClientRect()
      var cardTop = rect.top + window.pageYOffset - transformOffsetY(card)
      var y =
        band >= rect.height ? cardTop - top - (band - rect.height) / 2 : cardTop - top
      window.scrollTo({ top: Math.max(0, y) })
    }

    function applyHash() {
      if (!ownsHash || !location.hash) return
      var want = location.hash.slice(1).toLowerCase()
      for (var i = 0; i < stations.length; i++) {
        if (stations[i].slug === want) {
          goTo(i)
          revealCard(stations[i].card)
          return
        }
      }
    }
    // Written when the parked station CHANGES, not on every scroll
    // event — replaceState is cheap but not free, and the history
    // entry is replaced rather than pushed so the back button still
    // leaves the page instead of walking sixteen stations.
    //
    // Called from inside the rAF that runs syncPosition(), NOT from
    // the scroll listener directly: `current` is only correct after
    // that frame, so a scroll-bound call would stamp the previous
    // station and the final event of a fling would leave the hash
    // one behind with nothing following to correct it.
    var lastHashed = -1
    function writeHash() {
      if (!ownsHash || current < 0 || current === lastHashed) return
      lastHashed = current
      try {
        history.replaceState(null, "", "#" + stations[current].slug)
      } catch (e) {
        /* file:// in some browsers refuses replaceState; the
         carousel is unaffected, so this is not worth surfacing. */
      }
    }

    // ---- go ----
    ;[tabsEl, indexEl, nav].forEach(function (n) {
      if (n) n.removeAttribute("hidden")
    })
    root.classList.add("is-enhanced")
    syncPosition()
    // Arm the hash writer at wherever we actually start, so a
    // visitor who arrived at a clean URL doesn't get
    // "#charcuterie-table" stamped on it by the first stray scroll.
    lastHashed = current
    applyHash()
    window.addEventListener("hashchange", applyHash)

    // ---- the "this moves" cue ----
    // Three sweeps of light across the Next arrow, once, when the
    // cards have settled into view. REPLACED THE ONE-SHOT NUDGE on
    // 2026-09-28, which advanced the track by one card instead.
    //
    // Why the nudge went, beyond "moving content under a reader":
    // it had SIDE EFFECTS. Advancing set current = 1, which lit the
    // second index row, filled the progress rail to 2/16 and
    // rewrote the URL to #fromagerie-table — so a visitor who
    // arrived and did nothing ended up on a page claiming they were
    // on their second station, with a link naming one they had
    // never chosen. This touches a pseudo-element and nothing else.
    //
    // The animation itself is .button-shimmer's, reused rather than
    // reinvented — same keyframe (btn-shimmer-sweep, defined in
    // styles.css), same 5s cycle, same cap of THREE repeats. That
    // cap is not arbitrary and is not ours to re-pick: it is
    // recorded on .button-shimmer as the point where drawing the
    // eye stops and nagging starts, "sits oddly against the site's
    // 'doesn't need to try hard' positioning — real 17th-century
    // stone over any kind of hard-sell."
    //
    // SCOPED TO BELOW 980px IN CSS, where the arrows are actually
    // the primary way through the list. Above that the index is
    // sitting right there with all sixteen names in it, and
    // flashing the minor control while the major one waits in the
    // next column would be pointing at the wrong thing.
    //
    // Worth keeping in proportion: the peeking card already answers
    // "there is more this way" permanently and statically, at every
    // width. This is a second, transient signal layered on a fix
    // that already landed — a nicety, not a repair.
    var cued = false

    // Settled means the BOTTOM of the cards is in the viewport —
    // you are looking at a whole card, not the top half of one
    // still sliding up. An IntersectionObserver threshold cannot
    // express that: a ratio of 0.75 is satisfied just as well by
    // the top three quarters, which is the case being excluded.
    //
    // The taller-than-the-viewport branch matters: a card runs to
    // ~640px, so on a short laptop window the track can never fit,
    // and insisting on its bottom edge would mean the cue silently
    // never fires on those machines.
    // WIDENED 2026-09-28, after the cue turned out not to fire.
    // This used to read `r.top >= 0 && r.bottom <= vh - 8` — the
    // whole track inside the viewport — which is only true across a
    // scroll window of (viewport height - track height) pixels. A
    // card runs to ~650px and a phone viewport is ~700px, so that
    // window was about FORTY PIXELS of scrolling. Scroll past it in
    // one flick, which is the normal way to read a page, and the
    // condition never became true again on the way down: the
    // listener stayed attached and nothing ever happened.
    //
    // The bottom edge coming into view is the honest reading of
    // "you have seen a whole card" anyway, and it stays true for
    // the rest of the section rather than for one moment in it.
    function cardsSettled() {
      var r = track.getBoundingClientRect()
      var vh = window.innerHeight
      // Taller than the screen and so never able to fit: settled
      // once it has reached the top and still covers most of it.
      if (r.height > vh - 40) return r.top <= 90 && r.bottom > vh * 0.75
      // Otherwise: its bottom edge has come into view, and it has
      // not yet scrolled off the top.
      return r.bottom <= vh - 8 && r.bottom > 0
    }

    var cueTicking = false
    function teardownCue() {
      window.removeEventListener("scroll", onCueScroll)
      window.removeEventListener("resize", onCueScroll)
    }
    function fireCue() {
      if (cued) return teardownCue()
      if (!cardsSettled()) return
      cued = true
      // The class only arms the CSS; the beat before the first
      // sweep is animation-delay, not a timer here, so the two
      // cannot drift apart.
      if (nextBtn) nextBtn.classList.add("is-cueing")
      teardownCue()
    }
    function onCueScroll() {
      if (cueTicking) return
      cueTicking = true
      requestAnimationFrame(function () {
        cueTicking = false
        fireCue()
      })
    }
    if (!reduceMotion.matches) {
      // Cancelled by the visitor moving the TRACK, not by any touch
      // of the section — they have answered the question themselves
      // and do not need telling. Deliberately not listening for
      // wheel or touchstart on the root: both fire for ordinary page
      // scrolling over the cards, which is not an interaction with
      // the carousel at all.
      //
      // Registered after applyHash() above, so a deep link's own
      // programmatic scroll cancels it too — which is right: someone
      // who arrived at a specific station did not need to be told
      // the list moves.
      track.addEventListener(
        "scroll",
        function () {
          cued = true
          teardownCue()
        },
        { passive: true, once: true },
      )
      window.addEventListener("scroll", onCueScroll, { passive: true })
      window.addEventListener("resize", onCueScroll)
      // In case the section is already settled at load — a reload
      // partway down the page, say.
      fireCue()
    }
    // Card widths change at 621px and again at 980px, and the index
    // column's own width tracks the viewport continuously — so every
    // offsetLeft this reads is stale after a resize. Re-measuring is
    // all that's needed; no relayout, since CSS owns that.
    window.addEventListener("resize", queueSync)
  })
