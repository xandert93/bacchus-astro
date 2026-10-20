// The frame every email sits in, and the pieces templates build from. Email
// apps ignore stylesheets and most modern CSS, so this is tables with inline
// styles: the site's palette and serif on white, the logo, a photograph, and
// the gold gradient text, built so Gmail and Outlook show it the same.
//
// Pictures and links point at the live site (EMAIL_SITE_ORIGIN), since an
// email app fetches them from the open internet. The files are in
// public/email/.

import { EMAIL_SITE_ORIGIN } from "astro:env/server"
import { ADDRESS_LINE, CONTACT } from "@data/contact"
import { breakpoints } from "@lib/media-queries"

// The site's palette (src/styles/global.css), written out: emails can't read
// CSS variables. GOLD is too pale for text on white, so text that would be
// gold uses BRONZE, or the gradient where the email app supports it.
const INK = "#171007"
const WHITE = "#ffffff"
const PAPER = "#fbf8f0"
const GOLD = "#dab53f"
const BRONZE = "#8a7442"
const MUTED = "#6b6457"
const RULE = "#e6dfcf"
const GOLD_GRADIENT = "linear-gradient(135deg, #dfc167, #dab53f 55%, #b8902c)"

// The site's two typefaces. Newsreader for reading; Inter for capitals and
// buttons, as on the site. Apple Mail and some others load them; the rest
// fall back to Georgia and Helvetica or Arial, which are close.
const SERIF = "Newsreader, Georgia, 'Times New Roman', serif"
const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"

// Shared by every label and its value in a details card, so their first
// lines sit on the same baseline whatever their font sizes.
const ROW_LINE_HEIGHT = "22px"

// A details card's label and answer widths. With the 16px gap between them
// they fit side by side in the 600px email (even with its narrower phone
// padding); on a narrow screen, an answer
// that can't fit beside its label drops beneath it. A label never wraps, so
// it always shares its answer's baseline: keep labels to about 20 letters.
const DETAIL_LABEL_WIDTH = 180
const DETAIL_VALUE_WIDTH = 280

/** An absolute address on the live site, e.g. for a picture or a link. */
export const siteUrl = (path: string) => `${EMAIL_SITE_ORIGIN}${path}`

/** Makes visitor-typed text safe to put in HTML. */
export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

/**
 * Gold gradient text, as on the site's headings. Only email apps that can
 * clip a background to text show the gradient (Apple Mail, iOS); the rest
 * ignore the style block below and show plain bronze, so the text never
 * disappears.
 */
const goldText = (html: string) =>
  `<span class="gold-text" style="color: ${BRONZE};">${html}</span>`

export const paragraph = (html: string) =>
  `<p style="margin: 0 0 16px; font-family: ${SERIF}; font-size: 16px; line-height: 1.65; color: ${INK};">${html}</p>`

/** A phrase picked out in bronze inside a paragraph, e.g. a date. */
export const highlight = (text: string) =>
  `<span style="color: ${BRONZE};">${escapeHtml(text)}</span>`

/** A link inside a paragraph. */
export const textLink = (label: string, href: string) =>
  `<a href="${escapeHtml(href)}" style="color: ${BRONZE};">${escapeHtml(label)}</a>`

/** Small, muted text: an aside, or the line that lets people opt out. */
export const smallPrint = (html: string) =>
  `<p style="margin: 0 0 16px; font-family: ${SERIF}; font-size: 13px; line-height: 1.6; color: ${MUTED};">${html}</p>`

// Copy written once for both versions of an email. Every email has an HTML
// version and a plain-text one; its paragraphs are written once, as plain
// strings, and drawn into both. `mark()` picks out a phrase (a date, an
// amount) in bronze in the HTML and leaves it plain in the text. Keep each
// paragraph to a sentence or one short thought: a block of three reads as a
// wall on a phone.
const MARK_OPEN = "⟦"
const MARK_CLOSE = "⟧"
const MARKED = new RegExp(`${MARK_OPEN}([^${MARK_CLOSE}]*)${MARK_CLOSE}`, "g")

export const mark = (text: string) => `${MARK_OPEN}${text}${MARK_CLOSE}`

const unmarked = (text: string) => text.replace(MARKED, "$1")

