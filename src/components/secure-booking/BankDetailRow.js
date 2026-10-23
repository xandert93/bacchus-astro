// The bank-transfer copy buttons. Loaded by BankDetailRow.astro; Astro
// bundles it once however many rows the page has.

import { COPIED_FEEDBACK_MS, copyToClipboard } from "@scripts/lib/clipboard.js"

document.querySelectorAll(".secure-booking-copy-button").forEach((button) => {
  const copyIcon = button.querySelector(".secure-booking-copy-icon")
  const checkIcon = button.querySelector(".secure-booking-check-icon")
  let resetTimer = null

  const showCopied = (copied) => {
    button.classList.toggle("copied", copied)
    if (copyIcon) copyIcon.style.display = copied ? "none" : ""
    if (checkIcon) checkIcon.style.display = copied ? "" : "none"
  }

  button.addEventListener("click", () => {
    copyToClipboard(button.dataset.copy || "")
      .then(() => {
        clearTimeout(resetTimer)
        showCopied(true)
        resetTimer = setTimeout(() => {
          showCopied(false)
        }, COPIED_FEEDBACK_MS)
      })
      // Nothing to tell the visitor if both routes fail: the value is on
      // screen to copy by hand.
      .catch(() => {})
  })
})
