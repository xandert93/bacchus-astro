// The pretend payment provider (test-checkout.astro), for card or pay by
// bank (?method=). Card is one Pay button. Pay by bank is two steps: choose a
// bank, then approve the payment "at the bank". Paying records a test
// payment and returns the client to their deposit page, as a real provider
// would; any Back button returns them without paying.

const checkout = document.getElementById("testCheckout")

if (checkout) {
  const params = new URLSearchParams(window.location.search)
  const token = params.get("token") || ""
  const method = params.get("method") === "pay-by-bank" ? "pay-by-bank" : "card"
  const error = document.getElementById("testCheckoutError")
  const depositPage = `/secure-booking?token=${encodeURIComponent(token)}`

  const showStep = (step) => {
    checkout.querySelectorAll("[data-test-step]").forEach((element) => {
      element.hidden = element.dataset.testStep !== step
    })
  }

  const fillAll = (selector, text) => {
    checkout.querySelectorAll(selector).forEach((element) => {
      element.textContent = text
    })
  }

  const showError = (message) => {
    error.textContent = message
    error.hidden = false
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

  // Without a link there's no quote to pay for, so don't ask the server.
  if (token) {
    showStep(method === "card" ? "card" : "choose-bank")
    post("view")
      .then(({ view }) => {
        fillAll("[data-test-amount]", view.deposit.display)
        fillAll("[data-test-reference]", view.reference)
      })
      .catch(() => {})
  } else {
    showError("This link isn't valid any more.")
  }

  checkout.querySelectorAll("[data-test-back]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = depositPage
    })
  })

  checkout.querySelectorAll("[data-test-bank]").forEach((button) => {
    button.addEventListener("click", () => {
      fillAll("[data-test-bank-name]", button.dataset.testBank)
      showStep("approve")
    })
  })

  document.getElementById("testCheckoutCancel")?.addEventListener("click", () => {
    showStep("choose-bank")
  })

  checkout.querySelectorAll("[data-test-pay]").forEach((button) => {
    button.addEventListener("click", () => {
      button.disabled = true
      error.hidden = true
      post("test-payment", { method })
        .then(() => {
          window.location.href = depositPage
        })
        .catch((problem) => {
          button.disabled = false
          showError(problem.message)
        })
    })
  })
}
