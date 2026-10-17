// POST /api/enquiries: where the enquiry form sends. Runs on Cloudflare when
// a visitor submits (the rest of the site is static), checks the enquiry and
// stores it in Sanity as a new booking, which then appears in the Studio
// under Enquiries > New.
//
// Spam: a hidden field people never see but bots fill in, and a minimum time
// between the form loading and being sent. Either one quietly answers "sent"
// without storing anything, so a bot learns nothing. A Cloudflare Turnstile
// check is the next step if spam gets through (docs/planning/roadmap.md).

import type { APIRoute } from "astro"
import { toBooking } from "@lib/enquiries/to-booking"
import { validateEnquiry } from "@lib/enquiries/validate"
import { enquiryConfirmationEmail } from "@lib/email/enquiry-confirmation"
import { sendEmail } from "@lib/email/send"
import { getWriteClient } from "@lib/sanity/write-client"

export const prerender = false

/** Nobody genuine fills in four steps faster than this. */
const MINIMUM_SECONDS_TO_FILL = 3

/** An enquiry is a few hundred bytes; anything this big isn't one. */
const MAXIMUM_BODY_BYTES = 10_000

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const looksLikeABot = (body: Record<string, unknown>) => {
  const startedAt = Number(body.startedAt)
  const secondsTaken = (Date.now() - startedAt) / 1000

  return Boolean(body.website) || !startedAt || secondsTaken < MINIMUM_SECONDS_TO_FILL
}

export const POST: APIRoute = async ({ request }) => {
  // Only this site's own pages may send enquiries.
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) {
    return json(403, { error: "Not allowed." })
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAXIMUM_BODY_BYTES) {
    return json(413, { error: "That enquiry is too large." })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json(400, { error: "That enquiry couldn't be read." })
  }

  if (looksLikeABot(body)) return json(201, { ok: true })

  const result = validateEnquiry(body)
  if (!result.ok) return json(400, { errors: result.errors })

  const client = getWriteClient()
  if (!client) {
    console.error("Enquiry not stored: SANITY_API_WRITE_TOKEN is not set.")
    return json(503, { error: "Enquiries can't be received right now." })
  }

  try {
    const { spaceIds, retentionMonths } = await client.fetch<{
      spaceIds: string[]
      retentionMonths?: number
    }>(
      `{
        "spaceIds": *[_type == "venueSpace" && slug.current in $slugs && !(_id in path("drafts.**"))]._id,
        "retentionMonths": *[_id == "weddingPolicy"][0].retentionMonths
      }`,
      { slugs: result.enquiry.spaces },
    )

    await client.create(toBooking(result.enquiry, { spaceIds, retentionMonths }))
  } catch (error) {
    console.error("Enquiry not stored: Sanity refused it.", error)
    return json(502, { error: "Your enquiry couldn't be sent. Please try again." })
  }

  // After it's stored, never before: a confirmation must mean the enquiry
  // really is with Bacchus. A failed email doesn't undo the enquiry; the
  // form just doesn't promise a copy.
  const emailSent = await sendEmail(enquiryConfirmationEmail(result.enquiry))

  return json(201, { ok: true, emailSent })
}
