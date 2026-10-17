// A single date's public status ("open", "interest" or "taken"), worked out
// with the same rules as the calendar (sanity/queries/availability.ts). Used
// where one date matters: joining its waitlist, and telling the waitlist
// when it frees up.

import type { SanityClient } from "@sanity/client"
import {
  closureRangesQuery,
  deriveStatuses,
  weddingDateStatusesQuery,
  type AvailabilityInput,
  type AvailabilityStatus,
  type ClosureRange,
} from "@studio/queries/availability"

export const statusOnDate = async (
  client: SanityClient,
  date: string,
): Promise<AvailabilityStatus> => {
  const { bookings, closures } = await client.fetch<{
    bookings: AvailabilityInput[]
    closures: ClosureRange[]
  }>(`{ "bookings": ${weddingDateStatusesQuery}, "closures": ${closureRangesQuery} }`, {
    from: date,
    to: date,
  })

  return deriveStatuses(bookings, closures)[date] ?? "open"
}
