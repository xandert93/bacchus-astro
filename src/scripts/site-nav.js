// The nav bar and mobile drawer: scroll state, progress bar, parallax,
// body.is-scrolling, the drawer and its accordion, the desktop dropdowns,
// and their bfcache/breakpoint guards. Loaded once by BaseLayout. Kept as
// one module because these blocks share state (burger, closeMenu, pageKey,
// onScroll, withoutNavTransitions) and their order matters — see the notes
// inside.

import { reduce } from "./lib/motion.js"
import { isScrollLocked, lockScroll, unlockScroll } from "./lib/scroll-lock.js"

// ---------- Nav: scroll state, progress bar, section spy, parallax ----------
const nav = document.getElementById("nav"),
  progress = document.getElementById("progress")
const links = [].slice.call(document.querySelectorAll("#navlinks a"))
const heroImg = document.getElementById("heroImg")
let ticking = false
const onScroll = () => {
  const y = window.scrollY || 0
  if (nav) nav.classList.toggle("stuck", y > 60)
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")"
  if (heroImg && !reduce && y < window.innerHeight)
    heroImg.style.transform = "translate3d(0," + y * 0.22 + "px,0)"
  ticking = false
}
// ---------- body.is-scrolling ----------
// Marks "the page is moving right now" so the stylesheet can switch off
// the two effects that are cheap on a still page and expensive on a
// moving one. Both are genuinely costly, not microoptimisations:
//
//   • .grain is a fixed, viewport-sized overlay at
//     mix-blend-mode: overlay. A blend mode forces the compositor to read
//     its backdrop back and blend against it whenever that backdrop
//     changes — i.e. every frame of every scroll, for the whole viewport
//     — and it also stops everything beneath it being composited
//     independently, which is what makes even plain opacity/transform
//     entrance animations underneath it expensive.
//   • backdrop-filter: blur() re-samples and re-blurs whatever is moving
//     behind it, again per frame.
//
// reception-package.html already reached this exact conclusion for its
// own tier swipe (body.package-tier-dragging, which switches off the same
// two things and notes that at 0.05 opacity the grain's brief absence
// isn't perceptible). This generalises that to vertical page scrolling,
// where it applies for identical reasons — the tier section is simply
// where it was noticed, being tall, image-heavy and full of reveals.
let scrollingOffTimer = null
const markScrolling = () => {
  document.body.classList.add("is-scrolling")
  clearTimeout(scrollingOffTimer)
  scrollingOffTimer = setTimeout(() => {
    document.body.classList.remove("is-scrolling")
  }, 140)
}
window.addEventListener(
  "scroll",
  () => {
    // Pinning the page for an overlay (lib/scroll-lock.js) moves window.scrollY
    // to 0 and back without the visitor scrolling. Ignore both, or the bar
    // would un-stick, the progress bar empty and the homepage hero jump
    // behind the overlay.
    if (isScrollLocked()) return
    markScrolling()
    if (!ticking) {
      ticking = true
      requestAnimationFrame(onScroll)
    }
  },
  { passive: true },
)
onScroll()

if (links.length) {
  const secObs = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (e.isIntersecting)
          links.forEach((l) => {
            l.classList.toggle("active", l.dataset.sec === e.target.id)
          })
      })
    },
    { rootMargin: "-45% 0px -50% 0px" },
  )
  links.forEach((l) => {
    if (!l.dataset.sec) return
    const el = document.getElementById(l.dataset.sec)
    if (el) secObs.observe(el)
  })
}

