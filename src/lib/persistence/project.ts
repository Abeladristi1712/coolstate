import type { ProjectSnapshot } from "../../domain/types.ts";
const siteIds = new Set(["tampines","jurong","bishan","kallang"]);
export const STORAGE_KEY = "coolestate-ui-project-v1";
export function validateSnapshot(value: unknown): ProjectSnapshot {
  if (!value || typeof value !== "object") throw new Error("This is not a CoolEstate project.");
  const v = value as ProjectSnapshot;
  if (v.schemaVersion !== 1 || v.provenance !== "DEMO" || !siteIds.has(v.siteId) || typeof v.projectName !== "string" || v.projectName.length > 100 || typeof v.savedAt !== "string" || !Number.isFinite(Date.parse(v.savedAt)) || !Array.isArray(v.scenarios) || !v.scenarios.length || v.scenarios.length>20) throw new Error("Unsupported or invalid project file.");
  const ids = new Set<string>();
  for (const s of v.scenarios) {
    if (!s || typeof s.id !== "string" || s.id.length>100 || ids.has(s.id) || typeof s.name !== "string" || s.name.length>100 || !s.heights || typeof s.heights!=="object" || Array.isArray(s.heights) || !Array.isArray(s.strategies) || s.strategies.length>30 || s.strategies.some(x => typeof x !== "string" || x.length>200)) throw new Error("Invalid scenario data.");
    ids.add(s.id);
    for (const [key,height] of Object.entries(s.heights)) if (!/^building-([1-9]|1[0-6])$/.test(key) || !Number.isFinite(height) || height<3 || height>120) throw new Error("Building height must be between 3 and 120 metres.");
  }
  if (!ids.has(v.activeScenario) || v.scenarios[0].id!=="baseline" || Object.keys(v.scenarios[0].heights).length || v.scenarios[0].strategies.length) throw new Error("The sample baseline must remain unchanged.");
  // Whitelist fields: untrusted backups must never overwrite store actions/state.
  return { schemaVersion:1, siteId:v.siteId, projectName:v.projectName, activeScenario:v.activeScenario,
    savedAt:v.savedAt, provenance:"DEMO", scenarios:v.scenarios.map(s=>({id:s.id,name:s.name,heights:{...s.heights},strategies:[...s.strategies]})) };
}
export function downloadFile(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
