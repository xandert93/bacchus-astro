// What a quote's end date ("Quote Valid Until") sets off, checked once a day
// by the daily jobs (src/lib/jobs/daily.ts):
//
//   reminder  a couple of days before it, while the deposit is still due: an
//             email with a fresh link to the same deposit page. Only a hash
//             of each link is stored, so the first email's link can't be
//             sent again; both links work.
//   expiry    once it has passed with no deposit paid or on its way: the
//             quote becomes Expired, the enquiry goes back to In Discussion
//             for staff to follow up, and the client and staff are emailed.
//
// The reminder is recorded on the quote (`reminderSentAt`) and expiry
// changes its status, so a second run never repeats either.

import type { SanityClient } from "@sanity/client"
import { OPEN_ENQUIRY_STATUSES } from "@studio/lib/constants"
import { changeStatus } from "@lib/bookings/status"
import { addDays, todayInMalta } from "@lib/dates"
import {
  quoteExpiredEmail,
  quoteExpiredStaffEmail,
  quoteReminderEmail,
} from "@lib/email/deposit-emails"
import { longDate } from "@lib/dates"
import { sendAndLog } from "@lib/email/log"
import { fetchStaffRecipients } from "@lib/email/staff"
import { newToken } from "@lib/tokens"
import {
  depositFacts,
  depositPayment,
  loadDepositByQuoteId,
  type DepositRecord,
} from "./load"

/** How many days before a quote's end date the reminder goes. */
export const REMINDER_DAYS_BEFORE = 2

const SENT_QUOTE_IDS = /* groq */ `*[
  _type == "quote" && status == "sent" && defined(terms.validUntil) &&
  !(_id in path("drafts.**"))
]._id`

const remind = async (
  client: SanityClient,
  record: DepositRecord,
  { siteOrigin, validUntil }: { siteOrigin: string; validUntil: string },
) => {
  const { token, hash } = await newToken()

  // Recorded before sending, so a failed send isn't retried every day. The
  // Email Log shows whether it went.
  await client
    .patch(record._id)
    .setIfMissing({ depositTokenHashes: [] })
    .append("depositTokenHashes", [hash])
    .set({ reminderSentAt: new Date().toISOString() })
    .commit()

  await sendAndLog(
    client,
    { bookingId: record.booking._id, audience: "client" },
    quoteReminderEmail(depositFacts(record), {
      depositLink: `${siteOrigin}/secure-booking?token=${token}`,
      validUntil,
    }),
  )
}

const expire = async (
  client: SanityClient,
  record: DepositRecord,
  { validUntil }: { validUntil: string },
) => {
  const { booking } = record
  const transaction = client
    .transaction()
    .patch(record._id, (patch) => patch.set({ status: "expired" }))

  if (booking.status === "awaiting-deposit") {
    transaction.patch(booking._id, (patch) =>
      changeStatus(patch, {
        from: booking.status,
        to: "in-discussion",
        actor: "cron",
        reason: `Quote ${record.reference} expired: it was valid until ${longDate(validUntil)}, and no deposit was paid.`,
      }),
    )
  }

  await transaction.commit()

  const facts = depositFacts(record)
  await Promise.all([
    sendAndLog(
      client,
      { bookingId: booking._id, audience: "client" },
      quoteExpiredEmail(facts, { validUntil }),
    ),
    sendAndLog(
      client,
      { bookingId: booking._id, audience: "staff" },
      quoteExpiredStaffEmail(facts, await fetchStaffRecipients(client)),
    ),
  ])
}

export const runQuoteDeadlines = async (
  client: SanityClient,
  { siteOrigin }: { siteOrigin: string },
) => {
  const today = todayInMalta()
  const remindFrom = addDays(today, REMINDER_DAYS_BEFORE)
  const reminded: string[] = []
  const expired: string[] = []

  for (const id of await client.fetch<string[]>(SENT_QUOTE_IDS)) {
    // One quote failing mustn't stop the rest.
    try {
      const record = await loadDepositByQuoteId(client, id)
      const validUntil = record?.terms?.validUntil
      if (!record?.booking || !validUntil) continue

      // A deposit paid or on its way, or an enquiry already closed or
      // confirmed: the end date no longer matters.
      const settled =
        depositPayment(record, "received") ||
        depositPayment(record, "awaiting") ||
        !(OPEN_ENQUIRY_STATUSES as readonly string[]).includes(record.booking.status)
      if (settled) continue

      if (validUntil < today) {
        await expire(client, record, { validUntil })
        expired.push(record.reference)
      } else if (!record.reminderSentAt && validUntil <= remindFrom) {
        await remind(client, record, { siteOrigin, validUntil })
        reminded.push(record.reference)
      }
    } catch (error) {
      console.error(`Quote deadline not handled for ${id}.`, error)
    }
  }

  return { reminded, expired }
}
