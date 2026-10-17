// What every endpoint the site's own pages post to shares: JSON answers,
// refusing other sites, and reading a small JSON body safely.

export const json = (
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })

/** A form's body is a few hundred bytes; anything this big isn't one. */
const MAXIMUM_BODY_BYTES = 10_000

/**
 * The request's JSON body, or the response to send instead: refused if it
 * comes from another site's page, is too large, or isn't JSON.
 */
export const readFormPost = async (
  request: Request,
): Promise<{ body: Record<string, unknown> } | { refusal: Response }> => {
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) {
    return { refusal: json(403, { error: "Not allowed." }) }
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAXIMUM_BODY_BYTES) {
    return { refusal: json(413, { error: "That's too large." }) }
  }

  try {
    return { body: await request.json() }
  } catch {
    return { refusal: json(400, { error: "That couldn't be read." }) }
  }
}

/**
 * Whether a form post looks automated: the hidden field people never see
 * was filled in, or the form was sent faster than a person could.
 */
export const looksLikeABot = (body: Record<string, unknown>, minimumSeconds: number) => {
  const startedAt = Number(body.startedAt)
  const secondsTaken = (Date.now() - startedAt) / 1000

  return Boolean(body.website) || !startedAt || secondsTaken < minimumSeconds
}
