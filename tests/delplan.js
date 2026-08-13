const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const errs=[]; w.addEventListener("error",e=>errs.push(e.message));
const press = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                      return new Promise(r=>setTimeout(r,600)); };
const card = sel => [...$("cat-body").querySelectorAll("[data-open]")]
                      .find(c => c.dataset.open.startsWith(sel));

(async () => {
  // make a copy of the 5K plan and tick two days off in it
  w.openCategory("Training");
  w.openPlan("spark-beginner-5k");
  w.copyPlan(); $("dlg-ok").onclick();
  const id = ev("myPlans[0].id");
  ev(`progress["${id}:w1d1"]=today(); progress["${id}:w1d2"]=today();`);
  w.openCategory("Training");
  ok(ev("myPlans.length") === 1, "a copy exists");
  ok(!!card("plan:" + id), "the copy has a card");
  const planBins = () => [...$("cat-body").querySelectorAll('[data-act="drop-plan"]')];
  ok(planBins().length === 1, "the copy has a bin and the built-in plan does not: " + planBins().length);
  ok(planBins()[0].dataset.id === id, "and it points at the copy");

  // holding a built-in plan must do nothing
  await press(card("plan:spark-beginner-5k"));
  ok(!$("overlay").classList.contains("show"), "holding a built-in plan does nothing");
  ok(ev("myPlans.length") === 1, "and deletes nothing");

  // holding the copy asks, and says what goes with it
  ev('progress["spark-beginner-5k:w1d1"] = today();');
  await press(card("plan:" + id));
  ok(!$("overlay").classList.contains("show"), "holding the copy no longer asks");
  ok(ev("myPlans.length") === 0, "the copy is deleted");
  ok($("undo").classList.contains("show"), "with an undo offer");

  // a plan takes its ticks with it, and brings them back
  ok(ev(`Object.keys(progress).filter(k => k.indexOf("${id}") === 0).length`) === 0, "ticks gone with it");
  w.undoDelete();
  ok(ev("myPlans.length") === 1, "undo brings the plan back");
  ok(ev(`Object.keys(progress).filter(k => k.indexOf("${id}") === 0).length`) === 2,
     "and the two ticked days with it");
  w.hideUndo();
  await press(card("plan:" + id));
  ok(ev("myPlans.length") === 0, "deleted again");
  ok(ev(`Object.keys(progress).filter(k => k.indexOf("${id}") === 0).length`) === 0, "its ticks went with it");
  ok(ev('!!progress["spark-beginner-5k:w1d1"]'), "the built-in plan's own progress is untouched");
  ok(planBins().length === 0, "no plan bins left once the copy is gone");

  // deleting from inside the plan still works
  w.openPlan("spark-beginner-5k");
  w.copyPlan(); $("dlg-ok").onclick();
  ok(ev("myPlans.length") === 1, "another copy made");
  w.deletePlan();
  ok(ev("myPlans.length") === 0, "and deleted from inside the plan as before");
  ok(d.querySelector(".screen.active").id === "category", "landing back in the category");

  console.log(errs.length ? "\nERRORS: "+errs.join("; ") : "\nno uncaught errors");
})();
