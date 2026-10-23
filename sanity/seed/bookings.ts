/**
 * Enquiries and bookings in every status, the quotes behind them, their
 * payments, and the waitlist.
 *
 * Every client here is invented. Emails use example.com and phone numbers
 * Ofcom's 07700 900xxx range, both reserved for fiction, so nothing can ever
 * reach a real inbox or phone. Dates are relative to the day the seed runs.
 * The quotes' lines and prices follow Bacchus's own quote template, and are
 * prepared by the coordinator who prepares their real ones.
 */
import {
  addDays,
  cents,
  euros,
  isoDate,
  isoDateTime,
  keyed,
  keyedReferences,
  privateSeedId,
  reference,
  saturdayInMonths,
  thursdayInMonths,
  today,
} from "./lib"
import type { BookingStatus } from "../lib/constants"
import { calculateQuoteTotals } from "../lib/quoteTotals"
import { SPACE_IDS } from "./venue"

// The wording on the enquiry form's consent box (EnquiryStepReview.astro).
const CONSENT_WORDING =
  "I'm happy for the Bacchus events team to contact me about this enquiry. Held privately, never shared, deleted on request."

// Weddings policy: personal data is reviewed after 36 months.
const RETENTION_MONTHS = 36

// Per-person prices from the client quote, as stored on the tiers.
const TIERS = {
  receptionDaisy: {
    id: "packageTier-reception-daisy",
    label: "Reception – Daisy",
    amount: 53,
  },
  receptionLavender: {
    id: "packageTier-reception-lavender",
    label: "Reception – Lavender",
    amount: 57,
  },
  receptionRose: {
    id: "packageTier-reception-rose",
    label: "Reception – Rose",
    amount: 64,
  },
  banquetOrchid: {
    id: "packageTier-banquet-orchid",
    label: "Banquet – Orchid",
    amount: 65,
  },
  banquetDahlia: {
    id: "packageTier-banquet-dahlia",
    label: "Banquet – Dahlia",
    amount: 85,
  },
  highTeaHibiscus: {
    id: "packageTier-high-tea-hibiscus",
    label: "High Tea – Hibiscus",
    amount: 45,
  },
  localWine: {
    id: "packageTier-beverage-local-wine",
    label: "Maltese wine",
    amount: 30,
  },
  foreignWine: {
    id: "packageTier-beverage-foreign-wine",
    label: "Italian wine",
    amount: 35,
  },
}

type Tier = (typeof TIERS)[keyof typeof TIERS]

// Lines priced as on Bacchus's quote template. Chairs are included for up to
// 30% of guests, and two bar pieces come with a wedding (both as Bacchus's
// coordinator described them), so those show at no charge.
const extra = {
  roundTables: (count: number) => ({
    label: "Round tables",
    category: "setup",
    quantity: count,
    unitAmount: 15,
  }),
  chairs: (guests: number) => ({
    label: "Chairs",
    category: "setup",
    quantity: Math.round(guests * 0.3),
    unitAmount: 0,
  }),
  barPieces: { label: "Bar pieces", category: "setup", quantity: 2, unitAmount: 0 },
  bows: (count: number) => ({
    label: "Bows",
    category: "setup",
    quantity: count,
    unitAmount: 3,
  }),
  sound: { label: "Sound", category: "setup", quantity: 1, unitAmount: 500 },
  welcomeDrink: (guests: number) => ({
    label: "Welcome drink",
    category: "beverage",
    quantity: guests,
    unitAmount: 6.5,
  }),
  cocktailBar: (guests: number) => ({
    label: "Cocktail bar",
    category: "beverage",
    quantity: guests,
    unitAmount: 12.5,
  }),
  station: (name: string, unitAmount: number, guests: number) => ({
    label: `${name} station`,
    category: "food",
    quantity: guests,
    unitAmount,
  }),
  overtime: (guests: number) => ({
    label: "Overtime, one hour",
    category: "overtime",
    quantity: guests,
    unitAmount: 10,
  }),
}

const NICHOLAS = "Nicholas Vella Gatt"
const FAVOURITE_CAKE = { tiers: 3, flavour: "pistachio and olive oil" }

