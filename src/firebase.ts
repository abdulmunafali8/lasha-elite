import {initializeApp} from "firebase/app";import {getAuth} from "firebase/auth";import {getFirestore} from "firebase/firestore";import {getStorage,ref,uploadBytes,getDownloadURL} from "firebase/storage";
const app=initializeApp({apiKey:import.meta.env.VITE_FB_API_KEY,authDomain:import.meta.env.VITE_FB_AUTH_DOMAIN,projectId:import.meta.env.VITE_FB_PROJECT_ID,appId:import.meta.env.VITE_FB_APP_ID,storageBucket:import.meta.env.VITE_FB_STORAGE_BUCKET});
export const auth=getAuth(app);export const db=getFirestore(app);const st=getStorage(app);
export const MAX_IMG=2*1024*1024;
export const imgOk=(f:File)=>f.type.startsWith("image/")&&f.size<=MAX_IMG;
export async function uploadImg(path:string,f:File){const r=ref(st,path);await uploadBytes(r,f,{contentType:f.type});return getDownloadURL(r)}
