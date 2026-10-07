// The bank-transfer copy buttons. Loaded by BankDetailRow.astro; Astro
// bundles it once however many rows the page has.

// How long the tick shows before the copy icon comes back.
const COPIED_FEEDBACK_MS = 1600

// Copies text with the async Clipboard API where it exists, and the older
// execCommand route otherwise. The Clipboard API only exists in secure
// contexts (HTTPS or localhost), so on a phone testing the dev server over
// plain HTTP navigator.clipboard is undefined, and without the fallback the
// buttons silently did nothing.
const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.left = "-9999px"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    let copied
    try {
      copied = document.execCommand("copy")
    } catch {
      copied = false
    }

    document.body.removeChild(textarea)
    if (copied) resolve()
    else reject()
  })
}

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
