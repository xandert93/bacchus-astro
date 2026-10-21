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
  // The stand-in payment provider while payments are in test mode.
  { path: "/secure-booking/test-checkout", title: /Test Payment/, noIndex: true },
  // The bank picker for Enable Banking's "Pay by bank".
  { path: "/secure-booking/choose-bank", title: /Choose Your Bank/, noIndex: true },
  { path: "/menu", title: /Menu/ },
  // Reached only from a waitlist email's link.
  { path: "/waitlist", title: /Waitlist/, noIndex: true },
]