interface BookingSpec {
  key: string
  status: BookingStatus
  eventType: "wedding" | "corporate" | "celebration" | "other"
  eventDate?: Date
  dateIsFlexible?: boolean
  backupDate?: Date
  guestCount: number
  firstName: string
  lastName: string
  partnerName?: string
  spaces?: string[]
  spacesGuidanceRequested?: boolean
  eventStyle?: string
  message?: string
  // How long before today the enquiry came in.
  submittedDaysAgo: number
  sourcePage: string
  // What the quote covers, for bookings that have one.
  quote?: {
    status: "draft" | "sent" | "accepted" | "expired" | "superseded"
    mealFormat: Tier
    beverage?: Tier
    extras?: { label: string; category: string; quantity: number; unitAmount: number }[]
    // The cake that comes with the meal.
    cake?: { tiers: number; flavour?: string }
    clientNotes?: string
    // A discount bringing the price down to a round figure per guest, as
    // Bacchus's own quotes do (theirs came to exactly €100 a person).
    roundPerPersonDownTo?: number
    sentDaysAgo?: number
  }
  // When the deposit arrived, and how.
  deposit?: { daysAgo: number; method: "card" | "bank-transfer" }
  balancePaid?: boolean
  // Why it ended, for a declined, withdrawn or cancelled booking.
  closeReason?: string
  internalNotes?: string
  suggestedReply?: string
}

const start = today()

