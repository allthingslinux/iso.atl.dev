import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page has loaded
    expect(page.url()).toContain("localhost:3000");
  });

  test("should have a title", async ({ page }) => {
    await page.goto("/");

    // Check for a title or heading
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
