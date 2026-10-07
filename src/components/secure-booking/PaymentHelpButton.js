// The floating "Need help paying?" button. Loaded by PaymentHelpButton.astro.

import { reduce } from "@scripts/lib/motion.js"

const helpButton = document.getElementById("paymentHelpButton")
const supportSection = document.getElementById("payment-support")

if (helpButton && supportSection) {
  helpButton.addEventListener("click", () => {
    supportSection.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    })
  })
}
