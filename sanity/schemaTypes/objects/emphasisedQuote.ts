import { defineArrayMember, defineType } from "sanity"

/**
 * A testimonial quote, with the gold-emphasised phrase marked inside it.
 *
 * The emphasis is OUR editorial pick, not the reviewer's — a phrase inside
 * each real review that the rotator renders in gold. So it has to be a span
 * within the text, not a separate field.
 *
 * Two models were considered:
 *
 *   quote: string + emphasis: string, validated as a substring. Simpler, but
 *   it breaks silently the moment the chosen phrase occurs twice in one quote
 *   ("impeccable" appears in three of the four real testimonials, and twice
 *   within one of them) — the renderer would have to guess which occurrence
 *   was meant.
 *
 *   Portable Text with a custom decorator. Chosen. The mark travels with the
 *   exact span, the editor selects it visually, and a second occurrence of the
 *   same word is unambiguous because only one of them carries the mark.
 *
 * Everything else Portable Text normally offers is stripped out: no headings,
 * no lists, no links, no block styles, and in particular no `strong` or `em`.
 * A testimonial is one paragraph of someone else's words. Leaving the standard
 * marks available would let a second, differently-styled emphasis appear in a
 * component that has exactly one gold treatment, and nothing in the CSS would
 * render it.
 */
export default defineType({
  name: "emphasisedQuote",
  title: "Quote",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Quote", value: "normal" }],
      lists: [],
      marks: {
        decorators: [
          {
            title: "Gold emphasis",
            value: "emphasis",
          },
        ],
        annotations: [],
      },
    }),
  ],
})
