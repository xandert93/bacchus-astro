// The bank picker (choose-bank.astro): loads the banks that can make the
// payment, fills the country dropdown with the countries that have any (Malta
// first, chosen if it has banks), and shows the chosen country's banks as
// logo tiles. The logos load from Enable Banking, which supplies them. Choosing
// one starts the payment and sends the couple to their bank to approve it.
// The link's token is kept in this tab first: the bank sends them back to the
// deposit page without it (src/pages/_secure-booking.js reads it back).

import { BANK_COUNTRIES } from "@data/bank-countries"

const card = document.getElementById("chooseBank")

if (card) {
  const token = new URLSearchParams(window.location.search).get("token") || ""
  const picker = document.getElementById("chooseBankPicker")
  const countrySelect = document.getElementById("chooseBankCountry")
  const tiles = document.getElementById("chooseBankTiles")
  const template = document.getElementById("chooseBankTile")
  const loading = document.getElementById("chooseBankLoading")
  const error = document.getElementById("chooseBankError")
  const depositPage = `/secure-booking?token=${encodeURIComponent(token)}`

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

  const choose = (bank, button) => {
    button.disabled = true
    error.hidden = true
    post("bank-payment", { bank: { name: bank.name, country: bank.country } })
      .then(({ approvalUrl }) => {
        try {
          window.sessionStorage.setItem("depositToken", token)
        } catch {
          // Without storage the couple comes back to "this link isn't
          // working" and uses their email's link; the payment still counts.
        }
        window.location.href = approvalUrl
      })
      .catch((problem) => {
        button.disabled = false
        showError(problem.message)
      })
  }

  const showCountry = (code, banks) => {
    tiles.replaceChildren(
      ...banks
        .filter((bank) => bank.country === code)
        .map((bank) => {
          const item = template.content.cloneNode(true)
          const button = item.querySelector("button")
          const logo = item.querySelector("img")
          item.querySelector("[data-bank-name]").textContent = bank.name
          if (bank.logo) logo.src = bank.logo
          else logo.remove()
          button.addEventListener("click", () => choose(bank, button))
          return item
        }),
    )
  }

  const start = (banks) => {
    const countries = BANK_COUNTRIES.filter((country) =>
      banks.some((bank) => bank.country === country.code),
    )
    if (!countries.length) {
      showError("No banks can take this payment right now. Please pay by card instead.")
      return
    }

    // Malta first when it has banks, as BANK_COUNTRIES orders them.
    countrySelect.replaceChildren(
      ...countries.map((country) => new Option(country.name, country.code)),
    )
    countrySelect.addEventListener("change", () =>
      showCountry(countrySelect.value, banks),
    )
    showCountry(countries[0].code, banks)
    picker.hidden = false
  }

  document.getElementById("chooseBankBack").addEventListener("click", () => {
    window.location.href = depositPage
  })

  if (token) {
    post("banks")
      .then(({ banks }) => start(banks))
      .catch((problem) => showError(problem.message))
      .finally(() => {
        loading.hidden = true
      })
  } else {
    loading.hidden = true
    showError("This link isn't valid any more.")
  }
}
