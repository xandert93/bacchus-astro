// POST /api/reviews/submit: the /review page's form. Stores the review as a
// testimonial awaiting review, which nothing shows on the site until a person
// publishes it, then tells staff. One per booking: a second gets a 409.

import type { APIRoute } from "astro"
import { json, readFormPost } from "@lib/api/requests"
import { sendAndLog } from "@lib/email/log"
import { reviewReceivedEmail } from "@lib/email/review-emails"
import { fetchStaffRecipients } from "@lib/email/staff"
import { bookingByReviewToken, fullNames } from "@lib/reviews/booking-by-token"
import { toTestimonial, validateReview } from "@lib/reviews/submission"
import { getWriteClient } from "@lib/sanity/write-client"

export const prerender = false

const ALREADY_SENT = "We already have your review. Thank you!"

export const POST: APIRoute = async ({ request }) => {
  const post = await readFormPost(request)
  if ("refusal" in post) return post.refusal

  const client = getWriteClient()
  if (!client) return json(503, { error: "Your review can't be sent right now." })

  const checked = validateReview(post.body)
  if ("error" in checked) return json(400, { error: checked.error })
  const { review } = checked

  try {
    const booking = await bookingByReviewToken(client, post.body.token)
    if (!booking) return json(404, { error: "That link isn't valid any more." })
    if (booking.reviewSent) return json(409, { error: ALREADY_SENT })

    const testimonial = toTestimonial(review, booking)

    try {
      await client.create(testimonial)
    } catch (error) {
      // Sent twice at once: the id is taken, so the other one won.
      if ((error as { statusCode?: number }).statusCode === 409) {
        return json(409, { error: ALREADY_SENT })
      }
      throw error
    }

    await sendAndLog(
      client,
      { bookingId: booking._id, audience: "staff" },
      reviewReceivedEmail({
        to: await fetchStaffRecipients(client),
        replyTo: booking.email,
        testimonialId: testimonial._id,
        fullName: fullNames(booking),
        displayName: review.displayName,
        date: booking.date,
        rating: review.rating,
        text: review.text,
        publish: review.publish,
      }),
    )

    return json(200, { ok: true })
  } catch (error) {
    console.error("Review not stored.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
