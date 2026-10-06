import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root=process.cwd();
const store=JSON.parse(await readFile(path.join(root,"data","store.json"),"utf8"));
const mapId=store.maps?.[0]?.id;
const snapshot=mapId?store.drafts?.[mapId]:undefined;

if(!mapId||!snapshot)throw new Error("Current catalog snapshot was not found in data/store.json");

const published={mapId,revision:store.draftRevisions?.[mapId]??0,snapshot};
await writeFile(path.join(root,"data","published-catalog.json"),`${JSON.stringify(published,null,2)}\n`,"utf8");
console.log(`Published snapshot synced: ${snapshot.products.length} products, ${snapshot.ecosystemLinks?.length??0} links, revision ${published.revision}.`);
