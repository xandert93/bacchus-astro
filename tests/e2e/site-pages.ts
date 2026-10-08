// Every page on the site, drafts included, for the tests that check them all
// (pages.spec.ts, seo.spec.ts). Add each newly ported page here.
export const PAGES = [
  { path: "/", title: /Bacchus/ },
  { path: "/weddings", title: /Weddings/ },
  { path: "/corporate", title: /Corporate/ },
  { path: "/celebrations", title: /Celebrations/ },
  { path: "/gallery", title: /Gallery/ },
  { path: "/weddings/packages/reception", title: /Reception/ },
  { path: "/weddings/packages/banquet", title: /Banquet/ },
  { path: "/weddings/packages/high-tea", title: /High Tea/ },
  { path: "/weddings/packages/beverage", title: /Beverage/ },
  // Reached only from a private link, so kept out of search results.
  { path: "/secure-booking", title: /Secure Your Booking/, noIndex: true },
  { path: "/menu", title: /Menu/ },
]
