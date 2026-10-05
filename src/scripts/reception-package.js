// Reception package page: the Stations section's controllers (stage,
// category tabs, carousel, add-to-selection). The tier controller is the
// shared package-tiers.js, imported here so it runs first.
import "./package-tiers.js"

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
  // one in tabs.js (window.BacchusTabs.ensureTabVisible), which
  // every other tab bar on the site also runs via initTabGroup —
  // same behaviour, one definition, so the next fix to it reaches
  // this bar too. This bar can't just use initTabGroup wholesale:
  // its selected state is driven by the phone carousel's scroll
  // position, not by clicks on these buttons, so the pill sync
  // below has to stay its own thing. Guarded per CLAUDE.md bug #4 —
  // if tabs.js somehow hasn't loaded, the tab bar still works,
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
