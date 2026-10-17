// POST /api/waitlist: someone asks to hear if a booked wedding date frees up
// (the calendar's "notify me" popover). Stores them in Sanity, unconfirmed,
// and emails a link to confirm: until they click it, they'll never be
// emailed about the date, since anyone could type someone else's address.
//
// Refused: a date that isn't booked (enquire instead), and more active
// sign-ups per address than the wedding policy allows (spam).

import type { APIRoute } from "astro"
import { WAITLIST_WORDING } from "@data/enquiry"
import { json, looksLikeABot, readFormPost } from "@lib/api/requests"
import { statusOnDate } from "@lib/availability/status-on-date"
import { sendEmail } from "@lib/email/send"
import { waitlistConfirmEmail } from "@lib/email/waitlist-emails"
import { getWriteClient } from "@lib/sanity/write-client"
import { newToken } from "@lib/tokens"
import { validateWaitlistSignup } from "@lib/waitlist/validate"

export const prerender = false

/** A name and an email take a person a few seconds at least. */
const MINIMUM_SECONDS_TO_FILL = 2

/** Used where the wedding policy doesn't say. */
const DEFAULT_CAP_PER_EMAIL = 8
const DEFAULT_RETENTION_MONTHS = 36

export const POST: APIRoute = async ({ request }) => {
  const post = await readFormPost(request)
  if ("refusal" in post) return post.refusal
  const { body } = post

  if (looksLikeABot(body, MINIMUM_SECONDS_TO_FILL)) return json(201, { ok: true })

  const result = validateWaitlistSignup(body)
  if (!result.ok) return json(400, { error: result.error })
  const { signup } = result

  const client = getWriteClient()
  if (!client) {
    console.error("Waitlist sign-up not stored: SANITY_API_WRITE_TOKEN is not set.")
    return json(503, { error: "The waitlist can't be joined right now." })
  }

  try {
    if ((await statusOnDate(client, signup.date)) !== "taken") {
      return json(409, {
        error: "Good news: this date isn't booked any more. Enquire about it instead.",
      })
    }

    const { existing, activeCount, cap, retentionMonths } = await client.fetch<{
      existing: { _id: string; verifiedAt?: string } | null
      activeCount: number
      cap?: number
      retentionMonths?: number
    }>(
      `{
        "existing": *[_type == "waitlistEntry" && email == $email && eventDate == $date && status == "active"][0]{_id, verifiedAt},
        "activeCount": count(*[_type == "waitlistEntry" && email == $email && status == "active"]),
        "cap": *[_id == "weddingPolicy"][0].waitlistCapPerEmail,
        "retentionMonths": *[_id == "weddingPolicy"][0].retentionMonths
      }`,
      { email: signup.email, date: signup.date },
    )

    // Already confirmed for this date: nothing to do.
    if (existing?.verifiedAt) return json(200, { ok: true, alreadyOnList: true })

    if (!existing && activeCount >= (cap ?? DEFAULT_CAP_PER_EMAIL)) {
      return json(429, {
        error:
          "That email is already waiting on several dates. Get in touch and we'll help.",
      })
    }

    // A fresh link each time, so an old unconfirmed one stops working.
    const { token, hash } = await newToken()
    const now = new Date()

    if (existing) {
      await client.patch(existing._id).set({ tokenHash: hash }).commit()
    } else {
      const reviewAt = new Date(now)
      reviewAt.setUTCMonth(
        reviewAt.getUTCMonth() + (retentionMonths ?? DEFAULT_RETENTION_MONTHS),
      )

      await client.create({
        // The dot keeps it private, like a booking (lib/enquiries/to-booking.ts).
        _id: `waitlistEntry.${crypto.randomUUID()}`,
        _type: "waitlistEntry",
        eventDate: signup.date,
        email: signup.email,
        ...(signup.name ? { name: signup.name } : {}),
        status: "active",
        tokenHash: hash,
        consent: {
          _type: "consentRecord",
          given: true,
          givenAt: now.toISOString(),
          wording: WAITLIST_WORDING,
          sourcePage: signup.sourcePage,
          retentionReviewAt: reviewAt.toISOString().slice(0, 10),
        },
        sourcePage: signup.sourcePage,
      })
    }

    const confirmation = await sendEmail(
      waitlistConfirmEmail({
        to: signup.email,
        name: signup.name,
        date: signup.date,
        token,
        siteOrigin: new URL(request.url).origin,
      }),
    )

    return json(201, { ok: true, emailSent: confirmation.sent })
  } catch (error) {
    console.error("Waitlist sign-up not stored: Sanity refused it.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
