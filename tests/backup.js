/* Backup and restore: getting everything off one phone and into another. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

/* One phone, as it comes. `native` stands in the Android app: NATIVE is read
   once as the script loads, so the plugins have to be there before it runs. */
function phone(store, native){
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.org/",
    beforeParse(win){
      if(store) Object.keys(store).forEach(k => win.localStorage.setItem(k, store[k]));
      /* A clipboard that answers, so copying can be checked. */
      win.__clip = "";
      win.navigator.clipboard = { writeText: t => { win.__clip = t; return Promise.resolve(); } };
      /* jsdom has no blobs to hand out, and a browser does. */
      win.URL.createObjectURL = () => "blob:tb";
      win.URL.revokeObjectURL = () => {};
      if(native){
        win.__wrote = null;
        win.Capacitor = {
          isNativePlatform: () => true,
          Plugins: { Backup: { save: o => {
            win.__wrote = o;
            return native === "refuse"
              ? Promise.resolve({ ok:false, error:"the phone would not take the file" })
              : Promise.resolve({ ok:true, where:"Downloads/" + o.name });
          } } }
        };
      }
    }});
  const w=dom.window;
  return { w, d:w.document, ev:e=>w.eval(e), $:i=>w.document.getElementById(i) };
}

// =====================================================================
// A phone with something on it
// =====================================================================
const a = phone();
a.ev(`
  programs.push({ id:"p1", name:"My circuit", category:"strength",
                  blocks:[{type:"step",text:"Go",kind:"lift",sec:60}] });
  save(KEY_PROGRAMS, programs);
`);
a.w.openPlan("spark-rtr-phase1");
a.w.copyPlan();
a.$("dlg-ok").onclick();
const copyId = a.ev("myPlans[0].id");
a.ev(`
  progress["p1"] = "2026-08-01";
  progress[myPlans[0].id + ":w1:d0"] = "2026-08-02";
  save(KEY_PROGRESS, progress);
  history.push({ id:"p1", name:"My circuit", planName:"", at:"2026-08-01T10:00:00.000Z", sec:600 });
  save(KEY_HISTORY, history);
`);

a.w.showScreen("backup");
ok(a.d.querySelector(".screen.active").id === "backup", "the backup screen opens");
const what = a.$("backup-what").textContent;
ok(what.includes("1 session of your own") && what.includes("1 plan copied"),
   "it counts what is on the phone: " + what);
ok(what.includes("2 days ticked off") && what.includes("1 session finished"),
   "days and finished sessions too: " + what);

// ---- what the backup holds ----
const text = a.ev("backupText()");
const data = JSON.parse(text);
ok(data.app === "training-buddy", "the file says what it is");
ok(data.version === a.ev("APP_VERSION"), "and which version wrote it");
ok(data.programs.length === 1 && data.myplans.length === 1,
   "sessions and plan copies are in it");
ok(Object.keys(data.progress).length === 2 && data.history.length === 1,
   "so are the ticks and the history");
ok(a.ev("backupName()").startsWith("training-buddy-20") && a.ev("backupName()").endsWith(".json"),
   "the file is named for the day: " + a.ev("backupName()"));

// ---- copying it ----
/* Every backup carries the moment it was made, so two are never the same
   string to the millisecond; what matters is that all of it went. */
a.w.copyBackup();
const copied = JSON.parse(a.ev("__clip"));
ok(copied.app === "training-buddy" && copied.programs.length === 1 &&
   copied.myplans.length === 1 && copied.history.length === 1,
   "Copy puts the whole backup on the clipboard");

// ---- and when the clipboard refuses ----
a.ev(`navigator.clipboard = { writeText: () => Promise.reject(new Error("no")) };`);
a.w.copyBackup();
setTimeout(() => {
  ok(a.$("backup-out-field").style.display === "block",
     "a phone that will not copy shows the text to copy by hand");
  ok(JSON.parse(a.$("backup-out").value).programs.length === 1, "all of it");
  run2();
}, 10);

