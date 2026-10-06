import { defineField, defineType } from "sanity"

/**
 * Site-wide identity, contact details and default metadata. One document.
 *
 * `foundedYear` is here because the homepage currently carries a "35+ years"
 * stat that is simply wrong: the catering business (BCL) has been family-run
 * since 1976, which the real client site frames as 50+ years. Deriving the
 * figure from a year rather than storing the sentence means it cannot go stale
 * again — and it keeps the 1976 catering history cleanly separate from the
 * building's 1657–1660 construction, which is a different fact about a
 * different thing and is the kind of pair that gets conflated.
 *
 * `structuredData` feeds the LocalBusiness markup the site carries none of
 * today. Generated from these real fields rather than hand-authored as a blob,
 * so it cannot claim something the page contradicts.
 *
 * Deliberately NOT modelled here: the navigation.
 *
 * That is a decision rather than an omission, and the reason is that the
 * proposed navigation's item counts are load-bearing — the Restaurant panel
 * has three items (one clean grid row) and Events has six (two clean rows), so
 * adding or removing a single link orphans a cell in the three-column panel.
 * A CMS field that lets staff add a seventh Events link is a CMS field that
 * lets staff break the layout, with no warning and no obvious cause. The
 * structure also is not signed off yet. Navigation stays in code until both of
 * those change, and if it ever moves here it needs hard count validation
 * rather than a free array.
 *
 * Also not modelled: the Tableo booking widget's own configuration. It is a
 * mature third-party product the project has explicitly decided to keep, and
 * its settings live in Tableo. Only the link belongs here.
 */
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact & social" },
    { name: "defaults", title: "Defaults & metadata" },
  ],
  fields: [
    defineField({
      name: "businessName",
      title: "Business name",
      type: "string",
      group: "identity",
      initialValue: "Bacchus",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      group: "identity",
    }),
    defineField({
      name: "brandBlurb",
      title: "Footer blurb",
      type: "text",
      group: "identity",
      rows: 3,
      description: "The short paragraph under the brand lockup in the footer.",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "identity",
      description: "The client's real mark.",
    }),
    defineField({
      name: "foundedYear",
      title: "Catering business founded",
      type: "number",
      group: "identity",
      initialValue: 1976,
      description:
        'Confirmed: 1976, family-run. "50+ years" and similar are derived from this, never typed. Distinct from the building\'s 1657–1660 construction.',
      validation: (Rule) => Rule.min(1000).max(2100).integer(),
    }),
    defineField({
      name: "buildingBuiltFrom",
      title: "Building constructed from",
      type: "number",
      group: "identity",
      initialValue: 1657,
      description:
        "The two vaulted chambers, built 1657–1660 by Grand Master Fra Martino de Redin, originally a gunpowder magazine. The restaurant's lower level specifically — weddings are not held there.",
      validation: (Rule) => Rule.min(1000).max(2100).integer(),
    }),
    defineField({
      name: "estateNote",
      title: "Estate facts",
      type: "text",
      group: "identity",
      rows: 4,
      description:
        "From the catalogue: roughly one-twelfth of Mdina, about 4,500m² of grounds including some 500m² of covered open-plan banqueting space; the Secret Garden holds Roman and Arab architectural remains dating to the 1st century.",
    }),

    // --- Contact ------------------------------------------------------------
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      group: "contact",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "text",
      group: "contact",
      rows: 4,
    }),
    defineField({
      name: "geo",
      title: "Coordinates",
      type: "object",
      group: "contact",
      description:
        "For LocalBusiness structured data, and for the map if the client greenlights a custom-styled Mapbox one over a plain Google iframe.",
      fields: [
        defineField({ name: "lat", title: "Latitude", type: "number" }),
        defineField({ name: "lng", title: "Longitude", type: "number" }),
      ],
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook",
      type: "url",
      group: "contact",
      initialValue: "https://www.facebook.com/bacchusMdina",
      description: "Client-supplied, real.",
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram",
      type: "url",
      group: "contact",
      initialValue: "https://www.instagram.com/bacchus_mdina/",
      description: "Client-supplied, real.",
    }),
    defineField({
      name: "tableBookingUrl",
      title: "Table booking URL (Tableo)",
      type: "url",
      group: "contact",
      description:
        "The restaurant's booking widget. A mature third-party product the project has decided to keep — only the link lives here, its configuration stays in Tableo.",
    }),
    defineField({
      name: "enquiryNotificationEmails",
      title: "Send new-enquiry notifications to",
      type: "array",
      group: "contact",
      of: [{ type: "string" }],
      description:
        "Where the staff notification lands, with its LLM-drafted suggested reply inline. Never auto-sent to the client — a human edits and sends.",
    }),

    // --- Defaults -----------------------------------------------------------
    defineField({
      name: "defaultSeo",
      title: "Default search & social",
      type: "seo",
      group: "defaults",
      description:
        "Fallback for any page without its own. Every page lacks all of this today.",
    }),
    defineField({
      name: "structuredData",
      title: "Structured data",
      type: "object",
      group: "defaults",
      description:
        "Feeds LocalBusiness markup. Generated from real fields, never hand-authored — see the note on this type.",
      fields: [
        defineField({
          name: "businessType",
          title: "Schema.org type",
          type: "string",
          options: {
            list: [
              { title: "Restaurant", value: "Restaurant" },
              { title: "EventVenue", value: "EventVenue" },
              { title: "LocalBusiness", value: "LocalBusiness" },
            ],
          },
          initialValue: "Restaurant",
          description:
            "Two businesses share one address, which is the underlying awkwardness here — the restaurant and the events venue. Worth revisiting once the About page exists and the two have separate hubs.",
        }),
        defineField({ name: "priceRange", title: "Price range", type: "string" }),
        defineField({
          name: "openingHours",
          title: "Opening hours",
          type: "array",
          of: [{ type: "string" }],
          description: 'One line per day, schema.org format — e.g. "Mo-Sa 19:00-23:00".',
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
})
