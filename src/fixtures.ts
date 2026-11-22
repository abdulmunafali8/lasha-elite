export type Pair=[string,string];
export function roundRobin(ids:string[],double:boolean):Pair[][]{
const a:(string|null)[]=[...ids];if(a.length%2)a.push(null);const n=a.length;const rounds:Pair[][]=[];
for(let r=0;r<n-1;r++){const rd:Pair[]=[];
for(let i=0;i<n/2;i++){const h=a[i],w=a[n-1-i];if(!h||!w)continue;const flip=(i===0?r:r+i)%2===1;rd.push(flip?[w,h]:[h,w])}
rounds.push(rd);a.splice(1,0,a.pop() as string|null)}
if(double){const first=[...rounds];for(const rd of first)rounds.push(rd.map(([h,w])=>[w,h] as Pair))}
return rounds}
export function knockout(ids:string[]){
const s=[...ids];for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]]}
let size=2;while(size<s.length)size*=2;const byes=size-s.length;const rest=s.slice(byes);const pairs:Pair[]=[];
for(let i=0;i<rest.length;i+=2)pairs.push([rest[i],rest[i+1]]);
return{pairs,byes:s.slice(0,byes),size}}
export function seededSlots(ids:string[]){const n=ids.length;let size=2;while(size<n)size*=2;
let o=[1];for(let m=2;m<=size;m*=2)o=o.flatMap(x=>[x,m+1-x]);
const slots:string[][]=[];for(let k=0;k<size;k+=2){const a=o[k],b=o[k+1];slots.push(b>n?[ids[a-1]]:[ids[a-1],ids[b-1]])}
return{slots,size}}

/* League phase: every team plays k different opponents (one match per round). Tries many shuffles to avoid same-group pairings. */
export function leaguePhase(ids:string[],k:number,groupOf:(id:string)=>string,tries=300):Pair[][]{
const shuffle=(a:string[])=>{const s=[...a];for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]]}return s};
const n=new Set(ids.map(groupOf)).size>1?tries:1;let best:Pair[][]=[];let bestScore=Infinity;
for(let x=0;x<n;x++){const rr=roundRobin(shuffle(ids),false).slice(0,k);
const score=rr.reduce((s,rd)=>s+rd.filter(([h,a])=>groupOf(h)===groupOf(a)).length,0);
if(score<bestScore){best=rr;bestScore=score}if(score===0)break}
return best}
