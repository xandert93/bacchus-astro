import type { JSX } from "react"
import { defineField, type StringRule, type ValidationBuilder } from "sanity"
import { TimeInput } from "../components/TimeInput"

/** 24-hour "HH:MM", 00:00 to 23:59. */
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/

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

  /** Rules beyond "is a real time", such as a warning about the length of an event. */
  extraValidation?: ValidationBuilder<StringRule, string>
}

/**
 * A time of day. Sanity has no time-only type, so this is a string with a
 * time picker for input and validation as the safety net, which catches a
 * value written by a script or an import as well as one typed by hand.
 */
export const timeField = ({ extraValidation, ...field }: TimeFieldOptions) =>
  defineField({
    ...field,
    type: "string",
    components: { input: TimeInput },
    validation: (Rule) => [
      Rule.custom((value) =>
        value === undefined || isTimeOfDay(value)
          ? true
          : "Use a 24-hour time, e.g. 17:00.",
      ),
      ...(extraValidation ? [extraValidation(Rule)].flat() : []),
    ],
  })
