import type { AppStore, Product } from "@/lib/map/types";
import { CENTER_TITLE } from "@/lib/map/catalog";

const additions: Array<[string, string, "sprint" | "intensive", number]> = [
  ["sprint-agent-security", "Безопасная разработка с AI-агентами и безопасность агентских решений", "sprint", 2026],
  ["prod-appsec-leaders", "Безопасность приложений для руководителей", "sprint", 2026],
  ["sprint-ai-secops", "AI технологии для Security Operations", "sprint", 2027],
  ["sprint-llm-security", "Безопасность LLM: атаки и защита", "sprint", 2027],
  ["sprint-ai-cybersecurity", "Применение LLM и AI в кибербезе", "sprint", 2027],
  ["intensive-basics", "Основы практической кибербезопасности", "intensive", 2026],
  ["intensive-ethical-hacking", "Этичный хакинг: реализация полного цикла атаки", "intensive", 2027],
  ["intensive-saas", "Применение SaaS: поиск и устранение VPN-уязвимостей", "intensive", 2027],
  ["intensive-nta", "Анализ сетевых атак с помощью NTA", "intensive", 2027],
  ["intensive-waf", "Анализ кибератак на веб-приложения с помощью WAF", "intensive", 2027],
  ["intensive-siem", "Анализ событий безопасности с помощью SIEM", "intensive", 2027]
];

/** One-time additive migration. Existing programmes and historical versions are preserved. */
export function migrateCatalog(store: AppStore): boolean {
  if ((store.catalogSchemaVersion ?? 0) >= 1) return false;
  for (const snapshot of Object.values(store.drafts)) {
    snapshot.map.name = CENTER_TITLE;
    snapshot.edges = [];
    const junctions = new Set(snapshot.products.filter(p => p.productType === "junction").map(p => p.id));
    snapshot.products = snapshot.products.filter(p => !junctions.has(p.id));
    snapshot.instances = snapshot.instances.filter(i => !junctions.has(i.productId));
    for (const [id, title, productType, implementationYear] of additions) {
      let product = snapshot.products.find(p => p.id === id || (p.title === title && p.productType === productType));
      if (product) {
        Object.assign(product, { title, shortTitle: title, productType, implementationYear });
      } else {
        product = {
          id, title, shortTitle: title, productType, implementationYear,
          domainTags: [], audienceTags: [], goalTags: [], description: "", shortOutcome: "",
          durationValue: 0, durationUnit: "hours", accessModel: "", owner: "", status: "active",
          publicVisible: true, exclusiveResultFlag: false, conflictRiskLevel: "low",
          relatedPtProducts: [], locale: "ru"
        } satisfies Product;
        snapshot.products.push(product);
      }
    }
  }
  for (const map of store.maps) map.name = CENTER_TITLE;
  store.catalogSchemaVersion = 1;
  return true;
}
