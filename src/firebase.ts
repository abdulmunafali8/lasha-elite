import {initializeApp} from "firebase/app";import {getAuth} from "firebase/auth";import {getFirestore} from "firebase/firestore";import {getStorage,ref,uploadBytes,getDownloadURL} from "firebase/storage";
const app=initializeApp({apiKey:import.meta.env.VITE_FB_API_KEY,authDomain:import.meta.env.VITE_FB_AUTH_DOMAIN,projectId:import.meta.env.VITE_FB_PROJECT_ID,appId:import.meta.env.VITE_FB_APP_ID,storageBucket:import.meta.env.VITE_FB_STORAGE_BUCKET});
export const auth=getAuth(app);export const db=getFirestore(app);const st=getStorage(app);st.maxUploadRetryTime=8000;st.maxOperationRetryTime=8000;
export const MAX_IMG=2*1024*1024;
export const imgOk=(f:File)=>f.type.startsWith("image/")&&f.size<=MAX_IMG;
/* If Cloud Storage is not set up (or its rules block the write), keep a small copy of the image inside the Firestore document instead. */
async function load(f:File):Promise<{w:number;h:number;src:CanvasImageSource}>{
try{const b=await createImageBitmap(f);return{w:b.width,h:b.height,src:b}}catch{
const u=URL.createObjectURL(f);try{const im=new Image();im.src=u;await im.decode();return{w:im.naturalWidth,h:im.naturalHeight,src:im}}catch{throw new Error("image-unreadable")}finally{setTimeout(()=>URL.revokeObjectURL(u),2000)}}}
async function inline(f:File,cover:boolean){const bmp=await load(f);const k=Math.min(1,(cover?1200:400)/Math.max(bmp.w,bmp.h));
const c=document.createElement("canvas");c.width=Math.max(1,Math.round(bmp.w*k));c.height=Math.max(1,Math.round(bmp.h*k));
c.getContext("2d")!.drawImage(bmp.src,0,0,c.width,c.height);
const d=c.toDataURL(cover?"image/jpeg":"image/webp",cover?.72:.85);if(d.length>700000)throw new Error("image-too-large");return d}
export async function uploadImg(path:string,f:File){
const viaStorage=async()=>{const r=ref(st,path);await uploadBytes(r,f,{contentType:f.type});return getDownloadURL(r)};
try{return await Promise.race([viaStorage(),new Promise<string>((_,rej)=>setTimeout(()=>rej(new Error("storage-timeout")),12000))])}
catch(e){console.warn("Storage upload failed, saving image inline",e);return inline(f,path.endsWith("/cover"))}}
