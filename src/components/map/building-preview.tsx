"use client";
import { useEffect, useRef, useState } from "react";
import { Map as LibreMap, type GeoJSONSource } from "maplibre-gl";
import { Building2, RotateCcw, RotateCw, X } from "lucide-react";
import type { MappedBuilding } from "@/lib/geometry/mapped-building";
import { configureMapWorker } from "@/lib/map-runtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function BuildingPreview({building,onClose}:{building:MappedBuilding;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),container=useRef<HTMLDivElement>(null),map=useRef<LibreMap|null>(null);
  const [height,setHeight]=useState(building.displayHeight),[ready,setReady]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const [overridden,setOverridden]=useState(false);
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    const focused=document.activeElement instanceof HTMLElement?document.activeElement:null;
    element.showModal();return ()=>{element.close();focused?.focus();};
  },[]);
  useEffect(()=>{
    if(!container.current)return;
    configureMapWorker();let m:LibreMap;
    try {
      m=new LibreMap({container:container.current,center:building.center,zoom:18,pitch:55,bearing:-25,minZoom:12,maxZoom:22,attributionControl:false,
        style:{version:8,sources:{building:{type:"geojson",data:{...building.feature,properties:{height:building.displayHeight}}}},layers:[
          {id:"background",type:"background",paint:{"background-color":"#e9eee3"}},
          {id:"footprint",type:"fill",source:"building",paint:{"fill-color":"#b4c6a6"}},
          {id:"volume",type:"fill-extrusion",source:"building",paint:{"fill-extrusion-color":"#8cae99","fill-extrusion-height":["get","height"],"fill-extrusion-opacity":1,"fill-extrusion-vertical-gradient":true}}
        ]},canvasContextAttributes:{antialias:true}});
      map.current=m;
      m.on("load",()=>{
        m.setLight({anchor:"viewport",color:"#fffcec",intensity:.45,position:[1.5,180,40]});
        m.fitBounds(building.bounds,{padding:{top:95,bottom:40,left:65,right:65},maxZoom:previewZoom(building.displayHeight,building.center[1]),pitch:55,bearing:-25,duration:0});
        setReady(true);
      });
      m.on("error",()=>setError(true));
    } catch {queueMicrotask(()=>setError(true));return;}
    const observer=new ResizeObserver(()=>m.resize());observer.observe(container.current);
    return ()=>{observer.disconnect();m.remove();map.current=null;};
  },[building,attempt]);
  useEffect(()=>{if(ready&&map.current){
    (map.current.getSource("building") as GeoJSONSource)?.setData({...building.feature,properties:{height}});
    const limit=previewZoom(height,building.center[1]);
    if(map.current.getZoom()>limit)map.current.easeTo({zoom:limit,duration:200});
  }},[height,ready,building]);
  return <dialog ref={dialog} className="building-dialog" aria-labelledby="building-preview-title" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose();}}>
    <div className="building-dialog-header"><div><div className="eyebrow">SELECTED BUILDING · SINGAPORE VIEW</div><h2 id="building-preview-title"><Building2 size={21}/>{building.name}</h2></div><button className="icon-button" aria-label="Close building preview" onClick={onClose}><X size={19}/></button></div>
    <div className="building-render"><div className="building-render-canvas" ref={container} aria-label="Interactive 3D rendering of the selected mapped footprint"/>
      {!ready&&!error&&<span className="render-state" role="status">Rendering selected footprint…</span>}
      {error&&<div className="render-state" role="alert">3D rendering could not load. The building details remain available.<Button size="sm" variant="outline" onClick={()=>{setError(false);setReady(false);setAttempt(attempt+1);}}>Retry rendering</Button></div>}
      <Badge tone="green">3D MASSING PREVIEW</Badge><div className="render-controls"><button aria-label="Rotate building left" onClick={()=>map.current?.rotateTo((map.current?.getBearing()??0)-45,{duration:450})}><RotateCcw size={16}/></button><button aria-label="Rotate building right" onClick={()=>map.current?.rotateTo((map.current?.getBearing()??0)+45,{duration:450})}><RotateCw size={16}/></button></div>
      <span className="render-instruction">Drag to explore · right-drag to rotate · scroll to zoom</span>
    </div>
    <div className="building-preview-details"><div className="building-provenance"><Badge tone="green">IMPORTED FOOTPRINT</Badge><span>© OpenStreetMap contributors · OpenFreeMap / OpenMapTiles</span></div>
      <label className="field-label" htmlFor="preview-height">Preview height <strong>{height.toFixed(1)} m</strong></label><input id="preview-height" type="range" min="1" max="500" step="1" value={height} onChange={e=>{setHeight(Number(e.target.value));setOverridden(true);}}/>
      <p className="height-source">{overridden?"ASSUMED · your preview-only height override":building.heightOrigin==="provider"?"IMPORTED display height · may be estimated/defaulted by the provider; not a measured height":"ASSUMED · 12 m fallback because no usable display height was provided"}</p>
      <div className="building-detail-grid"><div><span>Coordinates</span><strong>{building.center[1].toFixed(5)}° N, {building.center[0].toFixed(5)}° E</strong></div><div><span>Tile feature ID</span><strong>{building.sourceId??"Not supplied"}</strong></div></div>
      <p className="building-limitations">This renders the selected map footprint, including available holes and parts. Vector-tile geometry can be clipped or simplified. It is not a photorealistic façade, survey model or thermal simulation. Preview changes do not modify your sample design project.</p>
      <div className="building-preview-actions"><Button variant="outline" onClick={()=>{setHeight(building.displayHeight);setOverridden(false);}}>Reset height</Button><Button onClick={onClose}>Back to Singapore map</Button></div>
    </div>
  </dialog>;
}

// Display-only camera framing: allow the projected height to fit in the preview.
function previewZoom(height:number,latitude:number){return Math.min(19.5,Math.log2(78271.52*Math.cos(latitude*Math.PI/180)/(Math.max(height,1)/145)));}
