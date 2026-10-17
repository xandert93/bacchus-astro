// The secret in a waitlist email's links ("confirm", "take me off"). Only a
// hash of it is stored, so even someone who could read the dataset couldn't
// confirm or remove anyone: they'd need the link from that person's inbox.

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("")

/** The hash stored on the waitlist entry, looked up when a link is used. */
export const hashToken = async (token: string) =>
  toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))

/** A new random token, safe in a URL, and its hash. */
export const newToken = async () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return { token, hash: await hashToken(token) }
}
