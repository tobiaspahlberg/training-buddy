/* The drawings: which lines get one, which do not, and that the one the app
   has is a drawing rather than a still. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

// ---- what is held, and where ----
const held = [...d.querySelectorAll("#demos svg[data-demo]")];
ok(held.length >= 1, "the app carries " + held.length + " drawing(s)");
ok($("demos").hasAttribute("hidden"),
   "kept out of sight, because a drawing is copied to where it is needed");
ok(held.every(s => s.getAttribute("viewBox")), "each has a view box, so it scales to its row");
const names = new Set(Object.keys(ev("DEMOS")).map(k => ev("DEMOS")[JSON.stringify(k) && k]));
ok([...names].every(n => held.some(s => s.dataset.demo === n)),
   "and every name the table can return is one that is actually here: " + [...names].join(", "));

// ---- it moves ----
const squat = held.find(s => s.dataset.demo === "squat");
ok(!!squat, "the air squat is the one that is drawn so far");
const anim = squat.querySelectorAll("animate, animateTransform");
ok(anim.length > 10, "it is " + anim.length + " animations, not a still");
ok([...anim].every(a => a.getAttribute("repeatCount") === "indefinite"),
   "every one of them loops, so it is still going when you look up");
const dur = new Set([...anim].map(a => a.getAttribute("dur")));
ok(dur.size === 1, "on one clock, or the limbs would drift apart: " + [...dur][0]);
const counts = new Set([...anim].map(a => a.getAttribute("values").split(";").length));
ok(counts.size === 1, "and one frame count throughout: " + [...counts][0] + " frames");

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

// ---- and where it turns up ----
w.openProgram("wod-total-training-25");
const rows = [...$("sheet-steps").querySelectorAll("div.sub")];
const drawn = rows.filter(r => r.querySelector("svg"));
ok(rows.length === 11, "the workout lists eleven movements: " + rows.length);
const said = r => r.querySelector("span").textContent;
ok(drawn.length === 1 && said(drawn[0]) === "100 air squats",
   "one of them carries a drawing, and it is the one the app has: " +
   drawn.map(said).join(", "));
ok(drawn[0].classList.contains("drawn"),
   "the row says so, so it can give up the indent the drawing replaces");
ok(rows.filter(r => !r.querySelector("svg")).every(r => !r.classList.contains("drawn")),
   "and the rows without one are unchanged");
ok(drawn[0].querySelector("svg").getAttribute("class") === "demo",
   "the copy is the same drawing, not a second copy of the styles");

// the other workout that calls for them
w.openProgram("wod-team-chipper");
ok([...$("sheet-steps").querySelectorAll("div.sub svg")].length === 1,
   "the chipper's air squats are drawn too");

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
