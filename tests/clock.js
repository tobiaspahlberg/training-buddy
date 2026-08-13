const fs = require("fs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  { runScripts:"dangerously", url:"https://example.org/" });
const w = dom.window, d = w.document, ev = e => w.eval(e);
const $ = id => d.getElementById(id);
const ok = (c,m) => console.log((c?"  ok  ":"FAIL  ")+m);

// 3 x 2s run : 1s walk, with a work list on the last step
ev(`begin({ id:"t1", name:"Quick test", blocks:[
  { type:"repeat", reps:3, a:{text:"Run",kind:"run",sec:2}, b:{text:"Walk",kind:"walk",sec:1} },
  { type:"step", text:"Finisher", kind:"warm", sec:2, list:["10 push-ups","10 sit-ups"] }
]})`);
ok(d.querySelector(".screen.active").id === "run", "run screen");
ok(ev("session.steps.length") === 7, "7 steps: " + ev("session.steps.length"));
ok($("tl-segs").children.length === 7, "timeline built");
ev("setLead(0); mainButton()");
setTimeout(() => {
  ok($("step-label").textContent === "Walk", "on a walk at 2.3s: " + $("step-label").textContent);
  ev("skipStep()");
  ok($("step-label").textContent === "Run", "skip lands on the next step");
}, 2300);
setTimeout(() => {
  ok($("work-list").textContent.includes("10 push-ups"), "the finisher's list appears mid-run");
}, 9000);
setTimeout(() => {
  ok(d.querySelector(".screen.active").id === "done", "session finishes");
  ok(ev('progress["t1"]') !== undefined, "finish ticks the session off");
  ok($("done-stats").textContent.includes("7 steps"), "summary: " + $("done-stats").textContent);
  ok(JSON.parse(w.localStorage.getItem("tb.current")) === null, "the saved session is cleared");
}, 11000);
