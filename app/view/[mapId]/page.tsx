import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { CatalogWorkspace } from "@/components/map/catalog-workspace";
import { getCatalog } from "@/lib/server/store";
import { getPublishedCatalog,getPublishedMapId } from "@/lib/server/published-store";

export const dynamic = "force-dynamic";

export default async function ViewMapPage({ params }: { params: { mapId: string } }) {
  if(process.env.GITHUB_PAGES!=="true")noStore();
  const catalog = process.env.GITHUB_PAGES==="true"?getPublishedCatalog(params.mapId):await getCatalog(params.mapId);
  if (!catalog) {
    notFound();
  }

  const snapshot = { ...catalog.snapshot, products: catalog.snapshot.products.filter(p => p.publicVisible &&
    (!catalog.snapshot.instances.some(i => i.productId === p.id) || catalog.snapshot.instances.some(i => i.productId === p.id && i.isVisible))) };
  return <CatalogWorkspace mapId={params.mapId} initialSnapshot={snapshot} />;
}
