import {useMemo,useState} from "react";
import {User} from "firebase/auth";
import {collection,doc,query,orderBy,limit,addDoc,deleteDoc,serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";import {useLive} from "./hooks";
interface M{id:string;text:string;name:string;uid:string;createdAt?:{toMillis():number}}
export default function Messages({cid,user,t}:{cid:string;user:User|null;t:Record<string,string>}){
const r=useLive<M>(useMemo(()=>query(collection(db,"competitions",cid,"messages"),orderBy("createdAt","desc"),limit(30)),[cid]));
const [v,setV]=useState("");const [err,setErr]=useState("");
const send=async(e:React.FormEvent)=>{e.preventDefault();const x=v.trim();if(!user)return setErr(t.signin);if(!x||x.length>500)return setErr(t.req);setErr("");
try{await addDoc(collection(db,"competitions",cid,"messages"),{text:x,uid:user.uid,name:user.displayName??"",createdAt:serverTimestamp()});setV("")}catch{setErr(t.err)}};
return(<section className="msgs"><p className="eyebrow">{t.messages}</p>
<form className="msgbox" onSubmit={send}><span className="cr">{(user?.displayName??"?").slice(0,2).toUpperCase()}</span><input value={v} maxLength={500} onChange={e=>setV(e.target.value)} placeholder={t.msgPh} aria-label={t.msgPh}/><button aria-label={t.send} className="lnk">➤</button></form>
{err&&<p className="toast" role="alert">{err}</p>}
{r.d.map(m=><div key={m.id} className="prow"><span className="cr">{m.name.slice(0,2).toUpperCase()||"?"}</span><div className="grow"><b>{m.name}</b><p>{m.text}</p>{m.createdAt&&<p className="muted">{new Date(m.createdAt.toMillis()).toLocaleString()}</p>}</div>
{user?.uid===m.uid&&<button className="ib sm" aria-label={t.del} onClick={()=>confirm(t.sure)&&deleteDoc(doc(db,"competitions",cid,"messages",m.id))}>🗑</button>}</div>)}</section>)}
