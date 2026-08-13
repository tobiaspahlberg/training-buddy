const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window, d=w.document, ev=e=>w.eval(e);
const $=id=>d.getElementById(id);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

w.openCategory("Rehab");
ok($("cat-body").textContent.includes("Strength for Runners"), "it shows up under Rehab");
ok($("cat-body").textContent.includes("Return to Run"), "next to the plan it belongs with");
ok(!ev('JSON.stringify(programsIn("Training"))').includes("Strength for Runners"), "and not under Training");

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
