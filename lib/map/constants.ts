import type { ColumnId } from "@/lib/map/types";

export const MAP_ID = "edtechlab-main-map";
export const LANE_HEIGHT = 620;
export const LANE_GAP = 32;
export const MAP_TOP_PADDING = 84;
export const COLUMN_WIDTH = 320;
export const NODE_SMALL_HEIGHT = 148;
export const NODE_MEDIUM_HEIGHT = 176;
export const NODE_LARGE_HEIGHT = 208;

export const COLUMNS: Array<{ id: ColumnId; title: string; subtitle: string; x: number; width: number }> = [
  { id: "module", title: "Модули EdTech Lab", subtitle: "самостоятельный вход", x: 60, width: COLUMN_WIDTH },
  { id: "practicum", title: "Практикумы", subtitle: "ролевой результат", x: 500, width: 380 },
  { id: "product_course", title: "Курсы эксплуатации", subtitle: "value от PT-стека", x: 1020, width: COLUMN_WIDTH }
];
