/**
 * Shell: navigation between sections, theme persistence, mobile layout.
 */
import { expect, test, type Page } from "@playwright/test";

import { MAP_ID, openDomain, programDialog, resetData } from "./helpers";

test.beforeEach(async () => {
  await resetData();
});

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test("header navigation links the three sections and marks the current one", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(new RegExp(`/view/${MAP_ID}$`));
  const nav = page.getByRole("navigation", { name: "Разделы" });

  for (const [name, url] of [["Управление", /\/editor$/], ["Экосистема", /\/ecosystem\//], ["Схема", /\/view\//]] as const) {
    await nav.getByRole("link", { name }).click();
    await expect(page).toHaveURL(url);
    await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  }
});

test("theme toggle switches and survives a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(`/view/${MAP_ID}`);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Включить тёмную тему" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Включить светлую тему" })).toBeVisible();
});

test.describe("mobile 390 × 844", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const route of [`/view/${MAP_ID}`, "/editor"]) {
    test(`${route} has no horizontal overflow and switches domains`, async ({ page }) => {
      await page.goto(route);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      await openDomain(page, "Тренажёр");
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test("domains are a compact row, so programmes are visible on the first screen", async ({ page }) => {
    await page.goto(`/view/${MAP_ID}`);
    const tabs = page.getByRole("tab");
    const tops = await tabs.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    const firstProgram = await page.locator("button.program").first().boundingBox();
    expect(firstProgram!.y + firstProgram!.height).toBeLessThan(844);
  });

  test("ecosystem stacks the columns, hides lines and pins the selection to the bottom", async ({ page }) => {
    await page.goto(`/ecosystem/${MAP_ID}`);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    const region = page.getByRole("region", { name: "Полотно экосистемы, три колонки" });
    expect(await region.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);

    const soc = region.getByRole("region", { name: "SOC, мониторинг и расследование" });
    for (const label of ["Интенсивы", "Профессиональные программы", "Курсы BASE"]) {
      await expect(soc.getByRole("heading", { name: label, exact: true })).toBeVisible();
    }
    await expect(region.locator("svg.eco-bridges").first()).toBeHidden();
    // Relationships of the selected programme are still visible as highlighted cards.
    await expect(soc.locator(".eco-node.connected").first()).toBeVisible();

    const inspector = page.locator("details.connection-inspector");
    const box = await inspector.boundingBox();
    expect(844 - (box!.y + box!.height)).toBeLessThan(20);
    await inspector.locator("summary").click();
    await expect(inspector.locator(".inspector-body li").first()).toBeVisible();
  });

  test("the edit form fits the screen", async ({ page }) => {
    await page.goto("/editor");
    await page.getByRole("button", { name: "+ Добавить программу" }).click();
    const dialog = programDialog(page);
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await expect(dialog.getByRole("button", { name: "Сохранить" })).toBeVisible();
  });
});

test.describe("tablet 768 × 1024", () => {
  test.use({ viewport: { width: 768, height: 1024 }, hasTouch: true });

  test("ecosystem uses the stacked layout without horizontal scrolling", async ({ page }) => {
    await page.goto(`/ecosystem/${MAP_ID}`);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    const region = page.getByRole("region", { name: "Полотно экосистемы, три колонки" });
    expect(await region.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
});
