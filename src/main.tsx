import React,{useEffect,useState} from "react";import {createRoot} from "react-dom/client";
import Dashboard from "./Dashboard";import CompetitionPage from "./CompetitionPage";import Admin from "./Admin";import Notifications from "./Notifications";import Settings from "./Settings";import Auth from "./Auth";import CreateCompetition from "./CreateCompetition";import "./styles.css";
function App(){const [h,setH]=useState(location.hash);useEffect(()=>{const f=()=>setH(location.hash);addEventListener("hashchange",f);return()=>removeEventListener("hashchange",f)},[]);
const st=h.match(/^#\/competition\/([^/]+)\/settings/);if(st)return<Settings key={st[1]} id={st[1]}/>;const m=h.match(/^#\/competition\/([^/]+)/);if(h==="#/admin")return<Admin/>;if(h==="#/notifications")return<Notifications/>;if(h==="#/signin")return<Auth/>;if(h==="#/new")return<CreateCompetition/>;return m?<CompetitionPage key={m[1]} id={m[1]}/>:<Dashboard/>}
createRoot(document.getElementById("root")!).render(<App/>);
