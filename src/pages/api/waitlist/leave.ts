// POST /api/waitlist/leave: the "Take me off the list" link in every
// waitlist email, sent from the /waitlist page's button. The entry is kept,
// marked Unsubscribed, so staff can see they left and nothing is sent again.

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

    if (entry.status !== "unsubscribed") {
      await client.patch(entry._id).set({ status: "unsubscribed" }).commit()
    }

    return json(200, { ok: true, date: entry.eventDate })
  } catch (error) {
    console.error("Waitlist removal not stored.", error)
    return json(502, { error: "Something went wrong. Please try again." })
  }
}
