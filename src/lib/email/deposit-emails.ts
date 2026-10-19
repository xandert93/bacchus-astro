// Every email in the deposit flow, to the client and to staff. One file, as
// each is short and they share their facts (a quote's couple, date, sums).

import { euros } from "@lib/money"
import { longDate } from "./enquiry-details"
import {
  button,
  detailsCard,
  emailLayout,
  escapeHtml,
  highlight,
  paragraph,
  smallPrint,
} from "./layout"
import type { Email } from "./send"
import { studioLink } from "./staff"

const HERO = {
  photo: "secret-garden-table.jpg",
  alt: "A long table laid for dinner in the Secret Garden, lit by candles and fairy lights",
}

const SIGN_OFF = paragraph("Warm regards,<br><em>The Bacchus events team</em>")

/** The facts every deposit email can draw on. */
export interface DepositFacts {
  couple: string
  firstName: string
  email: string
  date: string
  reference: string
  total: number
  deposit: number
  bookingId: string
}

/** The text version: the same lines without the HTML. */
const plain = (lines: (string | undefined)[]) =>
  lines.filter((line) => line !== undefined).join("\n")

const staffButton = (bookingId: string) => {
  const link = studioLink(bookingId, "booking")
  return link ? button("Open in the Studio", link) : ""
}

// --- To the client ------------------------------------------------------------

/** The quote, with the link to the deposit page. Sent when staff mark it Sent. */
export const quoteEmail = (
  facts: DepositFacts,
  { depositLink, validUntil }: { depositLink: string; validUntil?: string },
): Email => {
  const day = longDate(facts.date)
  const rows: [string, string | undefined][] = [
    ["Date", day],
    ["Quote reference", facts.reference],
    ["Total", euros(facts.total)],
    ["Deposit to secure it", euros(facts.deposit)],
    ["Quote valid until", validUntil ? longDate(validUntil) : undefined],
  ]

  return {
    to: facts.email,
    subject: `Your quote for ${day}`,
    html: emailLayout({
      preview: `Your quote is ready: review it and secure ${day}.`,
      eyebrow: "Your quote",
      title: "Your quote is <em>ready</em>",
      hero: HERO,
      body: [
        paragraph(`Dear ${escapeHtml(facts.firstName)},`),
        paragraph(
          `Your quote for ${highlight(day)} is ready. Everything is on your booking page: the details, the full price breakdown, and the deposit that secures your date. Until a deposit arrives, the date is still open to other couples.`,
        ),
        detailsCard(rows),
        button("Review and pay your deposit", depositLink),
        smallPrint(
          "The page is private to you: please don't share the link. Questions? Just reply to this email.",
        ),
        SIGN_OFF,
      ].join(""),
    }),
    text: plain([
      `Dear ${facts.firstName},`,
      "",
      `Your quote for ${day} is ready. Everything is on your booking page: the details, the full price breakdown, and the deposit that secures your date. Until a deposit arrives, the date is still open to other couples.`,
      "",
      ...rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
      "",
      `Review and pay your deposit: ${depositLink}`,
      "",
      "The page is private to you: please don't share the link. Questions? Just reply to this email.",
      "",
      "Warm regards,",
      "The Bacchus events team",
    ]),
    kind: "quote",
  }
}

/** A couple of days before the quote runs out, while the deposit is still due. */
export const quoteReminderEmail = (
  facts: DepositFacts,
  { depositLink, validUntil }: { depositLink: string; validUntil: string },
): Email => {
  const day = longDate(facts.date)
  const lastDay = longDate(validUntil)
  const rows: [string, string][] = [
    ["Date", day],
    ["Quote reference", facts.reference],
    ["Deposit to secure it", euros(facts.deposit)],
    ["Quote valid until", lastDay],
  ]
  const lead = `Just a reminder that your quote for ${day} is open until ${lastDay}. The date isn't held until a deposit arrives, so if it's the one, now's a good time to secure it.`

  return {
    to: facts.email,
    subject: `A reminder: your quote for ${day}`,
    html: emailLayout({
      preview: `Your quote for ${day} is open until ${lastDay}.`,
      eyebrow: "Your quote",
      title: "A gentle <em>reminder</em>",
      hero: HERO,
      body: [
        paragraph(`Dear ${escapeHtml(facts.firstName)},`),
        paragraph(escapeHtml(lead)),
        detailsCard(rows),
        button("Review and pay your deposit", depositLink),
        smallPrint(
          "Not going ahead? You can decline the quote on the same page. Questions? Just reply to this email.",
        ),
        SIGN_OFF,
      ].join(""),
    }),
    text: plain([
      `Dear ${facts.firstName},`,
      "",
      lead,
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      "",
      `Review and pay your deposit: ${depositLink}`,
      "",
      "Not going ahead? You can decline the quote on the same page. Questions? Just reply to this email.",
      "",
      "Warm regards,",
      "The Bacchus events team",
    ]),
    kind: "quote-reminder",
  }
}

