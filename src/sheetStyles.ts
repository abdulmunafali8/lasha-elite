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
.edit .dt{display:grid;gap:8px;margin:10px 0;width:100%}.edit .dt input{width:100%;min-width:0;box-sizing:border-box;height:auto;text-align:left;border:1.5px solid #b8c1d8;border-radius:10px;padding:12px;font:inherit}
.dtl{display:grid;gap:4px;width:100%;text-align:left}.dtl span{font-size:.78rem;font-weight:800;color:var(--mu);letter-spacing:.06em;text-transform:uppercase}
.edit .dt input[type=datetime-local]{min-height:48px;color:inherit}
.champ>div{display:grid;gap:2px;justify-items:start;min-width:0}.champ em{display:block}

.ms{position:fixed;inset:0;z-index:75;background:#021426;overflow-y:auto;color:#fff;overscroll-behavior:contain}
.ms-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 10px) 10px 10px;background:#10224d;color:#fff}
.ms-top>button{background:none;border:0;color:#fff;padding:8px;cursor:pointer;display:grid;place-items:center}
.ms-st{flex:1;display:flex;justify-content:center}
.ms-dd{position:relative;width:min(210px,52vw);height:46px}
.ms-ddb{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;height:46px;box-sizing:border-box;border:2px solid #fff;border-radius:14px;padding:0 16px;font:inherit;font-weight:800;font-size:1.1rem;background:#10224d;color:#fff;text-transform:uppercase;cursor:pointer}
span.ms-ddb{width:min(210px,52vw);justify-content:center;cursor:default}
.ms-ddx{position:fixed;inset:0;z-index:4}
.ms-ddm{position:absolute;left:0;right:-8px;top:-4px;z-index:5;background:#14295e;border-radius:14px;box-shadow:0 10px 30px #0009;overflow:hidden;padding:4px 0}
.ms-ddm button{display:block;width:100%;text-align:left;background:none;border:0;color:#fff;font:inherit;font-weight:800;font-size:1.1rem;padding:16px 18px;text-transform:uppercase;cursor:pointer}
.ms-ddm button.on{background:#2d4177}
.ms-card{position:relative;margin:14px 12px 0;background:#111a33;border-radius:16px;box-shadow:0 2px 8px #0006;overflow:hidden;color:#fff}
.ms-h{background:#14296b;color:#fff;text-align:center;font-weight:800;font-size:1.45rem;padding:16px 14px;text-transform:uppercase}
.ms-score{display:flex;justify-content:center;align-items:flex-start;gap:24px;padding:18px 8px 14px;color:#fff;font-family:ui-monospace,"Courier New",monospace}
.ms-score .dg{display:flex;gap:8px}.ms-score i{font-style:normal;font-size:2.4rem;align-self:center;padding-bottom:30px}
.ms-col{display:grid;justify-items:center;gap:8px}.ms-pm{display:flex;gap:10px;font-family:system-ui,sans-serif}
.ms-pm button{width:40px;height:40px;border-radius:50%;border:0;background:#2d4177;color:#fff;font-size:1.3rem;cursor:pointer}.ms-pm button:disabled{opacity:.35}
.ms-clock{display:flex;align-items:center;justify-content:center;gap:14px;padding:0 0 14px;color:#fff;font-weight:800;font-size:1.3rem}
.ms-sw{position:absolute;top:12px;right:12px;width:60px;height:60px;border-radius:50%;border:1px solid #3a5088;background:#14285f;color:#fff;display:grid;place-items:center;cursor:pointer}.ms-sw.on{background:#12803a;border-color:#12803a}
.ms-rs{background:none;border:0;color:var(--gold);font:inherit;font-weight:700}
.ms-subs{display:grid;grid-template-columns:1fr 1fr;text-align:center;padding:10px 6px 16px;gap:6px}
.ms-subs b{display:block;font-size:1.25rem;margin-bottom:10px}.ms-dots{display:flex;gap:8px;justify-content:center}
.ms-dots button{width:30px;height:30px;border-radius:50%;border:0;background:#47587f;cursor:pointer}.ms-dots button.on{background:var(--gold)}
.ms-ph{display:grid;grid-template-columns:26px 1fr 52px 88px 30px 30px;gap:6px;align-items:center;padding:14px 10px;background:#0e1730;font-weight:800;font-size:1.05rem;text-transform:uppercase;color:#fff}
.ms-ph>span:nth-child(3){font-size:.78rem}.ms-ph .pl{display:flex;align-items:center;gap:12px;min-width:0}
.ms-ck{width:30px;height:30px;flex:none;border-radius:6px;border:2px solid #fff;background:#fff;color:#0e1730;font-weight:900;font-size:1.05rem;line-height:1;display:grid;place-items:center;padding:0;cursor:pointer}.ms-ck:not(.on){background:none;color:transparent}.ms-ck:disabled{opacity:.5}
.ms-yc,.ms-rc{display:block;width:16px;height:24px;border-radius:3px;justify-self:center}.ms-yc{background:#f9d71c}.ms-rc{background:#e53935}
.ms-pr{display:grid;grid-template-columns:26px 1fr 52px 88px 30px 30px;gap:6px;align-items:center;padding:10px;border-top:1px solid #1f2b4a;color:#fff}
.ms-pr .nm{font-weight:800;text-transform:uppercase;font-size:.9rem;min-width:0;overflow:hidden;text-overflow:ellipsis}.ms-pr .nm small{margin-left:6px;color:#9fb0d6;font-weight:600}
.ms-sw2{width:44px;height:24px;border-radius:12px;border:0;background:#3b4766;position:relative;cursor:pointer}
.ms-sw2::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s}
.ms-sw2.on{background:#5cc27a}.ms-sw2.on::after{left:22px}
.ms-g{display:flex;align-items:center;gap:4px;justify-content:center}.ms-g button{width:24px;height:24px;border-radius:50%;border:0;background:#2d4177;color:#fff;font-weight:800;cursor:pointer}
.ms-cd{width:22px;height:28px;border-radius:4px;border:0;background:#3b4766;cursor:pointer;font-size:.7rem;font-weight:800;color:#222}
.ms-cd.y{background:#f9d71c}.ms-cd.r{background:#e53935}
.ms-empty{padding:16px 14px 18px;text-align:center;font-weight:700;color:#fff;font-size:1.25rem;margin:0}
.ms-sec{display:flex;align-items:center;gap:12px;font-size:1.45rem;font-weight:800;padding:16px;border-bottom:1px solid #26335a;color:#fff}
.ms-add{width:36px;height:36px;border-radius:50%;border:0;background:#fff;color:#10224d;font-size:1.4rem;font-weight:800;line-height:1;cursor:pointer}
.ms-fl{margin-left:auto;display:flex;align-items:center;gap:6px;background:none;border:0;color:#9fb0d6;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.ms-mv{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #1f2b4a;color:#fff}.ms-mv .mn{min-width:38px;font-weight:800;color:var(--gold)}.ms-mv .tx{flex:1}.ms-mv small{color:#9fb0d6}
.ms-mv button{background:none;border:0;color:#ff6b66;font-size:1.1rem;cursor:pointer}
.ms-form{display:grid;gap:8px;padding:12px 16px}.ms-form input,.ms-form select{border:1.5px solid #3a4a76;background:#0e1730;color:#fff;border-radius:10px;padding:10px;font:inherit;min-width:0}
.ms-form .r{display:flex;gap:8px}
@media print{.ms-top>button,.ms-pm,.ms-add,.ms-sw,.ms-rs,.ms-fl,.ms-ck{display:none}}

.mm-wrap{position:fixed;inset:0;background:#0007;z-index:80;display:grid;place-items:center;padding:20px}
.mm{background:var(--navy);width:min(310px,88vw);border-radius:22px;overflow:hidden;color:#fff}
.mm button{display:flex;gap:18px;align-items:center;width:100%;padding:18px 22px;background:none;border:0;color:#fff;font:inherit;font-size:1.15rem;font-weight:800;text-align:left;cursor:pointer}.mm button:disabled{opacity:.4;cursor:default}
.mm .lt{background:#fff}.mm .lt button{color:#e57373}
.mm-dg{background:#fff;border-radius:22px;padding:22px;width:min(360px,90vw);display:grid;gap:12px;color:var(--navy)}.mm-dg h3{margin:0}.mm-dg select{border:1.5px solid #b8c1d8;border-radius:10px;padding:12px;font:inherit;min-width:0}.mm-dg .r{display:flex;gap:10px;justify-content:flex-end}
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
