// Drives the /waitlist page (WaitlistAction.astro): reads ?action and ?token
// from the email's link, shows the matching button, and sends it to
// /api/waitlist/confirm or /api/waitlist/leave when pressed.

import { longDate } from "@lib/dates"

const card = document.getElementById("waitlistAction")

if (card) {
  const title = document.getElementById("waitlistTitle")
  const text = document.getElementById("waitlistText")
  const error = document.getElementById("waitlistError")
  const button = document.getElementById("waitlistButton")
  const buttonLabel = document.getElementById("waitlistButtonLabel")
  const back = document.getElementById("waitlistBack")

  const params = new URLSearchParams(window.location.search)
  const action = params.get("action")
  const token = params.get("token")

  const ACTIONS = {
    confirm: {
      title: "Confirm your place",
      text: "Confirm that you'd like us to email you if your wedding date opens up.",
      button: "Confirm my place",
      doneTitle: "You're on the list",
      doneText: (date) => `We'll email you the moment ${longDate(date)} opens up.`,
    },
    leave: {
      title: "Leave the waitlist?",
      text: "We won't email you about this date again.",
      button: "Take me off the list",
      doneTitle: "You're off the list",
      doneText: (date) => `We won't email you about ${longDate(date)} again.`,
    },
  }

  const copy = ACTIONS[action]

  const finish = (heading, message) => {
    title.textContent = heading
    text.textContent = message
    button.hidden = true
    back.hidden = false
  }

  if (!copy || !token) {
    finish(
      "This link isn't complete",
      "Please use the button in your email again, or get in touch and we'll help.",
    )
  } else {
    title.textContent = copy.title
    text.textContent = copy.text
    buttonLabel.textContent = copy.button
    button.hidden = false

    button.addEventListener("click", () => {
      button.disabled = true
      error.hidden = true

      fetch(`/api/waitlist/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((response) => response.json().then((result) => ({ response, result })))
        .then(({ response, result }) => {
          if (!response.ok) throw new Error(result.error || "Something went wrong.")
          finish(copy.doneTitle, copy.doneText(result.date))
        })
        .catch((problem) => {
          button.disabled = false
          error.textContent = problem.message
          error.hidden = false
        })
    })
  }
}
