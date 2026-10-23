// The email Bacchus's events team gets the moment an enquiry arrives: who,
// what, when, and a button straight to it in the Studio. Replying to it
// replies to the enquirer, so a quick answer is one click away.

import type { EnquiryInput } from "@lib/enquiries/validate"
import { longDate } from "@lib/dates"
import { capitalise, enquiryDetails } from "./enquiry-details"
import {
  button,
  detailsCard,
  emailLayout,
  escapeHtml,
  heading,
  paragraph,
} from "./layout"
import type { Email } from "./send"
import { studioLink } from "./staff"

export const enquiryAlertEmail = (
  enquiry: EnquiryInput,
  { bookingId, recipients }: { bookingId: string; recipients: string[] },
): Email => {
  const date = longDate(enquiry.date)
  const name = `${enquiry.firstName} ${enquiry.lastName}`
  const occasion = capitalise(enquiry.eventType)
  const details = enquiryDetails(enquiry)
  const link = studioLink(bookingId, "booking")

  const body = [
    paragraph(
      `${escapeHtml(name)} has enquired about a ${escapeHtml(enquiry.eventType)} on ${escapeHtml(date)}, for ${enquiry.guests} guests.`,
    ),
    paragraph("It's in the Studio under Enquiries, New."),
    paragraph("Reply to this email to answer them directly."),
    ...(link ? [button("Open in the Studio", link)] : []),
    heading("The enquiry"),
    detailsCard(details),
  ].join("")

  const text = [
    `${name} has enquired about a ${enquiry.eventType} on ${date}, for ${enquiry.guests} guests.`,
    "",
    "It's in the Studio under Enquiries, New.",
    "",
    "Reply to this email to answer them directly.",
    ...(link ? ["", `Open in the Studio: ${link}`] : []),
    "",
    ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
  ].join("\n")

  return {
    to: recipients,
    subject: `New enquiry: ${occasion}, ${date}, ${name}`,
    html: emailLayout({
      preview: `${name}, ${enquiry.guests} guests, from ${enquiry.sourcePage}`,
      eyebrow: "New enquiry",
      title: `${escapeHtml(occasion)} on <em>${escapeHtml(date)}</em>`,
      body,
    }),
    text,
    kind: "enquiry-alert",
    replyTo: enquiry.email,
  }
}
