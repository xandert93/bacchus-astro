// The two emails about a review: asking the client for one a week after their
// event, and telling staff when one arrives.

import { REVIEW_OCCASIONS } from "@data/reviews"
import { longDate } from "@lib/dates"
import {
  button,
  detailsCard,
  emailLayout,
  escapeHtml,
  htmlParagraphs,
  mark,
  paragraph,
  textParagraphs,
} from "./layout"
import type { Email } from "./send"
import { studioLink } from "./staff"

const HERO = {
  photo: "secret-garden-table.jpg",
  alt: "A long table laid for dinner in the Secret Garden, lit by candles and fairy lights",
}

const SIGN_OFF = paragraph("Warm regards,<br><em>The Bacchus events team</em>")

/** Sent by the daily jobs a week after the event (src/lib/reviews/follow-ups.ts). */
export const reviewRequestEmail = ({
  to,
  firstName,
  date,
  eventType,
  reviewLink,
}: {
  to: string
  firstName: string
  date: string
  eventType: string
  reviewLink: string
}): Email => {
  const day = longDate(date)
  const occasion = REVIEW_OCCASIONS[eventType] ?? REVIEW_OCCASIONS.other
  const lead = [
    `Thank you for celebrating ${occasion} with us on ${mark(day)}.`,
    "We hope it was everything you wished for.",
    "If you have a couple of minutes, we'd love to hear how it went: it helps others planning their own day, and helps us keep getting better.",
  ]
  const after = [
    "You decide whether we show your review on our website, and under what name.",
    "Nothing goes up without your permission.",
  ]

  return {
    to,
    subject: `How was ${occasion} at Bacchus?`,
    html: emailLayout({
      preview: `We'd love to hear how ${occasion} went.`,
      eyebrow: "Your review",
      title: "How was <em>your day?</em>",
      hero: HERO,
      body: [
        paragraph(`Dear ${escapeHtml(firstName)},`),
        htmlParagraphs(lead),
        button("Share your review", reviewLink),
        htmlParagraphs(after, { small: true }),
        SIGN_OFF,
      ].join(""),
    }),
    text: [
      `Dear ${firstName},`,
      "",
      textParagraphs(lead),
      "",
      `Share your review: ${reviewLink}`,
      "",
      textParagraphs(after),
      "",
      "Warm regards,",
      "The Bacchus events team",
    ].join("\n"),
    kind: "review-request",
  }
}

/** To staff, when a review arrives: it waits in the Studio for a person. */
export const reviewReceivedEmail = ({
  to,
  replyTo,
  testimonialId,
  fullName,
  displayName,
  date,
  rating,
  text,
  publish,
}: {
  to: string[]
  replyTo: string
  testimonialId: string
  fullName: string
  displayName: string
  date?: string
  rating: number
  text: string
  publish: boolean
}): Email => {
  const lines = [
    `${fullName} has left a review${date ? ` of their event on ${longDate(date)}` : ""}.`,
    ...(publish
      ? [
          `They're happy for it to go on the website as "${displayName}".`,
          `It's waiting in the Studio under Testimonials, "Awaiting review": pick its gold phrase and publish it, or withhold it.`,
        ]
      : [
          "They'd rather it wasn't published, so keep it as private feedback.",
          "Set it to Withheld in the Studio.",
        ]),
  ]
  const rows: [string, string][] = [
    ["Rating", `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`],
    ["Name to show", displayName],
    ["May we publish it?", publish ? "Yes" : "No"],
  ]
  const link = studioLink(testimonialId, "testimonial")

  return {
    to,
    replyTo,
    subject: `New review: ${fullName}, ${rating} of 5`,
    html: emailLayout({
      preview: lines[0],
      eyebrow: "New review",
      title: "A review has <em>arrived</em>",
      body: [
        htmlParagraphs(lines),
        link ? button("Open in the Studio", link) : "",
        detailsCard(rows),
        paragraph(`<em>“${escapeHtml(text).replace(/\n+/g, "<br>")}”</em>`),
      ].join(""),
    }),
    text: [
      textParagraphs(lines),
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      "",
      `"${text}"`,
    ].join("\n"),
    kind: "review-received",
  }
}
