// A quote as the HTML page Chrome prints to its PDF (print.ts): page 1, the
// price through to the total; page 2, "Securing your date". The design is
// docs/design/quote-pdf/quote.pdf, and its rules are in
// docs/design/decisions.md, "PDF quotes".
//
// Only what Bacchus has confirmed goes in the copy. The booking terms aren't
// included yet: they follow once Bacchus has approved them
// (docs/content/booking-terms-draft.md).

import { CONTACT } from "@data/contact"
import { coupleName, type DepositRecord } from "@lib/deposits/load"
import { longDate } from "@lib/email/enquiry-details"
import { escapeHtml, siteUrl } from "@lib/email/layout"
import { eurosCompact } from "@lib/money"
import { presentQuoteLines, stationCount, type PresentedGroup } from "../quote-lines"
import { QUOTE_FONTS_URL, QUOTE_STYLES } from "./quote-styles"

/** How the title and copy name the event: "Your wedding at Bacchus". */
const OCCASIONS: Record<string, string> = {
  wedding: "wedding",
  corporate: "event",
  celebration: "celebration",
  other: "event",
}

const NUMBER_WORDS = ["", "one", "two", "three", "four", "five", "six"]

/** "23 October 2026": a date on the quote that isn't the event's. */
const plainDate = (isoDate: string) =>
  new Date(`${isoDate.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

const listInWords = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items[0]

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** "Reception – Rose, with two stations". */
const foodSummary = (record: DepositRecord) => {
  const meal = record.menu?.meal
  if (!meal?.name) return undefined
  const stations = stationCount(record)
  const name = meal.package ? `${meal.package} – ${meal.name}` : meal.name
  return stations
    ? `${name}, with ${NUMBER_WORDS[stations] ?? stations} ${stations === 1 ? "station" : "stations"}`
    : name
}

/** "Maltese wine, open bar and cocktail bar", from the drinks lines. */
const drinksSummary = (record: DepositRecord) => {
  const drinks = record.pricing.lineItems
    .filter((line) => line.category === "beverage")
    .map((line, index) => (index ? lowerFirst(line.label) : line.label))
  return drinks.length ? listInWords(drinks) : undefined
}

const factRow = (label: string, value: string | undefined) =>
  value ? `<dt class="label">${label}</dt><dd>${escapeHtml(value)}</dd>` : ""

const amountCell = (amount: number | undefined) =>
  amount === undefined ? "Included" : eurosCompact(amount)

const groupRows = (group: PresentedGroup) =>
  group.lines
    .map((line, index) => {
      const classes = [index === group.lines.length - 1 && "last-in-group"]
        .filter(Boolean)
        .join(" ")
      const groupCell = index
        ? ""
        : `<th class="group-cell" rowspan="${group.lines.length}">${escapeHtml(group.title)}${
            group.subtotal !== undefined
              ? `<span>${eurosCompact(group.subtotal)}</span>`
              : ""
          }</th>`

      return `<tr class="${classes}">
        ${groupCell}
        <td>${escapeHtml(line.label)}${
          line.details ? `<span class="details">${escapeHtml(line.details)}</span>` : ""
        }</td>
        <td class="number">${line.quantity ?? ""}</td>
        <td class="number">${line.unitAmount ? eurosCompact(line.unitAmount) : ""}</td>
        <td class="number">${amountCell(line.amount)}</td>
      </tr>`
    })
    .join("")

export const quoteHtml = (record: DepositRecord) => {
  const { event, pricing, terms, booking } = record
  const occasion = OCCASIONS[booking.event.type] ?? "event"
  const couple = escapeHtml(coupleName(record))
  const issued = plainDate(record.sentAt ?? new Date().toISOString())
  const validUntil = terms?.validUntil ? plainDate(terms.validUntil) : undefined
  const balance = pricing.total - pricing.deposit.amount
  const balanceDue = terms?.balanceDueDate ? plainDate(terms.balanceDueDate) : undefined
  const preparedBy = record.preparedBy ? escapeHtml(record.preparedBy) : undefined
  const coordinator = preparedBy
    ? `${preparedBy.split(" ")[0]}, your coordinator,`
    : "Our events team"
  const time =
    event.startTime && event.endTime
      ? `${event.startTime} to ${event.endTime}`
      : undefined
  const spaces = event.spaces?.length ? listInWords(event.spaces) : undefined
  const reference = escapeHtml(record.reference)

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Quote ${reference}</title>
<link rel="stylesheet" href="${QUOTE_FONTS_URL}">
<style>${QUOTE_STYLES}</style>
</head>
<body>
  <section>
    <div class="top">
      <img src="${siteUrl("/email/bacchus-logo.png")}" alt="Bacchus">
      <div class="reference">
        <p class="label">Quote</p>
        <p>${reference}</p>
        <p class="label">Issued</p>
        <p>${issued}</p>
      </div>
    </div>

    <h1>
      <span>Your ${occasion}</span>
      <svg id="goldPhrase" height="29" aria-label="at Bacchus">
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#dfc167" />
            <stop offset="0.55" stop-color="#dab53f" />
            <stop offset="1" stop-color="#b8902c" />
          </linearGradient>
        </defs>
        <text x="0" y="29" fill="url(#gold)" font-family="Fraunces" font-style="italic" font-size="29.3">at Bacchus</text>
      </svg>
    </h1>
    <p class="lead">Prepared for ${couple}.${validUntil ? ` Valid until ${validUntil}.` : ""}</p>

    <div class="facts">
      <dl>
        ${factRow("Date", longDate(event.date))}
        ${factRow("Time", time)}
        ${factRow("Guests", String(event.guestCount))}
      </dl>
      <dl>
        ${factRow("Spaces", spaces)}
        ${factRow("Food", foodSummary(record))}
        ${factRow("Drinks", drinksSummary(record))}
      </dl>
    </div>

    <table>
      <thead>
        <tr>
          <th></th>
          <th class="label">Item</th>
          <th class="label number">Qty</th>
          <th class="label number">Price</th>
          <th class="label number">Amount</th>
        </tr>
      </thead>
      <tbody>${presentQuoteLines(record).map(groupRows).join("")}</tbody>
    </table>

    <div class="summary">
      <p class="pointer">A deposit of <strong>${eurosCompact(pricing.deposit.amount)}</strong> secures your date.<br>How to pay it, and what happens next, overleaf.</p>

      <div class="totals">
        ${
          pricing.discount?.amount
            ? `<div class="small"><span>Subtotal</span><span>${eurosCompact(pricing.subtotal)}</span></div>
        <div class="small"><span>Discount</span><span>−${eurosCompact(pricing.discount.amount)}</span></div>`
            : ""
        }
        <div class="grand"><span>Total</span><span>${eurosCompact(pricing.total)}</span></div>
        ${
          pricing.vat?.amount !== undefined
            ? `<div class="small"><span>Includes VAT at ${pricing.vat.rate}%</span><span>${eurosCompact(pricing.vat.amount)}</span></div>`
            : ""
        }
        ${
          pricing.perPerson
            ? `<div class="small"><span>Per guest</span><span>${eurosCompact(pricing.perPerson)}</span></div>`
            : ""
        }
      </div>
    </div>
  </section>

  <section class="securing">
    <h2>Securing your date</h2>
    <p class="lead">Everything about paying for your ${occasion}, and what happens once you have.</p>

    <div class="money">
      <div class="money-card money-card-deposit">
        <p class="label">Deposit</p>
        <p class="amount">${eurosCompact(pricing.deposit.amount)}</p>
        <p>${pricing.deposit.percent ? `${pricing.deposit.percent}% of the total. ` : ""}It secures your date: until it arrives, the date stays open to ${occasion === "wedding" ? "other couples" : "others"}, and the first deposit to arrive secures it.</p>
        ${validUntil ? `<p>This quote is open until <strong>${validUntil}</strong>.</p>` : ""}
      </div>
      <div class="money-card">
        <p class="label">Balance</p>
        <p class="amount">${eurosCompact(balance)}</p>
        <p>${balanceDue ? `Due by <strong>${balanceDue}</strong>.` : `Due before your ${occasion}.`}</p>
      </div>
    </div>

    <h3 class="label">How to pay</h3>
    <p>Use the button in your quote email. It opens your own booking page, private to you, with every way to pay your deposit. If you pay by bank transfer, please quote your reference, <strong class="reference-number">${reference}</strong>.</p>
    <p class="warning"><strong>Please don't share the link.</strong> It's private to you: anyone with it could pay or decline your quote.</p>
    <p>We email a receipt for every payment, and confirm your date as soon as the deposit arrives.</p>

    <h3 class="label">What happens next</h3>
    <ol class="next-steps">
      <li><strong>Your date is confirmed</strong> by email once your deposit arrives, with your receipt.</li>
      <li><strong>${coordinator}</strong> plans the day with you from then on.</li>
      ${
        booking.event.type === "wedding" && record.menu?.meal
          ? `<li><strong>Your tasting</strong>: 16 dishes from your package, 6 hot, 6 cold and 4 desserts, booked in advance.</li>`
          : ""
      }
      <li><strong>Your final numbers</strong>, with any dietary needs, are due with the final payment${balanceDue ? `, by ${balanceDue}` : ""}.</li>
    </ol>

    ${
      record.clientNotes?.trim()
        ? `<div class="notes"><p class="label">Notes from Bacchus</p><p>${escapeHtml(record.clientNotes.trim())}</p></div>`
        : ""
    }

    <p class="prepared">${
      preparedBy ? `Prepared by <strong>${preparedBy}</strong> on ${issued}.<br>` : ""
    }Any questions: ${CONTACT.phone.display} or ${CONTACT.email.display}.</p>
  </section>
</body>
</html>`
}
