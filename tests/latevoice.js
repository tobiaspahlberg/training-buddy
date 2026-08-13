const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");

// Stand in for the Android plugin. The real one answers with an empty list
// until the platform speech engine has bound, which is what went wrong.
function boot(voicesWhenReady, readyAfterMs){
  const state = { ready: false, asked: 0 };
  const dom = new JSDOM(html, { runScripts:"dangerously", url:"https://example.org/",
    beforeParse(w){
      w.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          App: { addListener(){}, exitApp(){} },
          Speech: {
            voices(){ state.asked++;
              return Promise.resolve({ voices: state.ready ? voicesWhenReady : [] }); },
            setVoice(){ return Promise.resolve({ ok:true }); },
            speak(){ return Promise.resolve(); },
            stop(){ return Promise.resolve(); },
            available(){ return Promise.resolve({ available: state.ready }); }
          }
        }
      };
    }});
  if(readyAfterMs >= 0) setTimeout(() => { state.ready = true; }, readyAfterMs);
  return { dom, w: dom.window, d: dom.window.document, state };
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c,m) => console.log((c?"  ok  ":"FAIL  ")+m);
const THREE = [
  {name:"en-us-x-sfg#female_1-local", lang:"en-US"},
  {name:"en-us-x-iom#male_1-local",   lang:"en-US"},
  {name:"en-gb-x-gba#male_1-local",   lang:"en-GB"}
];

(async () => {
  for(const ms of [500, 1700]){
    const { w, d, state } = boot(THREE, ms);
    console.log("\n  engine binds after " + ms + " ms");
    await wait(120);
    ok(state.asked >= 1, "asked at startup");
    ok(!d.getElementById("voice-select"), "  nothing to show yet, since the engine is still coming up");
    await wait(ms + 1200);
    const sel = d.getElementById("voice-select");
    ok(!!sel, "the picker appears once the engine answers");
    ok(sel && sel.options.length === 4, "with the three voices plus the default: " +
       (sel ? sel.options.length : 0));
    ok(state.asked > 1, "because the app asked again: " + state.asked + " times");
    ok([...sel.options].map(o => o.textContent).join(",") ===
       "Whatever the phone picks,American woman,American man,British man",
       "  " + [...sel.options].map(o => o.textContent).join(", "));
  }

  // opening About asks again, which is the belt to the retry's braces
  {
    const { w, d, state } = boot(THREE, -1);           // never ready during startup
    await wait(3200);
    ok(!d.getElementById("voice-select"), "\n  engine still down: no picker");
    const before = state.asked;
    state.ready = true;
    w.showScreen("about");
    await wait(300);
    ok(state.asked > before, "opening About asks the phone again");
    ok(!!d.getElementById("voice-select"), "and the picker is there");
  }

  // a phone that genuinely has nothing says so
  {
    const { d } = boot([], 0);
    await wait(3400);
    console.log("\n  a phone with no English voice at all");
    ok(!d.getElementById("voice-select"), "no picker, since there is nothing to pick");
    ok(d.getElementById("voice-pick").textContent.indexOf("No English voice") === 0,
       "but it says why: " + d.getElementById("voice-pick").textContent.trim().slice(0,44) + "…");
  }
})();
