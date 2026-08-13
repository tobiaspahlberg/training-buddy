const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

// jsdom has no speech engine, so stand one in that records what it is told,
// the way both real engines behave: speak() queues, cancel() empties the queue.
ev(`
  window.spoken = [];
  window.queue = [];
  window.SpeechSynthesisUtterance = function(t){ this.text = t; };
  window.speechSynthesis = {
    speak: function(u){ queue.push(u.text); spoken.push(u.text); },
    cancel: function(){ queue.length = 0; },
    getVoices: function(){ return []; }
  };
`);

// a session of six short steps
ev(`begin({ id:"t", name:"Skip test", blocks:[
  {type:"step",text:"One",  kind:"run", sec:60},
  {type:"step",text:"Two",  kind:"run", sec:60},
  {type:"step",text:"Three",kind:"run", sec:60},
  {type:"step",text:"Four", kind:"run", sec:60},
  {type:"step",text:"Five", kind:"run", sec:60},
  {type:"step",text:"Six",  kind:"run", sec:60}
]}); setLead(0); mainButton();`);
ok(ev("spoken.length") >= 1, "the first step is announced");

// hammer skip, the way a thumb does
ev("skipStep(); skipStep(); skipStep(); skipStep();");
const spoken = ev("JSON.stringify(spoken)");
const queued = ev("JSON.stringify(queue)");
console.log("\n  said:   " + spoken);
console.log("  queued: " + queued + "\n");

ok(ev("queue.length") === 1, "only one cue is left waiting after four fast skips: " + ev("queue.length"));
ok(ev("queue[0]").indexOf("Five") === 0, "and it is the step you are actually on: " + ev("queue[0]"));
ok(ev("spoken.length") === 5, "each skip did speak, it just cut the last one off: " + ev("spoken.length"));
ok($("step-label").textContent === "Five", "the screen agrees: " + $("step-label").textContent);

// leaving the workout silences it too
ev("queue.length = 0; speak('a long sentence still going');");
ok(ev("queue.length") === 1, "something is being said");
ev("confirmQuit();");
$("dlg-ok").onclick();
ok(ev("queue.length") === 0, "quitting cuts it off");

// with no engine at all nothing throws
ev("window.speechSynthesis = undefined; speak('nobody is listening'); stopSpeech();");
ok(true, "and a phone with no voice at all does not fall over");
