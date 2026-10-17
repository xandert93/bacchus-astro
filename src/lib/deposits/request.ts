// What every deposit-page endpoint does first: read the post, find the quote
// from the link's token, and have a client that can write.

import type { SanityClient } from "@sanity/client"
import { json, readFormPost } from "@lib/api/requests"
import { getWriteClient } from "@lib/sanity/write-client"
import { loadDepositByToken, type DepositRecord } from "./load"

type Found = {
  client: SanityClient
  record: DepositRecord
  body: Record<string, unknown>
  token: string
}

/** The quote behind a deposit-page request, or the response to send instead. */
export const findDeposit = async (
  request: Request,
): Promise<Found | { refusal: Response }> => {
  const post = await readFormPost(request)
  if ("refusal" in post) return post

  const client = getWriteClient()
  if (!client) {
    console.error("Deposit request refused: SANITY_API_WRITE_TOKEN is not set.")
    return { refusal: json(503, { error: "This page can't load right now." }) }
  }

  const record = await loadDepositByToken(client, post.body.token)
  if (!record?.booking) {
    return { refusal: json(404, { error: "This link isn't valid any more." }) }
  }

  return { client, record, body: post.body, token: String(post.body.token) }
}