const BOOKINGS: BookingSpec[] = [
  // --- Confirmed: deposit received, date held -------------------------------
  {
    key: "turner-grech",
    status: "confirmed",
    eventType: "wedding",
    eventDate: saturdayInMonths(5),
    guestCount: 140,
    firstName: "Sophie",
    lastName: "Turner",
    partnerName: "James Grech",
    spaces: [SPACE_IDS.terrace, SPACE_IDS.hall],
    eventStyle: "garden-golden-hour",
    message: "We'd love the ceremony at sunset on the terrace, then dinner inside.",
    submittedDaysAgo: 120,
    sourcePage: "/weddings",
    quote: {
      status: "accepted",
      mealFormat: TIERS.receptionRose,
      beverage: TIERS.localWine,
      extras: [extra.roundTables(14), extra.chairs(140), extra.barPieces, extra.sound],
      cake: FAVOURITE_CAKE,
      roundPerPersonDownTo: 5,
      sentDaysAgo: 100,
    },
    deposit: { daysAgo: 90, method: "bank-transfer" },
  },
  {
    key: "borg-farrugia",
    status: "confirmed",
    eventType: "wedding",
    eventDate: saturdayInMonths(8),
    guestCount: 220,
    firstName: "Emma",
    lastName: "Borg",
    partnerName: "Luca Farrugia",
    spaces: [SPACE_IDS.hall],
    eventStyle: "formal-refined",
    submittedDaysAgo: 75,
    sourcePage: "/weddings/packages/banquet",
    quote: {
      status: "accepted",
      mealFormat: TIERS.banquetDahlia,
      beverage: TIERS.foreignWine,
      extras: [
        extra.station("Salumerie Table", 12.5, 220),
        extra.cocktailBar(220),
        extra.roundTables(22),
        extra.chairs(220),
        extra.bows(66),
        extra.barPieces,
      ],
      cake: { tiers: 3, flavour: "bacio" },
      sentDaysAgo: 60,
    },
    deposit: { daysAgo: 50, method: "card" },
    internalNotes: "Second quote: the first had the wrong tier (see the superseded one).",
  },
  {
    key: "clarke-price",
    status: "confirmed",
    eventType: "wedding",
    eventDate: saturdayInMonths(11),
    guestCount: 90,
    firstName: "Hannah",
    lastName: "Clarke",
    partnerName: "Tom Price",
    spaces: [SPACE_IDS.terrace],
    eventStyle: "candlelit-ceremonial",
    message: "Flying in from Manchester with most of the guests. Afternoon wedding.",
    submittedDaysAgo: 45,
    sourcePage: "/weddings/packages/high-tea",
    quote: {
      status: "accepted",
      mealFormat: TIERS.highTeaHibiscus,
      sentDaysAgo: 40,
    },
    deposit: { daysAgo: 30, method: "card" },
  },
  {
    key: "shah-mifsud",
    status: "confirmed",
    eventType: "wedding",
    eventDate: saturdayInMonths(14),
    guestCount: 180,
    firstName: "Priya",
    lastName: "Shah",
    partnerName: "Daniel Mifsud",
    spaces: [SPACE_IDS.terrace, SPACE_IDS.hall, SPACE_IDS.garden],
    eventStyle: "garden-golden-hour",
    submittedDaysAgo: 25,
    sourcePage: "/",
    quote: {
      status: "accepted",
      mealFormat: TIERS.receptionLavender,
      beverage: TIERS.localWine,
      extras: [
        {
          label: "Secret Garden",
          category: "exclusivity",
          quantity: 1,
          unitAmount: 500,
        },
      ],
      sentDaysAgo: 20,
    },
    deposit: { daysAgo: 12, method: "bank-transfer" },
  },
  {
    key: "azzopardi-summit",
    status: "confirmed",
    eventType: "corporate",
    eventDate: thursdayInMonths(2),
    guestCount: 120,
    firstName: "Mark",
    lastName: "Azzopardi",
    spaces: [SPACE_IDS.hall],
    message:
      "Gala dinner for a fintech conference. Need a lectern and a screen for speeches.",
    submittedDaysAgo: 40,
    sourcePage: "/corporate",
    quote: {
      status: "accepted",
      mealFormat: TIERS.banquetOrchid,
      beverage: TIERS.localWine,
      extras: [extra.sound],
      sentDaysAgo: 35,
    },
    deposit: { daysAgo: 28, method: "bank-transfer" },
  },

  // --- Open enquiries ---------------------------------------------------------
  {
    key: "vella-camilleri",
    status: "in-discussion",
    eventType: "wedding",
    eventDate: saturdayInMonths(7),
    backupDate: saturdayInMonths(8),
    guestCount: 160,
    firstName: "Laura",
    lastName: "Vella",
    partnerName: "Karl Camilleri",
    spaces: [SPACE_IDS.garden, SPACE_IDS.terrace],
    eventStyle: "garden-golden-hour",
    message:
      "Could we have the ceremony in the Secret Garden? Is a vegetarian menu possible for about a third of the guests?",
    submittedDaysAgo: 2,
    sourcePage: "/weddings",
    quote: {
      status: "draft",
      mealFormat: TIERS.receptionRose,
      beverage: TIERS.localWine,
      extras: [
        { label: "Secret Garden", category: "exclusivity", quantity: 1, unitAmount: 500 },
        extra.station("Salumerie Table", 12.5, 160),
        extra.station("Charcuterie Table", 10.5, 160),
        extra.welcomeDrink(160),
        extra.cocktailBar(160),
        extra.roundTables(16),
        extra.chairs(160),
        extra.barPieces,
        extra.sound,
        extra.overtime(160),
      ],
      cake: FAVOURITE_CAKE,
      clientNotes:
        "As discussed, the ceremony is in the Secret Garden, with drinks on the Terrace afterwards.",
    },
    suggestedReply:
      "Dear Laura and Karl,\n\nThank you for thinking of Bacchus for your wedding. Your date is currently available. The Secret Garden isn't part of our standard package, but it can be added for your ceremony; vegetarian menus are no trouble at all.\n\nWould you like to come for a viewing? We hold them Monday to Friday, by appointment.\n\nWarm regards,\nThe Bacchus events team",
  },
  {
    key: "mallia",
    status: "new",
    eventType: "wedding",
    dateIsFlexible: true,
    guestCount: 80,
    firstName: "Grace",
    lastName: "Mallia",
    spacesGuidanceRequested: true,
    eventStyle: "still-exploring",
    message: "Any Saturday next summer. Small wedding, mostly family.",
    submittedDaysAgo: 1,
    sourcePage: "/weddings",
  },
  {
    key: "bonnici-team-dinner",
    status: "new",
    eventType: "corporate",
    eventDate: thursdayInMonths(3),
    guestCount: 60,
    firstName: "Chris",
    lastName: "Bonnici",
    message: "End-of-year team dinner. Three courses, wine with dinner.",
    submittedDaysAgo: 4,
    sourcePage: "/corporate",
  },
  {
    key: "fenech-birthday",
    status: "new",
    eventType: "celebration",
    eventDate: saturdayInMonths(2),
    guestCount: 45,
    firstName: "Natalie",
    lastName: "Fenech",
    spaces: [SPACE_IDS.terrace],
    message: "My mum's 60th. Canapés and drinks on the terrace, then cake.",
    submittedDaysAgo: 6,
    sourcePage: "/celebrations",
  },
  {
    key: "hughes-walker",
    status: "new",
    eventType: "wedding",
    eventDate: saturdayInMonths(5),
    guestCount: 120,
    firstName: "Olivia",
    lastName: "Hughes",
    partnerName: "Ben Walker",
    eventStyle: "candlelit-ceremonial",
    message: "We know it's short notice for summer, but is this date still free?",
    submittedDaysAgo: 3,
    sourcePage: "/weddings",
    internalNotes:
      "Same date as Turner & Grech, already confirmed. Offer the alternative Saturdays and the waitlist.",
  },
  {
    key: "ellis",
    status: "awaiting-deposit",
    eventType: "wedding",
    eventDate: saturdayInMonths(6),
    guestCount: 110,
    firstName: "Megan",
    lastName: "Ellis",
    partnerName: "Joe Ellul",
    spaces: [SPACE_IDS.terrace, SPACE_IDS.hall],
    eventStyle: "formal-refined",
    message: "We were on the waitlist for this date. Delighted it came free!",
    submittedDaysAgo: 8,
    sourcePage: "/weddings",
    quote: {
      status: "sent",
      mealFormat: TIERS.receptionDaisy,
      beverage: TIERS.localWine,
      extras: [
        {
          label: "Terrace & Lawns",
          category: "exclusivity",
          quantity: 1,
          unitAmount: 4500,
        },
        extra.welcomeDrink(110),
        extra.roundTables(11),
        extra.chairs(110),
        extra.bows(33),
        extra.barPieces,
        extra.sound,
      ],
      cake: FAVOURITE_CAKE,
      sentDaysAgo: 2,
    },
  },

  // --- Declined -------------------------------------------------------------
  {
    key: "scicluna",
    status: "declined",
    eventType: "wedding",
    eventDate: saturdayInMonths(8),
    guestCount: 200,
    firstName: "Ryan",
    lastName: "Scicluna",
    partnerName: "Amy Debono",
    submittedDaysAgo: 20,
    sourcePage: "/weddings",
    closeReason: "Date already confirmed for another wedding. Offered two alternatives.",
  },
  {
    key: "morgan",
    status: "declined",
    eventType: "celebration",
    eventDate: new Date(Date.UTC(start.getUTCFullYear(), 11, 25)),
    guestCount: 300,
    firstName: "Kate",
    lastName: "Morgan",
    message: "Christmas Day party for the extended family.",
    submittedDaysAgo: 15,
    sourcePage: "/celebrations",
    closeReason: "Closed over Christmas.",
  },

  // --- Cancelled or withdrawn -------------------------------------------------
  {
    key: "agius-spiteri",
    status: "cancelled",
    eventType: "wedding",
    eventDate: saturdayInMonths(6),
    guestCount: 130,
    firstName: "Zoe",
    lastName: "Agius",
    partnerName: "Matthew Spiteri",
    spaces: [SPACE_IDS.terrace, SPACE_IDS.hall],
    submittedDaysAgo: 150,
    sourcePage: "/weddings",
    quote: { status: "accepted", mealFormat: TIERS.receptionLavender, sentDaysAgo: 140 },
    deposit: { daysAgo: 130, method: "card" },
    closeReason: "Couple moved abroad. Deposit refund under discussion.",
  },
  {
    key: "zarb-launch",
    status: "withdrawn",
    eventType: "corporate",
    eventDate: thursdayInMonths(4),
    guestCount: 80,
    firstName: "Paul",
    lastName: "Zarb",
    submittedDaysAgo: 60,
    sourcePage: "/corporate",
    closeReason: "Product launch postponed indefinitely.",
  },

  // --- Completed: the event has happened ------------------------------------
  {
    key: "dimech-zammit",
    status: "completed",
    eventType: "wedding",
    eventDate: saturdayInMonths(-2),
    guestCount: 150,
    firstName: "Rachel",
    lastName: "Dimech",
    partnerName: "Paul Zammit",
    spaces: [SPACE_IDS.terrace, SPACE_IDS.hall],
    submittedDaysAgo: 400,
    sourcePage: "/weddings",
    quote: {
      status: "accepted",
      mealFormat: TIERS.receptionRose,
      beverage: TIERS.foreignWine,
      sentDaysAgo: 390,
    },
    deposit: { daysAgo: 380, method: "bank-transfer" },
    balancePaid: true,
  },
  {
    key: "brown-taylor",
    status: "completed",
    eventType: "wedding",
    eventDate: saturdayInMonths(-5),
    guestCount: 70,
    firstName: "Alice",
    lastName: "Brown",
    partnerName: "Sam Taylor",
    spaces: [SPACE_IDS.terrace],
    submittedDaysAgo: 420,
    sourcePage: "/weddings",
    quote: { status: "accepted", mealFormat: TIERS.highTeaHibiscus, sentDaysAgo: 410 },
    deposit: { daysAgo: 400, method: "card" },
    balancePaid: true,
  },
  {
    key: "cassar-staff-party",
    status: "completed",
    eventType: "corporate",
    eventDate: thursdayInMonths(-1),
    guestCount: 95,
    firstName: "Joseph",
    lastName: "Cassar",
    spaces: [SPACE_IDS.hall],
    submittedDaysAgo: 120,
    sourcePage: "/corporate",
    quote: { status: "accepted", mealFormat: TIERS.banquetOrchid, sentDaysAgo: 110 },
    deposit: { daysAgo: 100, method: "bank-transfer" },
    balancePaid: true,
  },
  {
    key: "galea-anniversary",
    status: "completed",
    eventType: "celebration",
    eventDate: saturdayInMonths(-3),
    guestCount: 40,
    firstName: "Maria",
    lastName: "Galea",
    spaces: [SPACE_IDS.terrace],
    message: "Our 40th wedding anniversary.",
    submittedDaysAgo: 160,
    sourcePage: "/celebrations",
  },
]

