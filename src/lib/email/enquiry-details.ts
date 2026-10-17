// An enquiry as label-and-answer rows, in words people read ("Saturday 20
// January 2027", "Prince De Redin Hall") rather than the stored values. One
// list, used by both the enquirer's confirmation and the staff alert, so the
// two always show the same thing.

import { EVENT_STYLE_OPTIONS, NOT_SURE_OF_SPACES, SPACE_OPTIONS } from "@data/enquiry"
import type { EnquiryInput } from "@lib/enquiries/validate"

/** "Saturday 20 January 2027", from "2027-01-20". */
export const longDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

const titleOf = (options: { value: string; title: string }[], value?: string) =>
  options.find((option) => option.value === value)?.title

export const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export const enquiryDetails = (
  enquiry: EnquiryInput,
  { messageLabel = "Message" } = {},
): [string, string | undefined][] => {
  const spaces = [
    ...enquiry.spaces.map((space) => titleOf(SPACE_OPTIONS, space) ?? space),
    ...(enquiry.guidanceOnSpaces ? [titleOf(SPACE_OPTIONS, NOT_SURE_OF_SPACES)] : []),
  ].join(", ")

  return [
    ["Occasion", capitalise(enquiry.eventType)],
    ["Preferred date", longDate(enquiry.date)],
    ["Alternative date", enquiry.backupDate ? longDate(enquiry.backupDate) : undefined],
    ["Guests", `${enquiry.guests} expected`],
    ["Spaces", spaces || undefined],
    ["Style", titleOf(EVENT_STYLE_OPTIONS, enquiry.style)],
    [messageLabel, enquiry.message],
    ["Name", `${enquiry.firstName} ${enquiry.lastName}`],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone],
    ["Contact by", enquiry.contactPreference],
  ]
}
