const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const active=()=>d.querySelector(".screen.active").id;
const type = q => { $("search-input").value = q;
  $("search-input").dispatchEvent(new w.Event("input", {bubbles:true})); };
const hits = () => [...$("search-body").querySelectorAll("[data-hit]")];
const names = () => hits().map(h => h.querySelector("b").textContent);

w.openSearch();
ok(active() === "search", "the magnifier opens a screen of its own");
ok($("search-body").textContent.indexOf("Type a few letters") === 0, "which asks you to type");
ok($("search-btn").innerHTML.includes("circle"), "and its icon is a drawn magnifier");

type("amrap");
console.log("\n  amrap ->");
names().forEach(n => console.log("    " + n));
ok(hits().length === 3, "three AMRAPs: " + hits().length);
ok(names().every(n => /AMRAP/i.test(n)), "all of them named that");

type("run");
console.log("\n  run ->");
hits().forEach(h => console.log("    " + h.querySelector("small").textContent.padEnd(34) +
  h.querySelector("b").textContent));
ok(names().some(n => /Return to Run/.test(n)) && names().some(n => /Strength for Runners/.test(n)),
   "finds a plan and a session in one list");
ok($("search-body").querySelector(".hit small").textContent.indexOf("Plan · ") === 0 ||
   $("search-body").textContent.includes("Plan · "), "rows say which kind they are");
ok($("search-body").textContent.includes("Session · "), "and sessions say so too");

// it looks across categories, which is the point
const cats = hits().map(h => h.querySelector("small").textContent.split(" · ").pop());
ok(new Set(cats).size > 1, "results come from more than one category: " + [...new Set(cats)].join(", "));
ok(hits().every(h => h.querySelector("i").getAttribute("style").indexOf("background:var(--") === 0),
   "each row wears its category's colour");

// the letters typed are marked in the name
type("miniband");
ok(!!$("search-body").querySelector("mark"), "the matched letters are marked");
ok($("search-body").querySelector("mark").textContent === "Miniband",
   "in the case they are written: " + $("search-body").querySelector("mark").textContent);

// case and partial words
type("DECK");
ok(names().length === 1 && /Deck of Cards/.test(names()[0]), "case does not matter");
type("of card");
ok(names().length === 1, "nor does matching the middle of a name");

type("qqqq");
ok(hits().length === 0 && $("search-body").textContent.includes("Nothing called that"),
   "and it says so when there is nothing");

// own sessions are searchable as soon as they exist
w.newProgram("Mobility"); w.addBlock("step"); $("edit-name").value = "Hip openers"; w.saveProgram();
w.openSearch(); type("openers");
ok(names().length === 1 && names()[0] === "Hip openers", "a session of mine is found: " + names());

// matching runs anywhere in the name, which is why a short word casts wide
type("hip");
ok(names().length === 2 && names().some(n => /Chipper/.test(n)),
   "\"hip\" also finds C-hip-per, since a match anywhere counts: " + names().join(", "));

// opening a result takes you to it, and puts you in its category
w.openSearch(); type("Return to Run");
hits()[0].dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
ok(active() === "plan", "tapping a plan opens it");
ok(ev("currentCategory") === "Rehab", "and back will land in its category: " + ev("currentCategory"));
w.goBack();
ok(active() === "category" && $("cat-title").textContent === "Rehab", "which it does");

// every session opens its details, built in or your own
w.openSearch(); type("Deck of Cards");
hits()[0].dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
ok($("sheet").classList.contains("show"), "a built-in session opens its details");
w.closeSheet();
w.openSearch(); type("Hip openers");
hits()[0].dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
ok($("sheet").classList.contains("show"), "so does one of mine");
ok($("sheet-title").textContent === "Hip openers", "the right one: " + $("sheet-title").textContent);
w.closeSheet();

// back out of search
w.openSearch();
w.goBack();
ok(active() === "home", "back from search is home");

// --- searching inside one category ---
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  w.openCategory("Rehab");
  ok2(!!$("cat-search").querySelector("svg"), "a category has its own magnifier");
  $("cat-search").dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
  ok2(active() === "search", "which opens search");
  ok2(ev("searchScope") === "Rehab", "scoped to that category: " + ev("searchScope"));
  ok2($("search-input").placeholder === "Find in Rehab", "and says so: " + $("search-input").placeholder);
  ok2($("search-body").textContent.includes("in Rehab"), "the prompt too");

  type("run");
  const scoped = names();
  console.log("\n  run, inside Rehab ->");
  scoped.forEach(n => console.log("    " + n));
  ok2(scoped.length > 0, "it finds things");
  ok2(scoped.every(n => !/Beginner 5K/.test(n)),
      "and nothing from Training, which the same word matches: " + scoped.join(", "));

  // back goes to the category it was opened from
  w.goBack();
  ok2(active() === "category" && $("cat-title").textContent === "Rehab",
      "back lands in the category it was opened from");

  // the home magnifier is not scoped, and clears any scope left behind
  w.showScreen("home");
  $("search-btn").dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
  ok2(ev("searchScope") === null, "the home magnifier searches everything again");
  type("run");
  ok2(names().some(n => /Beginner 5K/.test(n)), "so Training is back in the results");
  w.goBack();
  ok2(active() === "home", "and back from there is home");
}, 400);