// ---------- Mobile menu ----------
const burger = document.getElementById("burger")
const mlinks = [].slice.call(document.querySelectorAll(".mobile-nav-link"))
mlinks.forEach((a, i) => {
  a.style.setProperty("--m-delay", 0.16 + i * 0.075 + "s")
})
const pageKey = (p) => {
  const seg =
    p.split("#")[0].split("?")[0].split("/").filter(Boolean).pop() || "index.html"
  return seg.replace(/\.html$/, "")
}
const curPage = pageKey(location.pathname)
mlinks.forEach((a) => {
  const href = a.getAttribute("href")
  if (!href || href.charAt(0) === "#") return
  if (pageKey(href) === curPage) a.setAttribute("aria-current", "page")
})
const closeMenu = () => {
  document.body.classList.remove("menu-open")
  if (burger) burger.setAttribute("aria-expanded", "false")
  unlockScroll("drawer")
}
// Closes the drawer with NO transition at all, synchronously, inside the
// click that is about to navigate. This is the actual fix for the back-
// gesture artefact (CLAUDE.md bug #34); the pagehide/pageshow handlers below
// were aimed at the restore and that was the wrong end of the problem.
//
// .menu's close is a 0.5s VISIBLE fade — visibility: hidden is delayed the
// full 0.5s while opacity animates to 0 — and the browser leaves for the new
// page within ~100ms of the tap. So at the moment of navigation the overlay
// is still roughly 80% opaque, and two separate mechanisms can put that back
// on screen when you come back:
//   • the back/forward cache restoring the unfinished transition, which
//     resumes and finishes on screen;
//   • Android Chrome's back-gesture preview, which is a BITMAP SCREENSHOT
//     captured at navigation time. If the overlay was 80% opaque when that
//     picture was taken, nothing done on restore can help — the swipe shows
//     the picture, then swaps to the live page, which reads as the menu
//     being open and fading away.
// Fixing the departure covers both, because neither has anything partial to
// capture. Fixing the restore only ever covered the first.
//
// Two forced reflows, which are deliberate and not cargo cult: the class has
// to be in effect BEFORE .menu-open comes off (or the transition still
// starts), and the closed state has to be committed BEFORE the class comes
// off again (or removing it restarts the transition from where it was). Both
// reads are on documentElement, outside the drawer, and this runs once per
// navigation.
// The class is added and removed within the one tick rather than left on,
// so nothing lingers if the navigation never happens.
// Runs fn with every transition in the nav and the drawer suppressed, so
// whatever state it changes lands instantly instead of starting an
// animation. Generic because BOTH closes need it: the drawer's 0.5s fade and
// the desktop panel's 0.3s fade are the same bug, and the first desktop fix
// only removed the classes — which starts the fade rather than skipping it.
const withoutNavTransitions = (fn) => {
  const root = document.documentElement
  root.classList.add("nav-no-anim")
  void root.offsetHeight
  fn()
  void root.offsetHeight
  root.classList.remove("nav-no-anim")
}
const closeMenuInstantly = () => {
  withoutNavTransitions(closeMenu)
}
// Only for links that actually leave the page. An in-page anchor or an
// unbuilt "#" row keeps the animated close: the visitor is staying here, so
// snapping the overlay shut would just look abrupt, and for a row that goes
// nowhere it would be worse than abrupt.
const closeMenuForLink = (a) => {
  const href = a.getAttribute("href")
  const leaves = href && href.charAt(0) !== "#" && !a.hasAttribute("data-unbuilt")
  return leaves ? closeMenuInstantly : closeMenu
}
if (burger) {
  burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open")
    burger.setAttribute("aria-expanded", open ? "true" : "false")
    if (open) lockScroll("drawer")
    else unlockScroll("drawer")
  })
}

// ---------- Close the drawer when the viewport grows past the burger ------
// The burger only exists below 980px. Open the drawer at tablet width, then
// widen the window back to laptop, and nothing in CSS closes it: the
// fullscreen overlay stays painted over a desktop bar that is now visible
// too, and the burger that would dismiss it is itself display: none by then,
// so there is no longer any control on screen to close it with.
// The part that actually breaks the page is less obvious than the overlay:
// body keeps the "overflow: hidden" the burger set, so the document cannot
// be scrolled at all. Even if the overlay were somehow dismissed, that lock
// would outlive it.
// matchMedia's change event, NOT a resize listener: it fires once, on the
// crossing itself, so there is no work at all during the drag and nothing to
// throttle. 980 rather than 979.98 — this is the min-width side of bug #22's
// pair, so the two ranges meet exactly with no fractional gap between them.
// Closing via burger.click() rather than closeMenu() is deliberate. Three
// separate listeners are bound to that click — the toggle here, the bar's
// .stuck handoff, and the accordion's deferred reset — and only the first of
// them is inside closeMenu(). Going through the button runs the whole close
// path in its established order rather than reimplementing two thirds of it
// here and leaving the copies to drift. HTMLElement.click() dispatches
// regardless of the button being display: none, and nothing in those
// handlers inspects event.isTrusted.
const navCutover = window.matchMedia("(min-width: 980px)")
const onNavCutoverChange = (e) => {
  if (!e.matches || !burger) return
  if (!document.body.classList.contains("menu-open")) return
  burger.click()
}
if (navCutover.addEventListener) {
  navCutover.addEventListener("change", onNavCutoverChange)
} else if (navCutover.addListener) {
  // Safari < 14 never got addEventListener on a MediaQueryList.
  navCutover.addListener(onNavCutoverChange)
}

