(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var availReset = null; // set by the availability-widget block below; called on a full
  // form reset, to clear any picked wedding date entirely.
  var availRestoreField = null; // set by the availability-widget block below; called when
  // the event-type chip switches back to Wedding, to re-sync
  // #date from a previously-picked (never cleared) date.

  requestAnimationFrame(function () {
    document.body.classList.add("loaded");
  });
  var yrEl = document.getElementById("yr");
  if (yrEl) yrEl.textContent = new Date().getFullYear();

  // ---------- Ambient particles ----------
  if (!reduce) {
    [
      ["particles", 20],
      ["particles2", 10],
    ].forEach(function (cfg) {
      var pf = document.getElementById(cfg[0]);
      if (!pf) return;
      for (var pi = 0; pi < cfg[1]; pi++) {
        var p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "%";
        p.style.animationDuration = 9 + Math.random() * 10 + "s";
        p.style.animationDelay = Math.random() * 12 + "s";
        pf.appendChild(p);
      }
    });
  }

  // ---------- Nav: scroll state, progress bar, section spy, parallax ----------
  var nav = document.getElementById("nav"),
    progress = document.getElementById("progress");
  var links = [].slice.call(document.querySelectorAll("#navlinks a"));
  var heroImg = document.getElementById("heroImg");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    if (nav) nav.classList.toggle("stuck", y > 60);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (heroImg && !reduce && y < window.innerHeight)
      heroImg.style.transform = "translate3d(0," + y * 0.22 + "px,0)";
    ticking = false;
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
  var scrollingOffTimer = null;
  function markScrolling() {
    document.body.classList.add("is-scrolling");
    clearTimeout(scrollingOffTimer);
    scrollingOffTimer = setTimeout(function () {
      document.body.classList.remove("is-scrolling");
    }, 140);
  }
  window.addEventListener(
    "scroll",
    function () {
      markScrolling();
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  if (links.length) {
    var secObs = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting)
            links.forEach(function (l) {
              l.classList.toggle("active", l.dataset.sec === e.target.id);
            });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach(function (l) {
      if (!l.dataset.sec) return;
      var el = document.getElementById(l.dataset.sec);
      if (el) secObs.observe(el);
    });
  }

  // ---------- Mobile menu ----------
  var burger = document.getElementById("burger");
  var mlinks = [].slice.call(document.querySelectorAll(".mobile-nav-link"));
  mlinks.forEach(function (a, i) {
    a.style.setProperty("--m-delay", 0.16 + i * 0.075 + "s");
  });
  function pageKey(p) {
    var seg =
      p.split("#")[0].split("?")[0].split("/").filter(Boolean).pop() || "index.html";
    return seg.replace(/\.html$/, "");
  }
  var curPage = pageKey(location.pathname);
  mlinks.forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    if (pageKey(href) === curPage) a.setAttribute("aria-current", "page");
  });
  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
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
  function withoutNavTransitions(fn) {
    var root = document.documentElement;
    root.classList.add("nav-no-anim");
    void root.offsetHeight;
    fn();
    void root.offsetHeight;
    root.classList.remove("nav-no-anim");
  }
  function closeMenuInstantly() {
    withoutNavTransitions(closeMenu);
  }
  // Only for links that actually leave the page. An in-page anchor or an
  // unbuilt "#" row keeps the animated close: the visitor is staying here, so
  // snapping the overlay shut would just look abrupt, and for a row that goes
  // nowhere it would be worse than abrupt.
  function closeMenuForLink(a) {
    var href = a.getAttribute("href");
    var leaves = href && href.charAt(0) !== "#" && !a.hasAttribute("data-unbuilt");
    return leaves ? closeMenuInstantly : closeMenu;
  }
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
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
  var navCutover = window.matchMedia("(min-width: 980px)");
  function onNavCutoverChange(e) {
    if (!e.matches || !burger) return;
    if (!document.body.classList.contains("menu-open")) return;
    burger.click();
  }
  if (navCutover.addEventListener) {
    navCutover.addEventListener("change", onNavCutoverChange);
  } else if (navCutover.addListener) {
    // Safari < 14 never got addEventListener on a MediaQueryList.
    navCutover.addListener(onNavCutoverChange);
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
  function forceDrawerClosedWithoutAnimating() {
    document.documentElement.classList.add("nav-no-anim");
    closeMenu();
  }
  window.addEventListener("pagehide", forceDrawerClosedWithoutAnimating);
  window.addEventListener("pageshow", function (e) {
    // A genuine fresh load needs none of this: CSS already has .menu at
    // opacity 0 / visibility hidden, so there is nothing to hide.
    var locked =
      document.body.classList.contains("menu-open") ||
      document.body.style.overflow === "hidden";
    if (!e.persisted && !locked) return;
    forceDrawerClosedWithoutAnimating();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove("nav-no-anim");
      });
    });
  });

  mlinks.forEach(function (a) {
    a.addEventListener("click", closeMenuForLink(a));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

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
  (function () {
    // Links to pages this nav proposes but which do not exist yet. Left as
    // real <a href="#"> so they look, focus and read exactly like the links
    // they will be, then neutralised here — otherwise "#" jumps to the top of
    // the page and reads as broken rather than unbuilt.
    [].slice.call(document.querySelectorAll("[data-unbuilt]")).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
      });
    });

    var dds = [].slice.call(document.querySelectorAll(".nav-dd"));

    // Promotes every data-src in one dropdown to a real src, once. One <img>
    // per crossfade state would otherwise mean every panel photograph
    // downloading on page load, in the header, for a dropdown most visitors
    // never open — the image weight already logged as the prime suspect for
    // the site failing on a weak mobile signal. Guarded by a flag on the
    // element rather than by checking whether any data-src is left, so all
    // three things that can open a panel call it freely and only the first
    // does work.
    function primeDropdownMedia(dd) {
      if (dd.dataset.mediaPrimed === "true") return;
      dd.dataset.mediaPrimed = "true";
      [].slice.call(dd.querySelectorAll("img[data-src]")).forEach(function (img) {
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
      });
    }

    // Hover-intent rather than CSS :hover. :hover depends on the literal pixel
    // path the cursor takes, and a narrow trigger beside a wide, physically
    // distant panel means a diagonal drift toward the panel's centre can leave
    // the trigger's box before reaching the panel. A short close-delay
    // tolerates being briefly "outside" while still moving. See the long
    // comment above .nav-dd.is-hovering in styles.css.
    var ddHoverCapable = window.matchMedia("(hover: hover)").matches;
    var ddInstances = [];
    dds.forEach(function (dd) {
      var ddChevronButton = dd.querySelector(".nav-dd-split-chevron-button");
      if (!ddChevronButton) return;
      var ddLink = dd.querySelector(":scope > a");
      var ddCloseTimer = null;

      function closeDd() {
        clearTimeout(ddCloseTimer);
        dd.classList.remove("is-open", "is-hovering");
        ddChevronButton.setAttribute("aria-expanded", "false");
        // The panel also opens on CSS :focus-within for keyboard tabbing, and
        // clicking the chevron focuses it (standard button behaviour), which
        // :focus-within then holds open regardless of the classes removed
        // above. Blurring is what actually lets a programmatic close close it.
        // Only the chevron is blurred, never the label — blurring that would
        // fight the browser's own focus handling on a real navigation.
        if (document.activeElement === ddChevronButton) ddChevronButton.blur();
      }
      ddInstances.push({ dd: dd, closeDd: closeDd });
      function closeOtherDds() {
        ddInstances.forEach(function (other) {
          if (other.dd !== dd) other.closeDd();
        });
      }

      ddChevronButton.addEventListener("click", function () {
        primeDropdownMedia(dd);
        var open = dd.classList.toggle("is-open");
        ddChevronButton.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          closeOtherDds();
        } else {
          // A second click leaves the chevron both hovered and focused, each
          // of which independently keeps the panel open — closeDd() clears all
          // three, not just the is-open class.
          closeDd();
        }
      });

      // focusin, not focus: focus does not bubble, and what needs to prime the
      // photos is focus landing anywhere INSIDE this dropdown — the chevron,
      // or any row once the panel is open — not on the <li> itself. Opening by
      // keyboard relies on CSS :focus-within, so without this a keyboard user
      // would be the one person who never triggers the load.
      dd.addEventListener("focusin", function () {
        primeDropdownMedia(dd);
      });

      // A row matching the current page lights its own row AND its parent
      // label, so the bar still says where you are once the page it names is
      // one level down. The label's own href is checked too, since the hub is
      // a real page in this structure.
      var ddHasActive = false;
      [].slice
        .call(dd.querySelectorAll(".nav-dd-item, .nav-dd-hub-link"))
        .forEach(function (a) {
          var href = a.getAttribute("href");
          if (href && href !== "#" && pageKey(href) === curPage) {
            a.classList.add("active");
            // The dot is visual only; this is what tells a screen reader.
            a.setAttribute("aria-current", "page");
            ddHasActive = true;
          }
        });
      if (ddLink) {
        var ownHref = ddLink.getAttribute("href");
        if (ownHref && ownHref !== "#" && pageKey(ownHref) === curPage) {
          ddHasActive = true;
        }
        if (ddHasActive) ddLink.classList.add("active");
      }

      if (ddHoverCapable) {
        dd.addEventListener("mouseenter", function () {
          primeDropdownMedia(dd);
          clearTimeout(ddCloseTimer);
          dd.classList.add("is-hovering");
          closeOtherDds();
        });
        dd.addEventListener("mouseleave", function () {
          clearTimeout(ddCloseTimer);
          ddCloseTimer = setTimeout(function () {
            dd.classList.remove("is-hovering");
          }, 250);
        });
      }
    });

    // One document listener each, not one per dropdown. Registered inside the
    // loop, N dropdowns would mean N click handlers and N keydown handlers all
    // firing on every click and keypress anywhere on the page, growing with
    // each dropdown added. Both are skipped entirely when the page has no
    // dropdowns at all.
    if (ddInstances.length) {
      document.addEventListener("click", function (e) {
        ddInstances.forEach(function (instance) {
          if (!instance.dd.contains(e.target)) instance.closeDd();
        });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        ddInstances.forEach(function (instance) {
          instance.closeDd();
        });
      });
    }

    // Plain top-level links (Gallery, and anything else not in a dropdown).
    [].slice.call(document.querySelectorAll(".nav-links > li > a")).forEach(function (a) {
      if (a.closest(".nav-dd")) return;
      var href = a.getAttribute("href");
      if (href && href !== "#" && pageKey(href) === curPage) {
        a.classList.add("active");
      }
    });

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
    var overlayRoot = document.getElementById("mobmenu");
    var overlayEl = overlayRoot
      ? overlayRoot.querySelector(".menu-scroll") || overlayRoot
      : null;
    if (overlayEl && nav) {
      overlayEl.addEventListener(
        "scroll",
        function () {
          if (!document.body.classList.contains("menu-open")) return;
          // Any scroll at all, not the page's 60px. The first row sits 22px
          // below the bar, so there is no distance over which it is safe to
          // still be transparent.
          nav.classList.toggle("stuck", overlayEl.scrollTop > 0);
        },
        { passive: true },
      );
    }
    if (burger && overlayEl && nav) {
      burger.addEventListener("click", function () {
        // main.js's own burger handler runs first and has already flipped the
        // class, so this reads the state the click produced, not the one
        // before it.
        if (document.body.classList.contains("menu-open")) {
          overlayEl.scrollTop = 0;
          nav.classList.remove("stuck");
        } else {
          // Hand the bar back to page scroll.
          onScroll();
        }
      });
    }

    // ---------- Drawer accordion ----------
    // TEMPORARY (2026-10-02): true pins every group open and removes the
    // accordion entirely, so the overlay can be judged as a flat list on a
    // real phone before deciding whether collapsing is wanted at all. Set
    // back to false for the accordion. Nothing else needs changing - the
    // CSS rules this drives are keyed off .is-pinned-open.
    var DRAWER_GROUPS_PINNED_OPEN = false;

    var groups = [].slice.call(document.querySelectorAll(".mobile-nav-group"));
    groups.forEach(function (g, gi) {
      var trigger = g.querySelector(".mobile-nav-group-trigger");
      var sub = g.querySelector(".mobile-nav-sub");
      // aria-controls, generated here rather than authored per page: the
      // trigger already announced its expanded state but never said WHAT it
      // expands, so a screen reader had no way to associate the two. Ids are
      // derived from the index so this keeps working whatever the markup
      // carries, and nothing else in the page needs to know them.
      if (trigger && sub) {
        if (!sub.id) sub.id = "mobile-nav-sub-" + (gi + 1);
        trigger.setAttribute("aria-controls", sub.id);
      }
      var hasActive = false;
      [].slice.call(g.querySelectorAll(".mobile-nav-sub-link")).forEach(function (a) {
        var href = a.getAttribute("href");
        if (href && href !== "#" && pageKey(href) === curPage) {
          a.setAttribute("aria-current", "page");
          hasActive = true;
        }
      });
      g.dataset.hasActive = hasActive ? "true" : "false";
      if (DRAWER_GROUPS_PINNED_OPEN) {
        g.classList.add("is-open", "is-pinned-open");
        if (trigger) {
          trigger.setAttribute("aria-expanded", "true");
          // aria-disabled rather than the disabled attribute: the label is
          // still meaningful as a heading and should stay in the reading
          // order, it just no longer does anything.
          trigger.setAttribute("aria-disabled", "true");
        }
        return;
      }
      if (trigger) {
        trigger.addEventListener("click", function () {
          var open = g.classList.toggle("is-open");
          trigger.setAttribute("aria-expanded", open ? "true" : "false");
          // One group open at a time. The drawer is a height-constrained
          // surface and these groups are tall - measured on a 375x667 phone,
          // both open puts roughly 840px of content in a 667px window, with
          // the two CTAs and the social row as exactly the part pushed below
          // the fold. Collapsing the other group halves the worst case and is
          // also the ordinary accordion convention where space is tight.
          if (!open) return;
          groups.forEach(function (other) {
            if (other === g) return;
            other.classList.remove("is-open");
            var t = other.querySelector(".mobile-nav-group-trigger");
            if (t) t.setAttribute("aria-expanded", "false");
          });
        });
      }
    });

    // The overlay opens with ONE group expanded rather than everything
    // collapsed. Collapsed-by-default put the most-wanted page two taps away
    // (burger, then Events, then Weddings) where it used to be one, and an
    // all-collapsed list also gives no hint that the rows expand at all —
    // one open beside one closed demonstrates it.
    // Which group: whichever contains the current page, so the overlay opens
    // showing where you already are; otherwise the FIRST one. First rather
    // than a named group deliberately — it follows the running order instead
    // of hard-coding "Restaurant", so reordering the nav moves this with it.
    function applyDefaultGroupState() {
      if (!groups.length) return;
      var target = null;
      groups.forEach(function (g) {
        if (g.dataset.hasActive === "true") target = g;
      });
      if (!target) target = groups[0];
      groups.forEach(function (g) {
        var open = g === target;
        g.classList.toggle("is-open", open);
        var t = g.querySelector(".mobile-nav-group-trigger");
        if (t) t.setAttribute("aria-expanded", open ? "true" : "false");
      });
      restaggerDrawerRows();
    }
    // Restagger the overlay's entrance across every row that is actually
    // VISIBLE when it opens: the top-level rows in DOM order, plus the
    // sub-links of whichever group is open, slotted in right after their own
    // trigger. Closed groups are clipped to zero height, so staggering their
    // rows would spend the sequence on things nobody sees and push Gallery and
    // About a second late.
    // Runs from applyDefaultGroupState() rather than once at init, so it is
    // recomputed whenever which group is open changes.
    function restaggerDrawerRows() {
      if (!overlayRoot) return;
      var rows = [];
      [].slice
        .call(overlayRoot.querySelectorAll(".mobile-nav-group, .mobile-nav-link"))
        .forEach(function (el) {
          if (el.classList.contains("mobile-nav-link")) {
            rows.push(el);
            return;
          }
          var t = el.querySelector(".mobile-nav-group-trigger");
          if (t) rows.push(t);
          if (!el.classList.contains("is-open")) return;
          [].slice
            .call(el.querySelectorAll(".mobile-nav-sub-link"))
            .forEach(function (a) {
              rows.push(a);
            });
        });
      // Clear first: a row that was in the sequence last time and is not now
      // would otherwise keep a stale delay and arrive out of order.
      [].slice
        .call(overlayRoot.querySelectorAll(".mobile-nav-sub-link"))
        .forEach(function (a) {
          a.style.removeProperty("--m-delay");
        });
      rows.forEach(function (row, i) {
        row.style.setProperty("--m-delay", 0.16 + i * 0.055 + "s");
      });
    }

    if (!DRAWER_GROUPS_PINNED_OPEN) applyDefaultGroupState();

    // (The stagger itself lives in restaggerDrawerRows() above, called from
    // applyDefaultGroupState() so it stays in step with which group is open.
    // main.js's own earlier --m-delay loop indexes .mobile-nav-link only and
    // runs first; this overwrites it.)
    if (DRAWER_GROUPS_PINNED_OPEN) restaggerDrawerRows();

    // closeMenu() owns .menu-open and the scroll lock; these two are the nav
    // block's own and are not reachable from it. On a bfcache restore the bar
    // can come back carrying a .stuck it was given by the OVERLAY's scrollTop,
    // which no longer corresponds to anything, and the accordion can come back
    // on whichever group was last expanded. Both are reset here, immediately
    // rather than deferred, since the overlay is closed and invisible by now.
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      onScroll();
      if (groups.length && !DRAWER_GROUPS_PINNED_OPEN) applyDefaultGroupState();
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
      ddInstances.forEach(function (i) {
        if (i.dd.contains(document.activeElement)) document.activeElement.blur();
        i.closeDd();
      });
    });

    // ...and close the panel on the way OUT too, which is the half that does
    // not depend on the browser having used bfcache at all. Same lesson as the
    // drawer's instant close: fix the departure, not just the arrival.
    // Only rows that actually leave the page — an in-page anchor should leave
    // the panel alone, since the visitor is staying on it.
    ddInstances.forEach(function (i) {
      [].slice.call(i.dd.querySelectorAll("a[href]")).forEach(function (a) {
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;
        a.addEventListener("click", function () {
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
          withoutNavTransitions(function () {
            a.blur();
            var active = document.activeElement;
            if (active && i.dd.contains(active)) active.blur();
            i.closeDd();
          });
        });
      });
    });

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
    window.addEventListener("pagehide", function () {
      var active = document.activeElement;
      if (!active || active === document.body) return;
      var inPanel = false;
      ddInstances.forEach(function (i) {
        if (i.dd.contains(active)) inPanel = true;
      });
      if (!inPanel) return;
      withoutNavTransitions(function () {
        active.blur();
        ddInstances.forEach(function (i) {
          i.closeDd();
        });
      });
    });

    // The mirror of the drawer's resize guard above, for the desktop panels.
    // Shrinking past the cutover with a panel open hides it along with
    // .nav-links, so nothing is visibly wrong at the time — but the is-open
    // class, the chevron's aria-expanded and any focus held on the chevron all
    // survive, so widening back again reveals a panel standing open with no
    // pointer anywhere near it. closeDd() is used rather than a class strip
    // because the panel is also held open by :hover and :focus-within, and it
    // clears all three. No-ops on the nine pages with no .nav-dd markup, since
    // ddInstances is empty there.
    function onNavCutoverShrink(e) {
      if (e.matches) return;
      ddInstances.forEach(function (i) {
        i.closeDd();
      });
    }
    if (navCutover.addEventListener) {
      navCutover.addEventListener("change", onNavCutoverShrink);
    } else if (navCutover.addListener) {
      navCutover.addListener(onNavCutoverShrink);
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
      var resetTimer = null;
      burger.addEventListener("click", function () {
        clearTimeout(resetTimer);
        resetTimer = null;
        if (document.body.classList.contains("menu-open")) {
          applyDefaultGroupState();
          return;
        }
        resetTimer = setTimeout(function () {
          resetTimer = null;
          if (document.body.classList.contains("menu-open")) return;
          applyDefaultGroupState();
        }, 520);
      });
    }

    // The drawer's own top-level links close it via closeMenu above, bound to
    // every .mobile-nav-link — which the sub-links and the CTA buttons are
    // not. They close it here instead, except the unbuilt ones, which would
    // otherwise dismiss the drawer while going nowhere.
    [].slice
      .call(
        document.querySelectorAll(
          "#mobmenu .mobile-nav-sub-link:not([data-unbuilt]), #mobmenu .mobile-nav-cta-row .button:not([data-unbuilt])",
        ),
      )
      .forEach(function (a) {
        // Instant close for the ones that navigate — see closeMenuForLink.
        a.addEventListener("click", closeMenuForLink(a));
      });
  })();

  // ---------- Scroll reveals ----------
  // A reveal observer must never be able to lose an element: anything it
  // drops stays at opacity 0 forever, i.e. content silently missing from
  // the page. Both observers below used to run at threshold: 0.18 and act
  // only `if (e.isIntersecting)`, dropping every other entry without
  // unobserving, and that could strand an element two ways — both of them
  // specific to narrow screens, which is why it went unnoticed so long:
  //
  //   1. 18% of a TALL element is a lot of pixels. Single-column mobile
  //      layouts make blocks far taller than their desktop equivalents,
  //      and anything taller than ~5.5 viewports can never be 18% visible
  //      at once, so the callback never fires for it at all.
  //   2. A crossing can be missed outright. Intersection state is sampled
  //      per rendering step, so a fling scroll carrying an element from
  //      below the fold to above it within one step delivers a single
  //      entry reading isIntersecting: false — dropped, still hidden, and
  //      (having never been unobserved) left waiting for a crossing that
  //      only comes if the visitor scrolls back up.
  //
  // Hence threshold 0, plus the already-scrolled-past case handled rather
  // than ignored, plus revealSweeper below as a backstop. reception-
  // package.html carries the same three fixes on its own .package-reveal
  // observer, which is where this was first caught — a whole menu group at
  // a time was vanishing out of the middle of a tier column.
  //
  // Everything here only ever makes MORE content visible, never less: the
  // worst case of getting it wrong is something revealing a little earlier
  // than intended.

  // Shared backstop for both observers. Sweeps only what is still waiting,
  // once scrolling settles, and unhooks itself when nothing is left.
  var revealPending = [];
  var revealSweepTimer = null;
  function revealSweep() {
    if (!revealPending.length) return;
    var limit = window.innerHeight * 0.92; // matches the rootMargin below
    revealPending.slice().forEach(function (entry) {
      var r = entry.el.getBoundingClientRect();
      // Horizontal check as well as vertical: an element parked off-screen
      // inside a horizontal scroller still has an ordinary vertical rect,
      // and sweeping those in would spend their entrance before they are
      // ever scrolled to.
      if (r.right > 0 && r.left < window.innerWidth && r.top < limit) entry.show();
    });
  }
  function queueRevealSweep() {
    if (!revealPending.length) {
      window.removeEventListener("scroll", queueRevealSweep);
      return;
    }
    clearTimeout(revealSweepTimer);
    revealSweepTimer = setTimeout(revealSweep, 120);
  }
  function trackReveal(el, show) {
    var entry = {
      el: el,
      show: function () {
        var at = revealPending.indexOf(entry);
        if (at !== -1) revealPending.splice(at, 1);
        show();
      },
    };
    revealPending.push(entry);
    return entry;
  }
  window.addEventListener("scroll", queueRevealSweep, { passive: true });
  window.addEventListener("load", revealSweep);

  var revObs = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          var entry = e.target.__revealEntry;
          if (entry) entry.show();
          revObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" },
  );
  document
    .querySelectorAll('[data-reveal]:not([data-reveal="img"])')
    .forEach(function (el) {
      el.__revealEntry = trackReveal(el, function () {
        el.classList.add("is-revealed");
        revObs.unobserve(el);
      });
      revObs.observe(el);
    });

  document.querySelectorAll('[data-reveal="img"]').forEach(function (wrap) {
    var img = wrap.querySelector("img");
    var seen = false,
      loaded = !img || img.complete;
    function reveal() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          wrap.classList.add("is-revealed");
        });
      });
    }
    function tryReveal() {
      if (seen && loaded) reveal();
    }
    if (img && !loaded)
      img.addEventListener("load", function () {
        loaded = true;
        tryReveal();
      });
    // The sweep marks it SEEN rather than revealing it directly, so the
    // image-load gate and the double requestAnimationFrame (CLAUDE.md bug
    // #1 — without both, the transition can be skipped entirely) still
    // decide when it actually appears.
    var entry = trackReveal(wrap, function () {
      seen = true;
      tryReveal();
    });
    var imgObs = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            entry.show();
            imgObs.unobserve(wrap);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    imgObs.observe(wrap);
  });

  // ---------- Animated stat counters ----------
  var counted = false;
  var facts = document.getElementById("facts");
  if (facts) {
    var factObs = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || counted) return;
          counted = true;
          facts.querySelectorAll(".fact-number").forEach(function (el) {
            var target = parseInt(el.dataset.count, 10);
            var suffix = el.dataset.suffix || "";
            var plain = el.dataset.plain === "1";
            var from = plain ? Math.max(0, target - 140) : 0;
            var start = null,
              dur = 1500;
            function step(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / dur, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              el.textContent =
                Math.round(from + (target - from) * eased) + (p === 1 ? suffix : "");
              if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          });
        });
      },
      { threshold: 0.4 },
    );
    factObs.observe(facts);
  }

  // ---------- Tabs ----------
  // Single shared implementation of "a row of buttons with a sliding gold
  // pill behind the active one" — every .tab-bar on the page is
  // auto-wired below, and the function itself is also exposed
  // (window.BacchusTabs.initTabGroup) so a page-specific script can wire
  // up an *additional*, independently-scoped group for a control that
  // deliberately isn't given the .tab-bar class (see
  // reception-package.html's condensed tier switcher, which
  // avoids that class specifically so it doesn't join the real tab bar's
  // own active-button/panel state) without re-implementing the pill math
  // from scratch. This replaces the old version's single page-wide #pill
  // id + one flat array of every ".tab-bar button" on the page (which is
  // exactly why a second .tab-bar instance was unsafe before — it would
  // have cleared/moved that one shared pill for both groups at once): each
  // call is now fully self-contained, finding its own buttons and its own
  // .pill by class *within* the container passed in, so any number of
  // groups can coexist on one page without fighting over shared state.
  function initTabGroup(container, opts) {
    opts = opts || {};
    if (!container) return null;
    var groupTabs = [].slice.call(container.querySelectorAll("button"));
    var groupPill = container.querySelector(".pill");
    if (!groupTabs.length) return null;
    function movePill(btn) {
      if (!groupPill) return;
      groupPill.style.width = btn.offsetWidth + "px";
      groupPill.style.transform = "translateX(" + btn.offsetLeft + "px)";
    }
    // This group's own container, bound — see ensureTabVisibleIn below.
    function ensureTabVisible(btn) {
      ensureTabVisibleIn(container, btn);
    }
    // opts.panelSelector is optional — a group that only ever proxies its
    // clicks elsewhere (again, the sticky switcher) has no panels of its
    // own to show/hide, just its own active state + pill to animate.
    function selectTab(btn) {
      groupTabs.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      if (opts.panelSelector) {
        document.querySelectorAll(opts.panelSelector).forEach(function (p) {
          p.classList.remove("active");
        });
        var panel = document.querySelector(
          opts.panelSelector + '[data-panel="' + btn.dataset.tab + '"]',
        );
        if (panel) panel.classList.add("active");
      }
      // Read (geometry) before write (pill styles) — the reverse order
      // forces a synchronous reflow between the two for no benefit.
      ensureTabVisible(btn);
      movePill(btn);
    }
    groupTabs.forEach(function (b) {
      b.addEventListener("click", function () {
        selectTab(b);
      });
    });
    function syncPill() {
      var a = container.querySelector("button.active");
      if (!a) return;
      // Also on load/resize, not just on click: a row that fit a moment
      // ago may not after a resize, and a page deep-linked to a later tab
      // (reception-package.html#rose, say) lands with that tab already
      // active and potentially off-screen.
      ensureTabVisible(a);
      movePill(a);
    }
    window.addEventListener("load", syncPill);
    window.addEventListener("resize", syncPill);
    setTimeout(syncPill, 400);
    // Exposed so external code (a page-specific script driving a proxy
    // group, e.g.) can set this group's active tab + slide its pill
    // directly — bypassing its click listeners entirely, so that doesn't
    // loop back into whatever else a click on these buttons also triggers.
    return {
      selectTab: selectTab,
      syncPill: syncPill,
      ensureTabVisible: ensureTabVisible,
    };
  }
  // Scrolls a just-activated tab into view when its row overflows.
  //
  // REAL BUG this fixes (2026-10-01, caught on beverage-package.html,
  // whose four category labels are the longest set any .tab-bar on the
  // site carries): .tab-bar is overflow-x:auto with a hidden scrollbar
  // (styles.css), so a row that doesn't fit scrolls — but nothing ever
  // scrolled it. Activating a tab past the visible edge moved the pill
  // onto it and left both sitting outside the scroll viewport, so the
  // SELECTED tab showed as a clipped sliver ("Themed Bars" rendering as
  // a single "T" behind half a gold pill) with no scrollbar and no hint
  // anything was off-screen. CLAUDE.md bug #13's "hidden scrollbar, zero
  // affordance" failure mode, reached by a different route: not content
  // a visitor can't FIND, but the one they just picked.
  //
  // Two earlier attempts at this were reverted because they read the
  // symptom as a LAYOUT problem — first forcing the tab bar to keep its
  // full width inside its grid (which just moved the overflow up a level
  // and broke the page horizontally), then widening the stacking
  // breakpoint (which changed nothing, because the row fitting or not
  // was never the issue). Nothing is wrong with the layout: the row is
  // SUPPOSED to scroll at those widths. What was missing is anything
  // that scrolls it.
  //
  // Lives here, at the top of the shared tab module, because every
  // .tab-bar on the site goes through initTabGroup (homepage
  // Weddings/Corporate/Celebrations, menu.html, all four package pages'
  // tier/category switchers) and so every one of them had this same
  // latent bug — the package pages just carry the longest labels, which
  // is why beverage is where it actually surfaced. Also exported on
  // window.BacchusTabs so the one tab bar with its own separate
  // controller (reception-package.html's stations category tabs, whose
  // selection is driven by that section's carousel rather than by clicks)
  // calls this exact function instead of keeping a second copy.
  //
  // Padding-aware on purpose: getBoundingClientRect is the BORDER box,
  // which includes .tab-bar's own 5px padding, so scrolling until the
  // button's edge meets the container's edge overshoots by exactly that
  // padding and parks the tab flush against the border. The padding is
  // already there for every other button; this just has to respect it.
  // Manual scrollBy rather than scrollIntoView: that can scroll the PAGE
  // as well as this container, yanking the whole section around under
  // someone who was only switching tabs.
  function ensureTabVisibleIn(container, btn) {
    if (!container || !btn) return;
    var style = window.getComputedStyle(container);
    var padLeft = parseFloat(style.paddingLeft) || 0;
    var padRight = parseFloat(style.paddingRight) || 0;
    var barRect = container.getBoundingClientRect();
    var innerLeft = barRect.left + padLeft;
    var innerRight = barRect.right - padRight;
    var btnRect = btn.getBoundingClientRect();
    var behavior = reduce ? "auto" : "smooth";
    if (btnRect.left < innerLeft) {
      container.scrollBy({ left: btnRect.left - innerLeft, behavior: behavior });
    } else if (btnRect.right > innerRight) {
      container.scrollBy({ left: btnRect.right - innerRight, behavior: behavior });
    }
  }
  window.BacchusTabs = {
    initTabGroup: initTabGroup,
    ensureTabVisible: ensureTabVisibleIn,
  };
  [].slice.call(document.querySelectorAll(".tab-bar")).forEach(function (bar) {
    initTabGroup(bar, { panelSelector: ".tab-panel" });
  });

  // ---------- Carousel ----------
  var track = document.getElementById("carTrack"),
    view = document.getElementById("carView");
  if (track && view) {
    var slides = [].slice.call(track.children);
    var prev = document.getElementById("prev"),
      next = document.getElementById("next");
    var bar = document.getElementById("carBar"),
      now = document.getElementById("carNow"),
      total = document.getElementById("carTotal");
    var index = 0,
      drag = null,
      autoTimer = null;

    function cstep() {
      var r = slides[0].getBoundingClientRect();
      return r.width + parseFloat(getComputedStyle(track).gap || 0);
    }
    // How far the track can travel before its last slide sits flush with
    // the right edge of the view. Everything below is derived from this
    // one number, in real pixels — the version this replaces estimated it
    // by ROUNDING view.clientWidth / cstep() to a whole number of visible
    // slides, which is wrong at any width where a fractional number
    // actually show (~1.4 cards peeking in, say), and the error ran in
    // whichever direction the rounding happened to go.
    function maxOffset() {
      return Math.max(0, track.scrollWidth - view.clientWidth);
    }
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
    function maxIndex() {
      var step = cstep();
      return step > 0 ? Math.ceil(maxOffset() / step) : 0;
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
    function visibleSlideRange() {
      var windowStart = offsetFor(index);
      var windowEnd = windowStart + view.clientWidth;
      var base = slides[0].offsetLeft;
      var first = -1,
        last = -1;
      slides.forEach(function (slide, i) {
        var left = slide.offsetLeft - base;
        // 1px of tolerance: these are fractional at most viewport widths.
        if (left >= windowStart - 1 && left + slide.offsetWidth <= windowEnd + 1) {
          if (first === -1) first = i;
          last = i;
        }
      });
      // Nothing fits whole (a slide wider than its window). Fall back to the
      // scroll position itself rather than reporting an empty range.
      if (first === -1) return { first: index, last: index };
      return { first: first, last: last };
    }
    // The committed pixel offset for an index, clamped to the end of
    // travel. Shared by render() and the drag's own live transform so both
    // agree on where a given index actually sits — reading it only inside
    // render() would mean a drag starting on the final (short) step
    // computed its base from the unclamped index * cstep() and jumped
    // forward the moment it was grabbed.
    function offsetFor(i) {
      return Math.min(i * cstep(), maxOffset());
    }
    function render(animate) {
      track.style.transition = animate === false ? "none" : "";
      track.style.transform = "translate3d(" + -offsetFor(index) + "px,0,0)";
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex();
      var range = visibleSlideRange();
      if (now)
        now.textContent =
          range.first === range.last
            ? String(range.first + 1)
            : // En dash, not a hyphen: this is a range, and it matches the
              // site's typography elsewhere.
              range.first + 1 + "–" + (range.last + 1);
      // Written from here rather than left hardcoded in the markup, so the
      // two halves of the counter can never disagree.
      if (total) total.textContent = String(slides.length);
      // Fills by the LAST slide on screen, so it reads full exactly when
      // the final slide is visible — which is also when the counter reads
      // "… / total".
      if (bar) bar.style.transform = "scaleX(" + (range.last + 1) / slides.length + ")";
    }
    function go(i) {
      index = Math.max(0, Math.min(maxIndex(), i));
      render();
    }
    if (prev)
      prev.addEventListener("click", function () {
        go(index - 1);
        pauseAuto();
      });
    if (next)
      next.addEventListener("click", function () {
        go(index + 1);
        pauseAuto();
      });
    window.addEventListener("resize", function () {
      go(index);
    });
    window.addEventListener("load", function () {
      render(false);
    });

    function down(x) {
      drag = { x: x, start: index, moved: 0 };
      view.classList.add("drag");
      track.style.transition = "none";
      pauseAuto();
    }
    function move(x) {
      if (!drag) return;
      drag.moved = x - drag.x;
      track.style.transform =
        "translate3d(" + (-offsetFor(drag.start) + drag.moved) + "px,0,0)";
    }
    function up() {
      if (!drag) return;
      track.style.transition = "";
      var shift = Math.round(-drag.moved / cstep());
      go(
        drag.start +
          (Math.abs(drag.moved) > cstep() * 0.12
            ? shift === 0
              ? drag.moved < 0
                ? 1
                : -1
              : shift
            : 0),
      );
      drag = null;
      view.classList.remove("drag");
    }
    view.addEventListener("pointerdown", function (e) {
      down(e.clientX);
    });
    window.addEventListener(
      "pointermove",
      function (e) {
        if (drag) {
          e.preventDefault();
          move(e.clientX);
        }
      },
      { passive: false },
    );
    window.addEventListener("pointerup", up);
    view.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });
    view.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    });
    view.setAttribute("tabindex", "0");

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
      wheelLocked = false;
    var WHEEL_STEP_PX = 40; // accumulated deltaX that commits one slide
    var WHEEL_LOCK_MS = 350; // ignore further wheel input until this settles
    view.addEventListener(
      "wheel",
      function (e) {
        // A mouse's plain vertical wheel, or a trackpad swipe that's
        // mostly vertical, is an ordinary page-scroll — leave it alone
        // entirely (no preventDefault) so the page scrolls as expected.
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        // A clearly-horizontal swipe is ours from here, even before the
        // step threshold below is reached — also doubles as the fix for a
        // real browser quirk: an un-prevented strong horizontal trackpad
        // swipe can trigger the browser's own back/forward page
        // navigation gesture.
        e.preventDefault();
        if (wheelLocked) return;
        wheelDeltaX += e.deltaX;
        if (Math.abs(wheelDeltaX) < WHEEL_STEP_PX) return;
        go(index + (wheelDeltaX > 0 ? 1 : -1));
        pauseAuto();
        wheelDeltaX = 0;
        wheelLocked = true;
        setTimeout(function () {
          wheelLocked = false;
        }, WHEEL_LOCK_MS);
      },
      { passive: false },
    );

    function pauseAuto() {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    function startAuto() {
      if (reduce || autoTimer) return;
      autoTimer = setInterval(function () {
        go(index >= maxIndex() ? 0 : index + 1);
      }, 5200);
    }
    var carObs = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          e.isIntersecting ? startAuto() : pauseAuto();
        });
      },
      { threshold: 0.4 },
    );
    carObs.observe(view);
    view.addEventListener("mouseenter", pauseAuto);
  }

  // ---------- Testimonials rotator ----------
  // Content lives here (not in the page) so the same markup on index.html/weddings.html
  // shares one source.
  (function () {
    var section = document.getElementById("testimonials");
    var quoteBox = document.getElementById("tQuoteBox");
    var quoteEl = document.getElementById("tQuote");
    var metaEl = document.getElementById("tMeta");
    var cardsWrap = document.getElementById("tCards");
    var dotsWrap = document.getElementById("tDots");
    var prevBtn = document.getElementById("tPrev");
    var nextBtn = document.getElementById("tNext");
    var ringFill = document.getElementById("tRingFill");
    var starsWrap = document.getElementById("tStars");
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
      return;
    var stars = [].slice.call(starsWrap.children);
    // Keep in sync with the r="23" on #tRingFill/.testimonial-ring-track in the markup.
    var T_RING_CIRC = 2 * Math.PI * 23;
    ringFill.style.strokeDasharray = String(T_RING_CIRC);

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
    ];

    var tActive = 0,
      tFadeTimer = null,
      tRafId = null,
      tCycleStart = null,
      tProgress = 0;
    var T_FADE_MS = 220;
    var T_CYCLE_MS = 8000;

    items.forEach(function (item, i) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "testimonial-card";
      card.setAttribute("role", "tab");
      card.setAttribute("aria-label", "Read testimonial from " + item.name);
      card.innerHTML =
        '<span class="testimonial-card-name"></span><span class="testimonial-card-category"></span>';
      card.querySelector(".testimonial-card-name").textContent = item.name;
      card.querySelector(".testimonial-card-category").textContent = item.category;
      card.addEventListener("click", function () {
        tShow(i);
      });
      cardsWrap.appendChild(card);

      var dot = document.createElement("span");
      dot.className = "testimonial-dot";
      dotsWrap.appendChild(dot);
    });
    var cards = [].slice.call(cardsWrap.children);
    var dots = [].slice.call(dotsWrap.children);

    var T_MAX_LINES = 5;

    // Turns <em>...</em> markers in a quote string into real <em> elements
    // (plain text elsewhere) — safe here since `text` only ever comes from
    // our own hardcoded items array above, never remote/user content.
    function tBuildQuoteNodes(text) {
      var frag = document.createDocumentFragment();
      var re = /<em>(.*?)<\/em>/g;
      var lastIndex = 0,
        m;
      while ((m = re.exec(text))) {
        if (m.index > lastIndex)
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        var em = document.createElement("em");
        em.textContent = m[1];
        frag.appendChild(em);
        lastIndex = re.lastIndex;
      }
      if (lastIndex < text.length)
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      return frag;
    }

    // Builds the quote as DOM nodes (open-mark span, body, optional close-mark
    // span) rather than one textContent string, so the “ “ characters can be
    // styled (.testimonial-quote-mark) independently of the quote body. Truncated text
    // gets an ellipsis instead of the closing mark, so `closed` is omitted.
    function tSetQuoteContent(text, closed) {
      quoteEl.textContent = "";
      var open = document.createElement("span");
      open.className = "testimonial-quote-mark";
      open.textContent = "“";
      quoteEl.appendChild(open);
      quoteEl.appendChild(tBuildQuoteNodes(text));
      if (closed) {
        var close = document.createElement("span");
        close.className = "testimonial-quote-mark";
        close.textContent = "”";
        quoteEl.appendChild(close);
      }
    }

    function tRender(i) {
      var item = items[i];
      tSetQuoteContent(item.quote, true);
      var lineHeight = parseFloat(getComputedStyle(quoteEl).lineHeight);
      if (lineHeight) {
        var maxHeight = lineHeight * T_MAX_LINES + 1;
        // Word-split on the <em>-stripped text, not item.quote directly — an
        // </em> could otherwise land past the cut and leave an emphasis span
        // unclosed. The truncated result is always rendered as plain text
        // (tSetQuoteContent falls back to that automatically when there's no
        // <em> marker left to match), which is an acceptable simplification
        // since none of the current quotes actually reach the 5-line cap.
        var words = item.quote.replace(/<\/?em>/g, "").split(" ");
        while (words.length > 1 && quoteEl.scrollHeight > maxHeight) {
          words.pop();
          tSetQuoteContent(words.join(" ") + "…", false);
        }
      }
      metaEl.textContent = "";
      var nameEl = document.createElement("div");
      nameEl.className = "testimonial-meta-name";
      nameEl.textContent = item.name;
      metaEl.appendChild(nameEl);
      var sub = [item.category, item.location];
      if (item.date) sub.push(item.date);
      var subEl = document.createElement("div");
      subEl.className = "testimonial-meta-sub";
      subEl.textContent = sub.join(" · ");
      metaEl.appendChild(subEl);
      stars.forEach(function (s, si) {
        s.classList.toggle("is-empty", si >= item.rating);
      });
      cards.forEach(function (c, ci) {
        c.classList.toggle("is-active", ci === i);
        c.setAttribute("aria-selected", ci === i ? "true" : "false");
      });
      dots.forEach(function (d, di) {
        d.classList.toggle("is-active", di === i);
      });
    }

    function tResetTimer() {
      tProgress = 0;
      tCycleStart = null;
      ringFill.style.strokeDashoffset = String(T_RING_CIRC);
    }

    // Quote+meta text length varies per testimonial, which otherwise changes
    // .testimonial-quote-box's height on every swap and shifts everything below it
    // (cards, controls, footer) — reserve height for the tallest combination
    // up front instead. Re-measured on load/resize since the box's width and
    // the Fraunces web font (loaded with font-display: swap) both affect wrap.
    function tMeasureMinHeight() {
      quoteBox.style.minHeight = "0px";
      var max = 0;
      items.forEach(function (item, i) {
        tRender(i);
        max = Math.max(max, quoteBox.offsetHeight);
      });
      tRender(tActive);
      quoteBox.style.minHeight = max + "px";
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
      if (out) el.style.removeProperty("--d");
      el.style.opacity = out ? "0" : "";
      el.style.transform = out ? "translateY(6px)" : "";
    }

    function tShow(i) {
      tActive = (i + items.length) % items.length;
      tResetTimer();
      tSync();
      if (reduce) {
        tRender(tActive);
        return;
      }
      clearTimeout(tFadeTimer);
      tFade(quoteEl, true);
      tFade(metaEl, true);
      starsWrap.classList.remove("is-in-view");
      tFadeTimer = setTimeout(function () {
        tRender(tActive);
        // A second, short timeout — not nested requestAnimationFrame — gives the
        // browser a paint boundary between the content swap and the style
        // change. Doing both in the same tick lets it coalesce into one paint
        // with no in-between frame to animate the fade-back-in across (bug #7
        // in CLAUDE.md); this mirrors the wizard's showStep() sequencing. Same
        // reasoning applies to re-adding is-in here rather than alongside the
        // tRender() call above — it needs its own frame boundary to replay the
        // stars' staggered entrance instead of snapping straight to visible.
        tFadeTimer = setTimeout(function () {
          tFade(quoteEl, false);
          tFade(metaEl, false);
          starsWrap.classList.add("is-in-view");
        }, 30);
      }, T_FADE_MS);
    }

    // No explicit tPause() here — tShow() calls tSync() itself, which is the
    // single source of truth for whether the loop should be running.
    prevBtn.addEventListener("click", function () {
      tShow(tActive - 1);
    });
    nextBtn.addEventListener("click", function () {
      tShow(tActive + 1);
    });

    // requestAnimationFrame, not a fixed-interval tick: elapsed real time since
    // tCycleStart drives the percentage every frame (~60fps) so the ring's
    // conic-gradient edge sweeps continuously instead of jumping in visible
    // steps. tCycleStart is derived from the current tProgress on (re)start,
    // so pausing/resuming (hover, scrolling out of view, manual nav) picks up
    // from wherever the ring was rather than resetting or skipping ahead.
    function tTickFrame(now) {
      if (tCycleStart === null) tCycleStart = now - (tProgress / 100) * T_CYCLE_MS;
      tProgress = Math.min(100, ((now - tCycleStart) / T_CYCLE_MS) * 100);
      ringFill.style.strokeDashoffset = String(T_RING_CIRC * (1 - tProgress / 100));
      // tRafId must be nulled *before* tShow() — tShow() calls tSync(), whose
      // tStart() no-ops if tRafId is still truthy. A completed animation
      // frame's id is stale (it already fired), but nothing else clears it,
      // so leaving it set here would make the very next cycle's tStart() call
      // think a frame is already pending and refuse to schedule a new one —
      // exactly the "completes once, then never restarts" bug this replaces.
      if (tProgress >= 100) {
        tRafId = null;
        tShow(tActive + 1);
        return;
      }
      tRafId = requestAnimationFrame(tTickFrame);
    }
    function tPause() {
      if (tRafId) cancelAnimationFrame(tRafId);
      tRafId = null;
      tCycleStart = null;
    }
    function tStart() {
      if (reduce || tRafId) return;
      tRafId = requestAnimationFrame(tTickFrame);
    }
    // Single source of truth for whether the loop should be running, recomputed
    // on every relevant state change (visibility, hover, a new testimonial
    // shown) instead of scattering one-off tStart()/tPause() calls that each
    // only covered their own trigger and left the others with no way back in.
    var tHovering = false,
      tInView = false;
    function tSync() {
      if (!reduce && tInView && !tHovering) tStart();
      else tPause();
    }
    var tObs = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          tInView = e.isIntersecting;
          tSync();
        });
      },
      { threshold: 0.4 },
    );
    tObs.observe(section);
    // Mouse only. On touch, browsers fire a compatibility mouseenter after
    // a tap but no mouseleave until the visitor taps somewhere else, so
    // tapping the next arrow used to pause autoplay — the ring visibly
    // stopped — until the next tap elsewhere. pointerType filters that out;
    // a tap has no hover to pause for.
    nextBtn.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      tHovering = true;
      tSync();
    });
    nextBtn.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      tHovering = false;
      tSync();
    });

    tRender(0);
    starsWrap.classList.add("is-in-view");
    tMeasureMinHeight();
    window.addEventListener("load", tMeasureMinHeight);
    window.addEventListener("resize", tMeasureMinHeight);
  })();

  // ---------- Marquee loop ----------
  var mt = document.getElementById("mtrack");
  if (mt) mt.innerHTML = mt.innerHTML + mt.innerHTML;

  // ---------- Secure booking page: copy-to-clipboard + card placeholder ----------
  // Nav scroll state (.stuck) is handled by the shared #nav/onScroll logic above.
  (function () {
    // Copies text using the async Clipboard API where available; falls back
    // to the older execCommand method otherwise. The Clipboard API only
    // exists in secure contexts (HTTPS/localhost), so opening this file
    // directly or over plain HTTP — common when testing on a phone — left
    // navigator.clipboard undefined and the buttons silently did nothing.
    function copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try {
          ok = document.execCommand("copy");
        } catch (e) {
          ok = false;
        }
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject();
      });
    }

    // Lovable-port markup (two swapped SVG icons), used by secure-booking.html
    var sbCopyBtns = [].slice.call(
      document.querySelectorAll(".secure-booking-copy-button"),
    );
    sbCopyBtns.forEach(function (btn) {
      var copyIcon = btn.querySelector(".secure-booking-copy-icon");
      var checkIcon = btn.querySelector(".secure-booking-check-icon");
      var resetTimer = null;
      btn.addEventListener("click", function () {
        var val = btn.dataset.copy || "";
        copyToClipboard(val)
          .then(function () {
            clearTimeout(resetTimer);
            btn.classList.add("copied");
            if (copyIcon) copyIcon.style.display = "none";
            if (checkIcon) checkIcon.style.display = "";
            resetTimer = setTimeout(function () {
              btn.classList.remove("copied");
              if (copyIcon) copyIcon.style.display = "";
              if (checkIcon) checkIcon.style.display = "none";
            }, 1600);
          })
          .catch(function () {});
      });
    });

    var cardBtn = document.getElementById("payCardBtn");
    var cardNote = document.getElementById("cardNote");
    if (cardBtn && cardNote) {
      cardBtn.addEventListener("click", function () {
        cardNote.classList.add("show");
        setTimeout(function () {
          cardNote.classList.add("is-revealed");
        }, 20);
      });
    }

    // Payment-support FAQ uses the shared .faq/.faq-item accordion (see
    // "FAQ accordion" handler below), so no page-specific JS is needed here.

    // Floating "Need help paying?" button — scrolls to the support section.
    var floatHelp = document.getElementById("sbFloatHelp");
    var supportSection = document.getElementById("payment-support");
    if (floatHelp && supportSection) {
      floatHelp.addEventListener("click", function () {
        supportSection.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  })();

  // ---------- Enquiry form ----------
  // On pages with a calendar embedded in the "Preferred date" field (Weddings only —
  // dates are exclusive there), switch between it and a plain date input depending on
  // whether "Wedding" is the selected event type. Pages without this dual field
  // (dateNativeWrap/dateCalWrap absent) are untouched by any of this.
  var dateNativeWrap = document.getElementById("dateNativeWrap"),
    dateCalWrap = document.getElementById("dateCalWrap");
  var dateNative = document.getElementById("dateNative");
  // Backup date is a plain informational field (see CLAUDE.md) — Bacchus's own
  // reference in case the first choice is taken, not a second live availability
  // check, so it only makes sense next to the exclusive Wedding date picker.
  var backupDateField = document.getElementById("backupDateField");
  var backupDate = document.getElementById("backupDate");
  var enqToday = new Date();
  enqToday.setHours(0, 0, 0, 0);
  function isoOfDate(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
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
  );
  var maxBackupDate = new Date(
    enqToday.getFullYear(),
    enqToday.getMonth() + 24,
    enqToday.getDate(),
  );
  if (dateNative) {
    var minNonWedding = new Date(enqToday);
    minNonWedding.setDate(minNonWedding.getDate() + 14);
    dateNative.min = isoOfDate(minNonWedding);
  }
  if (backupDate) {
    backupDate.min = isoOfDate(minBookableDateForm);
    backupDate.max = isoOfDate(maxBackupDate);
  }
  // Native <input type="date"> has no ::placeholder — its empty "dd/mm/yyyy"
  // and its filled value share one `color`, so .has-value stands in for the
  // placeholder/filled split every other field gets for free (see styles.css).
  document.querySelectorAll('input[type="date"]').forEach(function (el) {
    el.classList.toggle("has-value", !!el.value);
    el.addEventListener("input", function () {
      el.classList.toggle("has-value", !!el.value);
    });
  });

  // Guest count: the hint below it switches copy depending on event type
  // (a wedding books the whole estate regardless of headcount, so the
  // per-space suggestions below don't apply to it), and the spaces/event-
  // style fields toggle opposite each other the same way the date field
  // does. Guarded throughout — pages without the new fields simply skip
  // this block's effects, since the elements it looks up won't exist.
  var guests = document.getElementById("guests");
  var guestHint = document.getElementById("guestHint");
  var spacesField = document.getElementById("spacesField");
  var eventStyleField = document.getElementById("eventStyleField");
  function hintFor(v) {
    if (!guestHint) return;
    var et = document.getElementById("eventtype");
    var isWedding = !et || et.value === "Wedding";
    if (isWedding) {
      guestHint.innerHTML =
        "A flexible estimate is perfect — final numbers come much later.";
      return;
    }
    // Space names/capacities here are the same unconfirmed placeholders used
    // elsewhere on the prototype (see the capacity disclaimer under the
    // "spaces" field) — not a claim about real venue layout.
    if (!v || isNaN(v)) {
      guestHint.innerHTML = "Most events here sit between 40 and 180 guests.";
      return;
    }
    if (v <= 40)
      guestHint.innerHTML =
        "<b>The Secret Garden</b> suits a party this size beautifully.";
    else if (v <= 70)
      guestHint.innerHTML =
        "<b>The Secret Garden</b> or <b>the Terrace</b> would both work.";
    else if (v <= 180)
      guestHint.innerHTML =
        "<b>Prince De Redin Hall</b> seats this comfortably, terrace for drinks.";
    else
      guestHint.innerHTML =
        "Above 180 we'd plan a larger-format reception across the estate — do mention it below and we'll talk through the options.";
  }
  function syncSpacesField() {
    if (!spacesField || !eventStyleField) return;
    var et = document.getElementById("eventtype");
    var isWedding = !et || et.value === "Wedding";
    spacesField.style.display = isWedding ? "none" : "";
    eventStyleField.style.display = isWedding ? "" : "none";
    hintFor(guests ? parseInt(guests.value, 10) : NaN);
  }

  var lastDateMode = null;
  function syncDateMode() {
    if (!dateNativeWrap || !dateCalWrap) return;
    var et = document.getElementById("eventtype");
    var isWedding = !et || et.value === "Wedding";
    var isActualTransition = lastDateMode !== null && lastDateMode !== isWedding;
    if (isActualTransition) {
      if (isWedding) {
        // Coming back to Wedding: restore whatever date was already picked on the
        // calendar before switching away — its selection is never cleared below,
        // so this just re-syncs #date to match it instead of leaving it empty.
        if (availRestoreField) availRestoreField();
      } else {
        // Leaving Wedding: clear #date itself, so a wedding date can't silently
        // ride along into a Corporate/Celebration submission — but deliberately
        // leave the calendar widget's own picked state alone (no availReset()
        // here) so it's still there if the visitor switches back to Wedding.
        var dateField = document.getElementById("date");
        if (dateField) {
          dateField.value = "";
          dateField.dataset.iso = "";
          dateField.closest(".field").classList.remove("bad");
        }
        if (dateNative) dateNative.value = "";
        if (backupDate) backupDate.value = "";
      }
    }
    lastDateMode = isWedding;
    dateNativeWrap.style.display = isWedding ? "none" : "";
    if (backupDateField) backupDateField.style.display = isWedding ? "" : "none";
    if (isWedding) {
      if (isActualTransition) {
        // Fade + lift in when switching to Wedding from another event type
        // (opacity+lift, not clip-path — see CLAUDE.md's known-bugs list).
        // .is-revealed is added on a double-rAF, one real painted frame after display
        // switches from none, since toggling display and opacity/transform
        // in the same tick can get coalesced into a single paint with no
        // in-between frame to animate from (see bug #1 in CLAUDE.md).
        dateCalWrap.style.display = "";
        dateCalWrap.classList.remove("is-revealed");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            dateCalWrap.classList.add("is-revealed");
          });
        });
      } else {
        // Initial page load, already the default — shown as-is, no fade.
        dateCalWrap.style.display = "";
        dateCalWrap.classList.add("is-revealed");
      }
    } else {
      dateCalWrap.style.display = "none";
      dateCalWrap.classList.remove("is-revealed");
    }
    syncSpacesField();
  }
  syncDateMode();
  if (dateNative) {
    dateNative.addEventListener("change", function () {
      var dateField = document.getElementById("date");
      if (dateField) {
        dateField.value = dateNative.value;
        dateField.dataset.iso = dateNative.value;
        dateField.closest(".field").classList.remove("bad");
      }
    });
  }

  // Helper line under the event-type chips: swaps copy per chip (Other's job
  // is reassurance — the chip is an intentional catch-all for enquiries that
  // don't fit the other three, so it needs to say we'll still follow up, not
  // just restate the notice-period fact — Corporate/Celebration's is that
  // notice period, and Wedding's points at the calendar right below it).
  // Replaces the old dateNativeNote paragraph under the date field, which
  // said the same notice-period thing further down the form for the same
  // three chips — kept in one place instead of two.
  var chipNote = document.getElementById("chipNote");
  // Kept close in length to each other on purpose (79-88 characters) — these
  // swap in place when switching chips, and very different lengths used to
  // wrap to different line counts at this form's width, causing real
  // cumulative layout shift every time someone tried a different chip.
  var CHIP_NOTES = {
    Wedding:
      "We host just one wedding a day, so your date is entirely yours — take a look below.",
    Corporate:
      "Two weeks' notice gives us time to prepare everything properly for your corporate event.",
    Celebration:
      "Two weeks' notice gives us time to make sure your celebration feels just right on the day.",
    Other:
      "Whatever you have in mind, we'd love to hear about it and follow up with you directly.",
  };
  var CHIP_NOTE_FADE_MS = 200;
  function syncChipNote(isInitial) {
    if (!chipNote) return;
    var et = document.getElementById("eventtype");
    var text = CHIP_NOTES[(et && et.value) || "Wedding"] || "";
    if (isInitial) {
      chipNote.textContent = text;
      return;
    }
    // Same fixed-clock fade-out/swap/fade-in as the availability widget's
    // picked-date swap above (see CLAUDE.md bug #7) — a synchronous class+text
    // swap in one tick can get coalesced into a single paint with nothing to
    // transition from.
    chipNote.classList.add("swapping");
    window.setTimeout(function () {
      chipNote.textContent = text;
      window.setTimeout(function () {
        chipNote.classList.remove("swapping");
      }, 20);
    }, CHIP_NOTE_FADE_MS);
  }
  syncChipNote(true);

  var chipsEl = document.getElementById("chips");
  if (chipsEl) {
    chipsEl.addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (!c) return;
      chipsEl.querySelectorAll(".chip").forEach(function (x) {
        x.classList.remove("is-selected");
      });
      c.classList.add("is-selected");
      var et = document.getElementById("eventtype");
      if (et) et.value = c.dataset.v;
      syncDateMode();
      syncChipNote();
    });
  }
  var preferEl = document.getElementById("prefer");
  if (preferEl) {
    preferEl.addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (!c) return;
      preferEl.querySelectorAll(".chip").forEach(function (x) {
        x.classList.remove("is-selected");
      });
      c.classList.add("is-selected");
      var pv = document.getElementById("preferVal");
      if (pv) pv.value = c.dataset.v;
    });
  }

  // ---------- Guest stepper ----------
  if (guests) {
    document.querySelectorAll("[data-step-by]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = parseInt(guests.value || "70", 10);
        v = Math.min(500, Math.max(1, v + parseInt(b.dataset.stepBy, 10)));
        guests.value = v;
        hintFor(v);
        // So the input picks up its :focus-within styling from a +/- click
        // too, not just from clicking directly into it.
        guests.focus();
      });
    });
    guests.addEventListener("input", function () {
      hintFor(parseInt(guests.value, 10));
    });
  }

  // ---------- Multi-select spaces (non-Wedding only) ----------
  var spacesWrap = document.getElementById("spaces");
  if (spacesWrap) {
    spacesWrap.addEventListener("click", function (e) {
      var opt = e.target.closest(".option-card");
      if (!opt) return;
      if (opt.dataset.v === "Not sure yet") {
        var was = opt.classList.contains("is-selected");
        spacesWrap.querySelectorAll(".option-card").forEach(function (o) {
          o.classList.remove("is-selected");
        });
        if (!was) opt.classList.add("is-selected");
      } else {
        var notSure = spacesWrap.querySelector('[data-v="Not sure yet"]');
        if (notSure) notSure.classList.remove("is-selected");
        opt.classList.toggle("is-selected");
      }
    });
  }
  function chosenSpaces() {
    if (!spacesWrap) return [];
    return [].slice
      .call(spacesWrap.querySelectorAll(".option-card.is-selected"))
      .map(function (o) {
        return o.dataset.v;
      });
  }

  // ---------- Event style (Wedding only, single-select) ----------
  var eventStyleWrap = document.getElementById("eventStyle");
  if (eventStyleWrap) {
    eventStyleWrap.addEventListener("click", function (e) {
      var opt = e.target.closest(".option-card");
      if (!opt) return;
      var was = opt.classList.contains("is-selected");
      eventStyleWrap.querySelectorAll(".option-card").forEach(function (o) {
        o.classList.remove("is-selected");
      });
      // Re-clicking the already-selected card deselects it, same convention
      // as the "Not sure yet" toggle above.
      if (!was) opt.classList.add("is-selected");
      var styleVal = document.getElementById("eventStyleVal");
      if (styleVal) styleVal.value = was ? "" : opt.dataset.v;
    });
  }

  // ---------- "Anything else" character count ----------
  (function () {
    var msg = document.getElementById("msg");
    var ring = document.getElementById("msgCharRing");
    var num = document.getElementById("msgCharNum");
    if (!msg || !ring || !num) return;
    var LIMIT = 500;
    var CIRCUMFERENCE = 87.96; // 2 * PI * r(14), matches the ring's SVG circle radius
    function update() {
      var used = msg.value.length;
      var remaining = LIMIT - used;
      num.textContent = remaining;
      var fill = ring.querySelector(".character-ring-fill");
      fill.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(used / LIMIT, 1));
      // Green (default, no class) -> amber -> red as room runs out.
      ring.classList.toggle("near-limit", remaining <= 50);
      ring.classList.toggle("amber", remaining > 50 && remaining <= 200);
    }
    msg.addEventListener("input", update);
    update();
  })();

  var form = document.getElementById("form");
  if (form) {
    function bad(el, cond) {
      el.closest(".field").classList.toggle("bad", !cond);
      return cond;
    }
    var defaultEventType =
      (document.getElementById("eventtype") || {}).value || "Wedding";

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
    ];
    var DAYS_FORM = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    function fmtDate(d) {
      return (
        DAYS_FORM[d.getDay()] +
        " " +
        d.getDate() +
        " " +
        MONTHS_FORM[d.getMonth()] +
        " " +
        d.getFullYear()
      );
    }
    // #date's value is human-formatted when it came from the Wedding
    // calendar (see writeFieldFromSelected() below) but raw ISO when it
    // came from the plain native field (see dateNative's change handler
    // above) — dataset.iso is reliably ISO either way, so reformat from
    // that rather than guessing which shape #date.value is in.
    function niceDate() {
      var dt = document.getElementById("date");
      if (!dt) return null;
      var iso = dt.dataset.iso;
      if (!iso) return dt.value ? dt.value : null;
      var d = new Date(iso + "T00:00:00");
      return isNaN(d) ? dt.value : fmtDate(d);
    }
    function val(id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var v = el.value;
      return v && v.trim() ? v.trim() : null;
    }
    function fullName() {
      var firstNameEl = document.getElementById("firstName"),
        lastNameEl = document.getElementById("lastName");
      if (firstNameEl || lastNameEl)
        return [val("firstName"), val("lastName")].filter(Boolean).join(" ") || null;
      return val("name");
    }

    // ---------- Wizard step controller ----------
    // Steps are optional: pages without .wizard-step wrappers just skip straight to
    // the plain submit-validation path below (steps.length === 0).
    var steps = [].slice.call(form.querySelectorAll(".wizard-step"));
    var stepTabs = [].slice.call(form.querySelectorAll(".wizard-step-tab"));
    var lineSegs = [].slice.call(
      form.querySelectorAll(".wizard-progress-line .wizard-progress-segment"),
    );
    var backBtn = form.querySelector(".wizard-back-link");
    var nextBtn = form.querySelector(".wizard-next-button");
    var submitBtn = form.querySelector(".wizard-submit-button");
    var totalSteps = steps.length;
    var currentStep = 1;
    var maxStepReached = 1;
    var stepTitleEl = document.getElementById("stepTitle");
    var stickyTextEl = document.getElementById("stickyText");
    var reviewEl = document.getElementById("review");
    var TITLES = [
      "The <em>occasion</em>",
      "The <em>specifics</em>",
      "Your <em>details</em>",
      "Review &amp; <em>send</em>",
    ];

    function stepChecks(stepNum) {
      var checks = [];
      if (stepNum === 1) {
        var dt = document.getElementById("date");
        if (dt) checks.push([dt, !!dt.value]);
        // Optional field — only validated once something's actually entered.
        if (backupDate && backupDate.value) {
          var bd = new Date(backupDate.value + "T00:00:00");
          if (isNaN(bd) || bd < enqToday || bd > maxBackupDate) {
            var bdErr = document.getElementById("backupDateErr");
            if (bdErr)
              bdErr.textContent =
                "Enter a date between today and " + fmtDate(maxBackupDate) + ".";
            checks.push([backupDate, false]);
          }
        }
      } else if (stepNum === 2) {
        var g = document.getElementById("guests");
        if (g) {
          var gv = Number(g.value);
          var gErr = document.getElementById("guestsErr");
          if (!gv || gv < 1) {
            if (gErr) gErr.textContent = "Enter an expected guest count.";
            checks.push([g, false]);
          } else if (gv > 500) {
            if (gErr)
              gErr.textContent =
                "That's a large gathering — let's talk directly rather than guess a number here.";
            checks.push([g, false]);
          } else {
            checks.push([g, true]);
          }
        }
      } else if (stepNum === 3) {
        var firstNameEl = document.getElementById("firstName"),
          lastNameEl = document.getElementById("lastName");
        if (firstNameEl) checks.push([firstNameEl, firstNameEl.value.trim().length > 0]);
        if (lastNameEl) checks.push([lastNameEl, lastNameEl.value.trim().length > 0]);
        var n = document.getElementById("name");
        if (n) checks.push([n, n.value.trim().length > 1]);
        var em = document.getElementById("email"),
          ph = document.getElementById("phone");
        if (em) checks.push([em, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())]);
        if (ph) checks.push([ph, ph.value.trim().length > 5]);
      }
      return checks;
    }

    function validateStep(stepNum) {
      var ok = true,
        firstBad = null;
      stepChecks(stepNum).forEach(function (pair) {
        var passed = bad(pair[0], pair[1]);
        if (!passed && !firstBad) firstBad = pair[0];
        ok = ok && passed;
      });
      if (firstBad) firstBad.focus();
      return ok;
    }

    // ---------- Review (only on pages with a review/#review step) ----------
    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }
    function rows(list) {
      return list
        .map(function (r) {
          // Free text (Notes) gets the full card width instead of sharing the
          // fixed label column with short single-line answers.
          var full = r[0] === "Notes" ? " review-row-full" : "";
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
          );
        })
        .join("");
    }
    function buildReview() {
      var backup = val("backupDate");
      if (backup) {
        var bd = new Date(backup + "T00:00:00");
        if (!isNaN(bd)) backup = fmtDate(bd);
      }
      var sp = chosenSpaces();
      // A wedding books the whole estate regardless of guest count, so
      // there's no spaces answer to show, not even a blank "Not given" row.
      var isWedding = val("eventtype") === "Wedding";
      var specificsRows = [
        ["Guests", val("guests") ? val("guests") + " expected" : null],
      ];
      if (isWedding) specificsRows.push(["Style", val("eventStyleVal")]);
      if (!isWedding) specificsRows.push(["Spaces", sp.length ? sp.join(", ") : null]);
      specificsRows.push(["Notes", val("msg")]);
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
      ];
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
          );
        })
        .join("");
    }
    if (reviewEl) {
      reviewEl.addEventListener("click", function (e) {
        var b = e.target.closest("[data-edit]");
        if (b) showStep(parseInt(b.dataset.edit, 10));
      });
    }

    var STEP_FADE_MS = 180;
    var stepFadeTimer = null;

    function showStep(n) {
      currentStep = n;
      if (n > maxStepReached) maxStepReached = n;
      if (n === totalSteps && reviewEl) buildReview();
      stepTabs.forEach(function (t) {
        var tn = Number(t.dataset.goto);
        t.classList.toggle("active", tn === n);
        t.classList.toggle("done", tn < n);
        t.disabled = tn > maxStepReached;
      });
      lineSegs.forEach(function (seg, i) {
        seg.classList.toggle("done", n > i + 1);
      });
      // A class, not inline style.visibility directly — lets CSS handle it
      // (see .wizard-back-hidden in styles.css).
      if (backBtn) backBtn.classList.toggle("wizard-back-hidden", n === 1);
      var onLastStep = n === totalSteps;
      if (nextBtn) nextBtn.style.display = onLastStep ? "none" : "";
      if (submitBtn) {
        submitBtn.style.display = onLastStep ? "" : "none";
        submitBtn.disabled = !onLastStep;
      }
      if (stepTitleEl && TITLES[n - 1]) stepTitleEl.innerHTML = TITLES[n - 1];
      if (stickyTextEl) {
        stickyTextEl.textContent = onLastStep
          ? "Private & without obligation · reply within two working days"
          : "Private & without obligation · nothing is sent until you review it";
      }

      function afterSwap() {
        var card = form.getBoundingClientRect();
        if (card.top < 0)
          window.scrollTo({
            top: window.scrollY + card.top - 90,
            behavior: reduce ? "auto" : "smooth",
          });
      }

      var current = steps.filter(function (s) {
        return s.classList.contains("active");
      })[0];
      var target = steps.filter(function (s) {
        return Number(s.dataset.step) === n;
      })[0];
      if (!target || target === current) return;

      clearTimeout(stepFadeTimer);
      if (!current || reduce) {
        steps.forEach(function (s) {
          s.classList.toggle("active", s === target);
        });
        afterSwap();
        return;
      }
      current.classList.add("leaving");
      stepFadeTimer = setTimeout(function () {
        current.classList.remove("active", "leaving");
        target.classList.add("active", "entering");
        stepFadeTimer = setTimeout(function () {
          target.classList.remove("entering");
        }, 30);
        afterSwap();
      }, STEP_FADE_MS);
    }

    function goToNextStep() {
      if (!validateStep(currentStep)) return;
      showStep(Math.min(totalSteps, currentStep + 1));
    }

    if (totalSteps) {
      if (nextBtn) nextBtn.addEventListener("click", goToNextStep);
      if (backBtn)
        backBtn.addEventListener("click", function () {
          showStep(Math.max(1, currentStep - 1));
        });
      stepTabs.forEach(function (t) {
        t.addEventListener("click", function () {
          var tn = Number(t.dataset.goto);
          if (tn <= maxStepReached) showStep(tn);
        });
      });
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
        if (e.key !== "Enter" || currentStep >= totalSteps) return;
        if (!e.target || e.target.tagName !== "INPUT") return;
        e.preventDefault();
        goToNextStep();
      });
      showStep(1);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // Review/consent step — pages without it (not yet migrated) have no
      // #consent element, so this gate is a no-op for them.
      var consent = document.getElementById("consent");
      var consentWrap = document.getElementById("consentWrap");
      if (consent && consentWrap && !consent.checked) {
        consentWrap.classList.remove("bad");
        void consentWrap.offsetWidth;
        consentWrap.classList.add("bad");
        return;
      }
      var allOk = true;
      for (var s = 1; s <= (totalSteps || 1); s++) {
        if (!validateStep(s)) allOk = false;
      }
      if (!allOk) {
        var badField = form.querySelector(".field.bad input, .field.bad textarea");
        if (badField) {
          var stepEl = badField.closest(".wizard-step");
          if (stepEl && totalSteps) showStep(Number(stepEl.dataset.step));
          badField.focus();
        }
        return;
      }
      var dt = document.getElementById("date"),
        et = document.getElementById("eventtype");
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
      });

      var sentEl = document.getElementById("sent");
      if (sentEl) {
        // New review/success flow (see enquiry section markup) — send is
        // deliberately delayed to read as real work happening, matching the
        // sitewide "Sending…" convention.
        if (submitBtn) {
          submitBtn.disabled = true;
          var submitLabel = submitBtn.querySelector("span");
          if (submitLabel) submitLabel.textContent = "Sending…";
        }
        setTimeout(function () {
          var sentLine = document.getElementById("sentLine");
          if (sentLine) {
            sentLine.textContent =
              "Thank you, " +
              (val("firstName") || "") +
              " — your enquiry for " +
              (niceDate() || "your date") +
              " is with our events team.";
          }
          var sentCopyLine = document.getElementById("sentCopyLine");
          if (sentCopyLine)
            sentCopyLine.textContent =
              "A copy is on its way to " + (val("email") || "your inbox") + ".";
          form.style.display = "none";
          sentEl.classList.add("show");
          // Not scrollIntoView({block:"center"}) — on mobile the success
          // panel is taller than the viewport, so centering it pushes the
          // seal/heading above the visible area. Manual offset instead,
          // landing the panel's own top just below the fixed nav (90px,
          // same offset used for the step-change scroll above).
          var sentTop = sentEl.getBoundingClientRect().top;
          window.scrollTo({
            top: window.scrollY + sentTop - 90,
            behavior: reduce ? "auto" : "smooth",
          });
        }, 900);
        return;
      }

      // Old inline-message pages (not yet migrated to the review/sent flow).
      var okMsg = document.getElementById("ok");
      if (okMsg) {
        // display defaults to none (see styles.css) so the invisible thank-you
        // text doesn't sit in the wiz-nav flex row inflating every step's height
        // before a real submit ever happens. Switching display and opacity in
        // the same tick would skip the fade (no frame boundary to animate
        // across — see bug #1 in CLAUDE.md), so the display change is given a
        // frame to paint before .show (opacity/transform) is added.
        okMsg.style.display = "block";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            okMsg.classList.add("show");
          });
        });
      }
      form.reset();
      // form.reset() does not clear type="hidden" inputs in practice (verified —
      // it resets visible text/number/etc. controls but leaves hidden ones alone),
      // so #date needs an explicit clear. availReset() also clears the calendar
      // widget's own internal "selected" state and un-highlights its picked cell,
      // which form.reset() has no way to touch since that's plain DOM, not a
      // form control.
      if (dt) {
        dt.value = "";
        dt.dataset.iso = "";
      }
      if (availReset) availReset();
      if (et) et.value = defaultEventType;
      document.querySelectorAll("#chips .chip").forEach(function (c) {
        c.classList.toggle("is-selected", c.dataset.v === defaultEventType);
      });
      syncChipNote(true);
      if (totalSteps) showStep(1);
    });
    form.querySelectorAll("input").forEach(function (i) {
      i.addEventListener("input", function () {
        i.closest(".field").classList.remove("bad");
      });
    });
  }

  // ---------- FAQ accordion ----------
  // Height animation itself is pure CSS now (.faq-a's grid-template-rows
  // 0fr/1fr, see styles.css) — no .scrollHeight read/write here anymore.
  // What's left is real logic CSS can't express on its own: cross-item
  // exclusivity (closing every other open item in the same .faq group).
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q"),
      a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      item
        .closest(".faq")
        .querySelectorAll(".faq-item.open")
        .forEach(function (o) {
          if (o !== item) o.classList.remove("open");
        });
      item.classList.toggle("open", !open);
    });
  });

  // ---------- View Gallery: filter + lightbox ----------
  (function () {
    var grid = document.getElementById("ggrid");
    if (!grid) return;
    var items = [].slice.call(grid.querySelectorAll(".gallery-item"));
    // Filtering itself is pure CSS now — #gfilter's radios + :has() on
    // #ggrid (see styles.css) — no click handler needed here anymore.

    // Reading the incoming ?filter= and pre-checking its radio used to live
    // here, and moved into a parser-blocking inline <script> in gallery.html
    // itself (immediately after #gfilter, before #ggrid). This file is a
    // <script src> at the foot of <body>, so doing it here always ran one
    // paint too late: arriving from a mini-gallery's "View the full gallery"
    // link flashed the entire unfiltered grid under "All" before snapping to
    // the requested category. Don't move it back. See that script's own
    // comment for the full reasoning.
    //
    // Keep the URL's ?filter= in sync as the visitor clicks between
    // categories, so the current view is shareable/bookmarkable/
    // refreshable. replaceState, not pushState — a new history entry per
    // click would turn the back button into "step backward through every
    // filter tried" instead of leaving the gallery page. Only gallery.html
    // has #gfilter, so this no-ops on the mini-gallery pages that share
    // #ggrid/#lightbox with this same IIFE.
    var gfilter = document.getElementById("gfilter");
    if (gfilter) {
      gfilter.addEventListener("change", function (e) {
        var id = e.target && e.target.id;
        if (!id || id.indexOf("gf-") !== 0) return;
        var val = id.slice(3);
        var url = new URL(location.href);
        if (val === "all") {
          url.searchParams.delete("filter");
        } else {
          url.searchParams.set("filter", val);
        }
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      });
    }

    var lb = document.getElementById("lightbox");
    if (!lb) return;
    var lbImg = lb.querySelector("img"),
      lbCapB = lb.querySelector("figcaption b"),
      lbCapI = lb.querySelector("figcaption i");
    var lbCount = lb.querySelector(".lightbox-count");
    var lbClose = lb.querySelector(".lightbox-close"),
      lbPrev = lb.querySelector(".lightbox-prev"),
      lbNext = lb.querySelector(".lightbox-next");
    var current = -1;
    var LB_FADE_MS = 180;
    // Was "!it.classList.contains('hide')" — that class was JS's own doing
    // and stopped existing the moment filtering moved to pure CSS (:has(),
    // see styles.css). getComputedStyle reflects whatever's actually hiding
    // an item regardless of mechanism, so this still correctly tracks only
    // the currently-filtered-in items for lightbox prev/next and the
    // "open at this item" index.
    function visible() {
      return items.filter(function (it) {
        return getComputedStyle(it).display !== "none";
      });
    }
    function openAt(it) {
      var vis = visible();
      current = vis.indexOf(it);
      show();
    }
    // Applies whatever `current` already points at — callers adjust
    // current first (wrapping handled here), then call this or show().
    function applyImage() {
      var vis = visible();
      if (!vis.length) return;
      if (current < 0) current = vis.length - 1;
      if (current >= vis.length) current = 0;
      var it = vis[current];
      var img = it.querySelector("img");
      lbImg.src = img.src;
      lbImg.alt = img.alt || "";
      lbCapB.textContent = it.dataset.title || "";
      lbCapI.textContent = it.dataset.tag || "";
      if (lbCount) lbCount.textContent = current + 1 + " / " + vis.length;
    }
    function show() {
      applyImage();
      lb.classList.add("show");
      document.body.style.overflow = "hidden";
    }
    // Crossfades to the next/prev image once already open — a fixed
    // setTimeout clock rather than requestAnimationFrame, same reasoning
    // as the wizard step fade (CLAUDE.md bug #7): adding a class and
    // swapping the img's src in the same tick can get coalesced into one
    // paint with no frame to animate from.
    function navigate(step) {
      var next = current + step;
      if (next < 0 || next >= visible().length) return; // at an edge — no wraparound
      current = next;
      if (!lb.classList.contains("show")) {
        show();
        return;
      }
      lbImg.classList.add("lightbox-fade");
      setTimeout(function () {
        applyImage();
        setTimeout(function () {
          lbImg.classList.remove("lightbox-fade");
        }, 20);
      }, LB_FADE_MS);
    }
    function closeLb() {
      lb.classList.remove("show");
      document.body.style.overflow = "";
    }
    items.forEach(function (it) {
      it.addEventListener("click", function () {
        openAt(it);
      });
    });
    if (lbClose) lbClose.addEventListener("click", closeLb);
    if (lbPrev)
      lbPrev.addEventListener("click", function () {
        navigate(-1);
      });
    if (lbNext)
      lbNext.addEventListener("click", function () {
        navigate(1);
      });
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("show")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    });

    // Swipe left/right to navigate on touch (also works with mouse-drag,
    // via pointer events same as the homepage carousel). A decisive swipe
    // snaps straight to prev/next, same as tapping the arrow buttons —
    // no live drag-follow, since the lightbox shows one image at a time
    // rather than a sliding track.
    var lbFig = lb.querySelector("figure");
    var swipe = null;
    if (lbFig) {
      lbFig.addEventListener("pointerdown", function (e) {
        swipe = { x: e.clientX, y: e.clientY };
      });
      lbFig.addEventListener("pointerup", function (e) {
        if (!swipe) return;
        var dx = e.clientX - swipe.x,
          dy = e.clientY - swipe.y;
        swipe = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
      });
      lbFig.addEventListener("pointercancel", function () {
        swipe = null;
      });
    }
  })();

  // ---------- Mock wedding-date availability widget (illustrative concept — not live data) ----------
  // A page can have more than one instance (e.g. a showcase calendar plus a compact one
  // embedded in the enquiry form). Browsing months is independent per instance, but picking
  // a date is shared: every instance re-syncs to show the same selected date, and all of
  // them write to the same #date field.
  (function () {
    // :not(.sent) excludes the wizard's own success panel (.availability.sent),
    // which reuses the .availability class purely for its card styling (rounded
    // corner/shadow), not because it's an actual calendar instance —
    // without this, this widget tried to treat it as one, found no
    // .availability-month/.availability-grid inside it, and threw on the first render() call,
    // silently killing every line of code after it in this block
    // (including the "Pick a date" modal wiring below) since nothing here
    // is wrapped in try/catch.
    var availEls = document.querySelectorAll(".availability:not(.sent)");
    if (!availEls.length) return;
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
    ];
    var today = new Date();
    var minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var maxMonth = new Date(today.getFullYear(), today.getMonth() + 24, 1); // ~2yr wedding-booking horizon
    // Minimum lead time before a wedding date can be booked at all — a
    // single-wedding-a-day exclusive venue can't turn around catering,
    // staffing and supplier coordination overnight. 3 months is a
    // reasonable placeholder, not a confirmed Bacchus policy — same
    // "illustrative only" status as the rest of this mock data, flag for
    // the client before treating it as real (see CLAUDE.md).
    var WEDDING_MIN_NOTICE_MONTHS = 3;
    var minBookableDate = new Date(
      today.getFullYear(),
      today.getMonth() + WEDDING_MIN_NOTICE_MONTHS,
      today.getDate(),
    );
    var selected = null; // { iso, status, dd, yy, mm }
    var instances = [];
    // Set only while the quick-pick modal is open and its pick hasn't been
    // confirmed yet: undefined = "mirrors the committed `selected`" (nothing
    // touched this time), null = "staged to clear", an object = "staged to
    // this date". Keeps a date picked inside the modal from updating the
    // background page (the form's summary, the "Pick a date"/"Change date"
    // button label) until the client actually clicks "Use this date".
    var modalPending;

    function seededStatus(y, m, d) {
      var seed = (y * 421 + (m + 1) * 37 + d * 13) % 10;
      if (seed <= 5) return "open";
      if (seed <= 7) return "interest";
      return "taken";
    }
    function isoOf(y, m, d) {
      return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    }
    function sameMonth(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    }

    var FADE_MS = 200;

    function applyPickedContent(el) {
      el.classList.remove("status-open", "status-interest");
      el.classList.add("show", "status-" + selected.status);
      var dateEl = el.querySelector(".availability-picked-date"),
        statusEl = el.querySelector(".availability-picked-status");
      if (dateEl)
        dateEl.textContent = selected.dd + " " + names[selected.mm] + " " + selected.yy;
      if (statusEl)
        statusEl.textContent =
          selected.status === "open" ? "Available" : "Enquiries received";
    }

    function writeFieldFromSelected() {
      var dateField = document.getElementById("date");
      if (!dateField || !selected) return;
      dateField.value = selected.dd + " " + names[selected.mm] + " " + selected.yy;
      dateField.dataset.iso = selected.iso;
      var f = dateField.closest(".field");
      if (f) f.classList.remove("bad");
    }

    function updatePickedPanels() {
      // weddings.html's wizard step 1 has a "go to calendar" button whose label
      // reflects whether a date is already picked — kept in sync here alongside
      // the panels themselves, since both are driven by the same `selected` state.
      var changeBtn = document.getElementById("availChangeBtn");
      if (changeBtn) {
        // .textContent on the button itself would wipe its calendar icon <svg>
        // too, not just the label — target the inner <span> instead.
        var changeBtnLabel = changeBtn.querySelector("span");
        if (changeBtnLabel)
          changeBtnLabel.textContent = selected ? "Change date" : "Pick a date";
      }
      // Class, not id — weddings.html's #availability card and the quick-pick
      // modal both have their own live footer label, driven off the same class
      // rather than fighting over one id between two elements.
      document.querySelectorAll(".availability-foot-label").forEach(function (el) {
        el.classList.remove("status-open", "status-interest");
        var dateEl = el.querySelector(".availability-foot-label-date"),
          statusEl = el.querySelector(".availability-picked-status");
        if (selected) {
          // "show" only actually does anything for #availPicked (the wizard's
          // own inline calendar, styles.css), which starts display:none until
          // a date is picked — the diary showcase/modal's own .availability-foot-label
          // has no such rule and stays visible with its static "No date
          // selected" fallback either way, so toggling this class is harmless
          // there.
          el.classList.add("show", "status-" + selected.status);
          if (dateEl)
            dateEl.textContent =
              "Selected · " +
              selected.dd +
              " " +
              names[selected.mm].slice(0, 3) +
              " " +
              selected.yy;
          if (statusEl)
            statusEl.textContent =
              selected.status === "open" ? "Available" : "Enquiries received";
        } else {
          el.classList.remove("show");
          if (dateEl) dateEl.textContent = "No date selected";
          if (statusEl) statusEl.textContent = "";
        }
      });
      // Not scoped to instances[] (grid widgets) — a page can also have a plain
      // .availability-picked summary panel with no calendar grid attached (weddings.html's
      // wizard step 1), so every .availability-picked on the page is kept in sync here.
      document.querySelectorAll(".availability-picked").forEach(function (el) {
        if (!selected) {
          el.classList.remove("show", "status-open", "status-interest", "swapping");
          var dateEl = el.querySelector(".availability-picked-date"),
            statusEl = el.querySelector(".availability-picked-status");
          if (dateEl) dateEl.textContent = "No date selected";
          if (statusEl) statusEl.textContent = "";
          return;
        }
        if (!el.classList.contains("show")) {
          // First reveal on this instance — no prior state to fade from, just show it.
          applyPickedContent(el);
          return;
        }
        // Switching between two already-visible picks: fade out fully, THEN swap color + text,
        // THEN fade back in — on a fixed clock (not requestAnimationFrame, which can coalesce
        // steps into the same paint and skip the fade entirely).
        var target = selected;
        el.classList.add("swapping");
        window.setTimeout(function () {
          if (selected !== target) return; // a newer pick has already taken over
          applyPickedContent(el);
          window.setTimeout(function () {
            el.classList.remove("swapping");
          }, 20);
        }, FADE_MS);
      });
    }

    function pick(iso, status, dd, yy, mm, cellEl) {
      // Full re-render is only actually needed when some instance has to jump to a
      // different month to show the newly picked date. If every instance is already
      // showing the right month (the common case — there's only ever one instance per
      // page now), just move the "picked" class between the old and new cell directly
      // instead of tearing the grid down and rebuilding it: that's what lets
      // .availability-cell's background-color/color transition actually animate, since a
      // freshly-recreated cell has no prior frame on the same element to animate from.
      var dateField = document.getElementById("date");
      var targetMonth = new Date(yy, mm, 1);
      var needsMonthChange = instances.some(function (inst) {
        return !sameMonth(inst.state.view, targetMonth);
      });

      if (selected && selected.iso === iso) {
        selected = null;
        if (dateField) {
          dateField.value = "";
          dateField.dataset.iso = "";
        }
        updatePickedPanels();
        if (needsMonthChange) {
          instances.forEach(function (inst) {
            inst.render();
          });
        } else {
          // querySelectorAll, not querySelector — a page can have more than one
          // grid instance now (weddings.html's showcase + its quick-pick modal),
          // and only clearing the first match left the other instance's cell
          // stuck showing "picked" after a deselect.
          document.querySelectorAll(".availability-cell.picked").forEach(function (c) {
            c.classList.remove("picked");
          });
        }
        return;
      }
      selected = { iso: iso, status: status, dd: dd, yy: yy, mm: mm };
      updatePickedPanels();
      if (needsMonthChange) {
        instances.forEach(function (inst) {
          inst.state.view = new Date(yy, mm, 1);
          inst.render();
        });
      } else {
        document.querySelectorAll(".availability-cell.picked").forEach(function (c) {
          c.classList.remove("picked");
        });
        // Only the cell actually clicked is known here — every other instance
        // showing the same month gets its matching cell picked up on its next
        // render() (the needsMonthChange branch above), or already shows it
        // correctly if it was already on this month from a previous sync.
        if (cellEl) cellEl.classList.add("picked");
        document.querySelectorAll(".availability-grid").forEach(function (grid) {
          if (grid.contains(cellEl)) return;
          var match = [].slice
            .call(grid.querySelectorAll(".availability-cell"))
            .find(function (c) {
              return (
                c.textContent.trim() === String(dd) && !c.classList.contains("blank")
              );
            });
          if (match) match.classList.add("picked");
        });
      }
      writeFieldFromSelected();
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
        stageModalPick(iso, status, dd, yy, mm, cellEl);
      } else {
        pick(iso, status, dd, yy, mm, cellEl);
      }
    }
    function stageModalPick(iso, status, dd, yy, mm, cellEl) {
      var current = modalPending !== undefined ? modalPending : selected;
      var next =
        current && current.iso === iso
          ? null
          : { iso: iso, status: status, dd: dd, yy: yy, mm: mm };
      modalPending = next;
      if (modalInstance) {
        modalInstance.el
          .querySelectorAll(".availability-cell.picked")
          .forEach(function (c) {
            c.classList.remove("picked");
          });
      }
      if (next && cellEl) cellEl.classList.add("picked");
      var footEl = availModal.querySelector(".availability-foot-label");
      if (footEl) {
        footEl.classList.remove("status-open", "status-interest");
        var dateEl = footEl.querySelector(".availability-foot-label-date"),
          statusEl = footEl.querySelector(".availability-picked-status");
        if (next) {
          footEl.classList.add("status-" + next.status);
          if (dateEl)
            dateEl.textContent =
              "Selected · " + next.dd + " " + names[next.mm].slice(0, 3) + " " + next.yy;
          if (statusEl)
            statusEl.textContent =
              next.status === "open" ? "Available" : "Enquiries received";
        } else {
          if (dateEl) dateEl.textContent = "No date selected";
          if (statusEl) statusEl.textContent = "";
        }
      }
      if (availModalDone) availModalDone.disabled = !next;
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
      if (modalPending === undefined) return;
      var dateField = document.getElementById("date");
      selected = modalPending;
      if (!selected && dateField) {
        dateField.value = "";
        dateField.dataset.iso = "";
      }
      modalPending = undefined;
      updatePickedPanels();
      instances.forEach(function (inst) {
        inst.render();
      });
      if (selected) writeFieldFromSelected();
    }
    availReset = function () {
      selected = null;
      updatePickedPanels();
      instances.forEach(function (inst) {
        inst.render();
      });
    };
    availRestoreField = writeFieldFromSelected;

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
    var wlPop = document.getElementById("wlPopover");
    var wireWaitlistGrid = function () {}; // no-op unless wlPop exists, replaced below
    if (wlPop) {
      var wlDateEl = document.getElementById("wlPopoverDate");
      var wlBodyEl = wlPop.querySelector(".wl-popover-body");
      var wlSuccessEl = wlPop.querySelector(".wl-popover-success");
      var wlEmailInput = document.getElementById("wlPopEmail");
      var wlNameInput = document.getElementById("wlPopName");
      var wlEmailOut = document.getElementById("wlPopoverEmailOut");
      var wlForm = document.getElementById("wlPopoverForm");
      var wlCloseBtn = document.getElementById("wlPopoverClose");
      var wlActiveCell = null;
      var wlCloseTimer = null;
      // Hover-capable pointers (mouse/trackpad) open the popover as a preview on
      // hover rather than a click — a touch device has no "hover" to borrow, so
      // it gets the original tap-to-open behavior instead. Checked once at load,
      // not live — a device doesn't switch input capability mid-session. The
      // hint text next to the legend (see weddings.html) is split the same way,
      // via @media(hover) in styles.css, so it never disagrees with this.
      var wlHoverCapable = window.matchMedia("(hover: hover)").matches;

      var wlFormatIso = function (iso) {
        var parts = iso.split("-");
        return +parts[2] + " " + names[+parts[1] - 1] + " " + parts[0];
      };
      var wlPosition = function () {
        if (!wlActiveCell) return;
        var pad = 12,
          gap = 10;
        var cellRect = wlActiveCell.getBoundingClientRect();
        var popRect = wlPop.getBoundingClientRect();
        var width = popRect.width,
          height = popRect.height;
        var spaceBelow = window.innerHeight - cellRect.bottom;
        var placement =
          spaceBelow > height + gap + pad
            ? "bottom"
            : cellRect.top > height + gap + pad
              ? "top"
              : "bottom";
        var top =
          placement === "bottom" ? cellRect.bottom + gap : cellRect.top - height - gap;
        top = Math.max(pad, Math.min(top, window.innerHeight - height - pad));
        var left = cellRect.left + cellRect.width / 2 - width / 2;
        left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
        wlPop.style.left = left + "px";
        wlPop.style.top = top + "px";
        wlPop.dataset.placement = placement;
        var arrowLeft = cellRect.left + cellRect.width / 2 - left;
        arrowLeft = Math.max(18, Math.min(arrowLeft, width - 18));
        wlPop.style.setProperty("--wl-arrow-left", arrowLeft + "px");
      };
      var wlClose = function () {
        wlPop.classList.remove("show");
        if (wlActiveCell) wlActiveCell.classList.remove("wl-active");
        wlActiveCell = null;
      };
      var wlOpenFor = function (cellEl) {
        var isSame = wlActiveCell === cellEl;
        if (wlActiveCell) wlActiveCell.classList.remove("wl-active");
        if (isSame) {
          wlClose();
          return;
        }
        wlActiveCell = cellEl;
        wlActiveCell.classList.add("wl-active");
        wlDateEl.textContent = wlFormatIso(cellEl.dataset.iso);
        wlBodyEl.hidden = false;
        wlSuccessEl.hidden = true;
        wlEmailInput.value = "";
        wlNameInput.value = "";
        wlPop.classList.add("show");
        // Position after "show" so width/height reflect the real (unclamped)
        // rendered size — opacity:0 still lays the box out at full size, but
        // this keeps the measurement after any layout-affecting class change.
        wlPosition();
      };
      var wlClearCloseTimer = function () {
        clearTimeout(wlCloseTimer);
        wlCloseTimer = null;
      };
      // ~250ms, not instant — the popover sits a real gap below/above the cell
      // (see wlPosition above), and an instant close would fire while the
      // pointer is still crossing that gap on its way in. Same hover-intent
      // delay already used for the nav dropdown proposal (sandboxes/navbar.html).
      var wlScheduleClose = function () {
        wlClearCloseTimer();
        wlCloseTimer = setTimeout(function () {
          // Don't close out from under someone who's actually typing — the
          // pointer leaving after they've clicked into a field shouldn't
          // discard what's already been entered. Only hover-triggered opens
          // ever reach this timer; an explicit close (X, Escape, click
          // elsewhere) still works regardless.
          if (wlPop.contains(document.activeElement)) return;
          // Nor out from under someone who just submitted — clicking "Join
          // the waitlist" swaps in the (shorter) success message, which can
          // leave the pointer sitting outside the popover's new, smaller box
          // even though it never actually moved (the button it was over is
          // now hidden). Without this, the confirmation could fade before
          // it's even been read.
          if (!wlSuccessEl.hidden) return;
          wlClose();
        }, 250);
      };
      var wlTakenCellFrom = function (e) {
        return e.target.closest(".availability-cell.taken");
      };

      // Called once per .diary/.compact grid found below — a .taken cell only
      // ever gets a real click listener from main.js when open/interest (see
      // render() below), so a Booked cell's hover/click has to be caught via
      // delegation on the grid itself, which also survives the grid being
      // rebuilt wholesale on every prev/next (a listener on an individual
      // cell wouldn't).
      wireWaitlistGrid = function (grid) {
        if (wlHoverCapable) {
          grid.addEventListener("mouseover", function (e) {
            var cellEl = wlTakenCellFrom(e);
            if (!cellEl) return;
            wlClearCloseTimer();
            if (cellEl === wlActiveCell) return;
            wlOpenFor(cellEl);
          });
          grid.addEventListener("mouseout", function (e) {
            var cellEl = wlTakenCellFrom(e);
            if (!cellEl) return;
            // relatedTarget is where the pointer is actually headed — if
            // that's the popover itself, its own mouseenter below cancels the
            // timer anyway, so skip scheduling one at all rather than have it
            // flash a close-then-cancel.
            if (wlPop.contains(e.relatedTarget)) return;
            wlScheduleClose();
          });
        } else {
          grid.addEventListener("click", function (e) {
            var cellEl = wlTakenCellFrom(e);
            if (cellEl) {
              wlOpenFor(cellEl);
              return;
            }
            // Any other tap inside the grid (an open/enquiries-received date,
            // a blank padding cell) is unrelated to the waitlist — close
            // rather than leave a stale prompt open against the wrong date.
            if (wlPop.classList.contains("show")) wlClose();
          });
        }
      };

      if (wlHoverCapable) {
        wlPop.addEventListener("mouseenter", wlClearCloseTimer);
        wlPop.addEventListener("mouseleave", wlScheduleClose);
      }
      if (wlCloseBtn) wlCloseBtn.addEventListener("click", wlClose);
      // "submit", not a click on the button — a real <form> (see the markup)
      // means Enter in either field fires this too, not just clicking the button.
      if (wlForm) {
        wlForm.addEventListener("submit", function (e) {
          // Native constraint validation (required + type="email" on the field
          // itself) already ran before this event could even fire — nothing
          // left to check here, just stop the actual (non-existent) form
          // navigation.
          e.preventDefault();
          wlEmailOut.textContent = wlEmailInput.value;
          wlBodyEl.hidden = true;
          wlSuccessEl.hidden = false;
        });
      }
      document.addEventListener("click", function (e) {
        if (
          wlPop.classList.contains("show") &&
          !wlPop.contains(e.target) &&
          !e.target.closest(".availability-grid")
        )
          wlClose();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && wlPop.classList.contains("show")) wlClose();
      });
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
          if (wlPop.classList.contains("show")) wlPosition();
        },
        true,
      );
      window.addEventListener("resize", function () {
        if (wlPop.classList.contains("show")) wlPosition();
      });
    }

    availEls.forEach(function (el) {
      var monthEl = el.querySelector(".availability-month"),
        gridEl = el.querySelector(".availability-grid");
      if (el.classList.contains("diary") || el.classList.contains("compact"))
        wireWaitlistGrid(gridEl);
      var prevBtn = el.querySelector(".availability-prev"),
        nextBtn = el.querySelector(".availability-next");
      // Opens on the first month that actually has bookable dates, not the
      // current month — every day in the 3-month minimum-notice window is
      // "taken" regardless, so starting there would mean clicking forward
      // 3 times before seeing anything clickable. Backward navigation to
      // today's month is still allowed (see minMonth below), just not
      // where the calendar opens by default.
      var state = {
        view: new Date(minBookableDate.getFullYear(), minBookableDate.getMonth(), 1),
      };

      function render() {
        var view = state.view;
        monthEl.textContent = names[view.getMonth()] + " " + view.getFullYear();
        gridEl.innerHTML = "";
        var first = new Date(view.getFullYear(), view.getMonth(), 1);
        var startDow = (first.getDay() + 6) % 7; // Monday-first
        var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        for (var i = 0; i < startDow; i++) {
          var blank = document.createElement("div");
          blank.className = "availability-cell blank";
          gridEl.appendChild(blank);
        }
        for (var d = 1; d <= daysInMonth; d++) {
          var cell = document.createElement("div");
          // <= not < : covers both "today or earlier" (can't book the past)
          // and, since minBookableDate is always >= today, the minimum
          // 3-month wedding lead-time window in one comparison.
          var isBeforeMinNotice =
            new Date(view.getFullYear(), view.getMonth(), d) <= minBookableDate;
          var status = isBeforeMinNotice
            ? "taken"
            : seededStatus(view.getFullYear(), view.getMonth(), d);
          var iso = isoOf(view.getFullYear(), view.getMonth(), d);
          cell.className = "availability-cell " + status;
          // Exposed on every cell regardless of status (not just the ones that get a
          // click listener below) so other code — e.g. the waitlist-prompt sandbox —
          // can read a cell's date without duplicating this render loop's own date math.
          cell.dataset.iso = iso;
          if (
            view.getFullYear() === today.getFullYear() &&
            view.getMonth() === today.getMonth() &&
            d === today.getDate()
          )
            cell.classList.add("today");
          if (selected && selected.iso === iso) cell.classList.add("picked");
          cell.textContent = d;
          if (!isBeforeMinNotice && status !== "taken") {
            cell.addEventListener(
              "click",
              (function (ymIso, st, dd, yy, mm, el) {
                return function () {
                  handleCellClick(ymIso, st, dd, yy, mm, el);
                };
              })(iso, status, d, view.getFullYear(), view.getMonth(), cell),
            );
          }
          gridEl.appendChild(cell);
        }
        // Pad only to the end of the current week row (not a fixed 6 rows/42 cells —
        // that used to be deliberate, to stop content below the grid shifting as you
        // paged between months, but a month with fewer real weeks was then trailed by
        // a whole extra row of invisible .blank cells, which is what was actually
        // creating the oversized gap before the picked-date panel. Accepted trade-off:
        // paging to a month with a different row count now does shift that panel.
        var totalSoFar = startDow + daysInMonth;
        var paddedTotal = Math.ceil(totalSoFar / 7) * 7;
        for (var t = totalSoFar; t < paddedTotal; t++) {
          var trailing = document.createElement("div");
          trailing.className = "availability-cell blank";
          gridEl.appendChild(trailing);
        }
        if (prevBtn) prevBtn.disabled = sameMonth(view, minMonth);
        if (nextBtn) nextBtn.disabled = sameMonth(view, maxMonth);
      }

      if (prevBtn)
        prevBtn.addEventListener("click", function () {
          if (prevBtn.disabled) return;
          state.view.setMonth(state.view.getMonth() - 1);
          render();
        });
      if (nextBtn)
        nextBtn.addEventListener("click", function () {
          if (nextBtn.disabled) return;
          state.view.setMonth(state.view.getMonth() + 1);
          render();
        });

      instances.push({ el: el, state: state, render: render });
    });

    instances.forEach(function (inst) {
      inst.render();
    });

    var goToFormBtn = document.getElementById("goToFormBtn");
    if (goToFormBtn) {
      goToFormBtn.addEventListener("click", function () {
        var f = document.getElementById("form");
        if (f) f.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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
    var availModal = document.getElementById("availModal");
    var availChangeBtn = document.getElementById("availChangeBtn");
    var availModalDone = document.getElementById("availModalDone");
    if (availModal && availChangeBtn) {
      var modalInstance = instances.filter(function (inst) {
        return availModal.contains(inst.el);
      })[0];
      function openAvailModal() {
        // Always discard any leftover staged pick from a previous visit that
        // was closed without confirming, and re-render so the grid reflects
        // the real committed `selected` rather than a stale staged highlight.
        modalPending = undefined;
        if (modalInstance) {
          if (selected) {
            var selMonth = new Date(selected.yy, selected.mm, 1);
            if (!sameMonth(modalInstance.state.view, selMonth))
              modalInstance.state.view = selMonth;
          }
          modalInstance.render();
        }
        if (availModalDone) availModalDone.disabled = !selected;
        availModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
      function closeAvailModal() {
        modalPending = undefined;
        availModal.classList.remove("show");
        document.body.style.overflow = "";
      }
      availChangeBtn.addEventListener("click", openAvailModal);
      availModal.querySelectorAll("[data-avail-modal-close]").forEach(function (el) {
        el.addEventListener("click", closeAvailModal);
      });
      if (availModalDone) {
        availModalDone.addEventListener("click", function () {
          if (availModalDone.disabled) return;
          commitModalPending();
          closeAvailModal();
        });
      }
      availModal.addEventListener("click", function (e) {
        if (e.target === availModal) closeAvailModal();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && availModal.classList.contains("show"))
          closeAvailModal();
      });
    }
  })();

  // ---------- Weddings: package dining-card triptych reveal ----------
  // Triptych only (980px+). There, the three dining-format cards
  // (Reception/Banquet/High Tea) read as one composed row and should enter as
  // one — but the middle card (Banquet) sits lower than its siblings (the
  // triptych offset in styles.css), so left to its own intersection it
  // crosses the shared revObs threshold later during scroll and visibly lags
  // behind the other two. Fix: observe the row as a whole and reveal all
  // three the moment it enters view. They still arrive one after another
  // rather than as a block — the left-to-right stagger comes from the --d
  // values in styles.css's own 980px query, applied as transition-delay.
  //
  // Below 980px this deliberately does nothing. The cards are stacked (or
  // 2-up) and tall, so a row-level trigger fires while cards two and three
  // are still well below the fold — they'd finish animating unseen and just
  // be sitting there by the time you scrolled down. Left alone, the sitewide
  // per-element revObs above reveals each card as it individually comes into
  // view, exactly like every other stacked section on the site, and the CSS
  // stagger is switched off with it so nothing lags.
  //
  // The width test is inside the callback rather than at setup so a resize
  // between page load and scrolling here still resolves to the right
  // behaviour. Either way the row is unobserved once it has fired: if the
  // query didn't match, revObs has already got the cards covered.
  // Same threshold/rootMargin as revObs above, so the trigger point stays
  // consistent with the rest of the page. revObs's own per-card observer
  // keeps running regardless — a harmless no-op once a card already carries
  // .is-revealed.
  (function () {
    var list = document.querySelector(".package-dining-card-list");
    if (!list) return;
    var cards = list.querySelectorAll(".package-dining-card");
    if (!cards.length) return;
    var triptych = window.matchMedia("(min-width: 980px)");
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (triptych.matches) {
            cards.forEach(function (card) {
              card.classList.add("is-revealed");
            });
          }
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(list);
  })();
})();
