// How a price stored in Sanity is asked for and printed. The unit names
// come from the Studio's own list, so the two can't drift apart.
import { PRICE_UNITS } from "@studio/lib/constants"

// Spliced into a query as `price{${PRICE_FIELDS}}`.
export const PRICE_FIELDS = `
  amount,
  unit,
  isStartingPrice,
  "isWithheld": provenance.blocksPublication == true
`

export interface SanityPrice {
  amount: number
  unit: string
  isStartingPrice?: boolean
  isWithheld: boolean
}

interface PriceFormat {
  // The stations print every price with cents ("€9.00"); the tiers print
  // whole euros without them ("€53").
  alwaysShowCents?: boolean
}

// "€53", "€10.50", "from €12". Null when there is no price to show: none was
// entered, or it is held back until its source is confirmed (corkage).
export const formatPrice = (
  price: SanityPrice | null | undefined,
  { alwaysShowCents = false }: PriceFormat = {},
): string | null => {
  if (!price || price.isWithheld) return null

  const showCents = alwaysShowCents || !Number.isInteger(price.amount)
  const amount = `€${price.amount.toFixed(showCents ? 2 : 0)}`

  return price.isStartingPrice ? `from ${amount}` : amount
}

// "per person". Undefined when the price itself isn't shown.
export const formatPriceUnit = (
  price: SanityPrice | null | undefined,
): string | undefined =>
  formatPrice(price) === null
    ? undefined
    : PRICE_UNITS.find((unit) => unit.value === price?.unit)?.title
