// Every email about a booking goes through `sendAndLog`: it sends the email,
// then records it in the booking's Email Log in the Studio (what went, to
// whom, when, and whether Resend accepted it). A bounce reported later marks
// its entry (src/pages/api/email-events.ts), which is why each email is
// tagged with its booking and entry.
//
// The log is written after sending and can never fail the caller: a missing
// log line is better than a missing email. Waitlist emails aren't about a
// booking, so they use sendEmail directly.

import type { SanityClient } from "@sanity/client"
import { sendEmail, type Email, type SendResult } from "./send"

/** Who an email was for, as the Studio shows it. */
export type EmailAudience = "client" | "staff"

/**
 * A booking id as a Resend tag, which allows only letters, numbers, - and _:
 * "booking.abc" becomes "abc". The bounce handler puts the prefix back.
 */
export const bookingTag = (bookingId: string) => bookingId.replace(/^booking\./, "")

export const sendAndLog = async (
  client: SanityClient,
  { bookingId, audience }: { bookingId: string; audience: EmailAudience },
  email: Email,
): Promise<SendResult> => {
  const entryKey = crypto.randomUUID().replace(/-/g, "").slice(0, 12)

  const result = await sendEmail({
    ...email,
    tags: { ...email.tags, booking: bookingTag(bookingId), entry: entryKey },
  })

  try {
    await client
      .patch(bookingId)
      .setIfMissing({ emailLog: [] })
      .append("emailLog", [
        {
          _type: "emailLogEntry",
          _key: entryKey,
          kind: email.kind,
          audience,
          to: [email.to].flat().join(", "),
          subject: email.subject,
          sentAt: new Date().toISOString(),
          status: result.sent ? "sent" : "failed",
          ...(result.id ? { resendId: result.id } : {}),
        },
      ])
      .commit()
  } catch (error) {
    console.error(`Email "${email.kind}" sent but not logged on ${bookingId}.`, error)
  }

  return result
}
