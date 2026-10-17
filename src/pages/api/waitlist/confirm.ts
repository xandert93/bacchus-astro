// POST /api/waitlist/confirm: the "Confirm my place" link in the waitlist
// email, sent from the /waitlist page's button. A POST from a button, not
// the link itself: some email services open every link in an email to scan
// it, which would otherwise confirm people who never clicked.

import type { APIRoute } from "astro"
import { json, readFormPost } from "@lib/api/requests"
import { getWriteClient } from "@lib/sanity/write-client"
import { entryByToken } from "@lib/waitlist/entry-by-token"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const post = await readFormPost(request)
  if ("refusal" in post) return post.refusal

  const client = getWriteClient()
  if (!client) return json(503, { error: "This can't be done right now." })

  try {
    const entry = await entryByToken(client, post.body.token)
    if (!entry) return json(404, { error: "That link isn't valid any more." })

    if (entry.status !== "active") {
      return json(410, { error: "This waitlist place has ended.", date: entry.eventDate })
    }

    if (!entry.verifiedAt) {
      await client.patch(entry._id).set({ verifiedAt: new Date().toISOString() }).commit()
    }

    return json(200, { ok: true, date: entry.eventDate })
  } catch (error) {
    console.error("Waitlist confirmation not stored.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
