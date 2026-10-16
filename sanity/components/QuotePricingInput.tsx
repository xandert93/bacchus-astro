import { useEffect } from "react"
import {
  set,
  setIfMissing,
  unset,
  useFormValue,
  type FormPatch,
  type ObjectInputProps,
  type Path,
} from "sanity"
import { calculateQuoteTotals, type QuoteLineInput } from "../lib/quoteTotals"

type PricingValue = {
  lineItems?: QuoteLineInput[]
  discount?: { amount?: number }
  subtotal?: number
  total?: number
  vat?: { rate?: number; amount?: number }
  perPerson?: number
  deposit?: { percent?: number; amount?: number }
}

/**
 * A quote's Pricing section, which keeps its own sums up to date.
 *
 * Renders Sanity's usual fields, then writes the worked-out figures (line
 * totals, subtotal, total, VAT, per person, deposit) whenever what staff type
 * changes them. Those fields are read-only, so nobody does the sums by hand.
 *
 * Only while the quote is a draft. Once it is sent, the section is read-only
 * and nothing here recalculates, so the figures stay exactly as the client
 * received them, even if a rate in Settings changes later.
 */
export const QuotePricingInput = (props: ObjectInputProps) => {
  const { onChange, readOnly, renderDefault } = props
  const value = props.value as PricingValue | undefined
  const guestCount = useFormValue(["event", "guestCount"]) as number | undefined

  useEffect(() => {
    if (readOnly) return

    const totals = calculateQuoteTotals({
      lineItems: value?.lineItems,
      discountAmount: value?.discount?.amount,
      vatRate: value?.vat?.rate,
      guestCount,
      depositPercent: value?.deposit?.percent,
    })

    const patches: FormPatch[] = []

    const update = (
      path: Path,
      next: number | undefined,
      current: number | undefined,
    ) => {
      if (next === current) return

      patches.push(next === undefined ? unset(path) : set(next, path))
    }

    for (const line of totals.lineAmounts) {
      const current = value?.lineItems?.find((item) => item._key === line._key)

      update(["lineItems", { _key: line._key }, "amount"], line.amount, current?.amount)
    }

    update(["subtotal"], totals.subtotal, value?.subtotal)
    update(["total"], totals.total, value?.total)
    update(["vat", "amount"], totals.vatAmount, value?.vat?.amount)
    update(["perPerson"], totals.perPerson, value?.perPerson)
    update(["deposit", "amount"], totals.depositAmount, value?.deposit?.amount)

    if (patches.length === 0) return

    // The nested objects may not exist yet on a brand-new quote.
    onChange([
      setIfMissing({}),
      setIfMissing({}, ["vat"]),
      setIfMissing({}, ["deposit"]),
      ...patches,
    ])
  }, [value, guestCount, readOnly, onChange])

  return renderDefault(props)
}
