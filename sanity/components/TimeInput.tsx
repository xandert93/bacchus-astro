import { TextInput } from "@sanity/ui"
import { set, unset, type StringInputProps } from "sanity"

/** Fifteen minutes, in seconds: the steps the picker moves in. */
const PICKER_STEP_SECONDS = 15 * 60

/**
 * A time of day, picked with the browser's own time picker: a spinner on a
 * desktop, a clock dial on a phone. Whatever the picker displays, it always
 * stores 24-hour "HH:MM", which is what `timeField` validates.
 */
export const TimeInput = ({ value, onChange, elementProps }: StringInputProps) => (
  <TextInput
    {...elementProps}
    type="time"
    step={PICKER_STEP_SECONDS}
    value={value ?? ""}
    onChange={(event) => {
      const time = event.currentTarget.value

      onChange(time ? set(time) : unset())
    }}
  />
)
