import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { CatalogWorkspace } from "@/components/map/catalog-workspace";
import { getDefaultMapId } from "@/lib/server/store";
import { getPublishedCatalog,getPublishedMapId } from "@/lib/server/published-store";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  if(process.env.GITHUB_PAGES==="true"){
    const mapId=getPublishedMapId(),catalog=getPublishedCatalog(mapId)!;
    const snapshot={...catalog.snapshot,products:catalog.snapshot.products.filter(p=>p.publicVisible&&
      (!catalog.snapshot.instances.some(i=>i.productId===p.id)||catalog.snapshot.instances.some(i=>i.productId===p.id&&i.isVisible)))};
    return <CatalogWorkspace mapId={mapId} initialSnapshot={snapshot}/>;
  }
  noStore();
  redirect(`/view/${await getDefaultMapId()}`);
}