/** Once the deposit has arrived: the date is theirs. */
export const depositConfirmedEmail = (facts: DepositFacts): Email => {
  const day = longDate(facts.date)
  const balance = facts.total - facts.deposit

  return {
    to: facts.email,
    subject: `${day} is yours`,
    html: emailLayout({
      preview: `Your deposit has arrived and ${day} is confirmed.`,
      eyebrow: "Booking confirmed",
      title: "Your date is <em>confirmed</em>",
      hero: HERO,
      body: [
        paragraph(`Dear ${escapeHtml(facts.firstName)},`),
        paragraph(
          `Your deposit of ${highlight(euros(facts.deposit))} has arrived, and ${highlight(day)} is now yours. Thank you.`,
        ),
        detailsCard([
          ["Quote reference", facts.reference],
          ["Deposit received", euros(facts.deposit)],
          ["Remaining balance", balance > 0 ? euros(balance) : undefined],
        ]),
        paragraph(
          "We'll be in touch soon to start planning the day with you. In the meantime, just reply to this email with any questions.",
        ),
        SIGN_OFF,
      ].join(""),
    }),
    text: plain([
      `Dear ${facts.firstName},`,
      "",
      `Your deposit of ${euros(facts.deposit)} has arrived, and ${day} is now yours. Thank you.`,
      "",
      `Quote reference: ${facts.reference}`,
      balance > 0 ? `Remaining balance: ${euros(balance)}` : undefined,
      "",
      "We'll be in touch soon to start planning the day with you. In the meantime, just reply to this email with any questions.",
      "",
      "Warm regards,",
      "The Bacchus events team",
    ]),
    kind: "deposit-confirmed",
  }
}

/** To others who'd enquired about the same wedding date, once it's taken. */
export const dateTakenEmail = ({
  to,
  firstName,
  date,
  enquireLink,
}: {
  to: string
  firstName: string
  date: string
  enquireLink: string
}): Email => {
  const day = longDate(date)

  return {
    to,
    subject: `${day} is no longer available`,
    html: emailLayout({
      preview: `We're sorry: ${day} has now been booked.`,
      eyebrow: "About your enquiry",
      title: `${escapeHtml(day)} has been <em>booked</em>`,
      body: [
        paragraph(`Dear ${escapeHtml(firstName)},`),
        paragraph(
          `We're sorry to tell you that ${highlight(day)}, the date you enquired about, has now been booked by another couple. We host only one wedding a day, so it's no longer available.`,
        ),
        paragraph(
          "We'd love to find you another date. Reply to this email, or look at the calendar for the dates still open.",
        ),
        button("See available dates", enquireLink),
        SIGN_OFF,
      ].join(""),
    }),
    text: plain([
      `Dear ${firstName},`,
      "",
      `We're sorry to tell you that ${day}, the date you enquired about, has now been booked by another couple. We host only one wedding a day, so it's no longer available.`,
      "",
      `We'd love to find you another date. Reply to this email, or look at the calendar for the dates still open: ${enquireLink}`,
      "",
      "Warm regards,",
      "The Bacchus events team",
    ]),
    kind: "date-taken",
  }
}

/** The client declined their quote: a record of it, and the door left open. */
export const quoteDeclinedClientEmail = (facts: DepositFacts): Email => {
  const day = longDate(facts.date)

  return {
    to: facts.email,
    subject: `Your quote for ${day} is closed`,
    html: emailLayout({
      preview: `We've closed your quote for ${day}, as you asked.`,
      eyebrow: "Your quote",
      title: "We've closed your <em>quote</em>",
      body: [
        paragraph(`Dear ${escapeHtml(facts.firstName)},`),
        paragraph(
          `As you asked, we've closed your quote for ${highlight(day)} (reference ${escapeHtml(facts.reference)}). Nothing has been charged, and there's nothing more you need to do.`,
        ),
        paragraph(
          "Thank you for thinking of Bacchus. If your plans change, or you'd like to talk about another date, just reply to this email: we'd love to hear from you.",
        ),
        SIGN_OFF,
      ].join(""),
    }),
    text: plain([
      `Dear ${facts.firstName},`,
      "",
      `As you asked, we've closed your quote for ${day} (reference ${facts.reference}). Nothing has been charged, and there's nothing more you need to do.`,
      "",
      "Thank you for thinking of Bacchus. If your plans change, or you'd like to talk about another date, just reply to this email: we'd love to hear from you.",
      "",
      "Warm regards,",
      "The Bacchus events team",
    ]),
    kind: "quote-declined-client",
  }
}

