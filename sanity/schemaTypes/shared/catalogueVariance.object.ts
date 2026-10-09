import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { joinParts, optionTitle } from "../../lib/preview"

/**
 * Where our published wording departs from the catalogue's printed wording.
 *
 * The catalogue is the source of truth for WHAT is offered, not for how it is
 * spelled — it contains real, repeated errors, so "copied verbatim from the
 * PDF" has never been reason enough to leave a string alone. Every package
 * page has had a proofing pass, and the changes fall into four kinds that
 * carry genuinely different weight with the client:
 *
 *   correction    — an outright error fixed. "Pine Not Roll" -> "Pine Nut
 *                   Roll", "SANWHICHES" -> "Sandwiches", "Macaroons" ->
 *                   "Macarons", "Parmeggiano" -> "Parmigiano".
 *   normalisation — house style applied. British English ("Savouries", not
 *                   "SAVORIES"), accents restored on foreign-language terms
 *                   including Maltese ("Ġbejna", "Saint-Émilion").
 *   rewrite       — the wording itself changed, not its spelling. "Vegetable
 *                   Stir Fried" -> "Stir-Fried Vegetables"; "Barbeque Table"
 *                   -> "BBQ Table". A higher bar, and the client should
 *                   actively approve these rather than inherit them.
 *   left-as-printed — deliberately NOT changed because either spelling could
 *                   be intentional. "Terre Antich", "Henessey". Also the
 *                   Whiskey and Rum bars, captioned "service of five" while
 *                   listing six each.
 *
 * Recording this against the string is what makes the standing Todo — "send
 * the client the list of copy corrections" — a query rather than a hand-
 * compiled list that will be out of date by the time it is sent. It also
 * survives the thing that actually went wrong on the Stations page: one string
 * can live in up to four places (visible copy, lightbox detail, title, image
 * alt), the visible copy is line-wrapped by the formatter so the phrase may
 * not exist as a contiguous string anywhere in the file, and a flat
 * find-and-replace silently caught one of two occurrences and looked like it
 * had worked. In Sanity the string exists once, so that failure mode is gone.
 */
const CHANGE_KINDS = [
  { title: "Correction — an outright error", value: "correction" },
  { title: "Normalisation — house style", value: "normalisation" },
  { title: "Rewrite — the wording itself changed", value: "rewrite" },
  { title: "Left as printed — flagged, not changed", value: "left-as-printed" },
] as const

export default defineType({
  name: "catalogueVariance",
  title: "Differs from the catalogue",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "asPrinted",
      title: "As printed in the catalogue",
      type: "string",
      description: "Copied exactly from the catalogue, mistakes and capitals included.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Kind of change",
      type: "string",
      options: { list: [...CHANGE_KINDS] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reason",
      title: "Reason",
      type: "string",
      description: "One line, written so it can be sent to Bacchus as it is.",
    }),
    defineField({
      name: "clientApproved",
      title: "Client has approved this change",
      type: "boolean",
      initialValue: false,
      description: help(
        "Tick only once Bacchus has seen and agreed to the change.",
        "Rewrites especially need a clear yes: Bacchus may have reasons for the original wording, even where it looks like a mistake.",
      ),
    }),
  ],
  preview: {
    select: { asPrinted: "asPrinted", kind: "kind", approved: "clientApproved" },
    prepare: ({ asPrinted, kind, approved }) => ({
      title: `Was: ${asPrinted ?? ""}`,
      subtitle: joinParts(
        optionTitle(CHANGE_KINDS, kind),
        approved ? "Approved" : "Awaiting approval",
      ),
    }),
  },
})
