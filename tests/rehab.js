const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window, d=w.document, ev=e=>w.eval(e);
const $=id=>d.getElementById(id);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

w.openCategory("strength");
ok($("cat-body").textContent.includes("Strength for Runners"),
   "it is strength work, and filed as such");
w.openCategory("rehab");
ok($("cat-body").textContent.includes("Return to Run"), "the plan is the rehab one");
ok(!ev('JSON.stringify(programsIn("crossfn"))').includes("Strength for Runners"),
   "and nothing of it is left in the drawer that used to hold everything");

w.openProgram("rehab-strength-for-runners");
ok($("sheet-when").textContent.includes("follow-along"), "the note warns the times are chapter marks");
const rows = [...$("sheet-steps").querySelectorAll("div")].map(x => x.textContent);
console.log("\n  the session as the sheet shows it:");
rows.forEach(r => console.log("    " + r));
w.startFromSheet();
ok($("step-time").textContent === "23:30", "total is 23:30, the rounded lengths: " + $("step-time").textContent);
w.setLead(0); w.mainButton();
ok($("step-label").textContent === "Fire hydrants", "first exercise: " + $("step-label").textContent);
ok($("next-up").textContent.includes("Clamshells"), "next up is announced: " + $("next-up").textContent);
console.log("\n  spoken cues:");
[0,4,6].forEach(i => console.log("    " + ev(`cueFor(${i})`)));
ev("stopTicker(); session=null;");

// --- the videos the two sessions came from ---
const link = () => $("sheet-when").querySelector("a.deep");
w.openProgram("rehab-strength-for-runners");
ok(!!link(), "Strength for Runners links to its video");
ok(link().href === "https://youtu.be/pe9v9uiUujQ", "pointing at it: " + link().href);
ok(link().target === "_blank", "opening outside the app");
ok(link().rel === "noopener", "without handing it a window reference");
ok(link().textContent === "Link to instruction", "labelled: " + link().textContent);
ok($("sheet-when").textContent.indexOf("Seven exercises") === 0,
   "and it sits at the end of the description, not instead of it");

w.openProgram("rehab-core-hip-stability");
ok(link().href === "https://youtu.be/1uniMWm9fTA", "the miniband session links elsewhere: " + link().href);

// a workout off a whiteboard has no video, and must not keep the last one
w.openProgram("wod-deck-of-cards");
ok(!link(), "a whiteboard workout carries no link");

// nor does a day of a plan
w.openPlan("spark-rtr-phase1");
w.openDay(1, 0);
ok(!link(), "and neither does a plan day");

// every link in the app is a youtu.be one, plain, with no share token
const all = JSON.parse(ev(`JSON.stringify(BUILTIN_PROGRAMS.filter(p => p.video).map(p => p.video))`));
ok(all.length === 2, "two sessions carry a video: " + all.length);
ok(all.every(u => /^https:\/\/youtu\.be\/[\w-]+$/.test(u)), "both plain links: " + all.join(" "));
ok(new Set(all).size === 2, "and they are not the same link twice");

// =====================================================================
// The strength days of Return to Run are this session
// =====================================================================
w.openPlan("spark-rtr-phase1");
const strCells = [...$("plan-weeks").querySelectorAll(".cell.str")];
ok(strCells.length === 12, "two a week for six weeks: " + strCells.length);
ok(strCells[0].textContent === "Str24 min",
   "and the cell says how long it is, like every other day with a clock: " +
   strCells[0].textContent);

// tapping one opens the workout, not a line of text
const tap = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                    el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); };
tap(strCells[0]);
ok($("sheet-title").textContent === "Week 1 – Monday", "the day is named: " + $("sheet-title").textContent);
ok($("sheet-when").textContent.indexOf("Strength for Runners") === 0,
   "and the session is: " + $("sheet-when").textContent);
ok($("sheet-when").innerHTML.includes("youtu.be"), "with the video that goes with it");
ok($("sheet-steps").textContent.indexOf("Fire hydrants") === 0,
   "the steps are the workout's own: " + $("sheet-steps").textContent.slice(0, 40));
ok($("sheet-start").style.display !== "none", "it can be started");
ok($("sheet-mark").style.display !== "none", "or ticked off by hand, as before");

// running it belongs to the day, not to the workout
w.startFromSheet();
ok(ev('session.id') === "spark-rtr-phase1:w1:Monday",
   "it runs against the day, so the calendar knows: " + ev("session.id"));
ok(ev("session.name") === "Strength for Runners", "under the workout's name");
ok(ev("session.planName") === "Return to Run", "and the plan's");
ev(`session.steps = [{text:"Go",kind:"lift",sec:1,start:0,end:1}]; setLead(0); mainButton();`);

setTimeout(() => {
  const ok2=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  ok2(d.querySelector(".screen.active").id === "done", "it finishes like anything else");
  ok2(!!ev('progress["spark-rtr-phase1:w1:Monday"]'), "which ticks the day off in the plan");
  w.leaveRun();
  const cell = $("plan-weeks").querySelector(".cell.str");
  ok2(cell.classList.contains("done"), "and the cell is marked in the calendar");

  // and it can be reached again from Recent
  w.showScreen("home"); w.renderHome();
  const row = $("recent-slot").querySelector(".hit");
  ok2(!!row && row.querySelector("b").textContent === "Strength for Runners",
      "the finished strength day turns up in Recent");
  tap(row);
  ok2($("sheet-title").textContent === "Week 1 – Monday" &&
      d.querySelector(".screen.active").id === "plan",
      "and opens the same day of the plan again: " + $("sheet-title").textContent);

  // a rest day is still only a rest day
  w.closeSheet();
  const wed = [...$("plan-weeks").querySelectorAll(".cell.off")];
  ok2(wed.length === 12 && !wed[0].getAttribute("data-sel"),
      "the rest days are untouched by any of this: " + wed.length);
}, 1200);
