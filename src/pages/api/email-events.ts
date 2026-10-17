// POST /api/email-events: Resend tells us here when an email bounced, i.e.
// the address doesn't exist or won't accept mail. A bounced enquiry
// confirmation is flagged on its enquiry in the Studio, since replying by
// email to that address won't reach anyone.
//
// Set up in Resend's dashboard (Webhooks, event email.bounced), with its
// signing secret as the RESEND_WEBHOOK_SECRET Worker secret
// (docs/planning/sanity-rollout.md, step 6).

import type { APIRoute } from "astro"
import { RESEND_WEBHOOK_SECRET } from "astro:env/server"
import { verifyResendWebhook } from "@lib/webhooks/resend"
import { getWriteClient } from "@lib/sanity/write-client"

export const prerender = false

interface ResendEvent {
  type: string
  created_at: string
  data: {
    tags?: Record<string, string>
    bounce?: { message?: string }
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!RESEND_WEBHOOK_SECRET) {
    console.error("Email event ignored: RESEND_WEBHOOK_SECRET is not set.")
    return new Response(null, { status: 503 })
  }

  // The raw text, not parsed JSON: the signature covers the exact bytes.
  const rawBody = await request.text()
  if (!(await verifyResendWebhook(rawBody, request.headers, RESEND_WEBHOOK_SECRET))) {
    return new Response(null, { status: 401 })
  }

  const event = JSON.parse(rawBody) as ResendEvent
  const { kind, booking } = event.data.tags ?? {}

  // Anything else is acknowledged, so Resend doesn't keep retrying it.
  if (event.type !== "email.bounced" || kind !== "enquiry-confirmation" || !booking) {
    return new Response(null, { status: 204 })
  }

  const client = getWriteClient()
  if (!client) return new Response(null, { status: 503 })

  try {
    await client
      .patch(`booking.${booking}`)
      .set({
        confirmationEmail: {
          status: "bounced",
          at: event.created_at,
          note: event.data.bounce?.message ?? "",
        },
      })
      .commit()
  } catch (error) {
    // A 500 makes Resend retry later, which is what we want if Sanity blipped.
    console.error("Bounce not recorded: Sanity refused it.", error)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
