// The two waitlist emails: the link to confirm someone's place, and the
// news that their date is free. Both carry a "take me off the list" link,
// since every email about the waitlist must let people leave it.
//
// Action links point at the site the person used (`siteOrigin`), so a link
// from a local test opens the local site; pictures still come from the live
// one (layout.ts).

import { longDate } from "./enquiry-details"
import {
  button,
  emailLayout,
  escapeHtml,
  highlight,
  paragraph,
  smallPrint,
  textLink,
} from "./layout"
import type { Email } from "./send"

interface WaitlistEmailOptions {
  to: string
  name?: string
  date: string
  token: string
  siteOrigin: string
}

const greeting = (name?: string) => (name ? `Dear ${escapeHtml(name)},` : "Hello,")

const leaveLink = (siteOrigin: string, token: string) =>
  `${siteOrigin}/waitlist?action=leave&token=${token}`

const leaveLine = (siteOrigin: string, token: string) =>
  smallPrint(
    `Changed your mind? ${textLink("Take me off the list", leaveLink(siteOrigin, token))}.`,
  )

/** Sent on joining. Nothing more is sent until the link is used. */
export const waitlistConfirmEmail = ({
  to,
  name,
  date,
  token,
  siteOrigin,
}: WaitlistEmailOptions): Email => {
  const day = longDate(date)
  const confirmLink = `${siteOrigin}/waitlist?action=confirm&token=${token}`

  const body = [
    paragraph(greeting(name)),
    paragraph(
      `You asked to hear if ${highlight(day)} becomes free for a wedding at Bacchus. Please confirm it was you, and we'll email you the moment it does.`,
    ),
    button("Confirm my place", confirmLink),
    smallPrint(
      "If you didn't ask, ignore this email: without confirming, you won't hear from us again.",
    ),
    leaveLine(siteOrigin, token),
  ].join("")

  const text = [
    name ? `Dear ${name},` : "Hello,",
    "",
    `You asked to hear if ${day} becomes free for a wedding at Bacchus. Please confirm it was you, and we'll email you the moment it does:`,
    confirmLink,
    "",
    "If you didn't ask, ignore this email: without confirming, you won't hear from us again.",
    "",
    `Take me off the list: ${leaveLink(siteOrigin, token)}`,
  ].join("\n")

  return {
    to,
    subject: `Confirm: tell me if ${day} opens up`,
    html: emailLayout({
      preview: `One click to join the waitlist for ${day}.`,
      eyebrow: "Waitlist",
      title: "Confirm your <em>place</em>",
      body,
    }),
    text,
    kind: "waitlist-confirm",
  }
}

/** Sent when a booked date frees up, to everyone confirmed on its list. */
export const waitlistDateFreeEmail = ({
  to,
  name,
  date,
  token,
  siteOrigin,
}: WaitlistEmailOptions): Email => {
  const day = longDate(date)
  const enquireLink = `${siteOrigin}/weddings#enquire`

  const body = [
    paragraph(greeting(name)),
    paragraph(
      `Good news: ${highlight(day)} has just become available for a wedding at Bacchus.`,
    ),
    paragraph(
      "Everyone on the waitlist for this date hears at the same time, and we can only hold a date once a deposit is paid, so if it's still the one, enquire soon.",
    ),
    button("Enquire about this date", enquireLink),
    paragraph("Warm regards,<br><em>The Bacchus events team</em>"),
    leaveLine(siteOrigin, token),
  ].join("")

  const text = [
    name ? `Dear ${name},` : "Hello,",
    "",
    `Good news: ${day} has just become available for a wedding at Bacchus.`,
    "",
    "Everyone on the waitlist for this date hears at the same time, and we can only hold a date once a deposit is paid, so if it's still the one, enquire soon:",
    enquireLink,
    "",
    "Warm regards,",
    "The Bacchus events team",
    "",
    `Take me off the list: ${leaveLink(siteOrigin, token)}`,
  ].join("\n")

  return {
    to,
    subject: `${day} is available again`,
    html: emailLayout({
      preview: `The date you were waiting for is free.`,
      eyebrow: "Your date is free",
      title: `${escapeHtml(day)} is <em>available</em>`,
      hero: {
        photo: "secret-garden-table.jpg",
        alt: "A long table laid for dinner in the Secret Garden, lit by candles and fairy lights",
      },
      body,
    }),
    text,
    kind: "waitlist-date-free",
  }
}
