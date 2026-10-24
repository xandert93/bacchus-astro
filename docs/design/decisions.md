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
7. [Photo with a scrim](#photo-with-a-scrim)
8. [PDF quotes](#pdf-quotes)
9. [Other](#other)

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
- **Permission to publish is one box, unticked to start**; ticking it is
  the only way to say yes. GDPR consent has to be an active choice: a box
  ticked in advance, or one inverted to "tick to keep it private"
  (publishing by default), wouldn't count. A yes/no pair with neither
  chosen was tried on 2026-10-23 and dropped for the simpler box.
- **No incentive for reviews, ever** (a prize draw, vouchers, a free
  dinner, a discount), decided 2026-10-23, in case the idea comes back:
  - Google's rules forbid offering anything in exchange for a review; doing
    it risks the reviews being removed and the listing penalised.
  - On our own site, EU consumer law would make us declare the incentive
    beside the reviews, which undercuts them.
  - A prize for reviewing cheapens a venue selling a luxury wedding.
  - A gesture to every couple that isn't tied to reviewing (an anniversary
    dinner invitation, say) is fine.
- **Label the testimonials honestly.** EU consumer law (the 2022 "Omnibus"
  rules) treats a business that publishes only positive reviews, or claims
  reviews are genuine without checking, as misleading consumers. A selection
  of testimonials is normal, but it shouldn't pose as a full set of reviews.
  The section should present them as a selection, show no average rating
  made from them, and can say truthfully that each came from a real Bacchus
  client through a link only they receive. Not legal advice: worth Bacchus
  checking. Not done yet.

### Review length (2026-10-24)

- **Clients may write up to 1,500 characters** (at least 10), about 250
  words. The longest live testimonial is 220 characters, so nobody has
  come near it.
- **Longer is better, so the limit stays generous:**
  - **Detail is what convinces.** A named waiter, a dish, the moment the
    rain stopped: specifics read as real, and they're what couples look
    for. "Lovely day, thanks" persuades nobody.
  - **On Google**, the number, rating and freshness of reviews count
    towards its map results (Google says so), and a detailed review is
    shown as more helpful. What reviews mention ("wedding", "Mdina", "the
    terrace") is widely reported to help with matching searches too,
    though Google doesn't spell that out. The copy button carries the full
    review across.
  - **For Bacchus**, a long review is better feedback, kept whether or not
    it's published.
- **The website's display is separate.** The testimonials section caps a
  quote at eight lines and ends it with "…" (known-bugs.md, 12), and staff
  choose which reviews to publish and which phrase is gold. So a long
  review never makes the page long.
- **A website excerpt (proposed, not built)**: an optional field on the
  testimonial holding a shorter passage for the site, used instead of the
  full quote when filled in.
  - **Cut, never reworded.** It must be the client's own words, with "…"
    where something was left out. Rewording a review, by a person or by AI,
    puts words in a real client's mouth: misleading under EU consumer law,
    and not what they agreed to publish.
  - **Staff pick it, at first.** Choosing a passage takes a minute, and
    reviews arrive a few at a time. AI could later suggest which sentences
    to keep, copied exactly, for a person to approve; never to write it.

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

## Photo with a scrim

Settled with the user, 2026-10-23, on the review page; built as one
component, `PhotoScrimSection`.

- **A photograph fills the section, under a paper scrim** (a translucent
  layer that keeps text readable), and the content sits on the scrim. It
  gives a plain page life without the photo fighting the words.
- **Desktop: one even shade behind the content, ending at a thin gold
  line.** The scrim covers the content column and 64px beyond, then stops
  at a 2px line of the buttons' gold gradient, so the photo shows
  fully on the right. The line is what makes a hard straight edge look
  intended rather than a mistake. Tried and dropped: a slanted edge (too
  dramatic), a long fade (it reached the form's inputs) and a short fade
  (it looked soft and unfinished).
- **Phone and tablet: the scrim covers everything**, at 90%, with the photo
  just showing through.
- **The photo is a real image, not a CSS background**: sized per screen,
  modern formats, loaded early when it's first on screen, with alt text.
- **Names, for asking**: a background image with an overlay, or a scrim
  (also tint, wash); a gradient scrim when it fades; a split layout when
  text and image take a half each; a diagonal split when the edge slants.
- **Next candidates**: the enquiry section, the waitlist page and the
  checkout pages.
- **One photo per page, chosen to fit it**, not a different one on each
  load: a rotating photo makes the page look different for no reason,
  costs a slower first paint, and makes it impossible to judge the page as
  a design. Where the event type is known (the review page), the photo can
  follow it, wedding, corporate or celebration: proposed, not built.

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
- **The deposit page's summary matches the PDF** (2026-10-24): the same
  event panel, the same groups with their subtotals and small print, the
  same figures and the same totals, from one source
  (`src/lib/quotes/quote-lines.ts`), so the two can't disagree. On a phone
  the group names sit above their lines and each line's sum ("110 × €53")
  under its name. Amounts are whole euros where there are no cents, as on
  the PDF; the deposit keeps its cents, since a couple types it into their
  banking app. Still to come: the "I accept the booking terms" box, once
  Bacchus approves the terms.

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
