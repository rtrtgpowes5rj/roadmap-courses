"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export function EducationLogo() {
  return <span className="brand-name"><strong>Roadmap</strong><span>Courses</span></span>;
}

export function AppHeader({mapId,mode,notice,children}:{mapId:string;mode:"scheme"|"editor"|"ecosystem";notice?:string;children?:ReactNode}) {
  const [dark,setDark]=useState(false);
  useEffect(()=>{
    const sync=()=>setDark(document.documentElement.dataset.theme==="dark");
    sync();
    const media=window.matchMedia("(prefers-color-scheme: dark)");
    const update=()=>{
      let stored:string|null=null; try{stored=localStorage.getItem("education-theme");}catch{}
      document.documentElement.dataset.theme=stored==="light"||stored==="dark"?stored:media.matches?"dark":"light";sync();
    };
    window.addEventListener("storage",update);media.addEventListener("change",update);
    return()=>{window.removeEventListener("storage",update);media.removeEventListener("change",update);};
  },[]);
  return <header className="app-bar">
    <Link className="brand" href={`/view/${mapId}`} aria-label="Roadmap Courses — схема"><EducationLogo /></Link>
    <nav aria-label="Разделы"><Link href={`/view/${mapId}`} className={mode==="scheme"?"current":""} aria-current={mode==="scheme"?"page":undefined}>Схема</Link><Link href={{pathname:`/ecosystem/${mapId}`}} className={mode==="ecosystem"?"current":""} aria-current={mode==="ecosystem"?"page":undefined}>Экосистема</Link><Link href="/editor" className={`management-link${mode==="editor"?" current":""}`} aria-current={mode==="editor"?"page":undefined}>Управление</Link></nav>
    <span className="save-note" role="status">{notice}</span>
    <button className="theme-button" type="button" aria-label={dark?"Включить светлую тему":"Включить тёмную тему"} title={dark?"Светлая тема":"Тёмная тема"} onClick={()=>{
      const next=dark?"light":"dark";document.documentElement.dataset.theme=next;setDark(!dark);try{localStorage.setItem("education-theme",next);}catch{}
    }}>{dark?<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>:<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14A8.5 8.5 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z"/></svg>}</button>
    {children}
  </header>;
}
