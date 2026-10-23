// POST /api/quote-events: Sanity calls this when staff set a quote from Draft
// to Sent and publish (a webhook set up in sanity.io/manage; see
// docs/planning/sanity-rollout.md, step 7). It makes the quote's private
// deposit-page link, gives the quote an end date if staff didn't (the
// wedding policy's days from today), moves the booking to Awaiting Deposit,
// and emails the client their quote with the link. Nothing holds the date:
// the first deposit to arrive secures it (src/lib/deposits/confirm.ts).

import type { APIRoute } from "astro"
import { SANITY_WEBHOOK_SECRET } from "astro:env/server"
import { changeStatus } from "@lib/bookings/status"
import { addDays, todayInMalta } from "@lib/dates"
import { depositFacts, loadDepositByQuoteId } from "@lib/deposits/load"
import { quoteEmail } from "@lib/email/deposit-emails"
import { sendAndLog } from "@lib/email/log"
import { getWriteClient } from "@lib/sanity/write-client"
import { newToken } from "@lib/tokens"
import { verifySanityWebhook } from "@lib/webhooks/sanity"
import { asAttachment, keepQuotePdf, makeQuotePdf } from "@lib/quotes/pdf/quote-pdf"
import { includedSetUpFor, type IncludedSetUpPolicy } from "@studio/lib/includedSetUp"

export const prerender = false

/** Used where the wedding policy doesn't say: what Bacchus's own quotes give. */
const DEFAULT_QUOTE_VALID_DAYS = 30

/** The webhook's projection, set in Sanity's dashboard. */
interface QuoteChange {
  _id?: string
  before?: string
  after?: string
}

export const POST: APIRoute = async ({ request }) => {
  if (!SANITY_WEBHOOK_SECRET) {
    console.error("Quote change ignored: SANITY_WEBHOOK_SECRET is not set.")
    return new Response(null, { status: 503 })
  }

  // The raw text, not parsed JSON: the signature covers the exact bytes.
  const rawBody = await request.text()
  if (!(await verifySanityWebhook(rawBody, request.headers, SANITY_WEBHOOK_SECRET))) {
    return new Response(null, { status: 401 })
  }

  const change = JSON.parse(rawBody) as QuoteChange
  if (change.before !== "draft" || change.after !== "sent" || !change._id) {
    return new Response(null, { status: 204 })
  }

  const client = getWriteClient()
  if (!client) return new Response(null, { status: 503 })

  try {
    const record = await loadDepositByQuoteId(client, change._id)
    if (!record?.booking) {
      console.error(`Quote ${change._id} sent without a booking.`)
      return new Response(null, { status: 204 })
    }

    const policy = await client.fetch<{
      quoteValidDays?: number
      includedSetUp?: IncludedSetUpPolicy
    } | null>(
      `*[_id == "weddingPolicy"][0]{"quoteValidDays": deposit.quoteValidDays, includedSetUp}`,
    )
    const validDays = policy?.quoteValidDays ?? DEFAULT_QUOTE_VALID_DAYS
    const includedSetUp = includedSetUpFor(record.event.guestCount, policy?.includedSetUp)
    const validUntil = record.terms?.validUntil ?? addDays(todayInMalta(), validDays)
    const { token, hash } = await newToken()
    const openStatuses = ["new", "in-discussion"]

    await client
      .transaction()
      // A fresh send replaces any earlier links, and allows a fresh reminder.
      .patch(record._id, (patch) =>
        patch.unset(["reminderSentAt"]).set({
          depositTokenHashes: [hash],
          sentAt: new Date().toISOString(),
          "terms.validUntil": validUntil,
          // Kept with the quote, so a later policy change can't rewrite it.
          ...(includedSetUp ? { includedSetUp } : {}),
        }),
      )
      .patch(record.booking._id, (patch) => {
        const linked = patch.set({ quote: { _type: "reference", _ref: record._id } })

        return openStatuses.includes(record.booking.status)
          ? changeStatus(linked, {
              from: record.booking.status,
              to: "awaiting-deposit",
              actor: "staff",
              reason: `Quote ${record.reference} sent.`,
            })
          : linked
      })
      .commit()

    // The PDF, as sent: kept on the quote and attached to the email. A
    // failure here mustn't stop the quote going out, so the email goes
    // without it and the error is logged.
    const pdf = await makeQuotePdf({
      ...record,
      sentAt: new Date().toISOString(),
      terms: { ...record.terms, validUntil },
      ...(includedSetUp ? { includedSetUp } : {}),
    }).catch((error) => {
      console.error(`Quote ${record.reference}: PDF not made.`, error)
      return null
    })
    if (pdf) {
      await keepQuotePdf(client, record._id, pdf).catch((error) =>
        console.error(`Quote ${record.reference}: PDF made but not kept.`, error),
      )
    }

    const depositLink = `${new URL(request.url).origin}/secure-booking?token=${token}`
    const result = await sendAndLog(
      client,
      { bookingId: record.booking._id, audience: "client" },
      {
        ...quoteEmail(depositFacts(record), {
          depositLink,
          validUntil,
          pdfAttached: Boolean(pdf),
        }),
        ...(pdf ? { attachments: [asAttachment(pdf)] } : {}),
      },
    )

    return new Response(JSON.stringify({ emailed: result.sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Quote not sent: Sanity refused a request.", error)
    return new Response(null, { status: 500 })
  }
}
