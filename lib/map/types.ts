export type ProductType =
  | "module"
  | "practicum"
  | "sprint"
  | "intensive"
  | "product_course"
  | "management_course"
  | "junction";

export type EdgeType =
  | "primary"
  | "optional"
  | "installed_base";
export type MapStatus = "draft" | "published" | "archived";
export type LocaleCode = "ru" | "en";
export type ColumnId = "module" | "practicum" | "product_course";
export type EdgeHandleId = "left" | "right" | "top" | "bottom";

export type Product = {
  id: string;
  title: string;
  shortTitle: string;
  productType: ProductType;
  domainTags: string[];
  audienceTags: string[];
  goalTags: string[];
  shortOutcome: string;
  description: string;
  durationValue: number;
  durationUnit: "weeks" | "months" | "hours";
  accessModel: string;
  owner: string;
  status: "active" | "draft";
  publicVisible: boolean;
  exclusiveResultFlag: boolean;
  conflictRiskLevel: "low" | "medium" | "high";
  relatedPtProducts: string[];
  locale: LocaleCode;
  ctaLabel?: string;
  implementationYear?: number;
  securityDomainIds?: string[];
};

export type MapRecord = {
  id: string;
  name: string;
  locale: LocaleCode;
  status: MapStatus;
  version: number;
  publishedAt: string | null;
  publishedVersionId: string | null;
};

export type Lane = {
  id: string;
  mapId: string;
  title: string;
  order: number;
  height: number;
  colorToken: string;
  audience?: string;
};

export type ProductInstance = {
  id: string;
  mapId: string;
  productId: string;
  laneId: string;
  columnId: ColumnId;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  publicOverrideTitle?: string;
  publicOverrideDescription?: string;
  isLocked: boolean;
  isVisible: boolean;
};

export type EdgeControlPoint = {
  x: number;
  y: number;
};

export type EdgeRecord = {
  id: string;
  mapId: string;
  sourceInstanceId: string;
  targetInstanceId: string;
  sourceHandleId?: EdgeHandleId;
  targetHandleId?: EdgeHandleId;
  edgeType: EdgeType;
  direction: "forward" | "backward" | "bidirectional";
  label: string;
  reverseLabel?: string;
  isPublic: boolean;
  scenarioTags: string[];
  controlPoints: EdgeControlPoint[];
};

export type MapSnapshot = {
  map: MapRecord;
  lanes: Lane[];
  products: Product[];
  instances: ProductInstance[];
  edges: EdgeRecord[];
  ecosystemLinks?: EcosystemLink[];
};

export type EcosystemLink = {
  id: string;
  sourceId: string;
  targetId: string;
  kind: "practice" | "intensive" | "product";
  status: "confirmed" | "proposed";
  note: string;
};

export type MapVersion = {
  id: string;
  mapId: string;
  version: number;
  status: MapStatus;
  snapshotJson: MapSnapshot;
  createdBy: string;
  createdAt: string;
  message?: string;
};

export type AppStore = {
  catalogSchemaVersion?: number;
  ecosystemSchemaVersion?: number;
  maps: MapRecord[];
  drafts: Record<string, MapSnapshot>;
  draftRevisions?: Record<string, number>;
  versions: MapVersion[];
};

export type ProductFilterState = {
  domain: string;
  audience: string;
  goal: string;
  productType: string;
  primaryOnly: boolean;
};
