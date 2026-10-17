// Checks that a webhook really came from Sanity. Sanity signs each one with
// the secret set on the webhook (sanity.io/manage → API → Webhooks), in the
// header `sanity-webhook-signature: t=<milliseconds>,v1=<signature>`, where
// the signature is an HMAC-SHA256 of "<timestamp>.<raw body>", base64url
// encoded. The same scheme as Sanity's own @sanity/webhook package, written
// out here so the Worker needs no extra dependency.

import { constantTimeEqual, hmacSha256Base64, isFresh } from "./hmac"

const HEADER = /^t=(\d+)[, ]+v1=([^, ]+)$/

const toBase64Url = (base64: string) =>
  base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

export const verifySanityWebhook = async (
  rawBody: string,
  headers: Headers,
  secret: string,
): Promise<boolean> => {
  const match = headers.get("sanity-webhook-signature")?.trim().match(HEADER)
  if (!match) return false

  const [, timestamp, signature] = match
  if (!isFresh(Number(timestamp))) return false

  const expected = toBase64Url(
    await hmacSha256Base64(new TextEncoder().encode(secret), `${timestamp}.${rawBody}`),
  )

  return constantTimeEqual(signature, expected)
}
