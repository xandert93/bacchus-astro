// FAQ accordion. Loaded by FaqSection.astro.

// ---------- FAQ accordion ----------
// Height animation itself is pure CSS now (.faq-a's grid-template-rows
// 0fr/1fr, see styles.css) — no .scrollHeight read/write here anymore.
// What's left is real logic CSS can't express on its own: cross-item
// exclusivity (closing every other open item in the same .faq group).
document.querySelectorAll(".faq-item").forEach((item) => {
  const q = item.querySelector(".faq-q"),
    a = item.querySelector(".faq-a")
  if (!q || !a) return
  q.addEventListener("click", () => {
    const open = item.classList.contains("open")
    item
      .closest(".faq")
      .querySelectorAll(".faq-item.open")
      .forEach((o) => {
        if (o !== item) o.classList.remove("open")
      })
    item.classList.toggle("open", !open)
  })
})