// --- Builders ----------------------------------------------------------------

export const bookingId = (key: string) => privateSeedId("booking", key)

const quoteId = (key: string, version = "") => privateSeedId("quote", `${key}${version}`)

let phoneCounter = 100

const phoneNumber = () => `+44 7700 900${String(phoneCounter++).padStart(3, "0")}`

const emailFor = (spec: BookingSpec) =>
  `${spec.firstName}.${spec.lastName}`.toLowerCase().replace(/[^a-z.]/g, "") +
  "@example.com"

const VAT_RATE = 18
const DEPOSIT_PERCENT = 30

const buildQuote = (
  spec: BookingSpec,
  quoteSpec: NonNullable<BookingSpec["quote"]>,
  idSuffix = "",
  statusOverride?: string,
) => {
  const eventDate = spec.eventDate!
  const lineItems = keyed([
    {
      _type: "quoteLineItem",
      label: quoteSpec.mealFormat.label,
      category: "food",
      quantity: spec.guestCount,
      unitAmount: quoteSpec.mealFormat.amount,
      sourceRef: reference(quoteSpec.mealFormat.id),
    },
    ...(quoteSpec.beverage
      ? [
          {
            _type: "quoteLineItem",
            label: quoteSpec.beverage.label,
            category: "beverage",
            quantity: spec.guestCount,
            unitAmount: quoteSpec.beverage.amount,
            sourceRef: reference(quoteSpec.beverage.id),
          },
        ]
      : []),
    ...(quoteSpec.extras ?? []).map((extra) => ({ _type: "quoteLineItem", ...extra })),
  ])

  // The same sums the Studio does, so seeded quotes read as if staff made them.
  const sums = (discountAmount = 0) =>
    calculateQuoteTotals({
      lineItems,
      discountAmount,
      vatRate: VAT_RATE,
      guestCount: spec.guestCount,
      depositPercent: DEPOSIT_PERCENT,
    })
  const roundTo = quoteSpec.roundPerPersonDownTo
  const undiscounted = sums()
  const roundedPerPerson = roundTo
    ? Math.floor(undiscounted.subtotal / spec.guestCount / roundTo) * roundTo
    : undefined
  // In cents, so the subtraction doesn't drift by a fraction of a cent.
  const discountAmount = roundedPerPerson
    ? euros(cents(undiscounted.subtotal) - cents(roundedPerPerson * spec.guestCount))
    : 0
  const totals = sums(discountAmount)
  const sentAt = addDays(start, -(quoteSpec.sentDaysAgo ?? 0))

  return {
    _id: quoteId(spec.key, idSuffix),
    _type: "quote",
    reference: `BAC-${isoDate(sentAt).replace(/-/g, "")}-${spec.key.slice(0, 4).toUpperCase()}${idSuffix.toUpperCase()}`,
    status: statusOverride ?? quoteSpec.status,
    booking: reference(bookingId(spec.key)),
    addressedTo: spec.partnerName
      ? `${spec.firstName} ${spec.lastName} & ${spec.partnerName}`
      : `${spec.firstName} ${spec.lastName}`,
    preparedBy: NICHOLAS,
    ...(quoteSpec.clientNotes ? { clientNotes: quoteSpec.clientNotes } : {}),
    event: {
      date: isoDate(eventDate),
      startTime: spec.eventType === "wedding" ? "17:00" : "19:30",
      endTime: spec.eventType === "wedding" ? "22:00" : "23:30",
      guestCount: spec.guestCount,
      ...(spec.spaces ? { spaces: keyedReferences(spec.spaces) } : {}),
    },
    menu: {
      mealFormat: reference(quoteSpec.mealFormat.id),
      ...(quoteSpec.cake ? { cake: quoteSpec.cake } : {}),
      ...(quoteSpec.beverage
        ? { beverages: keyedReferences([quoteSpec.beverage.id]) }
        : {}),
    },
    pricing: {
      lineItems: lineItems.map((line, index) => ({
        ...line,
        amount: totals.lineAmounts[index].amount,
      })),
      subtotal: totals.subtotal,
      ...(discountAmount
        ? {
            discount: {
              amount: discountAmount,
              reason: `Rounded to €${roundedPerPerson} a person`,
            },
          }
        : {}),
      total: totals.total,
      vat: { rate: VAT_RATE, amount: totals.vatAmount },
      perPerson: totals.perPerson,
      deposit: { percent: DEPOSIT_PERCENT, amount: totals.depositAmount! },
    },
    terms: {
      balanceDueDate: isoDate(addDays(eventDate, -14)),
      // 30 days, as Bacchus's own quotes give.
      validUntil: isoDate(addDays(sentAt, 30)),
    },
  }
}

