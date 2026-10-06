import {
  COLUMNS,
  LANE_HEIGHT,
  NODE_LARGE_HEIGHT,
  NODE_MEDIUM_HEIGHT,
  NODE_SMALL_HEIGHT,
  MAP_ID
} from "@/lib/map/constants";
import type { AppStore, Lane, MapRecord, MapSnapshot, Product, ProductInstance, MapVersion } from "@/lib/map/types";
import { getLaneTop } from "@/lib/map/utils";

const now = new Date().toISOString();

function lane(
  id: string,
  title: string,
  order: number,
  colorToken: string,
  height: number = LANE_HEIGHT,
  audience?: string
): Lane {
  return {
    id,
    mapId: MAP_ID,
    title,
    order,
    height,
    colorToken,
    ...(audience ? { audience } : {})
  };
}

function product(input: Product): Product {
  return input;
}

/**
 * Junction "products" — synthetic markers used to render small connector nodes
 * that merge multiple incoming edges into a single outgoing edge (or vice-versa).
 * They have empty title/description; CourseNode never renders them — they get
 * the "junctionNode" React Flow type instead.
 */
function junctionProduct(id: string, label: string): Product {
  return {
    id,
    title: label,
    shortTitle: label,
    productType: "junction",
    domainTags: [],
    audienceTags: [],
    goalTags: [],
    shortOutcome: "",
    description: "",
    durationValue: 0,
    durationUnit: "weeks",
    accessModel: "",
    owner: "",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: [],
    locale: "ru"
  };
}

function instance(
  id: string,
  productId: string,
  laneId: string,
  columnId: ProductInstance["columnId"],
  y: number,
  width: number,
  height: number
): ProductInstance {
  const column = COLUMNS.find((item) => item.id === columnId) ?? COLUMNS[0];

  return {
    id,
    mapId: MAP_ID,
    productId,
    laneId,
    columnId,
    x: column.x,
    y,
    width,
    height,
    zIndex: 1,
    isLocked: false,
    isVisible: true
  };
}

/**
 * Junction instance — small 28×28 connector node placed inside a column gap.
 * x is set explicitly (not by column meta) so it sits in the inter-column gap.
 */
function junctionInstance(
  id: string,
  productId: string,
  laneId: string,
  columnId: ProductInstance["columnId"],
  x: number,
  y: number
): ProductInstance {
  return {
    id,
    mapId: MAP_ID,
    productId,
    laneId,
    columnId,
    x,
    y,
    width: 28,
    height: 28,
    zIndex: 2,
    isLocked: false,
    isVisible: true
  };
}

// ─── Lanes ───────────────────────────────────────────────────────────────────
// 8 lanes after adding "Основы" as order 0 (all previous orders shifted +1).
const lanes: Lane[] = [
  lane("lane-basics",    "Основы",                               0, "lane-slate",    360, "Начинающие ИТ-специалисты, Junior-аналитики"),
  lane("lane-redteam",   "Red Team и offensive security",        1, "lane-crimson",  620, "Пентестеры, Red Team специалисты, offensive security"),
  lane("lane-soc",       "SOC и расследование",                  2, "lane-blue",     960, "Аналитики SOC L1/L2, специалисты мониторинга и реагирования"),
  lane("lane-network",   "Сетевая защита и архитектура",         3, "lane-amber",    960, "Сетевые инженеры, архитекторы ИБ и ИТ"),
  lane("lane-vm",        "Управление уязвимостями",              4, "lane-emerald",  620, "VM-специалисты, специалисты ИБ"),
  lane("lane-ot",        "OT / АСУ ТП",                         5, "lane-crimson",  620, "Инженеры АСУ ТП, специалисты ИБ промышленных систем"),
  lane("lane-appsec",    "AppSec / DevSecOps",                   6, "lane-slate",    620, "Разработчики, DevOps-инженеры, AppSec инженеры"),
  lane("lane-leadership","Руководители и построение функции",    7, "lane-violet",   760, "CISO, CIO, руководители ИБ, тимлиды")
];

// Named lane-Y helpers — avoids off-by-one when lanes shift.
function laneY(order: number, offset: number) {
  return getLaneTop(order, lanes) + offset;
}
const basicsY   = (o: number) => laneY(0, o);
const redteamY  = (o: number) => laneY(1, o);
const socY      = (o: number) => laneY(2, o);
const networkY  = (o: number) => laneY(3, o);
const vmY       = (o: number) => laneY(4, o);
const otY       = (o: number) => laneY(5, o);
const appsecY   = (o: number) => laneY(6, o);
const leaderY   = (o: number) => laneY(7, o);

