/* The drawings: which lines get one, which do not, and that the one the app
   has is a drawing rather than a still. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

// ---- what is held, and where ----
const held = [...d.querySelectorAll("#demos svg[data-demo]")];
ok(held.length === 11, "the app carries " + held.length + " drawings: " +
   held.map(s => s.dataset.demo).join(", "));
ok(!held.some(s => s.dataset.demo === "burpee"),
   "the burpee is drawn but not shipped, because it has not been approved");
ok($("demos").hasAttribute("hidden"),
   "kept out of sight, because a drawing is copied to where it is needed");
ok(held.every(s => s.getAttribute("viewBox")), "each has a view box, so it scales to its row");
const names = new Set(Object.keys(ev("DEMOS")).map(k => ev("DEMOS")[JSON.stringify(k) && k]));
ok([...names].every(n => held.some(s => s.dataset.demo === n)),
   "and every name the table can return is one that is actually here: " + [...names].join(", "));

// ---- they move ----
held.forEach(fig => {
  const what = fig.dataset.demo;
  const anim = fig.querySelectorAll("animate, animateTransform");
  ok(anim.length > 10, what + ": " + anim.length + " animations, not a still");
  ok([...anim].every(a => a.getAttribute("repeatCount") === "indefinite"),
     what + ": every one of them loops, so it is still going when you look up");
  const dur = new Set([...anim].map(a => a.getAttribute("dur")));
  ok(dur.size === 1, what + ": on one clock, or the limbs drift apart – " + [...dur][0]);
  const counts = new Set([...anim].map(a => a.getAttribute("values").split(";").length));
  ok(counts.size === 1, what + ": one frame count throughout, " + [...counts][0] + " frames");
});

// the weight is carried to the hand and turned over, which is two transforms
// and therefore two nested groups: one element can only be given one
const load = held.find(s => s.dataset.demo === "snatch").querySelector(".load");
const kinds = [...load.querySelectorAll("animateTransform")].map(a => a.getAttribute("type"));
ok(JSON.stringify(kinds) === '["translate","rotate"]',
   "the dumbbell is moved and turned, in that nesting: " + kinds.join(", "));
const spin = load.querySelector('animateTransform[type="rotate"]')
  .getAttribute("values").split(";").map(Number);
ok(Math.min(...spin) <= -175 && Math.max(...spin) >= 0,
   "half a turn of it, thumb forward to thumb back: " +
   Math.max(...spin) + "° to " + Math.min(...spin) + "°");

// ---- which lines get one ----
const has = line => ev("demoFor(" + JSON.stringify(line) + ")") !== "";
ok(has("100 air squats"), "the line as a whiteboard writes it: 100 air squats");
ok(has("Air squat") && has("air squats") && has("20 bodyweight squats"),
   "a count, a capital and a plural are all the same movement");
ok(!has("50 goblet squats, kettlebell"),
   "but a goblet squat is a different movement and gets no drawing");
ok(!has("5 bow bend squats"), "and so is a bow bend squat");
ok(!has("50 burpees") && !has("Run 400 m") && !has(""),
   "everything the app has not been drawn for gets nothing, which is honest");

// the snatch, written five ways on four whiteboards
ok(has("30 alternating dumbbell snatches") && has("21 dumbbell snatches, arm 1"),
   "which arm is not which movement, so what follows a comma is set aside");
ok(!has("100 snatches, kettlebell or dumbbell") && !has("Snatches"),
   "but a board that only says 'snatches' has not said with what, and a " +
   "kettlebell snatch is not this drawing");

// the erg: the distance is not part of the movement
const key = l => ev("demoKey(" + JSON.stringify(l) + ")");
ok(key("1000 m row") === "row" && key("50 cal row") === "row" && key("400 m row") === "row",
   "a row is a row however far it is: " + key("1000 m row"));
ok(!has("1000 m row / ski erg") && !has("100 cal row / ski erg"),
   "a line offering two machines is not one of them, and choosing is the app " +
   "deciding for you");
ok(!has("50 renegade rows") && !has("10 gorilla rows"),
   "and a row you do with a dumbbell on the floor is not the machine");

// the near misses, which are the whole point of a table
ok(has("50 push-ups") && has("Push ups") && !has("50 push press"),
   "a push-up and a push press are two different movements");
ok(has("90 box jumps") && !has("90 box jump overs"),
   "and jumping onto a box is not jumping over it");
ok(has("50 walking lunges") && !has("50 overhead lunges") && !has("20 reverse lunges"),
   "a lunge forwards is not a lunge backwards, nor one with a weight overhead");
ok(has("100 strict press") && has("50 wall balls") && has("80 kettlebell swings") &&
   has("20 pull-ups") && has("50 sit-ups"),
   "the rest of what the built-in workouts actually call for");
ok(!has("60 burpees"), "and burpees get nothing, because that drawing is not in yet");

// ---- and where it turns up ----
w.openProgram("wod-total-training-25");
const rows = [...$("sheet-steps").querySelectorAll("div.sub")];
const drawn = rows.filter(r => r.querySelector("svg"));
ok(rows.length === 11, "the workout lists eleven movements: " + rows.length);
const said = r => r.querySelector("span").textContent;
const which = drawn.map(r => r.querySelector("svg").dataset.demo);
ok(new Set(which).size === which.length,
   "no drawing turns up twice in one session: " + which.join(", "));
ok(drawn.some(r => said(r) === "100 air squats") && drawn.some(r => said(r) === "50 push-ups"),
   "each movement the app knows gets its own: " + drawn.map(said).join(", "));
ok(rows.length - drawn.length === 7,
   "and the seven it does not know get nothing: " + (rows.length - drawn.length));
ok(drawn[0].classList.contains("drawn"), "the row says so, so it can be spaced for one");
ok(rows.filter(r => !r.querySelector("svg")).every(r => !r.classList.contains("drawn")),
   "and the rows without one are unchanged");
ok(drawn[0].querySelector("svg").getAttribute("class") === "demo",
   "the copy is the same drawing, not a second copy of the styles");
ok(drawn[0].firstElementChild.tagName.toLowerCase() === "span" &&
   drawn[0].lastElementChild.tagName.toLowerCase() === "svg",
   "the words come first and the drawing goes at the far end, so a list still " +
   "reads down its left edge");

// ---- the eye ----
const list = $("sheet-steps"), eye = $("sheet-eye");
ok(list.classList.contains("nodemos"),
   "a session opens with the drawings off: they answer a question you ask once");
ok(eye.classList.contains("there"), "and the eye is offered, because there is one to show");
ok(!eye.classList.contains("on") && eye.innerHTML.includes("M4 20L20 4"),
   "struck through while they are hidden");
w.toggleDemos();
ok(!list.classList.contains("nodemos") && eye.classList.contains("on"),
   "pressing it shows them, and the eye opens");
ok(!eye.innerHTML.includes("M4 20L20 4"), "with the line through it gone");
ok(w.localStorage.getItem("tb.demos") === "true",
   "the choice is the phone's, not the session's: " + w.localStorage.getItem("tb.demos"));
w.openProgram("wod-team-chipper");
ok(!$("sheet-steps").classList.contains("nodemos"),
   "so the next session opens with them on");
w.toggleDemos();
ok($("sheet-steps").classList.contains("nodemos"), "and off again");

// a session with nothing drawn in it is not offered a switch with nothing behind it
w.openProgram("wod-deck-of-cards");
ok(!$("sheet-eye").classList.contains("there"),
   "a session the app has no drawing for does not show the eye at all");

// the other workout that calls for them
w.openProgram("wod-team-chipper");
const chip = [...$("sheet-steps").querySelectorAll("div.sub svg")].map(s => s.dataset.demo);
ok(chip.includes("squat") && new Set(chip).size === chip.length,
   "the chipper's air squats are drawn too, once each: " + chip.join(", "));

// ---- once per session, on the first line that names it ----
w.openProgram("wod-db-snatch-21-15-9");
const snRows = [...$("sheet-steps").querySelectorAll("div.sub")];
const snDrawn = snRows.filter(r => r.querySelector("svg"));
ok(snRows.filter(r => /snatch/.test(r.textContent)).length === 6,
   "21-15-9 down one arm and back up the other names snatches six times");
ok(snDrawn.length === 1, "and is drawn once: " + snDrawn.length);
ok(snDrawn[0] === snRows.find(r => /snatch/.test(r.textContent)),
   "on the first of them, which is the one you read first");
ok(!snRows.slice(1).some(r => r.classList.contains("drawn")),
   "the rest are ordinary lines again, indent and all");

// a session of your own, typed by hand
ev(`programs.push({ id:"mine", name:"Mine", category:"crossfn",
  blocks:[{ type:"step", text:"AMRAP", kind:"run", sec:600, list:["30 air squats","10 pull-ups"] }] });`);
w.openProgram("mine");
ok([...$("sheet-steps").querySelectorAll("div.sub svg")].length === 1,
   "a work list you typed yourself is read the same way");

// and the stations of a circuit, which are a list by another name
ev(`programs.push({ id:"circ", name:"Circuit", category:"crossfn",
  blocks:[{ type:"circuit", names:["Air squats","Plank"], workSec:40, restSec:20, rounds:3 }] });`);
w.openProgram("circ");
ok([...$("sheet-steps").querySelectorAll("div.sub svg")].length === 1,
   "a circuit's stations get their drawings as well");
