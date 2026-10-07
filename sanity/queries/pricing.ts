/**
 * Resolving what something costs on a given date.
 *
 * A tier carries a base `price` and any number of `seasonalRates`, each
 * pointing at a `season`. This file turns that into one figure, and it is kept
 * separate from the schema because it is ordinary logic that wants unit tests
 * — Vitest, once the project has it — rather than something only exercised by
 * loading a Studio.
 *
 * The rules, in order:
 *
 * 1. A seasonal rate whose season contains the date wins over the base price.
 * 2. Where two seasons contain the same date, the higher `priority` wins.
 *    Overlap is legitimate rather than a mistake — a Christmas period sitting
 *    inside a wider winter season is the obvious shape — so the resolver needs
 *    a tiebreak, not an error.
 * 3. With no matching season, the base price applies. Every tier is in this
 *    state today: Bacchus has supplied no rate card, only the single remark
 *    that April runs slightly higher than March.
 * 4. A price held back by `provenance.blocksPublication` resolves to nothing
 *    at all, never to the base price as a fallback. The withheld corkage
 *    figure is the live case, and quietly substituting a different number for
 *    a suppressed one would be worse than showing none.
 *
 * A recurring season is matched on month and day with the year ignored, which
 * is what lets "April is dearer" be stated once rather than re-entered every
 * year. A recurring season may also wrap the new year (December to February),
 * in which case the range is the union of the two halves — hence the
 * comparison below reads as an OR rather than the usual between.
 */

export interface ResolvedPrice {
  amount: number
  unit: string
  isIndicative: boolean
  vatIncluded: boolean
  seasonName: string | null
}

interface PriceInput {
  amount?: number
  unit?: string
  isIndicative?: boolean
  vatIncluded?: boolean
  provenance?: { blocksPublication?: boolean }
}

interface SeasonInput {
  name?: string
  startDate?: string
  endDate?: string
  repeatsAnnually?: boolean
  priority?: number
}

export interface SeasonalRateInput {
  season?: SeasonInput
  price?: PriceInput
}

/** "2027-04-25" -> 425, so month-and-day comparisons ignore the year. */
const toMonthDay = (isoDate: string): number => {
  const [, month, day] = isoDate.split("-").map(Number)

  return month * 100 + day
}

export const seasonContains = (season: SeasonInput, isoDate: string): boolean => {
  if (!season?.startDate || !season?.endDate) return false

  if (!season.repeatsAnnually)
    return isoDate >= season.startDate && isoDate <= season.endDate

  const date = toMonthDay(isoDate)
  const start = toMonthDay(season.startDate)
  const end = toMonthDay(season.endDate)

  // A season that wraps the new year has its end before its start, so the
  // range is everything from the start onwards plus everything up to the end.
  if (start > end) return date >= start || date <= end

  return date >= start && date <= end
}

export const resolvePriceForDate = (
  basePrice: PriceInput | undefined,
  seasonalRates: SeasonalRateInput[] | undefined,
  isoDate: string | undefined,
): ResolvedPrice | null => {
  const applicable = (isoDate ? (seasonalRates ?? []) : [])
    .filter((rate) => rate?.season && seasonContains(rate.season, isoDate as string))
    .sort(
      (first, second) => (second.season?.priority ?? 0) - (first.season?.priority ?? 0),
    )

  const winningRate = applicable[0]
  const chosen = winningRate?.price ?? basePrice

  if (!chosen || typeof chosen.amount !== "number") return null

  // Rule 4: a suppressed price resolves to nothing, never to the base as a
  // fallback, so a withheld figure can never be replaced by a different one.
  if (chosen.provenance?.blocksPublication) return null

  return {
    amount: chosen.amount,
    unit: chosen.unit ?? "",
    isIndicative: chosen.isIndicative ?? true,
    vatIncluded: chosen.vatIncluded ?? true,
    seasonName: winningRate?.season?.name ?? null,
  }
}

/**
 * A tier with its base price and every seasonal rate resolved through to the
 * season itself, so `resolvePriceForDate` can run without a second round trip.
 */
export const tierPricingQuery = /* groq */ `
*[_type == "packageTier" && slug.current == $slug][0]{
  name,
  "slug": slug.current,
  price{amount, unit, isIndicative, vatIncluded, provenance},
  seasonalRates[]{
    price{amount, unit, isIndicative, vatIncluded, provenance},
    season->{name, startDate, endDate, repeatsAnnually, priority}
  }
}
`

/** Every season, for the Studio's own reference and for admin listings. */
export const seasonsQuery = /* groq */ `
*[_type == "season"] | order(priority desc, startDate asc){
  name,
  "slug": slug.current,
  startDate,
  endDate,
  repeatsAnnually,
  priority,
  provenance
}
`
