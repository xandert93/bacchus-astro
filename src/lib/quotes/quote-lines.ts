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

/** More set-up lines than this become one line, each item in its small print. */
const MOST_SEPARATE_SET_UP_LINES = 2

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

/** One set-up item in a combined line's small print: "16 round tables at €15". */
const setUpItem = (line: StoredLine) => {
  const name = lowerFirst(line.label)
  if (line.amount === 0) return `${name}, included`
  if (line.quantity && line.quantity > 1 && line.unitAmount) {
    return `${line.quantity} ${name} at ${eurosCompact(line.unitAmount)}`
  }
  return `${name}, ${eurosCompact(line.amount)}`
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

/** Several small set-up lines as one, so the quote stays short without hiding any. */
const combineSetUp = (lines: StoredLine[]): PresentedLine[] =>
  lines.length > MOST_SEPARATE_SET_UP_LINES
    ? [
        {
          label: "Set-up items",
          details: lines.map(setUpItem).join(" · "),
          amount: lines.reduce((sum, line) => sum + line.amount, 0),
        },
      ]
    : lines.map((line) => ({
        label: line.label,
        quantity: line.unitAmount ? line.quantity : undefined,
        unitAmount: line.unitAmount || undefined,
        amount: line.amount === 0 ? undefined : line.amount,
      }))

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
        ? combineSetUp(stored)
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
