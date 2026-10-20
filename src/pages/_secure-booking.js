// Runs the deposit page (secure-booking.astro). Reads the token from
// the emailed link (?token=), asks /api/deposits/view what to show, and fills
// the page in: each element's `data-deposit` names its field, and
// `data-deposit-show` lists the states it appears in (src/lib/deposits/
// view.ts). Then wires up the buttons: pay by bank, card, "I've sent the
// transfer", and declining the quote; and greets a confirmed booking with a
// short rise of gold through the hero.

import { reducedMotion } from "@lib/media-queries.js"

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
      balanceNote: Boolean(view.balanceNote),
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
          const working = line.querySelector('[data-line="working"]')
          working.textContent = item.working
          working.hidden = !item.working
          return line
        }),
      )
    }
  }

  // A one-off rise of gold specks through the hero, like bubbles in a glass,
  // when the page opens on a confirmed booking. The hero's own particles
  // drift slowly for ever; these are brighter, quicker and gone in seconds.
  const celebrate = () => {
    const layer = document.getElementById("particles")
    if (!layer || window.matchMedia(reducedMotion).matches) return

    for (let index = 0; index < 40; index++) {
      const speck = document.createElement("div")
      speck.className = "particle secure-booking-celebration-speck"
      speck.style.left = `${Math.random() * 100}%`
      speck.style.animationDuration = `${3 + Math.random() * 3}s`
      speck.style.animationDelay = `${Math.random() * 1.5}s`
      speck.addEventListener("animationend", () => speck.remove())
      layer.appendChild(speck)
    }
  }

  const load = () =>
    post("view")
      .then(({ view }) => {
        fill(view)
        setState(view.state)
        if (view.state === "confirmed") celebrate()
      })
      .catch(() => setState("invalid"))

  // --- The ways to pay ------------------------------------------------------

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

  // Pay by bank and card both go to the payment provider's checkout.
  page.querySelectorAll("[data-checkout-method]").forEach((button) => {
    button.addEventListener("click", () => {
      button.disabled = true
      post("checkout", { method: button.dataset.checkoutMethod })
        .then(({ checkoutUrl }) => {
          window.location.href = checkoutUrl
        })
        .catch((error) => {
          button.disabled = false
          showActionError(error.message)
        })
    })
  })

  // --- Declining the quote ------------------------------------------------------
  // The Dialog opens and closes itself (src/components/ui/Dialog.js); this
  // sends the decline.

  const dialog = document.getElementById("declineDialog")
  const confirmButton = document.getElementById("declineConfirm")
  const reasonField = document.getElementById("declineReason")
  const declineError = document.getElementById("declineError")

  if (dialog && confirmButton) {
    dialog.addEventListener("close", () => {
      declineError.hidden = true
    })

    confirmButton.addEventListener("click", () => {
      confirmButton.disabled = true
      post("decline", { reason: reasonField ? reasonField.value : "" })
        .then(() => {
          dialog.close()
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
