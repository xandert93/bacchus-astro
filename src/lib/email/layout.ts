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

// Newsreader is the site's serif. Apple Mail and some others load it; the
// rest fall back to Georgia, which is close.
const SERIF = "Newsreader, Georgia, 'Times New Roman', serif"

// Shared by every label and its value in a details card, so their first
// lines sit on the same baseline whatever their font sizes.
const ROW_LINE_HEIGHT = "22px"

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

/** A section heading with a short gold rule above it. */
export const heading = (text: string) => `
  <div style="margin: 36px 0 16px;">
    <div style="width: 36px; height: 2px; background: ${GOLD}; margin: 0 0 14px;"></div>
    <h2 style="margin: 0; font-family: ${SERIF}; font-size: 21px; font-weight: normal; color: ${INK};">${escapeHtml(text)}</h2>
  </div>`

/** A boxed list of label and answer, e.g. an enquiry's details. */
export const detailsCard = (rows: [label: string, value: string | undefined][]) => {
  const cells = rows
    .filter(([, value]) => value)
    .map(([label, value], index) => {
      const divider = index ? `border-top: 1px solid ${RULE};` : ""

      // Baseline, not top: the label's small capitals and the larger value
      // then share one baseline instead of the label sitting high.
      return `
        <tr>
          <td style="padding: 12px 16px 12px 20px; ${divider} vertical-align: baseline; width: 36%; font-family: ${SERIF}; font-size: 11px; line-height: ${ROW_LINE_HEIGHT}; letter-spacing: 0.12em; text-transform: uppercase; color: ${BRONZE};">${escapeHtml(label)}</td>
          <td style="padding: 12px 20px 12px 0; ${divider} vertical-align: baseline; font-family: ${SERIF}; font-size: 15px; line-height: ${ROW_LINE_HEIGHT}; color: ${INK}; white-space: pre-line;">${escapeHtml(value as string)}</td>
        </tr>`
    })
    .join("")

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border: 1px solid ${RULE}; border-radius: 10px; background: ${PAPER}; margin: 4px 0 8px;">${cells}</table>`
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
        <a href="${escapeHtml(href)}" style="display: block; padding: 15px 24px; font-family: ${SERIF}; font-size: 15px; letter-spacing: 0.04em; color: ${INK}; text-align: center; text-decoration: none;">${escapeHtml(label)}</a>
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
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
    <style>
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
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: ${WHITE}; border: 1px solid ${RULE}; border-radius: 14px; overflow: hidden;">
            <tr>
              <td align="center" style="padding: 34px 24px 26px; border-bottom: 1px solid ${RULE};">
                <a href="${siteUrl("/")}" style="text-decoration: none;">
                  <img src="${siteUrl("/email/bacchus-logo.png")}" width="72" height="75" alt="Bacchus" style="display: block; border: 0; margin: 0 auto 14px;">
                  <span style="display: block; font-family: ${SERIF}; font-size: 24px; letter-spacing: 0.32em;">${goldText("BACCHUS")}</span>
                </a>
                <span style="display: block; margin-top: 6px; font-family: ${SERIF}; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: ${MUTED};">Mdina · Malta</span>
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
              <td style="padding: 36px 36px 12px;">
                <p style="margin: 0 0 10px; font-family: ${SERIF}; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: ${BRONZE};">${escapeHtml(eyebrow)}</p>
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
