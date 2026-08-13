const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

const kinds = JSON.parse(ev("JSON.stringify(KINDS)"));
console.log("\n  what a step can be:");
kinds.forEach(k => console.log("    " + k[0].padEnd(6) + k[1].padEnd(22) +
  ev("colorOf('" + k[0] + "')").padEnd(14) + (ev("isWork('" + k[0] + "')") ? "go tone" : "ease-off tone")));
console.log("");

ok(kinds.length === 6, "six kinds: " + kinds.map(k => k[1]).join(", "));
ok(kinds.some(k => k[0] === "lift" && k[1] === "Strength"), "Strength is there");
ok(kinds.some(k => k[0] === "hold" && k[1] === "Hold"), "and Hold");
ok(new Set(kinds.map(k => ev("colorOf('" + k[0] + "')"))).size === 6,
   "each has a colour of its own, none shared");
ok(ev("isWork('lift')") && ev("isWork('hold')") && ev("isWork('run')"),
   "strength, holds and running all count as work");
ok(!ev("isWork('walk')") && !ev("isWork('warm')") && !ev("isWork('rest')"),
   "walking, warming up and resting do not");

// the editor offers them
w.newProgram("Strength");
w.addBlock("step");
const sels = [...$("edit-blocks").querySelectorAll("select")];
ok(sels.length > 0, "the editor has a type picker");
ok([...sels[0].options].map(o => o.textContent).join(",") ===
   "Run,Walk,Strength,Hold,Warm-up / cool-down,Rest",
   "offering all six: " + [...sels[0].options].map(o => o.textContent).join(","));

// a strength session runs, is coloured, and survives being saved
ev(`editing.blocks = [
  {type:"step", text:"Back squat", kind:"lift", sec:60},
  {type:"step", text:"Plank",      kind:"hold", sec:45},
  {type:"step", text:"Rest",       kind:"rest", sec:30}
];`);
$("edit-name").value = "Leg day";
w.saveProgram();
ok(ev("programs[0].blocks[0].kind") === "lift", "a strength step is stored as one");
ok(ev("flatten(programs[0].blocks)[1].kind") === "hold", "and a hold stays a hold");

w.openCategory("Strength");
const card = [...$("cat-body").querySelectorAll(".card")].find(c => /Leg day/.test(c.textContent));
const segs = [...card.querySelectorAll(".mini i")].map(i => i.getAttribute("style").split("background:")[1]);
console.log("  the card draws it as: " + segs.join("  "));
ok(segs[0] === "var(--lift)" && segs[1] === "var(--hold)" && segs[2] === "var(--rest)",
   "three different colours on the card, one per kind");

w.startSession(ev("programs[0].id"));
w.setLead(0); w.mainButton();
ok($("step-label").style.color === "var(--lift)", "the run screen takes the colour too: " + $("step-label").style.color);
ev("stopTicker(); session = null;");

// an old session saved before these existed still works
ok(ev(`colorOf("something-from-an-older-version")`) === "var(--run)",
   "a kind the app no longer knows falls back rather than drawing nothing");
