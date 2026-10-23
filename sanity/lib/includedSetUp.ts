/**
 * The chairs and bar pieces every booking includes at no charge, as a range
 * for its guest count: "32–48 chairs and 1–2 bar pieces" for 160 guests.
 *
 * Worked out from the wedding policy's figures when a quote is sent, then
 * kept on the quote, so a later change to the policy can't rewrite a quote
 * the client already has (the same rule as the quote's prices).
 *
 * Pure on purpose, like quoteTotals.ts, so it can be unit tested.
 */

export type IncludedSetUpPolicy = {
  chairsMinPercent?: number
  chairsMaxPercent?: number
  guestsPerBarPiece?: number
}

export type IncludedSetUp = {
  chairsFrom: number
  chairsTo: number
  barPiecesFrom: number
  barPiecesTo: number
}

/** Nothing when the policy doesn't say, so no quote states a guess. */
export const includedSetUpFor = (
  guestCount: number | undefined,
  policy: IncludedSetUpPolicy | null | undefined,
): IncludedSetUp | undefined => {
  const { chairsMinPercent, chairsMaxPercent, guestsPerBarPiece } = policy ?? {}
  if (
    !guestCount ||
    chairsMinPercent === undefined ||
    chairsMaxPercent === undefined ||
    !guestsPerBarPiece
  ) {
    return undefined
  }

  return {
    chairsFrom: Math.round((guestCount * chairsMinPercent) / 100),
    chairsTo: Math.round((guestCount * chairsMaxPercent) / 100),
    barPiecesFrom: 1,
    barPiecesTo: Math.max(1, Math.ceil(guestCount / guestsPerBarPiece)),
  }
}

const range = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`)

/** "32–48 chairs and 1–2 bar pieces". */
export const describeIncludedSetUp = ({
  chairsFrom,
  chairsTo,
  barPiecesFrom,
  barPiecesTo,
}: IncludedSetUp) =>
  `${range(chairsFrom, chairsTo)} chairs and ${range(barPiecesFrom, barPiecesTo)} ${
    barPiecesTo === 1 ? "bar piece" : "bar pieces"
  }`