const buildPayments = (
  spec: BookingSpec,
  quote: ReturnType<typeof buildQuote> | null,
) => {
  if (!spec.deposit || !quote) return undefined

  const depositAt = addDays(start, -spec.deposit.daysAgo)
  const payment = (kind: string, amount: number, at: Date, method: string) => ({
    _type: "paymentRecord",
    method,
    kind,
    status: "received",
    // Card fees at roughly the usual rate for European cards: 1.5% + €0.25.
    ...(method === "card"
      ? {
          amounts: {
            gross: amount,
            fee: euros(Math.round(cents(amount) * 0.015 + 25)),
            net: euros(cents(amount) - Math.round(cents(amount) * 0.015 + 25)),
          },
          reference: `pay_test_seed_${spec.key.replace(/-/g, "_")}_${kind}`,
        }
      : {
          amounts: { gross: amount, net: amount },
          reference: quote.reference,
          reconciliation: { by: "Events team", at: isoDateTime(addDays(at, 1), 9) },
        }),
    receivedAt: isoDateTime(at, 11),
  })

  const payments = [
    payment("deposit", quote.pricing.deposit.amount, depositAt, spec.deposit.method),
  ]

  if (spec.balancePaid) {
    payments.push(
      payment(
        "balance",
        euros(cents(quote.pricing.total) - cents(quote.pricing.deposit.amount)),
        addDays(spec.eventDate!, -14),
        "bank-transfer",
      ),
    )
  }

  return keyed(payments)
}

