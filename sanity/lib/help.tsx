/**
 * Field help text in paragraphs.
 *
 * A Sanity `description` ignores line breaks inside a string, so a long one
 * renders as a single block. Passing each paragraph separately keeps help
 * text scannable:
 *
 *   description: help(
 *     'How the quote is addressed, e.g. "Rachel & Paul".',
 *     "Leave empty to use the names from the booking.",
 *   )
 *
 * Blocks are spans displayed as blocks because Sanity renders the
 * description inside an inline element.
 */
export const help = (...paragraphs: string[]) => (
  <>
    {paragraphs.map((paragraph, index) => (
      <span
        key={index}
        style={{ display: "block", marginTop: index === 0 ? 0 : "0.75em" }}
      >
        {paragraph}
      </span>
    ))}
  </>
)
