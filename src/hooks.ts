import {useEffect,useState} from "react";import {onSnapshot,Query} from "firebase/firestore";
export function useLive<T>(q:Query|null){const [d,setD]=useState<T[]>([]);const [loading,setL]=useState(!!q);const [err,setE]=useState(false);
useEffect(()=>{if(!q){setD([]);setL(false);return}setL(true);return onSnapshot(q,s=>{setD(s.docs.map(x=>({id:x.id,...x.data()}) as T));setL(false);setE(false)},()=>{setE(true);setL(false)})},[q]);
return{d,loading,err}}
