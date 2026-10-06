import type { AppStore, EcosystemLink } from "@/lib/map/types";
import { securityDomainsFor, validLink } from "@/lib/map/ecosystem";

export function migrateEcosystem(store: AppStore): boolean {
  let changed = false;

  if ((store.ecosystemSchemaVersion ?? 0) < 1) {
    for (const snapshot of Object.values(store.drafts)) {
    const years: Record<string,number> = { "prod-siem-course":2025, "prod-nad-course":2025, "prod-edr-course":2026, "prod-ngfw-course":2026, "prod-vm-course":2025, "prod-af-course":2026, "prod-sandbox-course":2026 };
    snapshot.products.forEach(p=>{
      if (p.id in years) p.implementationYear = years[p.id];
      if (p.id === "prod-ot-course") delete p.implementationYear;
      p.securityDomainIds ??= securityDomainsFor(p, snapshot).filter(d=>d!=="unassigned");
    });
    const links: EcosystemLink[] = [];
    const add = (sourceId:string,targetId:string,kind:EcosystemLink["kind"],status:EcosystemLink["status"],note:string) => {
      const link = {id:`eco-${sourceId}-${targetId}-${kind}`,sourceId,targetId,kind,status,note};
      if (validLink(link,snapshot.products)) links.push(link);
    };
    for (const practicum of ["prod-l1-practicum","prod-arch-practicum"]) {
      for (const module of ["prod-siem-module","prod-nta-module","prod-waf-module"]) {
        add(module,practicum,"practice","confirmed","Состав практики указан владельцем программы: SIEM, NTA и WAF (AF).");
      }
    }
    for (const [source,target] of [["prod-siem-module","intensive-siem"],["prod-nta-module","intensive-nta"],["prod-waf-module","intensive-waf"],["prod-sast-module","intensive-saas"]]) {
      add(source,target,"intensive","confirmed","Модуль тренажёра переупаковывается в синхронный интенсив с куратором.");
      const module = snapshot.products.find(p=>p.id===source), intensive = snapshot.products.find(p=>p.id===target);
      if(module && intensive) { module.title=intensive.title; module.shortTitle=intensive.title; }
    }
    for(const [source,target] of [["prod-siem-module","prod-siem-course"],["prod-nta-module","prod-nad-course"],["prod-waf-module","prod-af-course"],["prod-edr-module","prod-edr-course"],["prod-sandbox-module","prod-sandbox-course"],["prod-vm-module","prod-vm-course"],["prod-ot-module","prod-ot-course"],["prod-nta-module","prod-ngfw-course"],["prod-waf-module","prod-ngfw-course"]]) {
      add(source,target,"practice","proposed","Предлагаемое соответствие по продукту и направлению. Точный набор кейсов BASE необходимо подтвердить.");
    }
    for(const [source,target] of [["prod-nta-module","prod-traffic-practicum"],["prod-vm-module","prod-vm-practicum"],["prod-am-module","prod-vm-practicum"],["prod-ot-module","prod-ot-practicum"],["prod-sast-module","prod-appsec-engineers"],["prod-siem-module","prod-soc-analyst"],["prod-edr-module","prod-soc-analyst"]]) {
      add(source,target,"practice","proposed","Связь по направлению и прежней карте; состав практики требует подтверждения.");
    }
    for(const [source,target] of [["prod-l1-practicum","prod-siem-course"],["prod-l1-practicum","prod-nad-course"],["prod-l1-practicum","prod-af-course"],["prod-traffic-practicum","prod-nad-course"],["prod-arch-practicum","prod-ngfw-course"],["prod-arch-practicum","prod-af-course"],["prod-vm-practicum","prod-vm-course"],["prod-ot-practicum","prod-ot-course"]]) {
      add(source,target,"product","proposed","Предложение следующего шага для заказчика, которому нужно освоить конкретный продукт PT.");
    }
      snapshot.ecosystemLinks ??= links;
      store.draftRevisions ??= {};
      store.draftRevisions[snapshot.map.id] = (store.draftRevisions[snapshot.map.id] ?? 0) + 1;
    }
    store.ecosystemSchemaVersion = 1;
    changed = true;
  }

  if ((store.ecosystemSchemaVersion ?? 0) < 2) {
    for (const snapshot of Object.values(store.drafts)) {
      const edrModule = snapshot.products.find(product => product.id === "prod-edr-module");
      if (edrModule && !snapshot.products.some(product => product.id === "intensive-edr")) {
        snapshot.products.push({
          ...edrModule,
          id: "intensive-edr",
          title: "Расследование атак на конечных устройствах с помощью EDR",
          shortTitle: "Расследование атак с EDR",
          productType: "intensive",
          description: "Планируемый интенсив на базе одноимённого модуля PT EdTechLab. Год реализации пока не указан.",
          shortOutcome: "Практика расследования атак с EDR в синхронном формате с куратором.",
          accessModel: "Синхронный интенсив с куратором",
          implementationYear: undefined,
          securityDomainIds: [...(edrModule.securityDomainIds ?? ["lane-soc", "lane-network"])]
        });
      }

      const hccModule = snapshot.products.find(product => product.id === "prod-hcc-module");
      if (hccModule) hccModule.publicVisible = false;

      snapshot.ecosystemLinks ??= [];
      const ensureConfirmed = (
        sourceId: string,
        targetId: string,
        kind: EcosystemLink["kind"],
        note: string
      ) => {
        if (!snapshot.products.some(product => product.id === sourceId) ||
            !snapshot.products.some(product => product.id === targetId)) return;
        const existing = snapshot.ecosystemLinks?.find(link =>
          link.sourceId === sourceId && link.targetId === targetId && link.kind === kind
        );
        if (existing) {
          existing.status = "confirmed";
          existing.note = note;
          return;
        }
        const link: EcosystemLink = {
          id: `eco-${sourceId}-${targetId}-${kind}`,
          sourceId,
          targetId,
          kind,
          status: "confirmed",
          note
        };
        if (validLink(link, snapshot.products)) snapshot.ecosystemLinks?.push(link);
      };

      const practiceNote = "Подтверждено владельцем портфеля 24.09.2026: модуль входит в практическую связку программы.";
      const intensiveNote = "Подтверждено владельцем портфеля 24.09.2026: модуль тренажёра переупаковывается в одноимённый интенсив.";
      const productNote = "Подтверждено владельцем портфеля 24.09.2026: программа связана с курсом BASE по эксплуатации продукта.";

      for (const [moduleId, practicumId] of [
        ["prod-siem-module", "prod-l1-practicum"],
        ["prod-waf-module", "prod-l1-practicum"],
        ["prod-nta-module", "prod-l1-practicum"],
        ["prod-nta-module", "prod-traffic-practicum"],
        ["prod-siem-module", "prod-arch-practicum"],
        ["prod-waf-module", "prod-arch-practicum"],
        ["prod-nta-module", "prod-arch-practicum"],
        ["prod-edr-module", "prod-arch-practicum"],
        ["prod-sast-module", "prod-appsec-engineers"]
      ]) ensureConfirmed(moduleId, practicumId, "practice", practiceNote);

      for (const [moduleId, intensiveId] of [
        ["prod-siem-module", "intensive-siem"],
        ["prod-waf-module", "intensive-waf"],
        ["prod-nta-module", "intensive-nta"],
        ["prod-edr-module", "intensive-edr"],
        ["prod-sast-module", "intensive-saas"]
      ]) ensureConfirmed(moduleId, intensiveId, "intensive", intensiveNote);

      for (const [programId, courseId] of [
        ["prod-l1-practicum", "prod-siem-course"],
        ["prod-l1-practicum", "prod-af-course"],
        ["prod-l1-practicum", "prod-nad-course"],
        ["prod-traffic-practicum", "prod-nad-course"],
        ["prod-arch-practicum", "prod-siem-course"],
        ["prod-arch-practicum", "prod-af-course"],
        ["prod-arch-practicum", "prod-edr-course"],
        ["prod-arch-practicum", "prod-nad-course"],
        ["prod-arch-practicum", "prod-ngfw-course"],
        ["prod-arch-practicum", "prod-vm-course"],
        ["prod-hardening", "prod-vm-course"],
        ["prod-vm-practicum", "prod-vm-course"]
      ]) ensureConfirmed(programId, courseId, "product", productNote);

      const leadershipIds = new Set(["prod-soc-build", "prod-appsec-leaders", "prod-ciso-program"]);
      snapshot.ecosystemLinks = snapshot.ecosystemLinks.filter(link =>
        !leadershipIds.has(link.sourceId) && !leadershipIds.has(link.targetId)
      );

      store.draftRevisions ??= {};
      store.draftRevisions[snapshot.map.id] = (store.draftRevisions[snapshot.map.id] ?? 0) + 1;
    }
    store.ecosystemSchemaVersion = 2;
    changed = true;
  }

  if ((store.ecosystemSchemaVersion ?? 0) < 3) {
    const removedCourseIds = new Set(["prod-af-course", "prod-ngfw-course"]);
    const removedPtProducts = new Set(["PT AF PRO", "PT NGFW"]);

    for (const snapshot of Object.values(store.drafts)) {
      const removedInstanceIds = new Set(
        snapshot.instances
          .filter(instance => removedCourseIds.has(instance.productId))
          .map(instance => instance.id)
      );

      snapshot.products = snapshot.products.filter(product => !removedCourseIds.has(product.id));
      snapshot.products.forEach(product => {
        product.relatedPtProducts = product.relatedPtProducts.filter(productName => !removedPtProducts.has(productName));
      });
      snapshot.instances = snapshot.instances.filter(instance => !removedCourseIds.has(instance.productId));
      snapshot.edges = snapshot.edges.filter(edge =>
        !removedInstanceIds.has(edge.sourceInstanceId) && !removedInstanceIds.has(edge.targetInstanceId)
      );
      snapshot.ecosystemLinks = (snapshot.ecosystemLinks ?? []).filter(link =>
        !removedCourseIds.has(link.sourceId) && !removedCourseIds.has(link.targetId)
      );

      const hardening = snapshot.products.find(product => product.id === "prod-hardening");
      if (hardening) {
        hardening.securityDomainIds = [...new Set([...(hardening.securityDomainIds ?? []), "lane-network", "lane-vm"] )];
      }

      const hardeningPracticeLink: EcosystemLink = {
        id: "eco-prod-vm-module-prod-hardening-practice",
        sourceId: "prod-vm-module",
        targetId: "prod-hardening",
        kind: "practice",
        status: "confirmed",
        note: "Модуль по устранению уязвимостей входит в связку практикума по харденингу ИТ-инфраструктуры."
      };
      if (validLink(hardeningPracticeLink, snapshot.products) &&
          !snapshot.ecosystemLinks.some(link =>
            link.sourceId === hardeningPracticeLink.sourceId &&
            link.targetId === hardeningPracticeLink.targetId &&
            link.kind === hardeningPracticeLink.kind
          )) {
        snapshot.ecosystemLinks.push(hardeningPracticeLink);
      }

      store.draftRevisions ??= {};
      store.draftRevisions[snapshot.map.id] = (store.draftRevisions[snapshot.map.id] ?? 0) + 1;
    }
    store.ecosystemSchemaVersion = 3;
    changed = true;
  }

  return changed;
}
