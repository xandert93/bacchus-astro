/**
 * Enquiries and bookings in every status, the quotes behind them, their
 * payments, and the waitlist.
 *
 * Every person here is invented. Emails use example.com and phone numbers
 * Ofcom's 07700 900xxx range, both reserved for fiction, so nothing can ever
 * reach a real inbox or phone. Dates are relative to the day the seed runs.
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
  provenance,
  reference,
  saturdayInMonths,
  thursdayInMonths,
  today,
} from "./lib"
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
    label: "Reception — Daisy",
    amount: 53,
  },
  receptionLavender: {
    id: "packageTier-reception-lavender",
    label: "Reception — Lavender",
    amount: 57,
  },
  receptionRose: {
    id: "packageTier-reception-rose",
    label: "Reception — Rose",
    amount: 64,
  },
  banquetOrchid: {
    id: "packageTier-banquet-orchid",
    label: "Banquet — Orchid",
    amount: 65,
  },
  banquetDahlia: {
    id: "packageTier-banquet-dahlia",
    label: "Banquet — Dahlia",
    amount: 85,
  },
  highTeaHibiscus: {
    id: "packageTier-high-tea-hibiscus",
    label: "High Tea — Hibiscus",
    amount: 45,
  },
  localWine: {
    id: "packageTier-beverage-local-wine",
    label: "Local wine package",
    amount: 30,
  },
  foreignWine: {
    id: "packageTier-beverage-foreign-wine",
    label: "Foreign wine package",
    amount: 35,
  },
}

type Tier = (typeof TIERS)[keyof typeof TIERS]

type Status = "pending" | "confirmed" | "declined" | "cancelled" | "completed"

interface BookingSpec {
  key: string
  status: Status
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
    sentDaysAgo?: number
  }
  // When the deposit arrived, and how.
  deposit?: { daysAgo: number; method: "card" | "bank-transfer" }
  balancePaid?: boolean
  declineReason?: string
  cancelReason?: string
  internalNotes?: string
  suggestedReply?: string
  depositHoldDays?: number
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
      extras: [
        { label: "Round family tables", category: "setup", quantity: 14, unitAmount: 15 },
        { label: "Sound system", category: "setup", quantity: 1, unitAmount: 500 },
      ],
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
        { label: "Round family tables", category: "setup", quantity: 22, unitAmount: 15 },
        { label: "Chair bows", category: "setup", quantity: 220, unitAmount: 3 },
        { label: "Bar pieces", category: "setup", quantity: 2, unitAmount: 250 },
      ],
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
          label: "Secret Garden, exclusive use",
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
      extras: [
        { label: "Sound system", category: "setup", quantity: 1, unitAmount: 500 },
      ],
      sentDaysAgo: 35,
    },
    deposit: { daysAgo: 28, method: "bank-transfer" },
  },

  // --- Pending: enquiries waiting for a reply -------------------------------
  {
    key: "vella-camilleri",
    status: "pending",
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
    },
    suggestedReply:
      "Dear Laura and Karl,\n\nThank you for thinking of Bacchus for your wedding. Your date is currently available. The Secret Garden isn't part of our standard package, but it can be added for your ceremony; vegetarian menus are no trouble at all.\n\nWould you like to come for a viewing? We hold them Monday to Friday, by appointment.\n\nWarm regards,\nThe Bacchus events team",
  },
  {
    key: "mallia",
    status: "pending",
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
    status: "pending",
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
    status: "pending",
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
    status: "pending",
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
    status: "pending",
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
      sentDaysAgo: 2,
    },
    depositHoldDays: 5,
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
    declineReason:
      "Date already confirmed for another wedding. Offered two alternatives.",
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
    declineReason: "Closed over Christmas.",
  },

  // --- Cancelled: was confirmed, then fell through ---------------------------
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
    cancelReason:
      "Couple moved abroad. Deposit refund under discussion (terms contested).",
  },
  {
    key: "zarb-launch",
    status: "cancelled",
    eventType: "corporate",
    eventDate: thursdayInMonths(4),
    guestCount: 80,
    firstName: "Paul",
    lastName: "Zarb",
    submittedDaysAgo: 60,
    sourcePage: "/corporate",
    cancelReason: "Product launch postponed indefinitely.",
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

const contestedTerms = provenance(
  "contested",
  "catalogue",
  "30% deposit, balance 14 days out",
  {
    conflictingValue: "Terms described as 'quite flexible'",
    conflictingSource: "Client correspondence, 17 September 2026",
  },
)

const buildQuote = (
  spec: BookingSpec,
  quoteSpec: NonNullable<BookingSpec["quote"]>,
  idSuffix = "",
  statusOverride?: string,
) => {
  const eventDate = spec.eventDate!
  const lines = [
    {
      label: `${quoteSpec.mealFormat.label}, per person`,
      category: "food",
      quantity: spec.guestCount,
      unitAmount: quoteSpec.mealFormat.amount,
      sourceRef: quoteSpec.mealFormat.id,
    },
    ...(quoteSpec.beverage
      ? [
          {
            label: `${quoteSpec.beverage.label}, per person`,
            category: "beverage",
            quantity: spec.guestCount,
            unitAmount: quoteSpec.beverage.amount,
            sourceRef: quoteSpec.beverage.id,
          },
        ]
      : []),
    ...(quoteSpec.extras ?? []).map((extra) => ({ ...extra, sourceRef: undefined })),
  ]

  // Prices include VAT (confirmed by email), so the VAT is the share of the
  // total, not an addition to it.
  const totalCents = lines.reduce(
    (sum, line) => sum + cents(line.unitAmount) * line.quantity,
    0,
  )
  const vatCents = Math.round(totalCents - totalCents / (1 + VAT_RATE / 100))
  const sentAt = addDays(start, -(quoteSpec.sentDaysAgo ?? 0))

  return {
    _id: quoteId(spec.key, idSuffix),
    _type: "quote",
    reference: `BAC-${isoDate(eventDate).replace(/-/g, "")}-${spec.key.slice(0, 4).toUpperCase()}${idSuffix}`,
    status: statusOverride ?? quoteSpec.status,
    booking: reference(bookingId(spec.key)),
    clientDisplayName: spec.partnerName
      ? `${spec.firstName} ${spec.lastName} & ${spec.partnerName}`
      : `${spec.firstName} ${spec.lastName}`,
    eventDate: isoDate(eventDate),
    startTime: spec.eventType === "wedding" ? "17:00" : "19:30",
    endTime: spec.eventType === "wedding" ? "22:00" : "23:30",
    guestCount: spec.guestCount,
    ...(spec.spaces ? { spaces: keyedReferences(spec.spaces) } : {}),
    mealFormatTier: reference(quoteSpec.mealFormat.id),
    ...(quoteSpec.beverage
      ? { beverageSelections: keyedReferences([quoteSpec.beverage.id]) }
      : {}),
    lineItems: keyed(
      lines.map((line) => ({
        _type: "quoteLineItem",
        label: line.label,
        category: line.category,
        quantity: line.quantity,
        unitAmount: line.unitAmount,
        amount: euros(cents(line.unitAmount) * line.quantity),
        ...(line.sourceRef ? { sourceRef: reference(line.sourceRef) } : {}),
      })),
    ),
    subtotal: euros(totalCents - vatCents),
    vatRate: VAT_RATE,
    vatAmount: euros(vatCents),
    total: euros(totalCents),
    perPersonAmount: euros(Math.round(totalCents / spec.guestCount)),
    depositPercent: DEPOSIT_PERCENT,
    depositAmount: euros(Math.round((totalCents * DEPOSIT_PERCENT) / 100)),
    balanceDueDate: isoDate(addDays(eventDate, -14)),
    validUntil: isoDate(addDays(sentAt, 14)),
    termsProvenance: contestedTerms,
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
    grossAmount: amount,
    // Card fees at roughly Stripe's rate for European cards: 1.5% + €0.25.
    ...(method === "card"
      ? {
          feeAmount: euros(Math.round(cents(amount) * 0.015 + 25)),
          netAmount: euros(cents(amount) - Math.round(cents(amount) * 0.015 + 25)),
          stripeSessionId: `cs_test_seed_${spec.key.replace(/-/g, "_")}_${kind}`,
        }
      : {
          reference: quote.reference,
          reconciledBy: "Events team",
          reconciledAt: isoDateTime(addDays(at, 1), 9),
        }),
    receivedAt: isoDateTime(at, 11),
  })

  const payments = [
    payment("deposit", quote.depositAmount, depositAt, spec.deposit.method),
  ]

  if (spec.balancePaid) {
    payments.push(
      payment(
        "balance",
        euros(cents(quote.total) - cents(quote.depositAmount)),
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

const buildHistory = (spec: BookingSpec, submittedAt: Date) => {
  const history = [statusEvent("pending", undefined, submittedAt, "visitor")]
  const confirmedAt = spec.deposit
    ? addDays(start, -spec.deposit.daysAgo)
    : addDays(submittedAt, 7)
  const confirmedBy = spec.deposit?.method === "card" ? "payment-webhook" : "staff"

  if (spec.status === "declined") {
    history.push(
      statusEvent(
        "declined",
        "pending",
        addDays(submittedAt, 1),
        "staff",
        spec.declineReason,
      ),
    )
  }

  if (["confirmed", "cancelled", "completed"].includes(spec.status)) {
    history.push(statusEvent("confirmed", "pending", confirmedAt, confirmedBy))
  }

  if (spec.status === "cancelled") {
    history.push(
      statusEvent(
        "cancelled",
        "confirmed",
        addDays(start, -10),
        "staff",
        spec.cancelReason,
      ),
    )
  }

  if (spec.status === "completed") {
    history.push(
      statusEvent("completed", "confirmed", addDays(spec.eventDate!, 1), "cron"),
    )
  }

  return keyed(history)
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
    eventType: spec.eventType,
    ...(spec.eventDate ? { eventDate: isoDate(spec.eventDate) } : {}),
    dateIsFlexible: spec.dateIsFlexible ?? false,
    ...(spec.backupDate ? { backupDate: isoDate(spec.backupDate) } : {}),
    guestCount: spec.guestCount,
    ...(spec.spaces ? { spacesOfInterest: keyedReferences(spec.spaces) } : {}),
    spacesGuidanceRequested: spec.spacesGuidanceRequested ?? false,
    ...(spec.eventStyle ? { eventStyle: spec.eventStyle } : {}),
    ...(spec.message ? { message: spec.message } : {}),
    firstName: spec.firstName,
    lastName: spec.lastName,
    ...(spec.partnerName ? { partnerName: spec.partnerName } : {}),
    email: emailFor(spec),
    phone: phoneNumber(),
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
    ...(spec.depositHoldDays
      ? { depositHoldExpiresAt: isoDateTime(addDays(start, spec.depositHoldDays), 17) }
      : {}),
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
