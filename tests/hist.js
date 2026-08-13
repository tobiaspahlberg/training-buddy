const fs = require("fs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  { runScripts:"dangerously", url:"https://example.org/" });
const w = dom.window, d = w.document, ev = e => w.eval(e);
const $ = id => d.getElementById(id);
const active = () => d.querySelector(".screen.active").id;
const ok = (c,m) => console.log((c?"  ok  ":"FAIL  ")+m);
const txt = id => $(id).textContent;

// make a program and run it to the end
w.newProgram("crossfn");
$("edit-name").value = "Quickie";
ev("editing.blocks = [{type:'step',text:'Go',kind:'run',sec:1}]");
w.saveProgram();
const pid = ev("programs[0].id");
ok(active() === "category", "saved into the category");
ok(!$("cat-body").querySelector(".card.done"), "not marked before it is run");

w.startSession(pid);
w.setLead(0); w.mainButton();
setTimeout(() => {
  ok(active() === "done", "session finished");
  ok(ev("history.length") === 1, "one entry in history");
  ok(ev("history[0].name") === "Quickie", "the entry knows the program");
  ok(ev("progress['" + pid + "']") === new Date().toISOString().slice(0,10), "marked done today");

  // green in the list
  w.openCategory("crossfn");
  const card = $("cat-body").querySelector(".card.done");
  ok(!!card, "the program is green");
  ok(card.textContent.includes("Last done today"), "and dated: " + (card && card.querySelector("p").textContent.trim()));

  // history screen
  w.openHistory();
  ok(active() === "history", "history opens");
  ok(txt("history-body").includes("Quickie") && txt("history-body").includes("Today"),
     "history lists it with a date");

  // home card
  w.showScreen("home");
  ok(txt("history-slot").includes("1 session finished"), "home shows the history card: " + txt("history-slot").trim().slice(0,60));

  // reset the program: mark goes, history stays
  w.openCategory("crossfn");
  w.resetProgram(pid);
  ok(!$("cat-body").querySelector(".card.done"), "reset clears the green mark");
  ok(ev("history.length") === 1, "reset keeps the history");
  ok(!$("cat-body").textContent.includes("Last done"), "and clears the date");

  // yesterday's mark is not green, but still dated
  ev("progress['" + pid + "'] = new Date(Date.now()-86400000).toISOString().slice(0,10)");
  w.renderCategory();
  ok(!$("cat-body").querySelector(".card.done"), "yesterday is not green any more");
  ok($("cat-body").textContent.includes("Last done yesterday"), "but it says when: " +
     $("cat-body").querySelector("p").textContent.trim());

  // plan reset
  w.openPlan("spark-rtr-phase1");
  ok(!$("plan-weeks").textContent.includes("Start this plan over"), "no reset offered on an untouched plan");
  ev("progress['spark-rtr-phase1:w1d0'] = today(); updateSelectUI();");
  ok($("plan-weeks").textContent.includes("Start this plan over"), "reset appears once a day is ticked");
  w.resetPlan();
  $("dlg-ok").onclick();
  ok(txt("plan-progress") === "0 of 18 sessions done", "the plan is back to zero: " + txt("plan-progress"));
  ok(ev("history.length") === 1, "resetting the plan keeps the history");

  // clear history
  w.openHistory();
  w.clearHistory();
  $("dlg-ok").onclick();
  ok(ev("history.length") === 0, "history cleared on request");
  ok(txt("history-body").includes("No finished sessions yet"), "and says so");
}, 1600);
