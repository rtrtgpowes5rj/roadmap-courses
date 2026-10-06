/**
 * «Управление» — creating, editing and deleting programmes
 * (docs/catalog-simplification.md, docs/ecosystem.md).
 */
import { expect, test, type Page } from "@playwright/test";

import {
  MAP_ID,
  openDomain,
  programDialog,
  programGroup,
  readDraft,
  readFixture,
  resetData,
  uniqueTitle
} from "./helpers";

test.beforeEach(async () => {
  await resetData();
});

async function createProgram(page: Page, title: string, format: string, year?: number) {
  await page.getByRole("button", { name: "+ Добавить программу" }).click();
  const dialog = programDialog(page);
  await expect(dialog.getByRole("heading", { name: "Добавить программу" })).toBeVisible();
  await dialog.getByLabel("Название").fill(title);
  await dialog.getByRole("combobox", { name: /^Формат/ }).selectOption(format);
  if (year) await dialog.getByLabel("Год реализации").fill(String(year));
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Сохранено");
}

test("creates a programme that persists and appears in the scheme immediately", async ({ page }) => {
  const title = uniqueTitle("sprint");
  await page.goto("/editor");
  await createProgram(page, title, "sprint", 2027);

  await expect(programGroup(page, "Спринты").getByRole("button", { name: `Изменить: ${title}` })).toBeVisible();
  const saved = (await readDraft()).products.find((p) => p.title === title);
  expect(saved).toMatchObject({ productType: "sprint", implementationYear: 2027, shortTitle: title });

  await page.reload();
  await expect(page.getByRole("button", { name: `Изменить: ${title}` })).toBeVisible();

  await page.goto(`/view/${MAP_ID}`);
  await expect(programGroup(page, "Спринты").getByRole("button", { name: `Открыть: ${title}` })).toBeVisible();
});

test("changing format and year moves the programme to another group and domain", async ({ page }) => {
  const title = uniqueTitle("move");
  await page.goto("/editor");
  await createProgram(page, title, "practicum", 2026);

  await page.getByRole("button", { name: `Изменить: ${title}` }).click();
  const dialog = programDialog(page);
  await dialog.getByRole("combobox", { name: /^Формат/ }).selectOption("product_course");
  await dialog.getByLabel("Год реализации").fill("2025");
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog).toHaveCount(0);

  // The workspace follows the programme into its new domain.
  await expect(page.getByRole("tab", { name: /Курсы по эксплуатации продуктов/ })).toHaveAttribute("aria-selected", "true");
  await expect(programGroup(page, "BASE").getByRole("button", { name: `Изменить: ${title}` })).toBeVisible();
  expect((await readDraft()).products.find((p) => p.title === title)).toMatchObject({
    productType: "product_course",
    implementationYear: 2025
  });
});

test("an empty title or an out-of-range year is never saved", async ({ page }) => {
  const before = await readDraft();
  await page.goto("/editor");
  await page.getByRole("button", { name: "+ Добавить программу" }).click();
  const dialog = programDialog(page);
  const save = dialog.getByRole("button", { name: "Сохранить" });

  await expect(save).toBeDisabled();
  await dialog.getByLabel("Название").fill("   ");
  await expect(save).toBeDisabled();

  await dialog.getByLabel("Название").fill(uniqueTitle("bad year"));
  await dialog.getByLabel("Год реализации").fill("1999");
  await save.click();
  // Native constraint validation keeps the form open and nothing reaches the server.
  await expect(dialog).toBeVisible();
  expect((await readDraft()).products).toHaveLength(before.products.length);
});

test("deletion asks for confirmation, can be cancelled and persists", async ({ page }) => {
  const title = uniqueTitle("delete");
  await page.goto("/editor");
  await createProgram(page, title, "intensive");
  const opener = page.getByRole("button", { name: `Изменить: ${title}` });

  await opener.click();
  const dialog = programDialog(page);
  await dialog.getByRole("button", { name: "Удалить" }).click();
  await expect(dialog.getByText(`Удалить «${title}» из схемы?`)).toBeVisible();
  await dialog.getByRole("button", { name: "Оставить" }).click();
  await expect(dialog.getByText(`Удалить «${title}» из схемы?`)).toHaveCount(0);

  await dialog.getByRole("button", { name: "Удалить" }).click();
  await dialog.getByRole("button", { name: "Да, удалить" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Программа удалена");
  await expect(opener).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: `Изменить: ${title}` })).toHaveCount(0);
  expect((await readDraft()).products.some((p) => p.title === title)).toBe(false);
});

test("a network failure keeps the form and shows a readable error", async ({ page }) => {
  const title = uniqueTitle("offline");
  await page.goto("/editor");
  await page.route("**/api/maps/*/content", (route) => route.abort("internetdisconnected"));

  await page.getByRole("button", { name: "+ Добавить программу" }).click();
  const dialog = programDialog(page);
  await dialog.getByLabel("Название").fill(title);
  await dialog.getByRole("button", { name: "Сохранить" }).click();

  await expect(dialog.getByRole("alert")).toHaveText("Нет связи с сервером. Повторите попытку.");
  await expect(dialog.getByLabel("Название")).toHaveValue(title);
  expect((await readDraft()).products.some((p) => p.title === title)).toBe(false);
});

test("a stale tab gets a conflict message and cannot overwrite fresh data", async ({ page, context }) => {
  const fresh = uniqueTitle("fresh");
  const stale = uniqueTitle("stale");
  const staleTab = await context.newPage();
  await staleTab.goto("/editor");
  await page.goto("/editor");

  await createProgram(page, fresh, "practicum");

  await staleTab.getByRole("button", { name: "+ Добавить программу" }).click();
  const dialog = programDialog(staleTab);
  await dialog.getByLabel("Название").fill(stale);
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Схема уже изменена в другой вкладке");

  const titles = (await readDraft()).products.map((p) => p.title);
  expect(titles).toContain(fresh);
  expect(titles).not.toContain(stale);
});

test("renaming a trainer module renames its intensive, years stay independent", async ({ page }) => {
  const fixture = await readFixture();
  const link = fixture.ecosystemLinks!.find((l) => l.kind === "intensive" && l.sourceId === "prod-siem-module")!;
  const module = fixture.products.find((p) => p.id === link.sourceId)!;
  const intensive = fixture.products.find((p) => p.id === link.targetId)!;
  const renamed = uniqueTitle("SIEM");

  await page.goto("/editor");
  await openDomain(page, "Тренажёр");
  await page.getByRole("button", { name: `Изменить: ${module.title}` }).click();
  const dialog = programDialog(page);
  await dialog.getByLabel("Название").fill(renamed);
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog).toHaveCount(0);

  const draft = await readDraft();
  expect(draft.products.find((p) => p.id === module.id)).toMatchObject({ title: renamed, implementationYear: module.implementationYear });
  expect(draft.products.find((p) => p.id === intensive.id)).toMatchObject({ title: renamed, implementationYear: intensive.implementationYear });
});
