import { defineField, defineType } from "sanity"

/**
 * One component of a reception station — "Parma ham", "Bresaola", "Chorizo".
 *
 * Deliberately inline rather than a reference to `menuDish`, and the reason is
 * measured rather than aesthetic. Station items are ingredients on a platter,
 * not dishes on a menu: a different granularity, and they barely recur. Across
 * the sixteen stations only a handful of items appear more than once (Parma
 * ham, bresaola, Parmigiano Reggiano, lemon and sea salt), so normalising them
 * would add a reference-picking step to every station for almost no saved
 * duplication — the opposite of the trade that makes `menuDish` worth it.
 *
 * Keeping them separate also keeps the two lists from contaminating each
 * other: an editor picking a dish for a Reception tier should not be scrolling
 * past "Chorizo" and "Grissini".
 */
export default defineType({
  name: "stationItem",
  title: "Station item",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Item",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isVegetarian",
      title: "Vegetarian (V)",
      type: "boolean",
      initialValue: false,
      description:
        "On the stations these are OURS, not the catalogue's — it marks none, so each is inferred from the dish name and unconfirmed by Bacchus. That is the opposite of the rule on package menus, where a marking is never inferred; the stations were already published this way, and the Reception package carries a warning note saying so. Provisional until the client confirms them.",
    }),
  ],
  preview: {
    select: { name: "name", vegetarian: "isVegetarian" },
    prepare: ({ name, vegetarian }) => ({ title: `${name}${vegetarian ? " (V)" : ""}` }),
  },
})