const statusEvent = (
  to: string,
  from: string | undefined,
  at: Date,
  actor: string,
  reason?: string,
) => ({
  _type: "statusEvent",
  to,
  ...(from ? { from } : {}),
  at: isoDateTime(at, 12),
  actor,
  ...(actor === "staff" ? { actorDetail: "Events team" } : {}),
  ...(reason ? { reason } : {}),
})

// The route each status took to get where it is.
const STATUS_PATHS: Record<BookingStatus, BookingStatus[]> = {
  new: ["new"],
  "in-discussion": ["new", "in-discussion"],
  "awaiting-deposit": ["new", "in-discussion", "awaiting-deposit"],
  confirmed: ["new", "in-discussion", "awaiting-deposit", "confirmed"],
  completed: ["new", "in-discussion", "awaiting-deposit", "confirmed", "completed"],
  cancelled: ["new", "in-discussion", "awaiting-deposit", "confirmed", "cancelled"],
  declined: ["new", "declined"],
  withdrawn: ["new", "in-discussion", "withdrawn"],
}

const buildHistory = (spec: BookingSpec, submittedAt: Date) => {
  const quoteSentAt =
    spec.quote?.sentDaysAgo === undefined
      ? addDays(submittedAt, 5)
      : addDays(start, -spec.quote.sentDaysAgo)
  const confirmedAt = spec.deposit
    ? addDays(start, -spec.deposit.daysAgo)
    : addDays(submittedAt, 7)

  const when: Record<BookingStatus, Date> = {
    new: submittedAt,
    "in-discussion": addDays(submittedAt, 1),
    "awaiting-deposit": quoteSentAt,
    confirmed: confirmedAt,
    completed: spec.eventDate ? addDays(spec.eventDate, 1) : start,
    cancelled: addDays(start, -10),
    declined: addDays(submittedAt, 1),
    withdrawn: addDays(submittedAt, 10),
  }

  const actorFor = (status: BookingStatus) => {
    if (status === "new") return "visitor"
    if (status === "completed") return "cron"
    if (status === "confirmed" && spec.deposit?.method === "card")
      return "payment-webhook"

    return "staff"
  }

  const path = STATUS_PATHS[spec.status]

  return keyed(
    path.map((status, index) =>
      statusEvent(
        status,
        path[index - 1],
        when[status],
        actorFor(status),
        index === path.length - 1 ? spec.closeReason : undefined,
      ),
    ),
  )
}

