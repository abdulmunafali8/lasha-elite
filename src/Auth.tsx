import {useEffect,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,updateProfile,User} from "firebase/auth";
import {doc,getDoc,setDoc,serverTimestamp} from "firebase/firestore";import {auth,db} from "./firebase";import {useLang} from "./i18n";
type Mode="in"|"up"|"forgot";
export default function Auth(){
const {t,toggle}=useLang();const [user,setUser]=useState<User|null>(null);const [mode,setMode]=useState<Mode>("in");
const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [name,setName]=useState("");const [role,setRole]=useState("organizer");
const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
const [isAdmin,setIsAdmin]=useState(false);
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);setIsAdmin(false);if(u){try{setIsAdmin((await getDoc(doc(db,"users",u.uid))).data()?.role==="superadmin")}catch{}}}),[]);
const submit=async(e:React.FormEvent)=>{e.preventDefault();setMsg("");
if(!email.includes("@"))return setMsg(t.req+": "+t.email);
if(mode==="up"&&name.trim().length<2)return setMsg(t.req+": "+t.name);
if(mode!=="forgot"&&pw.length<6)return setMsg(t.pwShort);
setBusy(true);try{
if(mode==="forgot"){await sendPasswordResetEmail(auth,email);setMsg(t.resetSent)}
else if(mode==="in"){await signInWithEmailAndPassword(auth,email,pw);location.hash="#/"}
else{const c=await createUserWithEmailAndPassword(auth,email,pw);await updateProfile(c.user,{displayName:name.trim()});
await setDoc(doc(db,"users",c.user.uid),{name:name.trim(),email,role,createdAt:serverTimestamp()});
if(role==="organizer")await setDoc(doc(db,"organizers",c.user.uid),{name:name.trim(),country:"NG"});location.hash="#/"}
}catch{setMsg(t.authErr)}finally{setBusy(false)}};
if(user)return(<div className="app"><header className="ch"><div className="chr"><a className="ib" href="#/">←</a><h1>{t.account}</h1></div></header>
<div className="pad"><h2>{user.displayName}</h2><p className="muted">{user.email}</p>{isAdmin&&<a className="btn" href="#/admin">{t.adminLink}</a>}<button className="btn" onClick={()=>signOut(auth).then(()=>location.hash="#/")}>{t.signout}</button></div></div>);
return(<div className="app"><header className="ch"><div className="chr"><a className="ib" href="#/">←</a><h1>LASHA ELITE</h1><button className="ib" onClick={toggle}>{t.lang}</button></div></header>
<form className="form pad" onSubmit={submit} noValidate><h2>{mode==="in"?t.btnIn:mode==="up"?t.btnUp:t.forgot}</h2>
{mode==="up"&&<label>{t.name}<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}
<label>{t.email}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
{mode!=="forgot"&&<label>{t.password}<input type="password" value={pw} onChange={e=>setPw(e.target.value)} autoComplete={mode==="in"?"current-password":"new-password"}/></label>}
{mode==="up"&&<label>{t.role}<select value={role} onChange={e=>setRole(e.target.value)}><option value="organizer">{t.rOrg}</option><option value="player">{t.rPlayer}</option><option value="viewer">{t.rView}</option></select></label>}
{msg&&<p className="toast" role="alert">{msg}</p>}
<button className="btn" disabled={busy}>{busy?t.saving:mode==="in"?t.btnIn:mode==="up"?t.btnUp:t.reset}</button>
<div className="links">{mode!=="in"&&<a href="#/signin" onClick={()=>setMode("in")}>{t.haveAcc}</a>}{mode!=="up"&&<a href="#/signin" onClick={()=>setMode("up")}>{t.noAcc}</a>}{mode==="in"&&<a href="#/signin" onClick={()=>setMode("forgot")}>{t.forgot}</a>}</div></form></div>)}
