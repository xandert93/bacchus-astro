import type { InputProps } from "sanity"
import styled from "styled-components"

/**
 * Greys out every read-only field, Studio-wide (wired in `sanity.config.ts`).
 *
 * Sanity's own read-only styling is subtle enough that a read-only field
 * still looks editable, and it shows a focus ring when clicked. Dimmed, with
 * a "not allowed" cursor and no focus ring, it reads as information rather
 * than an input. The text can still be selected and copied (a quote
 * reference, say).
 */
const ReadOnlyFrame = styled.div`
  opacity: 0.6;

  /* A read-only field inside a read-only section shouldn't dim twice. */
  & & {
    opacity: 1;
  }

  & input,
  & textarea,
  & select,
  & button {
    cursor: not-allowed;
  }

  & input:focus + span,
  & textarea:focus + span {
    box-shadow: 0 0 0 1px var(--card-border-color) !important;
  }
`

export const ReadOnlyInput = (props: InputProps) =>
  props.readOnly ? (
    <ReadOnlyFrame>{props.renderDefault(props)}</ReadOnlyFrame>
  ) : (
    props.renderDefault(props)
  )
