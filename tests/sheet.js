const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const shown = () => [...d.querySelectorAll(".sheet-acts .sact")]
  .filter(b => b.style.display !== "none");
const labels = () => shown().map(b => b.querySelector("span").textContent);

// a built-in workout
w.openProgram("wod-deck-of-cards");
console.log("\n  built-in workout: [ Start ] then " + labels().join("  ") + "\n");
ok($("sheet-start").style.display !== "none", "Start is still its own button");
ok(JSON.stringify(labels()) === '["Done","Copy","Close"]', "three icons beside it: " + labels());
ok(shown().every(b => b.querySelector("svg")), "each carries a drawn icon");
ok(shown().every(b => b.querySelector("span")), "and a word under it");
ok(!d.querySelector("#sheet-video"), "the video button is gone");

// the tick carries the state rather than swapping its wording
ok(!$("sheet-mark").classList.contains("on"), "not done, so the tick is empty");
w.toggleDone();
w.openProgram("wod-deck-of-cards");
ok($("sheet-mark").classList.contains("on"), "done today, so the tick is filled in");
ok($("sheet-mark").querySelector("span").textContent === "Done", "the word does not change: " +
   $("sheet-mark").querySelector("span").textContent);
w.toggleDone();
w.openProgram("wod-deck-of-cards");
ok(!$("sheet-mark").classList.contains("on"), "pressing it again takes it back");

// a day of a plan: no copy of a built-in day into itself, no edit
w.openPlan("spark-rtr-phase1");
w.openDay(1, 0);
console.log("  built-in plan day:  [ Start ] " + labels().join("  ") + "\n");
ok(JSON.stringify(labels()) === '["Done","Copy","Close"]', "a plan day: " + labels());

// a race day has nothing to start and nothing to copy
w.openPlan("spark-beginner-5k");
w.openDay(8, 5);
console.log("  race day:                    " + labels().join("  ") + "\n");
ok($("sheet-start").style.display === "none", "no Start on a race day");
ok(JSON.stringify(labels()) === '["Done","Close"]', "and no Copy either: " + labels());

// a copied plan's session can be edited
w.openPlan("spark-rtr-phase1"); w.copyPlan(); $("dlg-ok").onclick();
w.openDay(1, 0);
console.log("  a copy's own session: [ Start ] " + labels().join("  ") + "\n");
ok(JSON.stringify(labels()) === '["Edit","Done","Copy","Close"]', "all four: " + labels());

// Close still closes
w.openProgram("wod-deck-of-cards");
$("sheet-close").dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
ok(!$("sheet").classList.contains("show"), "Close closes the sheet");
