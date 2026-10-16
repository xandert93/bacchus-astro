import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"

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
  title: "Site Settings",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact & Social" },
    { name: "defaults", title: "Defaults & Metadata" },
  ],
  fields: [
    defineField({
      name: "businessName",
      title: "Business Name",
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
      title: "Footer Blurb",
      type: "text",
      group: "identity",
      rows: 3,
      description: "The short paragraph under the logo in the footer.",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "identity",
      description: "Bacchus's real logo.",
    }),
    defineField({
      name: "foundedYear",
      title: "Catering Business Founded",
      type: "number",
      group: "identity",
      initialValue: 1976,
      description: help(
        'Phrases like "50+ years" on the site are worked out from this, so update it here rather than in the text.',
        "Not the same as the building's age (1657–1660).",
      ),
      validation: (Rule) => Rule.min(1000).max(2100).integer(),
    }),
    defineField({
      name: "buildingBuiltFrom",
      title: "Building Constructed From",
      type: "number",
      group: "identity",
      initialValue: 1657,
      description: help(
        "The two vaulted chambers, built 1657–1660 by Grand Master Fra Martino de Redin as a gunpowder store.",
        "This is the restaurant's lower level. Weddings aren't held there.",
      ),
      validation: (Rule) => Rule.min(1000).max(2100).integer(),
    }),
    defineField({
      name: "estateNote",
      title: "Estate Facts",
      type: "text",
      group: "identity",
      rows: 4,
      description: help(
        "From the catalogue: roughly one-twelfth of Mdina, with about 4,500m² of grounds, including some 500m² of covered open-plan banqueting space.",
        "The Secret Garden holds Roman and Arab remains dating back to the 1st century.",
      ),
    }),

    // --- Contact ------------------------------------------------------------
    defineField({
      name: "contact",
      title: "Contact Details",
      type: "object",
      group: "contact",
      options: { collapsible: false },
      fields: [
        defineField({ name: "phone", title: "Phone", type: "string" }),
        defineField({
          name: "email",
          title: "Email",
          type: "string",
          validation: (Rule) => Rule.email(),
        }),
        defineField({ name: "address", title: "Address", type: "text", rows: 4 }),
        defineField({
          name: "geo",
          title: "Coordinates",
          type: "object",
          options: { columns: 2 },
          description:
            "Helps Google place the venue on maps, and positions the map on the site.",
          fields: [
            defineField({ name: "lat", title: "Latitude", type: "number" }),
            defineField({ name: "lng", title: "Longitude", type: "number" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "social",
      title: "Social Media",
      type: "object",
      group: "contact",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "facebook",
          title: "Facebook",
          type: "url",
          initialValue: "https://www.facebook.com/bacchusMdina",
        }),
        defineField({
          name: "instagram",
          title: "Instagram",
          type: "url",
          initialValue: "https://www.instagram.com/bacchus_mdina/",
        }),
      ],
    }),
    defineField({
      name: "tableBookingUrl",
      title: "Table Booking URL (Tableo)",
      type: "url",
      group: "contact",
      description: help(
        "The link to the restaurant's table booking page.",
        "Change booking settings in Tableo itself, not here.",
      ),
    }),
    defineField({
      name: "enquiryNotificationEmails",
      title: "New-Enquiry Email Recipients",
      type: "array",
      group: "contact",
      of: [{ type: "string" }],
      description: help(
        "Who gets an email when a new enquiry arrives. It includes a suggested reply written by AI.",
        "The reply is never sent to the client automatically: someone checks, edits and sends it.",
      ),
    }),

    // --- Defaults -----------------------------------------------------------
    defineField({
      name: "defaultSeo",
      title: "Default Search & Social",
      type: "seo",
      group: "defaults",
      description: "Used on any page that doesn't have its own.",
    }),
    defineField({
      name: "structuredData",
      title: "Structured Data",
      type: "object",
      group: "defaults",
      description: "Details that help Google show the business in search results.",
      fields: [
        defineField({
          name: "businessType",
          title: "Schema.org Type",
          type: "string",
          options: {
            list: [
              { title: "Restaurant", value: "Restaurant" },
              { title: "EventVenue", value: "EventVenue" },
              { title: "LocalBusiness", value: "LocalBusiness" },
            ],
          },
          initialValue: "Restaurant",
          description: help(
            "What kind of business Google should treat Bacchus as.",
            "The restaurant and the events venue share one address, so this may change once they have separate pages.",
          ),
        }),
        defineField({ name: "priceRange", title: "Price Range", type: "string" }),
        defineField({
          name: "openingHours",
          title: "Opening Hours",
          type: "array",
          of: [{ type: "string" }],
          description: 'One line per set of days, in this format: "Mo-Sa 19:00-23:00".',
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
})
