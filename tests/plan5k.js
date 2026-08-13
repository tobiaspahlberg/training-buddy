const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const errs=[]; w.addEventListener("error",e=>errs.push(e.message));

// --- the old plan must be untouched ---
ok(ev("countSessions(PLANS[0])") === 18, "Return to Run still has 18 sessions");
ok(ev("totalSec(planSession(PLANS[0], PLANS[0].weeks[0], 0).blocks)") === 1860,
   "and week 1 Tuesday is 31 min: 10 walk + 6x(1 run, 1 walk) less the last walk + 10 walk");
ok(ev("flatten(planSession(PLANS[0], PLANS[0].weeks[0], 0).blocks)[0].text") === "Warm-up walk",
   "still starts with the warm-up walk");

// --- the new plan ---
const P = "PLANS[1]";
ok(ev(P+".weeks.length") === 8, "eight weeks");
ok(ev("countSessions("+P+")") === 42, "42 timed sessions, 31 interval days + 11 walks: " + ev("countSessions("+P+")"));

console.log("\n  every interval day, computed from the recipe:");
const rows = JSON.parse(ev(`JSON.stringify(PLANS[1].weeks.map(wk => ({
  n: wk.n,
  days: PLANS[1].runDays.map((day,i) => {
    const s = daySpec(wk,i);
    if(s.rest) return "rest";
    if(s.race) return "RACE";
    if(s.optional) return "opt";
    const mins = totalSec(planSession(PLANS[1], wk, i).blocks)/60;
    return s.reps ? (s.runSec/60+"/"+s.walkSec/60+"x"+s.reps+"="+mins) : ("walk "+mins);
  })
})))`));
rows.forEach(r => console.log("    W"+r.n+"  "+r.days.map(x=>String(x).padEnd(12)).join("")));

// the three cells whose printed totals were wrong
ok(ev("totalSec(planSession(PLANS[1], PLANS[1].weeks[4], 4).blocks)/60") === 24, "W5 Fri computes 24 min, not the printed 20");
ok(ev("totalSec(planSession(PLANS[1], PLANS[1].weeks[5], 2).blocks)/60") === 26, "W6 Wed computes 26 min, not the printed 24");
ok(ev("totalSec(planSession(PLANS[1], PLANS[1].weeks[7], 1).blocks)/60") === 28, "W8 Tue computes 28 min, not the printed 24");

// no warm-up bolted on: the plan has none
ok(ev("flatten(planSession(PLANS[1], PLANS[1].weeks[0], 1).blocks).length") === 12,
   "W1 Tue is 6 run + 6 walk, nothing added: " + ev("flatten(planSession(PLANS[1],PLANS[1].weeks[0],1).blocks).length"));

// --- the calendar ---
w.openCategory("Training");
ok($("cat-body").textContent.includes("How to Start Running"), "listed under Training");
w.openPlan("spark-beginner-5k");
const cls = sel => $("plan-weeks").querySelectorAll(sel).length;
console.log("\n  calendar cells: run "+cls(".cell.run")+", walk "+cls(".cell.walk")+
            ", optional "+cls(".cell.opt")+", race "+cls(".cell.race")+", rest "+cls(".cell.off"));
ok(cls(".cell.run") === 31, "31 interval days");
ok(cls(".cell.walk") === 11, "11 walk days: 8 Mondays + 3 Thursdays");
ok(cls(".cell.opt") === 3, "3 optional days");
ok(cls(".cell.race") === 1, "one race day");
ok(cls(".cell.off") === 10, "8 Saturdays + 2 Thursdays off: " + cls(".cell.off"));
ok($("plan-weeks").textContent.includes("Race day"), "the legend mentions race day");
ok(!$("plan-weeks").textContent.includes("Strength"), "and does not mention strength, which this plan has none of");

// race day opens but cannot be started
const race = $("plan-weeks").querySelector(".cell.race");
race.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
race.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
ok($("sheet-title").textContent === "Week 8 – Sunday", "race day opens: " + $("sheet-title").textContent);
ok($("sheet-start").style.display === "none", "with no Start button");
ok($("sheet-mark").style.display !== "none", "but it can still be ticked off");
w.closeSheet();

// a walk day is a real session
const walkCell = $("plan-weeks").querySelector(".cell.walk");
walkCell.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
walkCell.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
ok($("sheet-start").style.display !== "none", "a walk day can be started");
w.startFromSheet();
ok($("step-time").textContent === "25:00", "and runs 25 minutes: " + $("step-time").textContent);
ev("stopTicker(); session=null;");

console.log(errs.length ? "\nERRORS: "+errs.join("; ") : "\nno uncaught errors");

// --- a walk that runs into a longer walk is one walk ---
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  const tail = JSON.parse(ev(`JSON.stringify(flatten(planSession(PLANS[0], PLANS[0].weeks[0], 0).blocks)
    .slice(-3).map(s => s.text + " " + s.sec + "s"))`));
  console.log("\n  how a Return to Run session now ends:\n    " + tail.join("  |  "));
  ok2(tail[tail.length - 1].indexOf("Cool-down walk") === 0, "it ends on the cool-down walk");
  ok2(tail[tail.length - 2].indexOf("Run") === 0, "straight after the last run: " + tail[tail.length - 2]);

  const walks = JSON.parse(ev(`JSON.stringify(flatten(planSession(PLANS[0], PLANS[0].weeks[0], 0).blocks)
    .filter(s => s.kind === "walk").length)`));
  ok2(walks === 5, "five walks between six runs, not six: " + walks);
  ok2(ev(`flatten(planSession(PLANS[0], PLANS[0].weeks[0], 0).blocks).filter(s => s.kind === "run").length`) === 6,
      "and all six runs are still there");

  // no two recovery steps ever sit next to each other in any built-in session
  const bad = JSON.parse(ev(`JSON.stringify(
    PLANS.flatMap(p => p.weeks.flatMap(wk => p.runDays.map((_, dd) => {
      const st = flatten(planSession(p, wk, dd).blocks);
      for(let i = 1; i < st.length; i++)
        if(!isWork(st[i].kind) && !isWork(st[i-1].kind))
          return p.short + " w" + wk.n + "d" + dd + ": " + st[i-1].text + " then " + st[i].text;
      return null;
    }))).filter(Boolean))`));
  ok2(bad.length === 0, "no session anywhere ends one recovery step straight into another: " +
      (bad.slice(0,2).join("; ") || "none found"));

  // the 5K plan has no cool-down, so its intervals keep every walk
  const k5 = JSON.parse(ev(`JSON.stringify(flatten(planSession(PLANS[1], PLANS[1].weeks[0], 1).blocks)
    .map(s => s.kind))`));
  ok2(k5.filter(k => k === "walk").length === 6 && k5.filter(k => k === "run").length === 6,
      "a plan with no cool-down keeps all six walks: " + k5.filter(k => k === "walk").length);
}, 1800);
