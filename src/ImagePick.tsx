import {useEffect,useState} from "react";
export default function ImagePick({label,hint,file,onFile,onErr,current,round}:{label:string;hint:string;file:File|null;onFile:(f:File|null)=>void;onErr:(s:string)=>void;current?:string;round?:boolean}){
const [url,setUrl]=useState<string|undefined>(current);
useEffect(()=>{if(!file){setUrl(current);return}const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u)},[file,current]);
return(<label className={"ipick"+(round?" r":"")} style={url?{backgroundImage:`url(${url})`}:undefined}>{!url&&<span>＋<br/>{label}<br/><small>{hint}</small></span>}
<input type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")||f.size>2*1024*1024){onErr("imgBad");return}onFile(f)}}/></label>)}
