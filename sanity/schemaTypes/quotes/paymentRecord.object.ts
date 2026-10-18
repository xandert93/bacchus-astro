import { defineField, defineType } from "sanity"
import {
  capitalise,
  formatDate,
  formatEuros,
  joinParts,
  optionTitle,
} from "../../lib/preview"

/**
 * One payment attempt or receipt against a booking.
 *
 * Covers both routes the deposit page offers, which have genuinely different
 * shapes and different failure modes:
 *
 *   card — a checkout session at the card provider (Stripe or Viva, not yet
 *   chosen). Confirmation is a webhook; there is nothing for staff to do.
 *   Fees are a percentage plus a fixed amount, so the fixed part eats
 *   proportionally more of a small deposit, and non-EU cards cost more than
 *   domestic ones. That matters here because wedding clients often pay from
 *   abroad, so `amounts.fee` and `amounts.net` are stored rather than
 *   assumed — the gross figure on its own will not reconcile against the bank.
 *
 *   bank-transfer — IBAN and reference shown, staff match it by hand.
 *   `reconciliation` exists because that is a human step that can be done
 *   twice or forgotten, and the booking's auto-confirm depends on it.
 *
 * Nothing in this type sets a booking's status. The webhook does that, and
 * writes a `statusEvent` saying so — which is what makes the deposit race
 * (first payment wins the date) auditable afterwards.
 */
const PAYMENT_METHODS = [
  { title: "Card", value: "card" },
  { title: "Bank Transfer", value: "bank-transfer" },
  { title: "Other", value: "other" },
] as const

export default defineType({
  name: "paymentRecord",
  title: "Payment",
  type: "object",
  fields: [
    defineField({
      name: "method",
      title: "Method",
      type: "string",
      options: { list: [...PAYMENT_METHODS], layout: "radio", direction: "horizontal" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "kind",
      title: "What This Covers",
      type: "string",
      options: {
        list: [
          { title: "Deposit", value: "deposit" },
          { title: "Balance", value: "balance" },
          { title: "Menu Tasting Fee", value: "tasting" },
          { title: "Refund", value: "refund" },
        ],
      },
      initialValue: "deposit",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Awaiting Payment", value: "awaiting" },
          { title: "Received", value: "received" },
          { title: "Failed", value: "failed" },
          { title: "Expired: The Quote Ran Out", value: "expired" },
          { title: "Refunded", value: "refunded" },
        ],
      },
      initialValue: "awaiting",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "amounts",
      title: "Amounts (€)",
      type: "object",
      options: { collapsible: false, columns: 3 },
      fields: [
        defineField({
          name: "gross",
          title: "Paid",
          type: "number",
          validation: (Rule) => Rule.required().precision(2),
        }),
        defineField({
          name: "fee",
          title: "Processing Fee",
          type: "number",
          description: "As actually charged.",
          validation: (Rule) => Rule.precision(2),
        }),
        defineField({
          name: "net",
          title: "Received",
          type: "number",
          description: "What arrived in the bank.",
          validation: (Rule) => Rule.precision(2),
        }),
      ],
    }),
    defineField({
      name: "reference",
      title: "Reference",
      type: "string",
      description:
        "For a bank transfer, the reference the client was given. For a card, the payment's ID from the card provider.",
    }),
    defineField({
      name: "receivedAt",
      title: "Received at",
      type: "datetime",
    }),
    defineField({
      name: "reconciliation",
      title: "Matched Against the Bank Statement",
      type: "object",
      options: { collapsible: false, columns: 2 },
      hidden: ({ parent }) => parent?.method === "card",
      fields: [
        defineField({ name: "by", title: "By", type: "string" }),
        defineField({ name: "at", title: "On", type: "datetime" }),
      ],
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: {
      kind: "kind",
      method: "method",
      status: "status",
      gross: "amounts.gross",
      at: "receivedAt",
    },
    prepare: ({ kind, method, status, gross, at }) => ({
      title: joinParts(capitalise(kind), formatEuros(gross)),
      subtitle: joinParts(
        capitalise(status),
        optionTitle(PAYMENT_METHODS, method),
        formatDate(at),
      ),
    }),
  },
})
