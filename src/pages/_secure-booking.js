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
  const params = new URLSearchParams(window.location.search)
  // Back from the couple's bank (Enable Banking), the address carries only
  // the payment's `state`, never the link's token, which the bank picker
  // kept in this tab before leaving (secure-booking/_choose-bank.js).
  const bankState = params.get("state")
  const bankError = params.get("error_description") || params.get("error")
  const savedToken = () => {
    try {
      return window.sessionStorage.getItem("depositToken")
    } catch {
      return null
    }
  }
  const token = params.get("token") || (bankState ? savedToken() : null)

  // Put the token back in the address, so a refresh or a bookmark works.
  if (token && !params.get("token")) {
    window.history.replaceState(null, "", `?token=${encodeURIComponent(token)}`)
  }

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

  // A copy of a <template>'s content, ready to fill in.
  const copyOf = (templateId) =>
    document.getElementById(templateId).content.cloneNode(true)

  // The event's facts, in the PDF's two columns: "Date", "Saturday 24th …".
  const fillFacts = (columns) => {
    const facts = document.getElementById("depositFacts")
    if (!facts) return
    const factIcons = document.getElementById("depositFactIcons")?.content

    facts.replaceChildren(
      ...columns.map((column) => {
        const columnCopy = copyOf("depositFactColumn")
        column.forEach(({ label, value }) => {
          const fact = copyOf("depositFact")
          const icon = factIcons?.querySelector(`[data-fact-icon="${label}"] svg`)
          if (icon)
            fact.querySelector(".secure-booking-fact-icon").append(icon.cloneNode(true))
          fact.querySelector('[data-fact="label"]').textContent = label
          fact.querySelector("dd").textContent = value
          columnCopy.querySelector("dl").appendChild(fact)
        })
        return columnCopy
      }),
    )
  }

  // The price in its groups, each line with its small print and its sum.
  const fillPrice = (groups) => {
    const price = document.getElementById("depositPriceGroups")
    if (!price) return

    price.replaceChildren(
      ...groups.map((group) => {
        const groupCopy = copyOf("depositPriceGroup")
        groupCopy.querySelector('[data-group="title"]').textContent = group.title
        groupCopy.querySelector('[data-group="subtotal"]').textContent = group.subtotal

        groupCopy.querySelector("ul").replaceChildren(
          ...group.lines.map((item) => {
            const line = copyOf("depositPriceLine")
            ;["label", "details", "quantity", "unitPrice", "amount"].forEach((part) => {
              line.querySelector(`[data-line="${part}"]`).textContent = item[part]
            })
            // Empty quantity and price cells stay, holding their columns.
            line.querySelector('[data-line="details"]').hidden = !item.details

            // No sum on an included line, and none under one of something.
            const sum = line.querySelector('[data-line="sum"]')
            sum.classList.toggle("is-empty", !item.quantity)
            sum.classList.toggle("is-single", item.single)
            return line
          }),
        )
        return groupCopy
      }),
    )
  }

  const fill = (view) => {
    page.querySelectorAll("[data-deposit]").forEach((element) => {
      element.textContent = valueAt(view, element.dataset.deposit) ?? ""
    })
    // Links whose address comes from the view; hidden when it's empty.
    page.querySelectorAll("[data-deposit-href]").forEach((link) => {
      const href = valueAt(view, link.dataset.depositHref)
      link.href = href || "#"
      link.hidden = !href
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
      manualTransfer: view.transferMode === "manual",
      stripeTransfer: view.transferMode === "stripe",
      notes: Boolean(view.notes),
      preparedBy: Boolean(view.preparedBy),
      preparedOn: Boolean(view.preparedOn),
      perGuest: Boolean(view.perGuest),
    }
    page.querySelectorAll("[data-deposit-row]").forEach((element) => {
      element.hidden = !rowShown[element.dataset.depositRow]
    })

    fillFacts(view.facts)
    fillPrice(view.priceGroups)
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

  // Back from paying (?paid=1): the provider's confirmation can land a
  // moment after the client does. While the deposit still shows as due, the
  // loading screen stays up and asks again every 2 seconds. After half a
  // minute it says the payment is on its way ("processing", never the
  // payment options again, which would invite paying twice) and keeps
  // asking, less often, for 10 minutes more.
  const backFromPaying = params.has("paid") || (Boolean(bankState) && !bankError)
  // Stripe's checkout session, which the server checks with Stripe directly.
  const stripeSession = params.get("session")
  const QUICK_CHECK_MS = 2000
  const QUICK_CHECKS = 15
  const SLOW_CHECK_MS = 10000
  const SLOW_CHECKS = 60
  let confirmChecks = 0

  const load = () =>
    post("view", {
      ...(stripeSession ? { session: stripeSession } : {}),
      ...(bankState ? { bankState } : {}),
    })
      .then(({ view }) => {
        if (backFromPaying && view.state === "pay") {
          confirmChecks++
          if (confirmChecks <= QUICK_CHECKS + SLOW_CHECKS) {
            if (confirmChecks > QUICK_CHECKS) setState("processing")
            setTimeout(
              load,
              confirmChecks < QUICK_CHECKS ? QUICK_CHECK_MS : SLOW_CHECK_MS,
            )
            return
          }
          setState("processing")
          return
        }
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
    if (backFromPaying) {
      const loadingText = document.getElementById("depositLoadingText")
      if (loadingText) loadingText.textContent = "Confirming your payment"
    }
    setState("loading")
    load().then(() => {
      // Back from the bank without paying (cancelled there, say): say so
      // beside the ways to pay.
      if (bankError)
        showActionError(`Your bank didn't complete the payment: ${bankError}.`)
    })
  } else {
    setState("invalid")
  }
}
