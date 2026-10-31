"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import { Compass, Layers3, Minus, Plus, RotateCcw, Table2, Map as MapIcon, Maximize2, Trees, Building2 } from "lucide-react";
import { useProject } from "@/stores/project";
import { getSite, SINGAPORE_BOUNDS } from "@/lib/data/sites";
import { createEstate } from "@/lib/geometry/estate";
import { EstateIllustration } from "./estate-illustration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { configureMapWorker } from "@/lib/map-runtime";

export function EstateMap({editor=false}:{editor?:boolean}) {
  const container=useRef<HTMLDivElement>(null), wrapper=useRef<HTMLDivElement>(null), map=useRef<maplibregl.Map|null>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState(false),[table,setTable]=useState(false),[is3d,set3d]=useState(true),[green,setGreen]=useState(true),[buildings,setBuildings]=useState(true);
  const siteId=useProject(s=>s.siteId),scenarios=useProject(s=>s.scenarios),active=useProject(s=>s.activeScenario),selected=useProject(s=>s.selectedBuilding);
  const site=getSite(siteId),scenario=scenarios.find(s=>s.id===active)!;
  const estate=useMemo(()=>createEstate(site,scenario.heights),[site,scenario.heights]);
  const latest=useRef(estate); useEffect(()=>{latest.current=estate;},[estate]);
  useEffect(()=>{
    if(!container.current)return;
    let m: maplibregl.Map;
    try {
      configureMapWorker();
      m=new maplibregl.Map({container:container.current,center:getSite(useProject.getState().siteId).center,zoom:16.65,pitch:49,bearing:-23,maxBounds:SINGAPORE_BOUNDS,minZoom:11,maxZoom:20,attributionControl:false,
        style:{version:8,sources:{},layers:[{id:"background",type:"background",paint:{"background-color":"#e9ecdf"}}]},canvasContextAttributes:{antialias:true}});
      map.current=m;
      m.on("load",()=>{
        m.addSource("estate",{type:"geojson",data:latest.current});
        m.addLayer({id:"site",type:"fill",source:"estate",filter:["==",["get","kind"],"boundary"],paint:{"fill-color":"#f0f0e4"}});
        m.addLayer({id:"roads",type:"fill",source:"estate",filter:["==",["get","kind"],"road"],paint:{"fill-color":"#fcfcf4"}});
        m.addLayer({id:"parks",type:"fill",source:"estate",filter:["==",["get","kind"],"park"],paint:{"fill-color":"#c1d2ab"}});
        m.addLayer({id:"paths",type:"fill",source:"estate",filter:["==",["get","kind"],"path"],paint:{"fill-color":"#e1d8bf"}});
        m.addLayer({id:"boundary",type:"line",source:"estate",filter:["==",["get","kind"],"boundary"],paint:{"line-color":"#527764","line-width":1.6,"line-dasharray":[4,3]}});
        m.addLayer({id:"trees",type:"fill-extrusion",source:"estate",filter:["==",["get","kind"],"tree"],paint:{"fill-extrusion-color":"#86a472","fill-extrusion-height":["get","height"],"fill-extrusion-opacity":.94}});
        m.addLayer({id:"buildings",type:"fill-extrusion",source:"estate",filter:["==",["get","kind"],"building"],paint:{"fill-extrusion-color":"#d8dfd3","fill-extrusion-height":["get","height"],"fill-extrusion-opacity":1,"fill-extrusion-vertical-gradient":true}});
        m.setLight({anchor:"viewport",color:"#fffef0",intensity:.4,position:[1.5,150,40]});
        m.on("click","buildings",event=>{const id=event.features?.[0]?.properties?.id;if(typeof id==="string")useProject.getState().selectBuilding(id);});
        m.on("mouseenter","buildings",()=>{m.getCanvas().style.cursor="pointer";});
        m.on("mouseleave","buildings",()=>{m.getCanvas().style.cursor="";});
        setReady(true);
      });
      m.on("error",()=>setError(true));
    } catch { queueMicrotask(()=>setError(true)); return; }
    const observer=new ResizeObserver(()=>m.resize()); observer.observe(container.current);
    return ()=>{observer.disconnect();m.remove();map.current=null;};
  },[]);
  useEffect(()=>{if(ready&&map.current){(map.current.getSource("estate") as GeoJSONSource).setData(estate);map.current.easeTo({center:site.center,duration:600});}},[estate,site,ready]);
  useEffect(()=>{if(ready&&map.current){map.current.setPaintProperty("buildings","fill-extrusion-color",["case",["==",["get","id"],selected??""],"#527e6c","#d8dfd3"]);}},[selected,ready]);
  function perspective(value:boolean){set3d(value);map.current?.easeTo({pitch:value?49:0,bearing:value?-23:0,duration:600});}
  function layer(kind:"green"|"buildings") {const m=map.current;if(!ready||!m)return;if(kind==="green"){["trees","parks"].forEach(id=>m.setLayoutProperty(id,"visibility",green?"none":"visible"));setGreen(!green);}else{m.setLayoutProperty("buildings","visibility",buildings?"none":"visible");setBuildings(!buildings);}}
  return <div className="map-widget" ref={wrapper}>
    <div className="map-bar"><div className="map-title"><MapIcon size={16}/><strong>{site.name} study area</strong><Badge tone="demo">DEMO GEOMETRY</Badge></div><div className="segmented"><button aria-pressed={!table} onClick={()=>setTable(false)}><MapIcon size={14}/>Map</button><button aria-pressed={table} onClick={()=>setTable(true)}><Table2 size={14}/>Data</button></div></div>
    <div className={`map-body ${table?"show-table":""}`}>
      <div ref={container} className="map-canvas" aria-label={`Interactive illustrative estate in ${site.name}, Singapore`}/>
      {!ready&&<div className="map-fallback"><EstateIllustration/><span>{error?"3D map unavailable · use the Data tab to explore buildings":"Preparing your estate view…"}</span></div>}
      {!table&&<><div className="map-tools"><div className="segmented raised"><button aria-pressed={!is3d} onClick={()=>perspective(false)}>2D</button><button aria-pressed={is3d} onClick={()=>perspective(true)}>3D</button></div><button className="map-tool" title="Reset map view" aria-label="Reset map view" onClick={()=>map.current?.easeTo({center:site.center,zoom:16.65,pitch:is3d?49:0,bearing:is3d?-23:0})}><RotateCcw size={16}/></button></div>
      <div className="map-north"><Compass size={28}/><span>N</span></div>
      <div className="map-place"><span className="live-dot"/> SINGAPORE <span> / </span> {site.name.toUpperCase()}</div>
      <div className="map-zoom"><button aria-label="Zoom in" onClick={()=>map.current?.zoomIn()}><Plus size={17}/></button><button aria-label="Zoom out" onClick={()=>map.current?.zoomOut()}><Minus size={17}/></button><button aria-label="Toggle full screen" onClick={()=>{if(document.fullscreenElement){void document.exitFullscreen();}else{void wrapper.current?.requestFullscreen().catch(()=>useProject.getState().notify("Full screen is unavailable in this browser."));}}}><Maximize2 size={16}/></button></div>
      <div className="map-layers"><Layers3 size={15}/><button aria-pressed={buildings} onClick={()=>layer("buildings")}><Building2 size={14}/> Buildings</button><button aria-pressed={green} onClick={()=>layer("green")}><Trees size={14}/> Green spaces</button><span className="map-boundary-key"/> Site boundary</div>
      <div className="map-caption">{editor?"Select a building to explore its properties":"Drag to explore · scroll to zoom · click a building"}</div></>}
      {table&&<div className="map-table"><table><caption>Illustrative buildings · DEMO · assumed dimensions</caption><thead><tr><th>Building</th><th>Height</th><th>Source</th><th>Action</th></tr></thead><tbody>{estate.features.filter(f=>f.properties.kind==="building").map(f=><tr key={f.properties.id}><td>{f.properties.name}</td><td>{f.properties.height} m</td><td>DEMO</td><td><Button size="sm" variant="ghost" onClick={()=>{useProject.getState().selectBuilding(f.properties.id);setTable(false);}}>Select</Button></td></tr>)}</tbody></table></div>}
    </div><div className="map-footer"><span>WGS84 · {site.center[1].toFixed(4)}° N, {site.center[0].toFixed(4)}° E</span><span>Illustrative layout · not surveyed or imported from OSM</span></div>
  </div>;
}
