import {useEffect,useMemo,useRef,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,onSnapshot,updateDoc,addDoc,deleteDoc,getDocs,query,where,orderBy,writeBatch} from "firebase/firestore";
import {auth,db,uploadImg} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";import ImagePick from "./ImagePick";import Players from "./Players";import Teams from "./Teams";import Groups from "./Groups";import {Stage} from "./types";import {SUPPORT} from "./support";import Moderators,{Mod,FInfo} from "./Moderators";
type C={id:string;name:string;subhead?:string;description?:string;startDate?:string|null;endDate?:string|null;mode?:string;location?:string;isPrivate?:boolean;status?:string;ownerId:string;logoUrl?:string;coverUrl?:string}&Record<string,unknown>;
const TXT:[string,string][]=[["contacts","contacts"],["color","color"],["rules","rules"],["awards","awards"],["website","site"]];
const IC:Record<string,string>={back:"M19 12H5M12 5l-7 7 7 7",cal:"M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 13h3v3H8z",
contacts:"M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M4.5 17c.5-2 2-3 3.5-3s3 1 3.5 3M14 9h4M14 13h4",color:"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",rules:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
awards:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",attach:"M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8",
website:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",teams:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
players:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",groups:"M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
stages:"M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",referees:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
places:"M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4",rating:"M10 6h11M10 12h11M10 18h11M3 7l1.5 1.5L7 6M3 13l1.5 1.5L7 12M3 19l1.5 1.5L7 18",
regs:"M4 4h16v16H4zM8 12l3 3 5-6",pRanking:"M5 21V11M12 21V4M19 21v-7",tResult:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
status:"M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",mods:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 9v6M9 12h6",views:"M3 17l6-6 4 4 8-8M15 7h6v6",media:"M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",comments:"M4 5h16v11H9l-5 4z"};
const Ic=({d,s=24}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const SOON=["referees","places","rating","regs","pRanking","tResult"];
export default function Settings({id}:{id:string}){
const {t}=useLang();const [user,setUser]=useState<User|null|undefined>(undefined);const [c,setC]=useState<C|null>(null);const [msg,setMsg]=useState("");const [rmBusy,setRmBusy]=useState(false);
const [f,setF]=useState({name:"",subhead:"",desc:"",start:"",end:"",mode:"person",place:""});const [ready,setReady]=useState(false);
const [logo,setLogo]=useState<File|null>(null);const [cover,setCover]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [open,setOpen]=useState(()=>{try{const v=sessionStorage.getItem("openSec")||"";sessionStorage.removeItem("openSec");return v}catch{return ""}});const jumped=useRef(false);const [draft,setDraft]=useState("");
useEffect(()=>onAuthStateChanged(auth,setUser),[]);
useEffect(()=>{if(open&&c&&user&&!jumped.current){jumped.current=true;setTimeout(()=>document.getElementById("sec-"+open)?.scrollIntoView({behavior:"smooth"}),250)}},[c,user,open]);
useEffect(()=>onSnapshot(doc(db,"competitions",id),s=>s.exists()&&setC({id:s.id,...s.data()} as C)),[id]);
useEffect(()=>{if(c&&!ready){setF({name:c.name,subhead:c.subhead??"",desc:c.description??"",start:c.startDate??"",end:c.endDate??"",mode:c.mode??"person",place:c.location??""});setReady(true)}},[c,ready]);
const stages=useLive<Stage>(useMemo(()=>query(collection(db,"competitions",id,"stages"),orderBy("order")),[id])).d;
const players=useLive<{id:string;name?:string}>(useMemo(()=>collection(db,"competitions",id,"players") as never,[id])).d;
const back=<header className="ch"><div className="chr"><a className="ib" href={`#/competition/${id}`} aria-label={t.home}><Ic d={IC.back}/></a><h1>{t.settings}</h1></div></header>;
if(user===undefined||!c)return<div className="app">{back}<p className="muted pad">{t.loading}</p></div>;
const modP=user?(c.mods as Record<string,Mod>|undefined)?.[user.uid]:undefined;
if(!user||(user.uid!==c.ownerId&&!modP?.tournament))return<div className="app">{back}<p className="toast">{t.notOwner}</p></div>;
const removeAll=async()=>{if(!confirm(t.rmSure))return;setRmBusy(true);
const wipeSub=async(cid:string,sub:string)=>{const s=await getDocs(collection(db,"competitions",cid,sub));
if(sub==="posts")for(const p of s.docs){try{const cs=await getDocs(collection(db,"competitions",cid,"posts",p.id,"comments"));for(const x of cs.docs)await deleteDoc(x.ref)}catch{/* babu izini */}}
for(let i=0;i<s.docs.length;i+=400){const b=writeBatch(db);s.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}};
const wipe=async(cid:string)=>{for(const sub of ["matches","rounds","stages","groups","players","posts","messages"])await wipeSub(cid,sub);await deleteDoc(doc(db,"competitions",cid))};
try{const kids=await getDocs(query(collection(db,"competitions"),where("parentId","==",id)));for(const k of kids.docs)await wipe(k.id);await wipe(id);location.hash="#/organize"}catch{setMsg(t.err);setRmBusy(false)}};
const upd=(d:Record<string,unknown>)=>updateDoc(doc(db,"competitions",id),d).then(()=>setMsg(t.saved)).catch(e=>{setMsg(t.err+" ("+((e as {code?:string}).code??"")+")")});
const set=(k:string,v:string)=>setF(p=>({...p,[k]:v}));
const saveBasic=async(e:React.FormEvent)=>{e.preventDefault();setMsg("");if(f.name.trim().length<3)return setMsg(t.req+": "+t.ctitle);if(f.start&&f.end&&f.end<f.start)return setMsg(t.endBefore);
setBusy(true);try{const base=`competitions/${user.uid}/${id}`;const d:Record<string,unknown>={name:f.name.trim(),subhead:f.subhead.trim(),description:f.desc.trim(),startDate:f.start||null,endDate:f.end||null,mode:f.mode,location:f.mode==="person"?f.place.trim():""};
if(logo)d.logoUrl=await uploadImg(`${base}/logo`,logo);if(cover)d.coverUrl=await uploadImg(`${base}/cover`,cover);await upd(d);setLogo(null);setCover(null)}catch(e){const x=e as {code?:string;message?:string};setMsg(t.err+" ("+(x.code||x.message||"")+")")}finally{setBusy(false)}};
const editTxt=(k:string)=>{setOpen(open===k?"":k);setDraft(String(c[k]??(k==="color"?"#172B59":"")))};
const saveTxt=async(k:string)=>{if(k==="color"&&!/^#[0-9a-f]{6}$/i.test(draft))return setMsg(t.badColor);await upd({[k]:draft.trim()});setOpen("")};
const addStage=async()=>{const n=prompt(t.stageName)?.trim();if(n)await addDoc(collection(db,"competitions",id,"stages"),{name:n,order:Math.max(0,...stages.map(s=>s.order))+1})};
const renameStage=async(s:Stage)=>{const n=prompt(t.stageName,s.name)?.trim();if(n)await updateDoc(doc(db,"competitions",id,"stages",s.id),{name:n})};
const delStage=async(s:Stage)=>{const r=await getDocs(query(collection(db,"competitions",id,"rounds"),where("stageId","==",s.id)));if(!r.empty)return setMsg(t.stageUsed);if(confirm(t.sure))await deleteDoc(doc(db,"competitions",id,"stages",s.id))};
const Row=({label,k,count,soon}:{label:string;k:string;count?:number;soon?:boolean})=><div className="srow2"><span className="ri"><Ic d={IC[k]||IC.rules}/></span><span className="rl">{label}{count!=null&&` (${count})`}</span>{soon?<em>{t.soon}</em>:<button type="button" className="lnk" onClick={()=>["players","stages","teams","groups"].includes(k)?setOpen(open===k?"":k):editTxt(k)}>{t.edit}</button>}</div>;
return(<div className="app">{back}{msg&&<p className={"toast"+(msg===t.saved?" ok":"")} role="alert" onClick={()=>setMsg("")}>{msg}</p>}
<form className="sform" onSubmit={saveBasic} noValidate><p className="sec">{t.basic}</p>
<div className="two"><ImagePick round label={t.logo} hint="200x240" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={c.logoUrl}/><div className="grow"><label className="fl"><span>{t.ctitle}</span><input value={f.name} onChange={e=>set("name",e.target.value)}/></label><label className="fl"><span>{t.subhead}</span><input value={f.subhead} onChange={e=>set("subhead",e.target.value)}/></label></div></div>
<ImagePick label={t.cover} hint="1600x533" file={cover} onFile={setCover} onErr={k=>setMsg(t[k]??k)} current={c.coverUrl}/>
<label className="fl"><span>{t.desc}</span><textarea rows={4} value={f.desc} onChange={e=>set("desc",e.target.value)}/></label>
<div className="drow"><Ic d={IC.cal}/><label className="fl"><span>{t.startD}</span><input type="date" value={f.start} onChange={e=>set("start",e.target.value)}/></label></div><div className="drow"><Ic d={IC.cal}/><label className="fl"><span>{t.endD}</span><input type="date" value={f.end} onChange={e=>set("end",e.target.value)}/></label></div>
<p className="sec dark">{t.loc}</p><label className="chk"><input type="radio" checked={f.mode==="online"} onChange={()=>set("mode","online")}/>{t.online}</label><label className="chk"><input type="radio" checked={f.mode==="person"} onChange={()=>set("mode","person")}/>{t.person}</label>
{f.mode==="person"&&<label className="fl"><span>{t.place}</span><input value={f.place} onChange={e=>set("place",e.target.value)}/></label>}<button className="btn" disabled={busy}>{busy?t.saving:t.save}</button></form>
<div className="pad">
{TXT.map(([k,l])=><div key={k}><Row label={t[l]} k={k}/>{open===k&&<div className="form">{k==="color"?<input type="color" value={/^#[0-9a-f]{6}$/i.test(draft)?draft:"#172B59"} onChange={e=>setDraft(e.target.value)}/>:<textarea rows={4} value={draft} onChange={e=>setDraft(e.target.value)}/>}<div className="acts"><button className="btn sm" onClick={()=>saveTxt(k)}>{t.save}</button>{k==="color"&&<button className="btn sm ghost" onClick={()=>upd({color:""}).then(()=>setOpen(""))}>{t.del}</button>}</div></div>}</div>)}
<Row label={t.attach} k="attach" soon/>
<p className="sec" style={{marginTop:28}}>{t.tournament}</p>
<span id="sec-players"/><Row label={t.players} k="players" count={players.length}/>{open==="players"&&<Players cid={id} uid={user.uid} t={t}/>}
<Row label={t.teams} k="teams"/>{open==="teams"&&<Teams cid={id} uid={user.uid} t={t}/>}<span id="sec-groups"/><Row label={t.groups} k="groups"/>{open==="groups"&&<Groups cid={id} t={t}/>}
<span id="sec-stages"/><Row label={t.stage} k="stages"/>{open==="stages"&&<div className="form">{stages.map(s=><div key={s.id} className="prow"><b className="grow">{s.name}</b><button className="ib sm" onClick={()=>renameStage(s)} aria-label={t.rename}>✎</button><button className="ib sm" onClick={()=>delStage(s)} aria-label={t.del}>🗑</button></div>)}<button className="btn sm" onClick={addStage}>+ {t.addStage}</button></div>}
{SOON.map(k=><Row key={k} label={t[k]} k={k} soon/>)}
<p className="sec" style={{marginTop:28}}>{t.disclosure}</p>
<label className="srow2 sp"><span className="ri"><Ic d={IC.website}/></span><span className="rl"><b>{t.priv}</b><br/><small className="muted">{t.privT}</small></span><input className="sw" type="checkbox" role="switch" checked={!!c.isPrivate} onChange={e=>upd({isPrivate:e.target.checked})}/></label>
<label className="srow2 sp"><span className="ri"><Ic d={IC.status}/></span><span className="rl">{t.status}</span><select className="sel2" value={c.status??"prep"} onChange={e=>upd({status:e.target.value})}><option value="prep">{t.prep}</option><option value="run">{t.sRun}</option><option value="done">{t.sDone}</option></select></label>
<p className="sec" style={{marginTop:28}}>{t.userMgmt}</p>
<div className="srow2"><span className="ri"><Ic d={IC.mods}/></span><span className="rl">{t.mods}</span>{user.uid===c.ownerId&&<button type="button" className="lnk" onClick={()=>setOpen(open==="mods"?"":"mods")}>{t.edit}</button>}</div>{open==="mods"&&user.uid===c.ownerId&&<Moderators mods={(c.mods as Record<string,Mod>|undefined)??{}} followers={Array.isArray(c.followers)?(c.followers as string[]):[]} info={(c.followerInfo as Record<string,FInfo>|undefined)??{}} owner={c.ownerId} players={players} t={t} upd={upd}/>}
<div className="srow2"><span className="ri"><Ic d={IC.views}/></span><span className="rl">{t.views} ({Number(c.views)||0})</span></div>
<div className="srow2"><span className="ri"><Ic d={IC.players}/></span><span className="rl">{t.followersT} ({Array.isArray(c.followers)?c.followers.length:0})</span></div>
<label className="srow2 sp"><span className="ri"><Ic d={IC.media}/></span><span className="rl"><b>{t.userMedia}</b><br/><small className="muted">{t.userMediaT}</small></span><input className="sw" type="checkbox" role="switch" checked={!!c.allowMedia} onChange={e=>upd({allowMedia:e.target.checked})}/></label>
<label className="srow2 sp"><span className="ri"><Ic d={IC.comments}/></span><span className="rl">{t.allowComments}</span><input className="sw" type="checkbox" role="switch" checked={c.allowComments!==false} onChange={e=>upd({allowComments:e.target.checked})}/></label>
{user.uid===c.ownerId&&<button type="button" className="rmbtn" disabled={rmBusy} onClick={removeAll}>{rmBusy?t.saving:t.rmT}</button>}
{(SUPPORT.email||SUPPORT.whatsapp||SUPPORT.telegram)&&<div className="sup"><h3>{t.doubts}</h3>{SUPPORT.email&&<a href={"mailto:"+SUPPORT.email}>Email: {SUPPORT.email}</a>}{SUPPORT.whatsapp&&<a href={"https://wa.me/"+SUPPORT.whatsapp.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer">WhatsApp: {SUPPORT.whatsapp}</a>}{SUPPORT.telegram&&<a href={SUPPORT.telegram} target="_blank" rel="noopener noreferrer">Telegram: {SUPPORT.telegram}</a>}</div>}</div></div>)}
