import published from "@/data/published-catalog.json";
import { deepClone } from "@/lib/map/utils";
import type { MapSnapshot } from "@/lib/map/types";

const catalog=published as {mapId:string;revision:number;snapshot:MapSnapshot};

export function getPublishedMapId(){return catalog.mapId;}
export function getPublishedCatalog(mapId=catalog.mapId){
  return mapId===catalog.mapId?{snapshot:deepClone(catalog.snapshot),revision:catalog.revision}:undefined;
}
