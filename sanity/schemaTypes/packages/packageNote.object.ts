import { defineField, defineType } from "sanity"
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline"
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline"
import { optionTitle } from "../../lib/preview"

/**
 * A callout on a package page.
 *
 * Two visual treatments already exist in the prototype and they mean different
 * things, which is why `tone` is a field rather than a styling choice:
 *
 *   note    -> `.package-menu-note`, bronze/gold. Confirmed catalogue copy.
 *   warning -> `.package-menu-note-warning`, oxblood. Unconfirmed or
 *              contested. Oxblood is the sitewide "illustrative / unconfirmed"
 *              colour, the same as the deposit page's warning box, served
 *              through the `--oxblood-on-dark` token because plain
 *              `--oxblood` measures about 1.6:1 against `--ink` and is
 *              effectively invisible there.
 *
 * Three warnings are currently live and each is the only thing on the page
 * telling a reader that the figure or absence above it is not settled:
 *
 *   1. Banquet pricing. The tier prices ARE shown (€65/€85/€95) rather than
 *      withheld, with a callout directly beneath the cards stating that
 *      separate client correspondence says banqueting begins at around €135
 *      per person. The project deliberately does not choose between them.
 *   2. High Tea vegetarian marking. The catalogue marks (V) throughout
 *      Reception and Banquet and not once across Jasmine/Hibiscus/Tulip, so
 *      the page carries no badges and this explains why.
 *   3. Beverage pricing. The catalogue carries no prices at all; the figures
 *      shown come from the client quote.
 *
 * Linking a note to the `provenance` of the fact it describes is what will
 * eventually let these disappear on their own: when the status flips to
 * confirmed, the warning has nothing left to say.
 */
const PLACEMENTS = [
  { title: "Below the Tier Cards", value: "below-tier-cards" },
  { title: "Above the Menus", value: "above-menus" },
  { title: "Foot of Page", value: "page-foot" },
] as const

export default defineType({
  name: "packageNote",
  title: "Note / Callout",
  type: "object",
  fields: [
    defineField({
      name: "tone",
      title: "Tone",
      type: "string",
      options: {
        list: [
          { title: "Note (Bronze)", value: "note" },
          { title: "Warning (Dark Red)", value: "warning" },
        ],
        layout: "radio",
      },
      initialValue: "note",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 4,
      description: "Shown on the website, so write it for visitors, not staff.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "placement",
      title: "Placement",
      type: "string",
      options: { list: [...PLACEMENTS] },
      initialValue: "below-tier-cards",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { tone: "tone", body: "body", placement: "placement" },
    prepare: ({ tone, body, placement }) => ({
      title: String(body ?? "Empty note").slice(0, 80),
      subtitle: optionTitle(PLACEMENTS, placement),
      media: tone === "warning" ? WarningOutlineIcon : InfoOutlineIcon,
    }),
  },
})
