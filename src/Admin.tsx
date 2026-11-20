import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,query,orderBy,limit,serverTimestamp} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
type Ts={toMillis():number}|undefined;
const when=(x:Ts)=>x?new Date(x.toMillis()).toLocaleString():"";
interface Cp{id:string;name:string;organizerName?:string;status?:string;isPrivate?:boolean}
interface Us{id:string;name:string;email:string;role:string}
interface Nt{id:string;title:string;body:string;createdAt?:Ts}
interface Lg{id:string;action:string;target?:string;detail?:string;createdAt?:Ts}
interface Ac{id:string;homePlayer:string;awayPlayer:string;createdAt?:Ts}
type Tab="c"|"u"|"n"|"l";
export default function Admin(){
const {t}=useLang();const [user,setUser]=useState<User|null|undefined>(undefined);const [ok,setOk]=useState<boolean|null>(null);const [tab,setTab]=useState<Tab>("c");const [msg,setMsg]=useState("");
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);if(u){const s=await getDoc(doc(db,"users",u.uid));setOk(s.data()?.role==="superadmin")}else setOk(false)}),[]);
const enabled=ok===true;
const comps=useLive<Cp>(useMemo(()=>enabled?query(collection(db,"competitions"),orderBy("createdAt","desc"),limit(100)):null,[enabled])).d;
const users=useLive<Us>(useMemo(()=>enabled?query(collection(db,"users"),orderBy("createdAt","desc"),limit(100)):null,[enabled])).d;
const nots=useLive<Nt>(useMemo(()=>enabled?query(collection(db,"notifications"),orderBy("createdAt","desc"),limit(50)):null,[enabled])).d;
const logs=useLive<Lg>(useMemo(()=>enabled?query(collection(db,"adminLogs"),orderBy("createdAt","desc"),limit(50)):null,[enabled])).d;
const acts=useLive<Ac>(useMemo(()=>enabled?query(collection(db,"activity"),orderBy("createdAt","desc"),limit(50)):null,[enabled])).d;
const [nt,setNt]=useState("");const [nb,setNb]=useState("");
const head=<header className="ch"><div className="chr"><a className="ib" href="#/">←</a><h1>{t.admin}</h1></div></header>;
if(user===undefined||ok===null)return<div className="app">{head}<p className="muted pad">{t.loading}</p></div>;
if(!user||!ok)return<div className="app">{head}<p className="toast">{t.adminOnly}</p></div>;
const log=(action:string,target?:string,detail?:string)=>addDoc(collection(db,"adminLogs"),{action,target:target??"",detail:detail??"",adminId:user.uid,createdAt:serverTimestamp()});
const run=async(f:()=>Promise<unknown>)=>{try{await f()}catch{setMsg(t.err)}};
const setStatus=(c:Cp,v:string)=>run(async()=>{await updateDoc(doc(db,"competitions",c.id),{status:v});await log("aStatus",c.name,v)});
const setRole=(u:Us,v:string)=>run(async()=>{await updateDoc(doc(db,"users",u.id),{role:v});if(v==="organizer")await setDoc(doc(db,"organizers",u.id),{name:u.name,country:"NG"},{merge:true});await log("aRole",u.email,v)});
const sendN=(e:React.FormEvent)=>{e.preventDefault();if(nt.trim().length<3||nb.trim().length<3)return setMsg(t.req);run(async()=>{await addDoc(collection(db,"notifications"),{title:nt.trim(),body:nb.trim(),authorId:user.uid,createdAt:serverTimestamp()});await log("aNotify",nt.trim());setNt("");setNb("")})};
const delN=(n:Nt)=>confirm(t.sure)&&run(async()=>{await deleteDoc(doc(db,"notifications",n.id));await log("aDel",n.title)});
const tabs:[Tab,string][]=[["c",t.compsTab],["u",t.users],["n",t.notifs],["l",t.logs]];
return(<div className="app">{head}{msg&&<p className="toast" role="alert" onClick={()=>setMsg("")}>{msg}</p>}
<div className="pills pad">{tabs.map(([k,l])=><button key={k} className={"pill"+(tab===k?" on":"")} onClick={()=>setTab(k)}>{l}</button>)}</div>
<div className="pad">
{tab==="c"&&(comps.length?comps.map(c=><div key={c.id} className="prow"><div className="grow"><b>{c.name}</b><p className="muted">{c.organizerName}{c.isPrivate?" · "+t.priv:""}</p></div>
<select className="sel2" value={c.status??"prep"} onChange={e=>setStatus(c,e.target.value)}><option value="prep">{t.prep}</option><option value="run">{t.sRun}</option><option value="done">{t.sDone}</option></select><a className="ib sm" href={`#/competition/${c.id}`} aria-label={t.open_}>↗</a></div>):<p className="muted">{t.none}</p>)}
{tab==="u"&&(users.length?users.map(u=><div key={u.id} className="prow"><div className="grow"><b>{u.name}</b><p className="muted">{u.email}</p></div>
{u.role==="superadmin"?<span className="muted">Super Admin</span>:<select className="sel2" value={u.role} onChange={e=>setRole(u,e.target.value)}><option value="organizer">{t.rOrg}</option><option value="player">{t.rPlayer}</option><option value="viewer">{t.rView}</option></select>}</div>):<p className="muted">{t.none}</p>)}
{tab==="n"&&<><form className="form" onSubmit={sendN} noValidate><label>{t.ctitle}<input value={nt} onChange={e=>setNt(e.target.value)}/></label><label>{t.body}<textarea rows={3} value={nb} onChange={e=>setNb(e.target.value)}/></label><button className="btn sm">{t.send}</button></form>
{nots.map(n=><div key={n.id} className="prow"><div className="grow"><b>{n.title}</b><p className="muted">{n.body}</p><p className="muted">{when(n.createdAt)}</p></div><button className="ib sm" onClick={()=>delN(n)} aria-label={t.del}>🗑</button></div>)}</>}
{tab==="l"&&<>{logs.map(l=><div key={l.id} className="prow"><div className="grow"><b>{(t as Record<string,string>)[l.action]??l.action}</b><p className="muted">{l.target} {l.detail}</p></div><span className="muted">{when(l.createdAt)}</span></div>)}
{acts.map(a=><div key={a.id} className="prow"><div className="grow"><b>{t.newRes}</b><p className="muted">{a.homePlayer} vs {a.awayPlayer}</p></div><span className="muted">{when(a.createdAt)}</span></div>)}
{!logs.length&&!acts.length&&<p className="muted">{t.none}</p>}</>}
</div></div>)}
