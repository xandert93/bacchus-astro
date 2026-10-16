/**
 * A quote's figures, worked out from its lines.
 *
 * Bacchus's prices include VAT (confirmed by email), so VAT is the share
 * already inside the total, not an amount added on top. Everything is summed
 * in whole cents, because adding euros as decimals drifts by a cent here and
 * there (0.1 + 0.2 is not 0.3 in JavaScript).
 *
 * Pure on purpose, with no Sanity in it, so it can be unit tested once Vitest
 * is set up.
 */

export type QuoteLineInput = {
  _key: string
  quantity?: number
  unitAmount?: number
  amount?: number
}

export type QuoteTotalsInput = {
  lineItems?: QuoteLineInput[]
  discountAmount?: number
  vatRate?: number
  guestCount?: number
  depositPercent?: number
}

const toCents = (euros: number) => Math.round(euros * 100)

const toEuros = (cents: number) => cents / 100

/** A line priced per unit totals itself; a flat fee keeps the amount typed in. */
export const lineAmount = (line: QuoteLineInput) =>
  line.quantity !== undefined && line.unitAmount !== undefined
    ? toEuros(Math.round(line.quantity * toCents(line.unitAmount)))
    : line.amount

export const calculateQuoteTotals = ({
  lineItems = [],
  discountAmount = 0,
  vatRate,
  guestCount,
  depositPercent,
}: QuoteTotalsInput) => {
  const lineAmounts = lineItems.map((line) => ({
    _key: line._key,
    amount: lineAmount(line),
  }))

  const subtotalCents = lineAmounts.reduce(
    (sum, line) => sum + toCents(line.amount ?? 0),
    0,
  )
  const totalCents = subtotalCents - toCents(discountAmount)

  return {
    lineAmounts,
    subtotal: toEuros(subtotalCents),
    total: toEuros(totalCents),
    vatAmount:
      vatRate === undefined
        ? undefined
        : toEuros(Math.round((totalCents * vatRate) / (100 + vatRate))),
    perPerson: guestCount ? toEuros(Math.round(totalCents / guestCount)) : undefined,
    depositAmount:
      depositPercent === undefined
        ? undefined
        : toEuros(Math.round((totalCents * depositPercent) / 100)),
  }
}
