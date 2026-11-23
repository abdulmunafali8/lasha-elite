import {Round,Match} from "./types";
export default function Bracket({rounds,matches,t}:{rounds:Round[];matches:Match[];t:Record<string,string>}){
const ko=rounds.filter(r=>r.ko);const R=ko.length;const fin=matches.find(m=>m.ko&&m.rIdx===R&&m.status==="done");
const third=matches.find(x=>x.third);const champ=fin?((fin.homeScore??0)>(fin.awayScore??0)?fin.homeName:fin.awayName):"";
return(<div><div className="bk">{ko.map((r,i)=><div key={r.id} className="bkc"><h4>{r.name}</h4><div className="bkl">
{((r as Round&{compact?:boolean}).compact?matches.filter(x=>x.roundId===r.id).map(x=>x.slot??0).sort((p,q)=>p-q):Array.from({length:2**(R-1-i)},(_,s)=>s)).map(s=>{const m=matches.find(x=>x.roundId===r.id&&x.slot===s);const d=m?.status==="done";
const row=(n?:string,sc?:number,o?:number)=><div className={"bkr"+(d&&(sc??0)>(o??0)?" w":"")}><span>{n||t.tbd}</span><b>{d?sc:""}</b></div>;
return<div key={s} className="bkm">{row(m?.homeName,m?.homeScore,m?.awayScore)}{row(m?.awayName,m?.awayScore,m?.homeScore)}</div>})}</div></div>)}</div>
{third&&<p className="muted ctr">🥉 {t.third}: {third.homeName||t.tbd} {third.status==="done"?`${third.homeScore} : ${third.awayScore}`:"vs"} {third.awayName||t.tbd}</p>}{champ&&<p className="champ">🏆 {t.champ}: {champ}</p>}</div>)}
