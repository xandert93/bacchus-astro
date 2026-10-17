// Checks that a webhook really came from Resend. Resend signs each one the
// way Svix does (docs.svix.com/receiving/verifying-payloads/how-manual):
// an HMAC-SHA256 of "<id>.<timestamp>.<raw body>", keyed with the secret
// from Resend's webhook page. Without this check, anyone could post a fake
// "bounced" and flag a real enquiry.

/** Older than this, a message is refused, so a captured one can't be replayed. */
const TOLERANCE_SECONDS = 5 * 60

const base64ToBytes = (base64: string) =>
  Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))

/** Compares without stopping at the first difference, so timing reveals nothing. */
const constantTimeEqual = (first: string, second: string) => {
  if (first.length !== second.length) return false

  let difference = 0
  for (let index = 0; index < first.length; index++) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index)
  }

  return difference === 0
}

export const verifyResendWebhook = async (
  rawBody: string,
  headers: Headers,
  secret: string,
): Promise<boolean> => {
  const id = headers.get("svix-id")
  const timestamp = headers.get("svix-timestamp")
  const signatures = headers.get("svix-signature")
  if (!id || !timestamp || !signatures) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false

  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secret.replace(/^whsec_/, "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`),
  )
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)))

  // The header can hold several "v1,<signature>" entries, space-separated.
  return signatures
    .split(" ")
    .map((entry) => entry.split(",")[1] ?? "")
    .some((signature) => constantTimeEqual(signature, expected))
}
