/* The review page: every drawing, big and small, and a check on the elbows. */
const fs = require("fs");
const { ALL, dressed, CSS } = require("./all.js");

const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
let bad = 0;
ALL.forEach(([id, name, o]) => {
  /* Face on there is no single answer: which way an elbow may bend depends on
     which side of the body the arm is on and how far round the shoulder has
     turned, and a rule I cannot state correctly is worse than no rule. Those
     drawings are checked by looking at them. */
  if(o.face === "front") return;
  o.keys.forEach(k => ["A", "B"].forEach(s => {
    if(k.pose["hand" + s + "X"] !== undefined) return;   // pinned: the rig picks
    const off = wrap(k.pose["fore" + s] - k.pose["upper" + s]);
    if(off > 8 || off < -158){
      bad++;
      console.log("  BACKWARDS ELBOW  " + id + " arm " + s + " at t=" + k.t + ": " + Math.round(off) + "°");
    }
  }));
});

const svg = {};
ALL.forEach(([id, name, o]) => { svg[id] = dressed(o); });

const page = `<!doctype html><meta charset="utf-8"><title>The drawings</title>
<style>
  :root{--bg:#0E1712;--surface:#17241D;--line:#2C4438;--text:#F2F7F4;--dim:#8CA79A;
        --skin:#F2C9A0;--skin-far:#C79A74;--vest:#7E8891;--shorts:#33496E;--shorts-far:#28364F;
        --shoe:#EDEFEC;--shoe-far:#AAB0AE;--hair:#6E4A2E;--warm:#FBBF24;--kit:#7C8A99}
  body{margin:0;background:var(--bg);color:var(--text);padding:24px 16px 80px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .page{max-width:760px;margin:0 auto}
  h1{font-size:23px;margin:0 0 6px}
  p.lede{color:var(--dim);font-size:14.5px;margin:0 0 26px;line-height:1.6}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;
    padding:14px 16px;margin-bottom:12px;display:flex;gap:20px;align-items:center}
  .card .fig{width:210px;flex-shrink:0;display:flex;justify-content:center}
  .name{font-size:18px;font-weight:650}
  .sub{font-size:14.5px;color:var(--dim);margin-top:4px;line-height:1.5}
  ${CSS}
  /* No size here: each drawing carries its own, and that is the point.
     The whole picture is zoomed so it can be looked at. */
  .fig{zoom:1.7}
  .steplist{border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-top:26px}
  .steplist div{display:flex;justify-content:space-between;gap:12px;align-items:center;
    padding:4px 15px 4px 28px;font-size:17px;color:var(--dim);border-bottom:1px solid var(--line)}
  .steplist div:last-child{border-bottom:none}
  .steplist .demo{height:88px}
  h2{font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin:34px 0 10px}
  .kitload circle,.kitload rect{fill:var(--kit)}
  .far-load rect{fill:#B98C1B}
</style>
<div class="page">
  <h1>The drawings, all of them</h1>
  <p class="lede">Ten new ones beside the two that are already in. Same rig throughout: fixed bone
     lengths and a pose is the set of angles at the joints, so nothing stretches. Hands can now be
     pinned as well as feet, which is what a press-up and a pull-up are &ndash; the body moves and
     the hand does not.</p>

${ALL.map(([id, name, o, note]) => `  <div class="card">
    <div class="fig">${svg[id]}</div>
    <div><div class="name">${name}</div><div class="sub">${note}</div></div>
  </div>`).join("\n")}

  <h2>The size they are actually shown at</h2>
  <div class="steplist">
${ALL.map(([id, name]) => `    <div><span>${name.toLowerCase()}</span>${svg[id]}</div>`).join("\n")}
  </div>
</div>`;

fs.writeFileSync(process.argv[2] || "/tmp/all.html", page);
ALL.forEach(([id]) => fs.writeFileSync("/tmp/svg-" + id + ".svg", svg[id]));
console.log(bad ? bad + " backwards elbows" : "  elbows all bend the right way");
ALL.forEach(([id]) => console.log("  " + id.padEnd(10) + String(svg[id].length).padStart(6) + " bytes"));
