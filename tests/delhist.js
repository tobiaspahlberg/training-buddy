const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const errs=[]; w.addEventListener("error",e=>errs.push(e.message));
const press = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                      return new Promise(r=>setTimeout(r,600)); };
const tap = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                    el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); };
const rows = () => [...$("history-body").querySelectorAll("[data-hist]")];
const names = () => rows().map(r => r.querySelector("b").textContent);

// three finished sessions, oldest last
// Dates are made relative to now, so the suite does not start failing at
// midnight the way a hardcoded "yesterday" does.
const day = n => new Date(Date.now() - n * 86400000).toISOString();
ev(`history = [
  {id:"a", name:"Alpha", planName:"",          at:"${day(0)}", sec:600},
  {id:"b", name:"Beta",  planName:"Some plan", at:"${day(1)}", sec:900},
  {id:"c", name:"Gamma", planName:"",          at:"${day(2)}", sec:300}
];`);
w.openHistory();
ok(rows().length === 3, "three entries listed");
ok(JSON.stringify(names()) === '["Alpha","Beta","Gamma"]', "newest first: " + names());

// the stray inner rule is gone: only the row itself is a flex row with padding
ok($("history-body").querySelectorAll(".hist > div").length === 3, "three row divs, not six");

(async () => {
  // hold the middle one
  await press(rows()[1]);
  ok($("overlay").classList.contains("show"), "holding an entry asks first");
  ok($("dlg-text").textContent.includes("Beta"), "the dialog names it: " + $("dlg-text").textContent);
  ok($("dlg-text").textContent.includes("Yesterday"), "and dates it");
  ok($("dlg-text").textContent.includes("session itself is not touched"), "and reassures about the session");

  w.closeDialog();
  ok(ev("history.length") === 3, "cancelling keeps it");

  await press(rows()[1]);
  $("dlg-ok").onclick();
  ok(ev("history.length") === 2, "confirming drops one");
  ok(JSON.stringify(names()) === '["Alpha","Gamma"]', "the right one went: " + names());

  // the Delete link works without the gesture
  const link = $("history-body").querySelector('[data-act="drop"]');
  tap(link);
  ok($("overlay").classList.contains("show"), "the Delete link asks too");
  $("dlg-ok").onclick();
  ok(JSON.stringify(names()) === '["Gamma"]', "and drops that row: " + names());

  // holding the Delete link and letting go is just a slow tap: one dialog,
  // one entry gone - the row underneath must not fire as well
  ev(`history = [
    {id:"a", name:"Alpha", planName:"", at:"${day(0)}", sec:600},
    {id:"c", name:"Gamma", planName:"", at:"${day(2)}", sec:300}
  ];`);
  w.renderHistory();
  const slow = $("history-body").querySelector('[data-act="drop"]');
  await press(slow);
  ok(!$("overlay").classList.contains("show"), "the hold alone does nothing on the link");
  slow.dispatchEvent(new w.MouseEvent("click", { bubbles:true }));
  ok($("overlay").classList.contains("show"), "letting go asks");
  $("dlg-ok").onclick();
  ok(ev("history.length") === 1, "exactly one entry dropped, not two: " + ev("history.length"));
  ok(ev('history[0].name') === "Gamma", "and it was the one held: " + ev("history[0].name"));

  // last one out empties the screen
  await press(rows()[0]);
  $("dlg-ok").onclick();
  ok(ev("history.length") === 0, "the last entry can go");
  ok($("history-body").textContent.includes("No finished sessions yet"), "and the screen says it is empty");

  // clearing everything still works
  ev(`history = [{id:"a", name:"Alpha", planName:"", at:"${day(0)}", sec:600}];`);
  w.renderHistory();
  w.clearHistory(); $("dlg-ok").onclick();
  ok(ev("history.length") === 0, "Clear history still clears the lot");

  console.log(errs.length ? "\nERRORS: "+errs.join("; ") : "\nno uncaught errors");
})();
