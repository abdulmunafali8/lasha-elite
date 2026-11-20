import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,query,orderBy,onSnapshot,addDoc,deleteDoc,updateDoc,writeBatch,serverTimestamp,arrayUnion,arrayRemove} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
import Players from "./Players";import Generate from "./Generate";import Bracket from "./Bracket";import Messages from "./Messages";import {Competition,Stage,Round,Match,Player} from "./types";import {standings,ranking} from "./standings";
type Tab="home"|"games"|"table"|"ranking"|"videos";
const ICON:Record<Tab,string>={home:"🏠",games:"⚽",table:"☰",ranking:"📈",videos:"▶"};
const safeUrl=(u?:string)=>{try{const x=new URL(u??"");return x.protocol==="https:"||x.protocol==="http:"?x.href:null}catch{return null}};
const Crest=({url,name}:{url?:string;name:string})=>url?<img src={url} alt="" loading="lazy"/>:<span className="ph">{name.slice(0,2).toUpperCase()}</span>;

export default function CompetitionPage({id}:{id:string}){
const {t}=useLang();const [user,setUser]=useState<User|null>(null);const [c,setC]=useState<Competition&{status?:string;isPrivate?:boolean;color?:string;website?:string;subhead?:string;description?:string}|null>(null);const [missing,setMissing]=useState(false);
const [tab,setTab]=useState<Tab>("home");const [stageId,setStageId]=useState("");const [roundId,setRoundId]=useState("");
const [rk,setRk]=useState<"scorers"|"assists"|"penalties"|"gk">("scorers");const [rs,setRs]=useState("");
const [adding,setAdding]=useState(false);const [gen,setGen]=useState(false);const [br,setBr]=useState(false);const [editing,setEditing]=useState("");const [msg,setMsg]=useState("");
useEffect(()=>onAuthStateChanged(auth,setUser),[]);
useEffect(()=>onSnapshot(doc(db,"competitions",id),s=>s.exists()?setC({id:s.id,...s.data()} as never):setMissing(true),()=>setMissing(true)),[id]);
const col=(n:string)=>query(collection(db,"competitions",id,n),orderBy(n==="matches"?"createdAt":"order"));
const stages=useLive<Stage>(useMemo(()=>col("stages"),[id])).d;
const rounds=useLive<Round>(useMemo(()=>col("rounds"),[id])).d;
const matches=useLive<Match>(useMemo(()=>query(collection(db,"competitions",id,"matches"),orderBy("createdAt")),[id])).d;
const players=useLive<Player>(useMemo(()=>query(collection(db,"competitions",id,"players"),orderBy("name")),[id])).d;
const groups=useLive<{id:string;name:string}>(useMemo(()=>query(collection(db,"competitions",id,"groups"),orderBy("order")),[id])).d;const [gid,setGid]=useState("");
useEffect(()=>{if(!stageId&&stages[0])setStageId(stages[0].id)},[stages,stageId]);
const sRounds=rounds.filter(r=>r.stageId===stageId);
useEffect(()=>{if(!sRounds.find(r=>r.id===roundId))setRoundId(sRounds[0]?.id??"")},[stageId,rounds]);
if(missing)return<div className="app"><p className="muted pad">{t.err}</p></div>;if(!c)return<div className="app"><p className="muted pad">{t.loading}</p></div>;
const owner=user?.uid===c.ownerId;const following=!!user&&c.followers?.includes(user.uid);
const base=`competitions/${id}`;const sub=(n:string)=>collection(db,base,n);
const ask=(label:string)=>{const v=prompt(label)?.trim();return v||null};
const addStage=async()=>{const n=ask(t.stageName);if(n)await addDoc(sub("stages"),{name:n,order:stages.length+1})};
const addRound=async()=>{if(!stageId)return setMsg(t.pickRound);const n=ask(t.roundName)??`${t.round} ${sRounds.length+1}`;await addDoc(sub("rounds"),{stageId,name:n,order:sRounds.length+1})};
const toggleFollow=()=>{if(!user)return setMsg(t.signin);return updateDoc(doc(db,"competitions",id),{followers:following?arrayRemove(user.uid):arrayUnion(user.uid)})};
const share=()=>navigator.share?.({title:c.name,url:location.href}).catch(()=>{});
const del=async(path:string)=>{if(confirm(t.sure))await deleteDoc(doc(db,path))};
const stageMatches=matches.filter(m=>m.stageId===stageId);
const stageSel=<select className="sel" value={stageId} onChange={e=>setStageId(e.target.value)} aria-label={t.stage}>{stages.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
const tabs:Tab[]=["home","games","table","ranking","videos"];
const label:Record<Tab,string>={home:t.home,games:t.games,table:t.table,ranking:t.ranking,videos:t.videos};
return(<div className="app">
<header className="ch" style={c.color?{background:c.color}:undefined}><div className="chr"><a className="ib" href="#/" aria-label={t.home}>←</a><h1>{c.name}</h1>{owner&&<a className="ib" href={`#/competition/${id}/settings`} aria-label={t.settings}>⚙</a>}<button className="ib" onClick={share} aria-label={t.share}>↗</button></div>
<nav className="tabs">{tabs.map(k=><button key={k} className={tab===k?"on":""} onClick={()=>setTab(k)} aria-label={label[k]}>{ICON[k]}{tab===k&&<span> {label[k]}</span>}</button>)}</nav></header>
{msg&&<p className="toast" role="alert" onClick={()=>setMsg("")}>{msg}</p>}
{tab==="home"&&<section><div className="hero" style={c.coverUrl?{backgroundImage:`url(${c.coverUrl})`}:undefined}/>
<div className="hrow"><div className="big"><Crest url={c.logoUrl} name={c.name}/></div><button className={"follow"+(following?" on":"")} onClick={toggleFollow}>{following?"✓ "+t.following:t.followBtn}</button></div>
<div className="pad"><p className="muted"><span className="gdot">●</span> {c.isPrivate?t.priv:t.pub} · {c.followers?.length??0} {t.followers}</p><h2 className="title">{c.name}</h2>{c.subhead&&<p className="muted">{c.subhead}</p>}{c.description&&<p>{c.description}</p>}
<dl className="info"><div><dt>{t.status}</dt><dd className="blue">{({prep:t.prep,run:t.sRun,done:t.sDone} as Record<string,string>)[c.status??"prep"]}</dd></div><div><dt>{t.organizer}</dt><dd>{c.organizerName}</dd></div>{safeUrl(c.website)&&<div><dt>{t.site}</dt><dd><a href={safeUrl(c.website)!} target="_blank" rel="noopener noreferrer">{c.website} ↗</a></dd></div>}</dl><Messages cid={id} user={user} t={t}/></div></section>}
{tab==="games"&&<section className="pad rel">{owner&&roundId&&<button className="halfpill" onClick={()=>setAdding(true)} aria-label={t.addMatch}>+</button>}<div className="sh"><div><p className="eyebrow">{t.matches}</p>
<select className="sel" value={stageId} onChange={e=>setStageId(e.target.value)} aria-label={t.stage}>{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
{owner&&<div className="acts"><button className="ib sm" onClick={addStage}>+ {t.stage}</button>{stageId&&<button className="ib sm" onClick={()=>sRounds.length?setMsg(t.stageUsed):del(`${base}/stages/${stageId}`)} aria-label={t.del}>🗑</button>}</div>}</div>
<div className="pills">{sRounds.map(r=><button key={r.id} className={"pill"+(r.id===roundId?" on":"")} onClick={()=>setRoundId(r.id)}>{r.name}</button>)}
{owner&&<button className="pill plus" onClick={addRound} aria-label={t.addRound}>+</button>}</div>
{sRounds.some(r=>r.ko)&&<><button className="pill" onClick={()=>setBr(!br)}>🏆 {t.bracket}</button>{br&&<Bracket rounds={sRounds} matches={stageMatches} t={t}/>}</>}
{owner&&!sRounds.length&&<div className="empty"><button className="btn" onClick={()=>setGen(true)}>{t.gen}</button><p>{t.or}</p><button className="btn" onClick={addRound}>{t.addRound}</button></div>}
{gen&&owner&&stageId&&<Generate cid={id} stageId={stageId} players={players} hasMatches={stageMatches.length>0} allMatches={matches} stages={stages} groups={groups} t={t} onDone={()=>setGen(false)} onErr={setMsg}/>}
{!stages.length&&<p className="muted">{t.pickRound}</p>}
{matches.filter(m=>m.roundId===roundId).map(m=><MatchCard key={m.id} all={matches} m={m} owner={owner} open={editing===m.id} setOpen={o=>setEditing(o?m.id:"")} base={base} cid={id} t={t} onDel={()=>del(`${base}/matches/${m.id}`)} onErr={setMsg}/>)}
{roundId&&!matches.some(m=>m.roundId===roundId)&&<p className="muted">{t.noMatches}</p>}
{owner&&roundId&&(adding?<AddMatch players={players} t={t} onCancel={()=>setAdding(false)} onErr={setMsg} onSave={async(h,a,date)=>{await addDoc(sub("matches"),{competitionId:id,stageId,roundId,homeId:h.id,awayId:a.id,homeName:h.name,awayName:a.name,homeLogo:h.logoUrl??null,awayLogo:a.logoUrl??null,status:"upcoming",date:date||null,createdAt:serverTimestamp()});setAdding(false)}}/>:<button className="btn" onClick={()=>setAdding(true)}>{t.addMatch}</button>)}
</section>}
{tab==="table"&&<section><div className="pad"><p className="eyebrow">{t.leaderboard}</p>{stageSel}{groups.length>0&&<div className="pills"><button className={"pill"+(!gid?" on":"")} onClick={()=>setGid("")}>{t.all}</button>{groups.map(g=><button key={g.id} className={"pill"+(gid===g.id?" on":"")} onClick={()=>setGid(g.id)}>{g.name}</button>)}</div>}</div>
<div className="tw"><table><thead><tr><th>#</th><th className="l">{t.players}</th>{["PTS","MP","W","D","L","GF","GA","GD"].map(h=><th key={h}>{h}</th>)}</tr></thead>
<tbody>{standings(players.filter(p=>!gid||p.groupId===gid),stageMatches.filter(m=>!gid||m.groupId===gid)).map((r,i)=><tr key={r.id}><td>{i+1}</td><td className="l"><span className="cr"><Crest url={r.logoUrl} name={r.name}/></span>{r.name}</td><td><b>{r.pts}</b></td><td>{r.mp}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td></tr>)}</tbody></table></div>{owner&&user&&<Players cid={id} uid={user.uid} t={t}/>}</section>}
{tab==="ranking"&&(()=>{const rows=ranking(players,matches.filter(m=>!rs||m.stageId===rs),rk);return<section className="pad"><div className="pills">{(["scorers","assists","penalties","gk"] as const).map(k=><button key={k} className={"pill"+(rk===k?" on":"")} onClick={()=>setRk(k)}>{t[k]}</button>)}</div>
<div className="sh"><select className="sel" value={rs} onChange={e=>setRs(e.target.value)} aria-label={t.stage}><option value="">{t.allStages}</option>{stages.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><span className="muted">{rows.length} {t.players}</span></div>
{rows.length===0?<p className="muted ctr bigmu">{t.noData}</p>:rows.map((r,i)=><div key={r.id} className="prow"><b className="rk">{i+1}</b><span className="cr">{r.logoUrl?<img src={r.logoUrl} alt=""/>:r.name.slice(0,2).toUpperCase()}</span><div className="grow"><b>{r.name}</b>{r.sub&&<p className="muted">{r.sub}</p>}</div><b className="rv">{r.value}</b></div>)}</section>})()}
{tab==="videos"&&<p className="muted pad">{t.soon}</p>}
</div>)}

function MatchCard({all,m,owner,open,setOpen,base,cid,t,onDel,onErr}:{all:Match[];m:Match;owner:boolean;open:boolean;setOpen:(o:boolean)=>void;base:string;cid:string;t:Record<string,string>;onDel:()=>void;onErr:(s:string)=>void}){
const [h,setH]=useState(String(m.homeScore??""));const [a,setA]=useState(String(m.awayScore??""));const [ha,setHa]=useState(String(m.homeAssists??""));const [aa,setAa]=useState(String(m.awayAssists??""));const [hp,setHp]=useState(String(m.homePens??""));const [ap,setAp]=useState(String(m.awayPens??""));
const save=async()=>{const hn=Number(h),an=Number(a);if(h===""||a===""||!Number.isInteger(hn)||!Number.isInteger(an)||hn<0||an<0)return onErr(t.badScore);
const st=[ha,aa,hp,ap].map(x=>x===""?0:Number(x));if(st.some(x=>!Number.isInteger(x)||x<0))return onErr(t.badScore);
if(st[0]>hn||st[2]>hn||st[1]>an||st[3]>an)return onErr(t.statBad);
if(m.ko&&hn===an)return onErr(t.noDraw);
const adv=!!m.ko&&(m.rIdx??0)<(m.total??0);const nr=(m.rIdx??0)+1,ns=(m.slot??0)>>1,sd=(m.slot??0)%2===0?"home":"away",nid=`${m.stageId}_r${nr}_s${ns}`;
const win=hn>an?{id:m.homeId,name:m.homeName,logo:m.homeLogo??null}:{id:m.awayId,name:m.awayName,logo:m.awayLogo??null};
const nx=adv?all.find(x=>x.id===nid):undefined;
if(nx?.status==="done"&&(sd==="home"?nx.homeId:nx.awayId)!==win.id)return onErr(t.lockedKO);
const semi=!!m.ko&&(m.total??0)>=2&&m.rIdx===(m.total??0)-1;const lose=hn>an?{id:m.awayId,name:m.awayName,logo:m.awayLogo??null}:{id:m.homeId,name:m.homeName,logo:m.homeLogo??null};const tid=`${m.stageId}_third`;const t3=semi?all.find(x=>x.id===tid):undefined;
if(t3?.status==="done"&&(sd==="home"?t3.homeId:t3.awayId)!==lose.id)return onErr(t.lockedKO);
const b=writeBatch(db);b.update(doc(db,base,"matches",m.id),{homeScore:hn,awayScore:an,homeAssists:st[0],awayAssists:st[1],homePens:st[2],awayPens:st[3],status:"done"});
if(adv)b.set(doc(db,base,"matches",nid),{competitionId:cid,stageId:m.stageId,roundId:`${m.stageId}_r${nr}`,ko:true,slot:ns,rIdx:nr,total:m.total,...(nx?{}:{status:"upcoming",date:null,createdAt:serverTimestamp()}),[sd+"Id"]:win.id,[sd+"Name"]:win.name,[sd+"Logo"]:win.logo},{merge:true});
if(semi)b.set(doc(db,base,"matches",tid),{competitionId:cid,stageId:m.stageId,roundId:`${m.stageId}_r${m.total}`,ko:true,third:true,slot:1,rIdx:m.total,total:m.total,...(t3?{}:{status:"upcoming",date:null,createdAt:serverTimestamp()}),[sd+"Id"]:lose.id,[sd+"Name"]:lose.name,[sd+"Logo"]:lose.logo},{merge:true});
b.set(doc(collection(db,"activity")),{type:"result",homePlayer:m.homeName,awayPlayer:m.awayName,competitionId:cid,createdAt:serverTimestamp()});
try{await b.commit();setOpen(false)}catch{onErr(t.err)}};
return(<div className="mc"><button className="mrow" onClick={()=>owner&&m.homeId&&m.awayId&&setOpen(!open)}>
<div className="side"><div className="cb"><Crest url={m.homeLogo} name={m.homeName||"?"}/></div><b>{m.homeName||t.tbd}</b></div>
<div className="score">{m.status==="done"?`${m.homeScore} : ${m.awayScore}`:"⋮"}</div>
<div className="side"><div className="cb"><Crest url={m.awayLogo} name={m.awayName||"?"}/></div><b>{m.awayName||t.tbd}</b></div></button>
{m.third&&<p className="muted ctr">🥉 {t.third}</p>}{m.date&&<p className="muted ctr">{new Date(m.date).toLocaleString()}</p>}
{open&&<div className="edit"><input type="number" min={0} inputMode="numeric" value={h} onChange={e=>setH(e.target.value)} aria-label={m.homeName}/><span>:</span><input type="number" min={0} inputMode="numeric" value={a} onChange={e=>setA(e.target.value)} aria-label={m.awayName}/>
<div className="stat"><input type="number" min={0} inputMode="numeric" placeholder="0" value={ha} onChange={e=>setHa(e.target.value)} aria-label={t.assists+" "+m.homeName}/><span>{t.assists}</span><input type="number" min={0} inputMode="numeric" placeholder="0" value={aa} onChange={e=>setAa(e.target.value)} aria-label={t.assists+" "+m.awayName}/></div><div className="stat"><input type="number" min={0} inputMode="numeric" placeholder="0" value={hp} onChange={e=>setHp(e.target.value)} aria-label={t.penalties+" "+m.homeName}/><span>{t.penalties}</span><input type="number" min={0} inputMode="numeric" placeholder="0" value={ap} onChange={e=>setAp(e.target.value)} aria-label={t.penalties+" "+m.awayName}/></div><button className="btn sm" onClick={save}>{t.save}</button><button className="btn sm danger" onClick={onDel}>{t.del}</button></div>}</div>)}

function AddMatch({players,t,onSave,onCancel,onErr}:{players:Player[];t:Record<string,string>;onSave:(h:Player,a:Player,d:string)=>Promise<void>;onCancel:()=>void;onErr:(s:string)=>void}){
const [h,setH]=useState("");const [a,setA]=useState("");const [d,setD]=useState("");
const go=()=>{const hp=players.find(p=>p.id===h),ap=players.find(p=>p.id===a);if(!hp||!ap)return onErr(t.err);if(hp.id===ap.id)return onErr(t.same);onSave(hp,ap,d).catch(()=>onErr(t.err))};
return(<div className="form"><label>{t.homeP}<select value={h} onChange={e=>setH(e.target.value)}><option value=""/>{players.filter(p=>p.id!==a).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
<label>{t.awayP}<select value={a} onChange={e=>setA(e.target.value)}><option value=""/>{players.filter(p=>p.id!==h).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
<label>{t.date}<input type="datetime-local" value={d} onChange={e=>setD(e.target.value)}/></label>
<div className="acts"><button className="btn sm" onClick={go}>{t.save}</button><button className="btn sm ghost" onClick={onCancel}>{t.cancel}</button></div></div>)}
