# How the services fit together

The site leans on three outside services. This is who talks to whom, and
when.

- **Sanity** holds the content (packages, menus, gallery) and the records
  (enquiries, bookings, quotes, payments, the waitlist), plus the Studio
  staff edit them in. It runs no code of ours.
- **Cloudflare** hosts the site: the static pages, built once per publish,
  and the Worker that runs the API routes (`src/pages/api/`). All of the
  logic lives in those routes.
- **Resend** delivers the emails the API routes write, and nothing more.

## Who calls whom

```
   Staff ── Studio ──▶ SANITY ◀────── reads and writes ───────┐
                         │                                    │
                         ├─ webhook: content published ──▶ CLOUDFLARE: rebuild the pages
                         │                                    │
                         └─ webhook: quote sent, deposit ──▶ CLOUDFLARE: API routes ◀── visitor's browser
                            received, wedding cancelled          │       ▲
                                                                 │       │
                                                     "send this" │       │ webhook: email bounced
                                                                 ▼       │
                                                               RESEND ───┘
                                                                 │
                                                                 ▼
                                                              inboxes
```

Every arrow is one side calling the other over the internet:

- **Our site calls out** to Sanity's API to read and write records, and to
  Resend's API to send an email.
- **Sanity and Resend call in** only through webhooks: when something
  happens on their side, their server posts to a URL of ours. A webhook is
  something they send, not something they expose; our site never "calls a
  webhook". It's the same arrangement as Stripe calling an Express route
  when a payment succeeds.

## What happens, step by step

**Always saved first, emailed second.** Each route writes to Sanity before
it asks Resend for anything, so an email that fails never loses or undoes a
record.

**A content edit** (a package price):

1. Staff publish in the Studio, and Sanity saves it.
2. Sanity's rebuild webhook calls Cloudflare's deploy hook.
3. Cloudflare rebuilds the static pages, reading the new content from
   Sanity. Visitors see it a minute or two later.

**An enquiry** (`api/enquiries.ts`):

1. The visitor sends the form to the route.
2. The route saves a new booking in Sanity.
3. The route asks Resend for the enquirer's confirmation and the staff
   alert, and records both in the booking's Email Log.
4. If the address doesn't exist, Resend's webhook calls `api/email-events.ts`,
   which marks that email "Bounced" in the log.

**A quote** (`api/quote-events.ts`):

1. Staff set the quote to Sent and publish, and Sanity saves it.
2. Sanity's webhook calls the route.
3. The route saves the private link's hash, the quote's end date and the
   booking's new status in Sanity.
4. The route asks Resend to email the client the link.

**A deposit by bank or card** (`api/deposits/`):

1. On the deposit page, the client is sent to the payment provider.
2. When they've paid, the provider's webhook calls our site (in test mode,
   the pretend provider's "Pay" button does).
3. The route saves the payment and confirms the booking in Sanity, declining
   any other enquiry for that wedding date.
4. The route asks Resend for the client's and staff's confirmations.

**A deposit transferred by hand**:

1. The client presses "I've sent the transfer". The route saves an Awaiting
   payment on the booking and emails staff.
2. When the money shows in the bank, staff set that payment to Received in
   the Studio and publish.
3. Sanity's webhook calls `api/booking-events.ts`, which confirms the
   booking and emails, as above.

**A cancelled wedding**: staff set it to Cancelled and publish; Sanity's
webhook calls `api/booking-events.ts`, which emails that date's waitlist.

**Every morning** (Cloudflare's timer, not a webhook). Nothing polls:
Cloudflare starts the run once a day, and it asks Sanity one question.

```
 07:00 UTC   CLOUDFLARE's timer ──▶ the Worker's `scheduled` (src/worker.ts)
                                          │ hands over to
                                          ▼
                                   API route /api/jobs/daily
                                          │ 1. one query: every Sent quote with an end date,
                                          ▼    with its booking and payments
                                       SANITY
                                          │
                    ┌─────────────────────┼──────────────────────────┐
                    ▼                     ▼                          ▼
          deposit paid or on its   ends within 2 days,       end date passed,
          way, or enquiry closed   no reminder sent yet      nothing paid
                    │                     │                          │
                  skip      2. SANITY: note the reminder,  2. SANITY: quote Expired,
                               add a fresh link               enquiry back to In Discussion
                                          │                          │
                            3. RESEND: reminder to the     3. RESEND: "your quote has
                               client                         expired" to the client,
                                          │                   follow-up to staff
                                          │                          │
                                          └──▶ 4. SANITY: each email in the booking's Email Log
```

Because step 2 is saved before step 3, tomorrow's run sees the reminder or
the expiry and leaves that quote alone.

## Locally

The same, except:

- **Your dev server plays Cloudflare.** It renders every page fresh on each
  visit, so nothing is rebuilt.
- **`npm run dev:daily-jobs` plays Cloudflare's morning timer**, once,
  whenever you run it.
- **`npm run dev:webhooks` plays Sanity's webhooks.** Sanity's real webhooks
  point at the live site, which runs the code on `main` against the
  production data. To try your own code against the development data, the
  calls have to reach your laptop, and Sanity's servers can't reach it. So
  the relay, running on your laptop, watches the development data and makes
  the same calls to `localhost:3000`.
- **Every email goes to `EMAIL_TEST_RECIPIENT`**, never the real recipient.

## Where emails are logged

- **Resend** keeps its own log of every email sent, in its dashboard, for a
  limited time that depends on the plan.
- **Sanity** keeps each booking's **Email Log**: every email the site sent
  about it, to the client or to staff, with when, to whom and whether it
  went or bounced (`src/lib/email/log.ts`). It's written just after the
  email is handed to Resend, and lasts as long as the booking. Waitlist
  emails aren't about a booking and appear only in Resend's log.

The webhook settings themselves are in `docs/planning/sanity-rollout.md`
(steps 3 and 7) and `sanity/webhooks/definitions.ts`.
