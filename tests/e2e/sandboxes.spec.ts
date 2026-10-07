import { expect, test } from "@playwright/test"
import { DRAFT_PAGES } from "../../src/drafts/registry"

// The drafts index (/sandboxes), in the test build, which includes drafts.
// That the LIVE build leaves them out is checked by the build itself: the
// draft-pages integration stops a build that has a draft in it.

test("the sandboxes index lists every draft page @mobile", async ({ page }) => {
  await page.goto("/sandboxes")
  await expect(page).toHaveTitle(/Sandboxes/)

  for (const draft of DRAFT_PAGES) {
    const link = page.locator(`a.sandboxes-item[href="${draft.href}"]`)
    await expect(link).toContainText(draft.name)
  }
})

test("every draft page the index links to exists", async ({ request }) => {
  for (const draft of DRAFT_PAGES) {
    const response = await request.get(draft.href)
    expect(response.status(), draft.href).toBe(200)
  }
})
