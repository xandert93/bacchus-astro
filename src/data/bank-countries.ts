// The countries whose banks "Pay by bank" offers through Enable Banking, in
// the order the picker shows them, Malta first. Shared by the picker's
// country chips (src/pages/secure-booking/choose-bank.astro) and the server,
// which asks Enable Banking for these countries' banks
// (src/lib/payments/enable-banking.ts). A country with no bank that can take
// the payment is hidden; Malta's sandbox has none, so the trial runs on the
// others.

export const BANK_COUNTRIES = [
  { code: "MT", name: "Malta" },
  { code: "IE", name: "Ireland" },
  { code: "LT", name: "Lithuania" },
  { code: "FI", name: "Finland" },
  { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
] as const
