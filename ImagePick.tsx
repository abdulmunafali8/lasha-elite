import {useEffect,useMemo,useRef,useState,ChangeEvent} from "react";
import {createPortal} from "react-dom";
import {useLang} from "./i18n";

const Ic=({d}:{d:string})=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const P={camera:"M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",gallery:"M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01",library:"M8 3h12v14H8zM4 7v14h12",back:"M19 12H5M12 5l-7 7 7 7"};

/* Shrink big phone photos so they fit the 2 MB upload limit */
async function shrink(f:File):Promise<File|null>{
if(f.size<=1.5*1024*1024)return f;
try{const bmp=await createImageBitmap(f);const k=Math.min(1,1600/Math.max(bmp.width,bmp.height));
const c=document.createElement("canvas");c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
c.getContext("2d")!.drawImage(bmp,0,0,c.width,c.height);
const b=await new Promise<Blob|null>(r=>c.toBlob(r,"image/jpeg",.85));
return b&&b.size<2*1024*1024?new File([b],f.name.replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"}):null}catch{return null}}

/* Built-in image library (drawn on a canvas, no external files) */
const PAL:[string,string][]=[["#10224d","#f2c14e"],["#b3261e","#ffffff"],["#16a34a","#ffffff"],["#2a4a8f","#ffffff"],["#111827","#f2c14e"],["#7c3aed","#ffffff"],["#ea580c","#ffffff"],["#0891b2","#ffffff"],["#be185d","#ffffff"],["#ca8a04","#111827"],["#475569","#ffffff"],["#0f766e","#f2c14e"]];
const COV:[string,string][]=[["#0b3d2e","#16a34a"],["#10224d","#2a4a8f"],["#3b0764","#7c3aed"],["#7f1d1d","#dc2626"],["#042f2e","#0891b2"],["#1f2937","#6b7280"],["#78350f","#ca8a04"],["#14532d","#65a30d"]];
function star(c:CanvasRenderingContext2D,x:number,y:number,r:number){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath();c.fill()}
function drawLogo(i:number,s:number){const cv=document.createElement("canvas");cv.width=cv.height=s;const c=cv.getContext("2d")!;const [a,b]=PAL[i%PAL.length];c.scale(s/400,s/400);
c.fillStyle=a;c.fillRect(0,0,400,400);const m=i%3;
if(m===1){c.fillStyle="rgba(255,255,255,.14)";for(let x=0;x<400;x+=80)c.fillRect(x,0,40,400)}
if(m===2){c.fillStyle="rgba(255,255,255,.14)";c.beginPath();c.moveTo(0,0);c.lineTo(400,0);c.lineTo(0,400);c.closePath();c.fill()}
c.strokeStyle=b;c.lineWidth=14;c.beginPath();c.arc(200,200,150,0,Math.PI*2);c.stroke();
c.fillStyle=b;star(c,200,206,95);return cv}
function drawCover(i:number,w:number){const h=Math.round(w/3);const cv=document.createElement("canvas");cv.width=w;cv.height=h;const c=cv.getContext("2d")!;const [a,b]=COV[i%COV.length];
const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.fillRect(0,0,w,h);
c.fillStyle="rgba(255,255,255,.07)";for(let x=-h;x<w;x+=h/2){c.beginPath();c.moveTo(x,h);c.lineTo(x+h/4,h);c.lineTo(x+h/4+h,0);c.lineTo(x+h,0);c.closePath();c.fill()}
c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=Math.max(2,w/300);c.beginPath();c.arc(w/2,h/2,h*.3,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.stroke();return cv}

export default function ImagePick({label,hint,file,onFile,onErr,current,round}:{label:string;hint:string;file:File|null;onFile:(f:File|null)=>void;onErr:(s:string)=>void;current?:string;round?:boolean}){
const {t}=useLang();
const [url,setUrl]=useState<string|undefined>(current);const [open,setOpen]=useState(false);const [lib,setLib]=useState(false);
const cam=useRef<HTMLInputElement>(null);const gal=useRef<HTMLInputElement>(null);
useEffect(()=>{if(!file){setUrl(current);return}const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u)},[file,current]);
const n=round?PAL.length:COV.length;
const thumbs=useMemo(()=>lib?Array.from({length:n},(_,i)=>(round?drawLogo(i,120):drawCover(i,360)).toDataURL("image/png")):[],[lib,round,n]);
const done=()=>{setOpen(false);setLib(false)};
const pick=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;
if(!f.type.startsWith("image/")){onErr("imgBad");return}const g=await shrink(f);if(!g){onErr("imgBad");return}done();onFile(g)};
const pickLib=(i:number)=>(round?drawLogo(i,400):drawCover(i,1200)).toBlob(b=>{if(b){onFile(new File([b],"library.png",{type:"image/png"}));done()}},"image/png");
return(<>
<button type="button" className={"ipick"+(round?" r":"")} aria-label={label} style={url?{backgroundImage:`url(${url})`}:undefined} onClick={()=>setOpen(true)}>{!url&&<span>＋<br/>{label}<br/><small>{hint}</small></span>}</button>
<input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={pick}/>
<input ref={gal} type="file" accept="image/*" hidden onChange={pick}/>
{open&&createPortal(<div className="idlg-wrap" onClick={done}><div className="idlg" role="dialog" aria-label={t.selImg} onClick={e=>e.stopPropagation()}>
{!lib?<><h3>{t.selImg}</h3>
<button type="button" className="irow" onClick={()=>cam.current?.click()}><Ic d={P.camera}/><span>{t.camera}</span></button>
<button type="button" className="irow" onClick={()=>gal.current?.click()}><Ic d={P.gallery}/><span>{t.gallery}</span></button>
<button type="button" className="irow" onClick={()=>setLib(true)}><Ic d={P.library}/><span>{t.imgLib}</span></button></>
:<><div className="ihead"><button type="button" className="irow" aria-label="Back" onClick={()=>setLib(false)}><Ic d={P.back}/></button><h3>{t.imgLib}</h3></div>
<div className={"igrid"+(round?"":" wide")}>{thumbs.map((u,i)=><button key={i} type="button" className={"ith"+(round?" r":" wide")} onClick={()=>pickLib(i)}><img src={u} alt=""/></button>)}</div></>}
</div></div>,document.body)}
</>)}