// ─── Products ────────────────────────────────────────────────────────────────
const products: Product[] = [
  // ── Основы ──────────────────────────────────────────────────────────────────
  product({
    id: "prod-basics",
    title: "Основы кибербезопасности",
    shortTitle: "Основы",
    productType: "module",
    domainTags: ["Основы"],
    audienceTags: ["Начинающие специалисты ИТ и ИБ", "Junior-аналитики", "Инженеры поддержки"],
    goalTags: ["Быстрый вход"],
    shortOutcome: "Быстрый вход и самостоятельная практика в кибербезопасности.",
    description:
      "Стартовый практический модуль для специалистов ИТ и смежных направлений, которым нужен быстрый вход в домен кибербезопасности перед углублением в продуктовые или ролевые программы.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: [],
    locale: "ru"
  }),

  // ── Red Team ─────────────────────────────────────────────────────────────────
  product({
    id: "prod-attack",
    title: "Путеводитель ATT&CK: TTP на практике",
    shortTitle: "ATT&CK на практике",
    productType: "module",
    domainTags: ["Red Team", "Offensive Security"],
    audienceTags: ["Пентестеры", "Red Team специалисты", "Специалисты ИБ"],
    goalTags: ["Атаки и TTP", "Offensive Security"],
    shortOutcome: "Быстрый вход в MITRE ATT&CK как offensive-мышление и разбор TTP на практике.",
    description:
      "Самостоятельная практика по техникам и сценариям ATT&CK для red-team и offensive security, а не для SOC-маршрута.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: [],
    locale: "ru"
  }),

  // ── SOC ──────────────────────────────────────────────────────────────────────
  product({
    id: "prod-siem-module",
    title: "Анализ событий безопасности с помощью SIEM",
    shortTitle: "SIEM-модуль",
    productType: "module",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики SOC", "Специалисты ИБ"],
    goalTags: ["Мониторинг", "Реагирование"],
    shortOutcome: "Самостоятельная отработка телеметрии и базовых сценариев анализа событий.",
    description:
      "Точечная практика в SIEM-направлении для быстрого входа и закрепления навыка анализа событий безопасности.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "high",
    relatedPtProducts: ["MaxPatrol SIEM"],
    locale: "ru"
  }),
  product({
    id: "prod-nta-module",
    title: "Анализ сетевых атак с помощью NTA",
    shortTitle: "NTA-модуль",
    productType: "module",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики SOC", "Сетевые инженеры"],
    goalTags: ["Расследование", "Сетевая защита"],
    shortOutcome: "Самостоятельная отработка анализа сетевого трафика и аномалий.",
    description:
      "Библиотека кейсов для точечной практики в сетевом трафике, без позиционирования как замены ролевого практикума.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "high",
    relatedPtProducts: ["PT NAD"],
    locale: "ru"
  }),
  product({
    id: "prod-sandbox-module",
    title: "Обнаружение ВПО с помощью Sandbox",
    shortTitle: "Sandbox-модуль",
    productType: "module",
    domainTags: ["SOC"],
    audienceTags: ["Аналитики SOC"],
    goalTags: ["Мониторинг", "Реагирование"],
    shortOutcome: "Практика по выявлению ВПО и работе с песочницей.",
    description:
      "Точечный модуль для blue-team сценариев, который усиливает маршрут L1 и расследований.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: [],
    locale: "ru"
  }),
  product({
    id: "prod-edr-module",
    title: "Расследование атак на конечных устройствах с помощью EDR",
    shortTitle: "EDR-модуль",
    productType: "module",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики SOC", "Специалисты ИБ"],
    goalTags: ["Расследование", "Мониторинг"],
    shortOutcome: "Практика расследования атак на конечных устройствах с использованием EDR.",
    description:
      "Модуль для отработки EDR-сценариев и подготовки к ролевому SOC-практикуму на уровне конечных устройств.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["MaxPatrol EDR"],
    locale: "ru"
  }),
  product({
    id: "prod-complex-investigation",
    title: "Комплексное расследование кибератак",
    shortTitle: "Комплексное расследование",
    productType: "module",
    domainTags: ["SOC"],
    audienceTags: ["Аналитики SOC", "Специалисты мониторинга и реагирования"],
    goalTags: ["Расследование", "Мониторинг"],
    shortOutcome: "Самостоятельная практика по сложным кейсам расследования.",
    description:
      "Продвинутый модуль для L2-аналитиков с более сложными сценариями: корреляция, кросс-продуктовая телеметрия и многоэтапные атаки.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: [],
    locale: "ru"
  }),
  product({
    id: "prod-l1-practicum",
    title: "Мониторинг и реагирование",
    shortTitle: "Мониторинг и реагирование",
    productType: "practicum",
    domainTags: ["SOC"],
    audienceTags: ["Начинающие аналитики SOC", "Специалисты ИБ"],
    goalTags: ["Мониторинг", "Реагирование"],
    shortOutcome: "Ролевая подготовка L1-аналитика с методикой, разбором и переносом в рабочий контур.",
    description:
      "Флагманский практикум для подготовки специалистов L1: связка сигналов, приоритизация гипотез, эскалация и оформление результата.",
    durationValue: 6,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["MaxPatrol SIEM", "PT NAD", "PT AF PRO"],
    locale: "ru"
  }),
  product({
    id: "prod-traffic-practicum",
    title: "Анализ сетевого трафика при расследовании атак",
    shortTitle: "Анализ сетевого трафика",
    productType: "practicum",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики ИБ", "Сетевые инженеры"],
    goalTags: ["Расследование", "Сетевая защита"],
    shortOutcome: "Методика расследования атак по трафику, а не просто набор NTA-кейсов.",
    description:
      "Практикум учит превращать телеметрию в расследование: гипотезы, артефакты, контекст инфраструктуры и итоговый отчет.",
    durationValue: 5,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "high",
    relatedPtProducts: ["PT NAD"],
    locale: "ru"
  }),
  product({
    id: "prod-soc-analyst",
    title: "Аналитик SOC",
    shortTitle: "Аналитик SOC",
    productType: "practicum",
    domainTags: ["SOC"],
    audienceTags: ["Аналитики SOC", "Специалисты мониторинга и реагирования"],
    goalTags: ["Расследование", "Мониторинг"],
    shortOutcome: "Ролевая подготовка SOC-аналитика с методикой, процессами и переносом в рабочий контур.",
    description:
      "Флагманский L2-практикум для подготовки опытного SOC-аналитика: сложные расследования, корреляция данных и управление инцидентами.",
    durationValue: 6,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["MaxPatrol SIEM", "PT NAD", "MaxPatrol EDR"],
    locale: "ru"
  }),
  product({
    id: "prod-siem-course",
    title: "MaxPatrol SIEM: эксплуатация и threat hunting",
    shortTitle: "Курс по MaxPatrol SIEM",
    productType: "product_course",
    domainTags: ["SOC"],
    audienceTags: ["Аналитики SOC", "Инженеры ИБ"],
    goalTags: ["Эксплуатация продукта", "Мониторинг"],
    shortOutcome: "Ускорение value от установленного MaxPatrol SIEM.",
    description:
      "Курс для клиентов PT, которым нужно быстрее освоить эксплуатацию продукта и повысить отдачу от внедрения.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["MaxPatrol SIEM"],
    locale: "ru"
  }),
  product({
    id: "prod-nad-course",
    title: "PT NAD: эксплуатация и поиск угроз",
    shortTitle: "Курс по PT NAD",
    productType: "product_course",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики ИБ", "Сетевые инженеры"],
    goalTags: ["Эксплуатация продукта", "Расследование"],
    shortOutcome: "Практика по работе именно в PT NAD, если стек уже выбран или внедрен.",
    description:
      "Отдельная ветка adoption для клиентов PT, которая не конкурирует с ролевыми практикумами на языке объема кейсов.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["PT NAD"],
    locale: "ru"
  }),
  product({
    id: "prod-edr-course",
    title: "MaxPatrol EDR: эксплуатация и расследование инцидентов",
    shortTitle: "Курс по MaxPatrol EDR",
    productType: "product_course",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики SOC", "Инженеры ИБ"],
    goalTags: ["Эксплуатация продукта", "Расследование"],
    shortOutcome: "Ускорение value от установленного MaxPatrol EDR.",
    description:
      "Курс для клиентов PT, которым нужно быстрее освоить эксплуатацию MaxPatrol EDR и интеграцию с SOC-процессами.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["MaxPatrol EDR"],
    locale: "ru"
  }),

  // ── Сетевая защита ───────────────────────────────────────────────────────────
  product({
    id: "prod-waf-module",
    title: "Анализ кибератак на веб-приложения с помощью WAF",
    shortTitle: "WAF-модуль",
    productType: "module",
    domainTags: ["Сетевая защита", "AppSec"],
    audienceTags: ["Специалисты ИБ", "AppSec инженеры"],
    goalTags: ["Сетевая защита", "Защита приложений"],
    shortOutcome: "Точечная практика по веб-атакам и работе с WAF.",
    description:
      "Модуль для самостоятельной практики в веб-защите и подготовке к архитектурным сценариям.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "high",
    relatedPtProducts: ["PT AF PRO"],
    locale: "ru"
  }),
  product({
    id: "prod-arch-practicum",
    title: "Архитектура сетевой безопасности предприятия",
    shortTitle: "Архитектура сетевой безопасности",
    productType: "practicum",
    domainTags: ["Сетевая защита"],
    audienceTags: ["Архитекторы ИБ и ИТ", "Руководители ИБ", "Сетевые инженеры"],
    goalTags: ["Сетевая защита", "Архитектура"],
    shortOutcome: "Сквозной курс по проектированию защиты предприятия, а не пакет модулей AF/SIEM/NTA.",
    description:
      "Флагманский маршрут по модели угроз, компромиссам архитектуры и защите решений перед бизнесом и ИТ.",
    durationValue: 6,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "high",
    relatedPtProducts: ["PT AF PRO", "PT NAD", "MaxPatrol SIEM", "PT NGFW"],
    locale: "ru"
  }),
  product({
    id: "prod-hardening",
    title: "Харденинг ИТ-инфраструктуры",
    shortTitle: "Харденинг ИТ",
    productType: "practicum",
    domainTags: ["Сетевая защита"],
    audienceTags: ["Сетевые инженеры", "Архитекторы ИБ и ИТ", "Инженеры эксплуатации"],
    goalTags: ["Сетевая защита", "Архитектура"],
    shortOutcome: "Выстраивание харденинга сетевой и программной инфраструктуры.",
    description:
      "Практикум по технической реализации мер защиты в инфраструктуре: сетевые политики, конфигурации и контроль изменений.",
    durationValue: 5,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["PT NGFW", "MaxPatrol VM"],
    locale: "ru"
  }),
  product({
    id: "prod-af-course",
    title: "PT AF PRO: эксплуатация защиты веб-приложений",
    shortTitle: "Курс по PT AF PRO",
    productType: "product_course",
    domainTags: ["Сетевая защита", "AppSec"],
    audienceTags: ["Специалисты ИБ", "Инженеры эксплуатации"],
    goalTags: ["Эксплуатация продукта", "Защита приложений"],
    shortOutcome: "Ускорение value от PT AF PRO в production-контуре.",
    description:
      "Продуктовый курс для клиентов PT AF PRO: настройка, эксплуатация и рост прикладной отдачи от продукта.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["PT AF PRO"],
    locale: "ru"
  }),
  product({
    id: "prod-ngfw-course",
    title: "PT NGFW: эксплуатация сетевой защиты",
    shortTitle: "Курс по PT NGFW",
    productType: "product_course",
    domainTags: ["Сетевая защита"],
    audienceTags: ["Сетевые инженеры", "Архитекторы ИБ и ИТ"],
    goalTags: ["Эксплуатация продукта", "Сетевая защита"],
    shortOutcome: "Освоение PT NGFW для команд, у которых уже строится целевая архитектура.",
    description:
      "Отдельная adoption-ветка для эксплуатации сетевой защиты на стеке PT.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["PT NGFW"],
    locale: "ru"
  }),
  product({
    id: "prod-sandbox-course",
    title: "PT Sandbox: анализ ВПО и расследование инцидентов",
    shortTitle: "Курс по PT Sandbox",
    productType: "product_course",
    domainTags: ["SOC", "Сетевая защита"],
    audienceTags: ["Аналитики SOC", "Инженеры ИБ"],
    goalTags: ["Расследование", "Мониторинг"],
    shortOutcome: "Освоение PT Sandbox для команд, которые анализируют ВПО и расследуют инциденты на PT-стеке.",
    description:
      "Adoption-ветка для клиентов PT Sandbox: конфигурация, анализ вредоносного поведения и интеграция в SOC-процессы.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["PT Sandbox"],
    locale: "ru"
  }),

  // ── VM ───────────────────────────────────────────────────────────────────────
  product({
    id: "prod-vm-module",
    title: "Устранение уязвимостей с помощью VM",
    shortTitle: "VM-модуль",
    productType: "module",
    domainTags: ["VM"],
    audienceTags: ["VM-специалисты", "Специалисты ИБ"],
    goalTags: ["Управление уязвимостями"],
    shortOutcome: "Самостоятельная практика по точечному управлению уязвимостями.",
    description:
      "Модуль для быстрого входа в процесс VM и закрепления операционных сценариев.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["MaxPatrol VM"],
    locale: "ru"
  }),
  product({
    id: "prod-hcc-module",
    title: "Оценка защищённости хостов с помощью HCC",
    shortTitle: "HCC-модуль",
    productType: "module",
    domainTags: ["VM"],
    audienceTags: ["VM-специалисты", "Специалисты ИБ"],
    goalTags: ["Управление уязвимостями"],
    shortOutcome: "Практика оценки защищённости хостов и соответствия требованиям безопасности.",
    description:
      "Модуль усиливает VM-маршрут на уровне compliance и защищённости активов.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["MaxPatrol VM"],
    locale: "ru"
  }),
  product({
    id: "prod-am-module",
    title: "Управление активами с помощью AM",
    shortTitle: "AM-модуль",
    productType: "module",
    domainTags: ["VM"],
    audienceTags: ["VM-специалисты", "Специалисты ИБ"],
    goalTags: ["Управление уязвимостями"],
    shortOutcome: "Точечная практика по инвентаризации и базе активов.",
    description:
      "Модуль, который усиливает VM-маршрут на уровне данных об активах и приоритизации.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: [],
    locale: "ru"
  }),
  product({
    id: "prod-vm-practicum",
    title: "Построение процесса управления уязвимостями",
    shortTitle: "Построение процесса VM",
    productType: "practicum",
    domainTags: ["VM"],
    audienceTags: ["VM-специалисты", "Аналитики SOC", "Специалисты ИБ"],
    goalTags: ["Управление уязвимостями"],
    shortOutcome: "Процессный маршрут по приоритизации, SLA, метрикам и контролю устранения.",
    description:
      "Практикум о процессе и орглогике VM, который не конкурирует с модульной практикой на уровне количества кейсов.",
    durationValue: 4,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["MaxPatrol VM", "PT AI"],
    locale: "ru"
  }),
  product({
    id: "prod-vm-course",
    title: "MaxPatrol VM: эксплуатация и процессы VM",
    shortTitle: "Курс по MaxPatrol VM",
    productType: "product_course",
    domainTags: ["VM"],
    audienceTags: ["VM-специалисты", "Инженеры ИБ"],
    goalTags: ["Эксплуатация продукта", "Управление уязвимостями"],
    shortOutcome: "Освоение эксплуатации MaxPatrol VM и повышение отдачи от внедрения.",
    description:
      "Adoption-ветка для клиентов MaxPatrol VM, которую удобно показывать рядом с процессным практикумом.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["MaxPatrol VM"],
    locale: "ru"
  }),

  // ── OT ───────────────────────────────────────────────────────────────────────
  product({
    id: "prod-ot-module",
    title: "Анализ кибератак на АСУ ТП с помощью PT ISIM",
    shortTitle: "PT ISIM-модуль",
    productType: "module",
    domainTags: ["OT"],
    audienceTags: ["ИБ-специалисты", "Инженеры АСУ ТП", "Аналитики SOC"],
    goalTags: ["OT", "Расследование"],
    shortOutcome: "Быстрый вход в OT-кейсы и специфику PT ISIM.",
    description:
      "Самостоятельная практика на ограниченном наборе OT-кейсов, которая подводит к ролевому практикуму.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["PT ISIM"],
    locale: "ru"
  }),
  product({
    id: "prod-ot-practicum",
    title: "Предотвращение атак на АСУ ТП",
    shortTitle: "Предотвращение атак на АСУ ТП",
    productType: "practicum",
    domainTags: ["OT"],
    audienceTags: ["ИБ-специалисты", "Инженеры АСУ ТП", "Аналитики SOC"],
    goalTags: ["OT", "Расследование"],
    shortOutcome: "Ролевая подготовка по расследованию и защите OT-сред с учетом специфики производства.",
    description:
      "Практикум про ограничения OT, доступность, расследование и взаимодействие ИБ с инженерами АСУ ТП.",
    durationValue: 4,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "medium",
    relatedPtProducts: ["PT ISIM"],
    locale: "ru"
  }),
  product({
    id: "prod-ot-course",
    title: "PT ISIM: эксплуатация и расследование в OT",
    shortTitle: "Курс по PT ISIM",
    productType: "product_course",
    domainTags: ["OT"],
    audienceTags: ["Инженеры АСУ ТП", "Специалисты ИБ"],
    goalTags: ["Эксплуатация продукта", "OT"],
    shortOutcome: "Ускорение value от PT ISIM для команд, уже работающих с продуктом.",
    description:
      "Продуктовый трек adoption для PT ISIM и промышленного контура.",
    durationValue: 3,
    durationUnit: "months",
    accessModel: "Асинхронный курс",
    owner: "Product Education",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "low",
    relatedPtProducts: ["PT ISIM"],
    locale: "ru"
  }),

  // ── AppSec ───────────────────────────────────────────────────────────────────
  product({
    id: "prod-sast-module",
    title: "Устранение веб-уязвимостей с помощью SAST",
    shortTitle: "SAST-модуль",
    productType: "module",
    domainTags: ["AppSec"],
    audienceTags: ["Разработчики", "DevOps-инженеры", "AppSec инженеры"],
    goalTags: ["AppSec", "Безопасная разработка"],
    shortOutcome: "Самостоятельная практика по выявлению уязвимостей на этапе разработки.",
    description:
      "Точечная практика для инженерной AppSec-линейки и быстрого входа в безопасную разработку.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: [],
    locale: "ru"
  }),
  product({
    id: "prod-devsecops-module",
    title: "DevSecOps инженер",
    shortTitle: "DevSecOps-модуль",
    productType: "module",
    domainTags: ["AppSec"],
    audienceTags: ["Разработчики", "DevOps-инженеры", "AppSec инженеры"],
    goalTags: ["AppSec", "Безопасная разработка"],
    shortOutcome: "Практика по встраиванию security в SDLC.",
    description:
      "Модуль о практических AppSec-паттернах для инженерной команды.",
    durationValue: 2,
    durationUnit: "months",
    accessModel: "SaaS-доступ по подписке",
    owner: "EdTechLab",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: false,
    conflictRiskLevel: "medium",
    relatedPtProducts: [],
    locale: "ru"
  }),
  product({
    id: "prod-appsec-engineers",
    title: "AppSec для инженеров",
    shortTitle: "AppSec для инженеров",
    productType: "practicum",
    domainTags: ["AppSec"],
    audienceTags: ["Разработчики", "DevOps-инженеры", "Аналитики", "Тестировщики"],
    goalTags: ["AppSec", "Безопасная разработка"],
    shortOutcome: "Системная работа с AppSec в SDLC: выявление уязвимостей, инструменты и внедрение практик.",
    description:
      "Практикум про инженерную зрелость AppSec, а не просто набор SAST/DAST-модулей.",
    durationValue: 6,
    durationUnit: "weeks",
    accessModel: "Когортный практикум",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "medium",
    relatedPtProducts: [],
    locale: "ru"
  }),

  // ── Руководители ─────────────────────────────────────────────────────────────
  product({
    id: "prod-appsec-leaders",
    title: "AppSec для руководителей",
    shortTitle: "AppSec для руководителей",
    productType: "management_course",
    domainTags: ["AppSec", "Руководители"],
    audienceTags: ["Тимлиды AppSec", "Руководители разработки", "CISO"],
    goalTags: ["AppSec", "Построение функции"],
    shortOutcome: "Управленческий маршрут по рискам, стратегии и встраиванию AppSec в бизнес-процессы.",
    description:
      "Отдельная управленческая ветка, которую нельзя смешивать с атомарными SaaS-модулями.",
    durationValue: 2,
    durationUnit: "weeks",
    accessModel: "Когортный курс",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "low",
    relatedPtProducts: [],
    locale: "ru"
  }),
  product({
    id: "prod-soc-build",
    title: "Построение SOC",
    shortTitle: "Построение SOC",
    productType: "management_course",
    domainTags: ["Руководители", "SOC"],
    audienceTags: ["CISO", "CIO", "ИТ-лидеры", "Архитекторы"],
    goalTags: ["Построение функции", "SOC"],
    shortOutcome: "Проектирование, запуск и управление SOC в парадигме результативной ИБ.",
    description:
      "Управленческий флагман про процессы, роли и архитектуру SOC, а не про отдельные продуктовые модули.",
    durationValue: 6,
    durationUnit: "weeks",
    accessModel: "Когортный курс",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "low",
    relatedPtProducts: ["MaxPatrol SIEM", "PT NAD"],
    locale: "ru"
  }),
  product({
    id: "prod-ciso-program",
    title: "Программа для CISO",
    shortTitle: "Программа для CISO",
    productType: "management_course",
    domainTags: ["Руководители"],
    audienceTags: ["CISO", "CIO", "ИТ-лидеры", "Руководители ИБ"],
    goalTags: ["Построение функции"],
    shortOutcome: "C-Level программа для руководителей, которые отвечают за стратегию, функцию ИБ и управленческие решения.",
    description:
      "Флагманская программа для топ-менеджмента: стратегия кибербезопасности, управление рисками и встраивание ИБ в бизнес-цели.",
    durationValue: 5,
    durationUnit: "weeks",
    accessModel: "Когортный курс",
    owner: "Practicum Team",
    status: "active",
    publicVisible: true,
    exclusiveResultFlag: true,
    conflictRiskLevel: "low",
    relatedPtProducts: [],
    locale: "ru"
  }),

  // ── Junctions (synthetic connectors) ──────────────────────────────────────
  junctionProduct("prod-junction-soc-l1",      "К практикуму L1"),
  junctionProduct("prod-junction-soc-ib",      "Курсы PT для L1"),
  junctionProduct("prod-junction-network-arch","К практикуму архитектуры"),
  junctionProduct("prod-junction-network-ib",  "Курсы PT для архитекторов")
];

