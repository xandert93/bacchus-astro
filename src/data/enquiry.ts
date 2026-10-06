// The enquiry wizard's options and copy, shared by every page's form.
//
// CHIP_NOTES is read by both EnquirySection.astro (the note rendered on the
// server for the page's default event type) and EnquiryForm.js (the note swapped
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

// Step 2's two option-card questions. Only one shows at a time: tone for a
// wedding, spaces for everything else (EnquiryForm.js swaps them per type).
export interface EnquiryOption {
  // What the enquiry records, and what the review step shows.
  value: string
  title: string
  description: string
}

// Capacity figures here are placeholders until Bacchus confirms them; the
// field's own note says so on the page.
export const SPACE_OPTIONS: EnquiryOption[] = [
  {
    value: "Prince De Redin Hall",
    title: "Prince De Redin Hall",
    description: "Indoor, seats up to 180",
  },
  { value: "The Terrace", title: "The Terrace", description: "Open air, bastion views" },
  {
    value: "The Secret Garden",
    title: "Secret Garden",
    description: "Walled, seats up to 70",
  },
  { value: "Not sure yet", title: "Not sure yet", description: "Guide us on this" },
]

export const EVENT_STYLE_OPTIONS: EnquiryOption[] = [
  {
    value: "Candlelit & ceremonial",
    title: "Candlelit & ceremonial",
    description: "Long tables, warm light and a slow evening.",
  },
  {
    value: "Garden & golden hour",
    title: "Garden & golden hour",
    description: "Open air, relaxed drinks and sunset portraits.",
  },
  {
    value: "Formal & refined",
    title: "Formal & refined",
    description: "A seated service with considered timing.",
  },
  {
    value: "Still exploring",
    title: "Still exploring",
    description: "Let our events team help shape the day.",
  },
]

// Step 3: how to reply. Icons are Font Awesome's solid set, drawn inline.
export interface ChipIcon {
  width: number
  height: number
  viewBox: string
  path: string
}

export const CONTACT_METHODS: { value: string; icon: ChipIcon }[] = [
  {
    value: "Email",
    icon: {
      width: 15,
      height: 15,
      viewBox: "0 0 512 512",
      path: "M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z",
    },
  },
  {
    value: "Phone",
    icon: {
      width: 15,
      height: 15,
      viewBox: "0 0 512 512",
      path: "M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6l-40.4 49.3c-70.4-33.3-127.4-90.3-160.7-160.7l49.3-40.4c13.7-11.2 18.4-30 11.6-46.3l-40-96z",
    },
  },
  {
    value: "WhatsApp",
    icon: {
      width: 14,
      height: 15,
      viewBox: "0 0 448 512",
      path: "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222c0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222c0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2c0-101.7 82.8-184.5 184.6-184.5c49.3 0 95.6 19.2 130.4 54.1c34.8 34.9 56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18.1c-5.1-1.9-8.8-2.8-12.5 2.8c-3.7 5.6-14.3 18.1-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4c-32.6-16.3-54-29.1-75.5-66c-5.7-9.8 5.7-9.1 16.3-30.3c1.8-3.7 .9-6.9-.5-9.7c-1.4-2.8-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5c-3.2-.2-6.9-.2-10.6-.2c-3.7 0-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3c0 27.3 19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8c35.2 15.2 49 16.5 66.6 13.9c10.7-1.6 32.8-13.4 37.4-26.4c4.6-13 4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6z",
    },
  },
]
