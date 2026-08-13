/* The drawers on the home screen: their ids, their labels, and what happens
   to a session filed under a name the app no longer uses. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"), "utf8");
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

function phone(store){
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.org/",
    beforeParse(win){
      if(store) Object.keys(store).forEach(k => win.localStorage.setItem(k, store[k]));
    }});
  const w=dom.window;
  return { w, d:w.document, ev:e=>w.eval(e), $:i=>w.document.getElementById(i) };
}

const p = phone();
const { w, d, ev, $ } = p;

// ---- one axis, six drawers ----
ok(ev("JSON.stringify(CATEGORIES)") ===
   '["cardio","strength","crossfn","mobility","rehab","other"]',
   "six ids, in the order they are shown: " + ev("JSON.stringify(CATEGORIES)"));
ok(ev("CATEGORIES.every(c => c === c.toLowerCase())"),
   "an id is not something anybody reads, so it is a short lower-case word");
ok(ev("catLabel('crossfn')") === "Cross-functional", "and the label is what is read");
ok([...$("cat-list").querySelectorAll(".catcard h3")].map(x => x.textContent).join(" · ") ===
   "Cardio · Strength · Cross-functional · Mobility · Rehab · Other",
   "home shows labels, not ids");

// ---- every drawer has a colour of its own ----
const colours = ev("JSON.stringify(CATEGORIES.map(c => CAT_COLOR[c]))");
ok(new Set(JSON.parse(colours)).size === 6, "six colours, none of them shared: " + colours);
ok(ev("CATEGORIES.every(c => CAT_FADE[c] && CAT_TINT[c])"),
   "each with a faded and a washed version, for built-ins and for cards");

// ---- what is where ----
const where = id => ev(`categoryOf(BUILTIN_PROGRAMS.concat(PLANS).find(x => x.id === "${id}"))`);
ok(where("spark-beginner-5k") === "cardio", "the 5K plan is cardio: " + where("spark-beginner-5k"));
ok(where("spark-rtr-phase1") === "rehab",
   "Return to Run is running, but you open it because you are injured: " + where("spark-rtr-phase1"));
ok(where("wod-team-amrap-25") === "crossfn", "a team AMRAP is cross-functional");
ok(where("rehab-strength-for-runners") === "strength", "Strength for Runners is strength");
ok(ev("BUILTIN_PROGRAMS.filter(x => categoryOf(x) === 'crossfn').length") === 9,
   "nine of the eleven built-in sessions are cross-functional");
ok(ev("programsIn('other').length") === 0 && ev("plansIn('other').length") === 0,
   "and nothing at all is left in Other");

// ---- an old name still finds its way ----
const was = c => ev(`categoryOf({ category:${JSON.stringify(c)} })`);
ok(was("Training") === "crossfn",
   "Training - the word that meant everything - becomes Cross-functional: " + was("Training"));
ok(was("Rehab") === "rehab" && was("Strength") === "strength" &&
   was("Mobility") === "mobility" && was("Other") === "other",
   "the other four keep their meaning under their new ids");
ok(was("Pilates") === "other" && was(undefined) === "other",
   "and anything the app has never heard of lands in Other, not in the biggest drawer");

// ---- which is not a theory: a phone that upgrades ----
const old = phone({
  "tb.programs": JSON.stringify([
    { id:"a", name:"An old session of mine", category:"Training",
      blocks:[{ type:"step", text:"Go", kind:"run", sec:600 }] },
    { id:"b", name:"An old rehab session", category:"Rehab",
      blocks:[{ type:"step", text:"Go", kind:"warm", sec:300 }] }
  ])
});
old.w.openCategory("crossfn");
ok(old.$("cat-body").textContent.includes("An old session of mine"),
   "a session saved as Training opens under Cross-functional");
old.w.openCategory("rehab");
ok(old.$("cat-body").textContent.includes("An old rehab session"), "and a rehab one stays put");
ok(JSON.parse(old.w.localStorage.getItem("tb.programs"))[0].category === "Training",
   "without anything being rewritten on the phone: the old word is read, not replaced");

// the same session, opened in the editor, is offered its new home
old.w.editProgram("a");
ok(old.$("edit-category").value === "crossfn",
   "the editor shows where it lives now: " + old.$("edit-category").value);
ok([...old.$("edit-category").options].map(o => o.value).join(",") ===
   "cardio,strength,crossfn,mobility,rehab,other", "the menu carries ids as values");
ok([...old.$("edit-category").options].map(o => o.textContent).join(",") ===
   "Cardio,Strength,Cross-functional,Mobility,Rehab,Other", "and labels as words");
old.$("edit-name").value = "An old session of mine";
old.w.saveProgram();
ok(JSON.parse(old.w.localStorage.getItem("tb.programs"))[0].category === "crossfn",
   "and saving it writes the new id: " + JSON.parse(old.w.localStorage.getItem("tb.programs"))[0].category);

// ---- the name suggested in the editor follows the drawer ----
w.newProgram("crossfn");
ok($("edit-name").placeholder === "e.g. Saturday AMRAP",
   "cross-functional suggests a cross-functional name: " + $("edit-name").placeholder);
w.newProgram("cardio");
ok($("edit-name").placeholder === "e.g. Tuesday intervals", "cardio suggests a cardio one");

// ---- search says the label too ----
ev("editing = null;");
w.openSearch("crossfn");
ok($("search-input").placeholder === "Find in Cross-functional",
   "a scoped search names the category: " + $("search-input").placeholder);
ok($("search-body").textContent.includes("in Cross-functional"), "and so does the empty state");
$("search-input").value = "Deck";
w.renderSearch();
ok($("search-body").textContent.includes("Cross-functional"),
   "a hit says which drawer it came out of");
