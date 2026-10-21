// The bank picker (choose-bank.astro): loads the banks that can make the
// payment, offers only the countries that have any (Malta first, chosen if it
// has banks), and shows the chosen country's banks as logo tiles. Choosing
// one starts the payment and sends the couple to their bank to approve it.
// The link's token is kept in this tab first: the bank sends them back to the
// deposit page without it (src/pages/_secure-booking.js reads it back).

import { BANK_COUNTRIES } from "@data/bank-countries"

const card = document.getElementById("chooseBank")

if (card) {
  const token = new URLSearchParams(window.location.search).get("token") || ""
  const chips = [...document.querySelectorAll("#chooseBankCountries .chip")]
  const tiles = document.getElementById("chooseBankTiles")
  const template = document.getElementById("chooseBankTile")
  const loading = document.getElementById("chooseBankLoading")
  const error = document.getElementById("chooseBankError")
  const depositPage = `/secure-booking?token=${encodeURIComponent(token)}`

  const codeOf = (countryName) =>
    BANK_COUNTRIES.find((country) => country.name === countryName)?.code

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
    chips.forEach((chip) => {
      chip.classList.toggle("is-selected", codeOf(chip.dataset.v) === code)
    })

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
    const countriesWithBanks = new Set(banks.map((bank) => bank.country))

    chips.forEach((chip) => {
      chip.hidden = !countriesWithBanks.has(codeOf(chip.dataset.v))
      chip.addEventListener("click", () => showCountry(codeOf(chip.dataset.v), banks))
    })

    // Malta when it has banks, otherwise the first country that does.
    const first = BANK_COUNTRIES.find((country) => countriesWithBanks.has(country.code))
    if (first) showCountry(first.code, banks)
    else
      showError("No banks can take this payment right now. Please pay by card instead.")
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
