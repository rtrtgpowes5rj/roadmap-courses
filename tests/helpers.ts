import { copyFile, readFile } from "fs/promises";
import path from "path";

import { expect, type Page } from "@playwright/test";

import type { AppStore, MapSnapshot, Product } from "@/lib/map/types";

export const MAP_ID = "edtechlab-main-map";
const ROOT = path.join(__dirname, "..");
const FIXTURE = path.join(ROOT, "tests", "fixtures", "store.json");
const DATA_FILE = path.join(ROOT, ".e2e-data", "store.json");

/** Restore the e2e data directory to the fixture. The server reads the file on every request. */
export async function resetData() {
  await copyFile(FIXTURE, DATA_FILE);
}

export async function readDraft(): Promise<MapSnapshot> {
  const store = JSON.parse(await readFile(DATA_FILE, "utf8")) as AppStore;
  return store.drafts[MAP_ID];
}

/** The save revision is not exposed over HTTP; read it from the store the server uses. */
export async function readRevision(): Promise<number> {
  const store = JSON.parse(await readFile(DATA_FILE, "utf8")) as AppStore;
  return store.draftRevisions?.[MAP_ID] ?? 0;
}

export async function readFixture(): Promise<MapSnapshot> {
  const store = JSON.parse(await readFile(FIXTURE, "utf8")) as AppStore;
  return store.drafts[MAP_ID];
}

/** Mirrors catalogType() — management courses are listed with practicums. */
export function catalogGroup(product: Product) {
  return product.productType === "management_course" ? "practicum" : product.productType;
}

export function countByGroup(products: Product[], group: string) {
  return products.filter((product) => catalogGroup(product) === group).length;
}

export function domainTab(page: Page, title: string) {
  return page.getByRole("tab", { name: new RegExp(title) });
}

export async function openDomain(page: Page, title: string) {
  await domainTab(page, title).click();
  await expect(domainTab(page, title)).toHaveAttribute("aria-selected", "true");
}

export function programGroup(page: Page, title: string) {
  return page.getByRole("region", { name: title });
}

/** The catalog dialog is a native <dialog>; it is the only open one at a time. */
export function programDialog(page: Page) {
  return page.locator("dialog.program-dialog[open]");
}

export function uniqueTitle(label: string) {
  return `E2E ${label} ${Date.now()}`;
}
