// Tier controller for the package pages (banquet, high tea, beverage) — was
// an identical inline <script> on each prototype page, differing only in its
// TIERS list, which is now read from the markup.
//
// Imported explicitly so main.js is guaranteed to have run first: this
// script uses window.BacchusTabs, which main.js defines. Both are ES modules
// importing the same file, so the bundler evaluates main.js once and in
// dependency order — no reliance on which <script> tag happens to come first.
import "./main.js";

// Page-specific tier controller. Drives every way of changing tier —
// the tab bar, the tier cards, the sticky switcher and touch swipe —
// plus the #hash sync that makes a tier directly linkable without
// needing a separate page for each (see the "package switcher vs.
// separate pages" discussion in CLAUDE.md). main.js's shared tab
// helper still supplies the sliding pill and aria bookkeeping; the
// carousel below is this page's own. Guarded the same way every other
// page-specific script here is (bug #4 — no-ops if .tab-bar is absent).
(function () {
  var tabs = [].slice.call(document.querySelectorAll(".tab-bar button"));
  if (!tabs.length) return;
  var tierCards = [].slice.call(document.querySelectorAll(".package-tier-card"));
  var stickySwitch = document.getElementById("packageStickySwitch");
  var stickyBtns = stickySwitch
    ? [].slice.call(stickySwitch.querySelectorAll(".package-sticky-switch-btn"))
    : [];
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
      : null;

  // Keeps the card grid's selected state (checkmark, gold border,
  // which single card shows on mobile) matched to the active tier.
  // Called only from applyTierState below, so a card never drives
  // this state directly even when a card is what was clicked — there
  // is one path that decides the active tier, and this reflects it.
  function syncTierCards(tierKey) {
    tierCards.forEach(function (card) {
      var isActive = card.dataset.tierCard === tierKey;
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  // Same idea as syncTierCards, for the sticky switcher's own active
  // state and pill. Delegates to stickyGroup.selectTab (the shared
  // main.js mechanism) rather than toggling .active by hand, so a
  // tier changed from anywhere else slides this pill exactly as a
  // direct click on it would — one implementation, not two. Calling
  // selectTab rather than btn.click() also keeps it clear of this
  // group's own click listener, so it can't loop back into itself.
  function syncStickySwitch(tierKey) {
    if (!stickyGroup) return;
    var btn = stickyBtns.filter(function (b) {
      return b.dataset.tierSwitch === tierKey;
    })[0];
    if (btn) stickyGroup.selectTab(btn);
  }

  // ================= Tier carousel =================
  // All three tiers are laid out side by side at once in a flex track
  // (.panels) inside an overflow:hidden window (.package-tier-view),
  // rather than main.js's usual "show one .tab-panel, hide the rest".
  // Two ways to change tier, with deliberately different motion:
  //
  //   • Click (tab bar, tier card, sticky switcher) — the track cuts
  //     straight to the new tier with no visible movement, and the
  //     content plays its vertical fade. Same as this page behaved
  //     before it had swipe at all.
  //   • Touch drag — the track follows the finger and eases to the
  //     nearest tier on release, with no fade at all: the content is
  //     simply already there, the way a photo carousel behaves.
  //
  // The drag handling is a port of this site's own homepage carousel
  // (.carousel-view/.carousel-track, styles.css + main.js) with an
  // axis lock added — see the drag section below. This package has
  // exactly three tiers, so none of this generalises to N slides.

  var view = document.getElementById("packageTierView");
  var track = document.getElementById("packageTierTrack");
  if (!view || !track) return;

  // Read from the tab bar's own data-tab values rather than hardcoded per
  // page, which is what lets one script serve every package page.
  var TIERS = tabs.map(function (b) {
    return b.dataset.tab;
  });
  // How long after the last scroll event the gesture counts as
  // finished. There is no scrollend event to rely on across the
  // browsers this has to work in, so settling is debounced instead.
  var SCROLL_SETTLE_MS = 140;

  var index = 0;

  function panelFor(tierKey) {
    return document.querySelector('.tab-panel[data-panel="' + tierKey + '"]');
  }
  function tabFor(tierKey) {
    return tabs.filter(function (b) {
      return b.dataset.tab === tierKey;
    })[0];
  }
  // Distance from one slide's left edge to the next: the window's own
  // width plus the real gap between slides, measured rather than
  // hardcoded — same approach as the homepage carousel.
  function slideStep() {
    return view.clientWidth + parseFloat(getComputedStyle(track).gap || 0);
  }
  // Which tier the window is parked on (or nearest to, mid-scroll).
  // Rounding is what makes a half-finished swipe resolve to whichever
  // tier it is closest to.
  function indexFromScroll() {
    var step = slideStep();
    if (!step) return index;
    return Math.max(0, Math.min(TIERS.length - 1, Math.round(view.scrollLeft / step)));
  }

  // ---- Per-item reveal ----
  // The dish tiles and menu groups (.package-reveal) stagger in on
  // scroll through their own observer, not main.js's shared
  // [data-reveal] one — see .package-reveal's CSS comment for why it
  // can't share that property. Two cases override the scroll
  // behaviour:
  //   • A tier switch isn't a scroll — the visitor is already looking
  //     at it. Its items are revealed outright rather than waiting on
  //     an intersection that may never come, since an off-screen tier
  //     sits outside the viewport horizontally.
  //   • On a swipe they're revealed with no motion at all
  //     (.package-reveal-instant): content assembling itself while
  //     the track is still moving is what read as "layout shift".
  var itemObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        itemObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );
  [].slice.call(document.querySelectorAll(".package-reveal")).forEach(function (el) {
    itemObserver.observe(el);
  });

  function revealItems(root, instant) {
    if (!root) return;
    [].slice.call(root.querySelectorAll(".package-reveal")).forEach(function (el) {
      if (instant) el.classList.add("package-reveal-instant");
      el.classList.add("is-revealed");
      itemObserver.unobserve(el);
    });
  }
  // Runs once, when a touch drag first starts: every tier's items land
  // in final position immediately, so whatever slides into view is
  // already fully formed. All three at once costs one repaint rather
  // than one per tier, mid-swipe. Clicks never trigger it, so the tab
  // bar keeps its staggered reveal.
  var itemsAllRevealed = false;
  function revealEverythingInstantly() {
    if (itemsAllRevealed) return;
    itemsAllRevealed = true;
    revealItems(track, true);
  }

  // ---- The two motions ----
  // Parks the window on a tier. Always instant: a click is the only
  // caller, and a click's motion is the content fade below, not
  // visible travel — which is also why .package-tier-view carries no
  // scroll-behavior: smooth. A swipe never comes through here; the
  // browser is already scrolling, and scrollLeft is what this reads
  // the result back from.
  function positionWindow() {
    view.scrollLeft = index * slideStep();
  }
  // Remove, reflow, re-add restarts the animation even if it has
  // already run, so returning to an already-seen tier replays the
  // fade — re-adding an animation class without a reflow in between
  // is a silent no-op (same shape as CLAUDE.md bug #7).
  function playContentFade() {
    var panel = panelFor(TIERS[index]);
    var content = panel && panel.querySelector(".package-tier-content");
    if (!content) return;
    content.classList.remove("package-tier-fade-in");
    void content.offsetWidth;
    content.classList.add("package-tier-fade-in");
  }
  // Keeps .package-tier-view's height matched to only the active
  // panel (see that class's own CSS comment for why this is needed at
  // all — the flex track otherwise sizes to the tallest of the three
  // tiers no matter which is showing). animate=false cuts straight to
  // the new height (init, resize — neither is "a tier change" with
  // motion of its own); true lets the CSS transition ease it,
  // alongside the content fade / swipe snap already playing.
  // heightLocked is held while the window is scrolling, when
  // expandViewForScroll() owns the height instead — without it the
  // observer below would re-collapse the window mid-swipe and
  // re-clip the incoming tier.
  var heightLocked = false;
  var heightSettleTimer = null;
  function syncViewHeight(animate) {
    var panel = panelFor(TIERS[index]);
    if (!panel) return;
    var h = panel.scrollHeight;
    if (animate) {
      view.style.height = h + "px";
      return;
    }
    view.style.transition = "none";
    view.style.height = h + "px";
    void view.offsetHeight;
    view.style.transition = "";
  }
  // ---- Height while the window is scrolling ----
  // A swipe shows two panels at once while the window is sized to
  // one, so scrolling towards a taller tier brought it in with its
  // lower items clipped for the whole gesture. Expanding to the
  // tallest for the duration means nothing is clipped while anything
  // moves; a short tier briefly carries dead space instead, which is
  // the lesser evil. Instant, not animated: an animated height forces
  // layout and paint of every tier panel on each frame it runs for,
  // and doing that mid-scroll is exactly the main-thread work native
  // scrolling was adopted to avoid.
  function tallestPanelHeight() {
    return TIERS.reduce(function (tallest, tierKey) {
      var panel = panelFor(tierKey);
      return panel ? Math.max(tallest, panel.scrollHeight) : tallest;
    }, 0);
  }
  function expandViewForScroll() {
    clearTimeout(heightSettleTimer);
    heightLocked = true;
    var h = tallestPanelHeight();
    if (!h) return;
    view.style.transition = "none";
    view.style.height = h + "px";
    void view.offsetHeight;
    view.style.transition = "";
  }
  // Re-armed on every scroll event, so it fires only once the window
  // has stopped — including when a half-swipe snaps back to the tier
  // it started from, which changes no tier and would otherwise leave
  // the window expanded indefinitely.
  function settleViewHeightAfterScroll() {
    clearTimeout(heightSettleTimer);
    heightSettleTimer = setTimeout(function () {
      heightLocked = false;
      syncViewHeight(true);
    }, SCROLL_SETTLE_MS);
  }
  // The explicit height was only ever measured on init, tier change
  // and window resize. Any other reason a panel's height changes went
  // unnoticed, and since the window clips, a height measured too
  // short silently swallows the bottom of the panel — the webfonts
  // are the clearest case, since line counts shift when they swap in
  // and no resize event fires for that. Watching the panels catches
  // the whole class of causes. Guarded per CLAUDE.md bug #4.
  if (window.ResizeObserver) {
    var panelHeightObserver = new ResizeObserver(function () {
      if (heightLocked) return;
      syncViewHeight(false);
    });
    TIERS.forEach(function (tierKey) {
      var panel = panelFor(tierKey);
      if (panel) panelHeightObserver.observe(panel);
    });
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
    : null;

  // Everything that isn't the track itself: the tab bar's pill and
  // aria state, the tier cards, the sticky switcher.
  function applyTierState(tierKey) {
    var btn = tabFor(tierKey);
    if (btn && tabGroup) tabGroup.selectTab(btn);
    syncTierCards(tierKey);
    syncStickySwitch(tierKey);
  }
  // The single path every tier change goes through, whichever control
  // triggered it.
  //
  // viaScroll separates the two callers, and the difference is not
  // cosmetic: a click has to MOVE the window, whereas a scroll has
  // already moved it and must not be told to move again — writing
  // scrollLeft from inside a scroll handler is how a scroll-driven
  // carousel fights its own momentum.
  function goToIndex(newIndex, viaScroll) {
    newIndex = Math.max(0, Math.min(TIERS.length - 1, newIndex));
    var changed = newIndex !== index;
    index = newIndex;
    if (!viaScroll) positionWindow();
    if (!changed) return;
    var tierKey = TIERS[index];
    history.replaceState(null, "", "#" + tierKey);
    applyTierState(tierKey);
    // A swipe's height is owned by expandViewForScroll() /
    // settleViewHeightAfterScroll() instead; animating it here too
    // would put per-frame layout back under a live scroll.
    if (!viaScroll) syncViewHeight(true);
    revealItems(panelFor(tierKey), viaScroll);
    if (!viaScroll) playContentFade();
  }

  // ---- Click triggers ----
  // Cards and sticky-switcher buttons call goToIndex directly rather
  // than proxying a click onto the tab button — goToIndex updates the
  // tab bar itself via applyTierState.
  function bindTierClicks(elements, tierKeyName) {
    elements.forEach(function (el) {
      el.addEventListener("click", function () {
        goToIndex(TIERS.indexOf(el.dataset[tierKeyName]));
      });
    });
  }
  bindTierClicks(tabs, "tab");
  bindTierClicks(tierCards, "tierCard");
  bindTierClicks(stickyBtns, "tierSwitch");

  // ---- Swipe ----
  // There is no swipe code any more, and that is the point. The
  // browser scrolls and snaps the window itself; everything below
  // only watches that happen and keeps the rest of the UI in step. A
  // swipe never writes scrollLeft (only positionWindow() does, for
  // clicks, resize and the initial landing), so a gesture in progress
  // and this file cannot disagree about where the track is.
  //
  // Nothing writes to .panels any more either: it is the scroll
  // CONTENT now, so a leftover transform would shift it on top of the
  // scroll offset and push the tier the window had correctly scrolled
  // to straight back out of sight — which looks exactly like "the
  // items are missing". If a transform ever reappears on this
  // element, suspect that first.
  var scrollFrame = null;
  var scrollingClassTimer = null;

  // Suppresses the two effects that otherwise recompute against the
  // moving content every frame (see body.package-tier-dragging in the
  // <style> above). Re-armed on every scroll event and timed off once
  // the scroll settles — no event reliably reports "a scroll has
  // finished" across the browsers this has to support.
  function setScrollingState() {
    clearTimeout(scrollingClassTimer);
    document.body.classList.add("package-tier-dragging");
    scrollingClassTimer = setTimeout(function () {
      document.body.classList.remove("package-tier-dragging");
    }, SCROLL_SETTLE_MS + 60);
  }

  function readScrollPosition() {
    scrollFrame = null;
    var i = indexFromScroll();
    if (i !== index) goToIndex(i, true);
  }
  // Whether the window sits exactly on the active tier rather than
  // between two. This is what separates a real swipe from the scroll
  // event a CLICK causes by writing scrollLeft: a click lands exactly
  // on a tier, reads as parked, and skips the motion handling below —
  // which it must, since it has already set the correct height, and
  // letting the swipe path also expand to the tallest tier made every
  // click flicker. Derived from position rather than a "this scroll
  // was mine" flag, because such a flag leaks whenever the write
  // doesn't actually move anything.
  function isParkedOnActiveTier() {
    var step = slideStep();
    return !step || Math.abs(view.scrollLeft - index * step) < 1;
  }
  view.addEventListener(
    "scroll",
    function () {
      if (!isParkedOnActiveTier()) {
        setScrollingState();
        if (!heightLocked) expandViewForScroll();
      }
      // Armed unconditionally and re-armed each event, so heightLocked
      // always has something coming to release it.
      settleViewHeightAfterScroll();
      // At most one position read per rendered frame.
      if (scrollFrame === null) scrollFrame = requestAnimationFrame(readScrollPosition);
    },
    { passive: true },
  );
  // Re-parks the window: slideStep() is read live, so an offset that
  // pointed at a tier before a resize or rotation would otherwise
  // point between two afterwards. The re-arm matters because
  // heightLocked stays true through the settle window and
  // expandViewForScroll() clears the pending settle.
  window.addEventListener("resize", function () {
    positionWindow();
    if (!heightLocked) {
      syncViewHeight(false);
      return;
    }
    expandViewForScroll();
    settleViewHeightAfterScroll();
  });

  // ---- Initial state ----
  // Land on the #hash tier if it names a real one, otherwise whichever
  // tab the markup already marks active. No transition on first paint:
  // easing in from off-screen on load would read as an unwanted
  // animation. The content fade still plays, as it always did.
  var hashTier = location.hash.replace("#", "");
  var landedOnHash = TIERS.indexOf(hashTier) >= 0;
  var startTier = landedOnHash ? hashTier : null;
  if (!startTier) {
    var activeTab = document.querySelector(".tab-bar button.active");
    startTier = activeTab ? activeTab.dataset.tab : TIERS[0];
  }
  index = Math.max(0, TIERS.indexOf(startTier));
  positionWindow();
  applyTierState(TIERS[index]);
  syncViewHeight(false);
  playContentFade();
  // A hash landing straight on a tier is "already looking at it", so
  // its items skip the scroll-stagger; a plain load keeps it.
  if (landedOnHash) revealItems(panelFor(TIERS[index]), false);

  // Shows the sticky switcher once its trigger point has scrolled out
  // of view above AND hides it again once the NEXT section's own
  // eyebrow (#closerLookEyebrow) starts
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
    var tabBarEl = document.querySelector(".package-tabs-tabbar");
    var cardsEl = document.querySelector(".package-tier-cards");
    var nextEyebrowEl = document.getElementById("closerLookEyebrow");
    var desktopMQ = window.matchMedia("(min-width: 841px)");
    var pastTabBar = false,
      pastCards = false,
      pastBottom = false;
    function updateStickyVisibility() {
      var pastTrigger = desktopMQ.matches ? pastCards : pastTabBar;
      var visible = pastTrigger && !pastBottom;
      stickySwitch.classList.toggle("is-visible", visible);
      stickySwitch.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    if (tabBarEl) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0];
        pastTabBar = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        updateStickyVisibility();
      }).observe(tabBarEl);
    }
    if (cardsEl) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0];
        pastCards = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        updateStickyVisibility();
      }).observe(cardsEl);
    }
    if (nextEyebrowEl) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0];
        pastBottom = entry.isIntersecting || entry.boundingClientRect.top < 0;
        updateStickyVisibility();
      }).observe(nextEyebrowEl);
    }
    window.addEventListener("resize", updateStickyVisibility);
  }
})();
