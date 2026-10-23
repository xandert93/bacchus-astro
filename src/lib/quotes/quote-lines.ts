// A quote's lines as the client reads them: in groups (Exclusive use, Food,
// Drinks, Set-up, Overtime), each line's small print, and each group's
// subtotal. Worked out once from the stored quote, so the PDF (and, in time,
// the deposit page) show the same thing. The rules are in
// docs/design/decisions.md, "PDF quotes".

import type { DepositRecord } from "@lib/deposits/load"
import { eurosCompact } from "@lib/money"
import { describeIncludedSetUp } from "@studio/lib/includedSetUp"

export interface PresentedLine {
  label: string
  details?: string
  quantity?: number
  unitAmount?: number
  /** Missing on a line that's included at no charge. */
  amount?: number
}

export interface PresentedGroup {
  title: string
  lines: PresentedLine[]
  /** Only for a group with two or more priced lines: with one, it would repeat it. */
  subtotal?: number
}

type StoredLine = DepositRecord["pricing"]["lineItems"][number]

/** The groups in the order a quote lists them, by each line's category. */
const GROUPS = [
  { category: "exclusivity", title: "Exclusive use" },
  { category: "food", title: "Food" },
  { category: "beverage", title: "Drinks" },
  { category: "setup", title: "Set-up" },
  { category: "overtime", title: "Overtime" },
  { category: "other", title: "Other" },
]

const TIER_WORDS: Record<number, string> = {
  1: "one-tier",
  2: "two-tier",
  3: "three-tier",
}

/** "Includes a three-tier cake: pistachio and olive oil". */
const cakeNote = (cake: NonNullable<DepositRecord["menu"]>["cake"]) => {
  if (!cake?.tiers && !cake?.flavour) return undefined
  const size = cake.tiers ? `${TIER_WORDS[cake.tiers] ?? `${cake.tiers}-tier`} ` : ""
  return `Includes a ${size}cake${cake.flavour ? `: ${cake.flavour}` : ""}`
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

const listInWords = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items[0]

/** One priced set-up item in the small print: "16 round tables at €15". */
const pricedSetUpItem = (line: StoredLine) => {
  const name = lowerFirst(line.label)
  return line.quantity && line.quantity > 1 && line.unitAmount
    ? `${line.quantity} ${name} at ${eurosCompact(line.unitAmount)}`
    : `${name}, ${eurosCompact(line.amount)}`
}

/** "16 round tables at €15 · … · sound and red carpet, included". */
const setUpDetails = (lines: StoredLine[]) => {
  const priced = lines.filter((line) => line.amount !== 0).map(pricedSetUpItem)
  const included = lines
    .filter((line) => line.amount === 0)
    .map((line) => lowerFirst(line.label))
  return [
    ...priced,
    ...(included.length ? [`${listInWords(included)}, included`] : []),
  ].join(" · ")
}

const asLine = (line: StoredLine, record: DepositRecord): PresentedLine => ({
  label: line.label,
  details:
    line.source && line.source === record.menu?.mealFormat
      ? cakeNote(record.menu?.cake)
      : undefined,
  quantity: line.unitAmount ? line.quantity : undefined,
  unitAmount: line.unitAmount || undefined,
  // At no charge, it reads "Included".
  amount: line.amount === 0 ? undefined : line.amount,
})

/**
 * The set-up's lines as one, "Tables and dressing", each item named and
 * priced in its small print, so the quote stays short without hiding any. A
 * single line stays as it is.
 */
const combineSetUp = (lines: StoredLine[], record: DepositRecord): PresentedLine[] =>
  lines.length > 1
    ? [
        {
          label: "Tables and dressing",
          details: setUpDetails(lines),
          amount: lines.reduce((sum, line) => sum + line.amount, 0),
        },
      ]
    : lines.map((line) => asLine(line, record))

const subtotalOf = (lines: PresentedLine[]) => {
  const priced = lines.filter((line) => line.amount !== undefined)
  return priced.length >= 2
    ? priced.reduce((sum, line) => sum + (line.amount ?? 0), 0)
    : undefined
}

export const presentQuoteLines = (record: DepositRecord): PresentedGroup[] => {
  const known = GROUPS.map((group) => group.category)
  const inGroup = (category: string) =>
    record.pricing.lineItems.filter((line) =>
      category === "other"
        ? !known.includes(line.category ?? "") || line.category === "other"
        : line.category === category,
    )

  return GROUPS.map(({ category, title }) => {
    const stored = inGroup(category)
    let lines =
      category === "setup"
        ? combineSetUp(stored, record)
        : stored.map((line) => asLine(line, record))

    // The chairs and bar pieces included, worked out for this quote's guests.
    if (category === "setup" && record.includedSetUp) {
      lines = [
        ...lines,
        {
          label: "Chairs and bar pieces",
          details: describeIncludedSetUp(record.includedSetUp),
        },
      ]
    }

    return { title, lines, subtotal: subtotalOf(lines) }
  }).filter((group) => group.lines.length)
}

/** "with two stations", for the event panel: lines priced from a station. */
export const stationCount = (record: DepositRecord) =>
  record.pricing.lineItems.filter((line) => line.sourceType === "station").length
