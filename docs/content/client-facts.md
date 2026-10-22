# Client facts

Everything we know about Bacchus as a business: the venue, the packages, the
prices and the policies. Also what the site currently shows as a placeholder,
and what still has to be asked.

**How sure we are.** Each fact comes from one of three sources:

- **Catalogue**: the PDF wedding catalogue (`public/docs/`).
- **Quote**: one real client quote, "Quote REV00 - Bertha & Alex", prepared
  12 July 2026 (see [The real quote](#the-real-quote)). Bacchus's own
  document, so treat it as confirmed. Kept out of git (it names a couple):
  the user holds the file.
- **Email**: client correspondence received 17 September 2026 (two threads
  answering a couple's questions, plus a Q&A thread). Written by Bacchus, so
  treat it as confirmed.

Where the catalogue and the emails disagree, the fact is marked **Conflict**.
Never pick one side yourself; flag it to the client.

---

## Contents

1. [The venue](#the-venue)
2. [Spaces and capacity](#spaces-and-capacity)
3. [The day itself](#the-day-itself)
4. [Packages](#packages)
5. [Prices](#prices)
6. [The real quote](#the-real-quote)
7. [Booking terms](#booking-terms)
8. [Open conflicts](#open-conflicts)
9. [Placeholders on the site](#placeholders-on-the-site)
10. [Questions for the client](#questions-for-the-client)

---

## The venue

- **Restaurant**: two vaulted stone chambers, built 1657–1660 by Grand Master
  Fra Martino de Redin as a gunpowder magazine. This is the restaurant's lower
  level only. Weddings and events are not held there.

- **Events spaces**: the Secret Garden, the Prince De Redin Hall (the banquet
  hall, named after the same Grand Master) and a Terrace, all on the same
  estate. These names come from the catalogue and are not yet confirmed.

- **The estate** (catalogue): roughly one-twelfth of Mdina ("the Silent
  City"). About 4,500 m² of grounds, including about 500 m² of covered
  open-plan banqueting space. The Secret Garden has Roman and Arab remains
  from the 1st century.

- **The business**: the catering company (BCL) has been family-run since
  **1976**, which matches the live site's "50+ years". The homepage's
  "35+ years" is a placeholder that should become this once confirmed.

- **Social accounts** (supplied by the client):
  - Facebook: `https://www.facebook.com/bacchusMdina`
  - Instagram: `https://www.instagram.com/bacchus_mdina/`

- **Photography**: no photo of the vaulted chambers exists yet. Add it to the
  next asset request; don't stand in a hall or terrace photo.

---

## Spaces and capacity

All from the emails unless marked.

- **The standard package includes the Terrace and the ballroom.** "Ballroom"
  probably means the Prince De Redin Hall (the quote calls it the "De Redin
  Ballroom"), but the naming isn't confirmed as a match.

- **The Secret Garden is not included by default.** The client suggested it as
  a chill-out or shisha area if a couple wants it. Any guide that mentions the
  garden must say this.

- **Exclusivity** of the whole venue costs an extra fee (see
  [Prices](#prices)).

- **The indoor hall is always included** alongside the outdoor space. It is not
  just a wet-weather fallback; both can be used at once.

- **The downstairs restaurant closes to the public** once a wedding has more
  than 150 guests.

- **Capacity: 50–800 guests, standing.** The layout is adjusted to the guest
  count. This is a standing figure, so it is not a drop-in replacement for the
  homepage's "Up to 120 seated".

- **Accessibility**: a stairlift, and staff help guests with any needs.

- **Parking**: guests can book "the Tomba". Nobody has said what that is.
  Find out before the site mentions parking.

---

## The day itself

All from the emails.

- **Length**: packages are usually 5 hours. With overtime (~€10-15 per person per additional hour), some run 6–8 hours. The client advises against going
  past 8 and that 6 works best.

- **Formats**: seated and standing receptions are both offered.

- **Music**: room for a live band, a DJ and a dance floor. Outdoor music until
  11pm, indoor until 4am.

- **Bridal party**: a private room is available.

- **Arrival**: the staircase up from the downstairs dining room is always
  dressed with a red carpet. Bacchus can arrange a walkthrough of a fully
  dressed event on request.

- **Included at no extra charge**: all catering furniture and utensils, basic
  decoration, and an in-house wedding coordinator (a member of staff, not an
  outside planner).

- **What couples still bring**: flowers, entertainment (DJ or band, including
  a stage) and a photographer. A photobooth is a common extra. The client
  advised against adding much beyond that.

- **Cake**: an in-house cake is included in the Reception package price. The
  catalogue says "one tier per 100 guests", but in practice it is always
  **three tiers**, as a display (dummy) cake. Once it is cut, the celebratory
  drink and the real cake are served straight away. Couples may bring their own
  cake; the same display-cake convention applies.

- **Menu tasting** (emails, updated with what the user was told directly,
  October 2026):
  - **Request it in advance.**
  - The couple names their package and picks **16 items from it**: 6 hot
    dishes, 6 cold dishes and 4 desserts.
  - **Stations can't be tasted at all.**
  - **About €40 per person**, deducted from the wedding cost if the couple
    goes on to sign and pay the deposit.
  - **Free** if the couple has already paid (the deposit and the rest). The
    emails put it as "free once the contract is signed"; the two may differ
    slightly, so confirm the exact point before publishing it.

---

## Packages

- **Four packages** (catalogue):
  - **Reception**: Daisy, Lavender, Rose
  - **Banquet**: Orchid, Dahlia, Sunflower
  - **High Tea**: Jasmine, Hibiscus, Tulip
  - **Beverage**: Local Wine, Foreign Wine, Open Bar, Themed Bars

- **A wedding picks one of Reception, Banquet or High Tea.** They are
  alternative meal formats, not courses. The catalogue already calls High Tea
  "an alternative to the formal banquet"; Reception is assumed to be a third
  alternative. This is a working assumption based on the emails, and the
  Sanity schema is built on it.

- **Beverage is added on top** of whichever format is chosen. It is never an
  alternative to them.

- **Catering and drinks are both in the per-person price**, which depends on
  the tier. Vegetarian, vegan and gluten-free needs are catered for (emails).

- **No minimum** guest count or spend: "we would need to build this together"
  (emails). One all-inclusive rate, and the client says there are no hidden
  charges.

- **Not published, on purpose**: the catalogue's "After Mass Reception", and
  hidden (non-rendering) text on its T&Cs page giving "€35 Per Person" and
  "€59.50 Per Person" with prosecco supplements. Both need the client first.

---

## Prices

**Treat every figure here as one data point, not a rate card.** Prices come
from an internal system and change by month and season; April runs slightly
higher than March (emails). **VAT is included** in quoted prices (emails).

**Per person, from the quote:**

| Package   | Tiers                                                  |
| --------- | ------------------------------------------------------ |
| Reception | Daisy €53 · Lavender €57 · Rose €64                    |
| Banquet   | Orchid €65 · Dahlia €85 · Sunflower €95 (**Conflict**) |
| High Tea  | Jasmine €35 · Hibiscus €45 · Tulip €55                 |
| Beverage  | Maltese/Gozitan wine €30 · Italian/French wine €35     |
| Bar       | Open Bar €23 · Limited Open Bar €12                    |

**Corkage**: €6.50 on the quote, without saying per bottle or per person.
It only applies if a couple brings their own wine, Champagne or other drinks,
since packages already include drinks. The site deliberately doesn't publish
it until the unit is known.

**Exclusivity**: €500 per space appeared for the Secret Garden, De Redin
Ballroom, Chambers and Small Terrace. But one real booking showed a flat
€4,500 for "Terrace & Lawns". It isn't clear whether venue pricing is flat,
per space or per guest, so ask rather than state a rule.

**Set-up items** (quote):

- Round tables €15. These are the **family tables**: one for each family,
  up to 10 seats each.
- Chairs €5, bows €3, bistro tables €10.
- Bar pieces €250: physical bar structures, used instead of a skirted
  low-table drinks set-up.
- Sound €500, red carpet €150.

**The quote's VAT maths doesn't add up** (excl.-VAT total, VAT and incl.-VAT
total don't reconcile). Since VAT is confirmed as included, this is probably a
quirk of that one quote. Trust only the per-person and line-item prices.

---

## The real quote

Read in full on 2026-10-22 (only its prices had been recorded before). It's
a spreadsheet template: every item Bacchus sells is listed with its price,
and a quantity and total are filled in for the ones chosen.

**About the business**

- **The company is Bacchus Company Limited** (the quote's closing line).
  The receipts now show it (`src/data/business.ts`).
- **Quotes are prepared by a named person**: this one by **Nicholas Vella
  Gatt**, with the date. His title isn't given.
- **"This quote is valid for 30 days."** The catalogue's terms say 15.
  **Conflict**, though a mild one: the quote is the newer document and
  shows current practice. The Studio still assumes 7 (an illustrative
  number from the prototype, never Bacchus's).
- **"If the contract is not signed"**: they use a signed contract after
  the quote, which matters for how terms are accepted online
  (`booking-terms-draft.md`, D28).

**Prices on it not recorded elsewhere** (per person unless said; the
template doesn't state units, so "per person" is inferred from the
quantities used):

| Group          | Items                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Venue          | Secret Garden €500 · Chambers €500 · Small Terrace €500 · Terrace & Lawns €4,500 (this booking) · De Redin Ballroom, Outside Catering, Partial Exclusivity (amounts unreadable: the column was too narrow) |
| Wedding cake   | 1 tier €300 · 2 tiers €450 · 3 tiers €600 · custom; flavours almond, bacio, pistachio                                                                                                                      |
| Drinks         | Maltese and Gozitan wine €30 · Italian and French wine €35 · custom wine · after-Mass reception €9.50 · premium upgrades                                                                                   |
| Themed bars    | Cocktail €12.50 · whiskey €12.50 · champagne tower €20 · cigar €10.50 · gin €12.50 · rum €10.50 · welcome drink €6.50 · coffee €3.50                                                                       |
| Set-up         | Chairs €5 (and the items under Prices)                                                                                                                                                                     |
| Overtime       | €10 a rate (unit not stated; the emails say €10–15 a person per extra hour)                                                                                                                                |
| Custom package | Food and drinks lines for anything off the menu                                                                                                                                                            |

The station prices match the Studio's exactly.

**How the price is built**

- A summary by group: **Exclusive Use, Food, Beverage, Set-Up, Overtime**,
  then subtotal, **discount**, total excluding VAT, VAT, per person, and the
  total including VAT with its per-person figure.
- **The discount rounds the price to €100 a person**, VAT included: a
  €17,526 subtotal less €1,525.60 is €16,000.40, which is €100.00 for each
  of 160 guests.
- **Its VAT line is wrong**, which is why its maths never reconciled. VAT
  inside a €16,000.40 total is €2,440.74 (18/118 of it); the quote shows
  €2,880.07, which is 18% of the whole total. The total excluding VAT
  (€13,559.66) is right. A quote built by the site works VAT out one way
  only, so this can't happen there; worth mentioning gently, as their
  own quotes may carry the same error.
- **Other slips** a generated quote avoids: the date reads "Saturday 3 24
  2027" under "D M YEAR" columns (24 March 2027 is a Wednesday), and
  "Lavendar", "Whiskey Bat".
- **A free-text Notes section** for the client, and the cake flavour
  picked on the quote itself.

**What Nicholas said in person** (late September 2026, as the user
remembers it four weeks on, so confirm before relying on any of it):

- **Overtime is €10–15 a person**, depending on how many guests there are.
- **Every food package includes the cake.** The cake prices on the template
  are there for completeness.
- **Some set-up lines are there to show what's included** rather than to be
  charged, rounding the quote out.
- **Two bar pieces are offered per wedding.**
- **Chairs are included in the set-up**, usually for at most 30% of the
  guests (a standing reception seats some, not all). The template does
  price chairs (€5, 32 of them on this quote, a fifth of its 160 guests),
  so ask whether "included" means free or simply part of the set-up line.

**What it changes, or questions**

- **The cake**: the emails say an in-house cake is included in the
  Reception price, and Nicholas said every food package includes one; the
  quote prices cakes separately (€300–600). Probably those prices are for a
  couple who wants something different; confirm.
- **Themed bar and extras prices** are now known, but published nowhere;
  the site doesn't show them until Bacchus says they may be published.

## Booking terms

- **Catalogue**: a 30% non-refundable deposit confirms a wedding; the other
  70% is due 14 days before the event.

- **Emails**: terms are "quite flexible... mostly after the commitment",
  without restating the 30/70 split. **Conflict**: see below.

- **The organiser, in person** (as the user remembers it, 2026-10-18): 30%
  at booking (or six months before), 60% over the following months, and
  the last 10% one month before. A third version, not confirmed in writing.
  The 30% at booking is the deposit the site takes, and it secures the
  date.

---

## Open conflicts

Two places where the catalogue and the emails disagree. Don't publish either
as settled. This file is where open conflicts are tracked: the Studio stopped
tracking them on 2026-10-16, so Bacchus's staff never see our working notes
in their own admin.

1. **Banquet pricing.** The quote says Orchid €65, Dahlia €85, Sunflower €95.
   The emails say banqueting "begins at around €135 per person", is highly
   personalised and needs a dedicated meeting. The Banquet page shows the quote
   prices with an oxblood callout stating the conflict. **Keep that callout
   until this is settled**; it is the only thing telling a reader the number is
   contested.

2. **Deposit and cancellation.** 30/70 (catalogue) against "quite flexible"
   (emails) against 30/60/10 staged from booking to a month before (the
   organiser, verbally). Settle this before taking any real money.

---

## Placeholders on the site

Everything below is illustrative and is labelled as such on the page.

- **Capacity figures** ("Up to 120 seated" and similar) carry an inline
  disclaimer. Keep it until the client signs off which figure to publish.

- **The availability calendar** is live since 2026-10-17 (real bookings
  from Sanity). Its minimum notice (three months) and horizon (two years)
  come from the wedding policy and are still our assumptions.

- **The deposit page** (`secure-booking`) now shows the real quote it was
  sent for, in test mode (flagged; card and pay-by-bank payments take no money). The deposit
  split comes from the quote's terms, which inherit the contested 30/70. The
  bank details are the wedding policy's example ones, with a "do not send
  funds to this account" warning until Bacchus supplies theirs. How long a
  quote stays valid (7 days unless the wedding policy says otherwise) is our
  assumption, not a real policy. The banks listed on the pretend pay-by-bank
  page are illustrative.

- **The 16 Reception station images** are AI-generated stand-ins, added on the
  user's explicit call so the section looks finished in a pitch. They carry an
  oxblood on-page disclaimer and must be declared to Bacchus as placeholders.
  This is a one-off: **every other image is real Bacchus photography**, and
  nothing fabricated is ever added. Ask for real assets instead.

- **Testimonials**: the four on the homepage and Weddings page are real, from
  the client (`docs/content/testimonials-raw.md`). The gold-highlighted phrase
  in each is our own editorial choice.

- **Catalogue copy corrections** are ours, not theirs; see
  `catalogue-copy.md`.

---

## Questions for the client

- **The CMS subscription**, by 7 November 2026, when the free trial ends:
  Sanity's Growth plan keeps enquiry data private and lets staff have
  limited roles. It's $15 a month per person who logs in. Will Bacchus pay
  for it on their own account, and how many staff need to log in?
  (`docs/planning/sanity-rollout.md`, step 8, which also covers the free
  fallback.)

- **Space names**: are the Secret Garden, Prince De Redin Hall and Terrace the
  right names, and is "the ballroom" the Prince De Redin Hall?

- **Banquet pricing** and **deposit terms**: the two
  [conflicts](#open-conflicts).

- **Capacity**: which figure to publish, seated and standing.

- **Years in business**: confirm 1976 / "50+ years".

- **Venue pricing**: flat, per space or per guest?

- **Corkage**: per bottle or per person?

- **Parking**: what is "the Tomba"?

- **Tasting**: at what point does it become free: signing the contract, paying
  the deposit, or paying in full?

- **Catering off-site**: does BCL cater outside the venue? If so, that's a
  second service with its own page.

- **Catalogue corrections**: send the list in `catalogue-copy.md` for
  approval, especially the "Stir-Fried Vegetables" rewrite, the "BBQ Table"
  rename and the "Ġbejna" accent.

- **Reception stations**: approve the six category labels and Pasta Table's
  shortened item list (both carry an oxblood disclaimer).

- **High Tea (V) marks**: which High Tea dishes are vegetarian?

- **Reception stations (V) marks**: the catalogue marks none, so ours were
  judged from the dish names. Are they right?

- **Seasonal prices**: do prices change by season, and is there a rate card?
  (The only hint so far: April runs dearer than March.)

- **Minimum notice**: how soon before a date can a wedding still be booked?
  The site assumes three months.

- **Personal data**: how long should enquiry details be kept before they're
  deleted? The Studio assumes 36 months.

### Email (asked 2026-10-17)

- **Who manages the `bacchus.com.mt` domain** (its DNS)? The site's emails
  (enquiry confirmations, deposit links) should come from a Bacchus address,
  which needs a few records added there. Which address should they come
  from, e.g. `events@bacchus.com.mt`?

### Payments and bookings (asked 2026-10-16)

- **How do you take deposits and balances today?** Bank transfer, card over
  the phone, card machine, invoice?
- **Receipts and VAT invoices for deposits**: who issues them today (your
  accountant's system, your till)? The "date confirmed" email now carries a
  payment receipt (receipt number, date, method, amount, balance), showing
  only the trading name and address. For it to carry your registered name
  and VAT number we need them (`src/data/business.ts`). If a fiscal receipt
  or VAT invoice must come from your own system, the email should say one
  will follow.
- **Do you already have a card provider** for online payments or your card
  machine (Viva.com, Revolut Business, Stripe, a bank)? If so, which, and
  roughly what do you pay per card payment?
- **Deposit terms**: the percentage, whether it's refundable, and when the
  balance is due.
- **How long a quote stays valid** once it's sent. We've assumed seven days;
  it's a setting in the Studio (Wedding Policy, "Days a Quote Stays Valid"),
  and staff can set a different end date on any one quote. **The
  catalogue's terms say 15 days and their real quote says 30**: which is
  current?
- **The 30/60/10 schedule** we discussed in person: can you confirm it in
  writing? Is the 30% due when the couple books, however far ahead, and
  when exactly are the 60% and the last 10% due?
- **Holding a date**: while one couple has a quote, can another couple pay
  and take the date first, or is it held for the first couple only?
- **Bank transfer details** for the deposit page, once the terms are settled.
- **Viewings and tastings**: would couples booking a slot online (Cal.com or
  Calendly) help, or do you prefer to arrange them by email and phone?
- **Declining a quote**: should a couple be able to decline online, which
  frees their date for others, or would you rather they reply to you?

- **Shopify**: do they sell, or plan to sell, products or gift vouchers through
  it? See `docs/architecture/tech-stack.md`.

### For the call (added 2026-10-21)

- **How are enquiries and bookings recorded today?** An inbox, a diary, a
  spreadsheet, a calendar? Before launch we need every upcoming confirmed
  booking (and any open enquiry) in the Studio, or the calendar shows a
  booked date as free. A spreadsheet of them can be imported in one go; past
  events can stay where they are (`docs/planning/sanity-rollout.md`,
  "Before launch: their existing bookings").

  Our guess, unconfirmed: enquiries live in the `events@` inbox, booked
  dates in a paper diary, a spreadsheet or a shared calendar, quotes go out
  as Word or PDF attachments, and deposits are matched to couples by reading
  the bank statement. Why: every contact we've seen is by email and phone;
  their terms are "quite flexible", which reads as negotiated case by case;
  the current site takes no payments; and that's how most family-run venues
  of this size work. If so, the site takes over the repetitive parts
  (answering "is my date free?", sending quotes, chasing deposits, matching
  payments) while staff are still told everything by email, the habit they
  already have.

- **Cancellation after the deposit**: if a couple cancels, what happens to
  what they've paid beyond the deposit? Refunded in full, refunded on a
  sliding scale by how close the date is, or kept? This decides how much
  risk an early or full payment carries, for them and for you.
- **Google reviews**: the link to your Google Business profile's review page,
  so the review request and the thank-you screen can ask couples to post
  there too.
- **PDF quotes** (we're adding them, 2026-10-22): what must a quote show for
  your corporate clients (their company name and VAT number, a purchase
  order number)? Do you have standard terms and conditions to print on it?
- **Paying the balance**: would you let couples pay towards the balance in
  amounts of their choosing, any time before each due date?
- **Paying early**: would you consider a small discount for paying it all,
  or a large part of it, up front?
