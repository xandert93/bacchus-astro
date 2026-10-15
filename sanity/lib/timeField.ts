import type { JSX } from "react"
import { defineField, type StringRule, type ValidationBuilder } from "sanity"

/** 24-hour "HH:MM", 00:00 to 23:59. */
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/

/** The gap between the times offered, in minutes. */
const MINUTES_BETWEEN_SLOTS = 15

/** "00:00", "00:15" … "23:45". */
const TIME_SLOTS = Array.from(
  { length: (24 * 60) / MINUTES_BETWEEN_SLOTS },
  (_, index) => {
    const minutes = index * MINUTES_BETWEEN_SLOTS
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0")

    return `${hours}:${String(minutes % 60).padStart(2, "0")}`
  },
)

/** "17:30" as minutes since midnight. */
export const minutesSinceMidnight = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)

  return hours * 60 + minutes
}

export const isTimeOfDay = (value: unknown): value is string =>
  typeof value === "string" && TIME_OF_DAY.test(value)

type TimeFieldOptions = {
  name: string
  title: string
  group?: string
  description?: string | JSX.Element

  /** Rules beyond "is one of the times offered", such as a warning about the length of an event. */
  extraValidation?: ValidationBuilder<StringRule, string>
}

/**
 * A time of day, chosen from a dropdown of quarter hours.
 *
 * Sanity has no time-only type, so this is a string. A dropdown rather than
 * the browser's own time picker, because Chrome's picker ignores `step` (it
 * lists every minute) and stays open after a time is chosen. A dropdown
 * closes on choosing, works the same on a phone, and lets staff type "17" to
 * jump to 17:00.
 *
 * The validation is the safety net for a value written by a script or an
 * import, which never went through the dropdown.
 */
export const timeField = ({ extraValidation, ...field }: TimeFieldOptions) =>
  defineField({
    ...field,
    type: "string",
    options: { list: TIME_SLOTS, layout: "dropdown" },
    validation: (Rule) => [
      Rule.custom((value) =>
        value === undefined || TIME_SLOTS.includes(value)
          ? true
          : "Choose a time from the list: every quarter hour, 24-hour clock.",
      ),
      ...(extraValidation ? [extraValidation(Rule)].flat() : []),
    ],
  })
