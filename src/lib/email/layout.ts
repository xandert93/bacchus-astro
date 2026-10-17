// The frame every email sits in, and the helpers templates share. Email
// clients ignore stylesheets and most modern CSS, so the HTML is a single
// centred table with inline styles: plain on purpose, and readable
// everywhere from Gmail to Outlook.

import { ADDRESS_LINE, CONTACT } from "@data/contact"

// The site's palette (src/styles/global.css), written out: emails can't read
// CSS variables.
const INK = "#171007"
const PAPER = "#fbf8f0"
const BRONZE = "#8a7442"
const MUTED = "#6b6457"
const RULE = "#e6dfcf"
const SERIF = "Georgia, 'Times New Roman', serif"

/** Makes visitor-typed text safe to put in HTML. */
export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export const paragraph = (html: string) =>
  `<p style="margin: 0 0 16px; font-family: ${SERIF}; font-size: 16px; line-height: 1.6; color: ${INK};">${html}</p>`

export const heading = (text: string) =>
  `<h2 style="margin: 28px 0 12px; font-family: ${SERIF}; font-size: 19px; font-weight: normal; color: ${INK};">${escapeHtml(text)}</h2>`

/** A two-column list of label and answer, e.g. an enquiry's details. */
export const detailsTable = (rows: [label: string, value: string | undefined][]) => {
  const cells = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 9px 16px 9px 0; border-top: 1px solid ${RULE}; vertical-align: top; width: 38%; font-family: ${SERIF}; font-size: 14px; color: ${MUTED};">${escapeHtml(label)}</td>
          <td style="padding: 9px 0; border-top: 1px solid ${RULE}; vertical-align: top; font-family: ${SERIF}; font-size: 15px; color: ${INK}; white-space: pre-line;">${escapeHtml(value as string)}</td>
        </tr>`,
    )
    .join("")

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 8px;">${cells}</table>`
}

/** A numbered list of what happens next. */
export const stepsList = (steps: [title: string, detail: string][]) =>
  steps
    .map(([title, detail], index) =>
      paragraph(
        `<span style="color: ${BRONZE};">${index + 1}.</span> <strong style="font-weight: bold;">${escapeHtml(title)}</strong><br><span style="color: ${MUTED};">${escapeHtml(detail)}</span>`,
      ),
    )
    .join("")

/** The whole email: a header, the body the template made, and the footer. */
export const emailLayout = ({
  preview,
  body,
}: {
  preview: string
  body: string
}) => `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin: 0; padding: 0; background: ${PAPER};">
    <div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${PAPER};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
            <tr>
              <td style="padding: 0 0 24px; border-bottom: 1px solid ${RULE}; font-family: ${SERIF}; font-size: 24px; letter-spacing: 0.08em; color: ${INK};">BACCHUS</td>
            </tr>
            <tr>
              <td style="padding: 28px 0 8px;">${body}</td>
            </tr>
            <tr>
              <td style="padding: 20px 0 0; border-top: 1px solid ${RULE}; font-family: ${SERIF}; font-size: 13px; line-height: 1.6; color: ${MUTED};">
                Bacchus · ${escapeHtml(ADDRESS_LINE)}<br>
                ${escapeHtml(CONTACT.phone.display)} · ${escapeHtml(CONTACT.email.display)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
