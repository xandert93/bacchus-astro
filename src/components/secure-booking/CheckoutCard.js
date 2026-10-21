// The checkout card's "Back to your booking" link (CheckoutCard.astro): back
// to the deposit page for this page's own link token.

const token = new URLSearchParams(window.location.search).get("token")

document.querySelectorAll("[data-checkout-back]").forEach((link) => {
  if (token) link.href = `/secure-booking?token=${encodeURIComponent(token)}`
})
