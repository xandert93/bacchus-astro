// The quote PDF's stylesheet (quote-html.ts): A4 pages, the site's palette and
// type, and the layout settled in docs/design/decisions.md, "PDF quotes". The
// design reference is docs/design/quote-pdf/quote.pdf.
//
// A printed page is measured in millimetres and points, not pixels. Chrome
// prints it (print.ts). The page's margins, footer and page numbers are set
// there, not here: Cloudflare's Chrome is too old for CSS page-margin boxes.

import { ADDRESS_LINE, CONTACT } from "@data/contact"

/** The line at the foot of every page, beside its number. */
export const QUOTE_FOOTER = `Bacchus · ${ADDRESS_LINE} · ${CONTACT.phone.display} · ${CONTACT.email.display}`

export const QUOTE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;1,400&family=Newsreader:ital,wght@0,400;0,500;1,400&family=Inter:wght@500;600&display=block"

export const QUOTE_STYLES = /* css */ `
  :root {
    --ink: #171007;
    --paper: #fbf8f0;
    --gold: #dab53f;
    --bronze: #8a7442;
    --muted: #6b6457;
    --rule: #e6dfcf;
    --oxblood: #7a2a22;
  }

  * {
    box-sizing: border-box;
    margin: 0;
  }

  body {
    background: #fff;

    font-family: "Newsreader", Georgia, serif;
    font-size: 10pt;
    line-height: 1.45;
    color: var(--ink);
  }

  /* Capitals in Inter, spaced out, as the site's labels are. */
  .label {
    font-family: "Inter", sans-serif;
    font-size: 7pt;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--bronze);
  }

  /* --- Header ------------------------------------------------------------------ */

  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 3mm;
    border-bottom: 1px solid var(--rule);
  }

  .top img {
    width: 13mm;
  }

  .reference {
    text-align: right;
  }

  .reference .label + p {
    margin-top: 0.6mm;
  }

  .reference p + .label {
    margin-top: 1.8mm;
  }

  h1 {
    display: flex;
    align-items: baseline;
    gap: 0.25em;
    margin: 4.5mm 0 2.6mm;

    font-family: "Fraunces", Georgia, serif;
    font-size: 22pt;
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  /* The gold phrase is SVG text filled with a gradient: CSS gradient text
     (background-clip) prints with a faint box around it. In a baseline-aligned
     row an SVG's baseline is its bottom edge, so its text sits on that edge
     and the letters' tails hang below it. print.ts fits its width. */
  h1 svg {
    overflow: visible;
  }

  .lead {
    font-size: 10pt;
    color: var(--muted);
  }

  /* --- The event panel ------------------------------------------------------------ */

  .facts {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 6mm;
    margin: 3.6mm 0 4mm;
    padding: 3mm 6mm;
    border-radius: 3mm;
    background: var(--paper);
  }

  .facts dl {
    display: grid;
    grid-template-columns: 20mm 1fr;
    align-content: start;
    align-items: baseline;
    row-gap: 0.9mm;
  }

  /* --- The price ------------------------------------------------------------------- */

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    padding-bottom: 2.5mm;
    border-bottom: 1px solid var(--ink);
    text-align: left;
  }

  /* More room above than below: Newsreader's letters sit high in their line,
     so even padding looks crowded against the rule above. */
  td {
    padding: 2.3mm 0 1.3mm;
    border-bottom: 1px solid var(--rule);
    vertical-align: baseline;
  }

  td .details {
    display: block;
    margin-top: 0.4mm;

    font-size: 8.5pt;
    line-height: 1.35;
    color: var(--muted);
  }

  /* The group's name, with its subtotal beneath, beside its lines. Its top
     padding sets its name level with its first line. A heavier rule closes
     each group. */
  .group-cell {
    width: 30mm;
    padding: 1.51mm 4mm 0 0;
    border-bottom: 1px solid var(--rule);
    vertical-align: top;

    font-family: "Fraunces", Georgia, serif;
    font-size: 11pt;
    font-style: italic;
    font-weight: 400;
    text-align: left;
    color: var(--bronze);
  }

  .group-cell span {
    display: block;
    margin-top: 0.6mm;

    font-family: "Newsreader", Georgia, serif;
    font-size: 9pt;
    font-style: normal;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }

  tr.last-in-group td,
  .group-cell {
    border-bottom-color: rgba(23, 16, 7, 0.28);
  }

  .number {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }

  thead .number {
    width: 24mm;
  }

  /* The totals, with a pointer to page 2 beside them. Never split. */
  .summary {
    display: grid;
    grid-template-columns: 1fr 82mm;
    align-items: end;
    gap: 10mm;
    margin-top: 5mm;
    break-inside: avoid;
  }

  .pointer {
    font-size: 10pt;
    color: var(--muted);
  }

  .pointer strong {
    font-weight: 500;
    color: var(--ink);
  }

  .totals div {
    display: flex;
    justify-content: space-between;
    padding: 1mm 0;
  }

  .totals .grand {
    margin-top: 1mm;
    padding-top: 2.5mm;
    border-top: 1px solid var(--ink);

    font-family: "Fraunces", Georgia, serif;
    font-size: 15pt;
  }

  .totals .small {
    font-size: 9pt;
    color: var(--muted);
  }

  /* --- Securing your date ---------------------------------------------------------- */

  .securing {
    break-before: page;
  }

  .securing h2 {
    margin-bottom: 2mm;

    font-family: "Fraunces", Georgia, serif;
    font-size: 22pt;
    font-weight: 400;
    letter-spacing: -0.01em;
  }

  .securing > p,
  .next-steps li {
    font-size: 10.5pt;
    line-height: 1.55;
  }

  .securing > p + p {
    margin-top: 2mm;
  }

  .securing h3 {
    margin: 8mm 0 2.5mm;
  }

  .money {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6mm;
    margin-top: 7mm;
  }

  .money-card {
    padding: 5mm 6mm;
    border: 1px solid var(--rule);
    border-radius: 3mm;
  }

  .money-card-deposit {
    border-color: var(--gold);
  }

  .money-card .amount {
    margin: 1.5mm 0 2.5mm;

    font-family: "Fraunces", Georgia, serif;
    font-size: 20pt;
    color: var(--ink);
  }

  .money-card p:not(.label, .amount) {
    font-size: 9.5pt;
    line-height: 1.5;
    color: var(--muted);
  }

  .money-card .amount + p ~ p {
    margin-top: 1.5mm;
  }

  .money-card p strong {
    font-weight: 500;
    color: var(--ink);
  }

  /* A warning in Bacchus's oxblood, set apart from the text around it. */
  .securing .warning {
    margin: 3mm 0;
    padding: 3mm 4mm;
    border-left: 2px solid var(--oxblood);
    border-radius: 0 2mm 2mm 0;
    background: #faf3f1;

    font-size: 10pt;
    color: var(--oxblood);
  }

  .securing .warning strong {
    font-weight: 500;
  }

  .reference-number {
    white-space: nowrap;
  }

  .next-steps {
    display: grid;
    gap: 2mm;
    padding-left: 5mm;
  }

  .next-steps li::marker {
    font-family: "Fraunces", Georgia, serif;
    color: var(--bronze);
  }

  .notes {
    margin-top: 8mm;
    padding: 2.5mm 5mm;
    border-radius: 3mm;
    background: var(--paper);
    break-inside: avoid;
  }

  .notes p:last-child {
    margin-top: 2.1mm;
    font-size: 9.5pt;
    white-space: pre-line;
  }

  .prepared {
    margin-top: 6mm;

    font-size: 9.5pt;
    color: var(--muted);
  }

  .prepared strong {
    font-weight: 500;
    color: var(--ink);
  }
`
