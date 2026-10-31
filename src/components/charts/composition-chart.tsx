"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
export function CompositionChart({data,total}:{data:{name:string;value:number;color:string}[];total:number}) {
 return <div className="composition-content"><div className="donut"><ResponsiveContainer width="100%" height={150}><PieChart><Pie data={data} dataKey="value" innerRadius={48} outerRadius={65} paddingAngle={3} stroke="none" isAnimationActive={false}>{data.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip formatter={value=>`${Number(value).toLocaleString(undefined,{maximumFractionDigits:0})} m²`}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{(total/10000).toFixed(1)}</strong><span>hectares</span></div></div><div className="composition-legend">{data.map(d=><div key={d.name}><span style={{background:d.color}}/><span>{d.name}</span><strong>{(d.value/total*100).toFixed(0)}%</strong></div>)}<small>Plan area · DEMO geometry</small></div></div>;
}
