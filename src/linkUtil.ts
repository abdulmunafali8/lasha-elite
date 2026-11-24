import {collection,getDocs,limit,query,where} from "firebase/firestore";
import {db} from "./firebase";
const AL="abcdefghjkmnpqrstuvwxyz23456789";
export const newCode=()=>{const a=new Uint8Array(6);crypto.getRandomValues(a);return Array.from(a,x=>AL[x%AL.length]).join("")};
/** Sabon gajeren code wanda babu wata gasa da ke amfani da shi. */
export async function uniqueCode():Promise<string>{
for(let i=0;i<6;i++){const c=newCode();const s=await getDocs(query(collection(db,"competitions"),where("shortCode","==",c),limit(1)));if(s.empty)return c}
throw new Error("code")}
/** Hanyar haɗin gasa: gajere idan gasar tana da code, in ba haka ba ta id. */
export const linkFor=(id:string,code?:string)=>location.origin+location.pathname+(code?"#/c/"+code:"#/competition/"+id);
