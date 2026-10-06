import { defineField, defineType } from "sanity"

/**
 * The venue's operating facts and policies. One document, edited in place.
 *
 * Every number in here is currently hardcoded somewhere in the prototype, and
 * several are hardcoded in more than one place. That is the problem this
 * singleton solves — but the sharper problem is that some of them are
 * placeholders wearing the clothes of policy, and nothing in the HTML says
 * which. Three live examples:
 *
 *   - `WEDDING_MIN_NOTICE_MONTHS = 3` in `main.js` carries a comment saying in
 *     so many words that it is a reasonable placeholder and not a confirmed
 *     Bacchus policy. A visitor reading the calendar cannot see that comment.
 *   - The deposit page states a 7-day hold. Kept as a specific number on the
 *     user's explicit call, but it is illustrative and was never verified as a
 *     hold-period policy.
 *   - The homepage's "35+ years" stat is wrong rather than merely unconfirmed:
 *     the catering business has operated since 1976, which the real site frames
 *     as 50+ years.
 *
 * So every policy field here pairs with a provenance record. The intent is
 * that a number cannot be published without its status being visible to the
 * person publishing it, and that the oxblood disclaimers currently written by
 * hand into the markup follow the data instead.
 *
 * `depositPercent` and `balanceDueDays` are the contested pair: the catalogue
 * states 30% non-refundable with the remaining 70% due 14 days before the
 * event, while client correspondence describes the terms as flexible without
 * reaffirming that split. They are recorded, with the conflict attached, and
 * must not be wired into real deposit logic until the client says which
 * governs.
 */