/** Paragraphs for the HTML version, with marked phrases in bronze. */
export const htmlParagraphs = (paragraphs: string[], { small = false } = {}) =>
  paragraphs
    .map((text) => {
      // Split on the marks: odd parts are the marked phrases.
      const html = text
        .split(MARKED)
        .map((part, index) => (index % 2 ? highlight(part) : escapeHtml(part)))
        .join("")
      return small ? smallPrint(html) : paragraph(html)
    })
    .join("")

/** The same paragraphs for the text version, a blank line between each. */
export const textParagraphs = (paragraphs: string[]) =>
  paragraphs.map(unmarked).join("\n\n")

/** A section heading with a short gold rule above it. */
export const heading = (text: string) => `
  <div style="margin: 36px 0 16px;">
    <div style="width: 36px; height: 2px; background: ${GOLD}; margin: 0 0 14px;"></div>
    <h2 style="margin: 0; font-family: ${SERIF}; font-size: 21px; font-weight: normal; color: ${INK};">${escapeHtml(text)}</h2>
  </div>`

/**
 * A boxed list of label and answer, e.g. an enquiry's details. Side by side
 * where there's room; on a phone each answer drops beneath its label. Done
 * with widths that wrap rather than a phone-width style rule, because some
 * email apps (Gmail showing an Outlook or other non-Google account, for one)
 * ignore style rules entirely. The same 24px above and below it: the
 * margins of neighbouring blocks overlap rather than add up, so it's 24px
 * whatever sits either side (a heading's larger gap still wins).
 */
export const detailsCard = (rows: [label: string, value: string | undefined][]) => {
  const cells = rows
    .filter(([, value]) => value)
    .map(([label, value], index) => {
      const divider = index ? `border-top: 1px solid ${RULE};` : ""

      // Two inline blocks with no space between them, so nothing but the
      // width decides whether they share a line. Baseline, not top: the
      // label's small capitals and the larger answer then share one baseline.
      return `
        <tr>
          <td style="padding: 12px 20px; ${divider}">
            <div style="display: inline-block; width: ${DETAIL_LABEL_WIDTH}px; padding-right: 16px; vertical-align: baseline; white-space: nowrap; font-family: ${SANS}; font-size: 10px; line-height: ${ROW_LINE_HEIGHT}; letter-spacing: 0.14em; text-transform: uppercase; color: ${BRONZE};">${escapeHtml(label)}</div><div style="display: inline-block; width: ${DETAIL_VALUE_WIDTH}px; max-width: 100%; vertical-align: baseline; font-family: ${SERIF}; font-size: 15px; line-height: ${ROW_LINE_HEIGHT}; color: ${INK}; white-space: pre-line;">${escapeHtml(value as string)}</div>
          </td>
        </tr>`
    })
    .join("")

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border: 1px solid ${RULE}; border-radius: 10px; background: ${PAPER}; margin: 24px 0;">${cells}</table>`
}

