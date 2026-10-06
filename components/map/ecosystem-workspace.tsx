"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/map/app-header";
import { SECURITY_DOMAINS,LINK_KINDS,securityDomainsFor,programCount } from "@/lib/map/ecosystem";
import { CATALOG_TYPES,catalogType } from "@/lib/map/catalog";
import type { Product,MapSnapshot,EcosystemLink } from "@/lib/map/types";

const domainOrder=["lane-soc","lane-network","lane-appsec","lane-vm","lane-redteam","lane-ot","lane-basics","lane-leadership","unassigned"];
const orderedDomains=domainOrder.map(id=>SECURITY_DOMAINS.find(d=>d.id===id)!);

function ecosystemViewLinks(snapshot:MapSnapshot) {
  const sourceLinks=snapshot.ecosystemLinks??[];
  const intensiveLinks=sourceLinks.filter(link=>link.kind==="intensive");
  const practiceLinks=sourceLinks.filter(link=>link.kind==="practice");
  const products=new Map(snapshot.products.map(product=>[product.id,product]));
  const bridges:EcosystemLink[]=[];
  for(const intensiveLink of intensiveLinks) {
    for(const practiceLink of practiceLinks.filter(link=>link.sourceId===intensiveLink.sourceId)) {
      const intensive=products.get(intensiveLink.targetId),program=products.get(practiceLink.targetId);
      if(intensive?.productType!=="intensive"||!program||!["practicum","sprint","management_course"].includes(program.productType))continue;
      bridges.push({
        id:`view-${intensive.id}-${program.id}`,
        sourceId:intensive.id,
        targetId:program.id,
        kind:"intensive",
        status:intensiveLink.status==="confirmed"&&practiceLink.status==="confirmed"?"confirmed":"proposed",
        note:`Интенсив и профессиональная программа используют общий модуль PT EdTechLab: ${products.get(intensiveLink.sourceId)?.title??"модуль не указан"}.`
      });
    }
  }
  const baseLinks=sourceLinks.filter(link=>{
    const source=products.get(link.sourceId),target=products.get(link.targetId);
    return link.kind==="product"&&!!source&&["practicum","sprint","management_course"].includes(source.productType)&&target?.productType==="product_course";
  });
  return [...bridges,...baseLinks];
}

function viewLinkLabel(link:EcosystemLink) {
  return link.kind==="intensive"?"Общий модуль PT EdTechLab":LINK_KINDS[link.kind].short;
}

