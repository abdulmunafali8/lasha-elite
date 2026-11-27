import {useEffect,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,updateProfile,User} from "firebase/auth";
import {doc,getDoc,setDoc,serverTimestamp} from "firebase/firestore";import {auth,db} from "./firebase";import {useLang} from "./i18n";
type Mode="in"|"up"|"forgot";

/* Sign in / Sign up / Forgot password. Logic is unchanged; only the design is new.
   To switch the brand colour (e.g. to green) change --a1 and --a2 at the top of CSS. */

const X:Record<"ha"|"en",Record<string,string>>={
ha:{inT:"Barka da dawowa",inS:"Shiga don ci gaba",upT:"Mu fara",upS:"Ƙirƙiri asusunka a cikin minti ɗaya",fgT:"Ka manta kalmar sirri?",fgS:"Za mu aiko maka hanyar sake saita ta zuwa imel ɗinka",
confirm:"Tabbatar da kalmar sirri",mismatch:"Kalmomin sirri ba iri ɗaya ba ne.",noQ:"Ba ka da asusu?",noA:"Ƙirƙira",haveQ:"Kana da asusu?",haveA:"Shiga",back:"Koma shiga",show:"Nuna kalmar sirri",hide:"Ɓoye kalmar sirri",
used:"An riga an yi rajista da wannan imel. Gwada shiga.",net:"Intanet bai kyau. Sake gwadawa.",roleQ:"Wane ne kai?",openMe:"Buɗe asusuna",signedAs:"Ka shiga a matsayin",backAria:"Koma baya"},
en:{inT:"Welcome back",inS:"Sign in to continue",upT:"Get started",upS:"Create your account in a minute",fgT:"Forgot your password?",fgS:"We’ll email you a link to reset it",
confirm:"Confirm password",mismatch:"Passwords do not match.",noQ:"Don’t have an account?",noA:"Create one",haveQ:"Already have an account?",haveA:"Sign in",back:"Back to sign in",show:"Show password",hide:"Hide password",
used:"This email is already registered. Try signing in.",net:"Network problem. Try again.",roleQ:"Who are you?",openMe:"Open my user",signedAs:"You are signed in as",backAria:"Back"}};

