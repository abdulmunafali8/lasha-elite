import {useEffect,useRef,useState,FormEvent} from "react";
import {EmailAuthProvider,GoogleAuthProvider,User,deleteUser,onAuthStateChanged,reauthenticateWithCredential,reauthenticateWithPopup,signOut,updateProfile} from "firebase/auth";
import {doc,getDoc} from "firebase/firestore";
import {getDownloadURL,getStorage,ref,uploadBytesResumable} from "firebase/storage";
import {auth,db} from "./firebase";
import ImagePick from "./ImagePick";
import {useLang} from "./i18n";

/* "My user" page: pass-style profile card, photo upload with progress, save with progress, logout, remove user */

const X:Record<"ha"|"en",Record<string,string>>={
ha:{title:"Asusuna",outT:"Ba ka shiga ba",outD:"Ka shiga don ganin asusunka da canza bayananka.",signIn:"Shiga",details:"Bayanan kai",name:"Suna",email:"Imel",emailLock:"Ba a canza imel a nan.",photo:"Canza hoto",
save:"Ajiye canje-canje",up:"Ana ɗora hoto",saving:"Ana ajiyewa",done:"An ajiye",unsaved:"Akwai canje-canje da ba a ajiye ba",logout:"Fita daga asusu",remove:"Cire asusu (Remove user)",since:"Memba tun",
delT:"Cire asusunka?",delD:"Za a goge asusun shiganka na dindindin. Gasar da ka ƙirƙira ba za a goge su kai tsaye ba, don haka ka goge su tukuna idan kana so.",pw:"Kalmar sirri",ack:"Na fahimta, ina so a cire asusuna",cancel:"Soke",delBtn:"Cire na dindindin",
nameShort:"Suna ya yi gajeru, aƙalla haruffa 2.",imgBad:"Zaɓi hoto (JPG ko PNG) wanda bai wuce 2 MB ba.",eStore:"Ba a ba ka izinin ɗora hoto ba. Duba dokokin Storage a Firebase.",err:"Wani abu ya faru, sake gwadawa",
badPw:"Kalmar sirri ba daidai ba ce.",needPw:"Shigar da kalmar sirrinka.",many:"An yi ƙoƙari da yawa. Jira kaɗan, sai ka sake gwadawa.",recent:"Ka fita ka sake shiga, sannan ka sake gwadawa.",
organizer:"Mai shirya gasa",player:"Ɗan wasa",viewer:"Mai kallo",superadmin:"Super admin",back:"Koma baya",userFb:"Mai amfani"},
en:{title:"My user",outT:"You are signed out",outD:"Sign in to see your account and edit your details.",signIn:"Sign in",details:"Your details",name:"Name",email:"Email",emailLock:"Email can’t be changed here.",photo:"Change photo",
save:"Save changes",up:"Uploading photo",saving:"Saving",done:"Saved",unsaved:"You have unsaved changes",logout:"Log out",remove:"Remove user",since:"Member since",
delT:"Remove your user?",delD:"Your sign-in account will be deleted permanently. Tournaments you created are not deleted automatically, so delete them first if you want them gone.",pw:"Password",ack:"I understand, remove my account",cancel:"Cancel",delBtn:"Remove permanently",
nameShort:"Name is too short, use at least 2 characters.",imgBad:"Pick an image (JPG or PNG) under 2 MB.",eStore:"You are not allowed to upload photos. Check the Storage rules in Firebase.",err:"Something went wrong, try again",
badPw:"That password is not correct.",needPw:"Enter your password.",many:"Too many attempts. Wait a moment and try again.",recent:"Log out, sign in again, then retry.",
organizer:"Organizer",player:"Player",viewer:"Viewer",superadmin:"Super admin",back:"Back",userFb:"User"}};

