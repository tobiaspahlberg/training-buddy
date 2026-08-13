/* The editor: putting blocks in order, work lists, and circuits. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const active=()=>d.querySelector(".screen.active").id;
const blocks=()=>[...$("edit-blocks").children];
const heads=()=>blocks().map(b => b.querySelector("b").textContent);
const names=()=>ev("editing.blocks.map(b => b.text || b.type).join(',')");
const tap = el => { el.dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
                    el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); };

// =====================================================================
// Putting a session in order
// =====================================================================
w.newProgram("Training");
ok(active() === "editor", "a new session opens in the editor");
ok(names() === "", "with nothing in it: " + JSON.stringify(names()));
ok($("edit-total").textContent === "Total 0 min – 0 steps",
   "and says as much: " + $("edit-total").textContent);
/* Each button says underneath what the block is, which is where the three
   are told apart. */
const adders = [...d.querySelectorAll(".addrow .btn")];
ok(adders.length === 3, "three ways to add a block");
ok(adders.map(b => b.querySelector("small").textContent).join(" / ") ===
   "one timed thing / two, repeated / many, in rounds",
   "each explained: " + adders.map(b => b.querySelector("small").textContent).join(" / "));

tap(adders[0]); tap(adders[1]); tap(adders[0]);
ev(`editing.blocks[0].text = "Warm-up walk"; editing.blocks[2].text = "Cool-down walk";
    renderBlocks();`);
ok(names() === "Warm-up walk,repeat,Cool-down walk", "built by hand: " + names());
ok(heads().join(",") === "Step,Interval,Step", "and they say what they are: " + heads());

const mv = i => blocks()[i].querySelectorAll(".mv");
ok(mv(0)[0].disabled && !mv(0)[1].disabled, "the first block cannot go up");
ok(!mv(2)[0].disabled && mv(2)[1].disabled, "the last cannot go down");

w.moveBlock(2, -1);
ok(names() === "Warm-up walk,Cool-down walk,repeat", "the cool-down moved up: " + names());
w.moveBlock(1, 1);
ok(names() === "Warm-up walk,repeat,Cool-down walk", "and back down again: " + names());
w.moveBlock(0, -1); w.moveBlock(2, 1);
ok(names() === "Warm-up walk,repeat,Cool-down walk", "moving off either end does nothing");
tap(mv(1)[0]);
ok(names() === "repeat,Warm-up walk,Cool-down walk", "the arrow itself works: " + names());
w.moveBlock(0, 1);

// =====================================================================
// A circuit
// =====================================================================
w.addBlock("circuit");
ok(ev("editing.blocks.length") === 4, "a circuit is a block like any other");
ok(heads()[3] === "Circuit", "and says so: " + heads()[3]);
const c = () => ev("editing.blocks[3]");
ok(c().rounds === 3 && c().names.length === 3, "three rounds of three stations to start");
ok(ev("flatten([editing.blocks[3]]).length") === 3 * 3 + (3 * 3 - 1),
   "nine work steps and eight rests: " + ev("flatten([editing.blocks[3]]).length"));
ok(ev("totalSec([editing.blocks[3]])") === 9 * 40 + 8 * 20,
   "which is the total: " + ev("totalSec([editing.blocks[3]])"));
ok(ev("flatten([editing.blocks[3]])[16].text") === "Station 3",
   "and it ends on the work, not on a rest: " + ev("flatten([editing.blocks[3]])[16].text"));
ok(ev("flatten([editing.blocks[3]])[0].reps") === 3,
   "each step knows which round it is in, so the screen can say");

w.setNames(3, "Row\n\nPress\n  Squat  \n");
ok(JSON.stringify(c().names) === '["Row","Press","Squat"]',
   "stations are typed one per line, blanks and stray spaces dropped: " + JSON.stringify(c().names));
w.setField("3.rounds", "4");
ok(c().rounds === 4 && typeof c().rounds === "number", "rounds is a number, not the text of one");
w.setSec(3, "workSec", "m", 1);
w.setSec(3, "restSec", "s", 15);
ok(c().workSec === 100 && c().restSec === 15, "work and rest are set apart: " +
   c().workSec + " / " + c().restSec);
ok(ev("totalSec([editing.blocks[3]])") === 12 * 100 + 11 * 15, "and the total follows");
ok($("edit-total").textContent.includes("steps"), "the running total is shown: " + $("edit-total").textContent);
ok(blocks()[3].querySelector("textarea").value === "Row\nPress\nSquat",
   "the box holds what was typed");
ok(blocks()[3].querySelectorAll("select")[0].value === "lift",
   "a circuit is strength unless told otherwise: " + blocks()[3].querySelectorAll("select")[0].value);

// it survives being saved and opened again
$("edit-name").value = "Circuit test";
w.saveProgram();
ok(ev("programs.length") === 1, "saved");
ok(ev("JSON.parse(localStorage.getItem('tb.programs'))[0].blocks[3].type") === "circuit",
   "the circuit is stored as a circuit, not as thirty loose steps");
