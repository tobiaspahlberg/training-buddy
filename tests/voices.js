const fs=require("fs"), {JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8"),
  {runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window,d=w.document,ev=e=>w.eval(e),$=i=>d.getElementById(i);
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

// --- spelled out or said as a word ---
console.log("  what the engine is handed:");
[["AMRAP for 25 minutes","Amrap for 25 minutes"],
 ["100 KB swing","100 kettlebell swing"],
 ["Snatch KB/DB","Snatch kettlebell/dumbbell"],
 ["Run for 2 minutes","Run for 2 minutes"],
 ["Scramble", "Scramble"]].forEach(([given, want]) => {
  const got = ev("saidAs(" + JSON.stringify(given) + ")");
  console.log("    " + given.padEnd(22) + " -> " + got);
  ok(got === want, "  " + JSON.stringify(given) + " reads right");
});
ok(ev('saidAs("AMRAPS")') === "AMRAPS", "a longer word containing it is left alone");

// --- naming the voices an engine offers ---
const named = JSON.parse(ev(`JSON.stringify(labelVoices([
  {name:"en-us-x-sfg#female_1-local", lang:"en-US"},
  {name:"en-us-x-iom#male_1-local",   lang:"en-US"},
  {name:"en-us-x-tpc#female_2-local", lang:"en-US"},
  {name:"en-gb-x-gba#male_1-local",   lang:"en-GB"},
  {name:"Samantha",                   lang:"en-AU"}
]))`));
console.log("\n  how they are named on screen:");
named.forEach(v => console.log("    " + v.label.padEnd(22) + v.name));
ok(named[0].label === "American woman", "female is read out of the name: " + named[0].label);
ok(named[1].label === "American man", "and male, without female matching it: " + named[1].label);
ok(named[2].label === "American woman 2", "a second of the same is numbered: " + named[2].label);
ok(named[3].label === "British man", "the accent comes from the locale: " + named[3].label);
ok(named[4].label === "Australian", "and a voice that says nothing is just its accent: " + named[4].label);

// --- the picker ---
ev(`voiceList = ${JSON.stringify(named)}; renderVoicePicker();`);
const sel = $("voice-select");
ok(!!sel, "a picker is shown when there is more than one voice");
ok(sel.options.length === 6, "with a leave-it-alone option first: " + sel.options.length + " entries");
ok(sel.options[0].value === "", "which carries no name");
ok(sel.value === "", "and nothing is chosen to start with");

// choosing one remembers it by name
ev(`setVoice("en-us-x-iom#male_1-local")`);
ok(ev("voiceName") === "en-us-x-iom#male_1-local", "picking one stores it");
ok(JSON.parse(w.localStorage.getItem("tb.voice")) === "en-us-x-iom#male_1-local",
   "on the phone, by name rather than by position in a list that can change");
w.renderVoicePicker();
ok($("voice-select").value === "en-us-x-iom#male_1-local", "and it comes back selected");

// one voice is still worth naming, so you can see who is talking
ev(`voiceList = [{name:"only", lang:"en-GB", label:"British"}]; renderVoicePicker();`);
ok(!!$("voice-select"), "one voice still gets a picker");
ok([...$("voice-select").options].map(o => o.textContent).join() === "Whatever the phone picks,British",
   "naming it: " + [...$("voice-select").options].map(o => o.textContent).join(", "));
ev(`voiceList = []; renderVoicePicker();`);
ok($("voice-pick").innerHTML === "", "no voices, no picker");

// a name that is no longer installed falls back rather than sticking
ev(`voiceList = ${JSON.stringify(named)}; voiceName = "a-voice-since-uninstalled"; renderVoicePicker();`);
ok($("voice-select").value === "", "a voice that has gone leaves the picker on the default");
