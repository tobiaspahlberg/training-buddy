const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

// Stand in for the notification plugin and record what it is asked to post.
function boot(grant){
  const log = { scheduled: [], cancelled: 0, channels: [], asked: 0 };
  const dom = new JSDOM(html, { runScripts:"dangerously", url:"https://example.org/",
    beforeParse(w){
      w.Capacitor = { isNativePlatform: () => true, Plugins: {
        App: { addListener(){}, exitApp(){} },
        Speech: { speak:()=>Promise.resolve(), stop:()=>Promise.resolve(),
                  voices:()=>Promise.resolve({voices:[]}), setVoice:()=>Promise.resolve({}) },
        LocalNotifications: {
          requestPermissions(){ log.asked++; return Promise.resolve({ display: grant }); },
          createChannel(c){ log.channels.push(c); return Promise.resolve(); },
          schedule(o){ log.scheduled.push(o.notifications[0]); return Promise.resolve(); },
          cancel(){ log.cancelled++; return Promise.resolve(); }
        }
      }};
    }});
  return { w: dom.window, d: dom.window.document, log, ev: e => dom.window.eval(e) };
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const { w, d, log, ev } = boot("granted");
  ev(`begin({ id:"n1", name:"Quick test", blocks:[
    {type:"step", text:"One", kind:"run",  sec:1},
    {type:"step", text:"Two", kind:"walk", sec:1},
    {type:"step", text:"Three", kind:"run", sec:60}
  ]}); setLead(0); mainButton();`);
  await wait(400);
  ok(log.scheduled.length === 1, "one notification goes up when the clock starts");
  const n = log.scheduled[0];
  console.log("\n  status bar:  " + n.title + "  —  " + n.body + "\n");
  ok(n.title === "Quick test", "titled with the session: " + n.title);
  ok(n.body.indexOf("One") === 0, "and says the step you are on: " + n.body);
  ok(n.ongoing === true, "it is ongoing, so a swipe cannot lose it");
  ok(n.autoCancel === false, "and it does not clear itself on a tap");
  ok(log.channels.length === 1 && log.channels[0].importance === 2,
     "on a channel that is seen and not heard: importance " + log.channels[0].importance);
  ok(log.channels[0].id.indexOf("-v") > 0, "whose id carries a version, since it can never be changed");

  await wait(1300);
  ok(log.scheduled.length > 1, "it follows the steps: " + log.scheduled.length + " so far");
  ok(log.scheduled[log.scheduled.length - 1].id === log.scheduled[0].id,
     "always replacing itself rather than stacking up");
  ok(log.asked === 1, "and permission was asked for once, not once a step: " + log.asked);

  // pausing keeps it, since the session is still there to come back to
  const before = log.cancelled;
  w.setLead(0); w.mainButton();
  await wait(150);
  ok(log.cancelled === before, "pausing does not take it away");

  // stopping does
  w.confirmQuit();
  d.getElementById("dlg-ok").onclick();
  await wait(150);
  ok(log.cancelled > before, "stopping the workout clears it");

  // finishing does too
  const b = boot("granted");
  b.ev(`begin({ id:"n2", name:"Short", blocks:[{type:"step",text:"Go",kind:"run",sec:1}]}); setLead(0); mainButton();`);
  await wait(1600);
  ok(d.body && b.d.querySelector(".screen.active").id === "done", "session finished");
  ok(b.log.cancelled === 1, "and the notification went with it: " + b.log.cancelled);

  // a phone that says no is not nagged, and nothing breaks
  const no = boot("denied");
  no.ev(`begin({ id:"n3", name:"Denied", blocks:[{type:"step",text:"Go",kind:"run",sec:60}]}); setLead(0); mainButton();`);
  await wait(400);
  ok(no.log.scheduled.length === 0, "permission refused: nothing is posted");
  ok(no.d.querySelector(".screen.active").id === "run", "and the workout runs regardless");
  no.ev("stopTicker();");
})();

// the small icon has to be named, and has to be one the project actually has
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  const html = fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
  const m = html.match(/smallIcon: "([^"]+)"/);
  ok2(!!m, "the notification names a small icon");
  ok2(fs.existsSync(require("path").join(__dirname, "..", "android/app/src/main/res/drawable", m[1] + ".xml")),
      "and the drawable is in the project: " + m[1] + ".xml");
  const svg = fs.readFileSync(require("path").join(__dirname, "..", "android/app/src/main/res/drawable", m[1] + ".xml"),"utf8");
  ok2(/viewportWidth="24"/.test(svg) && /viewportHeight="24"/.test(svg), "drawn at 24dp");
  ok2((svg.match(/#FFFFFFFF/g) || []).length === svg.split("<path").length - 1,
      "every path white, since Android keeps only the alpha");
}, 100);
