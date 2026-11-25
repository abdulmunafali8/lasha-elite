import {useEffect,useMemo,useState} from "react";
import {arrayRemove,arrayUnion,collection,doc,onSnapshot,query,updateDoc,where} from "firebase/firestore";
import {onAuthStateChanged,User} from "firebase/auth";
import {auth,db} from "./firebase";import {useLive} from "./hooks";import {useLang} from "./i18n";
import "./sheetStyles";
interface Org{name:string;country?:string;region?:string;logoUrl?:string;coverUrl?:string;followers?:string[]}
interface Cp{id:string;name:string;logoUrl?:string;isPrivate?:boolean;parentId?:string}
const Ic=({d,s=26}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const BACK="M19 12H5M12 5l-7 7 7 7";
const SHARE="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4";
const PPL="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 19c.5-3 3-5 6-5s5.5 2 6 5M14.5 14.2c.5-.1 1-.2 1.5-.2 3 0 5.5 2 6 5";
export default function OrganizerPage({id}:{id:string}){
const {t}=useLang();const [user,setUser]=useState<User|null>(null);const [o,setO]=useState<Org|null|undefined>(undefined);const [msg,setMsg]=useState("");
useEffect(()=>onAuthStateChanged(auth,setUser),[]);
useEffect(()=>onSnapshot(doc(db,"organizers",id),s=>setO(s.exists()?(s.data() as Org):null),()=>setO(null)),[id]);
const cps=useLive<Cp>(useMemo(()=>query(collection(db,"competitions"),where("ownerId","==",id)),[id]));
const list=cps.d.filter(c=>!c.isPrivate&&!c.parentId).sort((a,b)=>a.name.localeCompare(b.name));
const fl=o?.followers??[];const following=!!user&&fl.includes(user.uid);
const toggle=async()=>{if(!user)return setMsg(t.signin);try{await updateDoc(doc(db,"organizers",id),{followers:following?arrayRemove(user.uid):arrayUnion(user.uid)})}catch(e){setMsg(t.err+" ("+((e as {code?:string}).code??"")+")")}};
const share=()=>{if(typeof navigator.share==="function")navigator.share({title:o?.name,url:location.href}).catch(()=>{});else navigator.clipboard?.writeText(location.href).then(()=>setMsg(t.exCopied)).catch(()=>{})};
const back=()=>{if(history.length>1)history.back();else location.hash="#/"};
if(o===undefined)return<div className="og"><p className="og-pad">{t.loading}</p></div>;
if(o===null)return<div className="og"><div className="og-pad"><button type="button" className="og-bk" onClick={back} aria-label={t.home}><Ic d={BACK}/></button><p>{t.none}</p></div></div>;
const ini=(o.name||"?").slice(0,2).toUpperCase();
return<div className="og">
<div className="og-cover" style={o.coverUrl?{backgroundImage:`url(${o.coverUrl})`}:undefined}><div className="og-bar"><button type="button" className="og-bk" onClick={back} aria-label={t.home}><Ic d={BACK}/></button><button type="button" className="og-bk" onClick={share} aria-label={t.share}><Ic d={SHARE}/></button></div></div>
<div className="og-head"><span className="og-logo">{o.logoUrl?<img src={o.logoUrl} alt=""/>:ini}</span>
<button type="button" className={"og-follow"+(following?" on":"")} onClick={toggle}>{following?t.following:t.followBtn}</button>
<h1 className="og-name">{o.name}</h1>
<p className="og-meta"><Ic d={PPL} s={22}/> {fl.length} {fl.length===1?t.followerOne:t.followers}</p>
{(o.region||o.country)&&<p className="og-meta big">{[o.region,o.country].filter(Boolean).join(", ")}</p>}
{msg&&<p className="toast" role="alert" onClick={()=>setMsg("")}>{msg}</p>}</div>
<section className="og-sec"><h2>{t.flPub}</h2>
{cps.loading?<p className="og-muted">{t.loading}</p>:list.length===0?<p className="og-muted">{t.none}</p>:list.map(c=><a key={c.id} className="og-row" href={`#/competition/${c.id}`}>{c.logoUrl?<img className="og-ci" src={c.logoUrl} alt=""/>:<span className="og-ci">{c.name.slice(0,2).toUpperCase()}</span>}<span>{c.name}</span></a>)}</section>
</div>}
