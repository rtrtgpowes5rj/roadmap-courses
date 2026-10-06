import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCatalog } from "@/lib/server/store";
import { getPublishedCatalog,getPublishedMapId } from "@/lib/server/published-store";
import { EcosystemWorkspace } from "@/components/map/ecosystem-workspace";

export const dynamic = "force-dynamic";
export default async function EcosystemPage({params}:{params:{mapId:string}}) {
  if(process.env.GITHUB_PAGES!=="true")noStore();
  const catalog=process.env.GITHUB_PAGES==="true"?getPublishedCatalog(params.mapId):await getCatalog(params.mapId);
  if(!catalog)notFound();
  const snapshot={...catalog.snapshot,products:catalog.snapshot.products.filter(p=>p.publicVisible&&p.productType!=="junction"&&
    (!catalog.snapshot.instances.some(i=>i.productId===p.id)||catalog.snapshot.instances.some(i=>i.productId===p.id&&i.isVisible)))};
  const ids=new Set(snapshot.products.map(p=>p.id));
  snapshot.ecosystemLinks=snapshot.ecosystemLinks?.filter(l=>ids.has(l.sourceId)&&ids.has(l.targetId));
  return <EcosystemWorkspace snapshot={snapshot}/>;
}