w.editProgram(ev("programs[0].id"));
ok(ev("editing.blocks[3].names.length") === 3, "and comes back whole");
w.cancelEdit();

// =====================================================================
// A work list is yours to change
// =====================================================================
w.openCategory("Training");
w.openProgram("wod-team-amrap-25");
w.copyToMine();
ok(active() === "editor", "a built-in workout copied out opens in the editor");
const list = () => ev("editing.blocks[0].list");
ok(list().length === 10, "the work list came with it: " + list().length);
const box = () => blocks()[0].querySelector("textarea");
ok(!!box(), "and it is a box you can type in, not a read-only panel");
ok(box().value.split("\n").length === 10, "with a line for each movement");

w.setList(0, "50 burpees\n50 pull-ups");
ok(JSON.stringify(list()) === '["50 burpees","50 pull-ups"]', "typing over it replaces it: " + JSON.stringify(list()));
ok(ev("flatten(editing.blocks)[0].list.length") === 2, "and the clock would show the new one");

w.setList(0, "   \n  ");
ok(ev("editing.blocks[0].list") === undefined, "emptying it makes it a plain step again");
ok(!blocks()[0].querySelector("textarea"), "the box goes with it");
const add = blocks()[0].querySelector(".act");
ok(!!add && add.textContent.includes("Work list"), "and there is a way to add one back: " +
   (add ? add.textContent : "none"));
tap(add);
ok(Array.isArray(ev("editing.blocks[0].list")) && ev("editing.blocks[0].list.length") === 0,
   "which opens an empty box");
w.setList(0, "One thing\nAnother");
ok(ev("editing.blocks[0].list.length") === 2, "ready to be filled in");
$("edit-name").value = "List test";
w.saveProgram();
ok(ev("programs.length") === 2, "saved as a session of its own");

// =====================================================================
// One of your own opens like anything else
// =====================================================================
w.openCategory("Training");
/* Two of mine sit in Training now, so pick the one by name rather than by
   the order the list happens to be in. */
const mine = name => [...$("cat-body").querySelectorAll('[data-open^="prog:"]')]
  .find(el => el.querySelector("h3").textContent.indexOf(name) === 0);
tap(mine("List test"));
ok($("sheet").classList.contains("show"), "tapping your own session opens its details");
ok(!$("sheet").textContent.includes("undefined"), "with nothing missing from them");
ok($("sheet-steps").textContent.includes("One thing"), "the work list is in there");
ok($("sheet-start").style.display !== "none", "Start is there, as a second tap");
ok($("sheet-edit").style.display !== "none", "so is Edit");
ok($("sheet-copy").style.display !== "none", "and Copy");
ok($("sheet-mark").style.display !== "none", "and the tick");

w.editFromSheet();
ok(active() === "editor" && ev("editing.name") === "List test",
   "the pencil opens the right session: " + ev("editing.name"));
w.cancelEdit();

tap(mine("List test"));
w.copyToMine();
ok(active() === "editor" && ev("editing.name").includes("(copy)"),
   "Copy makes a copy of your own session: " + ev("editing.name"));
w.cancelEdit();

tap(mine("List test"));
w.startFromSheet();
ok(active() === "run", "and Start runs it");
ok($("run-title").textContent === "List test", "the one that was open: " + $("run-title").textContent);
ev("stopTicker(); session = null;");

// the ticks still work from the sheet
w.openCategory("Training");
tap(mine("List test"));
w.toggleDone();
ok(ev("progress['" + ev("programs[0].id") + "'] || progress['" + ev("programs[1].id") + "']") !== undefined,
   "the tick in the sheet marks it done");

// =====================================================================
// The back button arms itself again
// =====================================================================
ev("backArmed = false; armBack();");
ok(ev("backArmed") === true,
   "a spare history entry is armed, so a back press reaches goBack() on the web too");

// =====================================================================
// Duplicating, quick lengths, colour, templates, and getting out
// =====================================================================
w.openCategory("Training");
w.newProgram("Training");

// ---- a template to start from ----
const starts = () => [...$("edit-start").querySelectorAll(".chip")].map(b => b.textContent);
ok(starts().join(" · ") === "Run / walk intervals · Warm-up, work, cool-down · Circuit",
   "an empty session is offered three shapes: " + starts().join(" · "));
ok($("edit-preview").innerHTML === "", "and has nothing to draw yet");
ok($("edit-save-foot").style.display === "none",
   "nor anything to save, so no Save button either");
tap($("edit-start").querySelector(".chip"));
ok(ev("editing.blocks.length") === 3, "one fills the session in: " + names());
ok(ev("editing.blocks[1].reps") === 6, "with the intervals in the middle");
ok(starts().length === 0, "and the offer goes once there is something there");
ok($("edit-preview").querySelector(".mini").children.length === ev("flatten(editing.blocks).length"),
   "the preview draws one bar per step");

// ---- duplicating ----
w.copyBlock(1);
ok(ev("editing.blocks.length") === 4, "a block can be duplicated");
ok(ev("editing.blocks[2].type") === "repeat" && ev("editing.blocks[3].text") === "Cool-down walk",
   "and the copy lands directly under the one it came from: " + names());
