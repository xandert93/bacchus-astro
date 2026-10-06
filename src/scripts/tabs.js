// The sliding-pill tab group. Auto-wires every .tab-bar on the page, and
// exports initTabGroup / ensureTabVisibleIn for scripts that drive their own
// groups. Also still published as window.BacchusTabs, which the package and
// reception scripts were written against.

import { reduce } from "./lib/motion.js"

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
export const initTabGroup = (container, opts) => {
  opts = opts || {}
  if (!container) return null
  const groupTabs = [].slice.call(container.querySelectorAll("button"))
  const groupPill = container.querySelector(".pill")
  if (!groupTabs.length) return null
  const movePill = (btn) => {
    if (!groupPill) return
    groupPill.style.width = btn.offsetWidth + "px"
    groupPill.style.transform = "translateX(" + btn.offsetLeft + "px)"
  }
  // This group's own container, bound — see ensureTabVisibleIn below.
  const ensureTabVisible = (btn) => {
    ensureTabVisibleIn(container, btn)
  }
  // opts.panelSelector is optional — a group that only ever proxies its
  // clicks elsewhere (again, the sticky switcher) has no panels of its
  // own to show/hide, just its own active state + pill to animate.
  const selectTab = (btn) => {
    groupTabs.forEach((b) => {
      b.classList.remove("active")
      b.setAttribute("aria-selected", "false")
    })
    btn.classList.add("active")
    btn.setAttribute("aria-selected", "true")
    if (opts.panelSelector) {
      document.querySelectorAll(opts.panelSelector).forEach((p) => {
        p.classList.remove("active")
      })
      const panel = document.querySelector(
        opts.panelSelector + '[data-panel="' + btn.dataset.tab + '"]',
      )
      if (panel) panel.classList.add("active")
    }
    // Read (geometry) before write (pill styles) — the reverse order
    // forces a synchronous reflow between the two for no benefit.
    ensureTabVisible(btn)
    movePill(btn)
  }
  groupTabs.forEach((b) => {
    b.addEventListener("click", () => {
      selectTab(b)
    })
  })
  const syncPill = () => {
    const a = container.querySelector("button.active")
    if (!a) return
    // Also on load/resize, not just on click: a row that fit a moment
    // ago may not after a resize, and a page deep-linked to a later tab
    // (reception-package.html#rose, say) lands with that tab already
    // active and potentially off-screen.
    ensureTabVisible(a)
    movePill(a)
  }
  window.addEventListener("load", syncPill)
  window.addEventListener("resize", syncPill)
  setTimeout(syncPill, 400)
  // Exposed so external code (a page-specific script driving a proxy
  // group, e.g.) can set this group's active tab + slide its pill
  // directly — bypassing its click listeners entirely, so that doesn't
  // loop back into whatever else a click on these buttons also triggers.
  return {
    selectTab: selectTab,
    syncPill: syncPill,
    ensureTabVisible: ensureTabVisible,
  }
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
export const ensureTabVisibleIn = (container, btn) => {
  if (!container || !btn) return
  const style = window.getComputedStyle(container)
  const padLeft = parseFloat(style.paddingLeft) || 0
  const padRight = parseFloat(style.paddingRight) || 0
  const barRect = container.getBoundingClientRect()
  const innerLeft = barRect.left + padLeft
  const innerRight = barRect.right - padRight
  const btnRect = btn.getBoundingClientRect()
  const behavior = reduce ? "auto" : "smooth"
  if (btnRect.left < innerLeft) {
    container.scrollBy({ left: btnRect.left - innerLeft, behavior: behavior })
  } else if (btnRect.right > innerRight) {
    container.scrollBy({ left: btnRect.right - innerRight, behavior: behavior })
  }
}
window.BacchusTabs = {
  initTabGroup: initTabGroup,
  ensureTabVisible: ensureTabVisibleIn,
}
;[].slice.call(document.querySelectorAll(".tab-bar")).forEach((bar) => {
  initTabGroup(bar, { panelSelector: ".tab-panel" })
})
