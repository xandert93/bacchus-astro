# Decisions

Choices that were argued through and settled, with the reason, so they aren't
reopened by accident. "Not signed off" means the client hasn't approved it
yet, not that it's undecided between us.

---

## Contents

1. [Navigation](#navigation)
2. [Enquiry form](#enquiry-form)
3. [Availability calendar and waitlist](#availability-calendar-and-waitlist)
4. [Package pages](#package-pages)
5. [Testimonials](#testimonials)
6. [Photo carousel](#photo-carousel)
7. [PDF quotes](#pdf-quotes)
8. [Other](#other)

---

## Navigation

**Structure** (not signed off): **Restaurant ▾ · Events ▾ · Gallery · About**,
plus two buttons: **Book a table** (filled) and **Enquire** (outline).

- **Why two buttons**: the site now carries two businesses with different
  actions. Table booking is instant (Tableo); an event enquiry is slow. One
  button can't be both.
- **Book a table comes first**: Enquire already appears on every events page
  and in the footer; table booking had nowhere.
- **Restaurant and Events are both a page and a dropdown**: the label is a
  link and the chevron beside it opens the panel. On touch there's no hover to
  separate "open the menu" from "go to the page", so a toggle-only label
  would make the parent page unreachable. Each panel also repeats its hub page
  as a link.
- **Enquire gets its own page** (`/enquire`, not built): restaurant pages have
  no enquiry section to scroll to. The on-page enquiry sections stay, and each
  page's own button preselects its event type.
- **Package pages stay out of the nav**; they are reached from the Weddings
  page.
- **Unbuilt pages** appear with a "Proposed" badge and go nowhere.

**Panels**: a three-column grid on a dark frosted card.

- **Grid over a single column** because it absorbs new links sideways; a
  column grows longer with every page and already felt long at six.
- **Item counts matter**: Restaurant has three (one row), Events six (two
  rows). Adding or removing one leaves a gap.
- **The hub link sits in the panel's heading row**, not the grid.
- Per-row photo crossfade on hover (pure CSS) and photos that load on first
  open.

**Burger at 980px**, not 820px: four items, two buttons and the logo need
about 890px.

**Gaps it exposed**: there is no About page (the history, the family and the
estate only exist as homepage sections) and no photo of the chambers.

**Still to do**: the mobile drawer has never had a proper review.

---

## Enquiry form

A four-step wizard: **the occasion** (event type, date) → **the specifics**
(guests, spaces, message) → **your details** (name, email, phone) →
**review**.

- **"Other" is an event type** so a proposal, shoot or wake has an honest
  option instead of abandoning the form.
- **Contact details come last**: people give them more readily once they've
  already invested in the earlier questions.
- **Enter on steps 1–3 moves to the next step.** Without this, Enter would
  trigger the form's only submit button and could send the enquiry without
  ever showing Review.

---

## Availability calendar and waitlist

- **One source of truth**: the calendar reads each booking's status (open
  enquiries show as Enquiries received; confirmed and completed weddings as
  Booked). Nobody maintains a separate calendar.
- **Labels: Available / Enquiries received / Booked.** "Enquiries received"
  informs without pressuring; urgency counters clash with an exclusive venue,
  but hiding the information entirely doesn't help the visitor.
- **Only weddings use the calendar**, because only weddings are one per day.
  Other event types get a plain date field.
- **About two years ahead**, a typical lead time for an exclusive venue.
- **Staff approve or decline in Sanity Studio.** A custom dashboard was
  deferred as overkill for the expected volume.
- **Waitlist**: a booked date opens a small popover (name and email) anchored
  to the date: hover with a mouse, tap on touch, with a hint by the legend. An
  inline panel under the grid was tried and rejected.
- **Open**: should "Enquiries received" dates get the waitlist too? Only Booked
  does today.
- **Open**: is the name meant to be required?

---

## Package pages

- **URLs: `/weddings/packages/{reception,banquet,high-tea,beverage}`.** They
  only make sense inside the wedding journey. "Packages", not "dining",
  because Beverage isn't dining and "packages" is the catalogue's own word. No
  `-package` suffix, since the folder already says it.
- **Tiers are a hash** (`#rose`), not separate pages: Daisy, Lavender and Rose
  are a comparison, not three destinations.
- **Beverage is built differently on purpose.** It's added on top, not chosen
  instead. Four categories that combine freely, not three ranked tiers: a 2×2
  card grid, two-column lists (wines carry tasting notes), no sticky switcher
  (four names don't fit on mobile) and no dish tiles.
- **Cross-links**: Reception, Banquet and High Tea each link to the other two
  in a plain line of text, so a visitor can compare. Beverage links back to
  the packages section instead. A photo-card version was built and reverted
  as over-engineered; keep it simple.
- **Menu items are visible by default.** No per-item entrance animation.

---

## Testimonials

- **The card row is the real picker**; the dots are decoration.
- **The name gets its own line**, above the smaller category / place / date
  line, because the name is what tells them apart. Category and place are the
  same on all four today; reconsider showing them once that changes.
- **The countdown ring is on the forward arrow only.** A matching track on
  both made the back arrow look like a timer too.
- **The ring is an SVG stroke**, not a `conic-gradient`, which filled
  inconsistently.

### Reviews: Google first, the website second (2026-10-22)

- **Google reviews are the main focus.** They count towards Google's map
  results (how many reviews, the rating, how recent, whether the business
  replies), and people trust them because the business can't choose which
  show. Testimonials on our own site do little for search: Google ignores a
  business's reviews of itself and no longer shows stars for them.
- **The website's testimonials are curated stories**, placed where couples
  are deciding: a few specific, named quotes, not a rating.
- **No reviewer photos, for now.** The section doesn't show any. The photo a
  couple has of their day usually belongs to their photographer, who holds
  the copyright, so publishing it needs the photographer's permission too.
  If photos are wanted, Bacchus's own pictures of that event are the safe
  source.
- **Review gating is banned, and we don't do it.** It means sending happy
  clients to Google and unhappy ones somewhere private, so only the good
  reviews go public. Google's rules forbid asking selectively for positive
  reviews or discouraging negative ones. Google finds out from people
  reporting it (clients, competitors), from patterns (a burst of five-star
  reviews from new accounts), and from the asking page itself, which is
  public. It can remove the reviews or suspend the listing. So:
  - Everyone is asked by one fixed rule: every Completed booking, a week
    after the event (`src/lib/reviews/follow-ups.ts`).
  - Whoever sends our form is shown the Google prompt, whatever their rating,
    with their review ready to copy and paste. Built 2026-10-23 with a
    stand-in link (a Maps search for Bacchus) and a Proposed badge, until
    Bacchus supplies their own review link (`GOOGLE_REVIEWS_URL`,
    `src/data/reviews.ts`).
  - Not asking someone at all is fine for our own form, for a real reason
    (a dispute in progress). Never because their review might be bad.
    Staff asking couples by hand follow the same rule.
- **Permission to publish is a question with two answers**, neither chosen
  to start ("Yes: show it on Bacchus's website…" / "No: keep it between me
  and the Bacchus team"), and one must be picked. GDPR consent has to be an
  active choice: a box ticked in advance, or "tick to keep it private"
  (publishing by default), wouldn't count. Asking both ways gets a real
  answer, and more yeses than a lone box people skip.
- **No incentive for reviews** (a prize draw, vouchers): Google forbids
  offering anything for a review, and on our own site an incentive would
  have to be declared and would cheapen the reviews (2026-10-23).
- **Label the testimonials honestly.** EU consumer law (the 2022 "Omnibus"
  rules) treats a business that publishes only positive reviews, or claims
  reviews are genuine without checking, as misleading consumers. A selection
  of testimonials is normal, but it shouldn't pose as a full set of reviews.
  The section should present them as a selection, show no average rating
  made from them, and can say truthfully that each came from a real Bacchus
  client through a link only they receive. Not legal advice: worth Bacchus
  checking. Not done yet.

---

## Photo carousel

**The counter shows a range** ("1–2 / 5") when more than one photo fits, and a
single number ("2 / 5") on mobile.

- At desktop width there are four scroll positions for five photos, so no
  single number is honest.
- `index + 1` never reaches 5 / 5. "Last slide once at the end" skips a number
  and makes Next jump from 3 to 5. A position per photo makes the last Next do
  nothing visible.
- The range counts **fully** visible photos, since a third usually peeks in.

---

## PDF quotes

Settled with the user, 2026-10-22 and 23, over several drafts. **The
layout is `docs/design/quote-pdf/quote.pdf`** (chosen by the user on
2026-10-23, to show Bacchus):

- **Page 1 is the price alone**, through to the total, with room left to
  grow: a longer quote still fits on the page. Group names sit in a left
  column, as on Bacchus's own quote, each with its subtotal beneath. The
  total stays on page 1, because a price breakdown without its total looks
  unfinished to anyone checking it. A line under it points to page 2.
- **Page 2, "Securing your date"**, explains at length what page 1 can't:
  the deposit and the balance, how to pay, a warning not to share the
  private link, what happens next, the notes from Bacchus and who prepared
  the quote. Its unconfirmed details (the payment schedule, the tasting
  terms, when menu choices and final numbers are due) are in red brackets
  until Bacchus settles them.
- **The terms follow from page 3.**

**How it got there**, kept in `docs/design/quote-pdf/archive/`:

1. `1a-browser-rendering.pdf` and `1b-pdf-lib.pdf`: the same one-page quote
   made both ways, to choose how PDFs are made (Browser Rendering won).
2. `2-two-page.pdf`: real items and prices, groups as headings, the
   deposit and notes after the totals, which spilled onto page 2.
3. `3-one-page.pdf`: everything squeezed onto page 1, the deposit beside
   the totals. It fitted, but felt cramped, which led to the current
   layout.

The rules below apply to the current layout.

- **One PDF: the quote, then the booking terms.** Not two files.
  - It travels whole: a quote forwarded to a finance team, a parent or a
    planner always carries its terms. Sent separately, the terms get left
    behind.
  - Terms are safest legally when shown with the quote and before payment,
    so nobody can say they never saw them. One document makes that plain.
  - The deposit page links to the same terms, with an "I accept" box
    (`docs/content/booking-terms-draft.md`, "What the site needs").
- **The terms start on a page of their own**, so they read, print and sign
  as their own document.
- **The terms are printed with every quote**, not stitched on afterwards.
  They add a fraction of a second to each PDF, which costs nothing at a few
  quotes a day. If it ever mattered, the terms could be printed once per
  version and joined onto each quote with pdf-lib.
- **Made by Browser Rendering** (`docs/architecture/tech-stack.md`), from an
  HTML page made for print: A4, page margins, page numbers. It shares the
  site's colours and fonts, not the deposit page's layout.
- **The money is never split across pages**: the totals and the deposit
  stay together, moving to the next page together if the quote is long.
- **Lines read plainly**: "Reception – Rose", "Cocktail bar", with no
  "per person" (the quantity shows it), under Qty, Price and Amount.
  Bacchus's own product names are used as they are ("Salumerie Table").
- **Small set-up items are one line** whose small print names and prices
  each one, so the quote stays short without hiding anything. Items at no
  charge say "Included". The chairs and bar pieces included are a range for
  the guest count ("32–48 chairs and 1–2 bar pieces").
- **A group with two or more priced lines shows its subtotal.** With one,
  the subtotal would only repeat the line.
- **The event panel uses the same words as the table** (Food, Drinks), and
  spaces are named as the site names them, on the panel and on any line
  ("The Terrace", not Bacchus's internal "Terrace & Lawns", which means
  nothing to a couple).
- **A discount shows as "Discount"** with its amount. Its reason ("rounded
  to €190 a guest") is for staff, in the Studio: the client doesn't need to
  see how it was arrived at.
- **The gold phrase in the title is SVG text** with a gradient fill. CSS
  gradient text prints with a faint box around it.
- **Set-up is always one line when it has two or more**: "Tables and
  dressing", each item named and priced in its small print, the ones at no
  charge together at the end ("sound and red carpet, included"). A single
  set-up line stays as it is.
- **Built 2026-10-23 without the terms**, which follow once Bacchus approves
  them, and with page 2's unconfirmed details left out rather than shown
  in red: the payment schedule, the tasting terms, and when menu choices
  are due. A real client never sees a placeholder.

---

## Other

- **Dates are written with ordinals**: "Saturday 29th May 2027", and
  "23rd October 2026" without the weekday, as Bacchus writes them ("12th of
  July 2026" on their quote). Everywhere takes them from `src/lib/dates.ts`:
  emails, the deposit page, the review and waitlist pages, testimonials and
  the PDF quote.

- **Social links** (Facebook, Instagram) sit in the footer under the brand
  text and at the bottom of the mobile drawer, matching the live site.
- **The deposit page has its own CSS namespace** (`secure-booking-*`) rather
  than sharing the site's component classes.
- **AI features**: drafting staff replies is fine (a human always sends). AI
  "visualise your wedding" images are rejected: they undercut a venue sold on
  authenticity and set false expectations. No AI anywhere near prices,
  contracts or legal text.