const buildBooking = (spec: BookingSpec, quote: ReturnType<typeof buildQuote> | null) => {
  const submittedAt = addDays(start, -spec.submittedDaysAgo)
  const reviewAt = new Date(submittedAt)
  reviewAt.setUTCMonth(reviewAt.getUTCMonth() + RETENTION_MONTHS)
  const payments = buildPayments(spec, quote)

  return {
    _id: bookingId(spec.key),
    _type: "booking",
    status: spec.status,
    statusHistory: buildHistory(spec, submittedAt),
    client: {
      firstName: spec.firstName,
      lastName: spec.lastName,
      ...(spec.partnerName ? { partnerName: spec.partnerName } : {}),
      email: emailFor(spec),
      phone: phoneNumber(),
    },
    event: {
      type: spec.eventType,
      ...(spec.eventDate ? { date: isoDate(spec.eventDate) } : {}),
      dateIsFlexible: spec.dateIsFlexible ?? false,
      ...(spec.backupDate ? { backupDate: isoDate(spec.backupDate) } : {}),
      guestCount: spec.guestCount,
      ...(spec.spaces ? { spaces: keyedReferences(spec.spaces) } : {}),
      spacesGuidanceRequested: spec.spacesGuidanceRequested ?? false,
      ...(spec.eventStyle ? { style: spec.eventStyle } : {}),
    },
    ...(spec.message ? { message: spec.message } : {}),
    consent: {
      _type: "consentRecord",
      given: true,
      givenAt: isoDateTime(submittedAt, 20),
      wording: CONSENT_WORDING,
      sourcePage: spec.sourcePage,
      retentionReviewAt: isoDate(reviewAt),
    },
    ...(quote ? { quote: reference(quote._id) } : {}),
    ...(payments ? { payments } : {}),
    sourcePage: spec.sourcePage,
    ...(spec.suggestedReply ? { suggestedReply: spec.suggestedReply } : {}),
    ...(spec.internalNotes ? { internalNotes: spec.internalNotes } : {}),
  }
}

