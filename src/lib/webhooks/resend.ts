// Checks that a webhook really came from Resend. Resend signs each one the
// way Svix does (docs.svix.com/receiving/verifying-payloads/how-manual):
// an HMAC-SHA256 of "<id>.<timestamp>.<raw body>", keyed with the secret
// from Resend's webhook page. Without this check, anyone could post a fake
// "bounced" and flag a real enquiry.

import { constantTimeEqual, hmacSha256Base64, isFresh } from "./hmac"

const base64ToBytes = (base64: string) =>
  Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))

export const verifyResendWebhook = async (
  rawBody: string,
  headers: Headers,
  secret: string,
): Promise<boolean> => {
  const id = headers.get("svix-id")
  const timestamp = headers.get("svix-timestamp")
  const signatures = headers.get("svix-signature")
  if (!id || !timestamp || !signatures) return false

  // Svix timestamps are in seconds.
  if (!isFresh(Number(timestamp) * 1000)) return false

  const expected = await hmacSha256Base64(
    base64ToBytes(secret.replace(/^whsec_/, "")),
    `${id}.${timestamp}.${rawBody}`,
  )

  // The header can hold several "v1,<signature>" entries, space-separated.
  return signatures
    .split(" ")
    .map((entry) => entry.split(",")[1] ?? "")
    .some((signature) => constantTimeEqual(signature, expected))
}
