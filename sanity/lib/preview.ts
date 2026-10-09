/**
 * Formatting for preview cards: the title and subtitle each document shows in
 * a Studio list.
 *
 * Cards are read by staff, not developers, so they show what a person scans
 * for (a name, a date, a price) in the form they would write it themselves:
 * "Sat 8 Aug 2026", "€14,850", "Accepted". One set of helpers keeps every
 * card in the Studio reading the same way.
 */

type Option = { readonly title: string; readonly value: string }

/** "€14,850", or "€14,850.50" when there are cents. Nothing for no amount. */
export const formatEuros = (amount?: number | null) => {
  if (amount === undefined || amount === null) return undefined

  const hasCents = !Number.isInteger(amount)

  return `€${amount.toLocaleString("en-GB", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** "Sat 8 Aug 2026", from a Sanity `date` ("2026-08-08") or `datetime`. */
export const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : undefined

/** "8 Aug 2026, 14:05". */
export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined

/** "pending" becomes "Pending". */
export const capitalise = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined

/**
 * The staff-facing title of a stored option value. Long titles are cut at
 * their dash, so "Pending — enquiry received, not yet answered" reads as
 * "Pending" on a card.
 */
export const optionTitle = (options: readonly Option[], value?: string | null) => {
  const title = options.find((option) => option.value === value)?.title ?? value

  return title?.split(" — ")[0]
}

/** "12 guests", "1 guest". */
export const pluralise = (count: number | undefined | null, noun: string) =>
  count || count === 0 ? `${count} ${noun}${count === 1 ? "" : "s"}` : undefined

/** Joins whatever parts are present with a middle dot. */
export const joinParts = (...parts: (string | number | false | null | undefined)[]) =>
  parts.filter((part) => part || part === 0).join(" · ")