const quotes = BOOKINGS.flatMap((spec) =>
  spec.quote && spec.eventDate ? [buildQuote(spec, spec.quote)] : [],
)

// Borg & Farrugia's first quote, on the wrong tier, replaced by the second.
const borgFarrugia = BOOKINGS.find((spec) => spec.key === "borg-farrugia")!
const supersededQuote = buildQuote(
  borgFarrugia,
  { ...borgFarrugia.quote!, mealFormat: TIERS.banquetOrchid, sentDaysAgo: 70 },
  "-v1",
  "superseded",
)

const bookings = BOOKINGS.map((spec) =>
  buildBooking(spec, quotes.find((quote) => quote._id === quoteId(spec.key)) ?? null),
)

// --- The waitlist ------------------------------------------------------------

const dateOf = (key: string) => BOOKINGS.find((spec) => spec.key === key)!.eventDate!

const waitlistEntry = (
  key: string,
  eventDate: Date,
  name: string,
  status: string,
  details: { verified?: boolean; notifiedDaysAgo?: number; convertedTo?: string } = {},
) => {
  const joinedAt = addDays(start, -40)

  return {
    _id: privateSeedId("waitlistEntry", key),
    _type: "waitlistEntry",
    eventDate: isoDate(eventDate),
    email: `${name.split(" ")[0].toLowerCase()}.${key}@example.com`,
    name,
    status,
    ...(details.verified === false ? {} : { verifiedAt: isoDateTime(joinedAt, 21) }),
    ...(details.notifiedDaysAgo === undefined
      ? {}
      : { notifiedAt: isoDateTime(addDays(start, -details.notifiedDaysAgo), 9) }),
    ...(details.convertedTo
      ? { convertedBooking: reference(bookingId(details.convertedTo)) }
      : {}),
    consent: {
      _type: "consentRecord",
      given: true,
      givenAt: isoDateTime(joinedAt, 20),
      wording:
        "Email me if this date becomes available. One email, then you're off the list.",
      sourcePage: "/weddings",
    },
    sourcePage: "/weddings",
  }
}

const waitlist = [
  waitlistEntry("w1", dateOf("turner-grech"), "Anna Spiteri", "active"),
  waitlistEntry("w2", dateOf("borg-farrugia"), "Leah Grima", "active"),
  waitlistEntry("w3", dateOf("borg-farrugia"), "Nicole Attard", "active", {
    verified: false,
  }),
  waitlistEntry("w4", dateOf("clarke-price"), "Sarah Pace", "active"),
  // The cancelled Agius & Spiteri date: everyone waiting was told, and one
  // of them became the Ellis enquiry.
  waitlistEntry("w5", dateOf("agius-spiteri"), "Jenny Camilleri", "notified", {
    notifiedDaysAgo: 10,
  }),
  waitlistEntry("w6", dateOf("agius-spiteri"), "Megan Ellis", "converted", {
    notifiedDaysAgo: 10,
    convertedTo: "ellis",
  }),
  waitlistEntry("w7", saturdayInMonths(-1), "Claire Muscat", "lapsed"),
  waitlistEntry("w8", saturdayInMonths(9), "Rebecca Zahra", "unsubscribed"),
]

export const COMPLETED_BOOKINGS = {
  dimechZammit: bookingId("dimech-zammit"),
  brownTaylor: bookingId("brown-taylor"),
  cassar: bookingId("cassar-staff-party"),
  galea: bookingId("galea-anniversary"),
}

export const bookingDocuments = [...bookings, ...quotes, supersededQuote, ...waitlist]