/** Numbered steps, each number in a gold circle. */
export const stepsList = (steps: [title: string, detail: string][]) => {
  const rows = steps
    .map(
      ([title, detail], index) => `
        <tr>
          <td style="width: 44px; padding: 0 0 18px; vertical-align: top;">
            <div style="width: 30px; height: 30px; line-height: 30px; border-radius: 15px; background: ${GOLD}; background-image: ${GOLD_GRADIENT}; color: ${INK}; text-align: center; font-family: ${SERIF}; font-size: 15px;">${index + 1}</div>
          </td>
          <td style="padding: 3px 0 18px; vertical-align: top; font-family: ${SERIF}; font-size: 16px; line-height: 1.5; color: ${INK};">
            ${escapeHtml(title)}<br>
            <span style="font-size: 14px; color: ${MUTED};">${escapeHtml(detail)}</span>
          </td>
        </tr>`,
    )
    .join("")

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`
}

/**
 * A centred gold button. As wide as the email allows, up to 280px: the email
 * equivalent of width: min(100%, 280px), since several email apps drop
 * min(). Outlook ignores the rounded corners, which is fine.
 */
export const button = (label: string, href: string) => `
  <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 280px; margin: 12px auto 28px;">
    <tr>
      <td align="center" style="border-radius: 999px; background: ${GOLD}; background-image: ${GOLD_GRADIENT};">
        <a href="${escapeHtml(href)}" style="display: block; padding: 16px 24px; font-family: ${SANS}; font-size: 12px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: ${INK}; text-align: center; text-decoration: none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`

interface Hero {
  /** Under public/email/, e.g. "secret-garden-table.jpg" (1200 × 600). */
  photo: string
  alt: string
}

interface LayoutOptions {
  /** The line email apps show beside the subject in the inbox. */
  preview: string
  /** Small capitals above the title, e.g. "Enquiry received". */
  eyebrow: string
  /** The title. HTML: `<em>` shows in gold gradient italics, as on the site. */
  title: string
  hero?: Hero
  body: string
}

const styleEm = (html: string) =>
  html.replace(/<em>(.*?)<\/em>/g, (_, text) => `<em>${goldText(text)}</em>`)

const socialIcon = (name: string, href: string, label: string) =>
  `<a href="${href}" style="display: inline-block; margin: 0 6px; text-decoration: none;"><img src="${siteUrl(`/email/${name}.png`)}" width="24" height="24" alt="${label}" style="display: block; border: 0;"></a>`

/** The whole email: header, photograph, title, the template's body, footer. */
export const emailLayout = ({
  preview,
  eyebrow,
  title,
  hero,
  body,
}: LayoutOptions) => `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Newsreader:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
    <style>
      /* The body's side padding is 20px wherever style rules are ignored,
         which suits a phone; apps that read them give a wider screen more,
         from the site's tablet width (written as min-width, which email
         apps understand, unlike the site's range syntax). */
      @media (min-width: ${breakpoints.tablet}px) {
        .email-body {
          padding: 36px 36px 12px !important;
        }
      }

      @supports (-webkit-background-clip: text) {
        .gold-text {
          background-image: ${GOLD_GRADIENT};
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: ${WHITE};">
    <div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${WHITE};">
      <tr>
        <td align="center" style="padding: 16px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: ${WHITE}; border: 1px solid ${RULE}; border-radius: 14px; overflow: hidden;">
            <tr>
              <td align="center" style="padding: 34px 24px 26px; border-bottom: 1px solid ${RULE};">
                <a href="${siteUrl("/")}" style="text-decoration: none;">
                  <img src="${siteUrl("/email/bacchus-logo.png")}" width="72" height="75" alt="Bacchus" style="display: block; border: 0; margin: 0 auto 14px;">
                  <span style="display: block; font-family: ${SERIF}; font-size: 24px; letter-spacing: 0.32em;">${goldText("BACCHUS")}</span>
                </a>
                <span style="display: block; margin-top: 6px; font-family: ${SANS}; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: ${MUTED};">Mdina · Malta</span>
              </td>
            </tr>
            ${
              hero
                ? `<tr>
              <td style="line-height: 0;">
                <img src="${siteUrl(`/email/${hero.photo}`)}" width="600" alt="${escapeHtml(hero.alt)}" style="display: block; width: 100%; height: auto; border: 0;">
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td class="email-body" style="padding: 32px 20px 12px;">
                <p style="margin: 0 0 10px; font-family: ${SANS}; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: ${BRONZE};">${escapeHtml(eyebrow)}</p>
                <h1 style="margin: 0 0 24px; font-family: ${SERIF}; font-size: 30px; line-height: 1.2; font-weight: normal; color: ${INK};">${styleEm(title)}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td align="center" style="background: ${PAPER}; border-top: 1px solid ${RULE}; padding: 26px 24px; font-family: ${SERIF}; font-size: 13px; line-height: 1.7; color: ${MUTED};">
                ${socialIcon("instagram", CONTACT.social.instagram, "Bacchus on Instagram")}${socialIcon("facebook", CONTACT.social.facebook, "Bacchus on Facebook")}
                <div style="height: 14px; line-height: 14px;">&nbsp;</div>
                ${escapeHtml(ADDRESS_LINE)}<br>
                <a href="${CONTACT.phone.href}" style="color: ${BRONZE}; text-decoration: none;">${escapeHtml(CONTACT.phone.display)}</a>
                &nbsp;·&nbsp;
                <a href="${CONTACT.email.href}" style="color: ${BRONZE}; text-decoration: none;">${escapeHtml(CONTACT.email.display)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
