// Salon sabbin abubuwa: takardar wasa, Media, LIVE, wuri/lokaci, Home (wuri)
// Ana saka shi kai tsaye ta JavaScript, don haka ba sai an canza styles.css ba.
const css=`
.chip.live{background:#e6f6ec;color:#12803a}
.chip.live::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#12803a;margin-right:5px;vertical-align:middle}
.vl{margin:2px 0 8px;font-size:.78rem}
.schip{display:inline-block;background:#eceef5;color:var(--navy);font-weight:800;font-size:.8rem;padding:4px 12px;border-radius:14px;letter-spacing:.03em;text-transform:uppercase}
.loc{margin:18px 0 6px}
.lochd{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:var(--mu);letter-spacing:.08em;text-transform:uppercase;font-size:.78rem}
.lochd a{color:var(--royal);font-weight:800;text-decoration:none;text-transform:none;letter-spacing:0;font-size:.92rem}
.locrow{display:flex;align-items:center;gap:12px;margin-top:10px;padding:12px;background:var(--bg);border-radius:14px;color:var(--navy);font-weight:700}
.edit .dt{display:grid;gap:8px;margin:10px 0;width:100%}.edit .dt input{border:1.5px solid #b8c1d8;border-radius:10px;padding:10px;font:inherit}

.ms{position:fixed;inset:0;z-index:75;background:#ededed;overflow-y:auto;color:var(--ink)}
.ms-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 10px) 10px 10px;background:var(--navy);color:#fff}
.ms-top>button{background:none;border:0;color:#fff;font:inherit;font-size:1.4rem;padding:8px;cursor:pointer}
.ms-st{flex:1;display:flex;justify-content:center}
.ms-st select,.ms-st span{border:1.5px solid #fff;border-radius:12px;padding:9px 16px;font:inherit;font-weight:800;min-width:160px;text-align:center;background:var(--navy);color:#fff;appearance:none;-webkit-appearance:none;text-transform:uppercase}
.ms-card{margin:12px;background:#fff;border-radius:14px;box-shadow:0 2px 8px #0002;overflow:hidden}
.ms-h{background:var(--navy);color:#fff;text-align:center;font-weight:800;font-size:1.2rem;padding:14px;text-transform:uppercase}
.ms-score{display:flex;justify-content:center;align-items:flex-start;gap:24px;padding:14px 8px 4px;font-family:ui-monospace,"Courier New",monospace}
.ms-score b{font-size:4.6rem;line-height:1;font-weight:900;color:#111}.ms-score i{font-style:normal;font-size:2.4rem;align-self:center;padding-bottom:30px}
.ms-col{display:grid;justify-items:center;gap:8px}.ms-pm{display:flex;gap:10px;font-family:system-ui,sans-serif}
.ms-pm button{width:40px;height:40px;border-radius:50%;border:0;background:var(--navy);color:#fff;font-size:1.3rem;cursor:pointer}.ms-pm button:disabled{opacity:.35}
.ms-clock{display:flex;align-items:center;justify-content:center;gap:14px;padding:6px 0 16px;color:var(--navy);font-weight:800;font-size:1.3rem}
.ms-sw{width:50px;height:50px;border-radius:50%;border:0;background:var(--navy);color:#fff;display:grid;place-items:center;cursor:pointer}.ms-sw.on{background:#12803a}
.ms-rs{background:none;border:0;color:var(--royal);font:inherit;font-weight:700}
.ms-subs{display:grid;grid-template-columns:1fr 1fr;text-align:center;padding:10px 6px 14px;gap:6px}
.ms-subs b{display:block;font-size:1.1rem;margin-bottom:8px}.ms-dots{display:flex;gap:8px;justify-content:center}
.ms-dots button{width:30px;height:30px;border-radius:50%;border:0;background:#dcdcdc;cursor:pointer}.ms-dots button.on{background:var(--navy)}
.ms-ph{display:grid;grid-template-columns:26px 1fr 52px 88px 30px 30px;gap:6px;align-items:center;padding:12px 10px;background:#e9e9e9;font-weight:800;font-size:.8rem;text-transform:uppercase}
.ms-pr{display:grid;grid-template-columns:26px 1fr 52px 88px 30px 30px;gap:6px;align-items:center;padding:10px;border-top:1px solid #eee}
.ms-pr .nm{font-weight:800;text-transform:uppercase;font-size:.9rem;min-width:0;overflow:hidden;text-overflow:ellipsis}.ms-pr .nm small{margin-left:6px;color:var(--mu);font-weight:600}
.ms-sw2{width:44px;height:24px;border-radius:12px;border:0;background:#cfcfcf;position:relative;cursor:pointer}
.ms-sw2::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s}
.ms-sw2.on{background:#5cc27a}.ms-sw2.on::after{left:22px}
.ms-g{display:flex;align-items:center;gap:4px;justify-content:center}.ms-g button{width:24px;height:24px;border-radius:50%;border:0;background:#eef0f6;color:var(--navy);font-weight:800;cursor:pointer}
.ms-cd{width:22px;height:28px;border-radius:4px;border:0;background:#cfcfcf;cursor:pointer;font-size:.7rem;font-weight:800;color:#222}
.ms-cd.y{background:#f9d71c}.ms-cd.r{background:#e53935}
.ms-empty{padding:14px;text-align:center;font-weight:700;color:var(--navy)}
.ms-sec{display:flex;align-items:center;gap:10px;font-size:1.35rem;font-weight:800;padding:14px 16px;border-bottom:1px solid #eee;color:var(--navy)}
.ms-add{width:30px;height:30px;border-radius:50%;border:0;background:#111;color:#fff;font-size:1.2rem;cursor:pointer}
.ms-mv{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f1f1f1}.ms-mv .mn{min-width:38px;font-weight:800;color:var(--navy)}.ms-mv .tx{flex:1}
.ms-mv button{background:none;border:0;color:#e53935;font-size:1.1rem;cursor:pointer}
.ms-form{display:grid;gap:8px;padding:12px 16px}.ms-form input,.ms-form select{border:1.5px solid #b8c1d8;border-radius:10px;padding:10px;font:inherit;min-width:0}
.ms-form .r{display:flex;gap:8px}
@media print{.ms-top>button,.ms-pm,.ms-add,.ms-sw,.ms-rs{display:none}}

.md-pills{display:flex;gap:8px;margin:6px 0 4px}
.md-post{background:#fff;border:1px solid var(--line);border-radius:18px;margin:12px 0;overflow:hidden}
.md-ph{display:flex;gap:12px;padding:14px;align-items:center}.md-ph .av{width:44px;height:44px;border-radius:50%;overflow:hidden;flex:none;background:var(--bg);display:grid;place-items:center}
.md-ph b{display:block;color:var(--navy)}.md-ph small{color:var(--mu)}.md-ph .x{margin-left:auto;background:none;border:0;color:#e53935;font-size:1.1rem}
.md-tx{padding:0 14px 12px;color:var(--ink);white-space:pre-wrap}
.md-img{position:relative}.md-img img{width:100%;display:block;max-height:440px;object-fit:cover}
.md-tag{position:absolute;left:10px;top:10px;background:#fff;border-radius:8px;padding:3px 9px;font-size:.65rem;font-weight:800;letter-spacing:.05em}
.md-act{display:flex;gap:20px;padding:10px 14px;color:var(--navy);align-items:center}
.md-act button{display:flex;align-items:center;gap:6px;background:none;border:0;color:var(--navy);font:inherit;font-weight:700;cursor:pointer}.md-act button.on{color:#e53935}
.md-cm{padding:6px 14px 14px;border-top:1px solid #f0f0f0}.md-cm p{margin:8px 0}.md-cm p b{color:var(--navy)}
.md-cm form{display:flex;gap:8px;margin-top:8px}.md-cm input{flex:1;border:1.5px solid #cfd6e6;border-radius:20px;padding:10px 14px;font:inherit;min-width:0}
.md-new{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;margin:10px 0;display:grid;gap:10px}
.md-new textarea,.md-new input[type=text]{border:1.5px solid #cfd6e6;border-radius:12px;padding:12px;font:inherit;width:100%;box-sizing:border-box}
.md-new .r{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.md-new img{max-width:100%;border-radius:12px}
`;
if(typeof document!=="undefined"&&!document.getElementById("lasha-extra-css")){
  const s=document.createElement("style");s.id="lasha-extra-css";s.textContent=css;document.head.appendChild(s);
}
export {};
