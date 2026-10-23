// Copying text for a visitor, shared by every copy button: the deposit
// page's bank details (BankDetailRow.js) and the review page's "Copy my
// review" (ReviewForm.js).

/** How long a button shows "copied" (a tick) before going back. */
export const COPIED_FEEDBACK_MS = 1600

// Copies text with the async Clipboard API where it exists, and the older
// execCommand route otherwise. The Clipboard API only exists in secure
// contexts (HTTPS or localhost), so on a phone testing the dev server over
// plain HTTP navigator.clipboard is undefined, and without the fallback the
// buttons silently did nothing.
export const copyToClipboard = (text) => {
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
