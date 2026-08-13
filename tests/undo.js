const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const errs=[]; w.addEventListener("error",e=>errs.push(e.message));
const tap = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                    el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); };
const bar = () => $("undo");
const offering = () => bar().classList.contains("show") && !bar().classList.contains("quiet");
const text = () => $("undo-text").textContent;
const bins = () => [...$("cat-body").querySelectorAll('[data-act="drop-prog"]')];

const make = n => { w.newProgram("Strength"); w.addBlock("step");
                    $("edit-name").value = n; w.saveProgram(); };
["One","Two","Three"].forEach(make);
w.openCategory("Strength");
ok(ev("programs.length") === 3, "three sessions to play with");

// 1st delete
tap(bins()[0]);
ok(offering(), "first delete offers Undo");
ok(text() === 'Deleted "One"', "naming it: " + text());
w.undoDelete();
ok(ev("programs.length") === 3, "undo restores it");
ok(bar().classList.contains("quiet"), "the confirmation has no button to press");
ok(text() === '"One" is back', "and says so: " + text());

// 2nd delete IMMEDIATELY after an undo - this is the bug from the screenshot
tap(bins()[0]);
ok(offering(), "the delete right after an undo still offers Undo");
ok(text() === 'Deleted "One"', "with the name: " + text());
ok(!bar().classList.contains("quiet"), "the wordless state did not stick");
w.undoDelete();
ok(ev("programs.length") === 3, "and that undo works too");

// 3rd, 4th, 5th - it must not decay
for(let i = 3; i <= 6; i++){
  tap(bins()[0]);
  const good = offering() && text().indexOf("Deleted") === 0;
  ok(good, "delete number " + i + " still offers Undo");
  w.undoDelete();
  ok(ev("programs.length") === 3, "  and undo number " + i + " restores it");
}

// deleting twice in a row: only the last one can come back
tap(bins()[0]);
tap(bins()[0]);
ok(ev("programs.length") === 1, "two deletes in a row take two");
ok(text() === 'Deleted "Two"', "the offer is for the last one: " + text());
w.undoDelete();
ok(ev("programs.length") === 2, "and only that one comes back");
ok(ev('programs.map(p => p.name).join()') === "Two,Three", "in its old place: " + ev('programs.map(p=>p.name).join()'));

// undo with nothing held does nothing
w.hideUndo();
w.undoDelete();
ok(ev("programs.length") === 2, "undo with nothing held is a no-op");

// the offer does not follow you to another screen
tap(bins()[0]);
ok(offering(), "offer up");
w.showScreen("home");
ok(!bar().classList.contains("show"), "and gone once you leave the list");
ok(ev("undone") === null, "with nothing left held");

// a plan and a session can both be taken back
w.openPlan("spark-rtr-phase1"); w.copyPlan(); $("dlg-ok").onclick();
w.openCategory("Rehab");
const planBin = $("cat-body").querySelector('[data-act="drop-plan"]');
tap(planBin);
ok(ev("myPlans.length") === 0 && offering(), "a plan copy goes with an offer too");
w.undoDelete();
ok(ev("myPlans.length") === 1, "and comes back");

console.log(errs.length ? "\nERRORS: "+errs.join("; ") : "\nno uncaught errors");

// --- the bar must not sit on top of the last button in the list ---
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  ok2(ev("UNDO_MS") === 5000, "the offer stands for five seconds: " + ev("UNDO_MS"));
  w.openCategory("Strength");
  ok2(!d.body.classList.contains("undo-up"), "no room given while nothing is shown");
  tap($("cat-body").querySelector('[data-act="drop-prog"]'));
  ok2(d.body.classList.contains("undo-up"), "the list makes room while the bar is up");
  const css = fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
  ok2(/body\.undo-up \.scroll\{padding-bottom:96px\}/.test(css),
      "which is padding at the foot, so the last button can still be scrolled to");
  w.undoDelete();
  w.hideUndo();
  ok2(!d.body.classList.contains("undo-up"), "and takes it back when the bar goes");
}, 60);
