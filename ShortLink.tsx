import {useEffect,useState} from "react";
import {collection,getDocs,limit,query,where} from "firebase/firestore";
import {db} from "./firebase";import {useLang} from "./i18n";
export default function ShortLink({code}:{code:string}){
const {t}=useLang();const [nf,setNf]=useState(false);
useEffect(()=>{let live=true;
getDocs(query(collection(db,"competitions"),where("shortCode","==",code),limit(1))).then(s=>{if(!live)return;if(s.empty)setNf(true);else location.replace("#/competition/"+s.docs[0].id)}).catch(()=>{if(live)setNf(true)});
return()=>{live=false}},[code]);
return<div className="app"><div className="pad"><p className="muted">{nf?t.linkBad:t.loading}</p>{nf&&<a className="btn" href="#/">{t.home}</a>}</div></div>}
