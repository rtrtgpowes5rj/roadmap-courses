import type { Product, MapSnapshot, EcosystemLink } from "@/lib/map/types";

export function programCount(count:number) {
  const n=count%100,last=n%10;
  return `${count} ${n>=11&&n<=14?"программ":last===1?"программа":last>=2&&last<=4?"программы":"программ"}`;
}

export const SECURITY_DOMAINS = [
  { id: "lane-basics", title: "Основы кибербезопасности", team: "Вход в профессию" },
  { id: "lane-redteam", title: "Red Team и offensive security", team: "Red Team" },
  { id: "lane-soc", title: "SOC, мониторинг и расследование", team: "Blue Team" },
  { id: "lane-network", title: "Сетевая безопасность и архитектура", team: "Blue Team" },
  { id: "lane-vm", title: "Управление уязвимостями", team: "Защита инфраструктуры" },
  { id: "lane-ot", title: "OT / АСУ ТП", team: "Промышленная безопасность" },
  { id: "lane-appsec", title: "AppSec, DevSecOps и безопасность AI", team: "Green Team" },
  { id: "lane-leadership", title: "Управление ИБ и построение функции", team: "Руководители" },
  { id: "unassigned", title: "Без направления", team: "Требует распределения" }
];

export const LINK_KINDS: Record<EcosystemLink["kind"], { title: string; short: string; description: string }> = {
  practice: { title: "Кейсы тренажёра в программе", short: "Практика", description: "Выбранные или адаптированные кейсы на инфраструктуре PT EdTechLab. Состав зависит от программы." },
  intensive: { title: "Модуль в формате интенсива", short: "Интенсив", description: "Один модуль и общее название: самостоятельно в тренажёре или в фиксированные даты с куратором." },
  product: { title: "Продолжение в продуктовом курсе", short: "Курс BASE", description: "После развития компетенции — результативное применение конкретного продукта Positive Technologies." }
};

export function securityDomainsFor(product: Product, snapshot?: MapSnapshot): string[] {
  if (product.securityDomainIds) return product.securityDomainIds.length ? product.securityDomainIds : ["unassigned"];
  const tags = product.domainTags || [];
  const ids = new Set<string>();
  const tagMap: Record<string,string> = { "Основы":"lane-basics", "Red Team":"lane-redteam", "Offensive Security":"lane-redteam", SOC:"lane-soc", "Сетевая защита":"lane-network", VM:"lane-vm", OT:"lane-ot", AppSec:"lane-appsec", "Руководители":"lane-leadership" };
  tags.forEach(t => { if(tagMap[t]) ids.add(tagMap[t]); });
  snapshot?.instances.filter(i => i.productId === product.id).forEach(i => { if (SECURITY_DOMAINS.some(d => d.id === i.laneId)) ids.add(i.laneId); });
  const newer: Record<string,string[]> = {
    // AI sprints live in «AppSec, DevSecOps и безопасность AI»; the owner did not place them in SOC.
    "sprint-agent-security":["lane-appsec"], "sprint-ai-secops":["lane-appsec"], "sprint-llm-security":["lane-appsec"],
    "sprint-ai-cybersecurity":["lane-appsec"], "intensive-basics":["lane-basics"],
    "intensive-ethical-hacking":["lane-redteam"], "intensive-saas":["lane-appsec"],
    "intensive-nta":["lane-soc","lane-network"], "intensive-waf":["lane-soc","lane-network","lane-appsec"],
    "intensive-siem":["lane-soc","lane-network"]
  };
  newer[product.id]?.forEach(id=>ids.add(id));
  return ids.size ? [...ids] : ["unassigned"];
}

export function validLink(link: EcosystemLink, products: Product[]) {
  const source = products.find(p=>p.id===link.sourceId), target = products.find(p=>p.id===link.targetId);
  if (!source || !target || source.id === target.id) return false;
  if (link.kind === "intensive") return source.productType === "module" && target.productType === "intensive";
  if (link.kind === "practice") return source.productType === "module" && target.productType !== "module" && target.productType !== "junction";
  return source.productType !== "module" && source.productType !== "product_course" && target.productType === "product_course";
}
