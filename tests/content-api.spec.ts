/**
 * PUT /api/maps/[mapId]/content — the only write endpoint left in the app.
 * Server-side validation must hold even if the UI is bypassed.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

import type { EcosystemLink, Product } from "@/lib/map/types";

import { MAP_ID, readDraft, readFixture, readRevision, resetData } from "./helpers";

const URL = `/api/maps/${MAP_ID}/content`;

test.beforeEach(async () => {
  await resetData();
});

async function put(request: APIRequestContext, products: Product[], links?: EcosystemLink[], rev?: number) {
  return request.put(URL, { data: { products, links, revision: rev ?? (await readRevision()) } });
}

test("a valid save bumps the revision and keeps the legacy graph empty", async ({ request }) => {
  const draft = await readFixture();
  const before = await readRevision();
  const response = await put(request, draft.products, draft.ecosystemLinks);
  expect(response.status()).toBe(200);
  expect((await response.json()).revision).toBe(before + 1);
  expect((await readDraft()).edges).toEqual([]);
});

test("a stale revision is rejected with 409 and nothing is written", async ({ request }) => {
  const draft = await readFixture();
  const stale = (await readRevision()) - 1;
  const changed = draft.products.map((p, i) => (i === 0 ? { ...p, title: "stale write" } : p));
  const response = await put(request, changed, draft.ecosystemLinks, stale);
  expect(response.status()).toBe(409);
  expect((await readDraft()).products[0].title).toBe(draft.products[0].title);
});

test("rejects invalid programmes", async ({ request }) => {
  const draft = await readFixture();
  const [first, second] = draft.products;
  const cases: Array<[string, Product[]]> = [
    ["year below 2000", [{ ...first, implementationYear: 1999 }, ...draft.products.slice(1)]],
    ["fractional year", [{ ...first, implementationYear: 2026.5 }, ...draft.products.slice(1)]],
    ["empty title", [{ ...first, title: "   " }, ...draft.products.slice(1)]],
    ["duplicate id", [first, { ...second, id: first.id }, ...draft.products.slice(2)]],
    ["unknown format", [{ ...first, productType: "junction" }, ...draft.products.slice(1)]],
    ["unknown security domain", [{ ...first, securityDomainIds: ["lane-mars"] }, ...draft.products.slice(1)]]
  ];
  for (const [name, products] of cases) {
    const response = await put(request, products, draft.ecosystemLinks);
    expect(response.status(), name).toBe(400);
  }
});

test("rejects relationships that do not match programme formats", async ({ request }) => {
  const draft = await readFixture();
  const link = (sourceId: string, targetId: string, kind: EcosystemLink["kind"]): EcosystemLink => ({
    id: `e2e-${sourceId}-${targetId}-${kind}`, sourceId, targetId, kind, status: "proposed", note: ""
  });
  const existing = draft.ecosystemLinks!;
  const cases: Array<[string, EcosystemLink[]]> = [
    ["module → BASE as «product»", [...existing, link("prod-siem-module", "prod-siem-course", "product")]],
    ["practicum → practicum as «practice»", [...existing, link("prod-l1-practicum", "prod-arch-practicum", "practice")]],
    ["self link", [...existing, link("prod-l1-practicum", "prod-l1-practicum", "product")]],
    ["duplicate pair", [...existing, { ...existing[0], id: "e2e-duplicate" }]],
    ["intensive with two source modules", [...existing, link("prod-nta-module", "intensive-siem", "intensive")]]
  ];
  for (const [name, links] of cases) {
    const response = await put(request, draft.products, links);
    expect(response.status(), name).toBe(400);
  }
});

test("removing a programme also drops its relationships", async ({ request }) => {
  const draft = await readFixture();
  const removed = "prod-traffic-practicum";
  expect(draft.ecosystemLinks!.some((l) => l.sourceId === removed || l.targetId === removed)).toBe(true);

  const response = await request.put(URL, {
    data: { products: draft.products.filter((p) => p.id !== removed), revision: await readRevision() }
  });
  expect(response.status()).toBe(200);
  const saved = await readDraft();
  expect(saved.ecosystemLinks!.some((l) => l.sourceId === removed || l.targetId === removed)).toBe(false);
  expect(saved.instances.some((i) => i.productId === removed)).toBe(false);
});
