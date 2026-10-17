// What happens when a deposit arrives, however it came (a card payment, or
// staff marking a bank transfer Received): the booking is confirmed, its
// quote accepted, and everyone is told.
//
// Weddings are one a day, and several couples can enquire about a date: the
// first deposit wins it. So for a wedding, a deposit for a date someone else
// already secured doesn't confirm anything (staff are asked to sort a refund
// or another date), and the others who'd enquired about a date that's just
// been won are declined and told.

import type { SanityClient } from "@sanity/client"
import { competingEnquiriesQuery } from "@studio/queries/availability"
import { statusOnDate } from "@lib/availability/status-on-date"
import { changeStatus } from "@lib/bookings/status"
import {
  dateTakenEmail,
  depositConfirmedEmail,
  depositReceivedStaffEmail,
  paidButTakenEmail,
} from "@lib/email/deposit-emails"
import { sendEmail } from "@lib/email/send"
import { fetchStaffRecipients } from "@lib/email/staff"
import { depositFacts, type DepositRecord } from "./load"

export type ConfirmOutcome = "confirmed" | "already-confirmed" | "date-taken"

export const confirmDeposit = async (
  client: SanityClient,
  record: DepositRecord,
  { actor, siteOrigin }: { actor: "staff" | "payment-webhook"; siteOrigin: string },
): Promise<ConfirmOutcome> => {
  const { booking } = record
  if (["confirmed", "completed"].includes(booking.status)) return "already-confirmed"

  const facts = depositFacts(record)
  const staff = await fetchStaffRecipients(client)
  const isWedding = booking.event.type === "wedding"

  if (isWedding && (await statusOnDate(client, record.event.date)) === "taken") {
    await sendEmail(paidButTakenEmail(facts, staff))
    return "date-taken"
  }

  await client
    .transaction()
    .patch(booking._id, (patch) =>
      changeStatus(patch, { from: booking.status, to: "confirmed", actor }),
    )
    .patch(record._id, (patch) => patch.set({ status: "accepted" }))
    .commit()

  if (isWedding) {
    const competing = await client.fetch<
      { _id: string; status: string; client: { firstName: string; email: string } }[]
    >(competingEnquiriesQuery, { date: record.event.date, winnerId: booking._id })

    for (const enquiry of competing) {
      await changeStatus(client.patch(enquiry._id), {
        from: enquiry.status,
        to: "declined",
        actor,
        reason: "Another couple paid the deposit for this date first.",
      }).commit()
      await sendEmail(
        dateTakenEmail({
          to: enquiry.client.email,
          firstName: enquiry.client.firstName,
          date: record.event.date,
          enquireLink: `${siteOrigin}/weddings#availability`,
        }),
      )
    }
  }

  await Promise.all([
    sendEmail(depositConfirmedEmail(facts)),
    sendEmail(depositReceivedStaffEmail(facts, staff)),
  ])

  return "confirmed"
}
