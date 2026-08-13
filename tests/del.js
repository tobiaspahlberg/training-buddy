const fs = require("fs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  { runScripts:"dangerously", url:"https://example.org/" });
const w = dom.window, d = w.document, ev = e => w.eval(e);
const $ = id => d.getElementById(id);
const active = () => d.querySelector(".screen.active").id;
const ok = (c,m) => console.log((c?"  ok  ":"FAIL  ")+m);
const errs = []; w.addEventListener("error", e => errs.push(e.message));

const tap = el => {
  el.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles:true }));
  el.dispatchEvent(new w.MouseEvent("pointerup", { bubbles:true }));
  el.dispatchEvent(new w.MouseEvent("click", { bubbles:true }));
};
const press = el => {
  el.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles:true }));
  return new Promise(r => setTimeout(r, 600));
};

// two of my own programs
["Alpha","Beta"].forEach(n => {
  w.newProgram("crossfn");
  w.addBlock("step");
  $("edit-name").value = n;
  w.saveProgram();
});
w.openCategory("crossfn");
const cards = () => [...$("cat-body").querySelectorAll("[data-open]")];
ok(cards().length === 11, "9 built-in workouts + 2 own programs: " + cards().length);
const bins = () => [...$("cat-body").querySelectorAll(".trash")];
ok(bins().length === 2, "a bin on each of my two programs, and nowhere else: " + bins().length);
ok(bins().every(b => b.dataset.act === "drop-prog"), "each bin knows what it drops");

const own = () => cards().filter(c => c.dataset.open.startsWith("prog:"));
const wod = () => cards().filter(c => c.dataset.open.startsWith("wod:"))[0];

(async () => {
  // hold a built-in workout: nothing happens
  await press(wod());
  ok(!$("overlay").classList.contains("show"), "a built-in workout cannot be deleted");

  // hold my own: confirm, then it is gone
  await press(own()[0]);
  ok(!$("overlay").classList.contains("show"), "holding my own no longer stops to ask");
  ok(ev("programs.length") === 1, "it just goes");
  ok(own().length === 1 && own()[0].querySelector("h3").textContent === "Beta", "the right one went");
  ok($("undo").classList.contains("show"), "and an undo offer comes up");
  ok($("undo-text").textContent === 'Deleted "Alpha"', "naming it: " + $("undo-text").textContent);

  // and it can be taken back, into the place it came from
  w.undoDelete();
  ok(ev("programs.length") === 2, "undo puts it back");
  ok(ev("programs[0].name") === "Alpha", "in the order it was in: " + ev("programs.map(p=>p.name).join()"));
  ok(!$("undo").classList.contains("show") || $("undo").classList.contains("quiet"),
     "and the offer is spent");
  w.hideUndo();

  await press(own()[0]);
  ok(ev("programs.length") === 1, "deleted again for the rest of the test");

  // a plain tap opens it, and the press before it is not a delete
  tap(own()[0]);
  ok($("sheet").classList.contains("show"), "tap still opens the program");
  w.startFromSheet();
  ok(active() === "run", "and Start in the sheet runs it");
  ev("session = null;"); w.openCategory("crossfn");

  // the Edit link is not a delete target, and still edits
  const edit = $("cat-body").querySelector('[data-act="edit"]');
  await press(edit);
  ok(!$("overlay").classList.contains("show"), "holding Edit does not delete");
  tap(edit);
  ok(active() === "editor", "Edit still opens the editor");
  w.cancelEdit();

  // the calendar gestures still work after the refactor
  w.openPlan("spark-rtr-phase1");
  const day = $("plan-weeks").querySelector("[data-d]");
  tap(day);
  ok($("sheet").classList.contains("show"), "tapping a day still opens it");
  w.closeSheet();
  await press($("plan-weeks").querySelector("[data-d]"));
  ok(ev("selectMode") === true, "holding a day still starts select mode");
  ok(ev("Object.keys(selected).length") === 1, "with that day picked");

  console.log(errs.length ? "\nERRORS: " + errs.join("; ") : "\nno uncaught errors");
})();
