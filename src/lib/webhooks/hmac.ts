// What every webhook check shares: an HMAC-SHA256 signature, a comparison
// that doesn't leak timing, and a freshness check against replays.

/** Older than this, a webhook is refused, so a captured one can't be replayed. */
const TOLERANCE_MS = 5 * 60 * 1000

/** HMAC-SHA256 of `message`, base64-encoded. */
export const hmacSha256Base64 = async (key: Uint8Array<ArrayBuffer>, message: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  )

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

/** Compares without stopping at the first difference, so timing reveals nothing. */
export const constantTimeEqual = (first: string, second: string) => {
  if (first.length !== second.length) return false

  let difference = 0
  for (let index = 0; index < first.length; index++) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index)
  }

  return difference === 0
}

/** Whether a timestamp (milliseconds) is recent enough to trust. */
export const isFresh = (timestampMs: number) =>
  Number.isFinite(timestampMs) && Math.abs(Date.now() - timestampMs) <= TOLERANCE_MS
