// Sends one email through Resend (resend.com), from server code only. Every
// email the site sends goes through here, so the sender, the reply-to address
// and the test redirect are decided once.

import { EMAIL_FROM, EMAIL_TEST_RECIPIENT, RESEND_API_KEY } from "astro:env/server"
import { CONTACT } from "@data/contact"

export interface Email {
  to: string
  subject: string
  html: string
  text: string
  /** Names the email in Resend's logs, e.g. "enquiry-confirmation". */
  kind: string
}

/**
 * Sends the email. Resolves to whether it went: an email failing must never
 * undo what the visitor did (an enquiry is still stored), so this never
 * throws. The reason is logged for the Worker's logs instead.
 */
export const sendEmail = async ({ to, subject, html, text, kind }: Email) => {
  if (!RESEND_API_KEY) {
    console.error(`Email "${kind}" not sent: RESEND_API_KEY is not set.`)
    return false
  }

  // Locally, every email goes to the developer instead of the real person.
  const recipient = EMAIL_TEST_RECIPIENT || to
  const testSubject = EMAIL_TEST_RECIPIENT ? `[Test for ${to}] ${subject}` : subject

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
        // Replies reach the events team, whoever the email came from.
        reply_to: CONTACT.email.display,
        subject: testSubject,
        html,
        text,
        tags: [{ name: "kind", value: kind }],
      }),
    })

    if (!response.ok) {
      console.error(
        `Email "${kind}" not sent: Resend answered ${response.status}.`,
        await response.text(),
      )
      return false
    }

    return true
  } catch (error) {
    console.error(`Email "${kind}" not sent: Resend couldn't be reached.`, error)
    return false
  }
}
