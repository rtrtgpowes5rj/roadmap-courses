/**
 * «Экосистема» — three-column canvas with relationship lines (docs/ecosystem.md).
 */
import { expect, test, type Page } from "@playwright/test";

import { MAP_ID, openDomain, programDialog, readFixture, resetData } from "./helpers";

const ECOSYSTEM = `/ecosystem/${MAP_ID}`;
const L1 = "Мониторинг и реагирование";

test.beforeEach(async () => {
  await resetData();
});

function canvas(page: Page) {
  return page.getByRole("region", { name: "Полотно экосистемы, три колонки" });
}

function inspector(page: Page) {
  return page.locator("details.connection-inspector");
}

async function openInspector(page: Page) {
  const panel = inspector(page);
  if ((await panel.getAttribute("open")) === null) await panel.locator("summary").click();
  return panel;
}

test("renders three columns; trainer modules and hidden programmes are not nodes", async ({ page }) => {
  const fixture = await readFixture();
  await page.goto(ECOSYSTEM);

  for (const heading of ["Интенсивы", "Профессиональные программы", "Курсы BASE"]) {
    await expect(canvas(page).getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  const nodeIds = await canvas(page).locator(".eco-node").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-program-id"))
  );
  const byId = new Map(fixture.products.map((p) => [p.id, p]));
  expect(nodeIds.length).toBeGreaterThan(0);
  for (const id of nodeIds) {
    expect(byId.get(id!)?.productType).not.toBe("module");
    expect(byId.get(id!)?.publicVisible).toBe(true);
  }
});

test("the default programme shows its confirmed relationships from the owner", async ({ page }) => {
  await page.goto(ECOSYSTEM);
  const panel = await openInspector(page);
  await expect(panel.locator(".inspector-title strong")).toHaveText(L1);

  // docs/ecosystem.md: SIEM, WAF, NTA intensives and BASE SIEM, AF PRO, NAD.
  const related = panel.locator(".inspector-body li");
  await expect(related).toHaveCount(6);
  for (const text of ["SIEM", "WAF", "NTA", "MaxPatrol SIEM", "PT AF PRO", "PT NAD"]) {
    await expect(related.filter({ hasText: text }).first()).toBeVisible();
  }
  await expect(related.locator(".status-line.proposed")).toHaveCount(0);

  // Each relationship is drawn as a confirmed line in at least one domain band.
  await expect(canvas(page).locator("svg.eco-bridges g.bridge").first()).toBeVisible();
  await expect(canvas(page).locator("svg.eco-bridges g.bridge.proposed")).toHaveCount(0);
});

test("selecting another programme updates the inspector and highlights nodes", async ({ page }) => {
  await page.goto(ECOSYSTEM);
  const target = canvas(page).locator(".eco-node", { hasText: "Архитектура сетевой безопасности предприятия" }).first();
  await target.click();
  await expect(target).toHaveAttribute("aria-pressed", "true");

  const panel = await openInspector(page);
  await expect(panel.locator(".inspector-title strong")).toHaveText("Архитектура сетевой безопасности предприятия");
  await expect(panel.locator(".inspector-body li").first()).toBeVisible();
  await expect(canvas(page).locator(".eco-node.connected").first()).toBeVisible();
});

test("«Все связи» draws every line; «Предлагаемые связи» hides proposals", async ({ page }) => {
  await page.goto(ECOSYSTEM);
  const lines = canvas(page).locator("svg.eco-bridges g.bridge");
  const focused = await lines.count();

  await page.getByLabel("Все связи").check();
  await expect.poll(() => lines.count()).toBeGreaterThan(focused);
  await expect(canvas(page).locator("g.bridge.proposed").first()).toBeAttached();

  await page.getByLabel("Предлагаемые связи").uncheck();
  await expect(canvas(page).locator("g.bridge.proposed")).toHaveCount(0);
  await expect(canvas(page).locator("g.bridge.confirmed").first()).toBeAttached();
});

test("lines start at the source node and end at the target node", async ({ page }) => {
  await page.goto(ECOSYSTEM);
  await page.getByLabel("Все связи").check();
  await expect(canvas(page).locator("g.bridge.proposed").first()).toBeAttached();

  // Every endpoint dot must sit on the edge of a programme card, not float in the gap.
  const misplaced = await canvas(page).locator(".eco-band").evaluateAll((bands) =>
    bands.flatMap((band) => {
      const grid = band.querySelector(".eco-band-grid")!.getBoundingClientRect();
      const cards = [...band.querySelectorAll(".eco-node")].map((n) => n.getBoundingClientRect());
      return [...band.querySelectorAll("g.bridge circle")].flatMap((dot) => {
        const x = grid.left + Number(dot.getAttribute("cx"));
        const y = grid.top + Number(dot.getAttribute("cy"));
        const onCard = cards.some((c) => Math.abs(x - c.left) < 2 || Math.abs(x - c.right) < 2 ? y >= c.top && y <= c.bottom : false);
        return onCard ? [] : [`${band.getAttribute("aria-label")}: ${Math.round(x)},${Math.round(y)}`];
      });
    })
  );
  expect(misplaced).toEqual([]);
});

test("domain, year and search filters narrow the canvas and can be reset", async ({ page }) => {
  await page.goto(ECOSYSTEM);
  const bands = canvas(page).locator(".eco-band");
  const allBands = await bands.count();

  await page.getByLabel("Направление кибербезопасности").selectOption("lane-soc");
  await expect(bands).toHaveCount(1);
  await expect(bands.first().getByRole("heading", { level: 2 })).toHaveText("SOC, мониторинг и расследование");

  await page.getByLabel("Поиск по экосистеме").fill("нет такой программы");
  await expect(page.getByText("По этим условиям программ нет")).toBeVisible();

  await page.getByRole("button", { name: "Сбросить" }).click();
  await expect(bands).toHaveCount(allBands);
});

test("a relationship added in «Управление» appears in «Экосистема»", async ({ page }) => {
  const fixture = await readFixture();
  const program = fixture.products.find((p) => p.id === "prod-hardening")!;
  const course = fixture.products.find((p) => p.id === "prod-ngfw-course")!;
  expect(
    fixture.ecosystemLinks!.some((l) => l.sourceId === program.id && l.targetId === course.id)
  ).toBe(false);

  await page.goto("/editor");
  await openDomain(page, "Профессиональные программы");
  await page.getByRole("button", { name: `Изменить: ${program.title}` }).click();
  const dialog = programDialog(page);
  await dialog.locator("summary", { hasText: "Связи в экосистеме" }).click();
  await dialog.getByLabel("Смысл связи").selectOption("product");
  await dialog.getByLabel("Связанная программа").selectOption(course.id);
  await dialog.getByLabel("Состав подтверждён").check();
  await dialog.getByRole("button", { name: "Добавить связь" }).click();
  await expect(dialog.locator(".edit-link", { hasText: course.title })).toBeVisible();
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole("link", { name: "Экосистема" }).click();
  await canvas(page).locator(".eco-node", { hasText: program.title }).first().click();
  const panel = await openInspector(page);
  await expect(panel.locator(".inspector-body li", { hasText: course.title })).toContainText("подтверждено");
});
