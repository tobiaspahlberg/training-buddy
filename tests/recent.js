/* Recent: the last few sessions you actually ran, at the top of home. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"), "utf8");
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

function phone(store){
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.org/",
    beforeParse(win){
      if(store) Object.keys(store).forEach(k => win.localStorage.setItem(k, store[k]));
    }});
  const w=dom.window;
  return { w, d:w.document, ev:e=>w.eval(e), $:i=>w.document.getElementById(i) };
}
const tap = (w, el) => {
  el.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles:true }));
  el.dispatchEvent(new w.MouseEvent("click", { bubbles:true }));
};

// ---- an untouched phone has nothing to show ----
const fresh = phone();
ok(fresh.$("recent-slot").innerHTML === "", "nothing finished yet, so no Recent at all");

// ---- one of each kind, finished ----
const day = "spark-rtr-phase1:w2d1";
/* Dates relative to now, so "Yesterday" is yesterday whenever this is run. */
const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const p = phone({
  "tb.programs": JSON.stringify([
    { id:"mine", name:"My circuit", category:"strength",
      blocks:[{ type:"step", text:"Go", kind:"lift", sec:600 }] }
  ]),
  "tb.history": JSON.stringify([
    { id:"mine", name:"My circuit", planName:"", at:ago(0), sec:600 },
    { id:"wod-deck-of-cards", name:"Deck of Cards", planName:"", at:ago(1), sec:2400 },
    { id:day, name:"Week 2 – Thursday", planName:"Return to Run – Phase 1: Restore",
      at:ago(2), sec:1500 },
    { id:"wod-deck-of-cards", name:"Deck of Cards", planName:"", at:ago(3), sec:2400 },
    { id:"long-since-deleted", name:"Gone", planName:"", at:ago(4), sec:600 }
  ])
});
const rows = () => [...p.$("recent-slot").querySelectorAll(".hit")];
ok(p.$("recent-slot").textContent.indexOf("Recent") === 0, "the section says what it is");
ok(rows().length === 3, "three rows, not the whole history: " + rows().length);
ok(rows().map(r => r.querySelector("b").textContent).join(" · ") ===
   "My circuit · Deck of Cards · Week 2 – Thursday",
   "newest first, one line each: " + rows().map(r => r.querySelector("b").textContent).join(" · "));
ok(rows()[1].querySelector("small").textContent.indexOf("Yesterday") === 0,
   "with when, in the words used everywhere else: " + rows()[1].querySelector("small").textContent);
ok(rows()[1].querySelector("small").textContent.includes("40 min"), "and how long it took");
ok(rows()[2].querySelector("small").textContent.indexOf("Return to Run") === 0,
   "a day of a plan says which plan: " + rows()[2].querySelector("small").textContent);

// the same session twice over is still one row, and a deleted one is no row
ok(!p.$("recent-slot").textContent.includes("Gone"),
   "something deleted since is not offered, because it would open nothing");
ok(p.ev("history.length") === 5, "though the history itself keeps every one of them");

// each row wears the colour of the category it came from
const dot = i => rows()[i].querySelector("i").getAttribute("style");
ok(dot(0).includes("var(--lift)"), "my strength session is pink: " + dot(0));
ok(dot(1).includes("var(--warm)"), "the cross-functional one amber: " + dot(1));
ok(dot(2).includes("var(--walk)"), "the rehab plan blue: " + dot(2));

// ---- tapping one opens it, wherever it lives ----
const active = () => p.d.querySelector(".screen.active").id;
tap(p.w, rows()[0]);
ok(p.$("sheet").classList.contains("show") && p.$("sheet-title").textContent === "My circuit",
   "a tap opens the details, not the clock: " + p.$("sheet-title").textContent);
ok(p.ev("currentCategory") === "strength",
   "and leaves you standing in its category: " + p.ev("currentCategory"));
p.w.startFromSheet();
ok(active() === "run", "Start still starts it");
p.ev("stopTicker(); session = null;");
p.w.showScreen("home");

tap(p.w, rows()[1]);
ok(p.$("sheet-title").textContent === "Deck of Cards", "a built-in workout opens the same way");
p.w.closeSheet();
p.w.showScreen("home");

tap(p.w, rows()[2]);
ok(active() === "plan" && p.$("plan-name").textContent.includes("Return to Run"),
   "a day of a plan opens the plan underneath: " + p.$("plan-name").textContent);
ok(p.$("sheet").classList.contains("show") && p.$("sheet-title").textContent === "Week 2 – Thursday",
   "with that day's sheet on top: " + p.$("sheet-title").textContent);
p.w.closeSheet();
p.w.goBack();
ok(p.d.querySelector(".screen.active").id === "category" &&
   p.$("cat-title").textContent === "Rehab",
   "so backing out lands where the plan actually is: " + p.$("cat-title").textContent);

// ---- finishing something puts it at the top ----
p.w.showScreen("home");
p.ev(`history.unshift({ id:"wod-team-amrap-25", name:"Team of 2 – AMRAP 25 min",
        planName:"", at:new Date().toISOString(), sec:1500 });
      save(KEY_HISTORY, history); renderHome();`);
ok(rows()[0].querySelector("b").textContent === "Team of 2 – AMRAP 25 min",
   "the newest finish leads: " + rows()[0].querySelector("b").textContent);
ok(rows()[0].querySelector("small").textContent.indexOf("Today") === 0, "as today");
ok(rows().length === 3, "and the list stays three long");

// ---- a plan copy keeps its own days ----
const c = phone();
c.w.openPlan("spark-rtr-phase1");
c.w.copyPlan();
c.$("dlg-ok").onclick();
const copyId = c.ev("myPlans[0].id");
c.ev(`history.unshift({ id:"${copyId}:w1d0", name:"Week 1 – Tuesday",
        planName:"My copy", at:new Date().toISOString(), sec:900 });
      save(KEY_HISTORY, history); showScreen("home"); renderHome();`);
const crow = c.$("recent-slot").querySelector(".hit");
ok(!!crow && crow.querySelector("b").textContent === "Week 1 – Tuesday",
   "a day of a copied plan is offered too");
tap(c.w, crow);
ok(c.$("sheet-title").textContent === "Week 1 – Tuesday" &&
   c.ev("openPlanId") === copyId,
   "and it opens the copy, not the plan it was copied from: " + c.ev("openPlanId"));
