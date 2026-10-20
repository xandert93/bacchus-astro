// Bacchus as a business, for receipts (the deposit confirmation email).
// Its registered name and VAT number aren't confirmed yet (asked:
// docs/content/client-facts.md, "Receipts and VAT invoices"), so they're
// left out until they are: a receipt shows only what's set here.

import { ADDRESS_LINE } from "./contact"

export const BUSINESS: {
  tradingName: string
  /** The registered company name, if it differs from the trading name. */
  legalName?: string
  vatNumber?: string
  address: string
} = {
  tradingName: "Bacchus",
  address: ADDRESS_LINE,
}
