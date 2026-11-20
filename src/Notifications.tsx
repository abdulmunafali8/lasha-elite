import {useEffect,useMemo} from "react";
import {collection,query,orderBy,limit} from "firebase/firestore";
import {db} from "./firebase";import {useLang} from "./i18n";import {useLive} from "./hooks";
export default function Notifications(){
const {t}=useLang();useEffect(()=>{try{localStorage.setItem("seenN",String(Date.now()))}catch{}},[]);const r=useLive<{id:string;title:string;body:string;createdAt?:{toMillis():number}}>(useMemo(()=>query(collection(db,"notifications"),orderBy("createdAt","desc"),limit(30)),[]));
return(<div className="app"><header className="ch"><div className="chr"><a className="ib" href="#/">←</a><h1>{t.notifs}</h1></div></header><div className="pad">
{r.loading?<p className="muted">{t.loading}</p>:r.err?<p className="muted">{t.err}</p>:r.d.length===0?<p className="muted">{t.none}</p>:r.d.map(n=><div key={n.id} className="prow"><div className="grow"><b>{n.title}</b><p className="muted">{n.body}</p>{n.createdAt&&<p className="muted">{new Date(n.createdAt.toMillis()).toLocaleString()}</p>}</div></div>)}</div></div>)}
