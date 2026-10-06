"use client";
import { useState } from "react";
import type { Product, EcosystemLink } from "@/lib/map/types";
import { LINK_KINDS, validLink } from "@/lib/map/ecosystem";

export function RelationshipFields({product,products,links,onChange}:{product:Product;products:Product[];links:EcosystemLink[];onChange:(links:EcosystemLink[])=>void}) {
  const [target,setTarget]=useState("");
  const [kind,setKind]=useState<EcosystemLink["kind"]>("practice");
  const [confirmed,setConfirmed]=useState(false);
  const all=[...products.filter(p=>p.id!==product.id),product];
  function makeLink(id:string):EcosystemLink {
    const other=products.find(p=>p.id===id);
    const reverse=kind==="product"?product.productType==="product_course":other?.productType==="module";
    return {id:`eco-${crypto.randomUUID()}`,sourceId:reverse?id:product.id,targetId:reverse?product.id:id,kind,status:confirmed?"confirmed":"proposed",note:"Связь задана в управлении программами."};
  }
  const related=links.filter(l=>l.sourceId===product.id||l.targetId===product.id);
  const options=products.filter(p=>p.id!==product.id&&validLink(makeLink(p.id),all));
  return <details className="relationship-fields"><summary>Связи в экосистеме <span>{related.length}</span></summary>
    <p className="field-help">Подтверждайте состав практики, когда он согласован. Для связи «Модуль в формате интенсива» названия синхронизируются.</p>
    {related.map(link=>{
      const other=products.find(p=>p.id===(link.sourceId===product.id?link.targetId:link.sourceId));
      return <div className="edit-link" key={link.id}><p>{other?.title??"Программа удалена"}<small>{LINK_KINDS[link.kind].title}</small></p><label className="inline-check"><input type="checkbox" checked={link.status==="confirmed"} onChange={e=>onChange(links.map(l=>l.id===link.id?{...l,status:e.target.checked?"confirmed":"proposed"}:l))}/>Подтверждено</label><button type="button" className="remove-link" aria-label={`Убрать связь: ${other?.title}`} onClick={()=>onChange(links.filter(l=>l.id!==link.id))}>×</button></div>;
    })}
    <label>Смысл связи<select value={kind} onChange={e=>{setKind(e.target.value as EcosystemLink["kind"]);setTarget("");}}>{Object.entries(LINK_KINDS).map(([id,meta])=><option key={id} value={id}>{meta.title}</option>)}</select></label>
    <label>Связанная программа<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Выберите программу</option>{options.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select></label>
    <div className="link-add-row"><label className="inline-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Состав подтверждён</label><button type="button" className="button" disabled={!target} onClick={()=>{
      const link=makeLink(target);
      if(!links.some(l=>l.sourceId===link.sourceId&&l.targetId===link.targetId&&l.kind===link.kind))onChange([...links,link]);
      setTarget("");
    }}>Добавить связь</button></div>
  </details>;
}