/** The quote ran out with no deposit, so it's closed. */
export const quoteExpiredEmail = (
  facts: DepositFacts,
  { validUntil }: { validUntil: string },
): Email => {
  const day = longDate(facts.date)
  const closed = `Your quote for ${day} (reference ${facts.reference}) was open until ${longDate(validUntil)}, and as no deposit arrived, we've closed it. Nothing has been charged.`
  const invitation = `If you'd still like ${day}, or another date, just reply to this email: we'll check it's free and send you a fresh quote.`

  return {
    to: facts.email,
    subject: `Your quote for ${day} has closed`,
    html: emailLayout({
      preview: `Your quote for ${day} has closed.`,
      eyebrow: "Your quote",
      title: "Your quote has <em>closed</em>",
      body: [
        paragraph(`Dear ${escapeHtml(facts.firstName)},`),
        paragraph(escapeHtml(closed)),
        paragraph(escapeHtml(invitation)),
        SIGN_OFF,
      ].join(""),
    }),
    text: plain([
      `Dear ${facts.firstName},`,
      "",
      closed,
      "",
      invitation,
      "",
      "Warm regards,",
      "The Bacchus events team",
    ]),
    kind: "quote-expired",
  }
}

// --- To staff -----------------------------------------------------------------

const staffEmail = ({
  to,
  subject,
  eyebrow,
  title,
  lines,
  facts,
  replyTo,
  kind,
}: {
  to: string[]
  subject: string
  eyebrow: string
  title: string
  lines: string[]
  facts: DepositFacts
  replyTo?: string
  kind: string
}): Email => {
  const rows: [string, string][] = [
    ["Client", facts.couple],
    ["Date", longDate(facts.date)],
    ["Quote reference", facts.reference],
    ["Deposit", euros(facts.deposit)],
  ]

  return {
    to,
    subject,
    html: emailLayout({
      preview: lines[0],
      eyebrow,
      title,
      body: [
        ...lines.map((line) => paragraph(escapeHtml(line))),
        staffButton(facts.bookingId),
        detailsCard(rows),
      ].join(""),
    }),
    text: plain([...lines, "", ...rows.map(([label, value]) => `${label}: ${value}`)]),
    kind,
    replyTo,
  }
}

/** The client says they've sent the transfer: someone should look for it. */
export const transferNoticeEmail = (facts: DepositFacts, to: string[]) =>
  staffEmail({
    to,
    facts,
    replyTo: facts.email,
    subject: `Deposit transfer sent: ${facts.couple}, ref ${facts.reference}`,
    eyebrow: "Deposit transfer",
    title: "A transfer is <em>on its way</em>",
    lines: [
      `${facts.couple} says they've sent their deposit by bank transfer, with the reference ${facts.reference}.`,
      "When it reaches the account, open their booking, set the payment to Received and publish. That confirms the booking, and they're emailed.",
    ],
    kind: "transfer-notice",
  })

/** The deposit arrived and the booking is confirmed. */
export const depositReceivedStaffEmail = (facts: DepositFacts, to: string[]) =>
  staffEmail({
    to,
    facts,
    replyTo: facts.email,
    subject: `Booking confirmed: ${facts.couple}, ${longDate(facts.date)}`,
    eyebrow: "Booking confirmed",
    title: "Deposit <em>received</em>",
    lines: [
      `${facts.couple}'s deposit has arrived, so their booking is confirmed and they've been emailed.`,
    ],
    kind: "deposit-received",
  })

/** A deposit arrived for a date someone else had already secured. */
export const paidButTakenEmail = (facts: DepositFacts, to: string[]) =>
  staffEmail({
    to,
    facts,
    replyTo: facts.email,
    subject: `Refund needed: ${facts.couple} paid for a taken date`,
    eyebrow: "Needs attention",
    title: "Paid for a date <em>already taken</em>",
    lines: [
      `${facts.couple} paid their deposit, but another wedding was confirmed for ${longDate(facts.date)} first. Their booking has not been confirmed.`,
      "Please contact them about another date or a refund.",
    ],
    kind: "paid-but-taken",
  })

/** The client declined the quote. */
export const quoteDeclinedEmail = (facts: DepositFacts, to: string[], reason?: string) =>
  staffEmail({
    to,
    facts,
    replyTo: facts.email,
    subject: `Quote declined: ${facts.couple}, ${longDate(facts.date)}`,
    eyebrow: "Quote declined",
    title: "The quote was <em>declined</em>",
    lines: [
      `${facts.couple} declined their quote on the booking page. Their enquiry is now Withdrawn, and the date is free for others.`,
      reason ? `Their reason: "${reason}"` : "They didn't give a reason.",
    ],
    kind: "quote-declined",
  })

/** A quote ran out unpaid: someone should follow up. */
export const quoteExpiredStaffEmail = (facts: DepositFacts, to: string[]) =>
  staffEmail({
    to,
    facts,
    replyTo: facts.email,
    subject: `Quote expired: ${facts.couple}, ${longDate(facts.date)}`,
    eyebrow: "Needs a follow-up",
    title: "A quote has <em>run out</em>",
    lines: [
      `${facts.couple}'s quote ${facts.reference} ran out without a deposit, so it's now Expired and their enquiry is back in In Discussion. They've been told.`,
      "Worth a call or an email: send a new quote, or close the enquiry if they're not going ahead. Replying to this email reaches them.",
    ],
    kind: "quote-expired-staff",
  })
