const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const errs=[]; w.addEventListener("error",e=>errs.push(e.message));

// --- icons in the plan header ---
w.openCategory("Rehab");
w.openPlan("spark-rtr-phase1");
const sel = $("select-btn"), cp = $("plan-copy");
ok(sel.querySelector("svg") && sel.innerHTML.includes("M4 20h4"), "the select button is a pencil");
ok(sel.title === "Tick several days off", "with a title saying what it does");
ok(cp.querySelector("svg") && cp.innerHTML.includes("rect"), "and there is a copy icon beside it");
ok(cp.title === "Copy this plan to my plans", "titled too");
ok(!$("plan-weeks").textContent.includes("Copy this plan"), "the old copy button is gone from the body");

w.toggleSelectMode();
ok(sel.classList.contains("on"), "picking days fills the pencil button in");
ok(sel.innerHTML.includes("M6 6l12 12"), "and turns it into a cross");
ok(cp.style.display === "none", "copy steps aside while picking");
w.toggleSelectMode();
ok(!sel.classList.contains("on") && cp.style.display === "flex", "and comes back after");

// the copy icon still copies
w.copyPlan(); $("dlg-ok").onclick();
ok(ev("myPlans.length") === 1, "the header copy button still makes a copy");
const copyId = ev("myPlans[0].id");

// --- colour ---
w.openCategory("Rehab");
ok($("cat-title").innerHTML.includes("var(--walk)"), "Rehab's name carries its colour: " + $("cat-title").innerHTML.slice(0,60));

