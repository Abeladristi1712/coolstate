import area from "@turf/area";
import type { Feature, Polygon } from "geojson";
import type { EstateCollection, EstateKind, EstateProperties, Site } from "../../domain/types.ts";

// Deliberately synthetic estate. Positions are local metres around a Singapore preset.
// Conversion is for a small visual fixture, not a survey or simulation projection.
export function createEstate(site: Site, heights: Record<string, number> = {}): EstateCollection {
  const features: Feature<Polygon, EstateProperties>[] = [];
  const coord = (x: number, y: number) => [site.center[0] + x / (111320 * Math.cos(site.center[1] * Math.PI / 180)), site.center[1] + y / 111320];
  const polygon = (id: string, name: string, kind: EstateKind, points: number[][], height = 0) => {
    const ring = points.map(([x, y]) => coord(x, y));
    features.push({ type: "Feature", id, properties: { id, name, kind, height: heights[id] ?? height, provenance: "DEMO" }, geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] } });
  };
  const rect = (id: string, name: string, kind: EstateKind, x: number, y: number, w: number, h: number, height = 0) => polygon(id, name, kind, [[x,y],[x+w,y],[x+w,y+h],[x,y+h]], height);
  rect("boundary", "Study boundary", "boundary", -225, -205, 450, 410);
  rect("park-1", "Neighbourhood garden", "park", -70, -70, 140, 140);
  rect("park-2", "Green corridor", "park", -205, 165, 410, 24);
  rect("road-1", "Estate avenue", "road", -265, -245, 530, 20);
  rect("road-2", "Neighbourhood street", "road", -265, 225, 530, 20);
  rect("road-3", "Estate access", "road", -265, -245, 20, 490);
  rect("road-4", "Neighbourhood street", "road", 245, -245, 20, 490);
  rect("path-1", "East–west connection", "path", -220, -7, 440, 14);
  rect("path-2", "North–south connection", "path", -7, -200, 14, 400);
  const buildings = [
    [-194,-170,60,22,42],[-105,-170,60,22,48],[30,-170,60,22,39],[124,-170,60,22,54],
    [-190,-105,24,62,42],[-121,-107,24,62,36],[100,-107,24,62,48],[171,-105,24,62,42],
    [-190,40,24,62,51],[-121,40,24,62,42],[100,40,24,62,36],[171,40,24,62,48],
    [-194,125,60,22,45],[-105,125,60,22,39],[30,125,60,22,54],[124,125,60,22,42],
  ];
  buildings.forEach(([x,y,w,h,z], i) => rect(`building-${i+1}`, `Block ${String(801+i)}${i%3 === 0 ? "A" : ""}`, "building", x,y,w,h,z));
  for (let i=0; i<58; i++) {
    const angle = i * 2.399963;
    const radius = 14 + Math.sqrt(i / 58) * 48;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (Math.abs(x)<11 || Math.abs(y)<11) continue;
    const r = 4 + (i%3);
    polygon(`tree-${i}`, "Illustrative canopy", "tree", Array.from({length:12}, (_,j) => [x+Math.cos(j*Math.PI/6)*r,y+Math.sin(j*Math.PI/6)*r]), 7+i%4);
  }
  for (let i=0;i<20;i++) polygon(`edge-tree-${i}`, "Illustrative canopy", "tree", Array.from({length:12}, (_,j) => [-195+i*20+Math.cos(j*Math.PI/6)*5,177+Math.sin(j*Math.PI/6)*5]),8);
  return { type: "FeatureCollection", features };
}
export function estateMetrics(collection: EstateCollection) {
  const buildings = collection.features.filter(f => f.properties.kind === "building");
  const boundary = collection.features.find(f => f.properties.kind === "boundary")!;
  const siteArea = area(boundary);
  const buildingArea = buildings.reduce((sum,f) => sum + area(f),0);
  const greenArea = collection.features.filter(f => f.properties.kind === "park").reduce((sum,f)=>sum+area(f),0);
  return { siteArea, buildingArea, greenArea, buildingCount: buildings.length, meanHeight: buildings.reduce((sum,f)=>sum+f.properties.height,0)/buildings.length,
    composition: [{ name: "Building footprints", value: buildingArea, color: "#365d50" },{ name: "Green spaces", value: greenArea, color: "#91ad83" },{ name: "Other site area", value: siteArea-buildingArea-greenArea, color: "#e0e7dc" }] };
}