function DomainBand({domain,products,links,selectedId,focusLinkIds,onSelect,showAll}:{domain:typeof SECURITY_DOMAINS[number];products:Product[];links:EcosystemLink[];selectedId:string;focusLinkIds:Set<string>;onSelect:(id:string)=>void;showAll:boolean}) {
  const grid=useRef<HTMLDivElement>(null);
  const nodes=useRef(new Map<string,HTMLButtonElement>());
  const [paths,setPaths]=useState<Array<{link:EcosystemLink;d:string;sx:number;sy:number;ex:number;ey:number}>>([]);
  const relevant=links.filter(l=>(showAll||focusLinkIds.has(l.id))&&products.some(p=>p.id===l.sourceId)&&products.some(p=>p.id===l.targetId));
  useEffect(()=>{
    const measure=()=>{
      if(!grid.current)return;
      const box=grid.current.getBoundingClientRect();
      setPaths(relevant.flatMap(link=>{
        const source=nodes.current.get(link.sourceId),target=nodes.current.get(link.targetId);
        if(!source||!target)return[];
        const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
        const sx=a.right-box.left,sy=a.top+a.height/2-box.top,ex=b.left-box.left,ey=b.top+b.height/2-box.top;
        const isBase=products.find(p=>p.id===link.targetId)?.productType==="product_course";
        const isModule=products.find(p=>p.id===link.sourceId)?.productType==="module";
        const d=isBase&&isModule?`M${sx},${sy} C${sx+22},${sy} ${sx+22},${sy} ${sx+22},${sy-14} L${sx+22},8 Q${sx+22},2 ${sx+30},2 H${ex-30} Q${ex-22},2 ${ex-22},10 V${ey-14} Q${ex-22},${ey} ${ex},${ey}`:`M${sx},${sy} C${sx+Math.max(20,(ex-sx)/2)},${sy} ${ex-Math.max(20,(ex-sx)/2)},${ey} ${ex},${ey}`;
        return[{link,d,sx,sy,ex,ey}];
      }));
    };
    const observer=new ResizeObserver(measure);if(grid.current)observer.observe(grid.current);
    const frame=requestAnimationFrame(measure);document.fonts.ready.then(measure);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);};
  // Recalculate when filters, selection or content changes; observe wrapping and fonts too.
  },[products,links,selectedId,focusLinkIds,showAll]);
  const connected=new Set(links.filter(l=>focusLinkIds.has(l.id)).flatMap(l=>[l.sourceId,l.targetId]));
  function node(product:Product) {
    return <button key={product.id} ref={el=>{if(el)nodes.current.set(product.id,el);else nodes.current.delete(product.id);}} data-program-id={product.id}
      className={`eco-node${selectedId===product.id?" selected":connected.has(product.id)?" connected":""}`} aria-pressed={selectedId===product.id}
      onClick={()=>onSelect(product.id)}><span>{product.title}</span><small>{product.implementationYear??"—"}</small></button>;
  }
  const intensives=products.filter(p=>p.productType==="intensive"),base=products.filter(p=>p.productType==="product_course");
  return <section className="eco-band" aria-label={domain.title}>
    <header className="eco-domain-heading"><h2>{domain.title}</h2><span>{domain.team}</span><small>{programCount(products.length)}</small></header>
    <div className="eco-band-grid" ref={grid}>
      <svg className="eco-bridges" aria-label={`Связи: ${domain.title}`} role="img">{paths.map(({link,d,sx,sy,ex,ey})=><g key={link.id} className={`bridge ${link.status} ${link.kind}`}><title>{LINK_KINDS[link.kind].title} · {link.status==="confirmed"?"Подтверждено":"Предложение"}</title><path d={d}/><circle cx={sx} cy={sy} r="2.5"/><circle cx={ex} cy={ey} r="2.5"/></g>)}</svg>
      <div className="eco-column eco-intensive"><h3 className="eco-column-label">Интенсивы</h3>{intensives.length?intensives.map(node):<p className="eco-empty">Интенсив пока не задан</p>}</div>
      <div className="eco-column eco-professional"><h3 className="eco-column-label">Профессиональные программы</h3>{CATALOG_TYPES.slice(0,2).map(type=>{
        const group=products.filter(p=>catalogType(p.productType)===type.id);
        return group.length?<section key={type.id} className="eco-format"><h3>{type.title}</h3>{group.map(node)}</section>:null;
      })}{!products.some(p=>["practicum","sprint"].includes(catalogType(p.productType)))&&<p className="eco-empty">Программа пока не задана</p>}</div>
      <div className="eco-column eco-base"><h3 className="eco-column-label">Курсы BASE</h3>{base.length?base.map(node):<p className="eco-empty">Продуктовый курс пока не задан</p>}</div>
    </div>
  </section>;
}

