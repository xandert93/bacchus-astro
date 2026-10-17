// POST /api/deposits/decline: the client declines the quote on the deposit
// page, after confirming they mean it. The quote becomes Declined by Client,
// the enquiry Withdrawn (which frees the date for others), and staff are told,
// with the reason if one was given.

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { changeStatus } from "@lib/bookings/status"
import { depositFacts } from "@lib/deposits/load"
import { findDeposit } from "@lib/deposits/request"
import { toDepositView } from "@lib/deposits/view"
import { quoteDeclinedEmail } from "@lib/email/deposit-emails"
import { sendEmail } from "@lib/email/send"
import { fetchStaffRecipients } from "@lib/email/staff"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal
    const { client, record, body } = found

    if (toDepositView(record).state !== "pay") {
      return json(409, { error: "This quote can't be declined any more." })
    }

    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : undefined

    await client
      .transaction()
      .patch(record._id, (patch) => patch.set({ status: "declined" }))
      .patch(record.booking._id, (patch) =>
        changeStatus(patch, {
          from: record.booking.status,
          to: "withdrawn",
          actor: "visitor",
          reason: reason ? `Declined the quote: ${reason}` : "Declined the quote.",
        }),
      )
      .commit()

    await sendEmail(
      quoteDeclinedEmail(
        depositFacts(record),
        await fetchStaffRecipients(client),
        reason,
      ),
    )

    return json(200, { ok: true })
  } catch (error) {
    console.error("Quote decline not recorded.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
