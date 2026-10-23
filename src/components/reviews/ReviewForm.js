// Drives the /review page (ReviewForm.astro): loads who the link's token is
// for from /api/reviews/view, fills in the greeting and the suggested name,
// lights the stars, checks the form and sends it to /api/reviews/submit, then
// thanks them and offers Google, with their review ready to copy.

import { REVIEW_MINIMUM_LENGTH } from "@data/reviews"
import { longDate } from "@lib/dates"

const card = document.getElementById("reviewCard")

if (card) {
  const token = new URLSearchParams(window.location.search).get("token") || ""
  const title = document.getElementById("reviewTitle")
  const lead = document.getElementById("reviewLead")
  const loading = document.getElementById("reviewLoading")
  const form = document.getElementById("reviewForm")
  const done = document.getElementById("reviewDone")
  const error = document.getElementById("reviewError")
  const sendButton = document.getElementById("reviewSend")
  const ratingField = document.getElementById("reviewRatingField")
  const textField = document.getElementById("reviewTextField")
  const nameField = document.getElementById("reviewNameField")
  const text = document.getElementById("reviewText")
  const name = document.getElementById("reviewName")
  const place = document.getElementById("reviewLocation")
  const publish = document.getElementById("reviewPublish")
  const stars = [...document.querySelectorAll(".review-star")]

  const post = (path, body = {}) =>
    fetch(`/api/reviews/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    }).then((response) =>
      response.json().then((result) => {
        if (!response.ok) throw new Error(result.error || "Something went wrong.")
        return result
      }),
    )

  const google = document.getElementById("reviewGoogle")
  const copyButton = document.getElementById("reviewCopy")
  const copyLabel = document.getElementById("reviewCopyLabel")
  const copyNote = document.getElementById("reviewGoogleCopyNote")
  const sendLabel = document.getElementById("reviewSendLabel")

  const finish = (heading, message) => {
    title.textContent = heading
    lead.textContent = message
    loading.hidden = true
    form.hidden = true
    done.hidden = false
  }

  // Their review, word for word, to paste on Google. Copying is offered only
  // when it's here to copy: not on a return visit after sending.
  const offerGoogle = (reviewText) => {
    google.hidden = false
    copyButton.hidden = !reviewText
    copyNote.textContent = reviewText
      ? "copy your review here, then paste it on Google."
      : "you can leave a review there too."
    copyButton.addEventListener("click", () => {
      navigator.clipboard
        .writeText(reviewText)
        .then(() => {
          copyLabel.textContent = "Copied"
        })
        .catch(() => {
          // Some browsers refuse the clipboard; Google takes typing too.
          copyLabel.textContent = "Couldn't copy it"
        })
    })
  }

  const thank = (firstName, reviewText = "") => {
    finish(
      firstName ? `Thank you, ${firstName}` : "Thank you",
      "We read every review, and yours means a great deal to us.",
    )
    offerGoogle(reviewText)
  }

  // --- The stars --------------------------------------------------------------

  const chosenRating = () =>
    Number(form.querySelector("[name=rating]:checked")?.value || 0)

  const lightUpTo = (rating) =>
    stars.forEach((star, index) => star.classList.toggle("is-lit", index < rating))

  stars.forEach((star, index) => {
    star.addEventListener("mouseenter", () => lightUpTo(index + 1))
    star.addEventListener("mouseleave", () => lightUpTo(chosenRating()))
    star.querySelector("input").addEventListener("change", () => {
      lightUpTo(chosenRating())
      ratingField.classList.remove("bad")
    })
  })

  // --- Checking and sending ---------------------------------------------------

  // Restarted each time, so a second failed send shakes again.
  const markBad = (field) => {
    field.classList.remove("bad")
    void field.offsetWidth
    field.classList.add("bad")
  }

  const check = () => {
    const problems = [
      [ratingField, !chosenRating()],
      [textField, text.value.trim().length < REVIEW_MINIMUM_LENGTH],
      [nameField, !name.value.trim()],
    ].filter(([, bad]) => bad)

    problems.forEach(([field]) => markBad(field))

    return problems.length === 0
  }

  ;[
    [text, textField],
    [name, nameField],
  ].forEach(([input, field]) =>
    input.addEventListener("input", () => field.classList.remove("bad")),
  )

  const start = ({ firstName, date, occasion, suggestedName, reviewSent }) => {
    if (reviewSent) {
      thank(firstName)
      return
    }

    title.textContent = `How was ${occasion}?`
    lead.textContent = date
      ? `Thank you for celebrating with us on ${longDate(date)}, ${firstName}. We'd love to hear how it went.`
      : `Thank you for celebrating with us, ${firstName}. We'd love to hear how it went.`
    name.value = suggestedName
    loading.hidden = true
    form.hidden = false

    form.addEventListener("submit", (event) => {
      event.preventDefault()
      error.hidden = true
      if (!check()) return

      // Can't be sent twice, and says so while it's on its way.
      sendButton.disabled = true
      sendLabel.textContent = "Sending…"
      post("submit", {
        rating: chosenRating(),
        text: text.value,
        displayName: name.value,
        location: place.value,
        publish: publish.checked,
      })
        .then(() => thank(firstName, text.value.trim()))
        .catch((problem) => {
          sendButton.disabled = false
          sendLabel.textContent = "Send my review"
          error.textContent = problem.message
          error.hidden = false
        })
    })
  }

  if (token) {
    post("view")
      .then(start)
      .catch(() =>
        finish(
          "We couldn't find your review link",
          "Please use the button in your email again. If it still doesn't work, just reply to that email and we'll help.",
        ),
      )
  } else {
    finish(
      "This link isn't complete",
      "Please use the button in your email again, or get in touch and we'll help.",
    )
  }
}