export function EcosystemWorkspace({snapshot}:{snapshot:MapSnapshot}) {
  const [domain,setDomain]=useState("all"),[year,setYear]=useState(""),[query,setQuery]=useState("");
  const [selectedId,setSelectedId]=useState(snapshot.products.some(p=>p.id==="prod-l1-practicum")?"prod-l1-practicum":"");
  const [showAll,setShowAll]=useState(false),[showProposed,setShowProposed]=useState(true),[copied,setCopied]=useState(false);
  const selected=snapshot.products.find(p=>p.id===selectedId);
  const displayProducts=snapshot.products.filter(p=>p.productType!=="module"&&p.productType!=="junction");
  const links=ecosystemViewLinks(snapshot).filter(l=>showProposed||l.status==="confirmed");
  const relationships=links.filter(l=>l.sourceId===selectedId||l.targetId===selectedId);
  const focusLinkIds=new Set(relationships.map(link=>link.id));
  const visible=displayProducts.filter(p=>(!query||p.title.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru")))&&(!year||(year==="none"?!p.implementationYear:String(p.implementationYear)===year)));
  const years=[...new Set(displayProducts.flatMap(p=>p.implementationYear?[p.implementationYear]:[]))].sort();
  const bands=orderedDomains.filter(d=>domain==="all"||domain===d.id).map(d=>({domain:d,products:visible.filter(p=>securityDomainsFor(p,snapshot).includes(d.id))})).filter(d=>d.products.length);
  const total=new Set(bands.flatMap(b=>b.products.map(p=>p.id))).size;
  function select(id:string){setSelectedId(id);setCopied(false);}

  return <main className="catalog-shell ecosystem-shell"><AppHeader mapId={snapshot.map.id} mode="ecosystem"/>
    <section className="ecosystem-heading"><div><p className="section-caption">Центр практической кибербезопасности</p><h1>Экосистема программ</h1><p>Интенсивы, профессиональные программы и курсы BASE — по направлениям кибербезопасности.</p></div><span className="ecosystem-count">{displayProducts.length}<small>программ в экосистеме</small></span></section>
    <details className="sales-model"><summary>Как предлагать форматы <span>Модель доступа и переходов</span></summary><div className="sales-content">
      <p className="proposal-label">Модель предложения · сроки и комплектация согласуются для запуска</p>
      <div className="sales-table-wrap"><table><thead><tr><th>Формат</th><th>Что покупает заказчик</th><th>Практика и сопровождение</th><th>Следующее предложение</th></tr></thead><tbody>
        <tr><th>Интенсивы</th><td>Отдельный модуль PT EdTechLab с доступом к среде на 3 месяца.</td><td>Фиксированные даты, группа, куратор и полное сопровождение. Кейсы выполняются на инфраструктуре тренажёра.</td><td>Перейти в связанный практикум или спринт для развития компетенции в более широком контексте.</td></tr>
        <tr><th>Практикумы и спринты</th><td>Профессиональная программа для специалистов ИБ и ИТ уровня junior+ / middle−.</td><td>Обучение и сопровождение; в состав могут входить выбранные модули или кейсы PT EdTechLab.</td><td>Углубить отдельный навык на интенсиве или освоить эксплуатацию продукта на курсе BASE.</td></tr>
        <tr><th>Курсы BASE</th><td>Курс по результативному использованию конкретного продукта Positive Technologies.</td><td>Для согласованных связок — ограниченный или адаптированный набор кейсов на инфраструктуре PT EdTechLab.</td><td>Полный модуль тренажёра: больше кейсов по теме и практика в собственном темпе.</td></tr>
        <tr><th>PT EdTechLab отдельно</th><td>Один или несколько модулей тренажёра на 3 / 6 / 12 месяцев; SaaS или on-prem.</td><td>Самостоятельный асинхронный путь, запуск стендов и проверка ответов в формате CTF.</td><td>Добавить модуль, продлить доступ или выбрать сопровождаемый интенсив.</td></tr>
      </tbody></table></div><p className="field-help">На полотне показаны три сопоставимых образовательных формата. Отдельная поставка PT EdTechLab остаётся самостоятельной моделью и поэтому не занимает отдельную колонку.</p>
    </div></details>

    <div className="ecosystem-toolbar"><div className="eco-filters"><label>Направление<select aria-label="Направление кибербезопасности" value={domain} onChange={e=>setDomain(e.target.value)}><option value="all">Все направления</option>{orderedDomains.filter(d=>snapshot.products.some(p=>securityDomainsFor(p,snapshot).includes(d.id))).map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></label><label>Год<select aria-label="Год реализации в экосистеме" value={year} onChange={e=>setYear(e.target.value)}><option value="">Все годы</option>{years.map(y=><option key={y} value={y}>{y}</option>)}<option value="none">Не указан</option></select></label><label className="eco-search">Поиск<input type="search" placeholder="Название программы" aria-label="Поиск по экосистеме" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
      <div className="eco-options"><label className="inline-check"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>Все связи</label><label className="inline-check"><input type="checkbox" checked={showProposed} onChange={e=>setShowProposed(e.target.checked)}/>Предлагаемые связи</label>{(domain!=="all"||year||query)&&<button className="clear-filter" onClick={()=>{setDomain("all");setYear("");setQuery("");}}>Сбросить</button>}</div>
    </div>

    {selected&&<details className="connection-inspector" aria-label="Связи выбранной программы"><summary className="inspector-title"><span className="section-caption">Выбрана программа</span><strong>{selected.title}</strong><span className="inspector-hint">Связи и предложение · {relationships.length}</span><button type="button" className="close-button" aria-label="Снять выбор программы" onClick={event=>{event.preventDefault();setSelectedId("");}}>×</button></summary>
      <div className="inspector-body">{relationships.length?<ul>{relationships.map(link=>{
        const other=snapshot.products.find(p=>p.id===(link.sourceId===selectedId?link.targetId:link.sourceId))!;
        return <li key={link.id} title={link.note}><span className={`status-line ${link.status}`} title={link.status==="confirmed"?"Подтверждено":"Предложение"}/><button onClick={()=>select(other.id)}>{other.title}</button><small>{viewLinkLabel(link)} · {link.status==="confirmed"?"подтверждено":"предложение"}</small></li>;
      })}</ul>:<p className="field-help">Связи пока не заданы. Их можно добавить в «Управлении».</p>}
      {selected.productType==="intensive"&&<p className="bridge-explanation">Интенсив — отдельный модуль PT EdTechLab в сопровождаемом формате. Доступ к учебной среде предоставляется на 3 месяца.</p>}
      {relationships.some(l=>l.kind==="intensive")&&<p className="bridge-explanation">Связь «Общий модуль PT EdTechLab» означает, что интенсив и профессиональная программа используют один и тот же модуль тренажёра.</p>}
      {relationships.some(l=>l.kind==="product")&&<p className="bridge-explanation">Связь «Курс BASE» показывает тематическое продолжение в курсе по эксплуатации продукта Positive Technologies.</p>}
      <div className="inspector-actions"><Link href="/editor" className="text-link">Изменить программы и связи</Link><button className="text-link" type="button" onClick={async()=>{
        const text=[selected.title,...relationships.map(l=>{const p=snapshot.products.find(p=>p.id===(l.sourceId===selectedId?l.targetId:l.sourceId));return `${viewLinkLabel(l)}: ${p?.title} (${l.status==="confirmed"?"подтверждено":"предложение; состав уточнить"}).`; }),selected.productType==="intensive"?"Формат: отдельный модуль PT EdTechLab, доступ к среде на 3 месяца, фиксированные даты и куратор.":"Отдельная поставка PT EdTechLab: один или несколько модулей на 3 / 6 / 12 месяцев, SaaS или on-prem."].join("\n");
        try{await navigator.clipboard.writeText(text);setCopied(true);}catch{setCopied(false);}
      }}>{copied?"Скопировано":"Скопировать связку"}</button></div></div>
    </details>}

    <div className="ecosystem-legend"><span><i className="status-line confirmed"/>Подтверждённая связь</span><span><i className="status-line proposed"/>Предложение: состав уточняется</span><small>{programCount(total)} по фильтру · нажмите на программу, чтобы увидеть её связи</small></div>
    <p className="eco-mobile-hint">Нажмите на программу: её связи появятся внизу экрана, а связанные программы подсветятся.</p>
    <div className="ecosystem-scroll" tabIndex={0} role="region" aria-label="Полотно экосистемы, три колонки"><div className="ecosystem-canvas">
      <div className="ecosystem-columns"><div><span className="section-caption">Модуль с сопровождением</span><h2>Интенсивы</h2><p>Отдельные модули PT EdTechLab<br/>Доступ 3 месяца · фиксированные даты · куратор</p></div><div><span className="section-caption">Развитие компетенций</span><h2>Профессиональные программы</h2><p>Практикумы · Спринты<br/>Специалисты ИБ и ИТ · junior+ / middle−</p></div><div><span className="section-caption">Результативное использование</span><h2>Курсы BASE</h2><p>Эксплуатация продуктов PT<br/>Практика на инфраструктуре PT EdTechLab</p></div></div>
      {bands.map(b=><DomainBand key={b.domain.id} {...b} links={links} selectedId={selectedId} focusLinkIds={focusLinkIds} onSelect={select} showAll={showAll}/>)}
      {!bands.length&&<p className="ecosystem-empty">По этим условиям программ нет. Измените фильтр или сбросьте его.</p>}
    </div></div>
    <footer className="map-footer"><span>Программа может относиться к нескольким направлениям. — год реализации не указан.</span><span>Связи и направления редактируются в «Управлении».</span></footer>
  </main>;
}
