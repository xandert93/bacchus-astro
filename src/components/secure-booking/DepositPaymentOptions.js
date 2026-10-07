// The card button's placeholder note. Loaded by DepositPaymentOptions.astro.
// Until Stripe is connected the button only reveals a line saying so.

const cardButton = document.getElementById("payCardButton")
const cardNote = document.getElementById("cardNote")

if (cardButton && cardNote) {
  cardButton.addEventListener("click", () => {
    // Two steps: .show takes the note out of display: none, and .is-revealed
    // fades it in a moment later. Added together, the fade would have nothing
    // to transition from.
    cardNote.classList.add("show")
    setTimeout(() => {
      cardNote.classList.add("is-revealed")
    }, 20)
  })
}