// ---------- Back/forward cache: the drawer must not fade back in ---------
// Reported 2026-10-02 on Android Chrome: open the drawer on the homepage, tap
// Weddings, then use the system back gesture — the homepage returns with the
// drawer briefly visible, fading out over it.
// Not the phone, and not a repaint artefact. Tapping a sub-link calls
// closeMenu(), which removes .menu-open and STARTS the overlay's 0.5s
// opacity/transform fade; the browser then navigates within ~100ms, so the
// page is frozen into the back/forward cache with that fade partway through.
// bfcache restores a page exactly as it was left, mid-transition included, so
// on the way back the fade simply resumes from ~80% opacity and finishes on
// screen. The classes are already correct — what is restored is an unfinished
// animation, which is why nothing about the close logic looks wrong.
//
// Two halves, because either alone leaves a case open:
//   • pagehide: force it closed with animation suppressed, BEFORE the freeze,
//     so the cached snapshot has nothing in flight. The class is never
//     removed here — the page is either gone or frozen, and pageshow below
//     clears it on the way back.
//   • pageshow: the same force-close on restore, which covers snapshots
//     cached before this code existed, and any browser that restores the
//     drawer's open state without going through pagehide.
// Two nested rAFs before releasing the kill switch, not one: a single frame
// can be coalesced with the style change that preceded it, which would let
// the transition start after all — the same frame-boundary problem as
// CLAUDE.md bugs #1 and #7, used here in reverse to guarantee a boundary
// rather than to cross one.
const forceDrawerClosedWithoutAnimating = () => {
  document.documentElement.classList.add("nav-no-anim")
  closeMenu()
}
window.addEventListener("pagehide", forceDrawerClosedWithoutAnimating)
window.addEventListener("pageshow", (e) => {
  // A genuine fresh load needs none of this: CSS already has .menu at
  // opacity 0 / visibility hidden, so there is nothing to hide.
  const locked = document.body.classList.contains("menu-open") || isScrollLocked()
  if (!e.persisted && !locked) return
  forceDrawerClosedWithoutAnimating()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("nav-no-anim")
    })
  })
})

mlinks.forEach((a) => {
  a.addEventListener("click", closeMenuForLink(a))
})
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu()
})

