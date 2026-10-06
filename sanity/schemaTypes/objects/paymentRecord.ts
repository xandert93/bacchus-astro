import { defineField, defineType } from "sanity"

/**
 * One payment attempt or receipt against a booking.
 *
 * Covers both routes the deposit page offers, which have genuinely different
 * shapes and different failure modes:
 *
 *   card — a Stripe session. Confirmation is a webhook; there is nothing for
 *   staff to do. Fees are a percentage plus a fixed amount, so the fixed part
 *   eats proportionally more of a small deposit, and non-EU cards cost more
 *   than domestic ones. That matters here because wedding clients often pay
 *   from abroad, so `feeAmount` and `netAmount` are stored rather than assumed
 *   — the gross figure on its own will not reconcile against the bank.
 *
 *   bank-transfer — IBAN and reference shown, staff match it by hand.
 *   `reconciledBy` and `reconciledAt` exist because that is a human step that
 *   can be done twice or forgotten, and the booking's auto-confirm depends on
 *   it.
 *
 * `pay-by-bank` is listed but should not be offered until verified. Stripe's
 * own product pages describe Pay by Bank as live, and Stripe is confirmed
 * generally available for Malta-registered businesses, but open-banking
 * coverage in Malta specifically appears to lag larger EU markets and Stripe's
 * availability does not by itself confirm the method works there. It is a
 * genuinely different thing from SEPA Direct Debit, which is a pull-based
 * mandate rather than open banking — the two should not be conflated when this
 * is finally checked against a real Malta-registered Stripe account.
 *
 * Nothing in this type sets a booking's status. The webhook does that, and
 * writes a `statusEvent` saying so — which is what makes the deposit race
 * (first payment wins the date) auditable afterwards.
 */
export default defineType({
  name: "paymentRecord",
  title: "Payment",
  type: "object",
  fields: [
    defineField({
      name: "method",
      title: "Method",
      type: "string",
      options: {
        list: [
          { title: "Card (Stripe)", value: "card" },
          { title: "Bank transfer (manual reconciliation)", value: "bank-transfer" },
          {
            title: "Pay by Bank (open banking) — not yet verified for Malta",
            value: "pay-by-bank",
          },
          { title: "Other / recorded retrospectively", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "kind",
      title: "What this covers",
      type: "string",
      options: {
        list: [
          { title: "Deposit", value: "deposit" },
          { title: "Balance", value: "balance" },
          { title: "Menu tasting fee", value: "tasting" },
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
          { title: "Awaiting payment", value: "awaiting" },
          { title: "Received", value: "received" },
          { title: "Failed", value: "failed" },
          { title: "Expired — hold lapsed", value: "expired" },
          { title: "Refunded", value: "refunded" },
        ],
      },
      initialValue: "awaiting",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "grossAmount",
      title: "Gross amount (EUR)",
      type: "number",
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: "feeAmount",
      title: "Processing fee (EUR)",
      type: "number",
      description:
        "As charged, not as estimated. Percentage plus a fixed amount, and higher on non-EU cards.",
      validation: (Rule) => Rule.precision(2),
    }),
    defineField({
      name: "netAmount",
      title: "Net received (EUR)",
      type: "number",
      description:
        "What actually landed. This is the figure that reconciles against the bank.",
      validation: (Rule) => Rule.precision(2),
    }),
    defineField({
      name: "reference",
      title: "Reference",
      type: "string",
      description:
        "The transfer reference shown to the payer, or the Stripe PaymentIntent id.",
    }),
    defineField({
      name: "stripeSessionId",
      title: "Stripe Checkout session id",
      type: "string",
      hidden: ({ parent }) => parent?.method !== "card",
      readOnly: true,
    }),
    defineField({
      name: "receivedAt",
      title: "Received at",
      type: "datetime",
    }),
    defineField({
      name: "reconciledBy",
      title: "Matched by",
      type: "string",
      description: "Which staff member matched this against the bank statement.",
      hidden: ({ parent }) => parent?.method === "card",
    }),
    defineField({
      name: "reconciledAt",
      title: "Matched at",
      type: "datetime",
      hidden: ({ parent }) => parent?.method === "card",
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
      gross: "grossAmount",
      at: "receivedAt",
    },
    prepare: ({ kind, method, status, gross, at }) => ({
      title: `${kind} — €${Number(gross ?? 0).toFixed(2)} (${status})`,
      subtitle: [method, at ? new Date(at).toLocaleDateString("en-GB") : null]
        .filter(Boolean)
        .join(" — "),
    }),
  },
})
