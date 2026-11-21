import {useEffect,useMemo,useState,FormEvent,ReactNode} from "react";
import {createPortal} from "react-dom";
import {onAuthStateChanged,User} from "firebase/auth";
import {addDoc,collection,doc,getDoc,query,setDoc,updateDoc,where,serverTimestamp} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
interface Cp{id:string;name:string;logoUrl?:string;status?:string;sport?:string;createdAt?:{toMillis():number}}
type Step=null|"type"|"sport"|"soccer"|"new";type Fmt="rr"|"rrko"|"ko";
const SPORTS:[string,string,string,string][]=[["efootball","eFootball","🎮","#0f1b4d"],["futsal","Futsal","⚽","#0f1b4d"],["soccer","Soccer","⚽","#0a7d22"],["handball","Handball","🤾","#0f2a7a"],["dodgeball","Dodgeball","🏐","#0f2a7a"],["basketball","Basketball","🏀","#f57c00"],["volleyball","Volleyball","🏐","#9e9e9e"],["beachvolley","Beach Volleyball","🏐","#0f2a7a"],["footvolley","Footvolley","🏖️","#2b8fd6"],["tabletennis","Table Tennis","🏓","#b39ddb"],["tennis","Tennis","🎾","#66bb6a"],["beachtennis","Beach Tennis","🏸","#a5d6d6"],["chess","Chess","♟️","#43b88c"],["bocce","Bocce","🎱","#0f1b4d"]];
const SOCCER:[string,string][]=[["soccer","Soccer"],["soccer7","Soccer 7"]];
const sportName=(k?:string)=>SPORTS.find(s=>s[0]===k)?.[1]??SOCCER.find(s=>s[0]===k)?.[1]??"";
const Ic=({d,s=24}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const TROPHY="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3";
const BALL="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 8l3.2 2.3-1.2 3.7h-4l-1.2-3.7zM12 3v5M15.2 10.3L20 8.8M14 14l3 4M10 14l-3 4M8.8 10.3L4 8.8";
const PAD="M6 6h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5.5 1.7L15 13H9l-1.5 1.7A3 3 0 0 1 2 13v-3a4 4 0 0 1 4-4zM7 10h4M9 8v4M15 10.5h.01M17 12.5h.01";
const STORE="M4 9l1.5-5h13L20 9M4 9v10h16V9M4 9h16M9 19v-5h6v5";
const PLUS="M12 5v14M5 12h14";
const Dlg=({icon,title,sub,onClose,children}:{icon:ReactNode;title:string;sub?:string;onClose:()=>void;children:ReactNode})=>createPortal(<div className="mt-wrap" onClick={onClose}><div className="mt-dg" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><div className="mt-dh"><span className="mt-ic">{icon}</span><button type="button" className="mt-x" aria-label="Close" onClick={onClose}>✕</button></div><h2>{title}</h2>{sub?<p className="mt-sub">{sub}</p>:null}{children}</div></div>,document.body);

export default function MyTournaments(){
const {t}=useLang();const [user,setUser]=useState<User|null|undefined>(undefined);const [ok,setOk]=useState<boolean|null>(null);
const [tab,setTab]=useState<"mine"|"org">("mine");const [step,setStep]=useState<Step>(null);const [sport,setSport]=useState("efootball");const [name,setName]=useState("");const [fmt,setFmt]=useState<Fmt>("rr");const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");const [help,setHelp]=useState(false);
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);if(u){try{const s=await getDoc(doc(db,"users",u.uid));setOk(["organizer","superadmin"].includes(s.data()?.role))}catch{setOk(false)}}}),[]);
const mine=useLive<Cp>(useMemo(()=>user?query(collection(db,"competitions"),where("ownerId","==",user.uid)):null,[user]));
const list=[...mine.d].sort((a,b)=>(b.createdAt?.toMillis()??0)-(a.createdAt?.toMillis()??0));
const head=<header className="ch"><div className="chr"><a className="ib" href="#/" aria-label="Back">←</a><h1>{t.mtTitle}</h1><button type="button" className="ib" aria-label="Help" onClick={()=>setHelp(true)}>?</button></div></header>;
if(user===undefined||(user&&ok===null))return<div className="app">{head}<p className="muted pad">{t.loading}</p></div>;
if(!user)return<div className="app">{head}<div className="pad"><p>{t.signin}</p><a className="btn" href="#/signin">{t.btnIn}</a></div></div>;
if(ok===false)return<div className="app">{head}<div className="pad"><p className="toast">{t.orgOnly}</p></div></div>;
const stLabel=(s?:string)=>({prep:t.prep,run:t.sRun,done:t.sDone} as Record<string,string>)[s??"prep"];
const create=async(e:FormEvent)=>{e.preventDefault();const n=name.trim();if(n.length<3)return setMsg(t.req+": "+t.mtName);setBusy(true);setMsg("");
try{const r=doc(collection(db,"competitions"));
await setDoc(r,{name:n,subhead:"",description:"",startDate:null,endDate:null,mode:"person",location:"",isPrivate:false,status:"prep",ownerId:user.uid,organizerName:user.displayName??"",logoUrl:null,coverUrl:null,followers:[],createdAt:serverTimestamp()});
for(const i of fmt==="rrko"?[1,2]:[1])await addDoc(collection(db,"competitions",r.id,"stages"),{name:`${t.stage} ${i}`,order:i});
try{await updateDoc(r,{sport})}catch{/* ba muhimmi ba */}
location.hash=`#/competition/${r.id}`}catch{setMsg(t.err);setBusy(false)}};
const startNew=(k:string)=>{setSport(k);setName("");setFmt("rr");setMsg("");setStep("new")};
const nm=(user.displayName||user.email||"").trim();
return(<div className="app mt-page">{head}{msg&&step===null&&<p className="toast" role="alert" onClick={()=>setMsg("")}>{msg}</p>}
{tab==="mine"&&(mine.loading?<p className="muted pad">{t.loading}</p>:list.length===0?<div className="mt-empty"><span className="mt-big"><Ic d={TROPHY} s={44}/></span><h2>{t.mtEmpty}</h2><p>{t.mtEmptySub}</p></div>
:<div className="pad">{list.map(c=><a key={c.id} className="mt-row" href={`#/competition/${c.id}`}><span className="mt-lg">{c.logoUrl?<img src={c.logoUrl} alt=""/>:<b>{c.name.slice(0,2).toUpperCase()}</b>}</span><span className="grow"><b>{c.name}</b><small>{[sportName(c.sport),stLabel(c.status)].filter(Boolean).join(" · ")}</small></span><span className="mt-chv">›</span></a>)}</div>)}
{tab==="org"&&<div className="pad"><div className="mt-orgc"><span className="mt-lg big">{user.photoURL?<img src={user.photoURL} alt=""/>:<b>{(nm||"?").slice(0,2).toUpperCase()}</b>}</span><h2>{nm}</h2><p className="muted">{user.email}</p><p className="mt-cnt"><b>{list.length}</b> {t.mtTitle}</p></div></div>}
{tab==="mine"&&<button type="button" className="mt-fab" aria-label={t.createComp} onClick={()=>setStep("type")}><Ic d={PLUS} s={30}/></button>}
<nav className="mt-nav"><button type="button" className={tab==="mine"?"on":""} onClick={()=>setTab("mine")}><Ic d={TROPHY} s={26}/>{t.mtTitle}</button><button type="button" className={tab==="org"?"on":""} onClick={()=>setTab("org")}><Ic d={STORE} s={26}/>{t.mtOrg}</button></nav>
{help&&<Dlg icon="?" title={t.mtTitle} onClose={()=>setHelp(false)}><p className="mt-sub">{t.mtHelp}</p><button type="button" className="mt-cancel" onClick={()=>setHelp(false)}>{t.mtCancel}</button></Dlg>}
{step==="type"&&<Dlg icon={<Ic d={TROPHY} s={26}/>} title={t.mtType} sub={t.mtTypeSub} onClose={()=>setStep(null)}>
<button type="button" className="mt-opt" onClick={()=>setStep("sport")}><Ic d={TROPHY} s={26}/><b>{t.mtSingle}</b><small>{t.mtSingleD}</small></button>
<button type="button" className="mt-opt" onClick={()=>{setStep(null);setMsg(t.soon)}}><Ic d={PAD} s={26}/><b>{t.mtCats}</b><small>{t.mtCatsD}</small></button>
<button type="button" className="mt-cancel" onClick={()=>setStep(null)}>{t.mtCancel}</button></Dlg>}
{(step==="sport"||step==="soccer")&&<Dlg icon={<Ic d={BALL} s={26}/>} title={t.mtMod} sub={t.mtModSub} onClose={()=>setStep(null)}>
{SPORTS.map(([k,n,e,c])=><button type="button" key={k} className="mt-li" onClick={()=>k==="soccer"?setStep("soccer"):startNew(k)}><span className="mt-sp" style={{background:c}}>{e}</span>{n}<i>›</i></button>)}</Dlg>}
{step==="soccer"&&<Dlg icon={<Ic d={BALL} s={26}/>} title={t.mtMod} sub={t.mtModSub} onClose={()=>setStep("sport")}>
{SOCCER.map(([k,n])=><button type="button" key={k} className="mt-li" onClick={()=>startNew(k)}><span className="mt-sp" style={{background:"#0a7d22"}}>⚽</span>{n}<i>›</i></button>)}</Dlg>}
{step==="new"&&<Dlg icon={<Ic d={PLUS} s={26}/>} title={t.mtNew} sub={t.mtNewSub} onClose={()=>setStep(null)}><form onSubmit={create} noValidate>
<label className="mt-lab" htmlFor="mtn">{t.mtName}</label><input id="mtn" className="mt-in" value={name} placeholder={t.ctitle} onChange={e=>setName(e.target.value)} autoFocus/>
<p className="mt-h3">{t.mtStages}</p>
{([["rr",t.mtRR],["rrko",t.mtRRKO],["ko",t.mtKO]] as [Fmt,string][]).map(([k,l])=><label key={k} className="mt-rad"><input type="radio" name="fmt" checked={fmt===k} onChange={()=>setFmt(k)}/>{l}</label>)}
<p className="mt-hint">{t.mtLater}</p>{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="mt-btns"><button type="button" className="mt-cancel" onClick={()=>setStep(null)}>{t.mtCancel}</button><button className="mt-go" disabled={busy}>{busy?t.saving:t.mtCreate}</button></div></form></Dlg>}
</div>)}
