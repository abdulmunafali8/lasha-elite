import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {collection,doc,query,orderBy,onSnapshot,addDoc,deleteDoc,updateDoc,writeBatch,serverTimestamp,arrayUnion,arrayRemove} from "firebase/firestore";
import {auth,db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
import Players from "./Players";import Generate from "./Generate";import Bracket from "./Bracket";import Messages from "./Messages";import {Competition,Stage,Round,Match,Player} from "./types";import {standings,ranking} from "./standings";
type Tab="home"|"games"|"table"|"ranking"|"videos";
const IC={home:"M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z",games:"M3 6h18v12H3zM12 6v12M3 10h3v4H3M21 10h-3v4h3M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4",table:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",ranking:"M4 18h5v-6h5V6h6",videos:"M3 6h18v12H3zM10 9l5 3-5 3z",back:"M19 12H5M12 5l-7 7 7 7",share:"M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",addRound:"M8 8h12v12H8zM4 16V4h12M14 11v6M11 14h6",addMatch:"M12 5v14M5 12h14",editRound:"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",exportIc:"M12 3v12M7 10l5 5 5-5M5 21h14",ext:"M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",person:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",globe:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"};
const Ic=({d,s=22}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const safeUrl=(u?:string)=>{try{const x=new URL(u??"");return x.protocol==="https:"||x.protocol==="http:"?x.href:null}catch{return null}};
const Crest=({url,name}:{url?:string;name:string})=>url?<img src={url} alt="" loading="lazy"/>:<span className="ph">{name.slice(0,2).toUpperCase()}</span>;

export default function CompetitionPage({id}:{id:string}){
const {t}=useLang();const [user,setUser]=useState<User|null>(null);const [c,setC]=useState<Competition&{status?:string;isPrivate?:boolean;color?:string;website?:string;subhead?:string;description?:string}|null>(null);const [missing,setMissing]=useState(false);
const [tab,setTab]=useState<Tab>("home");const [stageId,setStageId]=useState("");const [roundId,setRoundId]=useState("");
const [rk,setRk]=useState<"scorers"|"assists"|"penalties"|"gk">("scorers");const [rs,setRs]=useState("");
const [adding,setAdding]=useState(false);const [gen,setGen]=useState(false);const [br,setBr]=useState(false);const [editing,setEditing]=useState("");const [msg,setMsg]=useState("");const [mo,setMo]=useState(false);
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
const editRound=async()=>{const r=sRounds.find(x=>x.id===roundId);if(!r)return;const n=prompt(t.roundName,r.name)?.trim();if(n&&n!==r.name)try{await updateDoc(doc(db,`${base}/rounds/${roundId}`),{name:n})}catch{setMsg(t.err)}};
const exportCsv=()=>{const q=(v:unknown)=>`"${String(v??"").replace(/"/g,'""')}"`;const rn=(rid:string)=>rounds.find(r=>r.id===rid)?.name??"";
const rows=[[t.round,t.homeP,t.awayP,"Score",t.status,t.date].map(q).join(","),...stageMatches.map(m=>[rn(m.roundId),m.homeName,m.awayName,m.status==="done"?`${m.homeScore}-${m.awayScore}`:"",m.status,m.date].map(q).join(","))];
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.join("\n")],{type:"text/csv;charset=utf-8"}));a.download=`${c.name}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const stageSel=<select className="sel" value={stageId} onChange={e=>setStageId(e.target.value)} aria-label={t.stage}>{stages.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
const tabs:Tab[]=["home","games","table","ranking","videos"];
const label:Record<Tab,string>={home:t.home,games:t.games,table:t.table,ranking:t.ranking,videos:t.videos};
return(<div className="app">
<header className="ch" style={c.color?{background:c.color}:undefined}><div className="chr"><a className="ib" href="#/" aria-label={t.home}><Ic d={IC.back}/></a><h1>{c.name}</h1><button className="ib" onClick={share} aria-label={t.share}><Ic d={IC.share}/></button>{owner&&<div className="mwrap"><button className="ib" onClick={()=>setMo(!mo)} aria-label={t.menu} aria-expanded={mo}><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button>{mo&&<><div className="mscrim" onClick={()=>setMo(false)}/><div className="pmenu"><a href={`#/competition/${id}/settings`} onClick={()=>setMo(false)}><Ic d={IC.editRound} s={20}/>{t.edit}</a></div></>}</div>}</div>
<nav className="tabs">{tabs.map(k=><button key={k} className={tab===k?"on":""} onClick={()=>setTab(k)} aria-label={label[k]}><Ic d={IC[k]} s={20}/>{tab===k&&<span>{label[k]}</span>}</button>)}</nav></header>
{msg&&<p className="toast" role="alert" onClick={()=>setMsg("")}>{msg}</p>}
{tab==="home"&&<section><div className="hero" style={c.coverUrl?{backgroundImage:`url(${c.coverUrl})`}:undefined}/>
<div className="sheet"><div className="hrow"><div className="big"><Crest url={c.logoUrl} name={c.name}/></div><button className={"follow"+(following?" on":"")} onClick={toggleFollow}>{following?"✓ "+t.following:t.followBtn}</button></div>
<div className="pad"><p className="muted"><span className="gdot">●</span> {c.isPrivate?t.priv:t.pub} · {c.followers?.length??0} {t.followers}</p><h2 className="title">{c.name}</h2>{c.subhead&&<p className="muted">{c.subhead}</p>}{c.description&&<p>{c.description}</p>}
<dl className="info"><div className="irow"><i className="sdot"/><span><dt>{t.status}</dt><dd className="blue">{({prep:t.prep,run:t.sRun,done:t.sDone} as Record<string,string>)[c.status??"prep"]}</dd></span></div><div className="irow"><Ic d={IC.person}/><span><dt>{t.organizer}</dt><dd>{c.organizerName}</dd></span></div>{safeUrl(c.website)&&<div><a className="irow" href={safeUrl(c.website)!} target="_blank" rel="noopener noreferrer"><Ic d={IC.globe}/><span><dt>{t.site}</dt><dd>{t.site}</dd></span><Ic d={IC.ext} s={18}/></a></div>}</dl><Messages cid={id} user={user} t={t}/></div></div></section>}
{tab==="games"&&<section className="pad">{owner&&<div className="apanel"><button onClick={addRound}><i style={{background:"#3b9cf0"}}><Ic d={IC.addRound} s={26}/></i>{t.addRound}</button><button disabled={!roundId} onClick={()=>setAdding(true)}><i style={{background:"#ff9800"}}><Ic d={IC.addMatch} s={26}/></i>{t.addMatch}</button><button disabled={!roundId} onClick={editRound}><i style={{background:"#6b7cf0"}}><Ic d={IC.editRound} s={24}/></i>{t.editRound}</button><button disabled={!stageMatches.length} onClick={exportCsv}><i style={{background:"#f5c518"}}><Ic d={IC.exportIc} s={24}/></i>{t.exportCsv}</button></div>}
{owner&&roundId&&adding&&<AddMatch players={players} t={t} onCancel={()=>setAdding(false)} onErr={setMsg} onSave={async(h,a,date)=>{await addDoc(sub("matches"),{competitionId:id,stageId,roundId,homeId:h.id,awayId:a.id,homeName:h.name,awayName:a.name,homeLogo:h.logoUrl??null,awayLogo:a.logoUrl??null,status:"upcoming",date:date||null,createdAt:serverTimestamp()});setAdding(false)}}/>}
<div className="sh"><div><p className="eyebrow">{t.matches}</p>
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
<div className={"score"+(m.status==="done"?"":" idle")}>{m.status==="done"?<><em className="chip">{t.closed}</em><b>{m.homeScore} : {m.awayScore}</b></>:"⋮"}</div>
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