// =====================================================================
// A second phone, empty, restoring the first one's file
// =====================================================================
function run2(){
  const b = phone();
  ok(b.ev("programs.length") === 0 && b.ev("myPlans.length") === 0, "the new phone is empty");

  b.w.showScreen("backup");
  b.$("restore-text").value = text;
  b.w.restoreFromText();

  ok(b.ev("programs.length") === 1 && b.ev("programs[0].name") === "My circuit",
     "the session came across");
  ok(b.ev("myPlans.length") === 1 && b.ev("myPlans[0].id") === copyId,
     "the plan copy kept its own id, so its ticks still find it");
  ok(b.ev("Object.keys(progress).length") === 2, "the days ticked off came across");
  ok(b.ev("history.length") === 1, "and the history");
  ok(b.w.localStorage.getItem("tb.programs").includes("My circuit"),
     "all of it written to storage, not only to memory");
  ok(b.$("undo").textContent.includes("Restored"), "it says what it did: " + b.$("undo").textContent);

  // restoring the same file twice changes nothing
  b.w.restoreFromText();
  ok(b.ev("programs.length") === 1 && b.ev("history.length") === 1,
     "restoring the same file again leaves one of each, not two");

  // it is a merge, not a wipe
  const c = phone();
  c.ev(`
    programs.push({ id:"own", name:"Mine already", category:"rehab",
                    blocks:[{type:"step",text:"Go",kind:"run",sec:60}] });
    programs.push({ id:"p1", name:"An older My circuit", category:"other",
                    blocks:[{type:"step",text:"Go",kind:"run",sec:30}] });
    progress["own"] = "2026-08-05";
    progress["p1"] = "2026-08-09";
    history.push({ id:"own", name:"Mine already", at:"2026-08-05T09:00:00.000Z", sec:300 });
    save(KEY_PROGRAMS, programs); save(KEY_PROGRESS, progress); save(KEY_HISTORY, history);
  `);
  c.w.showScreen("backup");
  c.$("restore-text").value = text;
  c.w.restoreFromText();

  ok(c.ev("programs.length") === 2, "nothing of its own was thrown away: " + c.ev("programs.length"));
  ok(c.ev(`programs.find(p => p.id === "own").name`) === "Mine already", "what only it had is still there");
  ok(c.ev(`programs.find(p => p.id === "p1").name`) === "My circuit",
     "what both had is the one from the file: " + c.ev(`programs.find(p => p.id === "p1").name`));
  ok(c.ev(`progress["p1"]`) === "2026-08-09",
     "a later tick is not undone by an older backup: " + c.ev(`progress["p1"]`));
  ok(c.ev(`progress["own"]`) === "2026-08-05", "and its own ticks stand");
  ok(c.ev("history.length") === 2, "both histories are kept: " + c.ev("history.length"));
  ok(c.ev("history[0].at") > c.ev("history[1].at"), "newest first, as everywhere else");

  // rubbish in
  c.$("restore-text").value = "{}";
  c.w.restoreFromText();
  ok(c.$("dlg-title").textContent === "Not a backup", "a file that is not a backup is refused");
  c.w.closeDialog();
  c.$("restore-text").value = "not json at all";
  c.w.restoreFromText();
  ok(c.$("dlg-title").textContent === "Not a backup", "so is anything that will not parse");
  c.w.closeDialog();
  ok(c.ev("programs.length") === 2, "and neither changed a thing");

  // opening a file, the way the file picker hands it over
  const d = phone();
  const file = new d.w.File([text], "training-buddy-2026-08-11.json", { type:"application/json" });
  const input = d.$("restore-file");
  Object.defineProperty(input, "files", { value:[file], configurable:true });
  d.w.restoreFromFile(input);
  /* The reader hands over on its own schedule, and half a dozen other DOMs
     are being built on the same thread; wait for it rather than guess. */
  const readWhenDone = () => {
    if(!d.ev("programs.length")) return setTimeout(readWhenDone, 50);
    ok(d.ev("programs.length") === 1 && d.ev("myPlans.length") === 1,
       "a backup opened as a file restores the same way");
  };
  setTimeout(readWhenDone, 20);

  // =====================================================================
  // Where the file goes
  // =====================================================================
  const web = phone();
  web.w.showScreen("backup");
  ok(web.$("backup-saved").style.display === "none", "nothing is claimed before anything is saved");
  web.w.saveBackup();
  ok(web.$("backup-saved").style.display === "block",
     "the browser is told where it went: " + web.$("backup-saved").textContent);
  ok(web.$("backup-saved").textContent.includes("downloads"),
     "which is wherever it keeps its downloads: " + web.$("backup-saved").textContent);
  ok(web.$("backup-hint").textContent.includes("browser"),
     "and the hint is written for a browser");

  const app = phone(null, true);
  app.w.showScreen("backup");
  ok(app.$("backup-hint").innerHTML.includes("<b>Downloads</b>"),
     "in the app the hint names the folder");
  app.w.saveBackup();
  setTimeout(() => {
    const wrote = app.ev("__wrote");
    ok(!!wrote && wrote.name.startsWith("training-buddy-"),
       "the app writes the file itself, rather than clicking a link into the void");
    ok(JSON.parse(wrote.text).app === "training-buddy", "with the whole backup in it");
    ok(app.$("backup-saved").textContent === "Saved to Downloads/" + wrote.name,
       "and says exactly where: " + app.$("backup-saved").textContent);
    ok(app.$("undo").textContent.includes("Downloads/"), "in passing as well");

    // a phone that will not write falls back to the clipboard
    const stuck = phone(null, "refuse");
    stuck.w.showScreen("backup");
    stuck.w.saveBackup();
    setTimeout(() => {
      ok(JSON.parse(stuck.ev("__clip")).app === "training-buddy",
         "a phone that refuses the file gets the text on the clipboard instead");
      ok(stuck.$("backup-saved").style.display === "none",
         "and is not told a file was saved when none was");
    }, 20);
  }, 20);

  // the way in and out of the screen
  c.w.showScreen("about");
  ok(c.$("about").textContent.includes("Backup and restore"), "About has the way in");
  c.w.goBackup("about");
  c.w.goBack();
  ok(c.d.querySelector(".screen.active").id === "about", "and back from it lands on About");
  c.w.goBackup("home");
  c.w.goBack();
  ok(c.d.querySelector(".screen.active").id === "home",
     "while the reminder on home goes back to home");
}

