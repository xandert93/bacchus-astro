// A quote's PDF, made when it's sent: printed from quote-html.ts, kept on the
// quote in the Studio (its "Generated PDF"), and attached to the quote email.
// The kept copy is the record of exactly what the client received: the
// design and the terms may change later, but it won't.

import type { SanityClient } from "@sanity/client"
import type { DepositRecord } from "@lib/deposits/load"
import { quoteHtml } from "./quote-html"
import { QUOTE_FOOTER } from "./quote-styles"
import { printPdf } from "./print"

export interface QuotePdf {
  filename: string
  bytes: Uint8Array<ArrayBuffer>
}

export const makeQuotePdf = async (record: DepositRecord): Promise<QuotePdf> => ({
  filename: `Bacchus quote ${record.reference}.pdf`,
  bytes: await printPdf(quoteHtml(record), { footer: QUOTE_FOOTER }),
})

/** Uploads it to Sanity and sets it as the quote's "Generated PDF". */
export const keepQuotePdf = async (
  client: SanityClient,
  quoteId: string,
  pdf: QuotePdf,
) => {
  const asset = await client.assets.upload("file", Buffer.from(pdf.bytes), {
    filename: pdf.filename,
    contentType: "application/pdf",
  })

  await client
    .patch(quoteId)
    .set({ pdf: { _type: "file", asset: { _type: "reference", _ref: asset._id } } })
    .commit()
}

/** As an email attachment, which carries the file as base64 text. */
export const asAttachment = (pdf: QuotePdf) => ({
  filename: pdf.filename,
  content: Buffer.from(pdf.bytes).toString("base64"),
})
