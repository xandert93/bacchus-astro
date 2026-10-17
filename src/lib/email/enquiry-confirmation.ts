// The email an enquirer gets straight after sending the form: everything
// they sent, for their records, and what happens next. The enquiry form's
// sent panel promises it (EnquirySentPanel.astro), and the next steps match
// that panel's, so the two never say different things.

import { EVENT_STYLE_OPTIONS, NOT_SURE_OF_SPACES, SPACE_OPTIONS } from "@data/enquiry"
import type { EnquiryInput } from "@lib/enquiries/validate"
import type { Email } from "./send"
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

/** "Saturday 20 January 2027", from "2027-01-20". */
const longDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

const titleOf = (options: { value: string; title: string }[], value?: string) =>
  options.find((option) => option.value === value)?.title

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export const enquiryConfirmationEmail = (enquiry: EnquiryInput): Email => {
  const date = longDate(enquiry.date)

  const spaces = [
    ...enquiry.spaces.map((space) => titleOf(SPACE_OPTIONS, space) ?? space),
    ...(enquiry.guidanceOnSpaces ? [titleOf(SPACE_OPTIONS, NOT_SURE_OF_SPACES)] : []),
  ].join(", ")

  const details: [string, string | undefined][] = [
    ["Occasion", capitalise(enquiry.eventType)],
    ["Preferred date", date],
    ["Alternative date", enquiry.backupDate ? longDate(enquiry.backupDate) : undefined],
    ["Guests", `${enquiry.guests} expected`],
    ["Spaces", spaces || undefined],
    ["Style", titleOf(EVENT_STYLE_OPTIONS, enquiry.style)],
    ["Your message", enquiry.message],
    ["Name", `${enquiry.firstName} ${enquiry.lastName}`],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone],
    ["Contact by", enquiry.contactPreference],
  ]

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
  }
}
