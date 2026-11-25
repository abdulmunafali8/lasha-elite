import {FormEvent,useMemo,useState} from "react";
import {addDoc,collection,doc,query,setDoc,updateDoc,where,serverTimestamp} from "firebase/firestore";
import type {User} from "firebase/auth";
import {db} from "./firebase";import {useLive} from "./hooks";import {uniqueCode,defaultCountry} from "./linkUtil";import {useLang} from "./i18n";
import {SPORTS,SOCCER,Dlg,Ic,TROPHY,BALL,PLUS} from "./MyTournaments";
interface Cp{id:string;name:string;logoUrl?:string;status?:string;sport?:string}
type Step=null|"sport"|"soccer"|"new";type Fmt="rr"|"rrko"|"ko";
const sportName=(k?:string)=>SPORTS.find(s=>s[0]===k)?.[1]??SOCCER.find(s=>s[0]===k)?.[1]??"";
export default function CategoriesTab({cid,owner,user,t}:{cid:string;owner:boolean;user:User|null;t:Record<string,string>}){
const {lang}=useLang();
const kids=useLive<Cp>(useMemo(()=>query(collection(db,"competitions"),where("parentId","==",cid)),[cid]));
const [step,setStep]=useState<Step>(null);const [sport,setSport]=useState("soccer");const [name,setName]=useState("");const [fmt,setFmt]=useState<Fmt>("rr");const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");
const list=[...kids.d].sort((a,b)=>a.name.localeCompare(b.name));
const stLabel=(s?:string)=>({prep:t.prep,run:t.sRun,done:t.sDone} as Record<string,string>)[s??"prep"];
const startNew=(k:string)=>{setSport(k);setName("");setFmt("rr");setMsg("");setStep("new")};
const create=async(e:FormEvent)=>{e.preventDefault();if(!user)return;const n=name.trim();if(n.length<3)return setMsg(t.req+": "+t.mtName);setBusy(true);setMsg("");
try{const r=doc(collection(db,"competitions"));
await setDoc(r,{shortCode:await uniqueCode(),country:defaultCountry(),lang,parentId:cid,name:n,subhead:"",description:"",startDate:null,endDate:null,mode:"person",location:"",isPrivate:false,status:"prep",ownerId:user.uid,organizerName:user.displayName??"",logoUrl:null,coverUrl:null,followers:[],createdAt:serverTimestamp()});
for(const i of fmt==="rrko"?[1,2]:[1])await addDoc(collection(db,"competitions",r.id,"stages"),{name:`${t.stage} ${i}`,order:i});
try{await updateDoc(r,{sport})}catch{/* ba muhimmi ba */}
setBusy(false);setStep(null);location.hash=`#/competition/${r.id}`}catch{setMsg(t.err);setBusy(false)}};
return<div className="mt-page">
{kids.loading?<p className="muted pad">{t.loading}</p>:list.length===0?<div className="mt-empty"><span className="mt-big"><Ic d={TROPHY} s={44}/></span><h2>{t.cats}</h2><p>{t.mtCatsD}</p></div>
:<div className="pad">{list.map(c=><a key={c.id} className="mt-row" href={`#/competition/${c.id}`}><span className="mt-lg">{c.logoUrl?<img src={c.logoUrl} alt=""/>:<b>{c.name.slice(0,2).toUpperCase()}</b>}</span><span className="grow"><b>{c.name}</b><small>{[sportName(c.sport),stLabel(c.status)].filter(Boolean).join(" · ")}</small></span><span className="mt-chv">›</span></a>)}</div>}
{owner&&<button type="button" className="mt-fab" aria-label={t.catAdd} onClick={()=>setStep("sport")}><Ic d={PLUS} s={30}/></button>}
{(step==="sport"||step==="soccer")&&<Dlg icon={<Ic d={BALL} s={26}/>} title={t.mtMod} sub={t.mtModSub} onClose={()=>setStep(null)}>
{SPORTS.map(([k,n,e,c])=><button type="button" key={k} className="mt-li" onClick={()=>k==="soccer"?setStep("soccer"):startNew(k)}><span className="mt-sp" style={{background:c}}>{e}</span>{n}<i>›</i></button>)}</Dlg>}
{step==="soccer"&&<Dlg icon={<Ic d={BALL} s={26}/>} title={t.mtMod} sub={t.mtModSub} onClose={()=>setStep("sport")}>
{SOCCER.map(([k,n])=><button type="button" key={k} className="mt-li" onClick={()=>startNew(k)}><span className="mt-sp" style={{background:"#0a7d22"}}>⚽</span>{n}<i>›</i></button>)}</Dlg>}
{step==="new"&&<Dlg icon={<Ic d={PLUS} s={26}/>} title={t.catNew} sub={t.mtNewSub} onClose={()=>setStep(null)}><form onSubmit={create} noValidate>
<label className="mt-lab" htmlFor="ctn">{t.catName}</label><input id="ctn" className="mt-in" value={name} placeholder={t.ctitle} onChange={e=>setName(e.target.value)} autoFocus/>
<p className="mt-h3">{t.mtStages}</p>
{([["rr",t.mtRR],["rrko",t.mtRRKO],["ko",t.mtKO]] as [Fmt,string][]).map(([k,l])=><label key={k} className="mt-rad"><input type="radio" name="cfmt" checked={fmt===k} onChange={()=>setFmt(k)}/>{l}</label>)}
<p className="mt-hint">{t.mtLater}</p>{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="mt-btns"><button type="button" className="mt-cancel" onClick={()=>setStep(null)}>{t.mtCancel}</button><button className="mt-go" disabled={busy}>{busy?t.saving:t.mtCreate}</button></div></form></Dlg>}
</div>}
