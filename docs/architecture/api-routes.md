# API routes

Every page on the site is static, built ahead of time. The API routes are
the exception: small server functions that run on Cloudflare when something
calls them. All of the site's logic lives in them (storing an enquiry,
sending a quote, taking a deposit), and they're the only code that holds the
Sanity write token or sends email.

**How Astro does it.** A file in `src/pages/api/` becomes a URL:
`src/pages/api/enquiries.ts` answers `/api/enquiries`. The file exports a
function per HTTP method (`export const POST = …`) and
`export const prerender = false`, which tells Astro to run it on each
request rather than at build time. In Express terms, each file is one
`app.post("/api/enquiries", handler)`, with the path taken from where the
file sits.

Who calls whom is in `docs/architecture/services.md`; each file's opening
comment has the detail.

## The routes

**Called by a visitor's browser**, from the site's pages:

| Route                              | From                               | Does                                                                               | Guarded by                                                           |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/availability`            | The wedding calendar               | Each date's status (open, enquiries received, booked), worked out live from Sanity | Nothing: public on purpose, dates and statuses only                  |
| `POST /api/enquiries`              | The enquiry form                   | Stores the enquiry as a new booking; emails the enquirer and staff                 | Same-site check, a hidden bot field, a minimum time                  |
| `POST /api/waitlist`               | The calendar's "notify me" popover | Stores an unconfirmed waitlist entry; emails a link to confirm it                  | Same-site check, bot field, minimum time, a per-person limit         |
| `POST /api/waitlist/confirm`       | The `/waitlist` page's button      | Confirms a waitlist entry                                                          | The private link's token                                             |
| `POST /api/waitlist/leave`         | The `/waitlist` page's button      | Takes someone off a waitlist                                                       | The private link's token                                             |
| `POST /api/deposits/view`          | The deposit page, as it opens      | Everything the page shows for a quote, already worded                              | The private link's token                                             |
| `POST /api/deposits/checkout`      | "Pay by bank" or "Pay by card"     | Where to send the client to pay (the payment provider's checkout)                  | The private link's token                                             |
| `POST /api/deposits/transfer-sent` | "I've sent the transfer"           | Records an awaiting transfer on the booking; emails staff                          | The private link's token                                             |
| `POST /api/deposits/decline`       | The decline dialog                 | Closes the quote and withdraws the enquiry; emails staff and the client            | The private link's token                                             |
| `POST /api/deposits/test-payment`  | The pretend checkout               | Records a test payment and confirms the booking, as a provider's webhook does      | The private link's token; 404 for a way to pay a real provider takes |

**Called by another service** (webhooks, and Cloudflare's timer):

| Route                              | From                                       | Does                                                                                    | Guarded by                                      |
| ---------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `POST /api/quote-events`           | Sanity, when a quote goes Draft → Sent     | Makes the deposit link, sets the quote's end date, emails the client                    | Sanity's signature (`SANITY_WEBHOOK_SECRET`)    |
| `POST /api/booking-events`         | Sanity, when a booking changes             | A deposit marked received confirms the booking; a cancelled wedding emails its waitlist | Sanity's signature                              |
| `POST /api/payments/stripe-events` | Stripe, when a checkout is paid            | Records the card payment and confirms the booking                                       | Stripe's signature (`STRIPE_WEBHOOK_SECRET`)    |
| `POST /api/email-events`           | Resend, when an email bounces              | Marks that email Bounced in its booking's Email Log                                     | Resend's signature (`RESEND_WEBHOOK_SECRET`)    |
| `POST /api/jobs/daily`             | Cloudflare's daily timer (`src/worker.ts`) | Quote reminders and expiries (`src/lib/jobs/daily.ts`)                                  | A key only the Worker knows; 404 to anyone else |

## Writing a new one

- **`export const prerender = false`**, or Astro builds it once and serves
  the answer for ever.
- **Answer with `json(status, body)`** from `src/lib/api/requests.ts`, and
  a message a person can read in `error` when refusing.
- **From a browser**: read the body with `readFormPost` (same file), which
  refuses posts from other sites and oversized bodies.
- **From a service**: check its signature before reading anything, with the
  helpers in `src/lib/webhooks/`, against the raw body.
- **Save to Sanity first, then email**, and send booking emails through
  `sendAndLog` (`src/lib/email/log.ts`) so they're in the Email Log.
- **Add it to the tables above.**
