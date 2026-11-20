import {useMemo,useState} from "react";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc} from "firebase/firestore";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";import ImagePick from "./ImagePick";
interface P{id:string;name:string;gamertag?:string;phone?:string;logoUrl?:string;ownLogo?:string|null;teamId?:string|null;groupId?:string|null}
interface N{id:string;name:string;logoUrl?:string}
export default function Players({cid,uid,t}:{cid:string;uid:string;t:Record<string,string>}){
const list=useLive<P>(useMemo(()=>query(collection(db,"competitions",cid,"players"),orderBy("name")),[cid])).d;
const teams=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"teams"),orderBy("name")),[cid])).d;const groups=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"groups"),orderBy("order")),[cid])).d;
const [teamId,setTeamId]=useState("");const [groupId,setGroupId]=useState("");const [edit,setEdit]=useState<P|null>(null);const [open,setOpen]=useState(false);const [name,setName]=useState("");const [tag,setTag]=useState("");const [phone,setPhone]=useState("");const [logo,setLogo]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
const start=(p:P|null)=>{setEdit(p);setName(p?.name??"");setTag(p?.gamertag??"");setPhone(p?.phone??"");setTeamId(p?.teamId??"");setGroupId(p?.groupId??"");setLogo(null);setMsg("");setOpen(true)};
const save=async(e:React.FormEvent)=>{e.preventDefault();const n=name.trim();if(n.length<2)return setMsg(t.req+": "+t.playerName);
if(phone&&!/^[+\d][\d\s-]{6,16}$/.test(phone))return setMsg(t.phone);
if(list.some(p=>p.id!==edit?.id&&p.name.toLowerCase()===n.toLowerCase()))return setMsg(t.playerName+"?");
setBusy(true);try{const team=teams.find(x=>x.id===teamId);const data:Record<string,unknown>={name:n,gamertag:tag.trim(),phone:phone.trim(),teamId:teamId||null,teamName:team?.name??null,groupId:groupId||null};
const ref=edit?doc(db,"competitions",cid,"players",edit.id):await addDoc(collection(db,"competitions",cid,"players"),{...data,createdAt:Date.now()});
let own=edit?.ownLogo??(edit&&!edit.teamId?edit.logoUrl:undefined);if(logo)own=await uploadImg(`competitions/${uid}/${cid}/players/${ref.id}`,logo);data.ownLogo=own??null;data.logoUrl=team?.logoUrl??own??null;
await updateDoc(ref,data);setOpen(false)}catch{setMsg(t.err)}finally{setBusy(false)}};
const del=(p:P)=>confirm(t.sure)&&deleteDoc(doc(db,"competitions",cid,"players",p.id));
return(<div className="pad"><div className="sh"><h2>{t.players} ({list.length})</h2><button className="ib sm" onClick={()=>start(null)}>+ {t.addPlayer}</button></div>
{open&&<form className="form" onSubmit={save} noValidate><div className="two"><ImagePick round label={t.logo} hint="" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={edit?.logoUrl}/><div className="grow"><label>{t.playerName}<input value={name} onChange={e=>setName(e.target.value)}/></label><label>{t.gamertag}<input value={tag} onChange={e=>setTag(e.target.value)}/></label></div></div>
{teams.length>0&&<label>{t.team}<select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value=""/>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}{groups.length>0&&<label>{t.groups}<select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value=""/>{groups.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}<label>{t.phone}<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label>{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="acts"><button className="btn sm" disabled={busy}>{busy?t.saving:t.save}</button><button type="button" className="btn sm ghost" onClick={()=>setOpen(false)}>{t.cancel}</button></div></form>}
{list.map(p=><div key={p.id} className="prow"><span className="cr">{p.logoUrl?<img src={p.logoUrl} alt=""/>:p.name.slice(0,2).toUpperCase()}</span><div className="grow"><b>{p.name}</b>{p.gamertag&&<p className="muted">{p.gamertag}</p>}</div>
<button className="ib sm" onClick={()=>start(p)} aria-label={t.edit}>✎</button><button className="ib sm" onClick={()=>del(p)} aria-label={t.del}>🗑</button></div>)}</div>)}
