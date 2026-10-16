// The booking the deposit page shows until it can read a real one. Every
// value is fictional, and the page says so in its oxblood note
// (docs/content/client-facts.md, "Placeholders on the site"). Once bookings
// exist, the page reads the booking its emailed link points to instead, in
// this same shape.
//
// The amounts are written out, not calculated, because they're placeholders.
// Real ones will come from the quote, never from sums done in the page.

export interface BookingLineItem {
  label: string
  amount: string
}

export interface BookingDetail {
  icon: "calendar" | "clock" | "users" | "map-pin"
  label: string
  value: string
}

export const DEMO_BOOKING = {
  couple: "Bertha & Alex",
  quoteReference: "#273521",
  occasion: "wedding day",
  spaces: "the Prince De Redin Hall, Terrace and Secret Garden",
  date: "Sunday, 25 April 2027",

  details: [
    { icon: "calendar", label: "Date", value: "Sunday, 25 April 2027" },
    { icon: "clock", label: "Time", value: "17:00 – 23:00" },
    { icon: "users", label: "Guests", value: "200" },
    { icon: "map-pin", label: "Venue", value: "Prince De Redin Hall, Mdina" },
  ] satisfies BookingDetail[],

  lineItems: [
    { label: "Exclusive use — Hall, Terrace & Secret Garden", amount: "€5,000.00" },
    { label: "Food — Banquet, Dahlia tier", amount: "€17,000.00" },
    { label: "Beverage — Open Bar", amount: "€4,600.00" },
    { label: "Set-up", amount: "€1,150.00" },
  ] satisfies BookingLineItem[],

  subtotal: "€27,750.00",
  discount: "−€2,400.00",
  // Prices include VAT (confirmed by Bacchus), so VAT is the share already
  // inside the total, shown under it, not added on top.
  vat: { label: "Includes VAT (18%)", amount: "€3,866.95" },
  total: "€25,350.00",
  perPerson: "€126.75 per person",

  // The 30/70 split is contested (client-facts.md, "Open conflicts"), so the
  // page's oxblood note names the deposit terms as placeholder too.
  depositTerms: "Your deposit is 30% of the total and is non-refundable once received.",
  deposit: {
    display: "€7,605.00",
    // What the bank-transfer copy button puts on the clipboard: digits only,
    // ready to paste into a banking app's amount field.
    plain: "7605.00",
  },
  balanceNote: "Remaining €17,745.00 due 14 days before your event.",

  // Fake on purpose, with a "don't send funds" warning beside them.
  bankTransfer: {
    accountName: "Bacchus Ltd",
    iban: "MT99 BACC 0000 0000 0000 0000 0000 000",
    reference: "BAC-20270418-0142",
  },
}
