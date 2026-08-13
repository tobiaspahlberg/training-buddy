const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const w = dom.window, d = w.document;

const ev = e => dom.window.eval(e);
const errs = [];
w.addEventListener("error", e => errs.push("JS error: " + e.message));

const $ = id => d.getElementById(id);
// A real tap always sends pointerdown first; the app leans on that.
const tap = el => {
  el.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true }));
  el.dispatchEvent(new w.MouseEvent("pointerup", { bubbles: true }));
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
};
const active = () => d.querySelector(".screen.active").id;
const ok = (cond, msg) => console.log((cond ? "  ok  " : "FAIL  ") + msg);

// --- home is now categories ---
ok(active() === "home", "starts on home");
const cats = [...$("cat-list").querySelectorAll(".catcard h3")].map(x => x.textContent);
ok(JSON.stringify(cats) === '["Training","Rehab","Strength","Mobility","Other"]',
   "home lists every category, empty or not: " + cats);
ok([...$("cat-list").querySelectorAll(".catcard.bare")].length === 3,
   "the three empty ones are dimmed");

// --- category screen ---
w.openCategory("Rehab");
ok(active() === "category", "opening a category switches screen");
ok($("cat-body").textContent.includes("Return to Run"), "Rehab holds the built-in plan");

w.openCategory("Training");
ok($("cat-body").textContent.includes("Team of 2"), "Training holds the AMRAP workout");

// --- built-in workout sheet + run ---
w.openProgram("wod-team-amrap-25");
ok($("sheet").classList.contains("show"), "workout sheet opens");
ok($("sheet-steps").textContent.includes("90 box jump overs"), "work list shown in sheet");
ok($("sheet-mark").style.display !== "none", "a built-in workout can be ticked off by hand");
w.startFromSheet();
ok(active() === "run", "workout starts");
ok($("step-time").textContent === "25:00", "AMRAP is 25 minutes: " + $("step-time").textContent);
w.setLead(0); w.mainButton();
ok($("work-list").textContent.includes("20 pull-ups"), "work list on the run screen");
ok($("run-stage").classList.contains("haslist"), "stage makes room for the list");
ev("stopTicker(); session = null;"); w.showScreen("home");

// --- plan view, long press, select mode ---
w.openCategory("Rehab");
w.openPlan("spark-rtr-phase1");
ok(active() === "plan", "plan opens");
const cells = () => [...$("plan-weeks").querySelectorAll("[data-sel]")];
ok(cells().length === 6 * 5, "6 weeks x (3 run + 2 strength) cells: " + cells().length);
ok($("select-btn").innerHTML.includes("<svg"), "the select button is a drawn pencil");

// tap a day
const runCells = () => [...$("plan-weeks").querySelectorAll("[data-d]")];
tap(runCells()[0]);
ok($("sheet-title").textContent === "Week 1 – Tuesday", "tap opens the day: " + $("sheet-title").textContent);
ok($("sheet-edit").style.display === "none", "built-in session cannot be edited in place");
w.closeSheet();

// long press a day
const press = el => {
  el.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true }));
  return new Promise(r => setTimeout(r, 600));
};

