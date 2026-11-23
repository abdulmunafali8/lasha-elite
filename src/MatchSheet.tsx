import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {doc,updateDoc} from "firebase/firestore";
import {db} from "./firebase";import {Match,Player} from "./types";
import "./sheetStyles";
type Side="home"|"away";
type Line={n:string;r?:string;st:boolean;g:number;y:number;rd:boolean};
type Move={at:number;min:number|null;side:Side;ic:string;text:string};
type Clock={run:boolean;base:number;at:number};
type X=Match&{homeLines?:Line[];awayLines?:Line[];homeSubs?:number;awaySubs?:number;moves?:Move[];refs?:string[];clock?:Clock};
type Squad={name:string;role?:string}[];
const merge=(squad:Squad|undefined,saved:Line[]|undefined):Line[]=>{const sv=saved??[];const out:Line[]=(squad??[]).map(s=>sv.find(l=>l.n===s.name)??{n:s.name,r:s.role??"",st:false,g:0,y:0,rd:false});for(const l of sv)if(!out.some(o=>o.n===l.n))out.push(l);return out};
const mmss=(ms:number)=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")};
const Ic=({d,s=22}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const BACK="M19 12H5M12 5l-7 7 7 7";const PRINT="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z";const WATCH="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 9v4l2.5 1.5M9.5 2h5";

const SEG:Record<string,string>={a:"7,2 33,2 37,6 33,10 7,10 3,6",b:"32,10 36,6 40,10 40,31 36,35 32,31",c:"32,41 36,37 40,41 40,62 36,66 32,62",d:"7,62 33,62 37,66 33,70 7,70 3,66",e:"0,41 4,37 8,41 8,62 4,66 0,62",f:"0,10 4,6 8,10 8,31 4,35 0,31",g:"7,32 33,32 37,36 33,40 7,40 3,36"};
const ON:Record<string,string>={"0":"abcdef","1":"bc","2":"abged","3":"abgcd","4":"fgbc","5":"afgcd","6":"afgedc","7":"abc","8":"abcdefg","9":"abcdfg"};
const Digits=({v}:{v:number})=><span className="dg" aria-label={String(v)}>{String(v).split("").map((ch,i)=><svg key={i} viewBox="0 0 40 72" width="48" height="86" aria-hidden="true">{Object.keys(SEG).map(k=><polygon key={k} points={SEG[k]} fill="currentColor" opacity={(ON[ch]??"").includes(k)?1:0.09}/>)}</svg>)}</span>;
export default function MatchSheet({m,all,players,base,owner,t,onClose,closeMatch,onErr}:{m:Match;all:Match[];players:Player[];base:string;owner:boolean;t:Record<string,string>;onClose:()=>void;closeMatch:(hn:number,an:number)=>Promise<string|null>;onErr:(s:string)=>void}){
const x=m as X;const status=m.status as string;const done=status==="done";const live=status==="live";
const [now,setNow]=useState(Date.now());const [msg,setMsg]=useState("");
const [mf,setMf]=useState(false);const [mSide,setMSide]=useState<Side>("home");const [mIc,setMIc]=useState("⚽");const [mText,setMText]=useState("");const [mMin,setMMin]=useState("");
const [rf,setRf]=useState(false);const [rText,setRText]=useState("");const [dd,setDd]=useState(false);const [mvF,setMvF]=useState<""|Side>("");
const sc=(s:Side)=>(s==="home"?m.homeScore:m.awayScore)??0;
const cl:Clock=x.clock??{run:false,base:0,at:0};
useEffect(()=>{if(!(cl.run&&live))return;setNow(Date.now());const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i)},[cl.run,live]);
const ms=cl.base+(cl.run&&live?Math.max(0,now-cl.at):0);
const minNow=():number|null=>(cl.run||cl.base>0)?Math.floor(ms/60000)+1:null;
const patch=(p:Record<string,unknown>)=>updateDoc(doc(db,base,"matches",m.id),p).catch(()=>onErr(t.err));
const squadOf=(s:Side)=>(players.find(p=>p.id===(s==="home"?m.homeId:m.awayId)) as (Player&{squad?:Squad})|undefined)?.squad;
const lines=(s:Side)=>merge(squadOf(s),s==="home"?x.homeLines:x.awayLines);
const canEdit=owner&&!done;

const setStatus=async(v:string)=>{if(!owner||v===status)return;setMsg("");
 if(v==="live"){patch({status:"live",homeScore:sc("home"),awayScore:sc("away")});return}
 if(v==="upcoming"){if(done){const nx=m.ko?all.find(q=>q.id===`${m.stageId}_r${(m.rIdx??0)+1}_s${(m.slot??0)>>1}`):undefined;if(nx&&(nx.status as string)==="done")return setMsg(t.lockedKO);if(!confirm(t.sure))return}
  patch({status:"upcoming",homeScore:null,awayScore:null,clock:{run:false,base:0,at:0}});return}
 const e=await closeMatch(sc("home"),sc("away"));if(e)setMsg(e);else patch({clock:{run:false,base:ms,at:0}})};
const bump=(s:Side,d:number)=>{if(!canEdit)return;const p:Record<string,unknown>={[s+"Score"]:Math.max(0,sc(s)+d)};if(status==="upcoming"){p.status="live";p[(s==="home"?"away":"home")+"Score"]=sc(s==="home"?"away":"home")}patch(p)};
const toggleClock=()=>{if(!canEdit)return;if(cl.run)patch({clock:{run:false,base:ms,at:0}});else{const p:Record<string,unknown>={clock:{run:true,base:ms,at:Date.now()}};if(status==="upcoming"){p.status="live";p.homeScore=sc("home");p.awayScore=sc("away")}patch(p)}};
const dropMoves=(mv:Move[],s:Side,ic:string,n:string,last:boolean)=>{const idx=mv.map((q,j)=>q.side===s&&q.ic===ic&&q.text===n?j:-1).filter(j=>j>=0);const out=[...mv];(last?idx.slice(-1):idx).reverse().forEach(j=>out.splice(j,1));return out};
const edit=(s:Side,i:number,what:"st"|"g+"|"g-"|"y"|"rd")=>{if(!canEdit)return;const L=lines(s);const ln={...L[i]};let mv=[...(x.moves??[])];const upd:Record<string,unknown>={};
 if(what==="st")ln.st=!ln.st;
 if(what==="g+"){ln.g+=1;mv.push({at:Date.now(),min:minNow(),side:s,ic:"⚽",text:ln.n});upd[s+"Score"]=sc(s)+1}
 if(what==="g-"&&ln.g>0){ln.g-=1;mv=dropMoves(mv,s,"⚽",ln.n,true);upd[s+"Score"]=Math.max(0,sc(s)-1)}
 if(what==="y"){ln.y=(ln.y+1)%3;if(ln.y===0)mv=dropMoves(mv,s,"🟨",ln.n,false);else mv.push({at:Date.now(),min:minNow(),side:s,ic:"🟨",text:ln.n})}
 if(what==="rd"){ln.rd=!ln.rd;if(ln.rd)mv.push({at:Date.now(),min:minNow(),side:s,ic:"🟥",text:ln.n});else mv=dropMoves(mv,s,"🟥",ln.n,false)}
 L[i]=ln;upd[s+"Lines"]=L;upd.moves=mv;if(("g+"===what||"g-"===what)&&status==="upcoming"){upd.status="live";upd[(s==="home"?"away":"home")+"Score"]=sc(s==="home"?"away":"home")}patch(upd)};
const allSt=(s:Side)=>{if(!canEdit)return;const L=lines(s);if(!L.length)return;const on=!L.every(l=>l.st);patch({[s+"Lines"]:L.map(l=>({...l,st:on}))})};
const subs=(s:Side,i:number)=>{if(!canEdit)return;const cur=(s==="home"?x.homeSubs:x.awaySubs)??0;patch({[s+"Subs"]:i+1===cur?cur-1:i+1})};
const addMove=()=>{if(!canEdit&&!owner)return;const tx=mText.trim();if(!tx)return;const mn=mMin===""?minNow():Number(mMin);patch({moves:[...(x.moves??[]),{at:Date.now(),min:Number.isFinite(mn as number)?mn:null,side:mSide,ic:mIc,text:tx}]});setMText("");setMMin("");setMf(false)};
const delMove=(at:number)=>owner&&patch({moves:(x.moves??[]).filter(q=>q.at!==at)});
const addRef=()=>{const tx=rText.trim();if(!owner||!tx)return;patch({refs:[...(x.refs??[]),tx]});setRText("");setRf(false)};
const delRef=(i:number)=>owner&&patch({refs:(x.refs??[]).filter((_,j)=>j!==i)});
const label:Record<string,string>={done:t.closed,live:t.live,upcoming:t.notStarted};
const cur=status==="done"||status==="live"?status:"upcoming";
const moves=[...(x.moves??[])].sort((a,b)=>(a.min??999)-(b.min??999)||a.at-b.at).filter(q=>!mvF||q.side===mvF);
const team=(s:Side)=>{const L=lines(s);const name=s==="home"?m.homeName:m.awayName;return<div className="ms-card" key={s}><div className="ms-h">{name}</div>
<div className="ms-ph"><span>#</span><span className="pl">{t.tmSquad}<button type="button" className={"ms-ck"+(L.length>0&&L.every(l=>l.st)?" on":"")} disabled={!canEdit||L.length===0} aria-label={t.starter} onClick={()=>allSt(s)}>✓</button></span><span>{t.starter}</span><span>⚽</span><span className="ms-yc"/><span className="ms-rc"/></div>
{L.length===0?<p className="ms-empty">{t.noSquad}</p>:L.map((l,i)=><div className="ms-pr" key={l.n+i}><span>{i+1}</span><span className="nm">{l.n}{l.r?<small>{l.r}</small>:null}</span>
<button type="button" className={"ms-sw2"+(l.st?" on":"")} disabled={!canEdit} aria-label={t.starter} onClick={()=>edit(s,i,"st")}/>
<span className="ms-g">{canEdit&&<button type="button" aria-label="−" onClick={()=>edit(s,i,"g-")}>−</button>}<b>{l.g}</b>{canEdit&&<button type="button" aria-label="+" onClick={()=>edit(s,i,"g+")}>+</button>}</span>
<button type="button" className={"ms-cd"+(l.y>0?" y":"")} disabled={!canEdit} aria-label="yellow" onClick={()=>edit(s,i,"y")}>{l.y>1?l.y:""}</button>
<button type="button" className={"ms-cd"+(l.rd?" r":"")} disabled={!canEdit} aria-label="red" onClick={()=>edit(s,i,"rd")}/></div>)}</div>};
return createPortal(<div className="ms" role="dialog" aria-modal="true">
<div className="ms-top"><button type="button" aria-label="Back" onClick={onClose}><Ic d={BACK}/></button>
<div className="ms-st">{owner?<div className="ms-dd"><button type="button" className="ms-ddb" aria-haspopup="listbox" aria-expanded={dd} aria-label={t.sheetT} onClick={()=>setDd(!dd)}><span>{label[cur]}</span><svg viewBox="0 0 10 5" width="12" height="6" aria-hidden="true"><path d="M0 0h10L5 5z" fill="currentColor"/></svg></button>{dd&&<><div className="ms-ddx" onClick={()=>setDd(false)}/><div className="ms-ddm" role="listbox">{["done","live","upcoming"].map(k=><button type="button" role="option" aria-selected={cur===k} key={k} className={cur===k?"on":""} onClick={()=>{setDd(false);setStatus(k)}}>{label[k]}</button>)}</div></>}</div>:<span className="ms-ddb">{label[status]??label.upcoming}</span>}</div>
<button type="button" aria-label="Print" onClick={()=>window.print()}><Ic d={PRINT}/></button></div>
{msg&&<p className="toast" role="alert" onClick={()=>setMsg("")}>{msg}</p>}
<div className="ms-card"><div className="ms-h">{t.scoreT}</div>
<div className="ms-score"><div className="ms-col"><Digits v={sc("home")}/>{canEdit&&<div className="ms-pm"><button type="button" aria-label="−" onClick={()=>bump("home",-1)}>−</button><button type="button" aria-label="+" onClick={()=>bump("home",1)}>+</button></div>}</div><i>×</i>
<div className="ms-col"><Digits v={sc("away")}/>{canEdit&&<div className="ms-pm"><button type="button" aria-label="−" onClick={()=>bump("away",-1)}>−</button><button type="button" aria-label="+" onClick={()=>bump("away",1)}>+</button></div>}</div></div>
{(ms>0||cl.run)&&<div className="ms-clock"><span>{mmss(ms)}</span>{canEdit&&!cl.run&&cl.base>0&&<button type="button" className="ms-rs" onClick={()=>patch({clock:{run:false,base:0,at:0}})}>{t.clockReset}</button>}</div>}{canEdit&&<button type="button" className={"ms-sw"+(cl.run?" on":"")} aria-label="Stopwatch" onClick={toggleClock}><Ic d={WATCH} s={28}/></button>}</div>
<div className="ms-card"><div className="ms-h">{t.subsT}</div><div className="ms-subs">{(["home","away"] as Side[]).map(s=><div key={s}><b>{s==="home"?m.homeName:m.awayName}</b><div className="ms-dots">{[0,1,2,3,4].map(i=><button type="button" key={i} className={i<((s==="home"?x.homeSubs:x.awaySubs)??0)?"on":""} disabled={!canEdit} aria-label={"sub "+(i+1)} onClick={()=>subs(s,i)}/>)}</div></div>)}</div></div>
{team("home")}{team("away")}
<div className="ms-card"><div className="ms-sec"><span>{t.movesT}</span>{owner&&<button type="button" className="ms-add" aria-label={t.qAdd} onClick={()=>setMf(!mf)}>+</button>}<button type="button" className="ms-fl" aria-label="Filter" onClick={()=>setMvF(mvF===""?"home":mvF==="home"?"away":"")}>{mvF&&<small>{mvF==="home"?m.homeName:m.awayName}</small>}<Ic d="M3 6h18M6 12h12M10 18h4" s={26}/></button></div>
{mf&&<div className="ms-form"><div className="r"><select value={mSide} onChange={e=>setMSide(e.target.value as Side)}><option value="home">{m.homeName}</option><option value="away">{m.awayName}</option></select><select value={mIc} onChange={e=>setMIc(e.target.value)}>{["⚽","🟨","🟥","🔁","📝"].map(i=><option key={i} value={i}>{i}</option>)}</select><input type="number" inputMode="numeric" min={0} placeholder="'" value={mMin} onChange={e=>setMMin(e.target.value)} style={{width:70}}/></div><input value={mText} placeholder={t.tmName} onChange={e=>setMText(e.target.value)}/><button type="button" className="btn sm" onClick={addMove}>{t.qAdd}</button></div>}
{moves.map(q=><div className="ms-mv" key={q.at}><span className="mn">{q.min!=null?q.min+"'":"–"}</span><span>{q.ic}</span><span className="tx">{q.text} <small className="muted">({q.side==="home"?m.homeName:m.awayName})</small></span>{owner&&<button type="button" aria-label={t.del} onClick={()=>delMove(q.at)}>✕</button>}</div>)}
<div className="ms-sec"><span>{t.refT}</span>{owner&&<button type="button" className="ms-add" aria-label={t.qAdd} onClick={()=>setRf(!rf)}>+</button>}</div>
{rf&&<div className="ms-form"><input value={rText} placeholder={t.refT} onChange={e=>setRText(e.target.value)}/><button type="button" className="btn sm" onClick={addRef}>{t.qAdd}</button></div>}
{(x.refs??[]).map((r,i)=><div className="ms-mv" key={i}><span>📝</span><span className="tx">{r}</span>{owner&&<button type="button" aria-label={t.del} onClick={()=>delRef(i)}>✕</button>}</div>)}</div>
<div style={{height:40}}/></div>,document.body)}
