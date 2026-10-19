// Calendar dates as Malta sees them, written "2026-10-18": the form quote
// end dates are stored in, and what the daily jobs compare them with. The
// Worker runs on UTC, which is an hour or two behind Malta, so "today" is
// worked out in Malta's time zone rather than read off the clock.

/** Today in Malta, e.g. "2026-10-18". */
export const todayInMalta = (now = new Date()) =>
  now.toLocaleDateString("en-CA", { timeZone: "Europe/Malta" })

/** A "2026-10-18" date moved by whole days, either way. */
export const addDays = (isoDate: string, days: number) => {
  // Noon, so no daylight-saving change can tip it into another day.
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}
