// GET /api/dev/quote-pdf?id=<quote id>: a quote's PDF, made on the spot, for
// checking the design on the dev server (`&format=html` gives the page it's
// printed from). Nothing is kept or sent. Only on the dev server: anywhere
// else it answers 404, as if it weren't here.

import type { APIRoute } from "astro"
import { loadDepositByQuoteId } from "@lib/deposits/load"
import { quoteHtml } from "@lib/quotes/pdf/quote-html"
import { makeQuotePdf } from "@lib/quotes/pdf/quote-pdf"
import { getWriteClient } from "@lib/sanity/write-client"

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV) return new Response(null, { status: 404 })

  const client = getWriteClient()
  const id = url.searchParams.get("id")
  if (!client || !id)
    return new Response("Give a quote's id: ?id=quote.…", { status: 400 })

  const record = await loadDepositByQuoteId(client, id)
  if (!record?.booking)
    return new Response("No quote with a booking has that id.", { status: 404 })

  if (url.searchParams.get("format") === "html") {
    return new Response(quoteHtml(record), { headers: { "Content-Type": "text/html" } })
  }

  const pdf = await makeQuotePdf(record)
  return new Response(new Blob([pdf.bytes]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.filename}"`,
    },
  })
}
