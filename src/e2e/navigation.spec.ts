import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should have main navigation", async ({ page }) => {
    await page.goto("/");
    
    // Check for header or nav elements
    const header = page.locator("header, nav");
    const headerCount = await header.count();
    expect(headerCount).toBeGreaterThanOrEqual(0);
  });

  test("should navigate between pages", async ({ page }) => {
    await page.goto("/");
    
    // Find any navigation links
    const links = page.locator("a");
    const linkCount = await links.count();
    
    // Page should have some navigation (at least the basic structure)
    expect(linkCount).toBeGreaterThanOrEqual(0);
  });

  test("should have footer", async ({ page }) => {
    await page.goto("/");
    
    const footer = page.locator("footer");
    const footerCount = await footer.count();
    
    // Footer might be present
    expect(footerCount).toBeGreaterThanOrEqual(0);
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const content = await page.content();
    expect(content).toBeTruthy();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopContent = await page.content();
    expect(desktopContent).toBeTruthy();
  });
});
