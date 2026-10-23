import { defineField, defineType } from "sanity"
import { help } from "../../lib/help"
import { timeField } from "../../lib/timeField"
import { DEFAULT_DEPOSIT_PERCENT, DEFAULT_VAT_RATE } from "../../lib/constants"

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
 *   - How long a quote stays valid. The site first assumed 7 days, an
 *     illustrative number; Bacchus's own quotes say 30 and the catalogue 15.
 *     30 is the default now, as what they actually send, but the two
 *     documents still disagree (docs/content/client-facts.md).
 *   - The homepage's "35+ years" stat is wrong rather than merely unconfirmed:
 *     the catering business has operated since 1976, which the real site frames
 *     as 50+ years.
 *
 * So every policy field here pairs with a provenance record. The intent is
 * that a number cannot be published without its status being visible to the
 * person publishing it, and that the oxblood disclaimers currently written by
 * hand into the markup follow the data instead.
 *
 * The deposit terms (`deposit.percent`, `.balanceDueDays`, `.quoteValidDays`)
 * are not settled with Bacchus yet: the catalogue states 30% non-refundable
 * with the rest due 14 days before the event, while their emails call the
 * terms flexible. That is tracked outside the Studio
 * (`docs/content/client-facts.md`), so staff don't see the dispute in their
 * admin. Deposits run in test mode until it is settled, and settling it is a
 * change of these numbers, not of code.
 */
