/**
 * «Схема» — read-only catalog (docs/catalog-simplification.md, «Проверяемые сценарии»).
 */
import { expect, test } from "@playwright/test";

import {
  MAP_ID,
  catalogGroup,
  domainTab,
  openDomain,
  programDialog,
  programGroup,
  readFixture,
  resetData
} from "./helpers";

const VIEW = `/view/${MAP_ID}`;

test.beforeEach(async () => {
  await resetData();
});

test("shows three domains whose counters match the public programmes", async ({ page }) => {
  const fixture = await readFixture();
  const visible = fixture.products.filter((product) => product.publicVisible);
  const count = (groups: string[]) => visible.filter((p) => groups.includes(catalogGroup(p))).length;

  await page.goto(VIEW);
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(domainTab(page, "Профессиональные программы")).toContainText(String(count(["practicum", "sprint", "intensive"])));
  await expect(domainTab(page, "Курсы по эксплуатации продуктов")).toContainText(String(count(["product_course"])));
  await expect(domainTab(page, "Тренажёр")).toContainText(String(count(["module"])));

  // Professional programmes are open by default and split into three formats.
  await expect(domainTab(page, "Профессиональные программы")).toHaveAttribute("aria-selected", "true");
  for (const [title, group] of [["Практикумы", "practicum"], ["Спринты", "sprint"], ["Интенсивы", "intensive"]]) {
    await expect(programGroup(page, title).locator("button.program")).toHaveCount(count([group]));
  }
});

test("switches domains with the mouse and the keyboard", async ({ page }) => {
  await page.goto(VIEW);

  await openDomain(page, "Курсы по эксплуатации продуктов");
  await expect(programGroup(page, "BASE")).toBeVisible();

  await domainTab(page, "Курсы по эксплуатации продуктов").press("ArrowRight");
  await expect(domainTab(page, "Тренажёр")).toHaveAttribute("aria-selected", "true");
  await expect(domainTab(page, "Тренажёр")).toBeFocused();

  await page.keyboard.press("Home");
  await expect(domainTab(page, "Профессиональные программы")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(domainTab(page, "Тренажёр")).toHaveAttribute("aria-selected", "true");
});

test("search narrows the list, shows an empty state and resets", async ({ page }) => {
  await page.goto(VIEW);
  const programs = page.locator("#domain-content button.program");
  const total = await programs.count();

  await page.getByRole("searchbox", { name: "Найти программу" }).fill("Мониторинг и реагирование");
  await expect(programs).toHaveCount(1);

  await page.getByRole("searchbox", { name: "Найти программу" }).fill("нет такой программы");
  await expect(programs).toHaveCount(0);
  await expect(page.getByText("Нет программ по фильтру").first()).toBeVisible();

  await page.getByRole("button", { name: "Сбросить" }).click();
  await expect(programs).toHaveCount(total);
});

test("year filter shows only programmes of that year, including «Не указан»", async ({ page }) => {
  const fixture = await readFixture();
  const professional = fixture.products.filter(
    (p) => p.publicVisible && ["practicum", "sprint", "intensive"].includes(catalogGroup(p))
  );

  await page.goto(VIEW);
  const programs = page.locator("#domain-content button.program");
  const yearFilter = page.getByLabel("Год реализации: фильтр");

  await yearFilter.selectOption("2027");
  await expect(programs).toHaveCount(professional.filter((p) => p.implementationYear === 2027).length);
  await expect(page.locator("#domain-content .program-year")).toHaveText(Array(await programs.count()).fill("2027"));

  await yearFilter.selectOption("none");
  await expect(programs).toHaveCount(professional.filter((p) => !p.implementationYear).length);
});

test("description dialog is read-only, closes on Escape and returns focus", async ({ page }) => {
  await page.goto(VIEW);
  const opener = page.getByRole("button", { name: "Открыть: Мониторинг и реагирование" });
  await opener.click();

  const dialog = programDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Мониторинг и реагирование" })).toBeVisible();
  await expect(dialog.locator("textarea, input, select")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Сохранить" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("programmes hidden by the owner are absent from the scheme but kept in management", async ({ page }) => {
  const fixture = await readFixture();
  const hidden = fixture.products.find((p) => !p.publicVisible);
  test.skip(!hidden, "fixture has no hidden programme");

  await page.goto(VIEW);
  await openDomain(page, "Тренажёр");
  await expect(page.getByRole("button", { name: `Открыть: ${hidden!.title}` })).toHaveCount(0);

  await page.goto("/editor");
  await openDomain(page, "Тренажёр");
  await expect(page.getByRole("button", { name: `Изменить: ${hidden!.title}` })).toBeVisible();
});

test("scheme exposes no editing tools, arrows or publication controls", async ({ page }) => {
  await page.goto(VIEW);
  await expect(page.getByRole("button", { name: "+ Добавить программу" })).toHaveCount(0);
  await expect(page.locator(".add-to-group")).toHaveCount(0);
  // The only SVG on the page is the theme icon in the header.
  await expect(page.locator(".react-flow, #domain-content svg")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Publish|Опубликовать|Rollback|Откатить/ })).toHaveCount(0);
});
