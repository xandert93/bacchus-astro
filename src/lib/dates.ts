// Calendar dates as Malta sees them, written "2026-10-18": the form quote
// end dates are stored in, and what the daily jobs compare them with. The
// Worker runs on UTC, which is an hour or two behind Malta, so "today" is
// worked out in Malta's time zone rather than read off the clock.

/** Today in Malta, e.g. "2026-10-18". */
export const todayInMalta = (now = new Date()) =>
  now.toLocaleDateString("en-CA", { timeZone: "Europe/Malta" })

/** "1st", "2nd", "3rd", "4th"; "11th", "12th", "13th"; "21st". */
const ordinal = (day: number) => {
  const teens = day % 100 >= 11 && day % 100 <= 13
  const suffix = teens ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th")
  return `${day}${suffix}`
}

const partOf = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString("en-GB", { ...options, timeZone: "UTC" })

/**
 * "29th May 2027", from "2027-05-29" (or a full timestamp). Built from its
 * parts rather than one formatting call, which the Workers runtime would
 * write with a comma after any weekday.
 */
export const dayMonthYear = (isoDate: string) => {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`)
  return `${ordinal(date.getUTCDate())} ${partOf(date, { month: "long" })} ${date.getUTCFullYear()}`
}

/** "Saturday 29th May 2027": an event's date, as emails and pages write it. */
export const longDate = (isoDate: string) => {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`)
  return `${partOf(date, { weekday: "long" })} ${dayMonthYear(isoDate)}`
}

/** A "2026-10-18" date moved by whole days, either way. */
export const addDays = (isoDate: string, days: number) => {
  // Noon, so no daylight-saving change can tip it into another day.
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}
