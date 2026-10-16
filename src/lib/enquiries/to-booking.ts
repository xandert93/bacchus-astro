// Turns a checked enquiry into the booking document Sanity stores: status
// "new", its first status-history entry, and the consent record. The shape
// is the booking schema's (sanity/schemaTypes/bookings/booking.document.ts).
//
// Pure, so it can be unit tested once Vitest is set up.

import { CONSENT_WORDING } from "@data/enquiry"
import type { EnquiryInput } from "./validate"

/** Months a person's details are kept before review, if the policy is empty. */
const FALLBACK_RETENTION_MONTHS = 36

interface BookingContext {
  /** Sanity ids of the venue spaces the enquirer chose, by slug. */
  spaceIds: string[]
  retentionMonths?: number
  now?: Date
}

const reference = (id: string, key: string) => ({
  _type: "reference",
  _ref: id,
  _key: key,
})

export const toBooking = (
  enquiry: EnquiryInput,
  { spaceIds, retentionMonths, now = new Date() }: BookingContext,
) => {
  const reviewAt = new Date(now)
  reviewAt.setUTCMonth(
    reviewAt.getUTCMonth() + (retentionMonths ?? FALLBACK_RETENTION_MONTHS),
  )

  return {
    // The dot keeps the document private: Sanity never shows a document
    // whose id contains one to anybody who isn't logged in, even if the
    // dataset were ever made public.
    _id: `booking.${crypto.randomUUID()}`,
    _type: "booking",
    status: "new",
    statusHistory: [
      {
        _type: "statusEvent",
        _key: "created",
        to: "new",
        at: now.toISOString(),
        actor: "visitor",
      },
    ],
    client: {
      firstName: enquiry.firstName,
      lastName: enquiry.lastName,
      email: enquiry.email,
      phone: enquiry.phone,
      contactPreference: enquiry.contactPreference,
    },
    event: {
      type: enquiry.eventType,
      date: enquiry.date,
      dateIsFlexible: false,
      ...(enquiry.backupDate ? { backupDate: enquiry.backupDate } : {}),
      guestCount: enquiry.guests,
      ...(spaceIds.length
        ? { spaces: spaceIds.map((id, index) => reference(id, `space-${index}`)) }
        : {}),
      spacesGuidanceRequested: enquiry.guidanceOnSpaces,
      ...(enquiry.style ? { style: enquiry.style } : {}),
    },
    ...(enquiry.message ? { message: enquiry.message } : {}),
    consent: {
      _type: "consentRecord",
      given: true,
      givenAt: now.toISOString(),
      wording: CONSENT_WORDING,
      sourcePage: enquiry.sourcePage,
      retentionReviewAt: reviewAt.toISOString().slice(0, 10),
    },
    sourcePage: enquiry.sourcePage,
  }
}
