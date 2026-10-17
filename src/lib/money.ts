// Money as people read it on a quote: "€7,605.00". Always with cents, since
// a deposit someone types into their banking app must match to the cent.

export const euros = (amount: number) =>
  `€${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

/** "7605.00": what a banking app's amount field takes. */
export const plainAmount = (amount: number) => amount.toFixed(2)
