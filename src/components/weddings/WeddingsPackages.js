// Weddings-only: the dining-card triptych's row-level reveal.

import { REVEAL_ROOT_MARGIN } from "@scripts/lib/motion.js"

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
;(function () {
  var list = document.querySelector(".package-dining-card-list")
  if (!list) return
  var cards = list.querySelectorAll(".package-dining-card")
  if (!cards.length) return
  var triptych = window.matchMedia("(min-width: 980px)")
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        if (triptych.matches) {
          cards.forEach(function (card) {
            card.classList.add("is-revealed")
          })
        }
        obs.unobserve(entry.target)
      })
    },
    { threshold: 0, rootMargin: REVEAL_ROOT_MARGIN },
  )
  obs.observe(list)
})()
