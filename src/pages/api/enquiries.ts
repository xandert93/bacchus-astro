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
import { enquiryAlertEmail } from "@lib/email/enquiry-alert"
import { enquiryConfirmationEmail } from "@lib/email/enquiry-confirmation"
import { sendAndLog } from "@lib/email/log"
import { getWriteClient } from "@lib/sanity/write-client"
import { json, looksLikeABot, readFormPost } from "@lib/api/requests"
import { STAFF_RECIPIENTS_GROQ, staffRecipientsOrDefault } from "@lib/email/staff"

export const prerender = false

/** Nobody genuine fills in four steps faster than this. */
const MINIMUM_SECONDS_TO_FILL = 3

export const POST: APIRoute = async ({ request }) => {
  const post = await readFormPost(request)
  if ("refusal" in post) return post.refusal
  const { body } = post

  if (looksLikeABot(body, MINIMUM_SECONDS_TO_FILL)) return json(201, { ok: true })

  const result = validateEnquiry(body)
  if (!result.ok) return json(400, { errors: result.errors })

  const client = getWriteClient()
  if (!client) {
    console.error("Enquiry not stored: SANITY_API_WRITE_TOKEN is not set.")
    return json(503, { error: "Enquiries can't be received right now." })
  }

  let booking: ReturnType<typeof toBooking>
  let staffRecipients: string[]

  try {
    const settings = await client.fetch<{
      spaceIds: string[]
      retentionMonths?: number
      staffRecipients?: string[]
    }>(
      `{
        "spaceIds": *[_type == "venueSpace" && slug.current in $slugs && !(_id in path("drafts.**"))]._id,
        "retentionMonths": *[_id == "weddingPolicy"][0].retentionMonths,
        "staffRecipients": ${STAFF_RECIPIENTS_GROQ}
      }`,
      { slugs: result.enquiry.spaces },
    )

    booking = toBooking(result.enquiry, settings)
    staffRecipients = staffRecipientsOrDefault(settings.staffRecipients)

    await client.create(booking)
  } catch (error) {
    console.error("Enquiry not stored: Sanity refused it.", error)
    return json(502, { error: "Your enquiry couldn't be sent. Please try again." })
  }

  // After it's stored, never before: a confirmation must mean the enquiry
  // really is with Bacchus. A failed email doesn't undo the enquiry; the
  // form just doesn't promise a copy. Both go in the booking's Email Log.
  const [confirmation] = await Promise.all([
    sendAndLog(
      client,
      { bookingId: booking._id, audience: "client" },
      enquiryConfirmationEmail(result.enquiry),
    ),
    sendAndLog(
      client,
      { bookingId: booking._id, audience: "staff" },
      enquiryAlertEmail(result.enquiry, {
        bookingId: booking._id,
        recipients: staffRecipients,
      }),
    ),
  ])

  return json(201, { ok: true, emailSent: confirmation.sent })
}
