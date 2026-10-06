// The site's one lightbox controller. Loaded by Lightbox.astro.
//
// Replaces two separate copies that had drifted: main.js's gallery version
// (hard-wired to #ggrid) and reception's own newer one (grouped, with the
// richer station captions). Two copies is how the "previous photo flashes on
// open" bug was fixed in one in September and survived in the other until
// October — so there is one now.
//
// Which photos open it:
//   • any element with data-lb-group — prev/next stays within that group
//     (reception: "daisy"/"lavender"/"rose" dish tiles, and the two halves of
//     the stations section, only one of which is ever visible);
//   • any .gallery-item inside #ggrid without one — the full gallery and
//     the mini galleries. Those are filtered to what is currently visible,
//     so prev/next follows the gallery's category filter.
//
// Captions: data-title (bold), data-tag (italic — a leading "€" renders as
// the station price spans), and optional data-detail ("<serving note>. <item>
// · <item> (V) · …") rendered as two paragraphs with real veg badges.
//
// Every image change waits on decode() before showing it — see CLAUDE.md's
// rule on reused <img> elements.
import { lockScroll, unlockScroll } from "@scripts/lib/scroll-lock.js"

const lb = document.getElementById("lightbox")

if (lb) {
  const GRID_GROUP = "#ggrid"
  const LB_FADE_MS = 180

  const items = [...document.querySelectorAll("[data-lb-group], #ggrid .gallery-item")]
  const lbImg = lb.querySelector("figure img")
  const lbCapB = lb.querySelector("figcaption b")
  const lbCapI = lb.querySelector("figcaption i")
  const lbCapNote = lb.querySelector(".lightbox-detail:not(.lightbox-detail-items)")
  const lbCapItems = lb.querySelector(".lightbox-detail-items")
  const lbCount = lb.querySelector(".lightbox-count")
  const lbClose = lb.querySelector(".lightbox-close")
  const lbPrev = lb.querySelector(".lightbox-prev")
  const lbNext = lb.querySelector(".lightbox-next")

  let group = []
  let current = -1
  let token = 0

  const groupKey = (item) => item.dataset.lbGroup || GRID_GROUP

  // The grid group follows the gallery's CSS :has() filter, so hidden tiles
  // drop out of prev/next. Explicit groups keep every member: reception's
  // stations stage opens the lightbox by clicking a card that may itself be
  // hidden, and that card still has to be found in its group.
  const membersOf = (key) => {
    const members = items.filter((item) => groupKey(item) === key)
    if (key !== GRID_GROUP) return members
    return members.filter((item) => getComputedStyle(item).display !== "none")
  }

  const renderTag = (tag) => {
    lbCapI.textContent = ""
    const price = /^(€\S+)(?:\s+(\S[\s\S]*))?$/.exec(tag)
    if (!price) {
      lbCapI.textContent = tag
      return
    }
    const amount = document.createElement("span")
    amount.className = "package-station-price-amount"
    amount.textContent = price[1]
    lbCapI.appendChild(amount)
    if (price[2]) {
      lbCapI.appendChild(document.createTextNode(" "))
      const unit = document.createElement("span")
      unit.className = "package-station-price-unit"
      unit.textContent = price[2]
      lbCapI.appendChild(unit)
    }
  }

  // data-detail is one sentence, one ". ", then a " · "-separated item list
  // where " (V)" marks vegetarian items. The veg badge is wrapped with the
  // item's last word so it never wraps onto a line of its own — the same
  // markup the station cards use.
  const renderDetail = (detail) => {
    if (!lbCapNote || !lbCapItems) return
    const noteEnd = detail.indexOf(". ")
    const note = noteEnd === -1 ? detail : detail.slice(0, noteEnd + 1)
    const list = noteEnd === -1 ? [] : detail.slice(noteEnd + 2).split(" · ")
    lbCapNote.textContent = note
    lbCapNote.hidden = !note
    lbCapItems.textContent = ""
    list.forEach((part, i) => {
      const isVeg = / \(V\)$/.test(part)
      const clean = isVeg ? part.slice(0, -4) : part
      if (!isVeg) {
        lbCapItems.appendChild(document.createTextNode(clean))
      } else {
        const lastSpace = clean.lastIndexOf(" ")
        const head = lastSpace === -1 ? "" : clean.slice(0, lastSpace + 1)
        const lastWord = lastSpace === -1 ? clean : clean.slice(lastSpace + 1)
        if (head) lbCapItems.appendChild(document.createTextNode(head))
        const keep = document.createElement("span")
        keep.className = "package-veg-marker-keep-with-word"
        keep.appendChild(document.createTextNode(lastWord + " "))
        const badge = document.createElement("span")
        badge.className = "package-veg-marker"
        badge.setAttribute("role", "img")
        badge.setAttribute("aria-label", "Vegetarian")
        badge.textContent = "V"
        keep.appendChild(badge)
        lbCapItems.appendChild(keep)
      }
      if (i < list.length - 1) lbCapItems.appendChild(document.createTextNode(" · "))
    })
    lbCapItems.hidden = !list.length
  }

  const applyImage = () => {
    if (!group.length) return
    if (current < 0) current = group.length - 1
    if (current >= group.length) current = 0
    const item = group[current]
    const img = item.querySelector("img")
    lbImg.src = img.src
    lbImg.alt = img.alt || ""
    lbCapB.textContent = item.dataset.title || ""
    renderTag(item.dataset.tag || "")
    renderDetail(item.dataset.detail || "")
    if (lbCount) lbCount.textContent = current + 1 + " / " + group.length
  }

  // Fresh open: the image is held invisible (.lightbox-loading) until the new
  // photo has decoded, then plays its normal open transition.
  const show = () => {
    const mine = ++token
    lbImg.classList.remove("lightbox-fade")
    lbImg.classList.add("lightbox-loading")
    applyImage()
    lb.classList.add("show")
    lockScroll("lightbox")
    const reveal = () => {
      if (mine === token) lbImg.classList.remove("lightbox-loading")
    }
    lbImg.decode ? lbImg.decode().then(reveal, reveal) : reveal()
  }

  const openAt = (item) => {
    group = membersOf(groupKey(item))
    current = group.indexOf(item)
    show()
  }

  // Prev/next: fade out on a fixed clock, swap, fade back in once decoded.
  // The 20ms floor keeps a frame boundary when decode is instant (CLAUDE.md
  // bug #7); no wraparound at the ends.
  const navigate = (step) => {
    const next = current + step
    if (next < 0 || next >= group.length) return
    current = next
    if (!lb.classList.contains("show")) return show()
    const mine = ++token
    lbImg.classList.add("lightbox-fade")
    setTimeout(() => {
      applyImage()
      const fadeIn = () => {
        if (mine !== token) return
        setTimeout(() => lbImg.classList.remove("lightbox-fade"), 20)
      }
      lbImg.decode ? lbImg.decode().then(fadeIn, fadeIn) : fadeIn()
    }, LB_FADE_MS)
  }

  const close = () => {
    lb.classList.remove("show")
    unlockScroll("lightbox")
  }

  items.forEach((item) => item.addEventListener("click", () => openAt(item)))
  lbClose?.addEventListener("click", close)
  lbPrev?.addEventListener("click", () => navigate(-1))
  lbNext?.addEventListener("click", () => navigate(1))
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close()
  })
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("show")) return
    if (e.key === "Escape") close()
    if (e.key === "ArrowLeft") navigate(-1)
    if (e.key === "ArrowRight") navigate(1)
  })

  // A decisive horizontal swipe (or mouse drag) on the photo steps prev/next.
  const figure = lb.querySelector("figure")
  let swipe = null
  figure?.addEventListener("pointerdown", (e) => {
    swipe = { x: e.clientX, y: e.clientY }
  })
  figure?.addEventListener("pointerup", (e) => {
    if (!swipe) return
    const dx = e.clientX - swipe.x
    const dy = e.clientY - swipe.y
    swipe = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navigate(dx < 0 ? 1 : -1)
  })
  figure?.addEventListener("pointercancel", () => {
    swipe = null
  })
}