// =====================================================================
// The home screen mentions it, and only when it should
// =====================================================================
setTimeout(() => {
  const slot = p => p.$("backup-slot").textContent;
  const withOne = `programs.push({ id:"p1", name:"Mine", category:"crossfn",
      blocks:[{type:"step",text:"Go",kind:"run",sec:60}] }); save(KEY_PROGRAMS, programs);`;

  // an empty phone has nothing to lose and is not nagged
  const empty = phone();
  empty.w.renderHome();
  ok(slot(empty) === "", "an empty phone is never asked to back anything up");

  // one of your own, and never backed up
  const p = phone();
  p.ev(withOne + " renderHome();");
  ok(slot(p).includes("Nothing is backed up yet"),
     "with something on it, home says so: " + slot(p));
  ok(slot(p).includes("Back up now") && slot(p).includes("Not now"),
     "with a way in and a way past it");

  // the old New program button is gone from home
  ok(!p.$("home").textContent.includes("New program"),
     "and the home screen no longer offers New program");
  p.w.openCategory("crossfn");
  ok(p.$("cat-body").textContent.includes("+ New session"),
     "which is still where it always was, inside a category");
  p.w.showScreen("home");

  // waving it away holds it for a week, not for ever
  p.w.backupSnooze();
  ok(slot(p) === "", "Not now takes it away");
  p.ev(`const s = load(KEY_BACKUP, {}); s.snoozed = Date.now() - 8*86400000;
        save(KEY_BACKUP, s); renderHome();`);
  ok(slot(p).includes("Nothing is backed up"), "and it comes back a week later");

  // taking a backup settles it
  p.w.showScreen("backup");
  p.w.saveBackup();
  ok(p.$("backup-when").textContent.indexOf("Last backed up today") === 0,
     "the screen says when it was last done: " + p.$("backup-when").textContent);
  p.w.showScreen("home");
  ok(slot(p) === "", "and home has nothing left to say");

  // until it is old enough to be worth saying again
  p.ev(`const s = load(KEY_BACKUP, {}); s.at = Date.now() - 5*86400000;
        s.snoozed = 0; save(KEY_BACKUP, s); renderHome();`);
  ok(slot(p) === "", "five days is not stale");
  p.ev(`const s = load(KEY_BACKUP, {}); s.at = Date.now() - 40*86400000;
        save(KEY_BACKUP, s); renderHome();`);
  ok(slot(p).indexOf("Last backup:") === 0, "forty days is: " + slot(p).slice(0, 26));

  // copying counts as a backup too
  const q = phone();
  q.ev(withOne + " renderHome();");
  q.w.showScreen("backup");
  q.w.copyBackup();
  setTimeout(() => {
    q.w.showScreen("home");
    ok(slot(q) === "", "copying it to the clipboard counts as having backed it up");
  }, 20);
}, 700);
