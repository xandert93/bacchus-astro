import { expect, test } from "@playwright/test";

// EnquirySection renders each page's initial state on the server. These
// check the HTML as delivered (JavaScript disabled) so a regression back to
// "always render the wedding state and let main.js fix it" fails here.
test.describe("enquiry form initial state, before any script runs", () => {
  test.use({ javaScriptEnabled: false });

  test("corporate page starts on Corporate with a plain date input @mobile", async ({
    page,
  }) => {
    await page.goto("/corporate");
    await expect(page.locator("#chips .chip.is-selected")).toHaveText("Corporate");
    await expect(page.locator("#eventtype")).toHaveValue("Corporate");
    await expect(page.locator("#dateNativeWrap")).toBeVisible();
    await expect(page.locator("#dateCalWrap")).toBeHidden();
    await expect(page.locator("#eventStyleField")).toBeHidden();
  });

  test("homepage starts on Wedding with the calendar @mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#chips .chip.is-selected")).toHaveText("Wedding");
    await expect(page.locator("#dateNativeWrap")).toBeHidden();
    await expect(page.locator("#spacesField")).toBeHidden();
  });
});

test("switching the chip to Wedding swaps in the calendar", async ({ page }) => {
  await page.goto("/corporate");
  await page.locator("#chips .chip", { hasText: "Wedding" }).click();
  await expect(page.locator("#dateCalWrap")).toBeVisible();
  await expect(page.locator("#dateNativeWrap")).toBeHidden();
});