(async () => {
  await press(runCells()[0]);
  ok(ev("selectMode") === true, "long press turns select mode on");
  ok(ev("Object.keys(selected).length") === 1, "the held day is picked");
  ok($("select-btn").classList.contains("on"), "the pencil button fills in");
  ok($("selbar").classList.contains("show"), "the mark bar is up");
  // the click that follows the press must not open the sheet
  runCells()[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  ok(!$("sheet").classList.contains("show"), "the trailing click is swallowed");

  // long press a week number takes the whole row
  const wk = $("plan-weeks").querySelector('[data-week="2"]');
  await press(wk);
  ok(ev("Object.keys(selected).length") === 6, "week press adds 5 more: " + ev("Object.keys(selected).length"));
  w.markSelected(true);
  ok(ev("selectMode") === false, "marking leaves select mode");
  ok(ev("Object.keys(progress).length") === 6, "6 days ticked off");

  // --- copy the whole plan ---
  w.copyPlan();
  $("dlg-ok").onclick();
  ok(ev("myPlans.length") === 1, "a plan copy is stored");
  ok(active() === "plan" && $("plan-name").textContent.includes("(copy)"), "the copy opens");
  ok($("plan-progress").textContent === "0 of 18 sessions done", "the copy has its own progress: " + $("plan-progress").textContent);
  const copyId = ev("myPlans[0].id");
  ok(ev("myPlans[0]").weeks[5].sessions[2].blocks[1].reps === 10, "week 6 Saturday still has 10 intervals");

  // edit one session of the copy
  tap($("plan-weeks").querySelector("[data-d]"));
  ok($("sheet-edit").style.display !== "none", "a copied session can be edited");
  w.editPlanSession();
  ok(active() === "editor" && $("edit-cat-field").style.display === "none", "editor opens without the category field");
  w.setDur(0, null, "m", 5);
  $("edit-name").value = "Week 1 – Tuesday, shorter warm-up";
  w.saveProgram();
  ok(active() === "plan", "saving returns to the plan");
  ok(ev("myPlans[0]").weeks[0].sessions[0].blocks[0].sec === 300, "the edit is stored in the plan");
  ok(ev("myPlans[0]").weeks[0].sessions[0].name.includes("shorter"), "the name is stored too");
  ok(ev("PLANS[0]").weeks[0].runSec === 60, "the built-in plan is untouched");
  const mins = $("plan-weeks").querySelector("[data-d]").textContent;
  ok(mins.startsWith("26"), "the cell shows the new length: " + mins);

  // back out of the plan lands in the category
  w.goBack();
  ok(active() === "category" && $("cat-title").textContent === "Rehab", "back goes to the category");
  ok($("cat-body").textContent.includes("Copy"), "the copy is listed in the category");

  // delete the copy
  w.openPlan(copyId);
  w.deletePlan();
  ok(ev("myPlans.length") === 0, "the copy is deleted, without being asked twice");
  ok(ev("Object.keys(progress).length") === 6, "only the copy's progress went with it");

  // --- own program ---
  w.openCategory("Strength");
  w.newProgram("Strength");
  ok($("edit-category").value === "Strength", "a new program starts in the category it was made in");
  ok(ev("editing.blocks.length") === 0, "and starts empty, with nobody else's session in it");
  $("edit-name").value = "Test";
  w.saveProgram();
  ok($("dlg-title").textContent === "Nothing to save", "an empty session will not save");
  w.closeDialog();
  w.addBlock("step");
  w.saveProgram();
  ok(active() === "category" && $("cat-title").textContent === "Strength", "saving lands in the category");
  ok(ev("programs.length") === 1, "the program is stored");
  w.showScreen("home");
  ok($("cat-list").textContent.includes("Strength"), "the new category shows up on home");

  console.log(errs.length ? "\nERRORS:\n" + errs.join("\n") : "\nno uncaught errors");
})();

// --- every control in the chrome is drawn, none are typed characters ---
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  const btn = $("about-btn");
  ok2(!!btn.querySelector("svg"), "the About button is a drawn icon");
  ok2(!!btn.querySelector("circle"), "with a circle round it");
  ok2(btn.textContent.trim() === "", "and no letter typed into the box: " +
      JSON.stringify(btn.textContent));
  ok2(btn.title === "About", "titled, for anyone the drawing does not reach");
  w.showScreen("home");
  ok2(!!$("about-btn").querySelector("svg"), "and it survives the home screen redrawing itself");

  const chrome = [...d.querySelectorAll("header .iconbtn, .runtop .iconbtn")];
  const typed = chrome.filter(b => b.textContent.trim() !== "");
  ok2(typed.length === 0, "no icon button anywhere is a bare character: " +
      (typed.map(b => b.id || b.textContent.trim()).join(", ") || "none"));
}, 1500);
