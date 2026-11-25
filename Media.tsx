import {useMemo,useState,FormEvent} from "react";
import {addDoc,arrayRemove,arrayUnion,collection,deleteDoc,doc,increment,orderBy,query,serverTimestamp,updateDoc} from "firebase/firestore";
import {User} from "firebase/auth";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";
import "./sheetStyles";
interface Post{id:string;kind:"photo"|"news";text:string;imageUrl?:string|null;likes?:string[];cc?:number;createdAt?:{toMillis():number}}
interface Cm{id:string;text:string;name:string;uid:string}
const Ic=({d,s=22}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const HEART="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z";const CHAT="M4 5h16v11H9l-5 4z";const SHARE="M12 16V4M7 9l5-5 5 5M5 20h14";
const when=(p:Post)=>p.createdAt?new Date(p.createdAt.toMillis()).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"";

function Comments({cid,pid,user,t,onErr,allow=true}:{cid:string;pid:string;user:User|null;t:Record<string,string>;onErr:(s:string)=>void;allow?:boolean}){
const list=useLive<Cm>(useMemo(()=>query(collection(db,"competitions",cid,"posts",pid,"comments"),orderBy("createdAt")),[cid,pid])).d;
const [tx,setTx]=useState("");
const send=async(e:FormEvent)=>{e.preventDefault();const v=tx.trim();if(!v)return;if(!user)return onErr(t.postLoginLike);
try{await addDoc(collection(db,"competitions",cid,"posts",pid,"comments"),{text:v.slice(0,500),uid:user.uid,name:user.displayName||(user.email??"").split("@")[0]||"user",createdAt:serverTimestamp()});
await updateDoc(doc(db,"competitions",cid,"posts",pid),{cc:increment(1)});setTx("")}catch{onErr(t.err)}};
return<div className="md-cm">{list.map(c=><p key={c.id}><b>{c.name}</b> {c.text}</p>)}
{allow&&<form onSubmit={send}><input value={tx} placeholder={t.commentPh} onChange={e=>setTx(e.target.value)} maxLength={500}/><button className="btn sm">{t.qAdd}</button></form>}</div>}

export default function Media({cid,user,owner,name,logoUrl,t,allowComments=true}:{cid:string;user:User|null;owner:boolean;name:string;logoUrl?:string;t:Record<string,string>;allowComments?:boolean}){
const posts=useLive<Post>(useMemo(()=>query(collection(db,"competitions",cid,"posts"),orderBy("createdAt","desc")),[cid]));
const [f,setF]=useState<"all"|"news">("all");const [adding,setAdding]=useState(false);const [kind,setKind]=useState<"photo"|"news">("photo");const [text,setText]=useState("");const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");const [openC,setOpenC]=useState("");
const list=posts.d.filter(p=>f==="all"||p.kind==="news");
const publish=async(e:FormEvent)=>{e.preventDefault();if(!user||!owner)return;const v=text.trim();if(!v&&!file)return setMsg(t.req);if(kind==="photo"&&!file)return setMsg(t.req+": "+t.postPhoto);
setBusy(true);setMsg("");try{let url:string|null=null;if(file)url=await uploadImg(`competitions/${user.uid}/${cid}/posts/${Date.now()}`,file);
await addDoc(collection(db,"competitions",cid,"posts"),{kind,text:v.slice(0,2000),imageUrl:url,likes:[],cc:0,createdAt:serverTimestamp()});setText("");setFile(null);setAdding(false)}catch(x){setMsg(t.err+" ("+(((x as {code?:string}).code)||(x as Error).message)+")")}finally{setBusy(false)}};
const like=async(p:Post)=>{if(!user)return setMsg(t.postLoginLike);const liked=(p.likes??[]).includes(user.uid);try{await updateDoc(doc(db,"competitions",cid,"posts",p.id),{likes:liked?arrayRemove(user.uid):arrayUnion(user.uid)})}catch(x){setMsg(t.err+" ("+(((x as {code?:string}).code)||"")+")")}};
const share=async(p:Post)=>{const txt=p.text||name;try{if(typeof navigator.share==="function")await navigator.share({title:name,text:txt,url:location.href});else{await navigator.clipboard.writeText(txt+" "+location.href);setMsg(t.exCopied)}}catch{/* an soke */}};
const del=async(p:Post)=>{if(!owner||!confirm(t.sure))return;try{await deleteDoc(doc(db,"competitions",cid,"posts",p.id))}catch{setMsg(t.err)}};
return<section className="pad rel">
<div className="md-pills"><button className={"pill"+(f==="all"?" on":"")} onClick={()=>setF("all")}>{t.feedAll}</button><button className={"pill"+(f==="news"?" on":"")} onClick={()=>setF("news")}>{t.feedNews}</button>{owner&&<button className="pill plus" aria-label={t.postNew} onClick={()=>setAdding(!adding)}>+</button>}</div>
{msg&&<p className={"toast"+(msg===t.exCopied?" ok":"")} role="alert" onClick={()=>setMsg("")}>{msg}</p>}
{owner&&adding&&<form className="md-new" onSubmit={publish}><div className="r"><label><input type="radio" name="k" checked={kind==="photo"} onChange={()=>setKind("photo")}/> {t.postPhoto}</label><label><input type="radio" name="k" checked={kind==="news"} onChange={()=>setKind("news")}/> {t.feedNews}</label></div>
<textarea rows={3} placeholder={t.postText} value={text} onChange={e=>setText(e.target.value)} maxLength={2000}/>
<input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]??null)}/>{file&&<img src={URL.createObjectURL(file)} alt=""/>}
<button className="btn" disabled={busy}>{busy?t.saving:t.postPublish}</button></form>}
{posts.loading?<p className="muted">{t.loading}</p>:list.length===0?<p className="muted ctr">{t.noPosts}</p>:list.map(p=>{const liked=!!user&&(p.likes??[]).includes(user.uid);return<article className="md-post" key={p.id}>
<div className="md-ph"><span className="av">{logoUrl?<img src={logoUrl} alt="" width={44} height={44}/>:<b>{name.slice(0,2).toUpperCase()}</b>}</span><span><b>{name}</b><small>{when(p)}</small></span>{owner&&<button className="x" aria-label={t.del} onClick={()=>del(p)}>🗑</button>}</div>
{p.text&&<p className="md-tx">{p.text}</p>}{p.imageUrl&&<div className="md-img"><img src={p.imageUrl} alt="" loading="lazy"/><span className="md-tag">{p.kind==="news"?t.feedNews.toUpperCase():t.postPhoto.toUpperCase()}</span></div>}
<div className="md-act"><button className={liked?"on":""} onClick={()=>like(p)} aria-label="like"><Ic d={HEART}/>{(p.likes??[]).length}</button><button onClick={()=>setOpenC(openC===p.id?"":p.id)} aria-label={t.comments}><Ic d={CHAT}/>{p.cc??0}</button><button onClick={()=>share(p)} aria-label={t.share}><Ic d={SHARE}/></button></div>
{openC===p.id&&<Comments cid={cid} pid={p.id} user={user} t={t} onErr={setMsg} allow={allowComments}/>}</article>})}
</section>}
