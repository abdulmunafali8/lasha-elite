import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,getDoc,query,where,orderBy,limit} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
import "./sheetStyles";import {SUPPORT} from "./support";import {Competition,Organizer,Activity} from "./types";import {getTheme,setTheme,Theme} from "./theme";

const Logo=({url,name}:{url?:string;name:string})=>url?<img src={url} alt="" loading="lazy"/>:<span className="ph">{name.slice(0,2).toUpperCase()}</span>;
type L<T>={d:T[];loading:boolean;err:boolean};
const Ico=({d}:{d:string})=><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const Chev=()=><svg className="chv" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>;
const IC={trophy:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",bookmark:"M6 3h12v18l-6-4-6 4V3z",users:"M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1a4 4 0 0 0-3-3.9M15 5.1a3 3 0 0 1 0 5.8",link:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",bell:"M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0",user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",globe:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",shield:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",contacts:"M3 5h18v14H3zM8.5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5.5 17c.5-2 2-3 3-3s2.5 1 3 3M14 9h5M14 13h4",yt:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M10 8.5v7l6-3.5z",doc:"M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",priv:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 11v5M12 8h.01",pin:"M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4"};
type Flt={c:boolean;cv:string;l:boolean;lv:string;k:"all"|"pub"|"org"};
const DEF:Flt={c:false,cv:"NG",l:false,lv:"ha",k:"all"};
const COUNTRIES:[string,string][]=[["NG","Nigeria"],["NE","Niger"],["GH","Ghana"],["CM","Cameroon"],["TD","Chad"],["SN","Senegal"],["ML","Mali"],["BF","Burkina Faso"],["CI","Côte d'Ivoire"],["TG","Togo"],["BJ","Benin"],["KE","Kenya"],["ZA","South Africa"],["EG","Egypt"],["GB","United Kingdom"],["US","United States"],["BR","Brasil"]];
const Item=({d,label,href,onClick,badge}:{d:string;label:string;href?:string;onClick?:()=>void;badge?:number})=>{const body=<><Ico d={d}/><span className="di">{label}</span>{!!badge&&<em className="badge static">{badge}</em>}<Chev/></>;
return href?<a className="ditem" href={href} onClick={onClick}>{body}</a>:<button type="button" className="ditem" onClick={onClick}>{body}</button>};

export default function Dashboard(){
const {t,toggle,lang}=useLang();const [user,setUser]=useState<User|null>(null);const [q,setQ]=useState("");const [region,setRegion]=useState(()=>{try{return localStorage.getItem("region")||"NG"}catch{return"NG"}});const [menu,setMenu]=useState(false);const [dlg,setDlg]=useState<""|"contacts"|"loc"|"theme">("");const [moreO,setMoreO]=useState(false);const [fs,setFs]=useState(false);
const [flt,setFlt]=useState<Flt>(()=>{try{return {...DEF,...JSON.parse(localStorage.getItem("dflt")||"{}")}}catch{return DEF}});const [dr,setDr]=useState<Flt>(DEF);const [theme,setThemeS]=useState<Theme>(getTheme());const [isAdmin,setIsAdmin]=useState(false);const [ci,setCi]=useState(0);
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);setIsAdmin(false);if(u){try{setIsAdmin((await getDoc(doc(db,"users",u.uid))).data()?.role==="superadmin")}catch{}}}),[]);
const follow=useLive<Competition>(useMemo(()=>user?query(collection(db,"competitions"),where("followers","array-contains",user.uid)):null,[user]));
const mine=useLive<Competition>(useMemo(()=>user?query(collection(db,"competitions"),where("ownerId","==",user.uid)):null,[user]));
const act=useLive<Activity>(useMemo(()=>query(collection(db,"activity"),orderBy("createdAt","desc"),limit(5)),[]));
const orgs=useLive<Organizer>(useMemo(()=>query(collection(db,"organizers"),where("country","==",flt.c?flt.cv:region),limit(60)),[region,flt.c,flt.cv]));
const pubc=useLive<Competition>(useMemo(()=>query(collection(db,"competitions"),where("isPrivate","==",false),limit(60)),[]));
const nots=useLive<{id:string;createdAt?:{toMillis():number}}>(useMemo(()=>query(collection(db,"notifications"),orderBy("createdAt","desc"),limit(20)),[]));
let seen=0;try{seen=Number(localStorage.getItem("seenN")||0)}catch{}
const unread=nots.d.filter(n=>(n.createdAt?.toMillis()??0)>seen).length;
const close=()=>setMenu(false);const go=(id:string)=>{setMenu(false);setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"}),60)};
const openLink=()=>{setMenu(false);const v=prompt(t.linkPrompt)?.trim();if(!v)return;const m=v.match(/#\/competition\/([A-Za-z0-9]+)/)??v.match(/^([A-Za-z0-9]{15,})$/);const sc=v.match(/#\/c\/([A-Za-z0-9]+)/)??v.match(/^([a-z0-9]{6})$/i);if(m)location.hash=`#/competition/${m[1]}`;else if(sc)location.hash=`#/c/${sc[1].toLowerCase()}`;else alert(t.linkBad)};
const nm=(user?.displayName||user?.email||"").trim();const ini=nm?nm.slice(0,2).toUpperCase():"?";
const f=(s:string)=>s.toLowerCase().includes(q.toLowerCase());
const okf=(c:unknown)=>{const z=c as {country?:string;lang?:string};return(!flt.c||!z.country||z.country===flt.cv)&&(!flt.l||!z.lang||z.lang===flt.lv)};
const hc=flt.k==="org"?{display:"none"}:undefined;const ho=flt.k==="pub"?{display:"none"}:undefined;
const ago=(ms:number)=>{const m=Math.floor((Date.now()-ms)/60000);return m<1?t.now:m<60?`${m} ${t.min} ${t.ago}`:`${Math.floor(m/60)} ${t.hr} ${t.ago}`};
const state=(x:{loading:boolean;err:boolean;d:unknown[]})=>x.loading?<p className="muted">{t.loading}</p>:x.err?<p className="muted">{t.err}</p>:x.d.length===0?<p className="muted">{t.none}</p>:null;
const cards=(x:L<Competition>,dots?:boolean)=>{const list=x.d.filter(c=>f(c.name)&&!(c as unknown as {parentId?:string}).parentId&&okf(c));return state({...x,d:list})??<><div className="hscroll" onScroll={e=>{const el=e.currentTarget;const c=el.firstElementChild as HTMLElement|null;if(c)setCi(Math.round(el.scrollLeft/(c.offsetWidth+12)))}}>{list.map(c=><a key={c.id} className="card" href={`#/competition/${c.id}`}>
<div className={"cover"+(c.coverUrl?"":" stripes")} style={c.coverUrl?{backgroundImage:`url(${c.coverUrl})`}:undefined}/>
<div className="clogo"><Logo url={c.logoUrl} name={c.name}/></div><h3>{c.name}</h3><p className="muted">🏆 {c.organizerName}</p></a>)}</div>
{dots&&list.length>1&&<div className="dots" aria-hidden="true">{list.map((c,i)=><i key={c.id} className={i===ci?"on":""}/>)}</div>}</>};
return(<div className="app">
<header><button aria-label={t.menu} className="ib" onClick={()=>setMenu(true)}>☰</button><div className="brand"><b>LASHA</b><span>ELITE</span></div>
<a aria-label={t.notifs} className="ib bell" href="#/notifications">🔔{unread>0&&<em className="badge">{unread}</em>}</a></header>
{fs&&<div className="sh-wrap" onClick={()=>setFs(false)}><div className="sh-sheet" role="dialog" aria-label={t.flT} onClick={e=>e.stopPropagation()}>
<span className="sh-grab"/><div className="sh-top"><h2>{t.flT}</h2><button type="button" className="sh-x" aria-label={t.cancel} onClick={()=>setFs(false)}>✕</button></div>
<p className="sh-sub">{t.flSub}</p>
<div className="fl-box"><input type="checkbox" checked={dr.c} onChange={e=>setDr({...dr,c:e.target.checked})} aria-label={t.flCountry}/><label><small>{t.flCountry}</small><select value={dr.cv} onChange={e=>setDr({...dr,cv:e.target.value,c:true})}>{COUNTRIES.map(([k,n])=><option key={k} value={k}>{n}</option>)}</select></label></div>
<div className="fl-box"><input type="checkbox" checked={dr.l} onChange={e=>setDr({...dr,l:e.target.checked})} aria-label={t.flLang}/><label><small>{t.flLang}</small><select value={dr.lv} onChange={e=>setDr({...dr,lv:e.target.value,l:true})}><option value="ha">Hausa</option><option value="en">English</option></select></label></div>
<h3 className="fl-h">{t.flKind}</h3><div className="fl-chips">{(["all","pub","org"] as const).map(k=><button type="button" key={k} className={"fl-chip"+(dr.k===k?" on":"")} onClick={()=>setDr({...dr,k})}>{k==="all"?t.flAllC:k==="pub"?t.flPub:t.orgsShort}</button>)}</div>
<div className="fl-acts"><button type="button" onClick={()=>{setFlt(DEF);try{localStorage.removeItem("dflt")}catch{/* babu ajiya */}setFs(false)}}>{t.flClear}</button><button type="button" className="go" onClick={()=>{setFlt(dr);try{localStorage.setItem("dflt",JSON.stringify(dr))}catch{/* babu ajiya */}setFs(false)}}>{t.save}</button></div>
</div></div>}
{dlg==="theme"&&<div className="sh-wrap" onClick={()=>setDlg("")}><div className="sh-sheet" role="dialog" aria-label={t.appTheme} onClick={e=>e.stopPropagation()}>
<h2 className="th-h">{t.appTheme}</h2><p className="sh-sub">{t.themeSub}</p>
{([["system",t.themeSystem,t.themeSystemD,"M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2"],["light",t.themeLight,t.themeLightD,"M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"],["dark",t.themeDark,t.themeDarkD,"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"]] as [Theme,string,string,string][]).map(([k,n,s,d])=><button type="button" key={k} className={"th-opt"+(theme===k?" on":"")} onClick={()=>{setTheme(k);setThemeS(k);setDlg("")}}><Ico d={d}/><span><b>{n}</b><small>{s}</small></span>{theme===k&&<i className="th-ck">✓</i>}</button>)}
</div></div>}
{dlg==="contacts"&&<div className="mo-wrap" onClick={()=>setDlg("")}><div className="ct-box" role="dialog" aria-label={t.contactsT} onClick={e=>e.stopPropagation()}><h2>{t.contactsT}</h2>
{SUPPORT.email&&<a className="ct-row" href={"mailto:"+SUPPORT.email}><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="#d9d4e5" d="M3 5h18a1 1 0 0 1 1 1v.6l-10 6-10-6V6a1 1 0 0 1 1-1zM2 8.9l10 6 10-6V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg><span>{SUPPORT.email}</span></a>}
{SUPPORT.whatsapp&&<a className="ct-row" href={"https://wa.me/"+SUPPORT.whatsapp.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="#3dbb4a" d="M5 3h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-5 4V4a1 1 0 0 1 1-1z"/></svg><span>WhatsApp</span></a>}
{SUPPORT.telegram&&<a className="ct-row" href={SUPPORT.telegram} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="#1e88e5" d="M5 3h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-5 4V4a1 1 0 0 1 1-1z"/></svg><span>Telegram</span></a>}
{!(SUPPORT.email||SUPPORT.whatsapp||SUPPORT.telegram)&&<p className="ct-none">{t.none}</p>}</div></div>}
{dlg==="loc"&&<div className="mo-wrap" onClick={()=>setDlg("")}><div className="mo-box" role="dialog" aria-label={t.locationT} onClick={e=>e.stopPropagation()}><h2>{t.locationT}</h2>
{COUNTRIES.map(([k,n])=><button type="button" key={k} className="mo-row" onClick={()=>{setRegion(k);try{localStorage.setItem("region",k)}catch{/* babu ajiya */}setDlg("")}}><b>{n}</b>{region===k&&<span> ✓</span>}</button>)}</div></div>}
{menu&&<div className="scrim" onClick={close}><nav className="drawer" onClick={e=>e.stopPropagation()}>
<div className="dhead"><a className="dprof" href={user?"#/me":"#/signin"} onClick={close}><span className="av">{user?.photoURL?<img src={user.photoURL} alt=""/>:<b>{ini}</b>}</span><span className="dn">{user?nm:t.btnIn}</span><Chev/></a></div>
<div className="dbody">
<p className="dsec">{t.tournaments}</p>
<Item d={IC.trophy} label={t.organize} href={user?"#/organize":"#/signin"} onClick={close}/>
<Item d={IC.bookmark} label={t.follow} onClick={()=>go("follow")}/>
<Item d={IC.users} label={t.orgsShort} onClick={()=>go("orgs")}/>
<Item d={IC.link} label={t.openLink} onClick={openLink}/>
<p className="dsec">{t.helpSec}</p>
<Item d={IC.contacts} label={t.contactsT} onClick={()=>{setMenu(false);setDlg("contacts")}}/>
{SUPPORT.youtube&&<Item d={IC.yt} label={t.ytT} onClick={()=>{close();window.open(SUPPORT.youtube,"_blank","noopener")}}/>}
<Item d={IC.doc} label={t.termsT} onClick={()=>{close();location.hash="#/terms"}}/>
<Item d={IC.priv} label={t.privPolicy} onClick={()=>{close();location.hash="#/privacy"}}/>
<p className="dsec">{t.prefs}</p>
<Item d={IC.pin} label={`${t.locationT}: ${region}`} onClick={()=>{setMenu(false);setDlg("loc")}}/>
<Item d={IC.globe} label={t.lang} onClick={toggle}/>
<Item d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" label={`${t.appTheme}: ${theme==="dark"?t.themeDark:theme==="system"?t.themeSystem:t.themeLight}`} onClick={()=>{setMenu(false);setDlg("theme")}}/>
<p className="dsec">{t.userSec}</p>
<Item d={IC.bell} label={t.notifs} href="#/notifications" onClick={close} badge={unread}/>
<Item d={IC.user} label={user?t.account:t.btnIn} href={user?"#/me":"#/signin"} onClick={close}/>
{isAdmin&&<Item d={IC.shield} label={t.admin} href="#/admin" onClick={close}/>}
</div></nav></div>}
<div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} aria-label={t.search}/><button className="fb" aria-label={t.flT} onClick={()=>{setDr(flt);setFs(true)}}>⚙</button></div>
<main lang={lang}>
<section id="follow" style={hc}><div className="sh"><h2>{t.follow}</h2><a href="#/following">{t.all} →</a></div>{user?cards(follow,true):<p className="muted">{t.login}</p>}</section>
<section style={hc}><div className="sh"><h2>{t.flPub}</h2></div>{cards(pubc)}</section>
<section style={hc}><div className="sh"><h2>{t.recent}</h2><a href="#/activity">{t.all} →</a></div>
{state(act)??act.d.map(a=><a key={a.id} className="act" href={`#/competition/${a.competitionId}`}><span className="ai">⚽</span>
<div className="grow"><b>{t.newRes}: "{a.homePlayer}" vs "{a.awayPlayer}"</b><p className="muted">{a.createdAt?ago(a.createdAt.toMillis()):""}</p></div><span className="chev">›</span></a>)}</section>
<section id="orgs" style={ho}><p className="eyebrow">{t.discover}</p><h2>{t.orgs}</h2><button type="button" className="orgloc" onClick={()=>setDlg("loc")}>📍 {flt.c?flt.cv:region} ▾</button>
{state(orgs)??<><div className="grid">{(moreO?orgs.d.filter(o=>f(o.name)):orgs.d.filter(o=>f(o.name)).slice(0,8)).map(o=><a key={o.id} className="org" href={`#/organizer/${o.id}`}><div className="ol"><Logo url={o.logoUrl} name={o.name}/></div><div><b>{o.name}</b><p className="muted">📍 {o.country}</p></div></a>)}</div>{!moreO&&orgs.d.filter(o=>f(o.name)).length>8&&<button type="button" className="orgmore" onClick={()=>setMoreO(true)}>{t.exploreOrgs} →</button>}</>}</section>
{user&&<section style={hc}><div className="sh"><h2>{t.mine}</h2></div>{cards(mine)}</section>}
</main></div>)}
