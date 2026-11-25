import "./sheetStyles";
import {SUPPORT} from "./support";
const go=(n:number)=>document.getElementById("tm"+n)?.scrollIntoView({behavior:"smooth",block:"start"});
export default function LegalDoc({title,version,updated,sections}:{title:string;version:string;updated:string;sections:[string,string[]][]}){
return<div className="tm">
<header className="tm-hd"><a className="tm-back" href="#/" aria-label="Back">←</a><h1>{title}</h1><p>Version {version} · Last updated: {updated}</p></header>
<nav className="tm-card tm-toc" aria-label="Contents"><h2>In this document</h2>
{sections.map(([t],i)=><button type="button" key={t} onClick={()=>go(i+1)}><b>{String(i+1).padStart(2,"0")}</b><span>{t}</span></button>)}</nav>
{sections.map(([t,ps],i)=><section className="tm-card tm-sec" id={"tm"+(i+1)} key={t}><h3><b>{String(i+1).padStart(2,"0")}</b>{t}</h3>
{ps.map((p,k)=><p key={k}>{p}</p>)}
{i===sections.length-1&&<>{SUPPORT.email&&<p>Email: <a href={"mailto:"+SUPPORT.email}>{SUPPORT.email}</a></p>}{SUPPORT.whatsapp&&<p>WhatsApp: <a href={"https://wa.me/"+SUPPORT.whatsapp.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer">{SUPPORT.whatsapp}</a></p>}{SUPPORT.telegram&&<p>Telegram: <a href={SUPPORT.telegram} target="_blank" rel="noopener noreferrer">{SUPPORT.telegram}</a></p>}</>}
</section>)}
<p className="tm-foot">Lasha Elite League Manager · v{version}</p>
</div>}
