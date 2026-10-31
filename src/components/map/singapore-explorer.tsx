"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Map as LibreMap, type GeoJSONSource } from "maplibre-gl";
import type { Feature, Geometry } from "geojson";
import { Building2, Globe2, Map as MapIcon, Minus, Plus, RotateCcw, Search, Table2 } from "lucide-react";
import { SITES } from "@/lib/data/sites";
import { configureMapWorker } from "@/lib/map-runtime";
import { mappedBuilding, SINGAPORE_STYLE, SINGAPORE_VIEW, type MappedBuilding } from "@/lib/geometry/mapped-building";
import { BuildingPreview } from "./building-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const empty={type:"FeatureCollection" as const,features:[]};
export function SingaporeExplorer() {
  const container=useRef<HTMLDivElement>(null),map=useRef<LibreMap|null>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState<string|null>(null),[attempt,setAttempt]=useState(0),[zoom,setZoom]=useState(10),[is3d,set3d]=useState(false);
  const [selected,setSelected]=useState<MappedBuilding|null>(null),[visible,setVisible]=useState<MappedBuilding[]>([]),[table,setTable]=useState(false);
  const [location,setLocation]=useState("all");
  const select=useCallback((building:MappedBuilding)=>{
    setSelected(building);
    const source=map.current?.getSource("ce-selection") as GeoJSONSource|undefined;source?.setData(building.feature);
  },[]);
  useEffect(()=>{
    if(!container.current)return;
    configureMapWorker();let m:LibreMap;let active=true;
    try {
      m=new LibreMap({container:container.current,style:SINGAPORE_STYLE,center:[103.85,1.32],zoom:10,pitch:0,maxBounds:[[103.45,1.02],[104.23,1.59]],minZoom:8,maxZoom:20,attributionControl:false,canvasContextAttributes:{antialias:true}});
      map.current=m;
      m.fitBounds(SINGAPORE_VIEW,{padding:25,duration:0});
      m.on("load",()=>{
        if(!active)return;
        if(!m.getSource("openmaptiles")||!m.getLayer("building")){setError("The map provider changed its building layer. Please try again later.");return;}
        m.setPaintProperty("building","fill-color","#b7c8b7");m.setPaintProperty("building","fill-outline-color","#7f9a83");
        const labels=m.getStyle().layers?.find(l=>l.type==="symbol")?.id;
        m.addLayer({id:"ce-buildings-3d",type:"fill-extrusion",source:"openmaptiles","source-layer":"building",minzoom:14,layout:{visibility:"none"},paint:{"fill-extrusion-color":"#a0b6a5","fill-extrusion-height":["max",1,["to-number",["get","render_height"],12]],"fill-extrusion-base":["max",0,["to-number",["get","render_min_height"],0]],"fill-extrusion-opacity":.9}},labels);
        m.addSource("ce-selection",{type:"geojson",data:empty});
        m.addLayer({id:"ce-selection-fill",type:"fill",source:"ce-selection",paint:{"fill-color":"#245f48","fill-opacity":.45}});
        m.addLayer({id:"ce-selection-line",type:"line",source:"ce-selection",paint:{"line-color":"#245f48","line-width":3}});
        m.on("click",event=>{
          if(m.getZoom()<14){m.easeTo({center:event.lngLat,zoom:16,duration:650});return;}
          const features=m.queryRenderedFeatures(event.point,{layers:["building","ce-buildings-3d"]});
          for(const f of features){const candidate=mappedBuilding(f as Feature<Geometry>);if(candidate){select(candidate);return;}}
        });
        m.on("mousemove",event=>{m.getCanvas().style.cursor=m.getZoom()>=14&&m.queryRenderedFeatures(event.point,{layers:["building","ce-buildings-3d"]}).length?"pointer":"";});
        function updateVisible(){
          if(!active)return;
          setZoom(m.getZoom());
          if(m.getZoom()<14){setVisible([]);return;}
          const result:MappedBuilding[]=[],seen=new Set<string>();
          for(const f of m.queryRenderedFeatures(undefined,{layers:["building","ce-buildings-3d"]})){
            const b=mappedBuilding(f as Feature<Geometry>);if(!b||seen.has(b.key))continue;
            seen.add(b.key);result.push(b);if(result.length===100)break;
          }
          setVisible(result);
        }
        m.on("idle",updateVisible);m.on("moveend",updateVisible);setReady(true);setError(null);
      });
      m.on("error",()=>{if(active)setError("Some map data could not load. Check your internet connection, then retry.");});
    } catch {queueMicrotask(()=>setError("The interactive map could not start. Check that WebGL is enabled, then retry."));return;}
    const timeout=setTimeout(()=>{if(active&&!m.isStyleLoaded())setError("The Singapore map is taking too long to load. Check your connection and retry.");},20000);
    const observer=new ResizeObserver(()=>m.resize());observer.observe(container.current);
    return ()=>{active=false;clearTimeout(timeout);observer.disconnect();m.remove();map.current=null;};
  },[attempt,select]);
  function reset(){setLocation("all");set3d(false);setSelected(null);map.current?.setLayoutProperty("ce-buildings-3d","visibility","none");(map.current?.getSource("ce-selection") as GeoJSONSource|undefined)?.setData(empty);map.current?.fitBounds(SINGAPORE_VIEW,{padding:25,pitch:0,bearing:0,duration:650});}
  function chooseLocation(id:string){setLocation(id);if(id==="all"){reset();return;}const site=SITES.find(s=>s.id===id);if(site)map.current?.flyTo({center:site.center,zoom:16.2,pitch:is3d?45:0,duration:900});}
  function perspective(value:boolean){if(!ready)return;set3d(value);map.current?.setLayoutProperty("ce-buildings-3d","visibility",value?"visible":"none");map.current?.easeTo({pitch:value?48:0,bearing:value?-20:0,duration:600});}
  function retry(){setReady(false);setError(null);setVisible([]);setSelected(null);set3d(false);setLocation("all");setAttempt(attempt+1);}
  return <section className="map-widget singapore-explorer" aria-label="Singapore building explorer">
    <div className="map-bar"><div className="map-title"><Globe2 size={16}/><strong>Explore Singapore</strong><Badge tone="green">IMPORTED MAP</Badge></div><div className="segmented"><button aria-pressed={!table} onClick={()=>setTable(false)}><MapIcon size={14}/>Map</button><button aria-pressed={table} onClick={()=>setTable(true)}><Table2 size={14}/>Buildings</button></div></div>
    <div className="explorer-location"><Search size={15}/><label htmlFor="explorer-area">Go to</label><select id="explorer-area" value={location} onChange={e=>chooseLocation(e.target.value)} disabled={!ready}><option value="all">All Singapore</option>{SITES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}<option value="marina" disabled>More locations: pan and zoom the map</option></select><span>Zoom in, select a footprint, see it in 3D.</span></div>
    <div className="map-body singapore-map-body"><div className="map-canvas" ref={container} aria-label="Singapore street map with selectable OpenStreetMap building footprints"/>
      {!ready&&!error&&<div className="explorer-loading" role="status"><span className="loader"/>Loading Singapore map…</div>}
      {error&&<div className="explorer-error" role="alert"><p>{error}</p><Button variant="outline" size="sm" onClick={retry}>Retry map</Button></div>}
      {!table&&<><div className="map-tools"><div className="segmented raised"><button disabled={!ready} aria-pressed={!is3d} onClick={()=>perspective(false)}>2D</button><button disabled={!ready} aria-pressed={is3d} onClick={()=>perspective(true)}>3D</button></div><button disabled={!ready} className="map-tool" title="Show all Singapore" aria-label="Show all Singapore" onClick={reset}><RotateCcw size={16}/></button></div><div className="map-zoom"><button aria-label="Zoom in" disabled={!ready} onClick={()=>map.current?.zoomIn()}><Plus size={17}/></button><button aria-label="Zoom out" disabled={!ready} onClick={()=>map.current?.zoomOut()}><Minus size={17}/></button></div><div className="explorer-hint"><Building2 size={16}/>{zoom<14?"Choose a neighbourhood or zoom in to select a building.":"Click a green building footprint to open its 3D preview."}</div></>}
      {table&&<div className="map-table"><table><caption>Up to 100 building footprints visible in the current view. Pan or zoom the map to change this list.</caption><thead><tr><th>Building</th><th>Tile ID</th><th>Preview</th></tr></thead><tbody>{visible.map(b=><tr key={b.key}><td>{b.name}</td><td>{b.sourceId??"Not supplied"}</td><td><Button size="sm" variant="outline" onClick={()=>select(b)}>View 3D</Button></td></tr>)}</tbody></table>{!visible.length&&<div className="empty-state"><Building2 size={28}/><h3>{zoom<14?"Zoom in to see buildings":"No mapped footprints loaded in this view"}</h3><p>Choose a neighbourhood above or return to the map to explore another area. OSM coverage varies.</p><Button variant="outline" onClick={()=>setTable(false)}>Back to map</Button></div>}</div>}
    </div><div className="explorer-attribution"><span>Live map · internet required · coverage varies</span><span><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></span></div>
    {selected&&<BuildingPreview key={selected.key} building={selected} onClose={()=>setSelected(null)}/>}
  </section>;
}