function upload(uid:string,f:File,on:(n:number)=>void){return new Promise<string>((res,rej)=>{
const task=uploadBytesResumable(ref(getStorage(),`competitions/${uid}/profile/avatar`),f,{contentType:f.type||"image/jpeg",cacheControl:"public,max-age=3600"});
task.on("state_changed",s=>on(Math.round(s.bytesTransferred/s.totalBytes*100)),rej,()=>getDownloadURL(task.snapshot.ref).then(u=>res(u+(u.includes("?")?"&":"?")+"v="+Date.now()),rej))})}

const Ic=({d,s=22}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const P={back:"M19 12H5M12 5l-7 7 7 7",cam:"M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",lock:"M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",out:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",trash:"M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",check:"M5 12.5l4.5 4.5L19 7.5",user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"};

const CSS=`
.mu{--navy:#10224d;--royal:#2a4a8f;--gold:#f2c14e;--bg:#f4f6fb;--card:#fff;--ink:#0d1a3a;--mu:#66728f;--ln:#dfe5f1;--bad:#d92d3a;--ok:#15803d;min-height:100vh;background:var(--bg);color:var(--ink);padding:0 0 calc(40px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
html[data-theme="dark"] .mu{--bg:#0b1424;--card:#111d33;--ink:#e8edf8;--mu:#9aa6c0;--ln:#25324b;--bad:#ff6b73}
.mu *,.mu *::before,.mu *::after{box-sizing:border-box}
.mu-wrap{max-width:560px;margin:0 auto;padding:0 16px}
.mu-bar{display:flex;align-items:center;gap:12px;padding:calc(14px + env(safe-area-inset-top,0px)) 0 8px}
.mu .mu-bar h1{color:var(--ink);margin:0;font-size:1.2rem;font-weight:800;letter-spacing:.1px}
.mu-back{width:44px;height:44px;border-radius:50%;border:1px solid var(--ln);background:var(--card);color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
.mu button:focus-visible,.mu input:focus-visible,.mu a:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.mu-pass{position:relative;overflow:hidden;margin-top:10px;border-radius:26px;padding:22px 20px 24px;color:#fff;background:linear-gradient(135deg,#10224d 0%,#1d3a7a 100%);box-shadow:0 18px 40px -18px rgba(16,34,77,.7)}
.mu-pass::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.055) 0 26px,transparent 26px 52px);pointer-events:none}
.mu-pass::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:var(--gold)}
.mu-pr{position:relative;display:flex;align-items:center;gap:20px}
.mu-av{position:relative;flex:none;width:92px;height:92px;margin:9px;border-radius:50%;background:var(--gold);color:var(--navy);display:grid;place-items:center;font-weight:900;font-size:2rem;box-shadow:0 0 0 4px #10224d,0 0 0 7px var(--gold);transition:box-shadow .2s}
.mu-av.up{box-shadow:0 0 0 4px #10224d,0 0 0 7px rgba(255,255,255,.16)}
.mu-ini{position:absolute;inset:0;display:grid;place-items:center;border-radius:50%;overflow:hidden}
.mu-av .ipick{position:absolute;inset:0;width:100%;height:100%;min-height:0;aspect-ratio:auto;padding:0;margin:0;border:0!important;border-radius:50%!important;background-color:transparent!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;font-size:0;color:transparent;cursor:pointer}
.mu-av .ipick span{display:none!important}
.mu-av .ipick:focus-visible{outline:3px solid #fff;outline-offset:6px}
.mu-cam{position:absolute;right:-6px;bottom:-4px;width:34px;height:34px;border-radius:50%;background:#fff;color:var(--navy);display:grid;place-items:center;border:3px solid var(--navy);pointer-events:none}
.mu-ring{position:absolute;left:-10px;top:-10px;width:112px;height:112px;pointer-events:none;transform:rotate(-90deg)}
.mu-ring circle{fill:none;stroke-width:4}
.mu-ring .t{stroke:rgba(255,255,255,.18)}
.mu-ring .p{stroke:var(--gold);stroke-linecap:round;transition:stroke-dashoffset .2s linear}
.mu-shade{position:absolute;inset:0;border-radius:50%;background:rgba(8,16,40,.6);display:grid;place-items:center;color:#fff;font-size:1.1rem;font-weight:800;pointer-events:none}
.mu-id{min-width:0}
.mu .mu-id h2{color:#fff!important;margin:0;font-size:1.45rem;line-height:1.15;font-weight:800;overflow-wrap:anywhere}
.mu .mu-id p{margin:6px 0 0;font-size:.92rem;color:rgba(255,255,255,.8)!important;overflow-wrap:anywhere}
.mu-chips{position:relative;display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.mu-chips span{padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.14);font-size:.82rem;font-weight:600}
.mu-form{margin-top:28px}
.mu .mu-form h3{color:var(--ink);margin:0 0 4px;font-size:1.02rem;font-weight:800}
.mu-f{position:relative;margin-top:14px}
.mu .mu-f input{width:100%;height:58px;padding:24px 44px 6px 15px;border-radius:14px;border:1.5px solid var(--ln);background:var(--card);color:var(--ink);font:inherit;font-size:1.02rem;outline:0;transition:border-color .15s,box-shadow .15s}
.mu .mu-f input:focus{border-color:var(--royal);box-shadow:0 0 0 4px rgba(42,74,143,.18)}
.mu .mu-f.ro input{background:transparent;color:var(--mu);border-style:dashed;cursor:default}
.mu-f label{position:absolute;left:16px;top:10px;font-size:.74rem;font-weight:700;color:var(--mu);pointer-events:none}
.mu-f .si{position:absolute;right:14px;top:18px;color:var(--mu);display:flex}
.mu-f .cn{position:absolute;right:14px;top:20px;font-size:.74rem;color:var(--mu)}
.mu-note{margin:8px 2px 0;font-size:.82rem;color:var(--mu)}
.mu-un{display:flex;align-items:center;gap:8px;margin:16px 2px 0;font-size:.86rem;color:var(--mu)}
.mu-un i{width:8px;height:8px;border-radius:50%;background:var(--gold)}
.mu-save{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:56px;margin-top:16px;border:0;border-radius:16px;background:linear-gradient(135deg,var(--navy),var(--royal));color:#fff;font:inherit;font-weight:800;font-size:1.02rem;cursor:pointer;box-shadow:0 12px 24px -12px rgba(16,34,77,.8);transition:transform .1s,opacity .2s,background .3s}
.mu-save:active:not(:disabled){transform:scale(.985)}
.mu-save:disabled{cursor:default}
.mu-save.idle:disabled{opacity:.42;box-shadow:none}
.mu-save.ok{background:linear-gradient(135deg,#15803d,#16a34a)}
.mu-save .fl{position:absolute;left:0;top:0;bottom:0;width:var(--p,0%);background:rgba(255,255,255,.24);transition:width .25s ease}
.mu-save .fl.ind{width:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent);transform:translateX(-100%);animation:mus 1.1s linear infinite}
.mu-save>span{position:relative;display:flex;align-items:center;gap:10px}
@keyframes mus{to{transform:translateX(100%)}}
.mu-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:mur .7s linear infinite}
@keyframes mur{to{transform:rotate(360deg)}}
.mu-sec{margin-top:30px;border-top:1px solid var(--ln)}
.mu-row{display:flex;align-items:center;gap:14px;width:100%;min-height:68px;padding:12px 2px;border:0;background:none;color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.mu-row .ic{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(42,74,143,.13);color:var(--royal)}
html[data-theme="dark"] .mu-row .ic{color:#9db8f0;background:rgba(157,184,240,.14)}
.mu-row b{display:block;font-size:1rem}
.mu-row small{display:block;margin-top:2px;color:var(--mu);font-size:.84rem;overflow-wrap:anywhere}
.mu-rm{display:flex;align-items:center;justify-content:center;gap:8px;margin:34px auto 0;min-height:48px;padding:0 18px;border:0;background:none;color:var(--bad);font:inherit;font-weight:700;font-size:.96rem;cursor:pointer;border-radius:12px}
.mu-rm:hover{background:rgba(217,45,58,.08)}
.mu-ov{position:fixed;inset:0;z-index:100000;background:rgba(5,10,25,.6);display:flex;align-items:flex-end;justify-content:center}
.mu-sheet{width:100%;max-width:520px;background:var(--card);color:var(--ink);border-radius:28px 28px 0 0;padding:12px 22px calc(24px + env(safe-area-inset-bottom,0px));animation:musl .24s ease-out}
@keyframes musl{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.mu-grab{width:44px;height:5px;border-radius:3px;background:var(--ln);margin:0 auto 18px}
.mu-warn{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:rgba(217,45,58,.12);color:var(--bad)}
.mu .mu-sheet h3{color:var(--ink);margin:14px 0 6px;font-size:1.25rem;font-weight:800}
.mu-sheet p{margin:0;color:var(--mu);font-size:.95rem;line-height:1.5}
.mu-ack{display:flex;align-items:flex-start;gap:12px;margin-top:18px;font-size:.95rem;cursor:pointer}
.mu-ack input{width:22px;height:22px;margin:0;accent-color:var(--bad);flex:none}
.mu-sheet .mu-err{margin:12px 2px 0;color:var(--bad);font-weight:600;font-size:.9rem}
.mu-acts{display:flex;gap:12px;margin-top:20px}
.mu-acts button{flex:1;height:52px;border-radius:14px;font:inherit;font-weight:800;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
.mu-ghost{border:1.5px solid var(--ln);background:transparent;color:var(--ink)}
.mu-danger{border:0;background:var(--bad);color:#fff}
.mu-danger:disabled{opacity:.4;cursor:default}
.mu-toast{position:fixed;left:50%;bottom:calc(26px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:100001;max-width:calc(100% - 32px);padding:12px 18px;border-radius:14px;background:var(--navy);color:#fff;font-weight:700;font-size:.95rem;box-shadow:0 12px 30px rgba(0,0,0,.35);animation:mut .22s ease-out}
.mu-toast.err{background:#b3261e}
@keyframes mut{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
.mu-out{margin-top:24px;padding:30px 22px;border-radius:24px;border:1px dashed var(--ln);text-align:center}
.mu-out .ic{width:64px;height:64px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:rgba(42,74,143,.13);color:var(--royal)}
.mu .mu-out h2{color:var(--ink);margin:0 0 6px;font-size:1.2rem}.mu-out p{margin:0 0 20px;color:var(--mu)}
.mu-out a{display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:52px;padding:0 24px;border-radius:16px;background:linear-gradient(135deg,var(--navy),var(--royal));color:#fff;font-weight:800;text-decoration:none}
.mu-sk{margin-top:10px;border-radius:26px;height:190px;background:linear-gradient(90deg,var(--ln) 0,rgba(255,255,255,.35) 50%,var(--ln) 100%);background-size:200% 100%;animation:musk 1.2s linear infinite}
@keyframes musk{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.mu *,.mu *::before,.mu *::after{animation:none!important;transition:none!important}}
`;

export default function Profile(){
const {lang}=useLang();const L=X[lang];
const [user,setUser]=useState<User|null|undefined>(undefined);
const [name,setName]=useState("");const [file,setFile]=useState<File|null>(null);
const [phase,setPhase]=useState<"idle"|"up"|"save"|"ok">("idle");const [pct,setPct]=useState(0);
const [toast,setToast]=useState<{m:string;bad:boolean}|null>(null);const [role,setRole]=useState("");
const [dlg,setDlg]=useState(false);const [pw,setPw]=useState("");const [ack,setAck]=useState(false);const [dBusy,setDBusy]=useState(false);const [dErr,setDErr]=useState("");
const tm=useRef<number[]>([]);
useEffect(()=>onAuthStateChanged(auth,u=>setUser(u)),[]);
useEffect(()=>()=>{tm.current.forEach(clearTimeout)},[]);
const uid=user?.uid;
useEffect(()=>{if(!user)return;setName(user.displayName??"");
getDoc(doc(db,"users",user.uid)).then(s=>{const r=s.exists()?String((s.data() as {role?:string}).role??""):"";setRole(r)}).catch(()=>{})},[uid]);
const flash=(m:string,bad=false)=>{setToast({m,bad});tm.current.push(window.setTimeout(()=>setToast(null),3400))};
const errText=(e:unknown)=>{const c=(e as {code?:string})?.code??"";
if(c==="storage/unauthorized")return L.eStore;if(c==="auth/too-many-requests")return L.many;if(c==="auth/requires-recent-login")return L.recent;
if(c==="auth/wrong-password"||c==="auth/invalid-credential"||c==="auth/invalid-login-credentials")return L.badPw;return L.err+(c?" ("+c+")":"")};

const goBack=()=>{location.hash="#/"};
const busy=phase==="up"||phase==="save";
const cur=(user?.displayName??"");const dirty=!!user&&(name.trim()!==cur||!!file);
const onSave=async(e:FormEvent)=>{e.preventDefault();if(!user||!dirty||busy)return;const n=name.trim();
if(n.length<2){flash(L.nameShort,true);return}
try{let photoURL=user.photoURL;
if(file){setPhase("up");setPct(0);photoURL=await upload(user.uid,file,setPct)}
setPhase("save");await updateProfile(user,{displayName:n,photoURL});
setFile(null);setPhase("ok");flash(L.done);tm.current.push(window.setTimeout(()=>setPhase("idle"),1800))}
catch(x){setPhase("idle");flash(errText(x),true)}};
const logout=async()=>{try{await signOut(auth);location.hash="#/"}catch(x){flash(errText(x),true)}};
const openDel=()=>{setPw("");setAck(false);setDErr("");setDlg(true)};
const hasPw=!!user?.providerData.some(p=>p.providerId==="password");
const remove=async()=>{if(!user||dBusy||!ack)return;setDErr("");
if(hasPw&&!pw){setDErr(L.needPw);return}
setDBusy(true);
try{if(hasPw)await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email??"",pw));else await reauthenticateWithPopup(user,new GoogleAuthProvider());
await deleteUser(user);location.hash="#/"}
catch(x){setDErr(errText(x))}finally{setDBusy(false)}};

