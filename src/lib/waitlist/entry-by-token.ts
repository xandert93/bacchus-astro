// Finds the waitlist entry a link's token belongs to: shared by the
// "confirm" and "take me off" endpoints.

import type { SanityClient } from "@sanity/client"
import { hashToken } from "@lib/tokens"

export interface WaitlistEntryRef {
  _id: string
  eventDate: string
  status: string
  verifiedAt?: string
}

export const entryByToken = async (client: SanityClient, token: unknown) =>
  typeof token === "string" && token
    ? client.fetch<WaitlistEntryRef | null>(
        `*[_type == "waitlistEntry" && tokenHash == $hash][0]{_id, eventDate, status, verifiedAt}`,
        { hash: await hashToken(token) },
      )
    : null
