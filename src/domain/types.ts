import type { FeatureCollection, Polygon } from "geojson";
export type PageId = "dashboard" | "setup" | "editor" | "analysis" | "design" | "compare" | "report";
export type SiteId = "tampines" | "jurong" | "bishan" | "kallang";
export type Provenance = "DEMO" | "CALCULATED" | "IMPORTED";
export type EstateKind = "building" | "park" | "path" | "tree" | "boundary" | "road";
export interface EstateProperties { id: string; name: string; kind: EstateKind; height: number; provenance: "DEMO" }
export type EstateCollection = FeatureCollection<Polygon, EstateProperties>;
export interface Site { id: SiteId; name: string; district: string; center: [number, number]; description: string; accent: string }
export interface Scenario { id: string; name: string; heights: Record<string, number>; strategies: string[] }
export interface ProjectSnapshot { schemaVersion: 1; siteId: SiteId; projectName: string; scenarios: Scenario[]; activeScenario: string; savedAt: string; provenance: "DEMO" }
