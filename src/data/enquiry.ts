// Enquiry-form copy shared by every page's wizard.
//
// CHIP_NOTES is read by both EnquirySection.astro (the note rendered on the
// server for the page's default event type) and enquiry.js (the note swapped
// in when a visitor changes chip). Kept close in length to each other on
// purpose (79-88 characters): they swap in place, and very different lengths
// wrapped to different line counts, causing layout shift on every switch.

export const EVENT_TYPES = ["Wedding", "Corporate", "Celebration", "Other"] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const CHIP_NOTES: Record<EventType, string> = {
  Wedding:
    "We host just one wedding a day, so your date is entirely yours — take a look below.",
  Corporate:
    "Two weeks' notice gives us time to prepare everything properly for your corporate event.",
  Celebration:
    "Two weeks' notice gives us time to make sure your celebration feels just right on the day.",
  Other:
    "Whatever you have in mind, we'd love to hear about it and follow up with you directly.",
}
