import {useMemo,useState} from "react";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc,getDocs,where} from "firebase/firestore";
import {db} from "./firebase";import {useLive} from "./hooks";
interface G{id:string;name:string;order:number}
export default function Groups({cid,t}:{cid:string;t:Record<string,string>}){
const list=useLive<G>(useMemo(()=>query(collection(db,"competitions",cid,"groups"),orderBy("order")),[cid])).d;const [msg,setMsg]=useState("");
const dup=(n:string,id?:string)=>list.some(g=>g.id!==id&&g.name.toLowerCase()===n.toLowerCase());
const add=async()=>{const n=prompt(t.groupName)?.trim();if(!n)return;if(dup(n))return setMsg(t.dupName);await addDoc(collection(db,"competitions",cid,"groups"),{name:n,order:Math.max(0,...list.map(g=>g.order))+1})};
const ren=async(g:G)=>{const n=prompt(t.groupName,g.name)?.trim();if(!n)return;if(dup(n,g.id))return setMsg(t.dupName);await updateDoc(doc(db,"competitions",cid,"groups",g.id),{name:n})};
const del=async(g:G)=>{const r=await getDocs(query(collection(db,"competitions",cid,"players"),where("groupId","==",g.id)));if(!r.empty)return setMsg(t.groupUsed);if(confirm(t.sure))await deleteDoc(doc(db,"competitions",cid,"groups",g.id))};
return(<div className="form">{msg&&<p className="toast" role="alert">{msg}</p>}{list.map(g=><div key={g.id} className="prow"><b className="grow">{g.name}</b><button className="ib sm" onClick={()=>ren(g)} aria-label={t.rename}>✎</button><button className="ib sm" onClick={()=>del(g)} aria-label={t.del}>🗑</button></div>)}<button className="btn sm" onClick={add}>+ {t.addGroup}</button></div>)}
