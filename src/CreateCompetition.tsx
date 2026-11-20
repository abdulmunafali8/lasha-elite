import {useEffect,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {addDoc,collection,doc,getDoc,setDoc,serverTimestamp} from "firebase/firestore";
import {auth,db,uploadImg} from "./firebase";import {useLang} from "./i18n";import ImagePick from "./ImagePick";
export default function CreateCompetition(){
const {t}=useLang();const [user,setUser]=useState<User|null|undefined>(undefined);const [ok,setOk]=useState<boolean|null>(null);
const [f,setF]=useState({name:"",subhead:"",desc:"",start:"",end:"",mode:"person",place:"",priv:false});
const [logo,setLogo]=useState<File|null>(null);const [cover,setCover]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);if(u){const s=await getDoc(doc(db,"users",u.uid));setOk(["organizer","superadmin"].includes(s.data()?.role))}}),[]);
const set=(k:string,v:string|boolean)=>setF(p=>({...p,[k]:v}));const err=(k:string)=>setMsg((t as Record<string,string>)[k]??k);
if(user===undefined)return<div className="app"><p className="muted pad">{t.loading}</p></div>;
if(!user)return<div className="app"><div className="pad"><p>{t.signin}</p><a className="btn" href="#/signin">{t.btnIn}</a></div></div>;
if(ok===false)return<div className="app"><div className="pad"><p className="toast">{t.orgOnly}</p><a className="btn" href="#/">←</a></div></div>;
const submit=async(e:React.FormEvent)=>{e.preventDefault();setMsg("");
if(f.name.trim().length<3)return setMsg(t.req+": "+t.ctitle);
if(f.start&&f.end&&f.end<f.start)return setMsg(t.endBefore);
setBusy(true);try{const r=doc(collection(db,"competitions"));const base=`competitions/${user.uid}/${r.id}`;
const [logoUrl,coverUrl]=await Promise.all([logo?uploadImg(`${base}/logo`,logo):null,cover?uploadImg(`${base}/cover`,cover):null]);
await setDoc(r,{name:f.name.trim(),subhead:f.subhead.trim(),description:f.desc.trim(),startDate:f.start||null,endDate:f.end||null,mode:f.mode,location:f.mode==="person"?f.place.trim():"",isPrivate:f.priv,status:"prep",ownerId:user.uid,organizerName:user.displayName??"",logoUrl,coverUrl,followers:[],createdAt:serverTimestamp()});
await addDoc(collection(db,"competitions",r.id,"stages"),{name:`${t.stage} 1`,order:1});location.hash=`#/competition/${r.id}`}catch{setMsg(t.err);setBusy(false)}};
return(<div className="app"><header className="ch"><div className="chr"><a className="ib" href="#/">←</a><h1>{t.createComp}</h1></div></header>
<form className="form pad" onSubmit={submit} noValidate>
<div className="two"><ImagePick round label={t.logo} hint="200x240" file={logo} onFile={setLogo} onErr={err}/><div className="grow"><label>{t.ctitle}<input value={f.name} onChange={e=>set("name",e.target.value)}/></label><label>{t.subhead}<input value={f.subhead} onChange={e=>set("subhead",e.target.value)}/></label></div></div>
<ImagePick label={t.cover} hint="1600x533" file={cover} onFile={setCover} onErr={err}/>
<label>{t.desc}<textarea rows={4} value={f.desc} onChange={e=>set("desc",e.target.value)}/></label>
<label>{t.startD}<input type="date" value={f.start} onChange={e=>set("start",e.target.value)}/></label>
<label>{t.endD}<input type="date" value={f.end} onChange={e=>set("end",e.target.value)}/></label>
<label className="chk"><input type="radio" checked={f.mode==="online"} onChange={()=>set("mode","online")}/>{t.online}</label>
<label className="chk"><input type="radio" checked={f.mode==="person"} onChange={()=>set("mode","person")}/>{t.person}</label>
{f.mode==="person"&&<label>{t.place}<input value={f.place} onChange={e=>set("place",e.target.value)}/></label>}
<label className="chk"><input type="checkbox" checked={f.priv} onChange={e=>set("priv",e.target.checked)}/>{t.privT}</label>
{msg&&<p className="toast" role="alert">{msg}</p>}<button className="btn" disabled={busy}>{busy?t.saving:t.save}</button></form></div>)}
