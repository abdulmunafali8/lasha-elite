import {useEffect,useMemo,useState} from "react";
import {arrayRemove,arrayUnion,collection,doc,onSnapshot,query,updateDoc,where} from "firebase/firestore";
import {onAuthStateChanged,User} from "firebase/auth";
import {auth,db,uploadImg} from "./firebase";import ImagePick from "./ImagePick";import {COUNTRIES} from "./countries";import {useLive} from "./hooks";import {useLang} from "./i18n";
import "./sheetStyles";
interface Org{name:string;country?:string;region?:string;logoUrl?:string;coverUrl?:string;followers?:string[]}
interface Cp{id:string;name:string;logoUrl?:string;isPrivate?:boolean;parentId?:string}
const Ic=({d,s=26}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const BACK="M19 12H5M12 5l-7 7 7 7";
const SHARE="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4";
const PPL="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 19c.5-3 3-5 6-5s5.5 2 6 5M14.5 14.2c.5-.1 1-.2 1.5-.2 3 0 5.5 2 6 5";
export default function OrganizerPage({id}:{id:string}){
const {t}=useLang();const [user,setUser]=useState<User|null>(null);const [o,setO]=useState<Org|null|undefined>(undefined);const [msg,setMsg]=useState("");const [ed,setEd]=useState(false);const [busy,setBusy]=useState(false);const [fm,setFm]=useState({name:"",country:"NG",region:""});const [logo,setLogo]=useState<File|null>(null);const [cover,setCover]=useState<File|null>(null);
useEffect(()=>onAuthStateChanged(auth,setUser),[]);
useEffect(()=>onSnapshot(doc(db,"organizers",id),s=>setO(s.exists()?(s.data() as Org):null),()=>setO(null)),[id]);
const cps=useLive<Cp>(useMemo(()=>query(collection(db,"competitions"),where("ownerId","==",id)),[id]));
const list=cps.d.filter(c=>!c.isPrivate&&!c.parentId).sort((a,b)=>a.name.localeCompare(b.name));
const fl=o?.followers??[];const following=!!user&&fl.includes(user.uid);
const toggle=async()=>{if(!user)return setMsg(t.signin);try{await updateDoc(doc(db,"organizers",id),{followers:following?arrayRemove(user.uid):arrayUnion(user.uid)})}catch(e){setMsg(t.err+" ("+((e as {code?:string}).code??"")+")")}};
const share=()=>{if(typeof navigator.share==="function")navigator.share({title:o?.name,url:location.href}).catch(()=>{});else navigator.clipboard?.writeText(location.href).then(()=>setMsg(t.exCopied)).catch(()=>{})};
const openEdit=()=>{if(!o)return;setFm({name:o.name,country:o.country||"NG",region:o.region||""});setLogo(null);setCover(null);setEd(true)};
const save=async()=>{const n=fm.name.trim();if(n.length<2)return setMsg(t.req+": "+t.name);setBusy(true);
try{const d:Record<string,unknown>={name:n,country:fm.country,region:fm.region.trim()||null};const base=`competitions/${id}/organizer`;
if(logo)d.logoUrl=await uploadImg(`${base}/logo`,logo);if(cover)d.coverUrl=await uploadImg(`${base}/cover`,cover);
await updateDoc(doc(db,"organizers",id),d);setEd(false);setMsg(t.saved)}catch(e){setMsg(t.err+" ("+((e as {code?:string}).code??"")+")")}finally{setBusy(false)}};
const back=()=>{if(history.length>1)history.back();else location.hash="#/"};
if(o===undefined)return<div className="og"><p className="og-pad">{t.loading}</p></div>;
if(o===null)return<div className="og"><div className="og-pad"><button type="button" className="og-bk" onClick={back} aria-label={t.home}><Ic d={BACK}/></button><p>{t.none}</p></div></div>;
const ini=(o.name||"?").slice(0,2).toUpperCase();
return<div className="og">
<div className="og-cover" style={o.coverUrl?{backgroundImage:`url(${o.coverUrl})`}:undefined}><div className="og-bar"><button type="button" className="og-bk" onClick={back} aria-label={t.home}><Ic d={BACK}/></button><button type="button" className="og-bk" onClick={share} aria-label={t.share}><Ic d={SHARE}/></button></div></div>
<div className="og-head"><span className="og-logo">{o.logoUrl?<img src={o.logoUrl} alt=""/>:ini}</span>
{user?.uid===id?<button type="button" className="og-follow" onClick={openEdit}>{t.edit}</button>:<button type="button" className={"og-follow"+(following?" on":"")} onClick={toggle}>{following?t.following:t.followBtn}</button>}
<h1 className="og-name">{o.name}</h1>
<p className="og-meta"><Ic d={PPL} s={22}/> {fl.length} {fl.length===1?t.followerOne:t.followers}</p>
{(o.region||o.country)&&<p className="og-meta big">{[o.region,o.country].filter(Boolean).join(", ")}</p>}
{msg&&<p className={"toast"+(msg===t.saved?" ok":"")} role="alert" onClick={()=>setMsg("")}>{msg}</p>}</div>
<section className="og-sec"><h2>{t.flPub}</h2>
{cps.loading?<p className="og-muted">{t.loading}</p>:list.length===0?<p className="og-muted">{t.none}</p>:list.map(c=><a key={c.id} className="og-row" href={`#/competition/${c.id}`}>{c.logoUrl?<img className="og-ci" src={c.logoUrl} alt=""/>:<span className="og-ci">{c.name.slice(0,2).toUpperCase()}</span>}<span>{c.name}</span></a>)}</section>
{ed&&<div className="sh-wrap" onClick={()=>setEd(false)}><div className="sh-sheet" role="dialog" aria-label={t.edit} onClick={e=>e.stopPropagation()}>
<span className="sh-grab"/><div className="sh-top"><h2>{t.edit}</h2><button type="button" className="sh-x" aria-label={t.cancel} onClick={()=>setEd(false)}>✕</button></div>
<ImagePick label={t.cover} hint="1600x533" file={cover} onFile={setCover} onErr={k=>setMsg(t[k]??k)} current={o.coverUrl}/>
<ImagePick round label={t.logo} hint="200x240" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={o.logoUrl}/>
<label className="og-lab" htmlFor="ogn">{t.name}</label><input id="ogn" className="og-in" value={fm.name} onChange={e=>setFm({...fm,name:e.target.value})}/>
<label className="og-lab" htmlFor="ogc">{t.flCountry}</label><select id="ogc" className="og-in" value={fm.country} onChange={e=>setFm({...fm,country:e.target.value})}>{COUNTRIES.map(([k,n])=><option key={k} value={k}>{n}</option>)}</select>
<label className="og-lab" htmlFor="ogr">{t.region}</label><input id="ogr" className="og-in" value={fm.region} placeholder="FCT" onChange={e=>setFm({...fm,region:e.target.value})}/>
{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="fl-acts"><button type="button" onClick={()=>setEd(false)}>{t.cancel}</button><button type="button" className="go" disabled={busy} onClick={save}>{busy?t.saving:t.save}</button></div>
</div></div>}
</div>}
