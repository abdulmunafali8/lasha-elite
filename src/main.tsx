import React,{useEffect,useState} from "react";import {createRoot} from "react-dom/client";
import Dashboard from "./Dashboard";import CompetitionPage from "./CompetitionPage";import Admin from "./Admin";import Notifications from "./Notifications";import Settings from "./Settings";import Auth from "./Auth";import CreateCompetition from "./CreateCompetition";import MyTournaments from "./MyTournaments";import ShortLink from "./ShortLink";import Terms from "./Terms";import "./styles.css";

class Boundary extends React.Component<{children:React.ReactNode},{err:Error|null}>{
state:{err:Error|null}={err:null};
static getDerivedStateFromError(err:Error){return{err}}
componentDidCatch(err:Error,info:React.ErrorInfo){console.error(err,info.componentStack)}
render(){const e=this.state.err;if(!e)return this.props.children;
const stack=(e.stack??"").split("\n").slice(0,6).join("\n");
return(<div className="app"><div className="pad"><h2>Kuskure ya faru</h2><p className="muted">Ku ɗauki hoton wannan shafin ku turo.</p>
<p className="toast" role="alert"><b>{e.name}: {e.message}</b></p>
<pre style={{whiteSpace:"pre-wrap",fontSize:".75rem",overflowWrap:"anywhere"}}>{stack}</pre>
<a className="btn" href="#/" onClick={()=>setTimeout(()=>location.reload(),50)}>Koma gida</a></div></div>)}}

function Banner(){const [m,setM]=useState("");
useEffect(()=>{const f=(e:ErrorEvent)=>{if(!/ResizeObserver/.test(e.message))setM(e.message)};
const g=(e:PromiseRejectionEvent)=>setM(String((e.reason as {message?:string})?.message??e.reason));
addEventListener("error",f);addEventListener("unhandledrejection",g);
return()=>{removeEventListener("error",f);removeEventListener("unhandledrejection",g)}},[]);
return m?<p className="toast" role="alert" onClick={()=>setM("")}>{m}</p>:null}

function route(h:string){
const sl=h.match(/^#\/c\/([A-Za-z0-9]+)$/);if(sl)return<ShortLink key={sl[1]} code={sl[1].toLowerCase()}/>;
const st=h.match(/^#\/competition\/([^/]+)\/settings/);if(st)return<Settings key={st[1]} id={st[1]}/>;
const m=h.match(/^#\/competition\/([^/]+)/);
if(h==="#/admin")return<Admin/>;if(h==="#/notifications")return<Notifications/>;if(h==="#/signin")return<Auth/>;if(h==="#/terms")return<Terms/>;if(h==="#/new")return<CreateCompetition/>;if(h==="#/organize")return<MyTournaments/>;
return m?<CompetitionPage key={m[1]} id={m[1]}/>:<Dashboard/>}

function App(){const [h,setH]=useState(location.hash);
useEffect(()=>{const f=()=>setH(location.hash);addEventListener("hashchange",f);return()=>removeEventListener("hashchange",f)},[]);
return<Boundary key={h}><Banner/>{route(h)}</Boundary>}
createRoot(document.getElementById("root")!).render(<App/>);
