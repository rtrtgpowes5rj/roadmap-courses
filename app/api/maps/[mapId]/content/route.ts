import { NextRequest, NextResponse } from "next/server";
import { assertEditorRequest } from "@/lib/server/auth";
import { DraftConflictError, getCatalog, saveCatalog } from "@/lib/server/store";
import { CATALOG_TYPES, CENTER_TITLE } from "@/lib/map/catalog";
import type { MapSnapshot } from "@/lib/map/types";
import type { EcosystemLink } from "@/lib/map/types";
import { SECURITY_DOMAINS, validLink } from "@/lib/map/ecosystem";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: { mapId: string } }) {
  if (!assertEditorRequest(request)) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Некорректные данные" }, { status: 400 }); }
  const products = body?.products;
  if (!Number.isInteger(body?.revision) || !Array.isArray(products) || products.length > 1000 ||
    products.some(p => !p || typeof p.id !== "string" || !p.id || typeof p.title !== "string" ||
      !p.title.trim() || p.title.length > 300 || typeof p.description !== "string" || p.description.length > 10000 ||
      ![...CATALOG_TYPES.map(t => t.id), "management_course"].includes(p.productType) ||
      (p.securityDomainIds != null && (!Array.isArray(p.securityDomainIds) || p.securityDomainIds.some((id:unknown)=>!SECURITY_DOMAINS.some(d=>d.id===id)))) ||
      (p.implementationYear != null && (!Number.isInteger(p.implementationYear) || p.implementationYear < 2000 || p.implementationYear > 2100))) ||
    new Set(products.map(p => p.id)).size !== products.length) {
    return NextResponse.json({ error: "Проверьте название, формат и год реализации (2000–2100)." }, { status: 400 });
  }
  const current = await getCatalog(params.mapId);
  if (!current) return NextResponse.json({ error: "Схема не найдена" }, { status: 404 });
  const ids = new Set(products.map(p => p.id));
  const links: EcosystemLink[] = body.links ?? (current.snapshot.ecosystemLinks??[]).filter(l=>ids.has(l.sourceId)&&ids.has(l.targetId));
  if (!Array.isArray(links) || links.length>2000 || links.some(l=>!l || typeof l.id!=="string" || !l.id ||
    !["practice","intensive","product"].includes(l.kind) || !["confirmed","proposed"].includes(l.status) ||
    typeof l.note!=="string" || l.note.length>2000 || !validLink(l,products)) || new Set(links.map(l=>l.id)).size!==links.length ||
    new Set(links.map(l=>`${l.sourceId}:${l.targetId}:${l.kind}`)).size!==links.length) {
    return NextResponse.json({error:"Проверьте связи: они должны соответствовать форматам программ и не повторяться."},{status:400});
  }
  const intensives=links.filter(l=>l.kind==="intensive");
  if(new Set(intensives.map(l=>l.targetId)).size!==intensives.length) return NextResponse.json({error:"Для интенсива выберите один модуль-источник."},{status:400});
  for(const link of intensives) {
    const source=products.find(p=>p.id===link.sourceId)!;
    const target=products.find(p=>p.id===link.targetId)!;
    const sourceChanged=source.title!==current.snapshot.products.find(p=>p.id===source.id)?.title;
    const targetChanged=target.title!==current.snapshot.products.find(p=>p.id===target.id)?.title;
    if(sourceChanged&&targetChanged&&source.title!==target.title) return NextResponse.json({error:"Модуль и его интенсив должны иметь одинаковое название."},{status:400});
    const title=sourceChanged?source.title:target.title;
    source.title=title;source.shortTitle=title;target.title=title;target.shortTitle=title;
  }
  const snapshot: MapSnapshot = {
    ...current.snapshot,
    map: { ...current.snapshot.map, name: CENTER_TITLE },
    products,
    instances: current.snapshot.instances.filter(i => ids.has(i.productId)),
    edges: [],
    ecosystemLinks: links
  };
  try {
    return NextResponse.json(await saveCatalog(params.mapId, snapshot, body.revision));
  } catch (error) {
    if (error instanceof DraftConflictError) {
      return NextResponse.json({ error: "Схема уже изменена в другой вкладке. Обновите страницу перед сохранением." }, { status: 409 });
    }
    return NextResponse.json({ error: "Не удалось сохранить изменения. Повторите попытку." }, { status: 500 });
  }
}