const Ic=({d,s=22}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const P={back:"M19 12H5M12 5l-7 7 7 7",eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",off:"M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6C3.9 9.3 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.7M9.9 9.9a3 3 0 0 0 4.2 4.2",
trophy:"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",team:"M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"};

const CSS=`
.au{--a1:#10224d;--a2:#2a4a8f;--gold:#f2c14e;--bg:#f4f6fb;--card:#fff;--ink:#0d1a3a;--mu:#66728f;--ln:#dfe5f1;--tint:#e8eefb;--tln:#cbd7f1;--tt:#10224d;--ts:#2a4a8f;--bad:#d92d3a;--okc:#15803d;min-height:100vh;background:var(--bg);color:var(--ink);padding-bottom:calc(40px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
html[data-theme="dark"] .au{--bg:#0b1424;--card:#111d33;--ink:#e8edf8;--mu:#9aa6c0;--ln:#25324b;--tint:#14233f;--tln:#27406b;--tt:#fff;--ts:#9db8f0;--bad:#ff6b73;--okc:#4ade80}
.au *,.au *::before,.au *::after{box-sizing:border-box}
.au-wrap{max-width:520px;margin:0 auto;padding:0 16px}
.au-bar{display:flex;align-items:center;gap:12px;padding:calc(14px + env(safe-area-inset-top,0px)) 0 10px}
.au .au-bar h1{flex:1;margin:0;font-size:1.25rem;font-weight:800;color:var(--ink)}
.au-ib{width:44px;height:44px;flex:none;border-radius:50%;border:1px solid var(--ln);background:var(--card);color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0;text-decoration:none}
.au-lang{height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--ln);background:var(--card);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
.au button:focus-visible,.au input:focus-visible,.au a:focus-visible,.au-role:has(input:focus-visible){outline:3px solid var(--gold);outline-offset:2px}
.au-hero{margin-top:8px;padding:26px 20px 24px;border-radius:26px;border:1px solid var(--tln);background:var(--tint);text-align:center;animation:auu .35s ease-out both}
.au-logo{width:92px;height:92px;margin:0 auto 14px;border-radius:50%;background:#fff;display:grid;place-items:center;overflow:hidden;box-shadow:0 8px 22px -10px rgba(16,34,77,.55);color:var(--a1);font-size:2rem;font-weight:900}
.au-logo img{width:100%;height:100%;object-fit:cover;display:block}
.au .au-hero h2{margin:0;font-size:1.7rem;line-height:1.15;font-weight:800;color:var(--tt)}
.au .au-hero p{margin:8px 0 0;font-size:1rem;color:var(--ts);font-weight:600}
.au-card{margin-top:16px;padding:22px 18px 20px;border-radius:26px;border:1px solid var(--ln);background:var(--card);box-shadow:0 14px 34px -22px rgba(16,34,77,.45);animation:auu .35s .06s ease-out both}
@keyframes auu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.au-f{position:relative;margin-top:14px}
.au-f:first-child{margin-top:0}
.au .au-f input{width:100%;height:58px;padding:24px 50px 6px 15px;border-radius:14px;border:1.5px solid var(--ln);background:var(--card);color:var(--ink);font:inherit;font-size:1.02rem;outline:0;transition:border-color .15s,box-shadow .15s}
.au .au-f input:focus{border-color:var(--a2);box-shadow:0 0 0 4px rgba(42,74,143,.18)}
.au-f label{position:absolute;left:16px;top:10px;font-size:.74rem;font-weight:700;color:var(--mu);pointer-events:none}
.au-eye{position:absolute;right:6px;top:7px;width:44px;height:44px;border:0;border-radius:12px;background:none;color:var(--mu);display:grid;place-items:center;cursor:pointer;padding:0}
.au-roles{margin:18px 0 0;padding:0;border:0;min-width:0}
.au-roles legend{padding:0;margin-bottom:10px;font-size:.86rem;font-weight:700;color:var(--mu)}
.au-rg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.au-role{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:84px;padding:12px 6px;border-radius:16px;border:1.5px solid var(--ln);background:var(--card);color:var(--mu);font-size:.8rem;font-weight:700;text-align:center;cursor:pointer;transition:border-color .15s,background .15s,color .15s}
.au-role input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.au-role.on{border-color:var(--a2);background:rgba(42,74,143,.1);color:var(--ink)}
html[data-theme="dark"] .au-role.on{background:rgba(157,184,240,.14)}
.au-role.on svg{color:var(--a2)}
html[data-theme="dark"] .au-role.on svg{color:#9db8f0}
.au-fg{display:block;margin:12px 0 0 auto;padding:6px 2px;border:0;background:none;color:var(--ts);font:inherit;font-weight:700;font-size:.92rem;cursor:pointer}
.au-msg{margin:16px 0 0;padding:12px 14px;border-radius:14px;font-size:.92rem;font-weight:600;line-height:1.4;background:rgba(217,45,58,.1);color:var(--bad)}
.au-msg.ok{background:rgba(21,128,61,.12);color:var(--okc)}
.au-go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:56px;margin-top:20px;border:0;border-radius:16px;background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;font:inherit;font-weight:800;font-size:1.05rem;cursor:pointer;box-shadow:0 12px 24px -12px rgba(16,34,77,.8);transition:transform .1s,opacity .2s}
.au-go:active:not(:disabled){transform:scale(.985)}
.au-go:disabled{opacity:.7;cursor:default}
.au-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:aur .7s linear infinite}
@keyframes aur{to{transform:rotate(360deg)}}
.au-sw{margin:22px 0 0;text-align:center;color:var(--mu);font-size:.96rem}
.au-sw button{margin-left:6px;padding:6px 4px;border:0;background:none;color:var(--ts);font:inherit;font-weight:800;cursor:pointer}
.au-me{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.au-av{flex:none;width:56px;height:56px;border-radius:50%;background:var(--gold);color:#10224d;display:grid;place-items:center;font-weight:900;font-size:1.4rem}
.au-me b{display:block;font-size:1.1rem;overflow-wrap:anywhere}.au-me small{display:block;margin-top:2px;color:var(--mu);overflow-wrap:anywhere}
.au-lnk{display:flex;align-items:center;justify-content:center;width:100%;height:54px;margin-top:12px;border-radius:16px;border:1.5px solid var(--ln);background:transparent;color:var(--ink);font:inherit;font-weight:800;font-size:1rem;text-decoration:none;cursor:pointer}
.au-lnk.pri{border:0;background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff}
@media (prefers-reduced-motion:reduce){.au *,.au *::before,.au *::after{animation:none!important;transition:none!important}}
`;

export default function Auth(){
const {t,toggle,lang}=useLang();const L=X[lang==="en"?"en":"ha"];const [user,setUser]=useState<User|null>(null);const [mode,setMode]=useState<Mode>("in");
const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");const [name,setName]=useState("");const [role,setRole]=useState("organizer");
const [msg,setMsg]=useState("");const [ok,setOk]=useState(false);const [busy,setBusy]=useState(false);
const [see,setSee]=useState(false);const [see2,setSee2]=useState(false);const [logoOk,setLogoOk]=useState(true);
const [isAdmin,setIsAdmin]=useState(false);
useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);setIsAdmin(false);if(u){try{setIsAdmin((await getDoc(doc(db,"users",u.uid))).data()?.role==="superadmin")}catch{}}}),[]);
const bad=(m:string)=>{setOk(false);setMsg(m)};
const go=(m:Mode)=>{setMode(m);setMsg("");setPw("");setPw2("");setSee(false);setSee2(false)};
const submit=async(e:React.FormEvent)=>{e.preventDefault();setMsg("");
if(!email.includes("@"))return bad(t.req+": "+t.email);
if(mode==="up"&&name.trim().length<2)return bad(t.req+": "+t.name);
if(mode!=="forgot"&&pw.length<6)return bad(t.pwShort);
if(mode==="up"&&pw!==pw2)return bad(L.mismatch);
setBusy(true);try{
if(mode==="forgot"){await sendPasswordResetEmail(auth,email);setOk(true);setMsg(t.resetSent)}
else if(mode==="in"){await signInWithEmailAndPassword(auth,email,pw);location.hash="#/"}
else{const c=await createUserWithEmailAndPassword(auth,email,pw);await updateProfile(c.user,{displayName:name.trim()});
await setDoc(doc(db,"users",c.user.uid),{name:name.trim(),email,role,createdAt:serverTimestamp()});
if(role==="organizer")await setDoc(doc(db,"organizers",c.user.uid),{name:name.trim(),country:"NG"});location.hash="#/"}
}catch(x){const c=(x as {code?:string})?.code??"";bad(c==="auth/email-already-in-use"?L.used:c==="auth/network-request-failed"?L.net:t.authErr)}finally{setBusy(false)}};

