import {useState} from "react";
import {deleteField} from "firebase/firestore";
export interface Mod{name:string;photo?:string|null;tournament:boolean;result:boolean;media:boolean;team?:string|null}
export interface FInfo{name:string;photo?:string|null}
const Av=({n,p}:{n:string;p?:string|null})=>p?<img className="mo-av" src={p} alt="" width={48} height={48}/>:<span className="mo-av">{(n||"?").slice(0,2).toUpperCase()}</span>;
type PK="tournament"|"result"|"media";
export default function Moderators({mods,followers,info,owner,players,t,upd}:{mods:Record<string,Mod>;followers:string[];info:Record<string,FInfo>;owner:string;players:{id:string;name?:string}[];t:Record<string,string>;upd:(d:Record<string,unknown>)=>unknown}){
const [pick,setPick]=useState(false);const [q,setQ]=useState("");const [ed,setEd]=useState("");const [d,setD]=useState<Mod|null>(null);
const nm=(u:string)=>info[u]?.name||t.userT+" "+u.slice(0,5);
const cand=followers.filter(u=>u!==owner&&!mods[u]&&nm(u).toLowerCase().includes(q.trim().toLowerCase()));
const add=(u:string)=>{upd({["mods."+u]:{name:nm(u),photo:info[u]?.photo??null,tournament:false,result:true,media:true,team:null}});setPick(false);setQ("")};
const open=(u:string)=>{setEd(u);setD({...mods[u],team:mods[u].team??null})};
const save=()=>{if(!d)return;if(d.team==="")return alert(t.req+": "+t.modTeam);upd({["mods."+ed]:{...d,photo:d.photo??null,team:d.team||null}});setEd("")};
const rm=()=>{if(!confirm(t.sure))return;upd({["mods."+ed]:deleteField()});setEd("")};
const P=({k,l,s}:{k:PK;l:string;s:string})=><label className="mo-p"><span><b>{l}</b><small>{s}</small></span><input type="checkbox" checked={!!d?.[k]} onChange={e=>d&&setD({...d,[k]:e.target.checked})}/></label>;
return<div className="form mo">
<div className="mo-top"><b>{t.mods}</b><button type="button" className="ib sm" aria-label={t.qAdd} onClick={()=>setPick(true)}>+</button></div>
{Object.keys(mods).length===0&&<p className="muted ctr">{t.modsEmpty}</p>}
{Object.entries(mods).map(([u,m])=><button type="button" key={u} className="mo-row" onClick={()=>open(u)}><Av n={m.name} p={m.photo}/><b>{m.name}</b></button>)}
{pick&&<div className="mo-wrap" onClick={()=>setPick(false)}><div className="mo-box" role="dialog" aria-label={t.followersT} onClick={e=>e.stopPropagation()}><h2>{t.followersT}</h2>
<label className="mo-s"><span>{t.searchF}</span><input value={q} onChange={e=>setQ(e.target.value)}/></label>
{cand.length===0?<p className="muted">{t.noFollowers}</p>:cand.map(u=><button type="button" key={u} className="mo-row" onClick={()=>add(u)}><Av n={nm(u)} p={info[u]?.photo}/><b>{nm(u)}</b></button>)}</div></div>}
{ed&&d&&<div className="mo-wrap" onClick={()=>setEd("")}><div className="mo-box" role="dialog" aria-label={d.name} onClick={e=>e.stopPropagation()}>
<P k="tournament" l={t.modTournament} s={t.modTournamentT}/><P k="result" l={t.modResult} s={t.modResultT}/><P k="media" l={t.modMedia} s={t.modMediaT}/>
<label className="mo-p"><span><b>{t.modTeam}</b><small>{t.modTeamT}</small></span><input type="checkbox" checked={d.team!=null} onChange={e=>setD({...d,team:e.target.checked?"":null})}/></label>
{d.team!=null&&<select className="mo-sel" value={d.team} onChange={e=>setD({...d,team:e.target.value})}><option value=""/>{players.map(p=><option key={p.id} value={p.id}>{p.name||p.id}</option>)}</select>}
<div className="mo-acts"><button type="button" className="mo-rm" onClick={rm}>{t.modRemove}</button><button type="button" className="btn sm" onClick={save}>{t.save}</button></div></div></div>}
</div>}
