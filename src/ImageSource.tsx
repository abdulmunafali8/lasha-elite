import {useState} from "react";
import {createPortal} from "react-dom";
/* Shrink big phone photos so they fit the 2 MB upload limit */
export async function shrink(f:File):Promise<File|null>{
if(!f.type.startsWith("image/"))return null;
if(f.size<=1.5*1024*1024)return f;
try{const bmp=await createImageBitmap(f);const k=Math.min(1,1600/Math.max(bmp.width,bmp.height));
const c=document.createElement("canvas");c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
c.getContext("2d")!.drawImage(bmp,0,0,c.width,c.height);
const b=await new Promise<Blob|null>(r=>c.toBlob(r,"image/jpeg",.85));
return b&&b.size<2*1024*1024?new File([b],f.name.replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"}):null}catch{return null}}

type Logo={id:string;name:string;logoUrl?:string};
const IC={camera:"M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",gallery:"M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",library:"M7 3h13v13H7zM3 7v14h14"};
const Ic=({d}:{d:string})=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
export default function ImageSource({t,library,onFile,onBad,onLibrary,onClose}:{t:Record<string,string>;library:Logo[];onFile:(f:File)=>void;onBad:()=>void;onLibrary:(id:string)=>void;onClose:()=>void}){
const [lib,setLib]=useState(false);
const got=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];e.target.value="";onClose();if(f)void shrink(f).then(g=>g?onFile(g):onBad())};
return createPortal(<div className="exscrim hi" onClick={onClose}><div className="exdlg src" onClick={e=>e.stopPropagation()}>
<h3>{t.selImg}</h3>
{!lib?<>
<label className="srcopt"><Ic d={IC.camera}/>{t.camera}<input type="file" accept="image/*" capture="environment" hidden onChange={got}/></label>
<label className="srcopt"><Ic d={IC.gallery}/>{t.gallery}<input type="file" accept="image/*" hidden onChange={got}/></label>
<button type="button" className="srcopt" onClick={()=>setLib(true)}><Ic d={IC.library}/>{t.imgLib}</button>
</>:<>
{library.length===0?<p className="muted">{t.noLogos}</p>:<div className="libgrid">{library.map(x=><button type="button" key={x.id} onClick={()=>{onLibrary(x.id);onClose()}}><img src={x.logoUrl} alt=""/><span>{x.name}</span></button>)}</div>}
<div className="exact"><button type="button" className="btn sm ghost" onClick={()=>setLib(false)}>{t.cancel}</button></div>
</>}
</div></div>,document.body)}
