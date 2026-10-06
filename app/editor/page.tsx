import { CatalogWorkspace } from "@/components/map/catalog-workspace";
import { hasEditorSession, isEditorAuthEnabled } from "@/lib/server/auth";
import { getDefaultMapId, getCatalog } from "@/lib/server/store";
import { getPublishedCatalog,getPublishedMapId } from "@/lib/server/published-store";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export default async function EditorPage() {
  if(process.env.GITHUB_PAGES==="true"){
    const mapId=getPublishedMapId(),catalog=getPublishedCatalog(mapId)!;
    return <CatalogWorkspace mapId={mapId} initialSnapshot={catalog.snapshot} initialRevision={catalog.revision} headerMode="editor" publicReadOnly/>;
  }
  noStore();
  const mapId = await getDefaultMapId();
  const authEnabled = isEditorAuthEnabled();
  const authorized = hasEditorSession();

  const catalog = await getCatalog(mapId);
  if (!catalog) notFound();
  if (authEnabled && !authorized) return <CatalogWorkspace mapId={mapId} requiresLogin />;
  return <CatalogWorkspace mapId={mapId} initialSnapshot={catalog.snapshot} initialRevision={catalog.revision} editable />;
}
