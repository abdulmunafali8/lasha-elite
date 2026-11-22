import {useState} from "react";
import {collection,doc,writeBatch,serverTimestamp} from "firebase/firestore";
import {db} from "./firebase";import {Player,Match,Stage} from "./types";import {roundRobin,knockout,seededSlots,leaguePhase,Pair} from "./fixtures";import {standings} from "./standings";
function shuffle<T>(a:T[]):T[]{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
export default function Generate({cid,stageId,players,hasMatches,allMatches,stages,groups,t,onDone,onErr}:{cid:string;stageId:string;players:Player[];hasMatches:boolean;allMatches:Match[];stages:Stage[];groups:{id:string}[];t:Record<string,string>;onDone:()=>void;onErr:(s:string)=>void}){
const [fmt,setFmt]=useState("single");const [src,setSrc]=useState("");const [topN,setTopN]=useState(2);const [perTeam,setPerTeam]=useState(8);const [qual,setQual]=useState(16);const [busy,setBusy]=useState(false);const [err,setErr]=useState("");
const fail=(m:string)=>{setErr(m);onErr(m)};const codeOf=(x:unknown)=>((x as {code?:string}).code)||(x as Error).message;
const fields=(by:Map<string,Player>,h:string,a:string)=>{const H=by.get(h)!,A=by.get(a)!;return{homeId:h,awayId:a,homeName:H.name,awayName:A.name,homeLogo:H.logoUrl??null,awayLogo:A.logoUrl??null}};
const goKO=async(slots:string[][],size:number,by:Map<string,Player>,seedOf?:Map<string,number>,first?:{name:string;compact?:boolean})=>{const R=Math.log2(size);
const nm=(r:number)=>{const n=size/2**(r-1);return n===2?t.final:n===4?t.sf:n===8?t.qf:n===16?t.ro16:`${t.round} ${r}`};
if(!confirm(t.genConfirm))return;const b=writeBatch(db);const mc=(id:string)=>doc(db,"competitions",cid,"matches",id);setBusy(true);
try{for(let r=1;r<=R;r++)b.set(doc(db,"competitions",cid,"rounds",`${stageId}_r${r}`),{stageId,name:r===1&&first?first.name:nm(r),order:r,ko:true,...(r===1&&first?.compact?{compact:true}:{})});
const common={competitionId:cid,stageId,ko:true,total:R,status:"upcoming",date:null,createdAt:serverTimestamp()};
slots.forEach((sl,s)=>{if(sl.length===2)b.set(mc(`${stageId}_r1_s${s}`),{...common,...fields(by,sl[0],sl[1]),...(seedOf?{homeSeed:seedOf.get(sl[0])??null,awaySeed:seedOf.get(sl[1])??null}:{}),roundId:`${stageId}_r1`,slot:s,rIdx:1},{merge:true});
else if(R>=2){const P=by.get(sl[0])!,sd=s%2===0?"home":"away";b.set(mc(`${stageId}_r2_s${s>>1}`),{...common,roundId:`${stageId}_r2`,slot:s>>1,rIdx:2,[sd+"Id"]:P.id,[sd+"Name"]:P.name,[sd+"Logo"]:P.logoUrl??null},{merge:true})}});
await b.commit();onDone()}catch(x){fail(t.err+" ("+codeOf(x)+")");setBusy(false)}};
const goSeed=(by:Map<string,Player>)=>{const sm=allMatches.filter(m=>m.stageId===src);if(!src||!sm.length)return fail(t.noSrc);if(sm.some(m=>m.status!=="done"))return fail(t.notDone);
const gl=groups.length?groups.map(g=>g.id):[""];
const tops=gl.map(g=>standings(players.filter(p=>(p.groupId??"")===g),sm.filter(m=>(m.groupId??"")===g)).slice(0,topN).map(r=>r.id));
const seeds:string[]=[];for(let r=0;r<topN;r++)for(const tp of tops)if(tp[r])seeds.push(tp[r]);
if(seeds.length<2)return fail(t.needPlayers);const q=seededSlots(seeds);return goKO(q.slots,q.size,by,new Map(seeds.map((x,i)=>[x,i+1])))};
const goSeedAll=(by:Map<string,Player>)=>{const sm=allMatches.filter(m=>m.stageId===src);if(!src||!sm.length)return fail(t.noSrc);if(sm.some(m=>m.status!=="done"))return fail(t.notDone);
const ids=standings(players,sm).slice(0,Math.min(qual,players.length)).map(r=>r.id);if(ids.length<2)return fail(t.needPlayers);const q=seededSlots(ids);return goKO(q.slots,q.size,by,new Map(ids.map((x,i)=>[x,i+1])))};
/* Champions League format: 1-8 straight to Round of 16, 9-24 play-off (9-16 seeded v 17-24), 25+ out */
const goUcl=(by:Map<string,Player>)=>{const sm=allMatches.filter(m=>m.stageId===src);if(!src||!sm.length)return fail(t.noSrc);if(sm.some(m=>m.status!=="done"))return fail(t.notDone);
const r=standings(players,sm).map(x=>x.id);if(r.length<24)return fail(t.uclNeed);
const pg:[number[],number[],number[]][]=[[[14,15],[16,17],[0,1]],[[12,13],[18,19],[2,3]],[[10,11],[20,21],[4,5]],[[8,9],[22,23],[6,7]]];
const tie:string[][]=[];for(const [sd,un,tp] of pg){const u=shuffle(un),to=shuffle(tp);tie[to[0]]=[r[sd[0]],r[u[0]]];tie[to[1]]=[r[sd[1]],r[u[1]]]}
const slots:string[][]=[];for(const k of [0,6,2,4,1,7,3,5]){slots.push([r[k]]);slots.push(tie[k])}
return goKO(slots,32,by,new Map(r.slice(0,24).map((x,i)=>[x,i+1])),{name:t.playoff,compact:true})};
const commit=async(rounds:{name:string;pairs:[string,string,string][]}[],by:Map<string,Player>)=>{
const ops:[ReturnType<typeof doc>,Record<string,unknown>][]=[];
rounds.forEach((r,i)=>{const rr=doc(collection(db,"competitions",cid,"rounds"));ops.push([rr,{stageId,name:r.name,order:i+1}]);
for(const [h,a,g] of r.pairs){const H=by.get(h)!,A=by.get(a)!;ops.push([doc(collection(db,"competitions",cid,"matches")),{competitionId:cid,stageId,roundId:rr.id,groupId:g||null,homeId:h,awayId:a,homeName:H.name,awayName:A.name,homeLogo:H.logoUrl??null,awayLogo:A.logoUrl??null,status:"upcoming",date:null,createdAt:serverTimestamp()}])}});
if(ops.length>2000)return fail(t.tooMany);
if(!confirm(t.genConfirm))return;
setBusy(true);
try{for(let i=0;i<ops.length;i+=450){const b=writeBatch(db);ops.slice(i,i+450).forEach(([ref,d])=>b.set(ref,d));await b.commit()}onDone()}catch(x){fail(t.err+" ("+codeOf(x)+")");setBusy(false)}};
const go=async()=>{setErr("");
if(players.length<2)return fail(t.needPlayers);if(hasMatches)return fail(t.hasMatches);
const ids=players.map(p=>p.id);const by=new Map(players.map(p=>[p.id,p]));
if(fmt==="ko"){const k=knockout(ids);return goKO([...k.byes.map(x=>[x]),...k.pairs],k.size,by)}
if(fmt==="seed")return goSeed(by);if(fmt==="seedAll")return goSeedAll(by);if(fmt==="ucl")return goUcl(by);
if(fmt==="league"){const maxR=ids.length%2?ids.length:ids.length-1;if(perTeam<1||perTeam>maxR)return fail(t.leagueMax+" "+maxR);
return commit(leaguePhase(ids,perTeam,id=>by.get(id)?.groupId??"").map((r,i)=>({name:`${t.round} ${i+1}`,pairs:r.map(([h,a])=>[h,a,""] as [string,string,string])})),by)}
const gm=new Map<string,string[]>();players.forEach(p=>gm.set(p.groupId??"",[...(gm.get(p.groupId??"")??[]),p.id]));
if((gm.size>1||groups.length>0)&&gm.has(""))return fail(t.needGroups+" ("+(gm.get("")?.length??0)+" / "+players.length+")");const small=[...gm.values()].filter(v=>v.length<2).length;if(small)return fail(t.needPlayers+" ("+small+")");
const per=[...gm.entries()].map(([g,v])=>({g,r:roundRobin(v,fmt==="double")}));
const rounds=Array.from({length:Math.max(...per.map(x=>x.r.length))},(_,i)=>({name:`${t.round} ${i+1}`,pairs:per.flatMap(x=>(x.r[i]??[]).map(([h,a])=>[h,a,x.g] as [string,string,string]))}));
return commit(rounds,by)};
return(<div className="form"><label>{t.format}<select value={fmt} onChange={e=>setFmt(e.target.value)}><option value="single">{t.fSingle}</option><option value="double">{t.fDouble}</option><option value="ko">{t.fKO}</option><option value="seed">{t.fSeed}</option><option value="league">{t.fLeague}</option><option value="seedAll">{t.fSeedAll}</option><option value="ucl">{t.fUcl}</option></select></label>
{fmt==="seed"&&<><label>{t.srcStage}<select value={src} onChange={e=>setSrc(e.target.value)}><option value=""/>{stages.filter(x=>x.id!==stageId).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>{t.topN}<input type="number" min={1} max={8} value={topN} onChange={e=>setTopN(Math.min(8,Math.max(1,Number(e.target.value)||1)))}/></label></>}
{fmt==="league"&&<label>{t.perTeam}<input type="number" min={1} max={40} value={perTeam} onChange={e=>setPerTeam(Math.min(40,Math.max(1,Number(e.target.value)||1)))}/></label>}
{(fmt==="seedAll"||fmt==="ucl")&&<label>{t.srcStage}<select value={src} onChange={e=>setSrc(e.target.value)}><option value=""/>{stages.filter(x=>x.id!==stageId).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
{fmt==="seedAll"&&<label>{t.qualN}<select value={qual} onChange={e=>setQual(Number(e.target.value))}>{[2,4,8,16,32].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
{fmt==="ucl"&&<p className="muted">{t.uclHint}</p>}
{err&&<p className="toast" role="alert">{err}</p>}<div className="acts"><button className="btn sm" disabled={busy} onClick={go}>{busy?t.saving:t.gen}</button><button className="btn sm ghost" onClick={onDone}>{t.cancel}</button></div></div>)}
