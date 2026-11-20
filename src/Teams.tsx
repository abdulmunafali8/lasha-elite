import {useMemo,useState} from "react";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc,getDocs,where} from "firebase/firestore";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";import ImagePick from "./ImagePick";
interface T{id:string;name:string;logoUrl?:string}
export default function Teams({cid,uid,t}:{cid:string;uid:string;t:Record<string,string>}){
const list=useLive<T>(useMemo(()=>query(collection(db,"competitions",cid,"teams"),orderBy("name")),[cid])).d;
const [edit,setEdit]=useState<T|null>(null);const [open,setOpen]=useState(false);const [name,setName]=useState("");const [logo,setLogo]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
const start=(x:T|null)=>{setEdit(x);setName(x?.name??"");setLogo(null);setMsg("");setOpen(true)};
const save=async(e:React.FormEvent)=>{e.preventDefault();const n=name.trim();if(n.length<2)return setMsg(t.req+": "+t.teamName);if(list.some(x=>x.id!==edit?.id&&x.name.toLowerCase()===n.toLowerCase()))return setMsg(t.dupName);
setBusy(true);try{const ref=edit?doc(db,"competitions",cid,"teams",edit.id):await addDoc(collection(db,"competitions",cid,"teams"),{name:n});
const d:Record<string,unknown>={name:n};if(logo)d.logoUrl=await uploadImg(`competitions/${uid}/${cid}/teams/${ref.id}`,logo);await updateDoc(ref,d);setOpen(false)}catch{setMsg(t.err)}finally{setBusy(false)}};
const del=async(x:T)=>{const r=await getDocs(query(collection(db,"competitions",cid,"players"),where("teamId","==",x.id)));if(!r.empty)return setMsg(t.teamUsed);if(confirm(t.sure))await deleteDoc(doc(db,"competitions",cid,"teams",x.id))};
return(<div className="form"><div className="sh"><b>{t.teams} ({list.length})</b><button className="ib sm" onClick={()=>start(null)}>+ {t.addTeam}</button></div>{msg&&<p className="toast" role="alert">{msg}</p>}
{open&&<form className="form" onSubmit={save} noValidate><div className="two"><ImagePick round label={t.logo} hint="" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={edit?.logoUrl}/><div className="grow"><label>{t.teamName}<input value={name} onChange={e=>setName(e.target.value)}/></label></div></div>
<div className="acts"><button className="btn sm" disabled={busy}>{busy?t.saving:t.save}</button><button type="button" className="btn sm ghost" onClick={()=>setOpen(false)}>{t.cancel}</button></div></form>}
{list.map(x=><div key={x.id} className="prow"><span className="cr">{x.logoUrl?<img src={x.logoUrl} alt=""/>:x.name.slice(0,2).toUpperCase()}</span><b className="grow">{x.name}</b><button className="ib sm" onClick={()=>start(x)} aria-label={t.edit}>✎</button><button className="ib sm" onClick={()=>del(x)} aria-label={t.del}>🗑</button></div>)}</div>)}
