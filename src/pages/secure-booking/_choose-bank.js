// The bank picker (choose-bank.astro): lists the banks that can make the
// payment, by country, and when one is chosen, starts the payment and sends
// the couple to their bank to approve it. The link's token is kept in this
// tab first: the bank sends them back to the deposit page without it
// (src/pages/_secure-booking.js reads it back).

const card = document.getElementById("chooseBank")

if (card) {
  const token = new URLSearchParams(window.location.search).get("token") || ""
  const lists = document.getElementById("chooseBankLists")
  const template = document.getElementById("chooseBankButton")
  const loading = document.getElementById("chooseBankLoading")
  const error = document.getElementById("chooseBankError")
  const depositPage = `/secure-booking?token=${encodeURIComponent(token)}`

  const COUNTRY_NAMES = {
    MT: "Malta",
    IE: "Ireland",
    LT: "Lithuania",
    FI: "Finland",
    EE: "Estonia",
    ES: "Spain",
    NL: "Netherlands",
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

  const choose = (bank, button) => {
    button.disabled = true
    error.hidden = true
    post("bank-payment", { bank })
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

  const render = (banks) => {
    const byCountry = {}
    banks.forEach((bank) => {
      ;(byCountry[bank.country] ??= []).push(bank)
    })

    Object.keys(COUNTRY_NAMES)
      .filter((country) => byCountry[country])
      .forEach((country) => {
        const heading = document.createElement("p")
        heading.className = "choose-bank-country"
        heading.textContent = COUNTRY_NAMES[country]

        const list = document.createElement("ul")
        list.className = "checkout-card-banks"
        byCountry[country].forEach((bank) => {
          const item = template.content.cloneNode(true)
          const button = item.querySelector("button")
          item.querySelector("[data-bank-name]").textContent = bank.name
          button.addEventListener("click", () => choose(bank, button))
          list.appendChild(item)
        })

        lists.append(heading, list)
      })
  }

  document.getElementById("chooseBankBack").addEventListener("click", () => {
    window.location.href = depositPage
  })

  if (token) {
    post("banks")
      .then(({ banks }) => render(banks))
      .catch((problem) => showError(problem.message))
      .finally(() => {
        loading.hidden = true
      })
  } else {
    loading.hidden = true
    showError("This link isn't valid any more.")
  }
}
