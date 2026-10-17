// The pretend card checkout (test-checkout.astro): shows the deposit amount,
// records a test payment on "Pay", and returns the client to their deposit
// page either way.

const payButton = document.getElementById("testCheckoutPay")

if (payButton) {
  const token = new URLSearchParams(window.location.search).get("token") || ""
  const backButton = document.getElementById("testCheckoutBack")
  const amount = document.getElementById("testCheckoutAmount")
  const error = document.getElementById("testCheckoutError")
  const depositPage = `/secure-booking?token=${encodeURIComponent(token)}`

  const post = (path) =>
    fetch(`/api/deposits/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((response) =>
      response.json().then((result) => {
        if (!response.ok) throw new Error(result.error || "Something went wrong.")
        return result
      }),
    )

  // Without a link there's no quote to pay for, so don't ask the server.
  if (token) {
    post("view")
      .then(({ view }) => {
        amount.textContent = view.deposit.display
      })
      .catch(() => {})
  } else {
    payButton.disabled = true
    error.textContent = "This link isn't valid any more."
    error.hidden = false
  }

  backButton.addEventListener("click", () => {
    window.location.href = depositPage
  })

  payButton.addEventListener("click", () => {
    payButton.disabled = true
    error.hidden = true
    post("test-card")
      .then(() => {
        window.location.href = depositPage
      })
      .catch((problem) => {
        payButton.disabled = false
        error.textContent = problem.message
        error.hidden = false
      })
  })
}
