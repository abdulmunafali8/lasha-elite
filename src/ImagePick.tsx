import {useEffect,useMemo,useRef,useState,ChangeEvent} from "react";
import {createPortal} from "react-dom";
import {useLang} from "./i18n";

const Ic=({d}:{d:string})=><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const P={camera:"M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",gallery:"M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01",library:"M8 3h12v14H8zM4 7v14h12",back:"M19 12H5M12 5l-7 7 7 7"};

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

/* Crop dialog: drag to move, pinch or slider to zoom. Output is bounded (<2 MB) */
function Cropper({src,ar,round,onCancel,onBad,onDone}:{src:string;ar:number;round:boolean;onCancel:()=>void;onBad:()=>void;onDone:(f:File)=>void}){
const {t}=useLang();
const fw=Math.min(window.innerWidth-48,560),fh=Math.round(fw/ar);
const [img,setImg]=useState<HTMLImageElement|null>(null);const [z,setZ]=useState(1);const [busy,setBusy]=useState(false);
const pos=useRef({x:0,y:0,z:1});const [,tick]=useState(0);
const pts=useRef(new Map<number,{x:number;y:number}>());const box=useRef<HTMLDivElement>(null);
const minS=img?Math.max(fw/img.naturalWidth,fh/img.naturalHeight):1;
useEffect(()=>{let ok=true;const i=new Image();
i.onload=()=>{if(!ok)return;const s0=Math.max(fw/i.naturalWidth,fh/i.naturalHeight);pos.current={x:(fw-i.naturalWidth*s0)/2,y:(fh-i.naturalHeight*s0)/2,z:1};setImg(i)};
i.onerror=()=>{if(ok)onBad()};i.src=src;return()=>{ok=false}},[src]);
const put=(x:number,y:number,zz:number)=>{if(!img)return;const zc=Math.min(5,Math.max(1,zz));const s=minS*zc;const w=img.naturalWidth*s,h=img.naturalHeight*s;
pos.current={x:Math.min(0,Math.max(fw-w,x)),y:Math.min(0,Math.max(fh-h,y)),z:zc};setZ(zc);tick(n=>n+1)};
const zoomAt=(zz:number,px:number,py:number)=>{const o=pos.current;const s0=minS*o.z;const ix=(px-o.x)/s0,iy=(py-o.y)/s0;const zc=Math.min(5,Math.max(1,zz));const s1=minS*zc;put(px-ix*s1,py-iy*s1,zc)};
const down=(e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);pts.current.set(e.pointerId,{x:e.clientX,y:e.clientY})};
const move=(e:React.PointerEvent<HTMLDivElement>)=>{const m=pts.current;const a=m.get(e.pointerId);if(!a||!img)return;const n={x:e.clientX,y:e.clientY};
if(m.size===1){const o=pos.current;put(o.x+n.x-a.x,o.y+n.y-a.y,o.z)}
else if(m.size===2){const other=Array.from(m.entries()).find(([k])=>k!==e.pointerId)![1];const d0=Math.hypot(a.x-other.x,a.y-other.y)||1;const d1=Math.hypot(n.x-other.x,n.y-other.y);const r=box.current!.getBoundingClientRect();
zoomAt(pos.current.z*d1/d0,(n.x+other.x)/2-r.left,(n.y+other.y)/2-r.top)}
m.set(e.pointerId,n)};
const up=(e:React.PointerEvent<HTMLDivElement>)=>{pts.current.delete(e.pointerId)};
const go=()=>{if(!img||busy)return;setBusy(true);const o=pos.current;const s=minS*o.z;const ow=round?400:1600;const oh=Math.round(ow/ar);
const c=document.createElement("canvas");c.width=ow;c.height=oh;const g=c.getContext("2d")!;g.imageSmoothingQuality="high";
g.drawImage(img,-o.x/s,-o.y/s,fw/s,fh/s,0,0,ow,oh);const type=round?"image/png":"image/jpeg";
const tryQ=(q:number)=>c.toBlob(b=>{if(!b){onBad();return}if(b.size>=1.9*1024*1024&&q>.45){tryQ(q-.15);return}if(b.size>=2*1024*1024){onBad();return}onDone(new File([b],round?"logo.png":"cover.jpg",{type}))},type,q);
tryQ(.9)};
const btn={background:"none",border:0,font:"inherit",fontWeight:700,fontSize:17,padding:"8px 4px",cursor:"pointer"} as const;
return createPortal(<div style={{position:"fixed",inset:0,zIndex:100000,background:"rgba(0,0,0,.7)",display:"grid",placeItems:"center",padding:16}}>
<div role="dialog" aria-label={t.cropImg} style={{background:"#fff",color:"#111",borderRadius:24,padding:16,width:fw+32,maxWidth:"100%"}}>
<div ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{width:fw,height:fh,margin:"0 auto",overflow:"hidden",position:"relative",touchAction:"none",background:"#e5e7eb",borderRadius:round?"50%":8,cursor:"grab"}}>
{img&&<img src={src} alt="" draggable={false} style={{position:"absolute",left:0,top:0,maxWidth:"none",width:img.naturalWidth,height:img.naturalHeight,transformOrigin:"0 0",transform:`translate(${pos.current.x}px,${pos.current.y}px) scale(${minS*pos.current.z})`,userSelect:"none",pointerEvents:"none"}}/>}
</div>
<input type="range" min={1} max={5} step={0.01} value={z} disabled={!img} onChange={e=>zoomAt(+e.target.value,fw/2,fh/2)} style={{width:"100%",margin:"16px 0 8px"}}/>
<div style={{display:"flex",justifyContent:"flex-end",gap:24}}>
<button type="button" style={{...btn,color:"#e53935"}} onClick={onCancel}>{t.cancel}</button>
<button type="button" style={{...btn,color:"#1e88e5",opacity:img&&!busy?1:.5}} disabled={!img||busy} onClick={go}>{t.cropImg}</button>
</div></div></div>,document.body)}

