import type { Feature, Geometry, MultiPolygon, Polygon, Position } from "geojson";

export type BuildingGeometry = Polygon | MultiPolygon;
export interface MappedBuilding {
  key: string;
  name: string;
  feature: Feature<BuildingGeometry>;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  displayHeight: number;
  heightOrigin: "provider" | "assumed";
  sourceId: string | null;
}

// Mainland and nearby Singapore islands. This is a viewing extent, not a legal border.
export const SINGAPORE_VIEW: [[number, number], [number, number]] = [[103.59, 1.14], [104.12, 1.49]];
export const SINGAPORE_STYLE = "https://tiles.openfreemap.org/styles/positron";

function validRing(ring: Position[]): boolean {
  if (ring.length < 4) return false;
  return ring.every(p => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)
    && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
}

/** Normalize a displayed vector-tile footprint, never treating it as survey geometry. */
export function mappedBuilding(feature: Feature<Geometry>): MappedBuilding | null {
  if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") return null;
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  if (!polygons.length || polygons.some(p => !p.length || p.some(r => !validRing(r)))) return null;
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const polygon of polygons) for (const ring of polygon) for (const [x,y] of ring) {
    west = Math.min(west,x); east = Math.max(east,x); south = Math.min(south,y); north = Math.max(north,y);
  }
  const center: [number, number] = [(west+east)/2,(south+north)/2];
  if (center[0] < SINGAPORE_VIEW[0][0] || center[0] > SINGAPORE_VIEW[1][0] || center[1] < SINGAPORE_VIEW[0][1] || center[1] > SINGAPORE_VIEW[1][1]) return null;
  const props = feature.properties ?? {};
  const height = typeof props.render_height === "number" ? props.render_height : Number.NaN;
  const heightOrigin = Number.isFinite(height) && height > 0 && height <= 500 ? "provider" : "assumed";
  const sourceId = feature.id === undefined ? null : String(feature.id);
  const rawName = props.name ?? props["name:en"] ?? props["addr:housenumber"];
  const name = typeof rawName === "string" && rawName.trim() ? rawName.slice(0,120) : "Mapped building";
  const key = `${sourceId ?? "footprint"}:${west.toFixed(7)}:${south.toFixed(7)}:${east.toFixed(7)}:${north.toFixed(7)}`;
  const geometry = structuredClone(feature.geometry);
  return { key, name, sourceId, center, bounds:[[west,south],[east,north]], heightOrigin,
    displayHeight:heightOrigin === "provider" ? height : 12,
    feature:{type:"Feature",id:feature.id,geometry,properties:{...structuredClone(props),source:"OpenStreetMap via OpenFreeMap / OpenMapTiles",provenance:"IMPORTED",sourceId,geometryQuality:"display vector tile; may be clipped or generalized"}},
  };
}
