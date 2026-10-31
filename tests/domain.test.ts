import test from "node:test";
import assert from "node:assert/strict";
import { SITES, SINGAPORE_BOUNDS } from "../src/lib/data/sites.ts";
import { createEstate, estateMetrics } from "../src/lib/geometry/estate.ts";
import { validateSnapshot } from "../src/lib/persistence/project.ts";
import { mappedBuilding } from "../src/lib/geometry/mapped-building.ts";
import type { Feature, Polygon, MultiPolygon } from "geojson";

test("all four Singapore presets contain only bounded, closed DEMO geometry",()=>{
  for(const site of SITES){const estate=createEstate(site);assert.equal(estateMetrics(estate).buildingCount,16);
    for(const f of estate.features){assert.equal(f.properties.provenance,"DEMO");const ring=f.geometry.coordinates[0];assert.deepEqual(ring[0],ring.at(-1));for(const [lon,lat] of ring){assert.ok(lon>=SINGAPORE_BOUNDS[0][0]&&lon<=SINGAPORE_BOUNDS[1][0]);assert.ok(lat>=SINGAPORE_BOUNDS[0][1]&&lat<=SINGAPORE_BOUNDS[1][1]);}}
  }
});
test("height overrides change the design option without mutating the baseline or plan area",()=>{
  const base=createEstate(SITES[0]),changed=createEstate(SITES[0],{"building-1":90});
  assert.equal(base.features.find(f=>f.properties.id==="building-1")!.properties.height,42);
  assert.equal(changed.features.find(f=>f.properties.id==="building-1")!.properties.height,90);
  const a=estateMetrics(base),b=estateMetrics(changed);assert.equal(a.buildingArea,b.buildingArea);assert.equal(b.meanHeight-a.meanHeight,3);assert.ok(Math.abs(a.siteArea-184500)<1500);assert.ok(a.composition.every(x=>x.value>=0));assert.ok(Math.abs(a.composition.reduce((s,x)=>s+x.value,0)-a.siteArea)<.01);
});
const snapshot=()=>({schemaVersion:1,siteId:"tampines",projectName:"Test",scenarios:[{id:"baseline",name:"Base case",heights:{},strategies:[]}],activeScenario:"baseline",savedAt:"2026-10-31T00:00:00.000Z",provenance:"DEMO"});
test("backup validation rejects non-Singapore sites and modified baselines",()=>{
  assert.equal(validateSnapshot(snapshot()).siteId,"tampines");assert.throws(()=>validateSnapshot({...snapshot(),siteId:"london"}));
  const modified=snapshot();modified.scenarios[0].heights={"building-1":90};assert.throws(()=>validateSnapshot(modified));
});
test("backup validation rejects invalid height data and duplicate scenario IDs",()=>{
  const s=snapshot();s.scenarios.push({id:"option",name:"Option",heights:{"building-1":999},strategies:[]});assert.throws(()=>validateSnapshot(s));
  const duplicate=snapshot();duplicate.scenarios.push(duplicate.scenarios[0]);assert.throws(()=>validateSnapshot(duplicate));
});
test("unknown backup fields cannot overwrite client store actions",()=>{
  const result=validateSnapshot({...snapshot(),save:"overwrite",selectedBuilding:"arbitrary"});
  assert.equal(Object.hasOwn(result,"save"),false);assert.equal(Object.hasOwn(result,"selectedBuilding"),false);
});
const mappedFixture = (): Feature<Polygon> => ({type:"Feature",id:42,properties:{render_height:33,name:"Test building"},geometry:{type:"Polygon",coordinates:[[[103.85,1.3],[103.851,1.3],[103.851,1.301],[103.85,1.301],[103.85,1.3]]]}});
test("mapped buildings preserve imported footprints and distinguish rendering height sources",()=>{
  const feature=mappedFixture(),building=mappedBuilding(feature)!;
  assert.equal(building.sourceId,"42");assert.equal(building.displayHeight,33);assert.equal(building.heightOrigin,"provider");
  assert.equal(building.feature.properties?.provenance,"IMPORTED");assert.deepEqual(building.feature.geometry,feature.geometry);
  building.feature.geometry.coordinates[0][0]=[0,0];assert.deepEqual(feature.geometry.coordinates[0][0],[103.85,1.3]);
  feature.properties={};const assumed=mappedBuilding(feature)!;assert.equal(assumed.heightOrigin,"assumed");assert.equal(assumed.displayHeight,12);
  feature.properties={render_height:-15};assert.equal(mappedBuilding(feature)!.heightOrigin,"assumed");
});
test("mapped building preview preserves multipolygons and courtyard holes",()=>{
  const ring=mappedFixture().geometry.coordinates[0];
  const hole=[[103.8502,1.3002],[103.8502,1.3005],[103.8505,1.3005],[103.8505,1.3002],[103.8502,1.3002]];
  const feature:Feature<MultiPolygon>={type:"Feature",properties:{},geometry:{type:"MultiPolygon",coordinates:[[ring,hole],[ring]]}};
  assert.deepEqual(mappedBuilding(feature)!.feature.geometry,feature.geometry);
});
test("mapped building normalization rejects malformed and out-of-region footprints",()=>{
  assert.equal(mappedBuilding({type:"Feature",properties:{},geometry:{type:"Point",coordinates:[103.85,1.3]}}),null);
  const broken=mappedFixture();broken.geometry.coordinates[0][0]=[NaN,1.3];assert.equal(mappedBuilding(broken),null);
  const outside=mappedFixture();outside.geometry.coordinates[0]=outside.geometry.coordinates[0].map(([x,y])=>[x-100,y]);assert.equal(mappedBuilding(outside),null);
  const open=mappedFixture();open.geometry.coordinates[0].pop();assert.equal(mappedBuilding(open),null);
});
