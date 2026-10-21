// Enable Banking (enablebanking.com), an open-banking provider, tried as an
// alternative to Stripe's Pay by Bank because it lists Bank of Valletta and
// HSBC Malta (docs/architecture/tech-stack.md, "Bank"). It's used for "Pay by
// bank" whenever its two settings are in .env (src/lib/payments/checkout.ts).
//
// How a payment goes: the couple picks their bank on our page
// (/secure-booking/choose-bank), we ask Enable Banking for a payment to
// Bacchus's account from that bank, and send the couple to the address it
// returns, where they approve it with their bank. Their bank sends them back
// to /secure-booking, and the page asks us to check the payment's status
// (src/pages/api/deposits/view.ts).
//
// Every request is authorised with a short-lived token (a JWT) signed with
// the application's private key, which Enable Banking checks against the
// public half it holds. No shared secret ever travels.

import { ENABLE_BANKING_APP_ID, ENABLE_BANKING_PRIVATE_KEY } from "astro:env/server"
import type { DepositRecord } from "@lib/deposits/load"

const API = "https://api.enablebanking.com"

/** Whether Enable Banking is set up here. */
export const enableBankingConfigured = () =>
  Boolean(ENABLE_BANKING_APP_ID && ENABLE_BANKING_PRIVATE_KEY)

// --- The signed token ------------------------------------------------------------

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

const textToBase64url = (text: string) => base64url(new TextEncoder().encode(text))

let signingKey: Promise<CryptoKey> | undefined
let cachedToken: { value: string; expiresAt: number } | undefined

/** A token for the next hour, reused until ten minutes before it expires. */
const authorisationToken = async () => {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt - 600 > now) return cachedToken.value

  signingKey ??= crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(ENABLE_BANKING_PRIVATE_KEY ?? ""), (character) =>
      character.charCodeAt(0),
    ),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const expiresAt = now + 3600
  const unsigned = `${textToBase64url(
    JSON.stringify({ typ: "JWT", alg: "RS256", kid: ENABLE_BANKING_APP_ID }),
  )}.${textToBase64url(
    JSON.stringify({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: now,
      exp: expiresAt,
    }),
  )}`
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      await signingKey,
      new TextEncoder().encode(unsigned),
    ),
  )

  cachedToken = { value: `${unsigned}.${base64url(signature)}`, expiresAt }

  return cachedToken.value
}

const enableBankingRequest = async <Result>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
) => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await authorisationToken()}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(
      `Enable Banking answered ${response.status}: ${JSON.stringify(result)}`,
    )
  }

  return result as Result
}

// --- Banks, payments and their status -----------------------------------------

/**
 * Countries whose banks are offered, Malta first. The others are where its
 * sandbox has banks that can take payments, so the flow can be tried at all
 * (Malta's own banks aren't in the sandbox).
 */
const COUNTRIES = ["MT", "IE", "LT", "FI", "EE", "ES", "NL"]

export interface PaymentBank {
  name: string
  country: string
}

/** Banks that can start a euro payment, by country. */
export const listPaymentBanks = async () => {
  const lists = await Promise.all(
    COUNTRIES.map((country) =>
      enableBankingRequest<{ aspsps: (PaymentBank & { payments?: unknown[] })[] }>(
        "GET",
        `/aspsps?country=${country}&service=PIS&psu_type=personal`,
      ),
    ),
  )

  return lists.flatMap((list) =>
    list.aspsps
      .filter((bank) => bank.payments?.length)
      .map(({ name, country }) => ({ name, country })),
  )
}

/** Where the couple's bank sends them back to (registered with Enable Banking). */
export const bankReturnUrl = (siteOrigin: string) => `${siteOrigin}/secure-booking`

/**
 * Asks Enable Banking for the deposit as a payment to Bacchus's account from
 * the couple's chosen bank, and answers with its id and the address where
 * they approve it.
 */
export const createBankPayment = ({
  record,
  bank,
  state,
  creditorIban,
  siteOrigin,
}: {
  record: DepositRecord
  bank: PaymentBank
  /** Comes back with the couple, to find this payment again. */
  state: string
  creditorIban: string
  siteOrigin: string
}) =>
  enableBankingRequest<{ payment_id: string; url: string }>("POST", "/payments", {
    payment_type: "SEPA",
    payment_request: {
      credit_transfer_transaction: [
        {
          instructed_amount: {
            currency: "EUR",
            amount: record.pricing.deposit.amount.toFixed(2),
          },
          beneficiary: {
            creditor: { name: record.bank?.accountName || "Bacchus" },
            creditor_account: { scheme_name: "IBAN", identification: creditorIban },
          },
          remittance_information: [`${record.reference} deposit`],
        },
      ],
    },
    aspsp: bank,
    state,
    redirect_url: bankReturnUrl(siteOrigin),
    psu_type: "personal",
  })

/**
 * Where a payment stands, in the banks' own codes (ISO 20022): settled
 * (ACSC, ACCC), accepted and on its way (ACCP, ACSP, ACWC, ACTC), still
 * waiting (RCVD, PDNG), or stopped (RJCT, CANC).
 */
export const bankPaymentStatus = (paymentId: string) =>
  enableBankingRequest<{ status: string; final_status?: boolean }>(
    "GET",
    `/payments/${paymentId}`,
  )

export const SETTLED_STATUSES = ["ACSC", "ACCC"]
export const ON_ITS_WAY_STATUSES = ["ACCP", "ACSP", "ACWC", "ACTC"]