export default function ImagePick({label,hint,file,onFile,onErr,current,round}:{label:string;hint:string;file:File|null;onFile:(f:File|null)=>void;onErr:(s:string)=>void;current?:string;round?:boolean}){
const {t}=useLang();
const [url,setUrl]=useState<string|undefined>(current);const [open,setOpen]=useState(false);const [lib,setLib]=useState(false);
const [crop,setCrop]=useState<string|null>(null);
const cam=useRef<HTMLInputElement>(null);const gal=useRef<HTMLInputElement>(null);
useEffect(()=>{if(!file){setUrl(current);return}const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u)},[file,current]);
const n=round?PAL.length:COV.length;
const thumbs=useMemo(()=>lib?Array.from({length:n},(_,i)=>(round?drawLogo(i,120):drawCover(i,360)).toDataURL("image/png")):[],[lib,round,n]);
const done=()=>{setOpen(false);setLib(false)};
const pick=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;
if(!f.type.startsWith("image/")){onErr("imgBad");return}setCrop(URL.createObjectURL(f))};
const pickLib=(i:number)=>(round?drawLogo(i,400):drawCover(i,1200)).toBlob(b=>{if(b){onFile(new File([b],"library.png",{type:"image/png"}));done()}},"image/png");
return(<>
<button type="button" className={"ipick"+(round?" r":"")} aria-label={label} style={url?{backgroundImage:`url(${url})`}:undefined} onClick={()=>setOpen(true)}>{!url&&<span>＋<br/>{label}<br/><small>{hint}</small></span>}</button>
<input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={pick}/>
<input ref={gal} type="file" accept="image/*" hidden onChange={pick}/>
{crop&&<Cropper src={crop} ar={round?1:3} round={!!round} onCancel={()=>{URL.revokeObjectURL(crop);setCrop(null);done()}} onBad={()=>{URL.revokeObjectURL(crop);setCrop(null);onErr("imgBad")}} onDone={f=>{URL.revokeObjectURL(crop);setCrop(null);done();onFile(f)}}/>}
{open&&createPortal(<div className="idlg-wrap" onClick={done}><div className="idlg" role="dialog" aria-label={t.selImg} onClick={e=>e.stopPropagation()}>
{!lib?<><h3>{t.selImg}</h3>
<button type="button" className="irow" onClick={()=>cam.current?.click()}><Ic d={P.camera}/><span>{t.camera}</span></button>
<button type="button" className="irow" onClick={()=>gal.current?.click()}><Ic d={P.gallery}/><span>{t.gallery}</span></button>
<button type="button" className="irow" onClick={()=>setLib(true)}><Ic d={P.library}/><span>{t.imgLib}</span></button></>
:<><div className="ihead"><button type="button" className="irow" aria-label="Back" onClick={()=>setLib(false)}><Ic d={P.back}/></button><h3>{t.imgLib}</h3></div>
<div className={"igrid"+(round?"":" wide")}>{thumbs.map((u,i)=><button key={i} type="button" className={"ith"+(round?" r":" wide")} onClick={()=>pickLib(i)}><img src={u} alt=""/></button>)}</div></>}
</div></div>,document.body)}
</>)}
