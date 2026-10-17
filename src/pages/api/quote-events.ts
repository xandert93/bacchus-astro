// POST /api/quote-events: Sanity calls this when staff set a quote from Draft
// to Sent and publish (a webhook set up in sanity.io/manage; see
// docs/planning/sanity-rollout.md, step 7). It makes the quote's private
// deposit-page link, holds the date (the booking becomes Awaiting Deposit,
// held for the wedding policy's hold period), and emails the client their
// quote with the link.

import type { APIRoute } from "astro"
import { SANITY_WEBHOOK_SECRET } from "astro:env/server"
import { changeStatus } from "@lib/bookings/status"
import { depositFacts, loadDepositByQuoteId } from "@lib/deposits/load"
import { quoteEmail } from "@lib/email/deposit-emails"
import { sendEmail } from "@lib/email/send"
import { getWriteClient } from "@lib/sanity/write-client"
import { newToken } from "@lib/tokens"
import { verifySanityWebhook } from "@lib/webhooks/sanity"

export const prerender = false

/** Used where the wedding policy doesn't say. */
const DEFAULT_HOLD_DAYS = 7

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

    const holdDays =
      (await client.fetch<number | null>(
        `*[_id == "weddingPolicy"][0].deposit.holdDays`,
      )) ?? DEFAULT_HOLD_DAYS
    const holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000).toISOString()
    const { token, hash } = await newToken()
    const openStatuses = ["new", "in-discussion"]

    await client
      .transaction()
      .patch(record._id, (patch) =>
        patch.set({ depositTokenHash: hash, sentAt: new Date().toISOString() }),
      )
      .patch(record.booking._id, (patch) => {
        const held = patch.set({
          quote: { _type: "reference", _ref: record._id },
          depositHoldExpiresAt: holdUntil,
        })

        return openStatuses.includes(record.booking.status)
          ? changeStatus(held, {
              from: record.booking.status,
              to: "awaiting-deposit",
              actor: "staff",
              reason: `Quote ${record.reference} sent.`,
            })
          : held
      })
      .commit()

    const depositLink = `${new URL(request.url).origin}/secure-booking?token=${token}`
    const result = await sendEmail(
      quoteEmail(depositFacts(record), {
        depositLink,
        holdUntil: holdUntil.slice(0, 10),
      }),
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
