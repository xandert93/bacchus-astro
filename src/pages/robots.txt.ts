// /robots.txt, built from `site` in astro.config.mjs so the sitemap's address
// is written in one place.
//
// It lets every crawler in. Until launch the pages are kept out of search
// results by the noindex header in public/_headers instead: a crawler has to
// be allowed to fetch a page to see that header, so blocking it here would
// stop the noindex from working, not help it.
import type { APIRoute } from "astro"

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL("sitemap-index.xml", site).href

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`)
}
