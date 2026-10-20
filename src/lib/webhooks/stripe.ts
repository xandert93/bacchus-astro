// Checks that a webhook really came from Stripe. Stripe signs each one in
// the header `Stripe-Signature: t=<seconds>,v1=<signature>`, where the
// signature is an HMAC-SHA256 of "<timestamp>.<raw body>", hex-encoded,
// keyed with the endpoint's signing secret (`whsec_…`, from `stripe listen`
// locally or the Dashboard's webhook page live). The same scheme Stripe's
// own library checks, written out so the Worker needs no extra dependency.

import { constantTimeEqual, hmacSha256Base64, isFresh } from "./hmac"

const base64ToHex = (base64: string) =>
  Array.from(atob(base64), (character) =>
    character.charCodeAt(0).toString(16).padStart(2, "0"),
  ).join("")

export const verifyStripeWebhook = async (
  rawBody: string,
  headers: Headers,
  secret: string,
): Promise<boolean> => {
  const header = headers.get("stripe-signature")
  if (!header) return false

  const parts = header.split(",").map((part) => part.split("="))
  const timestamp = parts.find(([name]) => name === "t")?.[1]
  // Stripe may send more than one v1 while a secret is being rolled.
  const signatures = parts.filter(([name]) => name === "v1").map(([, value]) => value)
  if (!timestamp || !signatures.length) return false
  if (!isFresh(Number(timestamp) * 1000)) return false

  const expected = base64ToHex(
    await hmacSha256Base64(new TextEncoder().encode(secret), `${timestamp}.${rawBody}`),
  )

  return signatures.some((signature) => constantTimeEqual(signature, expected))
}
