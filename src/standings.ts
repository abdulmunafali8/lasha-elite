import {Match,Player} from "./types";
export interface Row{id:string;name:string;logoUrl?:string;pts:number;mp:number;w:number;d:number;l:number;gf:number;ga:number;gd:number}
export function standings(players:Player[],matches:Match[]):Row[]{
const m=new Map<string,Row>();for(const p of players)m.set(p.id,{id:p.id,name:p.name,logoUrl:p.logoUrl,pts:0,mp:0,w:0,d:0,l:0,gf:0,ga:0,gd:0});
const add=(id:string,f:number,a:number)=>{const r=m.get(id);if(!r)return;r.mp++;r.gf+=f;r.ga+=a;r.gd=r.gf-r.ga;if(f>a){r.w++;r.pts+=3}else if(f===a){r.d++;r.pts+=1}else r.l++};
for(const x of matches){if(x.status!=="done"||x.homeScore==null||x.awayScore==null)continue;add(x.homeId,x.homeScore,x.awayScore);add(x.awayId,x.awayScore,x.homeScore)}
return[...m.values()].sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name))}
export type RK="scorers"|"assists"|"penalties"|"gk";
export interface RRow{id:string;name:string;logoUrl?:string;value:number;sub?:string}
export function ranking(players:Player[],matches:Match[],kind:RK):RRow[]{
const s=new Map(players.map(p=>[p.id,{mp:0,gf:0,ga:0,cs:0,ast:0,pen:0}]));
for(const m of matches){if(m.status!=="done"||m.homeScore==null||m.awayScore==null)continue;
const H=s.get(m.homeId),A=s.get(m.awayId);
if(H){H.mp++;H.gf+=m.homeScore;H.ga+=m.awayScore;if(m.awayScore===0)H.cs++;H.ast+=m.homeAssists??0;H.pen+=m.homePens??0}
if(A){A.mp++;A.gf+=m.awayScore;A.ga+=m.homeScore;if(m.homeScore===0)A.cs++;A.ast+=m.awayAssists??0;A.pen+=m.awayPens??0}}
const rows=players.map(p=>{const x=s.get(p.id)!;return{p,x,value:kind==="scorers"?x.gf:kind==="assists"?x.ast:kind==="penalties"?x.pen:x.cs}}).filter(r=>kind==="gk"?r.x.mp>0:r.value>0);
rows.sort((a,b)=>b.value-a.value||(kind==="gk"?a.x.ga-b.x.ga:a.x.mp-b.x.mp)||a.p.name.localeCompare(b.p.name));
return rows.map(r=>({id:r.p.id,name:r.p.name,logoUrl:r.p.logoUrl,value:r.value,sub:kind==="gk"?`GA ${r.x.ga}`:undefined}))}
