// Tells everyone confirmed on a wedding date's waitlist that it's free, once
// it really is: another confirmed wedding or a closure can still hold it,
// and then nobody is told.

import type { SanityClient } from "@sanity/client"
import { activeWaitlistForDateQuery } from "@studio/queries/availability"
import { statusOnDate } from "@lib/availability/status-on-date"
import { sendEmail } from "@lib/email/send"
import { waitlistDateFreeEmail } from "@lib/email/waitlist-emails"
import { newToken } from "@lib/tokens"

/** How many people were told. */
export const notifyWaitlist = async (
  client: SanityClient,
  { date, siteOrigin }: { date: string; siteOrigin: string },
) => {
  if ((await statusOnDate(client, date)) === "taken") return 0

  const waiting = await client.fetch<{ _id: string; email: string; name?: string }[]>(
    activeWaitlistForDateQuery,
    { date },
  )

  // One by one, each with a fresh "take me off" link. A failed email leaves
  // that person Active, so they aren't wrongly marked as told.
  let notified = 0
  for (const entry of waiting) {
    const { token, hash } = await newToken()
    const result = await sendEmail(
      waitlistDateFreeEmail({
        to: entry.email,
        name: entry.name,
        date,
        token,
        siteOrigin,
      }),
    )
    if (!result.sent) continue

    await client
      .patch(entry._id)
      .set({ status: "notified", notifiedAt: new Date().toISOString(), tokenHash: hash })
      .commit()
    notified++
  }

  return notified
}
