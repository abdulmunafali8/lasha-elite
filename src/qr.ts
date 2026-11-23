// Ƙaramin QR encoder (byte mode, ECC level M, versions 1-10) — babu dogaro da wani package.
const T:number[][]=[[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],[16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]];
const ALIGN:number[][]=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
const exp:number[]=[],log:number[]=[];
(()=>{let x=1;for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x<<=1;if(x&256)x^=0x11d}for(let i=255;i<512;i++)exp[i]=exp[i-255]})();
const mul=(a:number,b:number)=>a&&b?exp[log[a]+log[b]]:0;
function gen(n:number){let g=[1];for(let i=0;i<n;i++){const h=new Array(g.length+1).fill(0);for(let j=0;j<g.length;j++){h[j]^=g[j];h[j+1]^=mul(g[j],exp[i])}g=h}return g}
function rs(data:number[],n:number){const g=gen(n);const r=new Array(n).fill(0);for(const b of data){const f=b^r.shift()!;r.push(0);for(let i=0;i<n;i++)r[i]^=mul(g[i+1],f)}return r}
const bit=(v:number,i:number)=>((v>>>i)&1)!==0;
export function qrMatrix(text:string):boolean[][]{
const bytes=Array.from(new TextEncoder().encode(text));
let ver=0;for(let v=1;v<=10;v++){const [,na,da,nb,db]=T[v-1];const cap=na*da+nb*db;const cc=v<10?8:16;if(4+cc+bytes.length*8<=cap*8){ver=v;break}}
if(!ver)throw new Error("QR: text too long");
const [ecn,na,da,nb,db]=T[ver-1];const total=na*da+nb*db;const cc=ver<10?8:16;
const bits:number[]=[];const put=(v:number,n:number)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1)};
put(4,4);put(bytes.length,cc);for(const b of bytes)put(b,8);
for(let i=0;i<4&&bits.length<total*8;i++)bits.push(0);while(bits.length%8)bits.push(0);
const cw:number[]=[];for(let i=0;i<bits.length;i+=8){let v=0;for(let j=0;j<8;j++)v=v<<1|bits[i+j];cw.push(v)}
for(let p=0xec;cw.length<total;p^=0xec^0x11)cw.push(p);
const blocks:number[][]=[];let o=0;for(let i=0;i<na+nb;i++){const l=i<na?da:db;blocks.push(cw.slice(o,o+l));o+=l}
const ecs=blocks.map(b=>rs(b,ecn));const fin:number[]=[];
for(let i=0;i<Math.max(da,db);i++)for(const b of blocks)if(i<b.length)fin.push(b[i]);
for(let i=0;i<ecn;i++)for(const e of ecs)fin.push(e[i]);
const size=17+4*ver;const m:boolean[][]=Array.from({length:size},()=>new Array(size).fill(false));const fn:boolean[][]=Array.from({length:size},()=>new Array(size).fill(false));
const set=(x:number,y:number,d:boolean)=>{m[y][x]=d;fn[y][x]=true};
for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
const finder=(x:number,y:number)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)set(xx,yy,d!==2&&d!==4)}};
finder(3,3);finder(size-4,3);finder(3,size-4);
const ap=ALIGN[ver-1];for(let i=0;i<ap.length;i++)for(let j=0;j<ap.length;j++){if((i===0&&j===0)||(i===0&&j===ap.length-1)||(i===ap.length-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
const fmt=(mask:number)=>{const d0=mask;let r=d0;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const d=((d0<<10)|r)^0x5412;
for(let i=0;i<=5;i++)set(8,i,bit(d,i));set(8,7,bit(d,6));set(8,8,bit(d,7));set(7,8,bit(d,8));for(let i=9;i<15;i++)set(14-i,8,bit(d,i));
for(let i=0;i<8;i++)set(size-1-i,8,bit(d,i));for(let i=8;i<15;i++)set(8,size-15+i,bit(d,i));set(8,size-8,true)};
fmt(0);
if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1f25);const d=(ver<<12)|r;for(let i=0;i<18;i++){const a=size-11+i%3,b=Math.floor(i/3);set(a,b,bit(d,i));set(b,a,bit(d,i))}}
let k=0;const all=fin.length*8;
for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<size;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-v:v;if(!fn[y][x]&&k<all){m[y][x]=bit(fin[k>>>3],7-(k&7));k++}}}
const cond=(mk:number,x:number,y:number)=>{switch(mk){case 0:return(x+y)%2===0;case 1:return y%2===0;case 2:return x%3===0;case 3:return(x+y)%3===0;case 4:return(Math.floor(x/3)+Math.floor(y/2))%2===0;case 5:return x*y%2+x*y%3===0;case 6:return(x*y%2+x*y%3)%2===0;default:return((x+y)%2+x*y%3)%2===0}};
const mask=(mk:number)=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!fn[y][x]&&cond(mk,x,y))m[y][x]=!m[y][x]};
const pen=()=>{let s=0;for(let pass=0;pass<2;pass++)for(let a=0;a<size;a++){let run=1;for(let b=1;b<size;b++){const c=pass?m[b][a]:m[a][b],p=pass?m[b-1][a]:m[a][b-1];if(c===p){run++;if(run===5)s+=3;else if(run>5)s++}else run=1}}
for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=m[y][x];if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])s+=3}
let dark=0;for(const r of m)for(const c of r)if(c)dark++;s+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;return s};
let best=0,bp=Infinity;for(let mk=0;mk<8;mk++){mask(mk);fmt(mk);const p=pen();if(p<bp){bp=p;best=mk}mask(mk)}
mask(best);fmt(best);return m}
