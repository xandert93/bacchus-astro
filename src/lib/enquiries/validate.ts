// Checks an enquiry sent by the form before anything is stored. The form
// checks the same things in the browser, but anyone can post to the
// endpoint directly, so the server never trusts it.
//
// Pure, with no Sanity or network in it, so it can be unit tested once
// Vitest is set up.

import { EVENT_STYLE_OPTIONS, NOT_SURE_OF_SPACES, SPACE_OPTIONS } from "@data/enquiry"
import { CONTACT_PREFERENCES, EVENT_TYPES } from "@studio/lib/constants"

export const MESSAGE_LIMIT = 500
export const MAX_GUESTS = 500

export interface EnquiryInput {
  eventType: string
  date: string
  backupDate?: string
  guests: number
  spaces: string[]
  guidanceOnSpaces: boolean
  style?: string
  message?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  contactPreference: string
  sourcePage: string
}

export type ValidationResult =
  { ok: true; enquiry: EnquiryInput } | { ok: false; errors: Record<string, string> }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const text = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : ""

const todayIso = () => new Date().toISOString().slice(0, 10)

const isFutureDate = (value: string) =>
  ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)) && value >= todayIso()

const SPACE_VALUES = new Set(SPACE_OPTIONS.map((option) => option.value))
const STYLE_VALUES = new Set(EVENT_STYLE_OPTIONS.map((option) => option.value))
const EVENT_TYPE_VALUES = new Set<string>(EVENT_TYPES.map((type) => type.value))
const CONTACT_PREFERENCE_VALUES = new Set<string>(
  CONTACT_PREFERENCES.map((preference) => preference.value),
)

export const validateEnquiry = (body: Record<string, unknown>): ValidationResult => {
  const errors: Record<string, string> = {}

  const eventType = text(body.eventType, 20).toLowerCase()
  if (!EVENT_TYPE_VALUES.has(eventType)) errors.eventType = "Choose an event type."

  const date = text(body.date, 10)
  if (!isFutureDate(date)) errors.date = "Choose a date from today onwards."

  const backupDate = text(body.backupDate, 10) || undefined
  if (backupDate && !isFutureDate(backupDate)) {
    errors.backupDate = "Choose an alternative date from today onwards."
  }

  const guests = Number(body.guests)
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    errors.guests = `Enter a guest count between 1 and ${MAX_GUESTS}.`
  }

  const chosenSpaces = Array.isArray(body.spaces)
    ? body.spaces.filter((space): space is string => typeof space === "string")
    : []
  if (chosenSpaces.some((space) => !SPACE_VALUES.has(space))) {
    errors.spaces = "Choose spaces from the list."
  }

  const style = text(body.style, 40) || undefined
  if (style && !STYLE_VALUES.has(style)) errors.style = "Choose a style from the list."

  const message = text(body.message, MESSAGE_LIMIT + 1) || undefined
  if (message && message.length > MESSAGE_LIMIT) {
    errors.message = `Keep your message under ${MESSAGE_LIMIT} characters.`
  }

  const firstName = text(body.firstName, 100)
  if (!firstName) errors.firstName = "Enter your first name."

  const lastName = text(body.lastName, 100)
  if (!lastName) errors.lastName = "Enter your last name."

  const email = text(body.email, 200)
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address."

  const phone = text(body.phone, 40)
  if (phone.length <= 5) errors.phone = "Enter a phone number."

  const contactPreference = text(body.contactPreference, 20)
  if (!CONTACT_PREFERENCE_VALUES.has(contactPreference)) {
    errors.contactPreference = "Choose how we should contact you."
  }

  if (body.consent !== true) errors.consent = "Tick the box so we can contact you."

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    enquiry: {
      eventType,
      date,
      backupDate,
      guests,
      spaces: chosenSpaces.filter((space) => space !== NOT_SURE_OF_SPACES),
      guidanceOnSpaces: chosenSpaces.includes(NOT_SURE_OF_SPACES),
      style,
      message,
      firstName,
      lastName,
      email,
      phone,
      contactPreference,
      sourcePage: text(body.sourcePage, 200) || "/",
    },
  }
}
