// POST /api/deposits/transfer-sent: the client presses "I've sent the
// transfer". Records an Awaiting bank-transfer payment on the booking and
// tells staff to look for it. Staff then set it to Received in the Studio
// when it reaches the account, which confirms the booking
// (src/pages/api/booking-events.ts).

import type { APIRoute } from "astro"
import { json } from "@lib/api/requests"
import { findDeposit } from "@lib/deposits/request"
import { depositFacts } from "@lib/deposits/load"
import { toDepositView } from "@lib/deposits/view"
import { transferNoticeEmail } from "@lib/email/deposit-emails"
import { sendEmail } from "@lib/email/send"
import { fetchStaffRecipients } from "@lib/email/staff"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const found = await findDeposit(request)
    if ("refusal" in found) return found.refusal
    const { client, record } = found

    // Only once, and only while the deposit is due.
    if (toDepositView(record).state !== "pay") {
      return json(409, { error: "This deposit isn't due any more." })
    }

    await client
      .patch(record.booking._id)
      .setIfMissing({ payments: [] })
      .append("payments", [
        {
          _type: "paymentRecord",
          _key: crypto.randomUUID().slice(0, 12),
          method: "bank-transfer",
          kind: "deposit",
          status: "awaiting",
          amounts: { gross: record.pricing.deposit.amount },
          reference: record.reference,
          note: "The client says they've sent this transfer.",
        },
      ])
      .commit()

    await sendEmail(
      transferNoticeEmail(depositFacts(record), await fetchStaffRecipients(client)),
    )

    return json(200, { ok: true })
  } catch (error) {
    console.error("Transfer notice not recorded.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
