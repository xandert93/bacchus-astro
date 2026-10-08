/**
 * Helpers shared by the seed files: ids, dates, rich text and money.
 */

/**
 * Every seeded document's id says it's seed data, so a re-run can find and
 * remove the old set. Records holding personal data also get a dot in their
 * id (`booking.seed-…`): Sanity never shows a document with a dot in its id
 * to anyone who isn't logged in, even in a public dataset. The real enquiry
 * endpoint will create them the same way, so the seed data matches.
 */
export const seedId = (name: string): string => `seed-${name}`

/** Any document the seed writes: Sanity needs only the id and the type. */
export type SeedDocument = { _id: string; _type: string } & Record<string, unknown>

export const privateSeedId = (type: string, name: string): string =>
  `${type}.seed-${name}`

export const isSeedId = (id: string): boolean =>
  id.startsWith("seed-") || id.includes(".seed-")

/** Array items in Sanity need a `_key`, unique within their array. */
export const keyed = <Item extends object>(items: Item[]): (Item & { _key: string })[] =>
  items.map((item, index) => ({ ...item, _key: `k${index}` }))

export const reference = (id: string) => ({ _type: "reference" as const, _ref: id })

export const keyedReferences = (ids: string[]) => keyed(ids.map(reference))

/** Plain paragraphs as Portable Text, Sanity's rich-text format. */
export const paragraphs = (...texts: string[]) =>
  keyed(
    texts.map((text) => ({
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s0", text, marks: [] }],
    })),
  )

/**
 * A quote with one emphasised phrase, written `before *emphasis* after`, as
 * the testimonials' `emphasisedQuote` stores it.
 */
export const emphasisedQuote = (text: string) => {
  const [before, emphasis, after] = text.split("*")

  return [
    {
      _type: "block",
      _key: "quote",
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: "s0", text: before, marks: [] },
        { _type: "span", _key: "s1", text: emphasis, marks: ["emphasis"] },
        { _type: "span", _key: "s2", text: after, marks: [] },
      ],
    },
  ]
}

// --- Dates ---------------------------------------------------------------
// Everything is relative to the day the seed runs, so the data never goes
// stale: there are always bookings next month and events last month.

const DAY_MS = 24 * 60 * 60 * 1000

export const today = (): Date => {
  const now = new Date()

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MS)

/** The first Saturday at least `months` months from today: wedding day. */
export const saturdayInMonths = (months: number): Date => {
  const start = today()
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, start.getUTCDate()),
  )
  const daysToSaturday = (6 - target.getUTCDay() + 7) % 7

  return addDays(target, daysToSaturday)
}

/** A weekday (Thursday) at least `months` months away: corporate events. */
export const thursdayInMonths = (months: number): Date =>
  addDays(saturdayInMonths(months), -2)

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10)

export const isoDateTime = (date: Date, hour = 10): string =>
  new Date(date.getTime() + hour * 60 * 60 * 1000).toISOString()

// --- Money -----------------------------------------------------------------
// Worked in whole cents and only turned into euros at the end, so totals
// never pick up floating-point pennies (see the note on the `price` type).

export const euros = (cents: number): number => Math.round(cents) / 100

export const cents = (amount: number): number => Math.round(amount * 100)

// --- Provenance ------------------------------------------------------------

type ProvenanceStatus = "confirmed" | "unconfirmed" | "contested" | "placeholder"

type ProvenanceSource =
  | "catalogue"
  | "correspondence"
  | "quote"
  | "live-site"
  | "web"
  | "assumption"
  | "invented"

export const provenance = (
  status: ProvenanceStatus,
  source: ProvenanceSource,
  sourceDetail: string,
  extra: Record<string, unknown> = {},
) => ({
  _type: "provenance",
  status,
  source,
  sourceDetail,
  blocksPublication: false,
  ...extra,
})

/** Seed data that stands in for facts nobody has given us. */
export const invented = (detail: string) =>
  provenance("placeholder", "invented", `Development seed data: ${detail}`)

/** A price, which the schema requires to carry its source. */
export const price = (
  amount: number,
  unit: "per-person" | "per-bottle" | "each" | "per-hour" | "flat",
  source: ReturnType<typeof provenance>,
) => ({
  _type: "price",
  amount,
  unit,
  isIndicative: true,
  isStartingPrice: false,
  vatIncluded: true,
  provenance: source,
})

export const fromQuote = (detail = "The single shared client quote (PDF)") =>
  provenance("unconfirmed", "quote", detail)

export const fromEmails = (detail: string) =>
  provenance("confirmed", "correspondence", detail, { confirmedOn: "2026-09-17" })
