/* The lead-in: Start means "in a moment", not "now". */
const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const active=()=>d.querySelector(".screen.active").id;

// A recording engine, so what is said out loud can be read back.
ev(`
  window.spoken = [];
  window.SpeechSynthesisUtterance = function(t){ this.text = t; };
  window.speechSynthesis = {
    speak: function(u){ spoken.push(u.text); },
    cancel: function(){}, getVoices: function(){ return []; }
  };
`);

const START = `begin({ id:"L", name:"Lead test", blocks:[
  {type:"step",text:"Warm-up", kind:"warm", sec:300},
  {type:"step",text:"Run",     kind:"run",  sec:120}
]});`;

// ---- the default ----
ok(ev("leadSec") === 5, "five seconds by default: " + ev("leadSec"));
w.showScreen("about");
ok($("lead-pick").value === "5", "and About says so: " + $("lead-pick").value);
ok([...$("lead-pick").options].map(o=>o.value).join(",") === "0,3,5,10",
   "off, three, five or ten");

// ---- Start does not start ----
ev(START + " mainButton();");
ok(active() === "run", "on the run screen");
ok(ev("session.startedAt") > Date.now() + 4000,
   "the clock is set to begin in the future, not now");
ok($("step-label").textContent === "Get ready", "the screen says Get ready: " + $("step-label").textContent);
ok($("step-time").textContent === "5", "counting whole seconds: " + $("step-time").textContent);
ok($("next-up").textContent.indexOf("First: Warm-up") === 0,
   "and what is coming: " + $("next-up").textContent);
ok(ev("JSON.stringify(spoken)").indexOf("Get ready") > 0, "it says Get ready out loud");
ok($("main-btn").textContent === "Pause", "the button is a pause, since the clock is going");
ok(ev("elapsed()") === 0, "no time has been run yet");

// ---- it counts you in ----
ev("spoken.length = 0; session.startedAt = Date.now() + 2500; tick();");
ok($("step-time").textContent === "3", "2.5 seconds out shows 3: " + $("step-time").textContent);
ev("session.startedAt = Date.now() + 2900; tick();");
ok(ev("JSON.stringify(spoken)") === '["3"]', "three is said once: " + ev("JSON.stringify(spoken)"));
ev("session.startedAt = Date.now() + 1900; tick(); session.startedAt = Date.now() + 900; tick();");
ok(ev("JSON.stringify(spoken)") === '["3","2","1"]', "then two and one: " + ev("JSON.stringify(spoken)"));
ok(ev("lastStepIdx") === -1, "and no step has begun");

// ---- when it runs out, the first step announces itself ----
ev("spoken.length = 0; session.startedAt = Date.now() - 1000; tick();");
ok(ev("lastStepIdx") === 0, "the first step is on");
ok($("step-label").textContent === "Warm-up", "the screen turns over: " + $("step-label").textContent);
ok(ev("JSON.stringify(spoken)").indexOf("Warm-up") > 0, "and it is announced: " + ev("JSON.stringify(spoken)"));
ok(Math.round(ev("elapsed()")) === 1, "one second of the session has run: " + ev("elapsed()"));

// ---- a pause during the count-in holds it ----
ev("stopTicker(); session = null;");
ev(START + " mainButton();");
const before = ev("leadLeft(session)");
ev("mainButton();");                              // pause
ok(ev("session.pausedAt") > 0, "paused while counting in");
const held = ev("leadLeft(session)");
ok(Math.abs(held - before) < 0.2, "the wait stands still: " + before.toFixed(2) + " then " + held.toFixed(2));
// Three seconds of real time spent paused: the pause began three seconds ago
// and the wall clock has moved on by the same amount.
ev("session.startedAt -= 3000; session.pausedAt -= 3000; mainButton();");
ok(Math.abs(ev("leadLeft(session)") - held) < 0.3,
   "and resuming picks it up where it was, not three seconds later: " + ev("leadLeft(session)").toFixed(2));

// ---- skip goes straight to the first step ----
ev("skipStep();");
ok(ev("leadLeft(session)") === 0, "skip ends the wait");
ok(ev("lastStepIdx") === 0 && $("step-label").textContent === "Warm-up",
   "and the session is on: " + $("step-label").textContent);

// ---- leaving during the count-in asks nothing ----
ev("stopTicker(); session = null;");
w.openCategory("crossfn");
ev(START + " mainButton();");
w.confirmQuit();
ok(!$("overlay").classList.contains("show"), "nothing has been run, so nothing is asked");
ok(active() === "category", "and it goes back where it started");
ok(ev("session") === null, "the session is gone");

// ---- it survives the app being killed ----
ev("stopTicker(); session = null;");
ev(START + " mainButton(); session.startedAt = Date.now() + 3000; persist();");
ev("stopTicker(); session = null; resumeSaved();");
ok(ev("session") !== null, "the session came back");
ok(Math.round(ev("leadLeft(session)")) === 3,
   "with the wait rebuilt from the timestamp: " + ev("leadLeft(session)").toFixed(2));

// ---- turned off, Start means now ----
ev("stopTicker(); session = null;");
w.setLead(0);
ok(w.localStorage.getItem("tb.lead") === "0", "the choice is remembered");
ev("spoken.length = 0;" + START + " mainButton();");
ok(ev("leadLeft(session)") === 0, "no wait at all");
ok($("step-label").textContent === "Warm-up", "the first step is on the screen at once: " +
   $("step-label").textContent);
ok(ev("JSON.stringify(spoken)").indexOf("Get ready") < 0, "and nothing is said about getting ready");
ev("stopTicker(); session = null;");

// ---- and the choice is read back on the next visit ----
w.showScreen("about");
ok($("lead-pick").value === "0", "About shows what was chosen: " + $("lead-pick").value);
