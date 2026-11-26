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

/* Crop dialog (Copa Fácil style): whole image shown, with a movable + resizable crop box (grid + corner handles) */
type Box={x:number;y:number;w:number;h:number};
function Cropper({src,ar,round,onCancel,onBad,onDone}:{src:string;ar:number;round:boolean;onCancel:()=>void;onBad:()=>void;onDone:(f:File)=>void}){
const {t}=useLang();
const [img,setImg]=useState<HTMLImageElement|null>(null);const [busy,setBusy]=useState(false);const [,tick]=useState(0);
const aw=Math.min(window.innerWidth-44,640),ah=Math.round(window.innerHeight*.88)-110;
const box=useRef<Box>({x:0,y:0,w:0,h:0});const wrap=useRef<HTMLDivElement>(null);
const drag=useRef<{m:string;px:number;py:number;b:Box}|null>(null);
const d=img?Math.min(aw/img.naturalWidth,ah/img.naturalHeight):1;
const dw=img?Math.round(img.naturalWidth*d):0,dh=img?Math.round(img.naturalHeight*d):0;
useEffect(()=>{let ok=true;const i=new Image();
i.onload=()=>{if(!ok)return;const k=Math.min(aw/i.naturalWidth,ah/i.naturalHeight);const W=Math.round(i.naturalWidth*k),H=Math.round(i.naturalHeight*k);
let w=W,h=w/ar;if(h>H){h=H;w=h*ar}box.current={x:(W-w)/2,y:(H-h)/2,w,h};setImg(i)};
i.onerror=()=>{if(ok)onBad()};i.src=src;return()=>{ok=false}},[src]);
const down=(e:React.PointerEvent<HTMLDivElement>)=>{if(!img)return;const r=e.currentTarget.getBoundingClientRect();const lx=e.clientX-r.left,ly=e.clientY-r.top,Z=36;
const l=lx<Z,rt=lx>r.width-Z,tp=ly<Z,bt=ly>r.height-Z;const m=(tp||bt)&&(l||rt)?(tp?"t":"b")+(l?"l":"r"):"move";
e.currentTarget.setPointerCapture(e.pointerId);drag.current={m,px:e.clientX,py:e.clientY,b:{...box.current}}};
const move=(e:React.PointerEvent<HTMLDivElement>)=>{const g=drag.current;if(!g||!wrap.current)return;const b=g.b;
if(g.m==="move"){box.current={...b,x:Math.min(dw-b.w,Math.max(0,b.x+e.clientX-g.px)),y:Math.min(dh-b.h,Math.max(0,b.y+e.clientY-g.py))}}
else{const r=wrap.current.getBoundingClientRect();const px=e.clientX-r.left,py=e.clientY-r.top;
const right=g.m[1]==="r",bot=g.m[0]==="b";const ax=right?b.x:b.x+b.w,ay=bot?b.y:b.y+b.h;
const sx=Math.max(0,right?px-ax:ax-px),sy=Math.max(0,bot?py-ay:ay-py);
let nw=(sx+sy*ar)/2;nw=Math.min(nw,right?dw-ax:ax,(bot?dh-ay:ay)*ar);nw=Math.max(nw,Math.min(80,dw,dh*ar));const nh=nw/ar;
box.current={x:right?ax:ax-nw,y:bot?ay:ay-nh,w:nw,h:nh}}
tick(n=>n+1)};
const up=()=>{drag.current=null};
const go=()=>{if(!img||busy)return;setBusy(true);const b=box.current;const k=img.naturalWidth/dw;const ow=round?400:1600,oh=Math.round(ow/ar);
const c=document.createElement("canvas");c.width=ow;c.height=oh;const g=c.getContext("2d")!;g.imageSmoothingQuality="high";
g.drawImage(img,b.x*k,b.y*k,b.w*k,b.h*k,0,0,ow,oh);const type=round?"image/png":"image/jpeg";
const tryQ=(q:number)=>c.toBlob(bl=>{if(!bl){onBad();return}if(bl.size>=1.9*1024*1024&&q>.45){tryQ(q-.15);return}if(bl.size>=2*1024*1024){onBad();return}onDone(new File([bl],round?"logo.png":"cover.jpg",{type}))},type,q);
tryQ(.9)};
const b=box.current;
const btn:React.CSSProperties={background:"none",border:0,font:"inherit",fontWeight:700,fontSize:20,padding:"10px 8px",cursor:"pointer"};
const line:React.CSSProperties={position:"absolute",background:"#fff"};
return createPortal(<div style={{position:"fixed",inset:0,zIndex:100000,background:"rgba(0,0,0,.55)"}}>
<div role="dialog" aria-label={t.cropImg} style={{position:"absolute",left:10,right:10,top:"6vh",bottom:"5vh",maxWidth:700,margin:"0 auto",background:"#fff",color:"#111",borderRadius:28,display:"flex",flexDirection:"column"}}>
<div style={{flex:1,minHeight:0,display:"grid",placeItems:"center",overflow:"hidden"}}>
{img&&<div ref={wrap} style={{position:"relative",width:dw,height:dh,overflow:"hidden",userSelect:"none"}}>
<img src={src} alt="" draggable={false} style={{width:dw,height:dh,display:"block",pointerEvents:"none"}}/>
<div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{position:"absolute",left:b.x,top:b.y,width:b.w,height:b.h,boxSizing:"border-box",border:"2px solid #fff",boxShadow:"0 0 0 9999px rgba(255,255,255,.6)",touchAction:"none",cursor:"move"}}>
<i style={{...line,left:"33.33%",top:0,bottom:0,width:2}}/><i style={{...line,left:"66.66%",top:0,bottom:0,width:2}}/>
<i style={{...line,top:"33.33%",left:0,right:0,height:2}}/><i style={{...line,top:"66.66%",left:0,right:0,height:2}}/>
{["tl","tr","bl","br"].map(c=>{const T=c[0]==="t",L=c[1]==="l";const p:React.CSSProperties={top:T?-2:undefined,bottom:T?undefined:-2,left:L?-2:undefined,right:L?undefined:-2};
return <span key={c}><i style={{...line,...p,width:32,height:6}}/><i style={{...line,...p,width:6,height:32}}/></span>})}
</div></div>}
</div>
<div style={{display:"flex",alignItems:"center",gap:18,padding:"10px 22px 18px"}}>
<span style={{color:"#b7bcc8",display:"flex",flex:1}} aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/></svg></span>
<button type="button" style={{...btn,color:"#e53935"}} onClick={onCancel}>{t.cancel}</button>
<button type="button" style={{...btn,color:"#2196f3",opacity:img&&!busy?1:.5}} disabled={!img||busy} onClick={go}>{t.cropImg}</button>
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
