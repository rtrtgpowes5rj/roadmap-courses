import type { Product, ProductType } from "@/lib/map/types";

export const CENTER_TITLE = "Центр практической кибербезопасности";
export const CATALOG_TYPES = [
  { id: "practicum", title: "Практикумы", singular: "Практикум", domain: "Профессиональные программы" },
  { id: "sprint", title: "Спринты", singular: "Спринт", domain: "Профессиональные программы" },
  { id: "intensive", title: "Интенсивы", singular: "Интенсив", domain: "Профессиональные программы" },
  { id: "product_course", title: "BASE", singular: "Курс BASE", domain: "Курсы по эксплуатации продуктов" },
  { id: "module", title: "PT EdTechLab", singular: "Модуль тренажёра", domain: "Тренажёр PT EdTechLab" }
] as const;
export type CatalogType = typeof CATALOG_TYPES[number]["id"];
export function catalogType(type: ProductType): CatalogType {
  return type === "management_course" ? "practicum" : type === "junction" ? "module" : type;
}
export function emptyProduct(type: CatalogType = "practicum"): Product {
  return {
    id: `program-${crypto.randomUUID()}`, title: "", shortTitle: "", productType: type,
    description: "", shortOutcome: "", domainTags: [], audienceTags: [], goalTags: [],
    durationValue: 0, durationUnit: "hours", accessModel: "", owner: "", status: "active",
    publicVisible: true, exclusiveResultFlag: false, conflictRiskLevel: "low",
    relatedPtProducts: [], locale: "ru"
  };
}
