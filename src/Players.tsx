import {useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc} from "firebase/firestore";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";import ImageSource from "./ImageSource";
interface P{id:string;name:string;gamertag?:string;phone?:string;logoUrl?:string;ownLogo?:string|null;teamId?:string|null;groupId?:string|null}
interface N{id:string;name:string;logoUrl?:string}
const IC={edit:"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",trash:"M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",share:"M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",layers:"M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"};
const Ic=({d}:{d:string})=><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
export default function Players({cid,uid,t}:{cid:string;uid:string;t:Record<string,string>}){
const list=useLive<P>(useMemo(()=>query(collection(db,"competitions",cid,"players"),orderBy("name")),[cid])).d;
const teams=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"teams"),orderBy("name")),[cid])).d;const groups=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"groups"),orderBy("order")),[cid])).d;
const [teamId,setTeamId]=useState("");const [groupId,setGroupId]=useState("");const [edit,setEdit]=useState<P|null>(null);const [open,setOpen]=useState(false);const [name,setName]=useState("");const [tag,setTag]=useState("");const [phone,setPhone]=useState("");const [logo,setLogo]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
const [src,setSrc]=useState<"form"|null>(null);const lp=useMemo(()=>logo?URL.createObjectURL(logo):"",[logo]);useEffect(()=>()=>{if(lp)URL.revokeObjectURL(lp)},[lp]);
const [qn,setQn]=useState("");const [qm,setQm]=useState("");const fr=useRef<HTMLFormElement>(null);
useEffect(()=>{if(open)setTimeout(()=>fr.current?.scrollIntoView({behavior:"smooth",block:"center"}),80)},[open,edit]);
const quickAdd=async(e:React.FormEvent)=>{e.preventDefault();const n=qn.trim();setQm("");if(n.length<2)return setQm(t.req+": "+t.playerName);if(list.some(p=>p.name.toLowerCase()===n.toLowerCase()))return setQm(t.playerName+"?");setBusy(true);try{await addDoc(collection(db,"competitions",cid,"players"),{name:n,gamertag:"",phone:"",teamId:null,teamName:null,groupId:null,ownLogo:null,logoUrl:null,createdAt:Date.now()});setQn("")}catch{setQm(t.err)}finally{setBusy(false)}};

const gotFile=(f:File)=>{setLogo(f);setTeamId("")};
const badImg=()=>setMsg(t.imgBad);
const gotLib=(id:string)=>{if(teams.some(z=>z.id===id)){setTeamId(id);setLogo(null)}};
const prev=logo?lp:teams.find(x=>x.id===teamId)?.logoUrl??edit?.logoUrl;
const delAll=()=>{if(confirm(t.sure))list.forEach(p=>void deleteDoc(doc(db,"competitions",cid,"players",p.id)))};
const start=(p:P|null)=>{setEdit(p);setName(p?.name??"");setTag(p?.gamertag??"");setPhone(p?.phone??"");setTeamId(p?.teamId??"");setGroupId(p?.groupId??"");setLogo(null);setMsg("");setOpen(true)};
const save=async(e:React.FormEvent)=>{e.preventDefault();const n=name.trim();if(n.length<2)return setMsg(t.req+": "+t.playerName);
if(phone&&!/^[+\d][\d\s-]{6,16}$/.test(phone))return setMsg(t.phone);
if(list.some(p=>p.id!==edit?.id&&p.name.toLowerCase()===n.toLowerCase()))return setMsg(t.playerName+"?");
setBusy(true);try{const team=teams.find(x=>x.id===teamId);const data:Record<string,unknown>={name:n,gamertag:tag.trim(),phone:phone.trim(),teamId:teamId||null,teamName:team?.name??null,groupId:groupId||null};
const ref=edit?doc(db,"competitions",cid,"players",edit.id):await addDoc(collection(db,"competitions",cid,"players"),{...data,createdAt:Date.now()});
let own=edit?.ownLogo??(edit&&!edit.teamId?edit.logoUrl:undefined);if(logo)own=await uploadImg(`competitions/${uid}/${cid}/players/${ref.id}`,logo);data.ownLogo=own??null;data.logoUrl=team?.logoUrl??own??null;
await updateDoc(ref,data);setOpen(false)}catch{setMsg(t.err)}finally{setBusy(false)}};
const del=(p:P)=>confirm(t.sure)&&deleteDoc(doc(db,"competitions",cid,"players",p.id));
return(<div className="pad"><form className="qadd" onSubmit={quickAdd} noValidate><input value={qn} onChange={e=>setQn(e.target.value)} placeholder={t.playerName} aria-label={t.playerName}/><button className="btn sm" disabled={busy}>{t.qAdd}</button></form>
{qm&&<p className="toast" role="alert">{qm}</p>}
<div className="tot"><span>{t.qTotal}: {list.length}</span><span className="tact"><button type="button" className="tbtn" onClick={()=>start(null)} aria-label={t.addPlayer}>+</button>{list.length>0&&<button type="button" className="tbtn" onClick={delAll} aria-label={t.del}><Ic d={IC.trash}/></button>}</span></div>
{open&&createPortal(<div className="exscrim" onClick={()=>setOpen(false)}><form ref={fr} className="pm" onSubmit={save} noValidate onClick={e=>e.stopPropagation()}>
<div className="pm-top"><button type="button" className="pm-x" aria-label={t.cancel} onClick={()=>setOpen(false)}>✕</button><button type="button" className="pm-sh" aria-label={t.share} onClick={()=>{if(navigator.share)void navigator.share({title:name,text:name}).catch(()=>{})}}><Ic d={IC.share}/></button></div>
<div className="pm-row"><button type="button" className="logobox" onClick={()=>setSrc("form")} aria-label={t.logo}>{prev?<img src={prev} alt=""/>:<><b>+</b><small>200x240</small></>}</button><label className="fl"><span>{t.playerName}</span><input value={name} onChange={e=>setName(e.target.value)}/></label></div>
<label className="fl"><span>{t.gamertag}</span><input value={tag} onChange={e=>setTag(e.target.value)}/></label>
<label className="fl"><span>{t.phone}</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
{groups.length>0&&<div className="pm-sel"><select aria-label={t.groups} value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">{t.groups}</option>{groups.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><Ic d={IC.layers}/></div>}
{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="pm-foot">{edit?<button type="button" className="pm-rm" onClick={()=>{if(confirm(t.sure)){void del(edit);setOpen(false)}}}>{t.del}</button>:<span/>}<button className="pm-save" disabled={busy}>{busy?t.saving:t.save}</button></div></form></div>,document.body)}
{src&&<ImageSource t={t} library={teams.filter(x=>x.logoUrl)} onFile={gotFile} onBad={badImg} onLibrary={gotLib} onClose={()=>setSrc(null)}/>}
{list.map(p=><button type="button" key={p.id} className="trow" onClick={()=>start(p)}><span className={"tcr"+(p.logoUrl?" img":"")}>{p.logoUrl?<img src={p.logoUrl} alt=""/>:p.name.slice(0,2).toUpperCase()}</span><span className="grow tn"><b>{p.name}</b>{p.gamertag&&<small className="muted">{p.gamertag}</small>}</span><i className="tch">›</i></button>)}</div>)}
