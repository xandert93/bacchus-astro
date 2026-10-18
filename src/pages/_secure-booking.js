// Runs the deposit page (secure-booking.astro). Reads the token from
// the emailed link (?token=), asks /api/deposits/view what to show, and fills
// the page in: each element's `data-deposit` names its field, and
// `data-deposit-show` lists the states it appears in (src/lib/deposits/
// view.ts). Then wires up the buttons: "I've sent the transfer", card, and
// declining the quote.

import { lockScroll, unlockScroll } from "@scripts/lib/scroll-lock.js"

const page = document.getElementById("depositPage")

if (page) {
  const token = new URLSearchParams(window.location.search).get("token")

  // "bank.iban" → view.bank.iban
  const valueAt = (view, path) =>
    path.split(".").reduce((value, key) => (value == null ? value : value[key]), view)

  const setState = (state) => {
    page.dataset.depositState = state
    page.querySelectorAll("[data-deposit-show]").forEach((element) => {
      element.hidden = !element.dataset.depositShow.split(" ").includes(state)
    })
  }

  const post = (path, body = {}) =>
    fetch(`/api/deposits/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    }).then((response) =>
      response.json().then((result) => {
        if (!response.ok) throw new Error(result.error || "Something went wrong.")
        return result
      }),
    )

  const fill = (view) => {
    page.querySelectorAll("[data-deposit]").forEach((element) => {
      element.textContent = valueAt(view, element.dataset.deposit) ?? ""
    })
    page.querySelectorAll("[data-deposit-copy]").forEach((button) => {
      button.dataset.copy = valueAt(view, button.dataset.depositCopy) ?? ""
    })

    // Rows that only show when there's something to show.
    const rowShown = {
      discount: Boolean(view.discount),
      vat: Boolean(view.vat),
      validUntil: Boolean(view.validUntil),
      testMode: view.testMode,
      exampleBank: !view.bank.areReal,
    }
    page.querySelectorAll("[data-deposit-row]").forEach((element) => {
      element.hidden = !rowShown[element.dataset.depositRow]
    })

    page.querySelectorAll("[data-deposit-detail]").forEach((row) => {
      const detail = view.details.find((item) => item.label === row.dataset.depositDetail)
      row.hidden = !detail
      if (detail)
        row.querySelector("[data-deposit-detail-value]").textContent = detail.value
    })

    const lineList = document.getElementById("depositLineItems")
    const lineTemplate = document.getElementById("depositLineItem")
    if (lineList && lineTemplate) {
      lineList.replaceChildren(
        ...view.lineItems.map((item) => {
          const line = lineTemplate.content.cloneNode(true)
          line.querySelector('[data-line="label"]').textContent = item.label
          line.querySelector('[data-line="amount"]').textContent = item.amount
          return line
        }),
      )
    }
  }

  const load = () =>
    post("view")
      .then(({ view }) => {
        fill(view)
        setState(view.state)
      })
      .catch(() => setState("invalid"))

  // --- The two ways to pay ----------------------------------------------------

  const actionError = document.getElementById("depositActionError")
  const showActionError = (message) => {
    if (!actionError) return
    actionError.textContent = message
    actionError.hidden = false
  }

  const transferSentButton = document.getElementById("transferSentButton")
  if (transferSentButton) {
    transferSentButton.addEventListener("click", () => {
      transferSentButton.disabled = true
      post("transfer-sent")
        .then(() => {
          setState("transfer-sent")
          window.scrollTo({ top: 0, behavior: "smooth" })
        })
        .catch((error) => {
          transferSentButton.disabled = false
          showActionError(error.message)
        })
    })
  }

  const cardButton = document.getElementById("payCardButton")
  if (cardButton) {
    cardButton.addEventListener("click", () => {
      cardButton.disabled = true
      post("card")
        .then(({ checkoutUrl }) => {
          window.location.href = checkoutUrl
        })
        .catch((error) => {
          cardButton.disabled = false
          showActionError(error.message)
        })
    })
  }

  // --- Declining the quote ------------------------------------------------------

  const dialog = document.getElementById("declineDialog")
  const openButton = document.getElementById("declineOpen")
  const cancelButton = document.getElementById("declineCancel")
  const confirmButton = document.getElementById("declineConfirm")
  const reasonField = document.getElementById("declineReason")
  const declineError = document.getElementById("declineError")

  if (dialog && openButton && cancelButton && confirmButton) {
    const closeDialog = () => {
      dialog.close()
    }

    openButton.addEventListener("click", () => {
      declineError.hidden = true
      dialog.showModal()
      lockScroll("decline-dialog")
    })
    dialog.addEventListener("close", () => unlockScroll("decline-dialog"))
    cancelButton.addEventListener("click", closeDialog)

    confirmButton.addEventListener("click", () => {
      confirmButton.disabled = true
      post("decline", { reason: reasonField ? reasonField.value : "" })
        .then(() => {
          closeDialog()
          setState("closed")
          window.scrollTo({ top: 0, behavior: "smooth" })
        })
        .catch((error) => {
          confirmButton.disabled = false
          declineError.textContent = error.message
          declineError.hidden = false
        })
    })
  }

  if (token) {
    setState("loading")
    load()
  } else {
    setState("invalid")
  }
}
