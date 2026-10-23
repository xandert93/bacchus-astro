// A second go at the PDF of a quote whose PDF couldn't be made when it was
// sent (src/pages/api/quote-events.ts sends the email without it then).
// Checked once a day by the daily jobs (src/lib/jobs/daily.ts):
//
//   made       the PDF is kept on the quote and emailed to the client on its
//              own, to keep or to pass on
//   not made   staff are told, so someone can look into it; the client
//              already has their quote email and link
//
// Each quote is tried once: `pdfRetriedAt` is recorded before trying.

import type { SanityClient } from "@sanity/client"
import { addDays, todayInMalta } from "@lib/dates"
import { depositFacts, loadDepositByQuoteId } from "@lib/deposits/load"
import { quotePdfEmail, quotePdfFailedEmail } from "@lib/email/deposit-emails"
import { sendAndLog } from "@lib/email/log"
import { fetchStaffRecipients } from "@lib/email/staff"
import { asAttachment, keepQuotePdf, makeQuotePdf } from "./pdf/quote-pdf"

/** Only quotes sent this recently: an older one missing its PDF predates them. */
const RECENT_DAYS = 7

const QUOTES_MISSING_A_PDF = /* groq */ `*[
  _type == "quote" && status in ["sent", "accepted"] && defined(sentAt) &&
  sentAt >= $since && !defined(pdf.asset) && !defined(pdfRetriedAt) &&
  !(_id in path("drafts.**"))
]._id`

export const runMissingQuotePdfs = async (client: SanityClient) => {
  const made: string[] = []
  const notMade: string[] = []
  const since = addDays(todayInMalta(), -RECENT_DAYS)

  for (const id of await client.fetch<string[]>(QUOTES_MISSING_A_PDF, { since })) {
    // One quote failing mustn't stop the rest.
    try {
      const record = await loadDepositByQuoteId(client, id)
      if (!record?.booking) continue

      // Recorded first, so a failure here isn't tried again every morning.
      await client.patch(id).set({ pdfRetriedAt: new Date().toISOString() }).commit()

      const facts = depositFacts(record)
      const pdf = await makeQuotePdf(record).catch((error) => {
        console.error(`Quote ${record.reference}: PDF not made at the second try.`, error)
        return null
      })

      if (!pdf) {
        await sendAndLog(
          client,
          { bookingId: record.booking._id, audience: "staff" },
          quotePdfFailedEmail(facts, await fetchStaffRecipients(client)),
        )
        notMade.push(record.reference)
        continue
      }

      await keepQuotePdf(client, id, pdf)
      await sendAndLog(
        client,
        { bookingId: record.booking._id, audience: "client" },
        { ...quotePdfEmail(facts), attachments: [asAttachment(pdf)] },
      )
      made.push(record.reference)
    } catch (error) {
      console.error(`Missing PDF not handled for ${id}.`, error)
    }
  }

  return { made, notMade }
}