// ---------- Whole-site nav: dropdowns, split triggers, drawer accordion ----------
// Merged from sandboxes/site-nav.html on 2026-10-02. Live on index.html
// only for now; every other page still carries the flat nav, so each block
// below no-ops cleanly when its markup is absent (CLAUDE.md bug #4).
//
// Placed immediately after the mobile-menu block on purpose, for three
// reasons that would break if it moved: pageKey()/curPage and `burger` are
// declared up there and reused here; the drawer restagger has to run AFTER
// main.js's own --m-delay loop in order to override it; and the accordion
// triggers deliberately do NOT carry .mobile-nav-link, because that class is
// what the loop above binds closeMenu() to — a trigger carrying it would
// close the whole drawer on the tap meant to expand it, and since that
// listener is registered first, nothing later can intercept it.
;(() => {
  // Links to pages this nav proposes but which do not exist yet. Left as
  // real <a href="#"> so they look, focus and read exactly like the links
  // they will be, then neutralised here — otherwise "#" jumps to the top of
  // the page and reads as broken rather than unbuilt.
  ;[].slice.call(document.querySelectorAll("[data-unbuilt]")).forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault()
    })
  })

  const dds = [].slice.call(document.querySelectorAll(".nav-dd"))

  // Promotes every data-src in one dropdown to a real src, once. One <img>
  // per crossfade state would otherwise mean every panel photograph
  // downloading on page load, in the header, for a dropdown most visitors
  // never open — the image weight already logged as the prime suspect for
  // the site failing on a weak mobile signal. Guarded by a flag on the
  // element rather than by checking whether any data-src is left, so all
  // three things that can open a panel call it freely and only the first
  // does work.
  const primeDropdownMedia = (dd) => {
    if (dd.dataset.mediaPrimed === "true") return
    dd.dataset.mediaPrimed = "true"
    ;[].slice.call(dd.querySelectorAll("img[data-src]")).forEach((img) => {
      img.src = img.getAttribute("data-src")
      img.removeAttribute("data-src")
    })
  }

  // Hover-intent rather than CSS :hover. :hover depends on the literal pixel
  // path the cursor takes, and a narrow trigger beside a wide, physically
  // distant panel means a diagonal drift toward the panel's centre can leave
  // the trigger's box before reaching the panel. A short close-delay
  // tolerates being briefly "outside" while still moving. See the long
  // comment above .nav-dd.is-hovering in styles.css.
  const ddHoverCapable = window.matchMedia("(hover: hover)").matches
  const ddInstances = []
  dds.forEach((dd) => {
    const ddChevronButton = dd.querySelector(".nav-dd-split-chevron-button")
    if (!ddChevronButton) return
    const ddLink = dd.querySelector(":scope > a")
    let ddCloseTimer = null

    const closeDd = () => {
      clearTimeout(ddCloseTimer)
      dd.classList.remove("is-open", "is-hovering")
      ddChevronButton.setAttribute("aria-expanded", "false")
      // The panel also opens on CSS :focus-within for keyboard tabbing, and
      // clicking the chevron focuses it (standard button behaviour), which
      // :focus-within then holds open regardless of the classes removed
      // above. Blurring is what actually lets a programmatic close close it.
      // Only the chevron is blurred, never the label — blurring that would
      // fight the browser's own focus handling on a real navigation.
      if (document.activeElement === ddChevronButton) ddChevronButton.blur()
    }
    ddInstances.push({ dd: dd, closeDd: closeDd })
    const closeOtherDds = () => {
      ddInstances.forEach((other) => {
        if (other.dd !== dd) other.closeDd()
      })
    }

    ddChevronButton.addEventListener("click", () => {
      primeDropdownMedia(dd)
      const open = dd.classList.toggle("is-open")
      ddChevronButton.setAttribute("aria-expanded", open ? "true" : "false")
      if (open) {
        closeOtherDds()
      } else {
        // A second click leaves the chevron both hovered and focused, each
        // of which independently keeps the panel open — closeDd() clears all
        // three, not just the is-open class.
        closeDd()
      }
    })

    // focusin, not focus: focus does not bubble, and what needs to prime the
    // photos is focus landing anywhere INSIDE this dropdown — the chevron,
    // or any row once the panel is open — not on the <li> itself. Opening by
    // keyboard relies on CSS :focus-within, so without this a keyboard user
    // would be the one person who never triggers the load.
    dd.addEventListener("focusin", () => {
      primeDropdownMedia(dd)
    })

    // A row matching the current page lights its own row AND its parent
    // label, so the bar still says where you are once the page it names is
    // one level down. The label's own href is checked too, since the hub is
    // a real page in this structure.
    let ddHasActive = false
    ;[].slice.call(dd.querySelectorAll(".nav-dd-item, .nav-dd-hub-link")).forEach((a) => {
      const href = a.getAttribute("href")
      if (href && href !== "#" && pageKey(href) === curPage) {
        a.classList.add("active")
        // The dot is visual only; this is what tells a screen reader.
        a.setAttribute("aria-current", "page")
        ddHasActive = true
      }
    })
    if (ddLink) {
      const ownHref = ddLink.getAttribute("href")
      if (ownHref && ownHref !== "#" && pageKey(ownHref) === curPage) {
        ddHasActive = true
      }
      if (ddHasActive) ddLink.classList.add("active")
    }

    if (ddHoverCapable) {
      dd.addEventListener("mouseenter", () => {
        primeDropdownMedia(dd)
        clearTimeout(ddCloseTimer)
        dd.classList.add("is-hovering")
        closeOtherDds()
      })
      dd.addEventListener("mouseleave", () => {
        clearTimeout(ddCloseTimer)
        ddCloseTimer = setTimeout(() => {
          dd.classList.remove("is-hovering")
        }, 250)
      })
    }
  })

  // One document listener each, not one per dropdown. Registered inside the
  // loop, N dropdowns would mean N click handlers and N keydown handlers all
  // firing on every click and keypress anywhere on the page, growing with
  // each dropdown added. Both are skipped entirely when the page has no
  // dropdowns at all.
  if (ddInstances.length) {
    document.addEventListener("click", (e) => {
      ddInstances.forEach((instance) => {
        if (!instance.dd.contains(e.target)) instance.closeDd()
      })
    })
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return
      ddInstances.forEach((instance) => {
        instance.closeDd()
      })
    })
  }

  // Plain top-level links (Gallery, and anything else not in a dropdown).
  ;[].slice.call(document.querySelectorAll(".nav-links > li > a")).forEach((a) => {
    if (a.closest(".nav-dd")) return
    const href = a.getAttribute("href")
    if (href && href !== "#" && pageKey(href) === curPage) {
      a.classList.add("active")
    }
  })

  // ---------- The bar's scrolled state, while the overlay is open ----------
  // The overlay sits UNDER the nav bar (z-index 790 against 800), so the
  // brand lockup stays visible over it — and at the top of a page the bar is
  // only a soft gradient, so overlay content scrolling up passes visibly
  // behind the lockup. The bar needs its dark state, but only once scrolled,
  // exactly as it behaves on the page itself.
  // window.scrollY cannot drive that here: the body is overflow: hidden
  // while the overlay is open, so the page's own scroll position is frozen
  // at wherever it was. The overlay is its own scroll container, so .stuck
  // is driven from ITS scrollTop instead, and handed back to onScroll() on
  // close.
  // 20px rather than the page's 60: the overlay's 96px of top padding means
  // its first row reaches the 74px bar's bottom edge after about 22px of
  // scroll, so the bar needs to be dark by then.
  // .menu-scroll, not #mobmenu — the overlay's scrolling moved one level in
  // so that .menu-bg could stop fighting .menu's transform. Falls back to
  // the overlay itself for any page that still has the older structure.
  const overlayRoot = document.getElementById("mobmenu")
  const overlayEl = overlayRoot
    ? overlayRoot.querySelector(".menu-scroll") || overlayRoot
    : null
  if (overlayEl && nav) {
    overlayEl.addEventListener(
      "scroll",
      () => {
        if (!document.body.classList.contains("menu-open")) return
        // Any scroll at all, not the page's 60px. The first row sits 22px
        // below the bar, so there is no distance over which it is safe to
        // still be transparent.
        nav.classList.toggle("stuck", overlayEl.scrollTop > 0)
      },
      { passive: true },
    )
  }
  if (burger && overlayEl && nav) {
    burger.addEventListener("click", () => {
      // main.js's own burger handler runs first and has already flipped the
      // class, so this reads the state the click produced, not the one
      // before it.
      if (document.body.classList.contains("menu-open")) {
        overlayEl.scrollTop = 0
        nav.classList.remove("stuck")
      } else {
        // Hand the bar back to page scroll.
        onScroll()
      }
    })
  }

  // ---------- Drawer accordion ----------
  // TEMPORARY (2026-10-02): true pins every group open and removes the
  // accordion entirely, so the overlay can be judged as a flat list on a
  // real phone before deciding whether collapsing is wanted at all. Set
  // back to false for the accordion. Nothing else needs changing - the
  // CSS rules this drives are keyed off .is-pinned-open.
  const DRAWER_GROUPS_PINNED_OPEN = false

  const groups = [].slice.call(document.querySelectorAll(".mobile-nav-group"))
  groups.forEach((g, gi) => {
    const trigger = g.querySelector(".mobile-nav-group-trigger")
    const sub = g.querySelector(".mobile-nav-sub")
    // aria-controls, generated here rather than authored per page: the
    // trigger already announced its expanded state but never said WHAT it
    // expands, so a screen reader had no way to associate the two. Ids are
    // derived from the index so this keeps working whatever the markup
    // carries, and nothing else in the page needs to know them.
    if (trigger && sub) {
      if (!sub.id) sub.id = "mobile-nav-sub-" + (gi + 1)
      trigger.setAttribute("aria-controls", sub.id)
    }
    let hasActive = false
    ;[].slice.call(g.querySelectorAll(".mobile-nav-sub-link")).forEach((a) => {
      const href = a.getAttribute("href")
      if (href && href !== "#" && pageKey(href) === curPage) {
        a.setAttribute("aria-current", "page")
        hasActive = true
      }
    })
    g.dataset.hasActive = hasActive ? "true" : "false"
    if (DRAWER_GROUPS_PINNED_OPEN) {
      g.classList.add("is-open", "is-pinned-open")
      if (trigger) {
        trigger.setAttribute("aria-expanded", "true")
        // aria-disabled rather than the disabled attribute: the label is
        // still meaningful as a heading and should stay in the reading
        // order, it just no longer does anything.
        trigger.setAttribute("aria-disabled", "true")
      }
      return
    }
    if (trigger) {
      trigger.addEventListener("click", () => {
        const open = g.classList.toggle("is-open")
        trigger.setAttribute("aria-expanded", open ? "true" : "false")
        // One group open at a time. The drawer is a height-constrained
        // surface and these groups are tall - measured on a 375x667 phone,
        // both open puts roughly 840px of content in a 667px window, with
        // the two CTAs and the social row as exactly the part pushed below
        // the fold. Collapsing the other group halves the worst case and is
        // also the ordinary accordion convention where space is tight.
        if (!open) return
        groups.forEach((other) => {
          if (other === g) return
          other.classList.remove("is-open")
          const t = other.querySelector(".mobile-nav-group-trigger")
          if (t) t.setAttribute("aria-expanded", "false")
        })
      })
    }
  })

  // The overlay opens with ONE group expanded rather than everything
  // collapsed. Collapsed-by-default put the most-wanted page two taps away
  // (burger, then Events, then Weddings) where it used to be one, and an
  // all-collapsed list also gives no hint that the rows expand at all —
  // one open beside one closed demonstrates it.
  // Which group: whichever contains the current page, so the overlay opens
  // showing where you already are; otherwise the FIRST one. First rather
  // than a named group deliberately — it follows the running order instead
  // of hard-coding "Restaurant", so reordering the nav moves this with it.
  const applyDefaultGroupState = () => {
    if (!groups.length) return
    let target = null
    groups.forEach((g) => {
      if (g.dataset.hasActive === "true") target = g
    })
    if (!target) target = groups[0]
    groups.forEach((g) => {
      const open = g === target
      g.classList.toggle("is-open", open)
      const t = g.querySelector(".mobile-nav-group-trigger")
      if (t) t.setAttribute("aria-expanded", open ? "true" : "false")
    })
    restaggerDrawerRows()
  }
  // Restagger the overlay's entrance across every row that is actually
  // VISIBLE when it opens: the top-level rows in DOM order, plus the
  // sub-links of whichever group is open, slotted in right after their own
  // trigger. Closed groups are clipped to zero height, so staggering their
  // rows would spend the sequence on things nobody sees and push Gallery and
  // About a second late.
  // Runs from applyDefaultGroupState() rather than once at init, so it is
  // recomputed whenever which group is open changes.
  const restaggerDrawerRows = () => {
    if (!overlayRoot) return
    const rows = []
    ;[].slice
      .call(overlayRoot.querySelectorAll(".mobile-nav-group, .mobile-nav-link"))
      .forEach((el) => {
        if (el.classList.contains("mobile-nav-link")) {
          rows.push(el)
          return
        }
        const t = el.querySelector(".mobile-nav-group-trigger")
        if (t) rows.push(t)
        if (!el.classList.contains("is-open")) return
        ;[].slice.call(el.querySelectorAll(".mobile-nav-sub-link")).forEach((a) => {
          rows.push(a)
        })
      })
    // Clear first: a row that was in the sequence last time and is not now
    // would otherwise keep a stale delay and arrive out of order.
    ;[].slice.call(overlayRoot.querySelectorAll(".mobile-nav-sub-link")).forEach((a) => {
      a.style.removeProperty("--m-delay")
    })
    rows.forEach((row, i) => {
      row.style.setProperty("--m-delay", 0.16 + i * 0.055 + "s")
    })
  }

  if (!DRAWER_GROUPS_PINNED_OPEN) applyDefaultGroupState()

  // (The stagger itself lives in restaggerDrawerRows() above, called from
  // applyDefaultGroupState() so it stays in step with which group is open.
  // main.js's own earlier --m-delay loop indexes .mobile-nav-link only and
  // runs first; this overwrites it.)
  if (DRAWER_GROUPS_PINNED_OPEN) restaggerDrawerRows()

  // closeMenu() owns .menu-open and the scroll lock; these two are the nav
  // block's own and are not reachable from it. On a bfcache restore the bar
  // can come back carrying a .stuck it was given by the OVERLAY's scrollTop,
  // which no longer corresponds to anything, and the accordion can come back
  // on whichever group was last expanded. Both are reset here, immediately
  // rather than deferred, since the overlay is closed and invisible by now.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return
    onScroll()
    if (groups.length && !DRAWER_GROUPS_PINNED_OPEN) applyDefaultGroupState()
    // The desktop half of the same bfcache bug (CLAUDE.md bug #34), reported
    // 2026-10-02: open the Events panel, click Weddings, press Back, and the
    // homepage returns with the panel still standing open.
    // Not a transition this time — restored STATE. Two things hold it open
    // and both survive the freeze:
    //   • the is-open class, which nothing was removing on navigation;
    //   • focus. Clicking a panel row focuses that link, bfcache restores
    //     focus with everything else, and the row is INSIDE the panel, so
    //     :focus-within holds it open no matter what the classes say.
    // closeDd() only blurs the chevron, deliberately — at click time
    // blurring the row would fight the browser's own focus handling on a
    // real navigation. On a restore there is no navigation in progress, so
    // the row is blurred here instead.
    ddInstances.forEach((i) => {
      if (i.dd.contains(document.activeElement)) document.activeElement.blur()
      i.closeDd()
    })
  })

  // ...and close the panel on the way OUT too, which is the half that does
  // not depend on the browser having used bfcache at all. Same lesson as the
  // drawer's instant close: fix the departure, not just the arrival.
  // Only rows that actually leave the page — an in-page anchor should leave
  // the panel alone, since the visitor is staying on it.
  ddInstances.forEach((i) => {
    ;[].slice.call(i.dd.querySelectorAll("a[href]")).forEach((a) => {
      const href = a.getAttribute("href")
      if (!href || href.charAt(0) === "#") return
      a.addEventListener("click", () => {
        // Everything that holds this panel open has to let go INSIDE one
        // suppressed block, and that includes FOCUS. There are three
        // holders — is-open, is-hovering and :focus-within — and releasing
        // any subset of them leaves the panel open on the rest.
        // The 2026-10-02 regression was exactly that: closeDd() dropped the
        // two classes here, but clicking a row focuses it (on mousedown,
        // before this handler even runs), so :focus-within kept the panel
        // fully open and nothing changed. The kill switch was then lifted at
        // the end of this block, and the pagehide handler below blurred the
        // row afterwards — starting the 0.3s fade at the LAST possible
        // moment, with transitions live. The page froze a frame later at
        // near-full opacity, so the flash came back bigger than the one the
        // instant close was meant to remove.
        // Blurring here instead means all three release together while
        // transitions are off, and the panel is simply shut from then on.
        // Safe: the click has already queued the navigation, and blur()
        // neither cancels it nor preventDefaults anything.
        withoutNavTransitions(() => {
          a.blur()
          const active = document.activeElement
          if (active && i.dd.contains(active)) active.blur()
          i.closeDd()
        })
      })
    })
  })

  // Blur before the freeze, which is what stops the panel being visible AT
  // ALL on the way back. The click handler above already drops is-open, but
  // focus is the other thing holding the panel open and bfcache restores it:
  // the clicked row is inside the panel, so :focus-within reopens it on the
  // restored frame, and the pageshow handler cannot help because it runs
  // AFTER that frame has painted. That is exactly the "panel is open, then
  // closes on its own" the user saw (2026-10-02).
  // Clearing focus here instead means the frozen page has nothing focused
  // inside the panel, so :focus-within never matches and the panel is shut
  // from the first restored frame. Safe at this point: the navigation is
  // already committed, so there is no focus handling left to fight.
  // Backstop only, for leaving the page some way that never fires a row's
  // click (a typed URL, an external link, a form submit) while focus happens
  // to sit inside a panel. Wrapped in withoutNavTransitions for the reason
  // the click handler above spells out: an unwrapped blur here drops
  // :focus-within with transitions LIVE and starts a 0.3s fade one frame
  // before the freeze, which is the worst possible moment to start one.
  window.addEventListener("pagehide", () => {
    const active = document.activeElement
    if (!active || active === document.body) return
    let inPanel = false
    ddInstances.forEach((i) => {
      if (i.dd.contains(active)) inPanel = true
    })
    if (!inPanel) return
    withoutNavTransitions(() => {
      active.blur()
      ddInstances.forEach((i) => {
        i.closeDd()
      })
    })
  })

  // The mirror of the drawer's resize guard above, for the desktop panels.
  // Shrinking past the cutover with a panel open hides it along with
  // .nav-links, so nothing is visibly wrong at the time — but the is-open
  // class, the chevron's aria-expanded and any focus held on the chevron all
  // survive, so widening back again reveals a panel standing open with no
  // pointer anywhere near it. closeDd() is used rather than a class strip
  // because the panel is also held open by :hover and :focus-within, and it
  // clears all three. No-ops on the nine pages with no .nav-dd markup, since
  // ddInstances is empty there.
  const onNavCutoverShrink = (e) => {
    if (e.matches) return
    ddInstances.forEach((i) => {
      i.closeDd()
    })
  }
  if (navCutover.addEventListener) {
    navCutover.addEventListener("change", onNavCutoverShrink)
  } else if (navCutover.addListener) {
    navCutover.addListener(onNavCutoverShrink)
  }

  // Reset to that same default when the overlay closes, so reopening it is
  // always the state you got on page load — not wherever you left the
  // accordion. Goes through applyDefaultGroupState() rather than repeating
  // the rule, so the two can't drift.
  // DEFERRED until the overlay has finished fading out, not run inside the
  // closing click. Run synchronously on close, the reset is CONCURRENT with
  // the fade rather than after it, and two things are visible through it:
  //   • the accordion rearranges itself as the overlay disappears — the open
  //     group collapses and the default one expands, each animating
  //     grid-template-rows over 0.45s against .menu's 0.5s fade, so the
  //     closing drawer is visibly reshuffling on the way out;
  //   • restaggerDrawerRows() reassigns --m-delay in the same tick, so the
  //     fade-OUT inherits a fresh entrance stagger of up to ~0.5s and the
  //     rows leave in sequence underneath a container that is already fading.
  // Note what is NOT the reason, since it looks like it should be: rewriting
  // --m-delay here does not disturb a running transition. Both listeners run
  // in one event dispatch with no style flush between them, so the browser
  // computes the new style once and starts the fade with the new delays
  // already in place — there is no mid-transition delay change to see.
  // 520ms clears .menu's own 0.5s opacity/transform transition, by which
  // point the overlay is invisible and none of the above can be seen.
  // Reopening inside that window still gets the default state: the pending
  // reset is cancelled and applied immediately instead, which is exactly
  // what happens at init and is safe because every row is at opacity 0 at
  // that moment anyway.
  if (burger && groups.length && !DRAWER_GROUPS_PINNED_OPEN) {
    let resetTimer = null
    burger.addEventListener("click", () => {
      clearTimeout(resetTimer)
      resetTimer = null
      if (document.body.classList.contains("menu-open")) {
        applyDefaultGroupState()
        return
      }
      resetTimer = setTimeout(() => {
        resetTimer = null
        if (document.body.classList.contains("menu-open")) return
        applyDefaultGroupState()
      }, 520)
    })
  }

  // The drawer's own top-level links close it via closeMenu above, bound to
  // every .mobile-nav-link — which the sub-links and the CTA buttons are
  // not. They close it here instead, except the unbuilt ones, which would
  // otherwise dismiss the drawer while going nowhere.
  ;[].slice
    .call(
      document.querySelectorAll(
        "#mobmenu .mobile-nav-sub-link:not([data-unbuilt]), #mobmenu .mobile-nav-cta-row .button:not([data-unbuilt])",
      ),
    )
    .forEach((a) => {
      // Instant close for the ones that navigate — see closeMenuForLink.
      a.addEventListener("click", closeMenuForLink(a))
    })
})()
