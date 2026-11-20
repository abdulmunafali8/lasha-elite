import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,getDoc,query,where,orderBy,limit} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
import {Competition,Organizer,Activity} from "./types";

const Logo=({url,name}:{url?:string;name:string})=>url?<img src={url} alt="" loading="lazy"/>:<span className="ph">{name.slice(0,2).toUpperCase()}</span>;
type L<T>={d:T[];loading:boolean;err:boolean};

export default function Dashboard(){
const {t,toggle,lang}=useLang();const [user,setUser]=useState<User|null>(null);const [q,setQ]=useState("");const [region]=useState("NG");const [menu,setMenu]=useState(false);const [isAdmin,setIsAdmin]=useState(false);const [ci,setCi]=useState(0);
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);setIsAdmin(false);if(u){try{setIsAdmin((await getDoc(doc(db,"users",u.uid))).data()?.role==="superadmin")}catch{}}}),[]);
const follow=useLive<Competition>(useMemo(()=>user?query(collection(db,"competitions"),where("followers","array-contains",user.uid)):null,[user]));
const mine=useLive<Competition>(useMemo(()=>user?query(collection(db,"competitions"),where("ownerId","==",user.uid)):null,[user]));
const act=useLive<Activity>(useMemo(()=>query(collection(db,"activity"),orderBy("createdAt","desc"),limit(5)),[]));
const orgs=useLive<Organizer>(useMemo(()=>query(collection(db,"organizers"),where("country","==",region),limit(20)),[region]));
const nots=useLive<{id:string;createdAt?:{toMillis():number}}>(useMemo(()=>query(collection(db,"notifications"),orderBy("createdAt","desc"),limit(20)),[]));
let seen=0;try{seen=Number(localStorage.getItem("seenN")||0)}catch{}
const unread=nots.d.filter(n=>(n.createdAt?.toMillis()??0)>seen).length;
const f=(s:string)=>s.toLowerCase().includes(q.toLowerCase());
const ago=(ms:number)=>{const m=Math.floor((Date.now()-ms)/60000);return m<1?t.now:m<60?`${m} ${t.min} ${t.ago}`:`${Math.floor(m/60)} ${t.hr} ${t.ago}`};
const state=(x:{loading:boolean;err:boolean;d:unknown[]})=>x.loading?<p className="muted">{t.loading}</p>:x.err?<p className="muted">{t.err}</p>:x.d.length===0?<p className="muted">{t.none}</p>:null;
const cards=(x:L<Competition>,dots?:boolean)=>{const list=x.d.filter(c=>f(c.name));return state({...x,d:list})??<><div className="hscroll" onScroll={e=>{const el=e.currentTarget;const c=el.firstElementChild as HTMLElement|null;if(c)setCi(Math.round(el.scrollLeft/(c.offsetWidth+12)))}}>{list.map(c=><a key={c.id} className="card" href={`#/competition/${c.id}`}>
<div className={"cover"+(c.coverUrl?"":" stripes")} style={c.coverUrl?{backgroundImage:`url(${c.coverUrl})`}:undefined}/>
<div className="clogo"><Logo url={c.logoUrl} name={c.name}/></div><h3>{c.name}</h3><p className="muted">🏆 {c.organizerName}</p></a>)}</div>
{dots&&list.length>1&&<div className="dots" aria-hidden="true">{list.map((c,i)=><i key={c.id} className={i===ci?"on":""}/>)}</div>}</>};
return(<div className="app">
<header><button aria-label={t.menu} className="ib" onClick={()=>setMenu(true)}>☰</button><div className="brand"><b>LASHA</b><span>ELITE</span></div>
<a aria-label={t.notifs} className="ib bell" href="#/notifications">🔔{unread>0&&<em className="badge">{unread}</em>}</a></header>
{menu&&<div className="scrim" onClick={()=>setMenu(false)}><nav className="drawer" onClick={e=>e.stopPropagation()}>
<a href="#/" onClick={()=>setMenu(false)}>🏠 {t.home}</a>{user&&<a href="#/new">＋ {t.createComp}</a>}<a href="#/notifications">🔔 {t.notifs}</a><a href="#/signin">👤 {user?t.account:t.btnIn}</a>{isAdmin&&<a href="#/admin">⚙ {t.admin}</a>}
<button onClick={toggle}>🌐 {t.lang}</button></nav></div>}
<div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} aria-label={t.search}/><button className="fb" aria-label="Filter">⚙</button></div>
<main lang={lang}>
<section><div className="sh"><h2>{t.follow}</h2><a href="#/following">{t.all} →</a></div>{user?cards(follow,true):<p className="muted">{t.login}</p>}</section>
<section><div className="sh"><h2>{t.recent}</h2><a href="#/activity">{t.all} →</a></div>
{state(act)??act.d.map(a=><a key={a.id} className="act" href={`#/competition/${a.competitionId}`}><span className="ai">⚽</span>
<div className="grow"><b>{t.newRes}: "{a.homePlayer}" vs "{a.awayPlayer}"</b><p className="muted">{a.createdAt?ago(a.createdAt.toMillis()):""}</p></div><span className="chev">›</span></a>)}</section>
<section><p className="eyebrow">{t.discover}</p><h2>{t.orgs}</h2><p className="muted">📍 {region}</p>
{state(orgs)??<div className="grid">{orgs.d.filter(o=>f(o.name)).map(o=><a key={o.id} className="org" href={`#/organizer/${o.id}`}><div className="ol"><Logo url={o.logoUrl} name={o.name}/></div><div><b>{o.name}</b><p className="muted">📍 {o.country}</p></div></a>)}</div>}</section>
{user&&<section><div className="sh"><h2>{t.mine}</h2></div>{cards(mine)}</section>}
</main></div>)}