const em=user?.email??"";const shown=name.trim()||(em.split("@")[0])||L.userFb;
const ini=(shown.match(/\p{L}|\p{N}/u)?.[0]??"?").toUpperCase();
const since=user?.metadata.creationTime?new Date(user.metadata.creationTime).toLocaleDateString("en-GB",{month:"short",year:"numeric"}):"";
const R=51.5,C=2*Math.PI*R;
const fill=phase==="up"?Math.round(pct*.85):phase==="save"?92:phase==="ok"?100:0;
const label=phase==="up"?`${L.up} ${pct}%`:phase==="save"?L.saving:phase==="ok"?L.done:L.save;

return(<div className="mu"><style>{CSS}</style>
{toast&&<div className={"mu-toast"+(toast.bad?" err":"")} role={toast.bad?"alert":"status"}>{toast.m}</div>}
<div className="mu-wrap">
<header className="mu-bar"><button type="button" className="mu-back" onClick={goBack} aria-label={L.back}><Ic d={P.back}/></button><h1>{L.title}</h1></header>
{user===undefined&&<div className="mu-sk" aria-hidden="true"/>}
{user===null&&<section className="mu-out"><div className="ic"><Ic d={P.user} s={30}/></div><h2>{L.outT}</h2><p>{L.outD}</p><a href="#/signin">{L.signIn}</a></section>}
{user&&<>
<section className="mu-pass" aria-label={shown}>
<div className="mu-pr">
<div className={"mu-av"+(phase==="up"?" up":"")}>
<span className="mu-ini" aria-hidden="true">{ini}</span>
<ImagePick label={L.photo} hint="" file={file} onFile={setFile} onErr={()=>flash(L.imgBad,true)} current={user.photoURL??undefined} round/>
<svg className="mu-ring" viewBox="0 0 112 112" aria-hidden="true" style={{opacity:phase==="up"?1:0}}><circle className="t" cx="56" cy="56" r={R}/><circle className="p" cx="56" cy="56" r={R} strokeDasharray={C} strokeDashoffset={C*(1-pct/100)}/></svg>
{phase==="up"&&<div className="mu-shade" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>{pct}%</div>}
<span className="mu-cam" aria-hidden="true"><Ic d={P.cam} s={16}/></span>
</div>
<div className="mu-id"><h2>{shown}</h2><p>{em}</p></div>
</div>
<div className="mu-chips">{role&&<span>{L[role]??role}</span>}{since&&<span>{L.since} {since}</span>}</div>
</section>

<form className="mu-form" onSubmit={onSave} noValidate>
<h3>{L.details}</h3>
<div className="mu-f"><input id="mu-name" value={name} maxLength={40} autoComplete="name" onChange={e=>setName(e.target.value)} disabled={busy}/><label htmlFor="mu-name">{L.name}</label><span className="cn" aria-hidden="true">{name.length}/40</span></div>
<div className="mu-f ro"><input id="mu-mail" value={em} readOnly tabIndex={-1} aria-describedby="mu-mn"/><label htmlFor="mu-mail">{L.email}</label><span className="si" aria-hidden="true"><Ic d={P.lock} s={18}/></span></div>
<p className="mu-note" id="mu-mn">{L.emailLock}</p>
{dirty&&phase==="idle"&&<p className="mu-un" role="status"><i/>{L.unsaved}</p>}
<button className={"mu-save "+(phase==="ok"?"ok":busy?"busy":"idle")} disabled={busy||phase==="ok"||!dirty} style={{["--p" as string]:fill+"%"}}>
<span className={"fl"+(phase==="save"&&!file?" ind":"")}/>
<span>{busy&&<i className="mu-spin" aria-hidden="true"/>}{phase==="ok"&&<Ic d={P.check} s={20}/>}{label}</span>
</button>
</form>

<section className="mu-sec"><button type="button" className="mu-row" onClick={logout} disabled={busy}><span className="ic"><Ic d={P.out}/></span><span><b>{L.logout}</b><small>{em}</small></span></button></section>
<button type="button" className="mu-rm" onClick={openDel} disabled={busy}><Ic d={P.trash} s={20}/>{L.remove}</button>
</>}
</div>

{dlg&&<div className="mu-ov" onClick={()=>!dBusy&&setDlg(false)}><div className="mu-sheet" role="dialog" aria-modal="true" aria-label={L.delT} onClick={e=>e.stopPropagation()}>
<div className="mu-grab"/><div className="mu-warn"><Ic d={P.trash} s={26}/></div><h3>{L.delT}</h3><p>{L.delD}</p>
{hasPw&&<div className="mu-f"><input id="mu-pw" type="password" value={pw} autoComplete="current-password" onChange={e=>setPw(e.target.value)} disabled={dBusy}/><label htmlFor="mu-pw">{L.pw}</label></div>}
<label className="mu-ack"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} disabled={dBusy}/><span>{L.ack}</span></label>
{dErr&&<p className="mu-err" role="alert">{dErr}</p>}
<div className="mu-acts"><button type="button" className="mu-ghost" onClick={()=>setDlg(false)} disabled={dBusy}>{L.cancel}</button><button type="button" className="mu-danger" onClick={remove} disabled={!ack||dBusy}>{dBusy&&<i className="mu-spin" aria-hidden="true"/>}{L.delBtn}</button></div>
</div></div>}
</div>)}
