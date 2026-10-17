// The email an enquirer gets straight after sending the form: everything
// they sent, for their records, and what happens next. The enquiry form's
// sent panel promises it (EnquirySentPanel.astro), and the next steps match
// that panel's, so the two never say different things.

import type { EnquiryInput } from "@lib/enquiries/validate"
import { enquiryDetails, longDate } from "./enquiry-details"
import {
  button,
  detailsCard,
  emailLayout,
  escapeHtml,
  heading,
  highlight,
  paragraph,
  siteUrl,
  stepsList,
} from "./layout"
import type { Email } from "./send"

const NEXT_STEPS: [string, string][] = [
  [
    "A personal reply within two working days",
    "Availability confirmed, with pricing for your date and party size.",
  ],
  [
    "A viewing, whenever suits",
    "Walk the Hall, the Terrace and the Secret Garden at your own pace.",
  ],
]

export const enquiryConfirmationEmail = (
  enquiry: EnquiryInput,
  /** Tags the email, so a bounce can be traced back to the enquiry. */
  bookingKey: string,
): Email => {
  const date = longDate(enquiry.date)
  const details = enquiryDetails(enquiry, { messageLabel: "Your message" })

  const body = [
    paragraph(`Dear ${escapeHtml(enquiry.firstName)},`),
    paragraph(
      `Thank you for your enquiry for ${highlight(date)}. It's with our events team, and here's everything you sent us, for your records.`,
    ),
    heading("Your enquiry"),
    detailsCard(details),
    heading("What happens next"),
    stepsList(NEXT_STEPS),
    paragraph("If anything has changed, just reply to this email."),
    button("Back to Bacchus", siteUrl(enquiry.sourcePage)),
    paragraph("Warm regards,<br><em>The Bacchus events team</em>"),
  ].join("")

  const text = [
    `Dear ${enquiry.firstName},`,
    "",
    `Thank you for your enquiry for ${date}. It's with our events team, and here's everything you sent us, for your records.`,
    "",
    ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    "",
    "What happens next",
    ...NEXT_STEPS.map(([title, detail], index) => `${index + 1}. ${title}. ${detail}`),
    "",
    "If anything has changed, just reply to this email.",
    "",
    "Warm regards,",
    "The Bacchus events team",
  ].join("\n")

  return {
    to: enquiry.email,
    subject: `Your enquiry for ${date}`,
    html: emailLayout({
      preview: `Your enquiry for ${date} is with our events team.`,
      eyebrow: "Enquiry received",
      title: "Your enquiry is <em>with us</em>",
      hero: {
        photo: "secret-garden-table.jpg",
        alt: "A long table laid for dinner in the Secret Garden, lit by candles and fairy lights",
      },
      body,
    }),
    text,
    kind: "enquiry-confirmation",
    tags: { booking: bookingKey },
  }
}
