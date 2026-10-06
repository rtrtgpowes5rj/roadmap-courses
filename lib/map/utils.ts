import { LANE_GAP, LANE_HEIGHT, MAP_TOP_PADDING } from "@/lib/map/constants";
import type { Lane } from "@/lib/map/types";

export function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Vertical offset of a lane; used by the seed to lay out legacy instances. */
export function getLaneTop(order: number, lanes?: Lane[]) {
  if (!lanes || lanes.length === 0) {
    return MAP_TOP_PADDING + order * (LANE_HEIGHT + LANE_GAP);
  }

  const sorted = [...lanes].sort((a, b) => a.order - b.order);
  let offset = MAP_TOP_PADDING;
  for (const lane of sorted) {
    if (lane.order >= order) {
      break;
    }
    offset += lane.height + LANE_GAP;
  }
  return offset;
}
