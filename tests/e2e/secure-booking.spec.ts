import { test, expect, type Page } from "@playwright/test"

// The deposit page asks /api/deposits/view what to show. The preview server
// has no Sanity access in CI, so the test answers for it, with a quote shaped
// as src/lib/deposits/view.ts sends one.
const answerWithAQuote = async (page: Page) => {
  await page.route("**/api/deposits/view", (route) =>
    route.fulfill({
      json: {
        view: {
          state: "pay",
          testMode: true,
          transferMode: "manual",
          transferInstructionsUrl: "",
          couple: "Megan Ellis & Joe Ellul",
          firstName: "Megan",
          reference: "BAC-20261021-ELLI",
          occasion: "wedding day",
          spaces: "the Terrace",
          date: "Saturday 24th April 2027",
          facts: [
            [
              { label: "Date", value: "Saturday 24th April 2027" },
              { label: "Guests", value: "110" },
            ],
            [
              { label: "Spaces", value: "Terrace and Prince De Redin Hall" },
              { label: "Food", value: "Reception – Daisy" },
            ],
          ],
          priceGroups: [
            {
              title: "Drinks",
              subtotal: "€4,015",
              lines: [
                {
                  label: "Maltese wine",
                  details: "",
                  quantity: "110",
                  unitPrice: "€30",
                  single: false,
                  amount: "€3,300",
                },
                {
                  label: "Welcome drink",
                  details: "",
                  quantity: "110",
                  unitPrice: "€6.50",
                  single: false,
                  amount: "€715",
                },
              ],
            },
          ],
          notes: "",
          preparedBy: "Nicholas Vella Gatt",
          subtotal: "€4,015",
          total: "€4,015",
          perGuest: "€36.50",
          deposit: {
            display: "€1,204.50",
            plain: "1204.50",
            note: "30% of the total.",
          },
          balanceNote: "",
          bank: {
            accountName: "",
            iban: "",
            reference: "BAC-20261021-ELLI",
            areReal: false,
          },
        },
      },
    }),
  )
}

test("the deposit page shows the price in the PDF's groups", async ({ page }) => {
  await answerWithAQuote(page)
  await page.goto("/secure-booking?token=test")

  const facts = page.locator("#depositFacts")
  await expect(facts.getByText("Food")).toBeVisible()
  await expect(facts.getByText("Reception – Daisy")).toBeVisible()

  const group = page.locator(".secure-booking-price-group")
  await expect(group.locator(".secure-booking-price-group-title")).toContainText("Drinks")
  await expect(group.locator(".secure-booking-price-group-subtotal")).toHaveText("€4,015")

  // On a wide screen, the quantity and price have their own columns.
  const wine = group.locator(".secure-booking-price-line").first()
  await expect(wine.locator(".secure-booking-price-quantity")).toHaveText("110")
  await expect(wine.locator(".secure-booking-price-unit")).toHaveText("€30")
  await expect(page.locator(".secure-booking-price-head")).toBeVisible()
})

test("on a phone, each line's sum sits under it @mobile", async ({ page }) => {
  // Phone-sized in the desktop project too, which runs every test.
  await page.setViewportSize({ width: 390, height: 844 })
  await answerWithAQuote(page)
  await page.goto("/secure-booking?token=test")

  const wine = page.locator(".secure-booking-price-line").first()
  await expect(wine.locator(".secure-booking-price-sum")).toHaveText("110 × €30")
  await expect(page.locator(".secure-booking-price-head")).toBeHidden()
})