// ─── Snapshot ─────────────────────────────────────────────────────────────────
const snapshot: MapSnapshot = {
  map: {
    id: MAP_ID,
    name: "Карта образовательного портфеля",
    locale: "ru",
    status: "published",
    version: 1,
    publishedAt: now,
    publishedVersionId: "version-1"
  },
  lanes,
  products,
  instances: [
    // ── Основы (order 0) ──────────────────────────────────────────────────────
    instance("inst-basics", "prod-basics", "lane-basics", "module", basicsY(64), 320, NODE_SMALL_HEIGHT),

    // ── Red Team (order 1) ───────────────────────────────────────────────────
    instance("inst-attack", "prod-attack", "lane-redteam", "module", redteamY(64), 320, NODE_SMALL_HEIGHT),

    // ── SOC (order 2) — module column ────────────────────────────────────────
    // L1 group: SIEM, NTA, WAF → L1 practicum
    // L2 group: Complex (above soc-analyst) → SOC Analyst; EDR (below) → via L1 handle routing
    instance("inst-siem-module",           "prod-siem-module",           "lane-soc", "module",         socY(72),  320, NODE_SMALL_HEIGHT),
    instance("inst-nta-module",            "prod-nta-module",            "lane-soc", "module",         socY(244), 320, NODE_SMALL_HEIGHT),
    instance("inst-soc-waf-module",        "prod-waf-module",            "lane-soc", "module",         socY(416), 320, NODE_SMALL_HEIGHT),
    // Complex placed above SOC Analyst so edge goes forward (down-right)
    instance("inst-complex-investigation", "prod-complex-investigation", "lane-soc", "module",         socY(588), 320, NODE_SMALL_HEIGHT),
    // EDR placed below — edge to L1 uses explicit handles to route through column gap
    instance("inst-edr-module",            "prod-edr-module",            "lane-soc", "module",         socY(760), 320, NODE_SMALL_HEIGHT),
    // SOC practicum column
    instance("inst-l1-practicum",          "prod-l1-practicum",          "lane-soc", "practicum",      socY(84),  380, NODE_LARGE_HEIGHT),
    instance("inst-traffic-practicum",     "prod-traffic-practicum",     "lane-soc", "practicum",      socY(320), 380, NODE_LARGE_HEIGHT),
    // SOC Analyst slightly below complex so complex → soc-analyst edge goes forward
    instance("inst-soc-analyst",           "prod-soc-analyst",           "lane-soc", "practicum",      socY(612), 380, NODE_LARGE_HEIGHT),
    // SOC product_course column
    instance("inst-siem-course",  "prod-siem-course",  "lane-soc", "product_course", socY(96),  320, NODE_SMALL_HEIGHT),
    instance("inst-nad-course",   "prod-nad-course",   "lane-soc", "product_course", socY(268), 320, NODE_SMALL_HEIGHT),
    instance("inst-soc-af-course","prod-af-course",    "lane-soc", "product_course", socY(440), 320, NODE_SMALL_HEIGHT),
    instance("inst-edr-course",   "prod-edr-course",   "lane-soc", "product_course", socY(612), 320, NODE_SMALL_HEIGHT),
    // SOC junctions — small 28×28 connector dots in inter-column gaps
    // L1 group: SIEM/WAF/EDR modules → junction → L1 practicum
    junctionInstance("inst-junction-soc-l1", "prod-junction-soc-l1", "lane-soc", "module", 426, socY(174)),
    // IB fan-out: L1 practicum → junction → SIEM/AF/EDR product courses
    junctionInstance("inst-junction-soc-ib", "prod-junction-soc-ib", "lane-soc", "product_course", 936, socY(174)),

    // ── Network (order 3) — module column (5 cards) ──────────────────────────
    instance("inst-network-siem-module",    "prod-siem-module",    "lane-network", "module",         networkY(72),  320, NODE_SMALL_HEIGHT),
    instance("inst-network-nta-module",     "prod-nta-module",     "lane-network", "module",         networkY(244), 320, NODE_SMALL_HEIGHT),
    instance("inst-network-sandbox-module", "prod-sandbox-module", "lane-network", "module",         networkY(416), 320, NODE_SMALL_HEIGHT),
    instance("inst-network-waf-module",     "prod-waf-module",     "lane-network", "module",         networkY(588), 320, NODE_SMALL_HEIGHT),
    instance("inst-network-edr-module",     "prod-edr-module",     "lane-network", "module",         networkY(760), 320, NODE_SMALL_HEIGHT),
    // Network practicum column
    instance("inst-arch-practicum", "prod-arch-practicum", "lane-network", "practicum", networkY(202), 380, NODE_LARGE_HEIGHT),
    instance("inst-hardening",      "prod-hardening",      "lane-network", "practicum", networkY(460), 380, NODE_LARGE_HEIGHT),
    // Network product_course column
    instance("inst-af-course",           "prod-af-course",      "lane-network", "product_course", networkY(104), 320, NODE_SMALL_HEIGHT),
    instance("inst-ngfw-course",         "prod-ngfw-course",    "lane-network", "product_course", networkY(276), 320, NODE_SMALL_HEIGHT),
    instance("inst-sandbox-course",      "prod-sandbox-course", "lane-network", "product_course", networkY(448), 320, NODE_SMALL_HEIGHT),
    instance("inst-network-edr-course",  "prod-edr-course",     "lane-network", "product_course", networkY(620), 320, NODE_SMALL_HEIGHT),
    // Network junctions
    // Arch group: SIEM/NTA/Sandbox/WAF modules → junction → Arch practicum
    junctionInstance("inst-junction-network-arch", "prod-junction-network-arch", "lane-network", "module", 426, networkY(292)),
    // IB fan-out: Arch practicum → junction → AF/NGFW/Sandbox product courses
    junctionInstance("inst-junction-network-ib",   "prod-junction-network-ib",   "lane-network", "product_course", 936, networkY(292)),

    // ── VM (order 4) — 3 modules ─────────────────────────────────────────────
    instance("inst-am-module",   "prod-am-module",   "lane-vm", "module",         vmY(72),  320, NODE_SMALL_HEIGHT),
    instance("inst-hcc-module",  "prod-hcc-module",  "lane-vm", "module",         vmY(240), 320, NODE_SMALL_HEIGHT),
    instance("inst-vm-module",   "prod-vm-module",   "lane-vm", "module",         vmY(408), 320, NODE_SMALL_HEIGHT),
    instance("inst-vm-practicum","prod-vm-practicum","lane-vm", "practicum",      vmY(176), 380, NODE_LARGE_HEIGHT),
    instance("inst-vm-course",   "prod-vm-course",   "lane-vm", "product_course", vmY(176), 320, NODE_SMALL_HEIGHT),

    // ── OT (order 5) ─────────────────────────────────────────────────────────
    instance("inst-ot-module",    "prod-ot-module",    "lane-ot", "module",         otY(176), 320, NODE_SMALL_HEIGHT),
    instance("inst-ot-practicum", "prod-ot-practicum", "lane-ot", "practicum",      otY(176), 380, NODE_LARGE_HEIGHT),
    instance("inst-ot-course",    "prod-ot-course",    "lane-ot", "product_course", otY(176), 320, NODE_SMALL_HEIGHT),

    // ── AppSec (order 6) ─────────────────────────────────────────────────────
    instance("inst-sast-module",      "prod-sast-module",      "lane-appsec", "module",    appsecY(96),  320, NODE_SMALL_HEIGHT),
    instance("inst-devsecops-module", "prod-devsecops-module", "lane-appsec", "module",    appsecY(252), 320, NODE_SMALL_HEIGHT),
    instance("inst-appsec-engineers", "prod-appsec-engineers", "lane-appsec", "practicum", appsecY(176), 380, NODE_LARGE_HEIGHT),

    // ── Leadership (order 7) — 3 management courses ──────────────────────────
    instance("inst-soc-build",      "prod-soc-build",      "lane-leadership", "practicum", leaderY(64),  380, NODE_MEDIUM_HEIGHT),
    instance("inst-appsec-leaders", "prod-appsec-leaders", "lane-leadership", "practicum", leaderY(256), 380, NODE_MEDIUM_HEIGHT),
    instance("inst-ciso-program",   "prod-ciso-program",   "lane-leadership", "practicum", leaderY(448), 380, NODE_MEDIUM_HEIGHT)
  ],
  edges: [
    // ── SOC: modules → junction → L1 practicum ──────────────────────────────
    // Branches: each module → junction (no label, no arrowhead — junction strips them)
    {
      id: "edge-siem-junction-l1",
      mapId: MAP_ID,
      sourceInstanceId: "inst-siem-module",
      targetInstanceId: "inst-junction-soc-l1",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "primary",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    {
      id: "edge-soc-waf-junction-l1",
      mapId: MAP_ID,
      sourceInstanceId: "inst-soc-waf-module",
      targetInstanceId: "inst-junction-soc-l1",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "optional",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    {
      id: "edge-edr-junction-l1",
      mapId: MAP_ID,
      sourceInstanceId: "inst-edr-module",
      targetInstanceId: "inst-junction-soc-l1",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "primary",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    // Trunk: junction → L1 (single labelled arrow)
    {
      id: "edge-junction-l1",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-soc-l1",
      targetInstanceId: "inst-l1-practicum",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    // NTA → traffic-practicum (1:1, no junction needed)
    {
      id: "edge-nta-traffic",
      mapId: MAP_ID,
      sourceInstanceId: "inst-nta-module",
      targetInstanceId: "inst-traffic-practicum",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["SOC", "Сетевая защита"],
      controlPoints: []
    },
    // ── SOC: L1 + complex → SOC analyst (L2) ────────────────────────────────
    {
      id: "edge-l1-soc-analyst",
      mapId: MAP_ID,
      sourceInstanceId: "inst-l1-practicum",
      targetInstanceId: "inst-soc-analyst",
      // Both nodes are in the practicum column — auto routing would create a straight
      // vertical line inside the column. Route the edge out to the right instead:
      // exit l1 right side → gap area at x=940 (between practicum and course cols) → down → enter soc-analyst top.
      sourceHandleId: "right",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: [
        { x: 940, y: socY(84 + 104) },   // y = l1 right-side midpoint
        { x: 940, y: socY(612) }          // y = top of soc-analyst (target rawEnd)
      ]
    },
    {
      id: "edge-complex-soc-analyst",
      mapId: MAP_ID,
      sourceInstanceId: "inst-complex-investigation",
      targetInstanceId: "inst-soc-analyst",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    // ── SOC: practicums → product courses (installed base) ───────────────────
    // L1 → junction → 3 courses (SIEM, AF, EDR) — fan-out collapsed into one trunk
    {
      id: "edge-l1-junction-ib",
      mapId: MAP_ID,
      sourceInstanceId: "inst-l1-practicum",
      targetInstanceId: "inst-junction-soc-ib",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "для клиентов PT",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    // Branches: junction → each course (unlabeled)
    {
      id: "edge-junction-siem-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-soc-ib",
      targetInstanceId: "inst-siem-course",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    {
      id: "edge-junction-af-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-soc-ib",
      targetInstanceId: "inst-soc-af-course",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    {
      id: "edge-junction-edr-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-soc-ib",
      targetInstanceId: "inst-edr-course",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    // Traffic → NAD (1:1)
    {
      id: "edge-traffic-nad-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-traffic-practicum",
      targetInstanceId: "inst-nad-course",
      edgeType: "installed_base",
      direction: "forward",
      label: "для клиентов PT",
      isPublic: true,
      scenarioTags: ["SOC"],
      controlPoints: []
    },
    // ── Network: modules → junction → Архитектура ───────────────────────────
    // Branches: 4 modules (SIEM, NTA, Sandbox, WAF) → junction (unlabeled)
    {
      id: "edge-siem-junction-arch",
      mapId: MAP_ID,
      sourceInstanceId: "inst-network-siem-module",
      targetInstanceId: "inst-junction-network-arch",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "optional",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    {
      id: "edge-nta-junction-arch",
      mapId: MAP_ID,
      sourceInstanceId: "inst-network-nta-module",
      targetInstanceId: "inst-junction-network-arch",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "optional",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    {
      id: "edge-sandbox-junction-arch",
      mapId: MAP_ID,
      sourceInstanceId: "inst-network-sandbox-module",
      targetInstanceId: "inst-junction-network-arch",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "optional",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    {
      id: "edge-waf-junction-arch",
      mapId: MAP_ID,
      sourceInstanceId: "inst-network-waf-module",
      targetInstanceId: "inst-junction-network-arch",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "optional",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    // Trunk: junction → Arch practicum
    {
      id: "edge-junction-arch",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-network-arch",
      targetInstanceId: "inst-arch-practicum",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "primary",
      direction: "forward",
      label: "углубление",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    // ── Network: EDR module → Харденинг ─────────────────────────────────────
    {
      id: "edge-network-edr-hardening",
      mapId: MAP_ID,
      sourceInstanceId: "inst-network-edr-module",
      targetInstanceId: "inst-hardening",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    // ── Network: Архитектура → junction → product courses ────────────────────
    // Trunk: Arch → junction
    {
      id: "edge-arch-junction-ib",
      mapId: MAP_ID,
      sourceInstanceId: "inst-arch-practicum",
      targetInstanceId: "inst-junction-network-ib",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "для клиентов PT",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    // Branches: junction → 3 courses (AF, NGFW, Sandbox)
    {
      id: "edge-junction-af-network-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-network-ib",
      targetInstanceId: "inst-af-course",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    {
      id: "edge-junction-ngfw-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-network-ib",
      targetInstanceId: "inst-ngfw-course",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    {
      id: "edge-junction-sandbox-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-junction-network-ib",
      targetInstanceId: "inst-sandbox-course",
      sourceHandleId: "right",
      targetHandleId: "left",
      edgeType: "installed_base",
      direction: "forward",
      label: "",
      isPublic: true,
      scenarioTags: ["Сетевая защита"],
      controlPoints: []
    },
    // ── VM: modules → practicum → course ────────────────────────────────────
    {
      id: "edge-am-vm-practicum",
      mapId: MAP_ID,
      sourceInstanceId: "inst-am-module",
      targetInstanceId: "inst-vm-practicum",
      edgeType: "primary",
      direction: "forward",
      label: "быстрый вход",
      isPublic: true,
      scenarioTags: ["VM"],
      controlPoints: []
    },
    {
      id: "edge-vmmodule-vm-practicum",
      mapId: MAP_ID,
      sourceInstanceId: "inst-vm-module",
      targetInstanceId: "inst-vm-practicum",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["VM"],
      controlPoints: []
    },
    {
      id: "edge-vm-practicum-course",
      mapId: MAP_ID,
      sourceInstanceId: "inst-vm-practicum",
      targetInstanceId: "inst-vm-course",
      edgeType: "installed_base",
      direction: "forward",
      label: "для клиентов PT",
      isPublic: true,
      scenarioTags: ["VM"],
      controlPoints: []
    },
    // ── OT ──────────────────────────────────────────────────────────────────
    {
      id: "edge-otmodule-otpracticum",
      mapId: MAP_ID,
      sourceInstanceId: "inst-ot-module",
      targetInstanceId: "inst-ot-practicum",
      edgeType: "primary",
      direction: "forward",
      label: "апгрейд в практикум",
      isPublic: true,
      scenarioTags: ["OT"],
      controlPoints: []
    },
    {
      id: "edge-otpracticum-otcourse",
      mapId: MAP_ID,
      sourceInstanceId: "inst-ot-practicum",
      targetInstanceId: "inst-ot-course",
      edgeType: "installed_base",
      direction: "forward",
      label: "для клиентов PT",
      isPublic: true,
      scenarioTags: ["OT"],
      controlPoints: []
    },
    // ── AppSec ───────────────────────────────────────────────────────────────
    {
      id: "edge-sast-appsec",
      mapId: MAP_ID,
      sourceInstanceId: "inst-sast-module",
      targetInstanceId: "inst-appsec-engineers",
      edgeType: "primary",
      direction: "forward",
      label: "быстрый вход",
      isPublic: true,
      scenarioTags: ["AppSec"],
      controlPoints: []
    },
    {
      id: "edge-devsecops-appsec",
      mapId: MAP_ID,
      sourceInstanceId: "inst-devsecops-module",
      targetInstanceId: "inst-appsec-engineers",
      edgeType: "optional",
      direction: "forward",
      label: "углубление",
      isPublic: true,
      scenarioTags: ["AppSec"],
      controlPoints: []
    },
    // ── Cross-domain: practicum → leadership ─────────────────────────────────
    {
      id: "edge-l1-socbuild",
      mapId: MAP_ID,
      sourceInstanceId: "inst-l1-practicum",
      targetInstanceId: "inst-soc-build",
      edgeType: "primary",
      direction: "forward",
      label: "после практикума",
      isPublic: true,
      scenarioTags: ["SOC", "Руководители"],
      controlPoints: []
    },
    {
      id: "edge-appsec-leaders",
      mapId: MAP_ID,
      sourceInstanceId: "inst-appsec-engineers",
      targetInstanceId: "inst-appsec-leaders",
      edgeType: "optional",
      direction: "forward",
      label: "после практикума",
      isPublic: true,
      scenarioTags: ["AppSec", "Руководители"],
      controlPoints: []
    }
  ]
};

const mapRecord: MapRecord = snapshot.map;

const version: MapVersion = {
  id: "version-1",
  mapId: MAP_ID,
  version: 1,
  status: "published",
  snapshotJson: snapshot,
  createdBy: "seed",
  createdAt: now
};

export function createSeedStore(): AppStore {
  return {
    maps: [mapRecord],
    drafts: {
      [MAP_ID]: snapshot
    },
    versions: [version]
  };
}
