import {useEffect,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,getDoc,getDocs,onSnapshot,query,updateDoc,where,writeBatch,serverTimestamp} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {Match,Move,SheetRow} from "./types";
type Side="home"|"away";type St="upcoming"|"live"|"done";
const uid=()=>Math.random().toString(36).slice(2,9);
const Ic=({d,s=22}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const BACK="M19 12H5M12 5l-7 7 7 7",PRINT="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",DOTS="M12 5h.01M12 12h.01M12 19h.01",WATCH="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 9v4l2.5 1.5M10 2h4",LIST="M4 6h16M4 12h16M4 18h16",PLUS="M12 5v14M5 12h14";
const KEY=(s:Side)=>s==="home"?"homeSheet":"awaySheet";
const icon:Record<Move["type"],string>={goal:"⚽",yellow:"🟨",red:"🟥",sub:"🔁",other:"•"};
const CSS=`.ms{background:#eef0f4;min-height:100vh;min-height:100dvh;padding-bottom:40px}
.ms-top{background:var(--navy);color:#fff;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 10px) 12px 12px;position:sticky;top:0;z-index:30}
.ms-top .ib{background:none;border:0;color:#fff;min-width:40px;height:44px;display:grid;place-items:center;font-size:1rem}
.ms-st{flex:1;position:relative;display:flex;justify-content:center}
.ms-sel{display:flex;align-items:center;justify-content:space-between;gap:10px;width:min(240px,100%);height:44px;padding:0 16px;border:1.5px solid #fff;border-radius:14px;background:none;color:#fff;font:inherit;font-weight:800;letter-spacing:.04em}
.ms-menu{position:absolute;top:50px;left:50%;transform:translateX(-50%);width:min(300px,92%);background:#14275c;border-radius:10px;box-shadow:0 12px 30px #0006;overflow:hidden;z-index:40}
.ms-menu button{display:block;width:100%;text-align:left;background:none;border:0;color:#fff;font:inherit;font-weight:800;letter-spacing:.03em;font-size:1.15rem;padding:20px 22px}.ms-menu button.on{background:#0f1f4a}
.ms-card{background:#fff;margin:14px 14px 0;border-radius:6px;box-shadow:0 2px 8px #0002;overflow:hidden;position:relative}
.ms-bar{background:var(--navy);color:#fff;text-align:center;font-weight:800;letter-spacing:.03em;padding:16px 10px;font-size:1.2rem;position:relative}
.ms-bar .rt{position:absolute;right:10px;top:50%;transform:translateY(-50%)}
.ms-score{display:flex;align-items:center;justify-content:center;gap:18px;padding:12px 8px 6px;font-family:"Courier New",ui-monospace,monospace;font-weight:900;font-size:4.2rem;color:#111;line-height:1}
.ms-score .x{font-size:2rem;font-family:system-ui,sans-serif}
.ms-ctl{display:flex;justify-content:space-around;align-items:center;padding:4px 8px 14px;color:var(--ink)}
.ms-ctl>div{display:flex;align-items:center;gap:8px;font-weight:700;max-width:46%}.ms-ctl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ms-pm{width:34px;height:34px;border-radius:50%;border:1.5px solid #c8cfdf;background:#fff;color:var(--navy);font-size:1.3rem;font-weight:800;line-height:1;cursor:pointer}.ms-pm:disabled{opacity:.35}
.ms-sw{width:54px;height:54px;border-radius:50%;background:var(--royal);color:#fff;border:0;display:grid;place-items:center;box-shadow:0 4px 10px #0004;cursor:pointer}.ms-sw.on{background:#16a34a}
.ms-time{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:800;font-size:1rem;opacity:.95}
.ms-note{text-align:center;color:#8a93a8;font-size:.85rem;padding:0 12px 10px}
.ms-subs{display:grid;grid-template-columns:1fr 1fr;text-align:center;padding:10px 8px 14px;font-weight:700}
.ms-dots{display:flex;gap:6px;justify-content:center;margin-top:8px}.ms-dots i{width:30px;height:30px;border-radius:50%;background:#e0e3ea;border:0;display:block;cursor:pointer}.ms-dots i.f{background:var(--royal)}
.ms-th,.ms-row{display:grid;grid-template-columns:28px 24px 1fr 52px 48px 30px 30px;align-items:center;gap:6px;padding:10px 12px}
.ms-th{background:#e6e8ee;font-weight:800;font-size:.8rem;color:#222;letter-spacing:.03em}
.ms-row{border-bottom:1px solid #eceef3;font-weight:700;color:#222;font-size:.95rem;text-transform:uppercase}
.ms-row b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ms-ck{width:20px;height:20px;accent-color:#1e88e5}
.ms-tg{width:44px;height:24px;border-radius:12px;background:#c9ced8;border:0;position:relative;cursor:pointer;padding:0}.ms-tg::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0004}.ms-tg.on{background:#66bb6a}.ms-tg.on::after{left:22px}
.ms-g{display:flex;align-items:center;justify-content:center;gap:2px}.ms-g button{background:none;border:0;font:inherit;font-weight:800;min-width:20px;padding:2px;color:var(--navy);cursor:pointer}
.ms-cd{width:18px;height:22px;border-radius:3px;border:0;background:#c9ced8;cursor:pointer;padding:0;justify-self:center}.ms-cd.y.on{background:#fbc02d}.ms-cd.r.on{background:#e53935}
.ms-empty{text-align:center;padding:14px;font-weight:700;font-size:1.05rem;color:#222}
.ms-addp{display:flex;gap:8px;padding:10px 12px}.ms-addp input,.ms-form input,.ms-form select,.ms-info input{flex:1;min-width:0;border:1.5px solid #c8cfdf;border-radius:10px;padding:10px 12px;font:inherit;background:#fff}
.ms-h{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.25rem;color:#111;padding:14px 16px 8px}.ms-h button{width:30px;height:30px;border-radius:50%;background:#111;color:#fff;border:0;display:grid;place-items:center;cursor:pointer}
.ms-mv{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid #eceef3;font-weight:700;color:#222}.ms-mv em{font-style:normal;color:#6b7690;font-weight:600;min-width:34px}.ms-mv small{color:#6b7690;font-weight:600}.ms-mv .g{flex:1;min-width:0}
.ms-x{background:none;border:0;color:#e53935;font-size:1.1rem;cursor:pointer;padding:6px}
.ms-form{display:grid;gap:8px;padding:8px 16px 14px;grid-template-columns:1fr 1fr}.ms-form .w{grid-column:1/-1;display:flex;gap:8px}
.ms-info{display:grid;gap:10px;padding:14px 16px}.ms-info label{display:grid;gap:4px;font-weight:700;font-size:.85rem;color:#6b7690}.ms-info input{flex:none;color:#222}
@media print{.ms-top,.ms-pm,.ms-sw,.ms-addp,.ms-nop{display:none!important}.ms{background:#fff}}`;

export default function MatchSheet({cid,mid}:{cid:string;mid:string}){
const {t}=useLang();
const [user,setUser]=useState<User|null>(null);const [ownerId,setOwnerId]=useState<string|null>(null);const [m,setM]=useState<Match|null>(null);const [miss,setMiss]=useState(false);
const [sq,setSq]=useState<Record<Side,string[]>>({home:[],away:[]});const [err,setErr]=useState("");const [menu,setMenu]=useState(false);
const [shown,setShown]=useState<Record<Side,boolean>>({home:true,away:true});const [mvOpen,setMvOpen]=useState(false);const [rfOpen,setRfOpen]=useState(false);
const [sec,setSec]=useState(0);const [run,setRun]=useState(false);const [venue,setVenue]=useState("");
const [mvType,setMvType]=useState<Move["type"]>("yellow");const [mvSide,setMvSide]=useState<Side>("home");const [mvName,setMvName]=useState("");const [mvMin,setMvMin]=useState("");
const [rfText,setRfText]=useState("");const [np,setNp]=useState<Record<Side,string>>({home:"",away:""});
useEffect(()=>onAuthStateChanged(auth,setUser),[]);
useEffect(()=>onSnapshot(doc(db,"competitions",cid),s=>setOwnerId((s.data()?.ownerId as string)??null),()=>{}),[cid]);
useEffect(()=>onSnapshot(doc(db,"competitions",cid,"matches",mid),s=>s.exists()?setM({id:s.id,...s.data()} as Match):setMiss(true),()=>setMiss(true)),[cid,mid]);
const hid=m?.homeId,aid=m?.awayId;
useEffect(()=>{let ok=true;(async()=>{try{const g=async(id?:string)=>id?(((await getDoc(doc(db,"competitions",cid,"players",id))).data()?.squad??[]) as {name:string}[]).map(x=>x.name):[];const [h,a]=await Promise.all([g(hid),g(aid)]);if(ok)setSq({home:h,away:a})}catch{/* ba muhimmi ba */}})();return()=>{ok=false}},[cid,hid,aid]);
useEffect(()=>{if(!run)return;const i=setInterval(()=>setSec(s=>s+1),1000);return()=>clearInterval(i)},[run]);
useEffect(()=>{setVenue(m?.venue??"")},[m?.venue]);
const back=()=>{location.hash=`#/competition/${cid}`};
if(miss)return<div className="app"><style>{CSS}</style><p className="muted pad">{t.err}</p><a className="btn" href={`#/competition/${cid}`}>{t.home}</a></div>;
if(!m)return<div className="app"><p className="muted pad">{t.loading}</p></div>;
const M=m;const owner=!!user&&user.uid===ownerId;const locked=M.status==="done";const status:St=M.status;
const rows=(s:Side):SheetRow[]=>M[KEY(s)]??sq[s].map(n=>({n,on:true}));
const sc=(s:Side)=>(s==="home"?M.homeScore:M.awayScore)??0;const name=(s:Side)=>s==="home"?M.homeName:M.awayName;
const minNow=()=>run||sec>0?Math.floor(sec/60)+1:null;const fmt=(n:number)=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
const patch=async(d:Record<string,unknown>)=>{try{setErr("");await updateDoc(doc(db,"competitions",cid,"matches",mid),d)}catch(x){setErr(t.err+" ("+(((x as {code?:string}).code)||(x as Error).message)+")")}};
const scores=(s:Side,d:number)=>({homeScore:s==="home"?Math.max(0,sc("home")+d):sc("home"),awayScore:s==="away"?Math.max(0,sc("away")+d):sc("away"),...(status==="upcoming"?{status:"live"}:{})});
const bump=(s:Side,d:number)=>{if(!owner||locked||sc(s)+d<0)return;patch(scores(s,d))};
const goal=(s:Side,i:number,d:1|-1)=>{if(!owner||locked)return;const rs=rows(s).map(x=>({...x}));const r=rs[i];const g=Math.max(0,(r.g??0)+d);if(g===(r.g??0))return;r.g=g;
const mv=[...(M.moves??[])];if(d>0)mv.push({id:uid(),min:minNow(),type:"goal",side:s,name:r.n});else{const j=mv.map(x=>x.type==="goal"&&x.side===s&&x.name===r.n).lastIndexOf(true);if(j>=0)mv.splice(j,1)}
patch({[KEY(s)]:rs,moves:mv,...scores(s,d)})};
const card=(s:Side,i:number,k:"y"|"r")=>{if(!owner)return;const rs=rows(s).map(x=>({...x}));const r=rs[i];const on=!r[k];r[k]=on;const type:Move["type"]=k==="y"?"yellow":"red";const mv=[...(M.moves??[])];
if(on)mv.push({id:uid(),min:minNow(),type,side:s,name:r.n});else{const j=mv.map(x=>x.type===type&&x.side===s&&x.name===r.n).lastIndexOf(true);if(j>=0)mv.splice(j,1)}patch({[KEY(s)]:rs,moves:mv})};
const tog=(s:Side,i:number,k:"on"|"st")=>{if(!owner)return;const rs=rows(s).map(x=>({...x}));rs[i][k]=!rs[i][k];patch({[KEY(s)]:rs})};
const allOn=(s:Side)=>{if(!owner)return;const rs=rows(s);const v=!rs.every(x=>x.on);patch({[KEY(s)]:rs.map(x=>({...x,on:v}))})};
const addRow=(s:Side)=>{const n=np[s].trim();if(n.length<2||!owner)return;patch({[KEY(s)]:[...rows(s),{n,on:true}]});setNp({...np,[s]:""})};
const setSubs=(s:Side,n:number)=>{if(!owner)return;const cur=(s==="home"?M.homeSubs:M.awaySubs)??0;patch({[s+"Subs"]:cur===n?n-1:n})};
const addMove=()=>{if(!owner)return;const mv:Move={id:uid(),min:mvMin===""?minNow():Number(mvMin),type:mvType,side:mvSide,name:mvName.trim()};patch({moves:[...(M.moves??[]),mv]});setMvName("");setMvMin("");setMvOpen(false)};
const delMove=(id:string)=>patch({moves:(M.moves??[]).filter(x=>x.id!==id)});
const addRef=()=>{const v=rfText.trim();if(!v||!owner)return;patch({refNotes:[...(M.refNotes??[]),v]});setRfText("");setRfOpen(false)};
const close=async()=>{const hn=sc("home"),an=sc("away");if(M.ko&&hn===an)return setErr(t.noDraw);
try{const base=`competitions/${cid}`;const all=(await getDocs(query(collection(db,base,"matches"),where("stageId","==",M.stageId)))).docs.map(d=>({id:d.id,...d.data()} as Match));
const adv=!!M.ko&&(M.rIdx??0)<(M.total??0);const nr=(M.rIdx??0)+1,ns=(M.slot??0)>>1,sd=(M.slot??0)%2===0?"home":"away",nid=`${M.stageId}_r${nr}_s${ns}`;
const win=hn>an?{id:M.homeId,name:M.homeName,logo:M.homeLogo??null}:{id:M.awayId,name:M.awayName,logo:M.awayLogo??null};
const nx=adv?all.find(x=>x.id===nid):undefined;if(nx?.status==="done"&&(sd==="home"?nx.homeId:nx.awayId)!==win.id)return setErr(t.lockedKO);
const semi=!!M.ko&&(M.total??0)>=2&&M.rIdx===(M.total??0)-1&&((M.total??0)>2||all.filter(x=>x.ko&&!x.third&&x.rIdx===1).length>=2);
const lose=hn>an?{id:M.awayId,name:M.awayName,logo:M.awayLogo??null}:{id:M.homeId,name:M.homeName,logo:M.homeLogo??null};const tid=`${M.stageId}_third`;const t3=semi?all.find(x=>x.id===tid):undefined;
if(t3?.status==="done"&&(sd==="home"?t3.homeId:t3.awayId)!==lose.id)return setErr(t.lockedKO);
const b=writeBatch(db);b.update(doc(db,base,"matches",mid),{homeScore:hn,awayScore:an,homeAssists:M.homeAssists??0,awayAssists:M.awayAssists??0,homePens:M.homePens??0,awayPens:M.awayPens??0,status:"done"});
if(adv)b.set(doc(db,base,"matches",nid),{competitionId:cid,stageId:M.stageId,roundId:`${M.stageId}_r${nr}`,ko:true,slot:ns,rIdx:nr,total:M.total,...(nx?{}:{status:"upcoming",date:null,createdAt:serverTimestamp()}),[sd+"Id"]:win.id,[sd+"Name"]:win.name,[sd+"Logo"]:win.logo},{merge:true});
if(semi)b.set(doc(db,base,"matches",tid),{competitionId:cid,stageId:M.stageId,roundId:`${M.stageId}_r${M.total}`,ko:true,third:true,slot:1,rIdx:M.total,total:M.total,...(t3?{}:{status:"upcoming",date:null,createdAt:serverTimestamp()}),[sd+"Id"]:lose.id,[sd+"Name"]:lose.name,[sd+"Logo"]:lose.logo},{merge:true});
b.set(doc(collection(db,"activity")),{type:"result",homePlayer:M.homeName,awayPlayer:M.awayName,competitionId:cid,createdAt:serverTimestamp()});
await b.commit();setErr("")}catch(x){setErr(t.err+" ("+(((x as {code?:string}).code)||(x as Error).message)+")")}};
const setStatus=async(k:St)=>{setMenu(false);if(!owner||k===status)return;if(k==="done")return close();
if(status==="done"&&M.ko&&(M.rIdx??0)<(M.total??0)){try{const nid=`${M.stageId}_r${(M.rIdx??0)+1}_s${(M.slot??0)>>1}`;const nx=await getDoc(doc(db,"competitions",cid,"matches",nid));if(nx.exists()&&nx.data().status==="done")return setErr(t.lockedKO)}catch{/* a ci gaba */}}
patch({status:k,...(k==="live"&&M.homeScore==null?{homeScore:0,awayScore:0}:{})})};
const share=()=>{setMenu(false);const url=location.href;if(typeof navigator.share==="function")navigator.share({title:`${M.homeName} - ${M.awayName}`,url}).catch(()=>{});else navigator.clipboard?.writeText(url).then(()=>setErr(t.exCopied)).catch(()=>{})};
const label:Record<St,string>={done:t.closed,live:t.msLive,upcoming:t.msNot};
const moves=[...(M.moves??[])].sort((a,b)=>(a.min??999)-(b.min??999));
const Team=(s:Side)=>{const rs=rows(s);return(<div className="ms-card"><div className="ms-bar">{name(s)}<button type="button" className="ib rt" aria-label={t.msPlayers} onClick={()=>setShown({...shown,[s]:!shown[s]})} style={{background:"none",border:0,color:"#fff"}}><Ic d={LIST}/></button></div>
{shown[s]&&<><div className="ms-th"><span>#</span><span/><span>{t.msPlayers}<input type="checkbox" className="ms-ck" style={{marginLeft:8,verticalAlign:"middle"}} checked={rs.length>0&&rs.every(x=>x.on)} disabled={!owner} onChange={()=>allOn(s)} aria-label={t.msPlayers}/></span><span>{t.msStarter}</span><span>⚽</span><span>🟨</span><span>🟥</span></div>
{rs.length===0&&<p className="ms-empty">{t.msNoPlayers}</p>}
{rs.map((r,i)=><div className="ms-row" key={i}><span>{i+1}</span><input type="checkbox" className="ms-ck" checked={!!r.on} disabled={!owner} onChange={()=>tog(s,i,"on")} aria-label={r.n}/><b>{r.n}</b>
<button type="button" className={"ms-tg"+(r.st?" on":"")} disabled={!owner} onClick={()=>tog(s,i,"st")} aria-label={t.msStarter}/>
<span className="ms-g">{owner&&!locked&&(r.g??0)>0?<button type="button" onClick={()=>goal(s,i,-1)} aria-label="-1">−</button>:null}<button type="button" disabled={!owner||locked} onClick={()=>goal(s,i,1)} aria-label="+1">{r.g??0}</button></span>
<button type="button" className={"ms-cd y"+(r.y?" on":"")} disabled={!owner} onClick={()=>card(s,i,"y")} aria-label={t.msYellow}/><button type="button" className={"ms-cd r"+(r.r?" on":"")} disabled={!owner} onClick={()=>card(s,i,"r")} aria-label={t.msRed}/></div>)}
{owner&&<div className="ms-addp ms-nop"><input value={np[s]} placeholder={t.msPlayerName} onChange={e=>setNp({...np,[s]:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")addRow(s)}}/><button type="button" className="btn sm" onClick={()=>addRow(s)}>{t.msAddPlayer}</button></div>}</>}</div>)};
return(<div className="ms"><style>{CSS}</style>
<header className="ms-top"><button type="button" className="ib" aria-label={t.home} onClick={back}><Ic d={BACK}/></button>
<div className="ms-st">{owner?<><button type="button" className="ms-sel" aria-expanded={menu} onClick={()=>setMenu(!menu)}><span>{label[status]}</span><span aria-hidden="true">▾</span></button>
{menu&&<div className="ms-menu" role="menu">{(["done","live","upcoming"] as St[]).map(k=><button type="button" key={k} className={k===status?"on":""} onClick={()=>setStatus(k)}>{label[k]}</button>)}</div>}</>:<span className="ms-sel" style={{justifyContent:"center"}}>{label[status]}</span>}</div>
<button type="button" className="ib" aria-label="PDF" onClick={()=>window.print()}><Ic d={PRINT}/></button><button type="button" className="ib" aria-label={t.share} onClick={share}><Ic d={DOTS}/></button></header>
{err&&<p className="toast" role="alert" onClick={()=>setErr("")}>{err}</p>}
<div className="ms-card"><div className="ms-bar">{t.msScore}{(run||sec>0)&&<span className="ms-time">{fmt(sec)}</span>}
{owner&&<button type="button" className={"ms-sw rt"+(run?" on":"")} aria-label="Stopwatch" onClick={()=>setRun(!run)} onDoubleClick={()=>{setRun(false);setSec(0)}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)"}}><Ic d={WATCH} s={26}/></button>}</div>
<div className="ms-score"><span>{sc("home")}</span><span className="x">x</span><span>{sc("away")}</span></div>
<div className="ms-ctl"><div>{owner&&!locked&&<button type="button" className="ms-pm" onClick={()=>bump("home",-1)} disabled={sc("home")<1} aria-label="-1">−</button>}<span>{M.homeName}</span>{owner&&!locked&&<button type="button" className="ms-pm" onClick={()=>bump("home",1)} aria-label="+1">+</button>}</div>
<div>{owner&&!locked&&<button type="button" className="ms-pm" onClick={()=>bump("away",-1)} disabled={sc("away")<1} aria-label="-1">−</button>}<span>{M.awayName}</span>{owner&&!locked&&<button type="button" className="ms-pm" onClick={()=>bump("away",1)} aria-label="+1">+</button>}</div></div>
{owner&&locked&&<p className="ms-note ms-nop">{t.msLocked}</p>}</div>
<div className="ms-card"><div className="ms-bar">{t.msSubs}</div><div className="ms-subs">{(["home","away"] as Side[]).map(s=><div key={s}>{name(s)}<div className="ms-dots">{[1,2,3,4,5].map(n=><i key={n} role="button" aria-label={String(n)} className={n<=((s==="home"?M.homeSubs:M.awaySubs)??0)?"f":""} onClick={()=>setSubs(s,n)}/>)}</div></div>)}</div></div>
{Team("home")}{Team("away")}
<div className="ms-card"><div className="ms-h">{t.msVenue}</div><div className="ms-info"><label>{t.msVenue}<input value={venue} disabled={!owner} onChange={e=>setVenue(e.target.value)} onBlur={()=>{if(owner&&venue.trim()!==(M.venue??""))patch({venue:venue.trim()||null})}}/></label>
<label>{t.date}<input type="datetime-local" disabled={!owner} value={M.date??""} onChange={e=>patch({date:e.target.value||null})}/></label></div></div>
<div className="ms-card"><div className="ms-h">{t.msMoves}{owner&&<button type="button" aria-label={t.add} onClick={()=>setMvOpen(!mvOpen)}><Ic d={PLUS} s={18}/></button>}</div>
{mvOpen&&owner&&<div className="ms-form ms-nop"><select value={mvType} onChange={e=>setMvType(e.target.value as Move["type"])}><option value="yellow">{t.msYellow}</option><option value="red">{t.msRed}</option><option value="sub">{t.msSub}</option><option value="other">{t.msOther}</option></select>
<select value={mvSide} onChange={e=>setMvSide(e.target.value as Side)}><option value="home">{M.homeName}</option><option value="away">{M.awayName}</option></select>
<div className="w"><input value={mvName} placeholder={t.msPlayerName} onChange={e=>setMvName(e.target.value)}/><input type="number" min={0} inputMode="numeric" value={mvMin} placeholder={t.msMin} onChange={e=>setMvMin(e.target.value)} style={{maxWidth:90}}/><button type="button" className="btn sm" onClick={addMove}>{t.add2}</button></div></div>}
{moves.map(x=><div className="ms-mv" key={x.id}><em>{x.min!=null?x.min+"′":"—"}</em><span>{icon[x.type]}</span><span className="g"><b>{x.name||"—"}</b> <small>{name(x.side)}</small></span>{owner&&(x.type==="sub"||x.type==="other"||x.type==="yellow"||x.type==="red"||x.type==="goal")&&(x.type==="sub"||x.type==="other")&&<button type="button" className="ms-x" aria-label={t.del} onClick={()=>delMove(x.id)}>✕</button>}</div>)}
{moves.length===0&&<p className="ms-note" style={{padding:"4px 12px 14px"}}>—</p>}</div>
<div className="ms-card"><div className="ms-h">{t.msReferee}{owner&&<button type="button" aria-label={t.add} onClick={()=>setRfOpen(!rfOpen)}><Ic d={PLUS} s={18}/></button>}</div>
{rfOpen&&owner&&<div className="ms-addp ms-nop"><input value={rfText} placeholder={t.msNote} onChange={e=>setRfText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addRef()}}/><button type="button" className="btn sm" onClick={addRef}>{t.add2}</button></div>}
{(M.refNotes??[]).map((n,i)=><div className="ms-mv" key={i}><span className="g">{n}</span>{owner&&<button type="button" className="ms-x" aria-label={t.del} onClick={()=>patch({refNotes:(M.refNotes??[]).filter((_,j)=>j!==i)})}>✕</button>}</div>)}
{(M.refNotes??[]).length===0&&<p className="ms-note" style={{padding:"4px 12px 14px"}}>—</p>}</div>
</div>)}
