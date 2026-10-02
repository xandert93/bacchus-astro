// Enquiry-form copy shared by every page's wizard.
//
// CHIP_NOTES duplicates the object of the same name in main.js, which swaps
// the note when a visitor changes chip. Both must stay in step until main.js
// is split up and can import this file instead.

export const EVENT_TYPES = ["Wedding", "Corporate", "Celebration", "Other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const CHIP_NOTES: Record<EventType, string> = {
  Wedding:
    "We host just one wedding a day, so your date is entirely yours — take a look below.",
  Corporate:
    "Two weeks' notice gives us time to prepare everything properly for your corporate event.",
  Celebration:
    "Two weeks' notice gives us time to make sure your celebration feels just right on the day.",
  Other:
    "Whatever you have in mind, we'd love to hear about it and follow up with you directly.",
};