ev("editing.blocks[2].a.text = 'Sprint'; renderBlocks();");
ok(ev("editing.blocks[1].a.text") === "Run",
   "changing the copy leaves the original alone");
w.removeBlock(2);

// ---- quick lengths ----
const chips = i => [...blocks()[i].querySelectorAll(".chips")[0].querySelectorAll(".chip")];
ok(chips(0).map(c => c.textContent).join(" ") === "20s 30s 45s 1m 1m 30s 2m 5m 10m",
   "a step offers the lengths worth a tap: " + chips(0).map(c => c.textContent).join(" "));
ok(chips(0).filter(c => c.classList.contains("on")).length === 1 &&
   chips(0).find(c => c.classList.contains("on")).textContent === "5m",
   "the one it is set to is filled in");
tap(chips(0).find(c => c.textContent === "45s"));
ok(ev("editing.blocks[0].sec") === 45, "tapping one sets it: " + ev("editing.blocks[0].sec"));
ok(chips(0).find(c => c.classList.contains("on")).textContent === "45s", "and moves the mark");
ok(blocks()[0].querySelectorAll("input[type=number]")[1].value === "45",
   "the boxes agree: " + blocks()[0].querySelectorAll("input[type=number]")[1].value);

// the recovery side of an interval is offered shorter ones
const restChips = [...blocks()[1].querySelectorAll(".chips")[1].querySelectorAll(".chip")];
ok(restChips[0].textContent === "10s", "a recovery starts lower down: " + restChips[0].textContent);

// ---- colour by kind ----
const edge = i => blocks()[i].style.borderLeftColor;
ok(edge(0) === "var(--warm)", "a warm-up block wears amber: " + edge(0));
ok(edge(1) === "var(--run)", "an interval wears the colour of its work side: " + edge(1));
ev("editing.blocks[0].kind = 'hold'; renderBlocks();");
ok(edge(0) === "var(--hold)", "and it follows the type: " + edge(0));

// ---- saving needs a name ----
w.saveProgram();
ok($("dlg-title").textContent === "It needs a name", "saving without a name says so");
$("dlg-ok").onclick();
ok(!$("overlay").classList.contains("show"), "the dialog goes");
ok(ev("programs.length") === 2, "and nothing was saved");
ok(active() === "editor", "you are left where you were, with what you typed");

// ---- save from the foot of the screen as well as the corner ----
const foot = $("edit-save-foot");
ok(foot.style.display === "block", "there is a Save at the bottom, where a long session ends");
$("edit-name").value = "Made by hand";
tap(foot);
ok(active() === "category" && ev("programs.length") === 3, "and it saves: " + ev("programs.length"));

// ---- backing out of changes asks first ----
w.editProgram(ev("programs[2].id"));
w.cancelEdit();
ok(active() === "category", "leaving something untouched asks nothing");

w.editProgram(ev("programs[2].id"));
w.addBlock("step");
w.cancelEdit();
ok($("dlg-title").textContent === "Leave without saving?", "leaving a changed one asks");
w.closeDialog();
ok(active() === "editor" && ev("editing.blocks.length") === 4,
   "Cancel keeps you there, with the change");
w.cancelEdit();
$("dlg-ok").onclick();
ok(active() === "category", "Leave leaves");
ok(ev("programs[2].blocks.length") === 3, "and the change was not kept: " + ev("programs[2].blocks.length"));

// typing in the name alone counts as a change
w.editProgram(ev("programs[2].id"));
$("edit-name").value = "Renamed";
w.cancelEdit();
ok($("dlg-title").textContent === "Leave without saving?", "so does a name nobody saved");
$("dlg-ok").onclick();
ok(ev("programs[2].name") === "Made by hand", "which is also not kept: " + ev("programs[2].name"));

// =====================================================================
// The three add buttons, and the example name
// =====================================================================
/* jsdom has no layout engine, so an equal height cannot be measured here.
   What can be checked is the rule that made them unequal: .btn+.btn stacks
   buttons down a screen with a gap, which inside a grid pushed the second
   and third cell down and left the first standing taller. */
const css = fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"), "utf8")
  .match(/\.addrow \.btn\{([^}]*)\}/)[1];
ok(/margin-top:0/.test(css), "the add buttons cancel the stacking margin: " + css);
ok(adders.every(b => b.querySelector("small").textContent.length <= 16),
   "and none of the labels is long enough to wrap: " +
   adders.map(b => b.querySelector("small").textContent).join(" / "));

w.newProgram("Rehab");
ok($("edit-name").placeholder === "e.g. Achilles exercises",
   "a rehab session suggests a rehab name: " + $("edit-name").placeholder);
$("edit-category").value = "Strength";
w.nameHint();
ok($("edit-name").placeholder === "e.g. Legs and core",
   "changing the category changes the suggestion: " + $("edit-name").placeholder);
w.newProgram("Mobility");
ok($("edit-name").placeholder === "e.g. Morning stretch",
   "and it is set when the editor opens: " + $("edit-name").placeholder);
ev("editing = null;");
