// Sends one email through Resend (resend.com), from server code only. Every
// email the site sends goes through here, so the sender, the default reply-to
// address and the test redirect are decided once.

import { EMAIL_FROM, EMAIL_TEST_RECIPIENT, RESEND_API_KEY } from "astro:env/server"
import { CONTACT } from "@data/contact"

export interface Email {
  to: string | string[]
  subject: string
  html: string
  text: string
  /** Names the email in Resend's logs and webhooks, e.g. "enquiry-confirmation". */
  kind: string
  /** Where a reply goes. Bacchus's events address unless a template says otherwise. */
  replyTo?: string
  /**
   * Extra labels Resend sends back with this email's events (a bounce, say),
   * e.g. `{ booking: "<id>" }`. Letters, numbers, - and _ only.
   */
  tags?: Record<string, string>
}

export interface SendResult {
  sent: boolean
  /** Resend's id for the email, when it was accepted. */
  id?: string
}

/**
 * Sends the email. An email failing must never undo what the visitor did
 * (an enquiry is still stored), so this never throws: it reports whether
 * Resend accepted the email, and logs why not for the Worker's logs.
 *
 * "Accepted" isn't "delivered": an address that doesn't exist bounces
 * minutes later, which Resend reports to src/pages/api/email-events.ts.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  kind,
  replyTo = CONTACT.email.display,
  tags = {},
}: Email): Promise<SendResult> => {
  if (!RESEND_API_KEY) {
    console.error(`Email "${kind}" not sent: RESEND_API_KEY is not set.`)
    return { sent: false }
  }

  // Locally, every email goes to the developer instead of the real person.
  const realRecipients = [to].flat().join(", ")
  const recipient = EMAIL_TEST_RECIPIENT || to
  const testSubject = EMAIL_TEST_RECIPIENT
    ? `[Test for ${realRecipients}] ${subject}`
    : subject

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: recipient,
        reply_to: replyTo,
        subject: testSubject,
        html,
        text,
        tags: Object.entries({ kind, ...tags }).map(([name, value]) => ({ name, value })),
      }),
    })

    if (!response.ok) {
      console.error(
        `Email "${kind}" not sent: Resend answered ${response.status}.`,
        await response.text(),
      )
      return { sent: false }
    }

    const { id } = (await response.json()) as { id?: string }

    return { sent: true, id }
  } catch (error) {
    console.error(`Email "${kind}" not sent: Resend couldn't be reached.`, error)
    return { sent: false }
  }
}
