// Bacchus as a business, for receipts (the deposit confirmation email).
// The registered name is from Bacchus's own quotes; the VAT number isn't
// confirmed yet (asked: docs/content/client-facts.md, "Receipts and VAT
// invoices"), so it's left out until it is: a receipt shows only what's set
// here.

import { ADDRESS_LINE } from "./contact"

export const BUSINESS: {
  tradingName: string
  /** The registered company name, if it differs from the trading name. */
  legalName?: string
  vatNumber?: string
  address: string
} = {
  tradingName: "Bacchus",
  legalName: "Bacchus Company Limited",
  address: ADDRESS_LINE,
}
