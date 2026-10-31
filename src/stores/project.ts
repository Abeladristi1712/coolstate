"use client";
import { create } from "zustand";
import type { ProjectSnapshot, Scenario, SiteId } from "@/domain/types";
import { getSite } from "@/lib/data/sites";
import { STORAGE_KEY, validateSnapshot } from "@/lib/persistence/project";
interface ProjectStore {
  siteId: SiteId; projectName: string; scenarios: Scenario[]; activeScenario: string; selectedBuilding: string | null; dirty: boolean; savedAt: string | null; notice: string | null;
  selectBuilding: (id: string | null)=>void; selectScenario: (id:string)=>void; setSite: (id:SiteId,name?:string)=>void;
  setHeight: (id:string,height:number)=>void; addScenario: (name?:string,strategy?:string)=>void; save: ()=>void; restore: ()=>void; importProject: (value:unknown)=>void; notify:(message:string|null)=>void;
}
const baseline = (): Scenario => ({ id:"baseline",name:"Base case",heights:{},strategies:[] });
export const useProject = create<ProjectStore>((set,get)=>({
  siteId:"tampines", projectName:"Tampines neighbourhood",scenarios:[baseline()],activeScenario:"baseline",selectedBuilding:null,dirty:false,savedAt:null,notice:null,
  selectBuilding: id=>set({selectedBuilding:id}),
  selectScenario: id=> { if(get().scenarios.some(s=>s.id===id)) set({activeScenario:id,dirty:true}); },
  setSite: (id,name)=>set({siteId:id,projectName:name?.trim() || `${getSite(id).name} neighbourhood`,scenarios:[baseline()],activeScenario:"baseline",selectedBuilding:null,dirty:true,savedAt:null,notice:"Sample project created. Geometry is illustrative."}),
  setHeight: (id,height)=> {
    if(!/^building-([1-9]|1[0-6])$/.test(id) || !Number.isFinite(height) || height<3 || height>120)return;
    if(get().activeScenario==="baseline") get().addScenario("Design option 1");
    const current = get().activeScenario;
    set(state=>({scenarios:state.scenarios.map(s=>s.id===current?{...s,heights:{...s.heights,[id]:height}}:s),dirty:true}));
  },
  addScenario:(name,strategy)=>{
    const state=get(); if(state.scenarios.length>=20){set({notice:"This prototype supports up to 20 scenarios."});return;}
    const source=state.scenarios.find(s=>s.id===state.activeScenario)!;
    const id=crypto.randomUUID();
    set({scenarios:[...state.scenarios,{id,name:name??`Design option ${state.scenarios.length}`,heights:{...source.heights},strategies:strategy?[...source.strategies,strategy]:[...source.strategies]}],activeScenario:id,dirty:true,notice:strategy?"Strategy saved to a new scenario. Geometry and thermal effects have not been changed.":"Scenario created. Your base case is preserved."});
  },
  save:()=>{try{const snapshot=getSnapshot();localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot));set({dirty:false,savedAt:snapshot.savedAt,notice:"Project saved in this browser."});}catch{set({notice:"Unable to save in this browser. Download a project backup from Report & Export."});}},
  restore:()=>{try{const text=localStorage.getItem(STORAGE_KEY);if(text){const v=validateSnapshot(JSON.parse(text));set({...v,dirty:false,selectedBuilding:null});}}catch{set({notice:"The saved project could not be read. The sample project is still available."});}},
  importProject:value=>{const v=validateSnapshot(value);set({...v,dirty:true,selectedBuilding:null,notice:"Project restored. Save to keep it in this browser."});},
  notify:notice=>set({notice})
}));
export function getSnapshot(): ProjectSnapshot { const s=useProject.getState();return {schemaVersion:1,siteId:s.siteId,projectName:s.projectName,scenarios:s.scenarios,activeScenario:s.activeScenario,savedAt:new Date().toISOString(),provenance:"DEMO"}; }
