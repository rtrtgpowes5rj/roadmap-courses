"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATALOG_TYPES, CENTER_TITLE, catalogType, emptyProduct, type CatalogType } from "@/lib/map/catalog";
import type { MapSnapshot, Product, EcosystemLink } from "@/lib/map/types";
import { AppHeader, EducationLogo } from "@/components/map/app-header";
import { SECURITY_DOMAINS, securityDomainsFor } from "@/lib/map/ecosystem";
import { RelationshipFields } from "@/components/map/relationship-fields";

type Domain = "professional" | "base" | "trainer";
const domains: Array<{ id: Domain; title: string; short: string; subtitle: string; types: CatalogType[] }> = [
  { id: "professional", title: "Профессиональные программы", short: "Программы", subtitle: "Практикумы · Спринты · Интенсивы", types: ["practicum", "sprint", "intensive"] },
  { id: "base", title: "Курсы по эксплуатации продуктов", short: "Курсы BASE", subtitle: "BASE", types: ["product_course"] },
  { id: "trainer", title: "Тренажёр", short: "Тренажёр", subtitle: "PT EdTechLab", types: ["module"] }
];

export function CatalogWorkspace({ mapId, initialSnapshot, initialRevision = 0, editable = false, requiresLogin = false, headerMode, publicReadOnly = false }: {
  mapId: string; initialSnapshot?: MapSnapshot; initialRevision?: number; editable?: boolean; requiresLogin?: boolean; headerMode?: "scheme"|"editor"; publicReadOnly?: boolean;
}) {
  const router=useRouter();
  const [products, setProducts] = useState(initialSnapshot?.products.filter(p => p.productType !== "junction") ?? []);
  const [revision, setRevision] = useState(initialRevision);
  const [links,setLinks]=useState<EcosystemLink[]>(initialSnapshot?.ecosystemLinks??[]);
  const [editedLinks,setEditedLinks]=useState<EcosystemLink[]>([]);
  const [domain, setDomain] = useState<Domain>("professional");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [key, setKey] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);

  useEffect(() => {
    if (!selected || !editable) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [selected, editable]);

  const matches = (p: Product) => (!query || p.title.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"))) &&
    (!year || (year === "none" ? !p.implementationYear : String(p.implementationYear) === year));
  const filtered = products.filter(matches);
  const active = domains.find(d => d.id === domain)!;
  const years = [...new Set([2026, 2027, ...products.flatMap(p => p.implementationYear ? [p.implementationYear] : [])])].sort();

  function open(product: Product, create = false) {
    opener.current = document.activeElement as HTMLElement;
    setSelected({ ...product }); setIsNew(create); setError(""); setConfirmDelete(false);
    setEditedLinks(links.map(l=>({...l})));
  }
  function close() {
    if (saving) return;
    setSelected(null); setError(""); setConfirmDelete(false);
    opener.current?.focus();
  }
  async function persist(remove = false) {
    if (!selected || saving) return;
    setSaving(true); setError(""); setNotice("");
    const updated = { ...selected, title: selected.title.trim(), shortTitle: selected.title.trim() };
    const next = remove ? products.filter(p => p.id !== updated.id) : isNew ? [...products, updated] : products.map(p => p.id === updated.id ? updated : p);
    try {
      const response = await fetch(`/api/maps/${mapId}/content`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: next, revision, links: editedLinks.filter(l=>next.some(p=>p.id===l.sourceId)&&next.some(p=>p.id===l.targetId)) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить изменения.");
      setProducts(result.snapshot.products); setRevision(result.revision);
      setLinks(result.snapshot.ecosystemLinks??[]);
      if (!remove) {
        setDomain(domains.find(d => d.types.includes(catalogType(updated.productType)))!.id);
        if (!matches(updated)) { setQuery(""); setYear(""); }
      }
      setSelected(null); setNotice(remove ? "Программа удалена" : "Сохранено");
      router.refresh();
      opener.current?.focus();
    } catch (err) {
      // fetch() rejects with a TypeError ("Failed to fetch") when the network is down,
      // and response.json() throws a SyntaxError on a non-JSON error page.
      setError(err instanceof TypeError ? "Нет связи с сервером. Повторите попытку."
        : err instanceof SyntaxError ? "Не удалось сохранить изменения. Повторите попытку."
        : err instanceof Error ? err.message : "Нет связи с сервером. Повторите попытку.");
    }
    finally { setSaving(false); }
  }

  if (requiresLogin) return <main className="login-shell"><form className="login-form" onSubmit={async event => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      if (!response.ok) throw new Error("Не удалось войти. Проверьте пароль.");
      window.location.reload();
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось войти."); setSaving(false); }
  }}><EducationLogo /><h1>Управление программами</h1>
    <label>Пароль<input autoFocus type="password" autoComplete="current-password" value={key} onChange={e => setKey(e.target.value)} required /></label>
    {error && <p role="alert" className="error">{error}</p>}<button className="button primary" disabled={saving}>{saving ? "Вход…" : "Войти"}</button>
    <Link className="text-link" href={`/view/${mapId}`}>Открыть схему</Link></form></main>;

  function programList(type: CatalogType) {
    const items = filtered.filter(p => catalogType(p.productType) === type).sort((a, b) => (a.implementationYear ?? 9999) - (b.implementationYear ?? 9999));
    return <ul className="program-list">{items.map(product => <li key={product.id}>
      <button className="program" onClick={() => open(product)} aria-label={`${editable ? "Изменить" : "Открыть"}: ${product.title}`}>
        <span className="program-title">{product.title}</span>
        <span className={`program-year${product.implementationYear ? "" : " unset"}`} title="Год реализации">{product.implementationYear ?? "—"}</span>
      </button>
    </li>)}{!items.length && <li className="empty-group">{query || year ? "Нет программ по фильтру" : "Пока нет программ"}</li>}</ul>;
  }

  return <main className="catalog-shell">
    <AppHeader mapId={mapId} mode={headerMode??(editable?"editor":"scheme")} notice={notice}>
      {editable && <button className="button primary add-program" onClick={() => open(emptyProduct(active.types[0]), true)}>+ Добавить программу</button>}
    </AppHeader>

    {publicReadOnly&&<p className="public-readonly">Публичная версия показывает актуальный состав программ. Редактирование доступно в локальной панели проекта.</p>}

    <section className="map-heading"><p>Образовательные направления</p><h1>{CENTER_TITLE}</h1><span className="heading-underline" aria-hidden="true" /></section>

    <div className="domain-map" role="tablist" aria-label="Домены центра">{domains.map((item, index) => <button
      key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={domain === item.id} aria-controls="domain-content" tabIndex={domain === item.id ? 0 : -1}
      className={`domain-node ${domain === item.id ? "active" : ""}`}
      onClick={() => setDomain(item.id)} onKeyDown={event => {
        const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (offset || event.key === "Home" || event.key === "End") {
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? domains.length - 1 : (index + offset + domains.length) % domains.length;
          setDomain(domains[next].id); document.getElementById(`tab-${domains[next].id}`)?.focus();
        }
      }}>
      <span className="domain-title">{item.title}</span><span className="domain-short">{item.short}</span><span className="domain-subtitle">{item.subtitle}</span>
      <span className="domain-count">{products.filter(p => item.types.includes(catalogType(p.productType))).length}</span>
    </button>)}</div>

    <section id="domain-content" role="tabpanel" aria-labelledby={`tab-${domain}`} className="domain-content">
      <div className="catalog-tools"><span className="section-caption">{active.id === "professional" ? "Форматы программ" : active.id === "base" ? "Курсы BASE" : "Модули тренажёра"}</span>
        <div className="filters"><input aria-label="Найти программу" type="search" placeholder="Найти программу" value={query} onChange={e => setQuery(e.target.value)} />
          <label className="year-filter"><span>Год реализации</span><select aria-label="Год реализации: фильтр" value={year} onChange={e => setYear(e.target.value)}><option value="">Все годы</option>{years.map(y => <option key={y} value={y}>{y}</option>)}<option value="none">Не указан</option></select></label>
          {(query || year) && <button className="clear-filter" onClick={() => { setQuery(""); setYear(""); }}>Сбросить</button>}
        </div>
      </div>
      <div className={`program-groups ${domain === "professional" ? "three-groups" : "single-group"}`}>{active.types.map(type => {
        const meta = CATALOG_TYPES.find(t => t.id === type)!;
        return <section className="program-group" key={type} aria-label={meta.title}>
          {domain === "professional" && <h2>{meta.title}<span>{filtered.filter(p => catalogType(p.productType) === type).length}</span></h2>}
          {programList(type)}
          {editable && <button className="add-to-group" onClick={() => open(emptyProduct(type), true)}>+ {meta.singular}</button>}
        </section>;
      })}</div>
      <footer className="map-footer"><span>{editable ? "Нажмите на программу, чтобы изменить её" : "Нажмите на программу, чтобы открыть описание"}</span><span>— год реализации не указан</span></footer>
    </section>

    <dialog ref={dialog} className="program-dialog" aria-labelledby="program-dialog-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {selected && <form onSubmit={event => { event.preventDefault(); void persist(); }}>
        <div className="dialog-heading"><span className="section-caption">{editable ? (isNew ? "Новая программа" : "Редактирование программы") : CATALOG_TYPES.find(t => t.id === catalogType(selected.productType))?.singular}</span><button className="close-button" type="button" onClick={close} disabled={saving} aria-label="Закрыть">×</button></div>
        <h2 id="program-dialog-title">{editable ? (isNew ? "Добавить программу" : "Программа") : selected.title}</h2>
        {editable ? <fieldset disabled={saving}>
          <label>Название<textarea autoFocus required maxLength={300} rows={3} value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })} /></label>
          <div className="form-row"><label>Формат<select value={catalogType(selected.productType)} onChange={e => setSelected({ ...selected, productType: e.target.value as CatalogType })}>
            <optgroup label="Профессиональные программы">{CATALOG_TYPES.slice(0, 3).map(t => <option key={t.id} value={t.id}>{t.singular}</option>)}</optgroup>
            <optgroup label="Другие домены">{CATALOG_TYPES.slice(3).map(t => <option key={t.id} value={t.id}>{t.singular}</option>)}</optgroup>
          </select></label><label>Год реализации<input type="number" inputMode="numeric" min="2000" max="2100" step="1" placeholder="Не указан" value={selected.implementationYear ?? ""} onChange={e => setSelected({ ...selected, implementationYear: e.target.value ? Number(e.target.value) : undefined })} /></label></div>
          <label>Описание <span className="optional">необязательно</span><textarea rows={4} maxLength={10000} value={selected.description} onChange={e => setSelected({ ...selected, description: e.target.value })} /></label>
          <details className="domain-fields"><summary>Направления кибербезопасности <span>{securityDomainsFor(selected).filter(id=>id!=="unassigned").length}</span></summary><div className="domain-checkboxes">{SECURITY_DOMAINS.filter(d=>d.id!=="unassigned").map(d=><label className="inline-check" key={d.id}><input type="checkbox" checked={securityDomainsFor(selected).includes(d.id)} onChange={e=>{
            const ids=securityDomainsFor(selected).filter(id=>id!=="unassigned");setSelected({...selected,securityDomainIds:e.target.checked?[...ids,d.id]:ids.filter(id=>id!==d.id)});
          }}/>{d.title}</label>)}</div></details>
          <RelationshipFields key={selected.id} product={selected} products={products} links={editedLinks} onChange={setEditedLinks}/>
        </fieldset> : <div className="program-details"><p className="detail-year">Год реализации: {selected.implementationYear ?? "не указан"}</p><p>{selected.description || selected.shortOutcome || "Описание пока не добавлено."}</p></div>}
        {error && <p className="error" role="alert">{error}</p>}
        {confirmDelete ? <div className="delete-confirm"><p>Удалить «{selected.title}» из схемы?</p><div className="dialog-actions"><button type="button" className="button danger" disabled={saving} onClick={() => void persist(true)}>{saving ? "Удаление…" : "Да, удалить"}</button><button type="button" className="button" disabled={saving} onClick={() => setConfirmDelete(false)}>Оставить</button></div></div> : <div className="dialog-actions">
          {editable && !isNew && <button type="button" className="text-danger" disabled={saving} onClick={() => setConfirmDelete(true)}>Удалить</button>}
          <span className="action-space" /><button type="button" className="button" onClick={close} disabled={saving}>{editable ? "Отмена" : "Закрыть описание"}</button>
          {editable && <button className="button primary" disabled={saving || !selected.title.trim()}>{saving ? "Сохранение…" : "Сохранить"}</button>}
        </div>}
      </form>}
    </dialog>
  </main>;
}
