// Kafin build: duk .ts/.tsx da ke tushen repo ana kwafe su cikin src/
import {readdirSync,copyFileSync,mkdirSync} from "node:fs";
mkdirSync("src",{recursive:true});
let n=0;
for(const f of readdirSync(".")){
  if(/\.(ts|tsx)$/.test(f)&&!f.endsWith(".d.ts")&&!f.startsWith("vite")){copyFileSync(f,"src/"+f);n++;}
}
console.log("sync-src: an kwafe fayiloli",n,"zuwa src/");