export default defineType({
  name: "weddingPolicy",
  title: "Wedding policy & venue facts",
  type: "document",
  groups: [
    { name: "booking", title: "Booking & availability", default: true },
    { name: "event", title: "On the day" },
    { name: "money", title: "Deposit & payment" },
    { name: "food", title: "Food & tasting" },
    { name: "practical", title: "Practicalities" },
  ],
  fields: [
    // --- Booking & availability --------------------------------------------
    defineField({
      name: "bookingHorizonMonths",
      title: "Booking horizon (months)",
      type: "number",
      group: "booking",
      initialValue: 24,
      description:
        "How far ahead the calendar shows. Two years is industry-typical lead time for an exclusive venue.",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "minNoticeMonths",
      title: "Minimum notice (months)",
      type: "number",
      group: "booking",
      initialValue: 3,
      description:
        "PLACEHOLDER. A single-wedding-a-day venue cannot turn around catering, staffing and supplier coordination overnight, but three months is our estimate, not Bacchus policy.",
      validation: (Rule) => Rule.required().min(0).integer(),
    }),
    defineField({
      name: "minNoticeProvenance",
      title: "Minimum notice — source",
      type: "provenance",
      group: "booking",
    }),
    defineField({
      name: "weddingsPerDay",
      title: "Weddings per day",
      type: "number",
      group: "booking",
      initialValue: 1,
      description:
        "One. This is what makes weddings date-exclusive and is the whole basis of the availability calendar — every other event type can share a date.",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "waitlistCapPerEmail",
      title: "Waitlist cap per email address",
      type: "number",
      group: "booking",
      initialValue: 8,
      description:
        "Generous on purpose — aimed at spam and bots, not at throttling a couple genuinely comparing a few candidate dates. Enforced in the submission handler.",
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "estateCapacity",
      title: "Estate capacity",
      type: "capacity",
      group: "booking",
      description:
        "Confirmed: 50–800 guests standing, layout adjusted per guest count. Note this is a STANDING figure and not a replacement for the site's seated-capacity placeholders.",
    }),

    // --- On the day ---------------------------------------------------------
    defineField({
      name: "standardDurationHours",
      title: "Standard duration (hours)",
      type: "number",
      group: "event",
      initialValue: 5,
      description: "Confirmed. Some events extend to six or eight.",
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: "maxAdvisedDurationHours",
      title: "Maximum advised duration (hours)",
      type: "number",
      group: "event",
      initialValue: 8,
      description: "Confirmed: the client advises against going beyond this.",
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: "outdoorMusicCurfew",
      title: "Outdoor entertainment until",
      type: "string",
      group: "event",
      initialValue: "23:00",
      description: "Confirmed: 11pm outdoors.",
    }),
    defineField({
      name: "indoorMusicCurfew",
      title: "Indoor entertainment until",
      type: "string",
      group: "event",
      initialValue: "04:00",
      description: "Confirmed: 4am indoors.",
    }),
    defineField({
      name: "restaurantClosesAboveGuests",
      title: "Restaurant closes to the public above",
      type: "number",
      group: "event",
      initialValue: 150,
      description:
        "Confirmed: above this guest count the downstairs à la carte restaurant closes to the public. Operationally significant and worth surfacing on an enquiry.",
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "coordinatorIncluded",
      title: "In-house coordinator included",
      type: "boolean",
      group: "event",
      initialValue: true,
      description:
        "Confirmed, and worth stating plainly: a Bacchus staff member, not an external planner.",
    }),
    defineField({
      name: "coupleSourcesThemselves",
      title: "What couples typically source themselves",
      type: "text",
      group: "event",
      rows: 3,
      description:
        "Confirmed: flowers, entertainment (DJ or band, including stage) and a photographer. A photobooth is a common optional add; the client cautioned against much beyond that.",
    }),

    // --- Deposit & payment --------------------------------------------------
    defineField({
      name: "depositPercent",
      title: "Deposit (%)",
      type: "number",
      group: "money",
      initialValue: 30,
      description:
        "CONTESTED — see the conflict record below. Do not wire into real logic yet.",
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "balanceDueDays",
      title: "Balance due (days before the event)",
      type: "number",
      group: "money",
      initialValue: 14,
      description: "CONTESTED, same as the deposit percentage.",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "depositTermsProvenance",
      title: "Deposit terms — source & conflict",
      type: "provenance",
      group: "money",
      description:
        'Expect "contested": the catalogue states 30% non-refundable with 70% due 14 days out; correspondence describes the terms as flexible without reaffirming that split.',
    }),
    defineField({
      name: "depositHoldDays",
      title: "Date held for (days) after the deposit link is issued",
      type: "number",
      group: "money",
      initialValue: 7,
      description:
        "ILLUSTRATIVE. The deposit page states seven days; that was never verified as a hold-period policy.",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "depositHoldProvenance",
      title: "Hold period — source",
      type: "provenance",
      group: "money",
    }),
    defineField({
      name: "bankTransferDetails",
      title: "Bank transfer details",
      type: "object",
      group: "money",
      description:
        'The prototype shows a FICTIONAL IBAN with an explicit "do not send funds to this account" warning. Real details go in here, and only once.',
      fields: [
        defineField({ name: "accountName", title: "Account name", type: "string" }),
        defineField({ name: "iban", title: "IBAN", type: "string" }),
        defineField({ name: "bic", title: "BIC / SWIFT", type: "string" }),
        defineField({ name: "bankName", title: "Bank", type: "string" }),
        defineField({
          name: "areReal",
          title: "These are real details",
          type: "boolean",
          initialValue: false,
          description:
            'Off means the page keeps its "do not send funds to this account" warning. Do not turn this on until the details are the client\'s own.',
        }),
      ],
    }),

    // --- Food & tasting -----------------------------------------------------
    defineField({
      name: "tastingFee",
      title: "Menu tasting fee",
      type: "price",
      group: "food",
      description:
        "Around €40 per person, chargeable before booking and refunded if the couple books; complimentary once the contract is signed.",
    }),
    defineField({
      name: "tastingNote",
      title: "Tasting note",
      type: "text",
      group: "food",
      rows: 4,
      description:
        "Confirmed: six cold dishes, six hot dishes and four desserts, all of the couple's choice from the chosen package; stations cannot be tasted. STILL OPEN — whether a tasting needs its own booking step, and whether the full menu is available on a given day. Until that is answered, tasting interest is nudged only through the enquiry form's message field.",
    }),
    defineField({
      name: "cakeNote",
      title: "Cake",
      type: "text",
      group: "food",
      rows: 4,
      description:
        'Confirmed: in-house cake is included in the reception package price. The catalogue\'s "one tier per 100 guests" is nominal — in practice always three tiers, as a dummy display cake. Once cut, the celebratory drink and cake are served immediately. An external cake is allowed but real-cut slices are not served from it.',
    }),
    defineField({
      name: "corkageNote",
      title: "Corkage",
      type: "text",
      group: "food",
      rows: 3,
      description:
        "Confirmed as an opt-out surcharge, not a default line: it applies only if a couple brings their own wine or Champagne, since packages already include beverage. The catalogue's figure is deliberately unpublished — it gives an amount without saying whether it is per bottle or per person.",
    }),
    defineField({
      name: "dietaryNote",
      title: "Dietary requirements",
      type: "text",
      group: "food",
      rows: 2,
      description: "Confirmed: vegetarian, vegan and gluten-free are catered for.",
    }),

    // --- Practicalities ----------------------------------------------------
    defineField({
      name: "accessibilityNote",
      title: "Accessibility",
      type: "text",
      group: "practical",
      rows: 2,
      description:
        "Confirmed: a stairlift is available and staff assist guests with any needs.",
    }),
    defineField({
      name: "parkingNote",
      title: "Parking",
      type: "text",
      group: "practical",
      rows: 2,
      description:
        'UNCONFIRMED. Guests can book "the Tomba", which is the client\'s own term for a nearby arrangement not otherwise identified. Confirm exactly what it refers to before mentioning parking on the site.',
    }),
    defineField({
      name: "parkingProvenance",
      title: "Parking — source",
      type: "provenance",
      group: "practical",
    }),
    defineField({
      name: "venueConditionNote",
      title: "Venue condition (internal)",
      type: "text",
      group: "practical",
      rows: 4,
      description:
        "Never published. The light-blue staining near the chandelier and the damaged curtains are from a vandalism incident, under insurance claim, with repairs expected in 2027 — not neglect. Outdoor flooring has been refreshed. Here so staff answering a question about photographs have the real answer.",
    }),
    defineField({
      name: "retentionMonths",
      title: "Personal-data retention (months)",
      type: "number",
      group: "practical",
      initialValue: 36,
      description:
        "Used to set the review date on every new consent record. The client's call, not ours — but the scheduled purge needs a number to work from.",
      validation: (Rule) => Rule.min(1).integer(),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Wedding policy & venue facts" }
    },
  },
})