export default defineType({
  name: "weddingPolicy",
  title: "Wedding Policy & Venue Facts",
  type: "document",
  groups: [
    { name: "booking", title: "Booking & Availability", default: true },
    { name: "event", title: "On the Day" },
    { name: "money", title: "Deposit & Payment" },
    { name: "food", title: "Food & Tasting" },
    { name: "practical", title: "Practicalities" },
  ],
  fields: [
    // --- Booking & availability --------------------------------------------
    defineField({
      name: "bookingHorizonMonths",
      title: "Booking Horizon (Months)",
      type: "number",
      group: "booking",
      initialValue: 24,
      description:
        "How far ahead the calendar shows. Two years is typical for an exclusive venue.",
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "minNoticeMonths",
      title: "Minimum Notice (Months)",
      type: "number",
      group: "booking",
      initialValue: 3,
      description: help("How soon before the date an enquiry can still be taken."),
      validation: (Rule) => Rule.required().min(0).integer(),
    }),
    defineField({
      name: "weddingsPerDay",
      title: "Weddings per Day",
      type: "number",
      group: "booking",
      initialValue: 1,
      description: help(
        "One. This is what the availability calendar is built on.",
        "Other events can share a date.",
      ),
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: "waitlistCapPerEmail",
      title: "Waitlist Cap per Email Address",
      type: "number",
      group: "booking",
      initialValue: 8,
      description: help(
        "How many dates one email address can join the waitlist for.",
        "Generous on purpose: it stops spam, not couples comparing a few dates.",
      ),
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "estateCapacity",
      title: "Estate Capacity",
      type: "capacity",
      group: "booking",
      description: help(
        "50 to 800 guests standing, with the layout adjusted to the guest count.",
      ),
    }),

    // --- On the day ---------------------------------------------------------
    defineField({
      name: "eventLength",
      title: "Event Length (Hours)",
      type: "object",
      group: "event",
      options: { collapsible: false, columns: 2 },
      fields: [
        defineField({
          name: "standardHours",
          title: "Standard",
          type: "number",
          initialValue: 5,
          description: "Some events extend to six or eight.",
          validation: (Rule) => Rule.min(1),
        }),
        defineField({
          name: "maxAdvisedHours",
          title: "Longest Advised",
          type: "number",
          initialValue: 8,
          description: "Bacchus advises against going beyond this.",
          validation: (Rule) => Rule.min(1),
        }),
      ],
    }),
    defineField({
      name: "musicCurfew",
      title: "Entertainment Until",
      type: "object",
      group: "event",
      options: { collapsible: false, columns: 2 },
      fields: [
        { ...timeField({ name: "outdoor", title: "Outdoors" }), initialValue: "23:00" },
        { ...timeField({ name: "indoor", title: "Indoors" }), initialValue: "04:00" },
      ],
    }),
    defineField({
      name: "restaurantClosesAboveGuests",
      title: "Restaurant Closes to the Public Above",
      type: "number",
      group: "event",
      initialValue: 150,
      description:
        "Above this many guests, the downstairs à la carte restaurant closes to the public.",
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "coordinatorIncluded",
      title: "In-House Coordinator Included",
      type: "boolean",
      group: "event",
      initialValue: true,
      description: "A Bacchus staff member, not an outside planner.",
    }),
    defineField({
      name: "coupleSourcesThemselves",
      title: "What Couples Typically Source Themselves",
      type: "text",
      group: "event",
      rows: 3,
      description: help(
        "Flowers, entertainment (DJ or band, including the stage) and a photographer.",
        "A photobooth is a common extra. Bacchus advises against much beyond that.",
      ),
    }),

    // --- Deposit & payment --------------------------------------------------
    defineField({
      name: "vatRate",
      title: "VAT Rate (%)",
      type: "number",
      group: "money",
      initialValue: DEFAULT_VAT_RATE,
      description: help(
        "Malta's standard rate. Quoted prices include VAT.",
        "New quotes copy this when they're created. Changing it doesn't affect quotes already made.",
      ),
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: "deposit",
      title: "Deposit",
      type: "object",
      group: "money",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "percent",
          title: "Deposit (%)",
          type: "number",
          initialValue: DEFAULT_DEPOSIT_PERCENT,
          description: help(
            "The usual deposit. New quotes copy this when they're created.",
            "It can be changed on an individual quote.",
          ),
          validation: (Rule) => Rule.min(0).max(100),
        }),
        defineField({
          name: "balanceDueDays",
          title: "Balance Due (Days Before the Event)",
          type: "number",
          initialValue: 14,
          validation: (Rule) => Rule.min(0).integer(),
        }),
        defineField({
          name: "quoteValidDays",
          title: "Days a Quote Stays Valid",
          type: "number",
          initialValue: 30,
          description: help(
            "Counted from the day it's sent, unless the quote sets its own end date.",
            "The date isn't held meanwhile: the first deposit to arrive secures it.",
          ),
          validation: (Rule) => Rule.min(1).integer(),
        }),
      ],
    }),
    defineField({
      name: "bankTransferDetails",
      title: "Bank Transfer Details",
      type: "object",
      group: "money",
      description: help(
        'The deposit page currently shows made-up details with a "do not send funds to this account" warning.',
        "Enter Bacchus's real details here when they arrive.",
      ),
      fields: [
        defineField({ name: "accountName", title: "Account Name", type: "string" }),
        defineField({ name: "iban", title: "IBAN", type: "string" }),
        defineField({ name: "bic", title: "BIC / SWIFT", type: "string" }),
        defineField({ name: "bankName", title: "Bank", type: "string" }),
        defineField({
          name: "areReal",
          title: "These Are Real Details",
          type: "boolean",
          initialValue: false,
          description: help(
            'Unticked, the page keeps its "do not send funds to this account" warning.',
            "Only tick once the details above are Bacchus's real bank details.",
          ),
        }),
      ],
    }),

    // --- Food & tasting -----------------------------------------------------
    defineField({
      name: "tastingFee",
      title: "Menu Tasting Fee",
      type: "price",
      group: "food",
      description: help(
        "About €40 per person if taken before booking, refunded if the couple then books.",
        "Free once the contract is signed.",
      ),
    }),
    defineField({
      name: "tastingNote",
      title: "Tasting Note",
      type: "text",
      group: "food",
      rows: 4,
      description: help(
        "Six cold dishes, six hot dishes and four desserts, all chosen by the couple from their package. Stations can't be tasted.",
      ),
    }),
    defineField({
      name: "cakeNote",
      title: "Cake",
      type: "text",
      group: "food",
      rows: 4,
      description: help(
        "The in-house cake is included in the Reception package price.",
        'The catalogue says "one tier per 100 guests", but in practice it is always a three-tier display cake. Once it is cut, the celebratory drink and cake are served straight away.',
        "Couples can bring their own cake, but slices aren't served from it.",
      ),
    }),
    defineField({
      name: "corkageNote",
      title: "Corkage",
      type: "text",
      group: "food",
      rows: 3,
      description: help(
        "Only charged if a couple brings their own wine or Champagne, since packages already include drinks.",
      ),
    }),
    defineField({
      name: "dietaryNote",
      title: "Dietary Requirements",
      type: "text",
      group: "food",
      rows: 2,
      description: "Vegetarian, vegan and gluten-free are catered for.",
    }),

    // --- Practicalities ----------------------------------------------------
    defineField({
      name: "accessibilityNote",
      title: "Accessibility",
      type: "text",
      group: "practical",
      rows: 2,
      description: "There is a stairlift, and staff help guests with any needs.",
    }),
    defineField({
      name: "parkingNote",
      title: "Parking",
      type: "text",
      group: "practical",
      rows: 2,
      description: help('Guests can book "the Tomba".'),
    }),
    defineField({
      name: "venueConditionNote",
      title: "Venue Condition (Internal)",
      type: "text",
      group: "practical",
      rows: 4,
      description: help(
        "For staff only. Never shown on the site.",
        "The light-blue staining near the chandelier and the damaged curtains are from vandalism, not neglect. An insurance claim is under way, with repairs expected in 2027. The outdoor flooring has been redone.",
        "Use this if a couple asks about something they've noticed in photos.",
      ),
    }),
    defineField({
      name: "retentionMonths",
      title: "Personal-Data Retention (Months)",
      type: "number",
      group: "practical",
      initialValue: 36,
      description: help(
        "How long we keep people's personal details before reviewing them for deletion.",
        "Bacchus's decision to make.",
      ),
      validation: (Rule) => Rule.min(1).integer(),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Wedding Policy & Venue Facts" }),
  },
})