const Bar=({title}:{title:string})=><div className="au-bar"><a className="au-ib" href="#/" aria-label={L.backAria}><Ic d={P.back}/></a><h1>{title}</h1><button type="button" className="au-lang" onClick={toggle}>{t.lang}</button></div>;

if(user){const shown=user.displayName||user.email||"";const ini=(shown.match(/\p{L}|\p{N}/u)?.[0]??"?").toUpperCase();
return(<div className="au"><style>{CSS}</style><div className="au-wrap"><Bar title={t.account}/>
<section className="au-card" style={{marginTop:10}}><div className="au-me"><span className="au-av" aria-hidden="true">{ini}</span><div><b>{user.displayName}</b><small>{user.email}</small></div></div>
<a className="au-lnk pri" href="#/me">{L.openMe}</a>{isAdmin&&<a className="au-lnk" href="#/admin">{t.adminLink}</a>}
<button type="button" className="au-lnk" onClick={()=>signOut(auth).then(()=>{location.hash="#/"})}>{t.signout}</button></section></div></div>)}

const title=mode==="in"?t.btnIn:mode==="up"?t.btnUp:t.forgot;
const hero=mode==="in"?[L.inT,L.inS]:mode==="up"?[L.upT,L.upS]:[L.fgT,L.fgS];
const pwField=(id:string,label:string,val:string,set:(v:string)=>void,vis:boolean,tog:()=>void,ac:string)=>(<div className="au-f"><input id={id} type={vis?"text":"password"} value={val} onChange={e=>set(e.target.value)} autoComplete={ac} disabled={busy}/><label htmlFor={id}>{label}</label><button type="button" className="au-eye" onClick={tog} aria-label={vis?L.hide:L.show} aria-pressed={vis}><Ic d={vis?P.off:P.eye} s={21}/></button></div>);
return(<div className="au"><style>{CSS}</style><div className="au-wrap"><Bar title={title}/>
<section className="au-hero"><div className="au-logo">{logoOk?<img src="./icon-192.png" alt="" onError={()=>setLogoOk(false)}/>:<span aria-hidden="true">L</span>}</div><h2>{hero[0]}</h2><p>{hero[1]}</p></section>
<form className="au-card" onSubmit={submit} noValidate>
{mode==="up"&&<div className="au-f"><input id="au-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" disabled={busy}/><label htmlFor="au-name">{t.name}</label></div>}
<div className="au-f"><input id="au-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" inputMode="email" disabled={busy}/><label htmlFor="au-mail">{t.email}</label></div>
{mode!=="forgot"&&pwField("au-pw",t.password,pw,setPw,see,()=>setSee(v=>!v),mode==="in"?"current-password":"new-password")}
{mode==="up"&&pwField("au-pw2",L.confirm,pw2,setPw2,see2,()=>setSee2(v=>!v),"new-password")}
{mode==="in"&&<button type="button" className="au-fg" onClick={()=>go("forgot")}>{t.forgot}</button>}
{mode==="up"&&<fieldset className="au-roles"><legend>{L.roleQ}</legend><div className="au-rg">{(["organizer","player","viewer"] as const).map(r=><label key={r} className={"au-role"+(role===r?" on":"")}><input type="radio" name="au-role" value={r} checked={role===r} onChange={()=>setRole(r)} disabled={busy}/><Ic d={r==="organizer"?P.trophy:r==="player"?P.team:P.eye} s={24}/><span>{r==="organizer"?t.rOrg:r==="player"?t.rPlayer:t.rView}</span></label>)}</div></fieldset>}
{msg&&<p className={"au-msg"+(ok?" ok":"")} role={ok?"status":"alert"}>{msg}</p>}
<button className="au-go" disabled={busy}>{busy&&<i className="au-spin" aria-hidden="true"/>}{busy?t.saving:mode==="in"?t.btnIn:mode==="up"?t.btnUp:t.reset}</button>
</form>
<p className="au-sw">{mode==="in"?<>{L.noQ}<button type="button" onClick={()=>go("up")}>{L.noA}</button></>:mode==="up"?<>{L.haveQ}<button type="button" onClick={()=>go("in")}>{L.haveA}</button></>:<button type="button" onClick={()=>go("in")}>{L.back}</button>}</p>
</div></div>)}
