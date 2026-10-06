import { mkdir, readFile, writeFile, rename, copyFile } from "fs/promises";
import path from "path";

import { MAP_ID } from "@/lib/map/constants";
import { deepClone } from "@/lib/map/utils";
import type { AppStore, MapSnapshot } from "@/lib/map/types";
import { createSeedStore } from "@/lib/server/seed";
import { migrateCatalog } from "@/lib/server/catalog-migration";
import { migrateEcosystem } from "@/lib/server/ecosystem-migration";

const DATA_DIR = process.env.CATALOG_DATA_DIR || path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seed = createSeedStore();
    await writeFile(STORE_FILE, JSON.stringify(seed, null, 2), "utf-8");
  }
}

async function writeStore(store: AppStore) {
  const temporary = `${STORE_FILE}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(store, null, 2), "utf-8");
  await rename(temporary, STORE_FILE);
}

async function readStore(): Promise<AppStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf-8");
  const parsed = JSON.parse(raw) as AppStore;

  const catalogChanged = migrateCatalog(parsed);
  const ecosystemChanged = migrateEcosystem(parsed);
  if (catalogChanged || ecosystemChanged) {
    await copyFile(STORE_FILE, path.join(DATA_DIR, `before-catalog-${Date.now()}.json`));
    await writeStore(parsed);
  }

  return parsed;
}

export async function listMaps() {
  const store = await readStore();
  return store.maps;
}

export async function getDefaultMapId() {
  const store = await readStore();
  return store.maps[0]?.id ?? MAP_ID;
}

export async function getCatalog(mapId: string) {
  const store = await readStore();
  const snapshot = store.drafts[mapId];
  return snapshot ? { snapshot: deepClone(snapshot), revision: store.draftRevisions?.[mapId] ?? 0 } : undefined;
}

// Serialize revision checks and writes within this local server.
let saveQueue: Promise<unknown> = Promise.resolve();
export function saveCatalog(mapId: string, snapshot: MapSnapshot, expectedRevision: number) {
  const operation = saveQueue.then(() => saveDraftSnapshot(mapId, snapshot, expectedRevision));
  saveQueue = operation.catch(() => undefined);
  return operation;
}

export class DraftConflictError extends Error {
  serverRevision: number;
  constructor(serverRevision: number) {
    super("Draft revision conflict");
    this.name = "DraftConflictError";
    this.serverRevision = serverRevision;
  }
}

async function saveDraftSnapshot(
  mapId: string,
  snapshot: MapSnapshot,
  expectedRevision?: number
) {
  const store = await readStore();
  const currentRevision = store.draftRevisions?.[mapId] ?? 0;

  if (typeof expectedRevision === "number" && expectedRevision !== currentRevision) {
    throw new DraftConflictError(currentRevision);
  }

  store.drafts[mapId] = deepClone(snapshot);
  if (!store.draftRevisions) {
    store.draftRevisions = {};
  }
  store.draftRevisions[mapId] = currentRevision + 1;
  await writeStore(store);
  return {
    snapshot: deepClone(store.drafts[mapId]),
    revision: store.draftRevisions[mapId]
  };
}
