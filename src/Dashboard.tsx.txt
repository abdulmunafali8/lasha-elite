import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,getDoc,query,where,orderBy,limit} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
import {Competition,Organizer,Activity} from "./types";

const Logo=({url,name}:{url?:string;name:string})=>url?<img src={url} alt="" loading="lazy"/>:<span className="ph">{name.slice(0,2).toUpperCase()}</span>;
type L<T>={d:T[];loading:boolean;err:boolean};
const Ico=({d}:{d:string})=><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const Chev=()=><svg className="chv" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>;
const IC={trophy:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",bookmark:"M6 3h12v18l-6-4-6 4V3z",users:"M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1a4 4 0 0 0-3-3.9M15 5.1a3 3 0 0 1 0 5.8",link:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",bell:"M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0",user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",globe:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",shield:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"};
const Item=({d,label,href,onClick,badge}:{d:string;label:string;href?:string;onClick?:()=>void;badge?:number})=>{const body=<><Ico d={d}/><span className="di">{label}</span>{!!badge&&<em className="badge static">{badge}</em>}<Chev/></>;
return href?<a className="ditem" href={href} onClick={onClick}>{body}</a>:<button type="button" className="ditem" onClick={onClick}>{body}</button>};

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
const close=()=>setMenu(false);const go=(id:string)=>{setMenu(false);setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"}),60)};
const openLink=()=>{setMenu(false);const v=prompt(t.linkPrompt)?.trim();if(!v)return;const m=v.match(/#\/competition\/([A-Za-z0-9]+)/)??v.match(/^([A-Za-z0-9]{15,})$/);if(m)location.hash=`#/competition/${m[1]}`;else alert(t.linkBad)};
const nm=(user?.displayName||user?.email||"").trim();const ini=nm?nm.slice(0,2).toUpperCase():"?";
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
{menu&&<div className="scrim" onClick={close}><nav className="drawer" onClick={e=>e.stopPropagation()}>
<div className="dhead"><a className="dprof" href="#/signin" onClick={close}><span className="av">{user?.photoURL?<img src={user.photoURL} alt=""/>:<b>{ini}</b>}</span><span className="dn">{user?nm:t.btnIn}</span><Chev/></a></div>
<div className="dbody">
<p className="dsec">{t.tournaments}</p>
<Item d={IC.trophy} label={t.organize} href={user?"#/organize":"#/signin"} onClick={close}/>
<Item d={IC.bookmark} label={t.follow} onClick={()=>go("follow")}/>
<Item d={IC.users} label={t.orgsShort} onClick={()=>go("orgs")}/>
<Item d={IC.link} label={t.openLink} onClick={openLink}/>
<p className="dsec">{t.prefs}</p>
<Item d={IC.globe} label={t.lang} onClick={toggle}/>
<p className="dsec">{t.userSec}</p>
<Item d={IC.bell} label={t.notifs} href="#/notifications" onClick={close} badge={unread}/>
<Item d={IC.user} label={user?t.account:t.btnIn} href="#/signin" onClick={close}/>
{isAdmin&&<Item d={IC.shield} label={t.admin} href="#/admin" onClick={close}/>}
</div></nav></div>}
<div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} aria-label={t.search}/><button className="fb" aria-label="Filter">⚙</button></div>
<main lang={lang}>
<section id="follow"><div className="sh"><h2>{t.follow}</h2><a href="#/following">{t.all} →</a></div>{user?cards(follow,true):<p className="muted">{t.login}</p>}</section>
<section><div className="sh"><h2>{t.recent}</h2><a href="#/activity">{t.all} →</a></div>
{state(act)??act.d.map(a=><a key={a.id} className="act" href={`#/competition/${a.competitionId}`}><span className="ai">⚽</span>
<div className="grow"><b>{t.newRes}: "{a.homePlayer}" vs "{a.awayPlayer}"</b><p className="muted">{a.createdAt?ago(a.createdAt.toMillis()):""}</p></div><span className="chev">›</span></a>)}</section>
<section id="orgs"><p className="eyebrow">{t.discover}</p><h2>{t.orgs}</h2><p className="muted">📍 {region}</p>
{state(orgs)??<div className="grid">{orgs.d.filter(o=>f(o.name)).map(o=><a key={o.id} className="org" href={`#/organizer/${o.id}`}><div className="ol"><Logo url={o.logoUrl} name={o.name}/></div><div><b>{o.name}</b><p className="muted">📍 {o.country}</p></div></a>)}</div>}</section>
{user&&<section><div className="sh"><h2>{t.mine}</h2></div>{cards(mine)}</section>}
</main></div>)}
