// Checks a waitlist sign-up from the calendar's "notify me" popover. Pure,
// so it can be unit tested once Vitest is set up.

export interface WaitlistSignup {
  date: string
  email: string
  name?: string
  sourcePage: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const text = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

export const validateWaitlistSignup = (
  body: Record<string, unknown>,
): { ok: true; signup: WaitlistSignup } | { ok: false; error: string } => {
  const date = text(body.date, 10)
  const today = new Date().toISOString().slice(0, 10)
  if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(date)) || date < today) {
    return { ok: false, error: "That date can't be waitlisted." }
  }

  const email = text(body.email, 200).toLowerCase()
  if (!EMAIL.test(email)) return { ok: false, error: "Enter a valid email address." }

  return {
    ok: true,
    signup: {
      date,
      email,
      name: text(body.name, 100) || undefined,
      sourcePage: text(body.sourcePage, 200) || "/",
    },
  }
}
