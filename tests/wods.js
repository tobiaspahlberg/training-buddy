const fs = require("fs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  { runScripts:"dangerously", url:"https://example.org/" });
const w = dom.window, d = w.document, ev = e => w.eval(e);
const $ = id => d.getElementById(id);
const ok = (c,m) => console.log((c?"  ok  ":"FAIL  ")+m);

const wods = ev("BUILTIN_PROGRAMS.map(p => ({id:p.id, name:p.name, cat:p.category, " +
  "min: totalSec(p.blocks)/60, steps: flatten(p.blocks).length, " +
  "lines: p.blocks.reduce((n,b) => n + (b.list ? b.list.length : 0), 0)}))");
console.log("");
wods.forEach(x => console.log("  " + String(x.min).padStart(3) + " min  " +
  String(x.steps) + " step  " + String(x.lines).padStart(2) + " lines  " + x.name));
console.log("");

ok(wods.length === 11, "eleven built-in workouts");
ok(new Set(wods.map(x => x.id)).size === 11, "ids are unique");
ok(wods.filter(x => x.cat === "Training").length === 9 && wods.filter(x => x.cat === "Rehab").length === 2,
   "nine in Training, two in Rehab");
ok(wods.every(x => x.min > 0 && x.steps > 0), "all have a running clock");

// every workout opens, starts, and shows its list
wods.forEach(x => {
  w.openProgram(x.id);
  const sheet = $("sheet-steps").textContent;
  ok(sheet.length > 0, "sheet lists steps for " + x.name);
  w.startFromSheet();
  w.setLead(0); w.mainButton();
  const shown = $("work-list").textContent;
  ok(true, "  first step: " + ($("step-label").textContent) + (shown ? " + list" : " (no list)"));
  ev("stopTicker(); session = null;");
});

// the sheet shows the note and the warm-up of the one that has one
w.openProgram("wod-row-your-boat-35");
ok($("sheet-when").textContent.includes("I go you go"), "the note explains the format");
ok($("sheet-steps").textContent.includes("Warm-up"), "warm-up is a step of its own");
ok($("sheet-steps").textContent.includes("35:00"), "and the AMRAP is 35 min");

// spot-check translations landed
const all = ev("JSON.stringify(BUILTIN_PROGRAMS)");
["broad jumps","air squats","hip thrusts","gorilla rows","plank knee-to-elbow",
 "box jump overs","devil's press","strict press"].forEach(t =>
  ok(all.includes(t), "translated: " + t));
ok(!/rodd|knäböj|armhävning|utfall|långdhopp|rumplyft|bendrag|knädrag/i.test(all),
   "no Swedish left in the built-ins");

console.log("\ncopy one out to my programs, list and all:");
w.openProgram("wod-deck-of-cards");
w.copyToMine();
$("edit-name").value = "Deck of Cards, my version";
w.saveProgram();
ok(ev("programs[0].blocks[0].list.length") === 5, "the suit list survives the copy");

// --- odd times only where somebody actually chose them ---
console.log("\n  every step length in the built-ins that is not a whole half minute:");
const odd = JSON.parse(ev(`JSON.stringify(
  BUILTIN_PROGRAMS.flatMap(p => flatten(p.blocks)
    .filter(s => s.sec % 30 !== 0)
    .map(s => p.name + " | " + s.text + " | " + s.sec + " s")))`));
odd.forEach(o => console.log("    " + o));
console.log(odd.length ? "" : "    (none)\n");

const strength = ev(`JSON.stringify(flatten(BUILTIN_PROGRAMS.find(p =>
  p.id === "rehab-strength-for-runners").blocks).map(s => s.sec))`);
ok(JSON.parse(strength).every(s => s % 30 === 0),
   "Strength for Runners is all half minutes now: " + strength);
ok(ev(`totalSec(BUILTIN_PROGRAMS.find(p => p.id === "rehab-strength-for-runners").blocks)`) === 1410,
   "which comes to 23:30");

// but a coach's own numbers are untouched
const fourty = ev(`JSON.stringify(flatten(BUILTIN_PROGRAMS.find(p =>
  p.id === "wod-couplets-40-20").blocks).map(s => s.sec).filter(s => s < 60))`);
ok(JSON.parse(fourty).every(s => s === 40 || s === 20),
   "the 40/20 intervals are still 40 and 20: " + [...new Set(JSON.parse(fourty))].join("/"));
ok(odd.every(o => /40 s|20 s/.test(o)),
   "and they are the only odd lengths left anywhere: " + odd.length + " of them");