const cards = [...$("cat-body").querySelectorAll(".card")];
const edge = c => c.getAttribute("style").match(/border-left:\d+px solid ([^;"]+)/)[1];
const width = c => +c.getAttribute("style").match(/border-left:(\d+)px/)[1];
const wash = c => /background:rgba/.test(c.getAttribute("style"));
console.log("\n  Rehab cards:");
cards.forEach(c => console.log("    " + edge(c).padEnd(24) +
  (c.querySelector(".tag") ? c.querySelector(".tag").textContent.padEnd(9) : "         ") +
  c.querySelector("h3").textContent.replace(/Built in|Copy/,"")));

const builtIn = cards.find(c => /Return to Run – Phase/.test(c.querySelector("h3").textContent) && !/copy/.test(c.querySelector("h3").textContent));
const copy = cards.find(c => /copy/.test(c.querySelector("h3").textContent));
ok(edge(builtIn).startsWith("rgba"), "a built-in plan gets the faded edge: " + edge(builtIn));
ok(edge(copy) === "var(--walk)", "your own copy gets it in full: " + edge(copy));
ok(copy.querySelector(".tag").textContent === "Copy", "and is tagged Copy");
ok(copy.querySelector(".tag").getAttribute("style").includes("var(--walk)"), "in the category colour");
ok(builtIn.querySelector(".tag").textContent === "Built in", "the built-in one says Built in");
ok(!builtIn.querySelector(".tag").getAttribute("style"), "with no colour on it");

// a Training card should be green, not blue
w.openCategory("Training");
const wod = [...$("cat-body").querySelectorAll(".card")].find(c => /Team of 2/.test(c.textContent));
ok(edge(wod).startsWith("rgba(74,222,128"), "a built-in Training workout is faded green: " + edge(wod));

// --- a plan carries more, and looks it ---
const plan5k = [...$("cat-body").querySelectorAll(".card")].find(c => /How to Start Running/.test(c.textContent));
ok(width(plan5k) === 9, "a plan wears a 9px edge: " + width(plan5k));
ok(width(wod) === 5, "a single session wears 5px: " + width(wod));
ok(wash(plan5k), "the plan gets a wash of its colour");
ok(!wash(wod), "the session does not");
ok(/padding-left:12px/.test(plan5k.getAttribute("style")), "and the padding makes the names line up");
ok(edge(plan5k).startsWith("rgba"), "built-in plan is still the faded shade: " + edge(plan5k));

// --- history dots ---
ev(`history = [
  {id:"wod-team-amrap-25", name:"Team of 2", planName:"", at:"2026-08-10T09:00:00.000Z", sec:1500},
  {id:"spark-rtr-phase1:w1d0", name:"Week 1 – Tuesday", planName:"Return to Run", at:"2026-08-09T09:00:00.000Z", sec:1920},
  {id:"gone-for-good", name:"Deleted program", planName:"", at:"2026-08-08T09:00:00.000Z", sec:600}
];`);
w.openHistory();
const dots = [...$("history-body").querySelectorAll(".dot")].map(x => x.getAttribute("style"));
console.log("\n  history dots: " + dots.map(x=>x.replace("background:","")).join(", "));
ok(dots[0].includes("var(--run)"), "a Training workout gets green");
ok(dots[1].includes("var(--walk)"), "a Rehab plan session gets blue");
ok(dots[2].includes("var(--line)"), "something since deleted gets no colour");

console.log(errs.length ? "\nERRORS: "+errs.join("; ") : "\nno uncaught errors");

// --- a plan's name is set as a heading, a session's is not ---
w.openCategory("Training");
const planCard = [...$("cat-body").querySelectorAll(".card")].find(c => /How to Start/.test(c.textContent));
const sessCard = [...$("cat-body").querySelectorAll(".card")].find(c => /Team of 2/.test(c.textContent));
ok(planCard.classList.contains("plan"), "the plan card is marked as one");
ok(!sessCard.classList.contains("plan"), "the session card is not");
ok(/--accent:var\(--run\)/.test(planCard.getAttribute("style")),
   "the plan carries its category colour: " + planCard.getAttribute("style").slice(0,26));
ok(/--accent:var\(--run\)/.test(sessCard.getAttribute("style")),
   "and so does a session, for its done-today ring");
// the rule is a property of the heading, so it spans the text and nothing else
const css = fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
ok(/\.card\.plan h3\{[^}]*border-bottom:2px solid var\(--accent/.test(css),
   "and the rule under a plan's name is drawn in it");
ok(/\.card\.plan h3\{[^}]*font-size:20\.5px/.test(css), "with the name set a size larger");

// --- Edit and Reset read as buttons, not as prose ---
w.newProgram("Training"); w.addBlock("step"); $("edit-name").value = "Mine"; w.saveProgram();
ev('progress[programs[0].id] = today();');
w.renderCategory();
const mineCard = [...$("cat-body").querySelectorAll(".card")].find(c => /Mine/.test(c.textContent));
const acts = [...mineCard.querySelectorAll(".act")];
ok(acts.length === 2, "a session of mine, done today, offers two actions: " + acts.length);
ok(acts.every(a => a.tagName === "BUTTON"), "both are real buttons");
ok(acts.every(a => a.querySelector("svg")), "both carry an icon");
ok(acts.map(a => a.textContent).join() === "Edit,Reset", "labelled: " + acts.map(a=>a.textContent).join());
ok(!mineCard.querySelector(".link"), "and no bare text links are left on the card");
// built-in, done today: reset only, no edit
ev('progress["wod-deck-of-cards"] = today();');
w.renderCategory();
const wodCard = [...$("cat-body").querySelectorAll(".card")].find(c => /Deck of Cards/.test(c.textContent));
const wodActs = [...wodCard.querySelectorAll(".act")];
ok(wodActs.length === 1 && wodActs[0].textContent === "Reset",
   "a built-in one can only be reset: " + wodActs.map(a=>a.textContent).join());

// --- done today wears the category's colour, not green ---
w.openCategory("Rehab");
ev('progress["rehab-strength-for-runners"] = today();');
w.renderCategory();
const doneCard = [...$("cat-body").querySelectorAll(".card.done")][0];
ok(!!doneCard, "a Rehab session finished today is marked");
ok(/--accent:var\(--walk\)/.test(doneCard.getAttribute("style")),
   "and its ring is Rehab blue: " + doneCard.getAttribute("style").slice(0,24));
ok(/\.card\.done\{border-color:var\(--accent\);background:var\(--tint\)\}/.test(css),
   "the ring and wash both come from the card, not from a fixed green");
ok(/\.card\.done h3::before\{content:"\\2713\\00a0";color:var\(--accent\)\}/.test(css),
   "and so does the tick before the name");
