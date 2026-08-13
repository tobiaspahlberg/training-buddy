const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const active=()=>d.querySelector(".screen.active").id;
const errs=[]; w.addEventListener("error",e=>errs.push(e.message));
const tap = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                    el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); };

// ---- back out of a workout lands where it started ----
w.openCategory("crossfn");
w.openProgram("wod-team-amrap-25"); w.startFromSheet();
ok(active() === "run", "started a workout from a category");
w.confirmQuit();
ok(active() === "category" && $("cat-title").textContent === "Cross-functional",
   "quitting before the clock starts goes back to the category, not home");

w.openCategory("rehab");
w.openPlan("spark-rtr-phase1");
tap($("plan-weeks").querySelector("[data-d]"));
w.startFromSheet();
w.setLead(0); w.mainButton();                       // actually running now
w.confirmQuit();
ok($("overlay").classList.contains("show"), "a running session asks before it stops");
$("dlg-ok").onclick();
ok(active() === "plan" && $("plan-name").textContent.includes("Return to Run"),
   "and stopping goes back to the plan the day came from");

// the summary screen goes back the same way
w.openPlan("spark-rtr-phase1");
tap($("plan-weeks").querySelector("[data-d]"));
w.startFromSheet();
ev("session.steps = [{text:'Go',kind:'run',sec:1,start:0,end:1}]; setLead(0); mainButton();");
setTimeout(() => {
  ok(active() === "done", "session finished");
  w.leaveRun();
  ok(active() === "plan", "Done on the summary goes back to the plan too");

  // a session resumed after the app was killed has nowhere to go but home
  ev("openPlanId = null; currentCategory = null;");
  w.leaveRun();
  ok(active() === "home", "with no history behind it, back means home");

  // ---- bins ----
  w.openCategory("rehab");
  ok($("cat-body").querySelectorAll(".trash").length === 0, "nothing of mine yet, so no bins");
  w.newProgram("rehab"); w.addBlock("step"); $("edit-name").value = "Mine"; w.saveProgram();
  const bin = $("cat-body").querySelector(".trash");
  ok(!!bin, "my new program has a bin");
  ok(bin.title === "Delete Mine", "titled with its name: " + bin.title);
  ok($("cat-body").querySelectorAll(".cardtop").length === 2, "every card has a top row: " +
     $("cat-body").querySelectorAll(".cardtop").length);

  tap(bin);
  ok(ev("programs.length") === 0, "the bin drops it at once");
  ok($("undo").classList.contains("show"), "and offers to undo");
  w.undoDelete();
  ok(ev("programs.length") === 1, "which puts it back");
  w.hideUndo();
  tap($("cat-body").querySelector(".trash"));
  ok(ev("programs.length") === 0, "gone again");

  // tapping a bin must not also open the card
  w.newProgram("rehab"); w.addBlock("step"); $("edit-name").value = "Mine again"; w.saveProgram();
  tap($("cat-body").querySelector(".trash"));
  ok(active() === "category", "the tap did not start the session underneath");
  w.hideUndo();

  // ---- size at a glance ----
  w.openCategory("crossfn");
  const cards = [...$("cat-body").querySelectorAll(".card")];
  console.log("\n  Cross-functional, by width:");
  cards.forEach(c => {
    const bar = c.querySelector(".mini,.span");
    if(!bar) return;
    const pct = +bar.getAttribute("style").match(/width:(\d+)%/)[1];
    const kind = bar.className === "span" ? "plan" : "prog";
    console.log("    " + kind + "  " + String(pct).padStart(3) + "%  " +
      ("#".repeat(Math.round(pct/4))).padEnd(26) +
      c.querySelector("p").textContent.split("–")[0].split("·").slice(-1)[0].trim().slice(0,14).padEnd(15) +
      c.querySelector("h3").textContent.replace(/Built in|Copy/,""));
  });

  const bar = n => { const c = cards.find(x => new RegExp(n).test(x.textContent));
                     return +c.querySelector(".mini,.span").getAttribute("style").match(/width:(\d+)%/)[1]; };
  ok(bar("Row Your Boat") === 100, "the longest session in the category fills the row");
  // order is kept, and the sessions still tell each other apart
  ok(bar("21-15-9") < bar("Team of 2"), "15 min reads shorter than 25");
  ok(bar("Team of 2") < bar("Deck of Cards"), "25 shorter than 40");
  ok(bar("Deck of Cards") <= bar("Row Your Boat"), "40 no longer than 41");
  ok(bar("Row Your Boat") - bar("21-15-9") > 15,
     "and 15 against 41 is a visible gap: " + bar("21-15-9") + "% to " + bar("Row Your Boat") + "%");

  /* A plan against a session, on the one axis they share. They live in
     different categories now, so the comparison is made where both are:
     the 5K plan and a twenty minute session of my own, in Cardio. */
  w.newProgram("cardio");
  ev("editing.blocks = [{type:'step',text:'Easy',kind:'run',sec:1200}];");
  $("edit-name").value = "Twenty easy";
  w.saveProgram();
  const cardio = [...$("cat-body").querySelectorAll(".card")];
  const wide = n => { const c = cardio.find(x => new RegExp(n).test(x.textContent));
                      return +c.querySelector(".mini,.span").getAttribute("style").match(/width:(\d+)%/)[1]; };
  ok(wide("How to Start Running") === 100, "the plan fills the row");
  ok(wide("Twenty easy") < 45, "and a single session is well short of it: " + wide("Twenty easy"));
  ok(wide("How to Start Running") > wide("Twenty easy") * 2,
     "a plan reads as a different order of thing, not a slightly longer one");

  // a program shows its shape, a plan does not
  const amrap = cards.find(x => /Team of 2/.test(x.textContent));
  const plan  = cardio.find(x => /How to Start Running/.test(x.textContent));
  ok(amrap.querySelector(".mini") && !amrap.querySelector(".span"), "a session draws its steps");
  ok(plan.querySelector(".span") && !plan.querySelector(".mini"), "a plan is one solid block");
  ok(amrap.querySelectorAll(".mini i").length === 1, "the AMRAP is one long block: " +
     amrap.querySelectorAll(".mini i").length + " step");
  const intervals = cards.find(x => /Couplets/.test(x.textContent));
  ok(intervals.querySelectorAll(".mini i").length === 37, "the 40/20 workout draws 37: " +
     intervals.querySelectorAll(".mini i").length);

  // hours, once minutes stop reading
  ok(ev("fmtSpan(1500)") === "25 min" && ev("fmtSpan(5400)") === "1 h 30 min" &&
     ev("fmtSpan(7200)") === "2 h", "long spans read as hours: " +
     [ev("fmtSpan(1500)"), ev("fmtSpan(5400)"), ev("fmtSpan(7200)")].join(", "));
  ok($("cat-body").textContent.includes("in all"), "the plan writes its total out");

  console.log(errs.length ? "\nERRORS: "+errs.join("; ") : "\nno uncaught errors");
}, 1400);

// --- the bug from the screenshot: a copy drew a shorter bar than its original
// because the bin narrowed the column the bar was measured inside ---
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  w.openPlan("spark-rtr-phase1"); w.copyPlan(); $("dlg-ok").onclick();
  w.openCategory("rehab");
  const plans = [...$("cat-body").querySelectorAll('[data-open^="plan:"]')];
  const pct = c => +c.querySelector(".span").getAttribute("style").match(/width:(\d+)%/)[1];
  ok2(plans.length === 2, "the plan and its copy are both listed");
  ok2(pct(plans[0]) === pct(plans[1]),
      "two plans of the same length draw the same bar: " + pct(plans[0]) + "% and " + pct(plans[1]) + "%");
  ok2(!!plans[1].querySelector(".trash") && !plans[0].querySelector(".trash"),
      "even though only one of them has a bin");
  // the bar is a child of the card, not of the text column beside the bin
  ok2(plans[1].querySelector(".span").parentElement === plans[1],
      "the bar hangs off the card itself, so the bin cannot shorten it");
  ok2(plans[1].querySelector(".trash").closest(".cardtop") === plans[1].querySelector(".cardtop"),
      "and the bin sits in the row above it");
}, 1600);
