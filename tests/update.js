const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
const wait = ms => new Promise(r => setTimeout(r, ms));
const NOW = require("fs").readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8")
  .match(/APP_VERSION = "([^"]+)"/)[1];

// A phone, with whatever GitHub is pretending to answer today.
function boot(reply, native, seed){
  const calls = [];
  const dom = new JSDOM(html, { runScripts:"dangerously", url:"https://example.org/",
    beforeParse(w){
      /* What the phone remembers from the last time it was open. */
      if(seed) w.localStorage.setItem("tb.update", JSON.stringify(seed));
      if(native !== false) w.Capacitor = { isNativePlatform: () => true, Plugins: {
        App:{addListener(){},exitApp(){}},
        Speech:{speak:()=>Promise.resolve(),stop:()=>Promise.resolve(),
                voices:()=>Promise.resolve({voices:[]}),setVoice:()=>Promise.resolve({})},
        LocalNotifications:{requestPermissions:()=>Promise.resolve({display:"denied"}),
                createChannel:()=>Promise.resolve(),schedule:()=>Promise.resolve(),
                cancel:()=>Promise.resolve()}
      }};
      w.fetch = (url, opts) => { calls.push(url); return reply(url, opts); };
    }});
  return { w: dom.window, d: dom.window.document, calls, ev: e => dom.window.eval(e) };
}
const says = tag => () => Promise.resolve({ ok:true, json: () => Promise.resolve({ tag_name: tag }) });
const dead = () => () => Promise.reject(new Error("no signal"));

(async () => {
  console.log("\n  this build is " + NOW + "\n");

  // --- newer version out there ---
  {
    const { w, d, calls, ev } = boot(says("v9.9.9"), true);
    await wait(150);
    ok(calls.length === 1, "the app asks once at startup: " + calls.length);
    ok(/api\.github\.com.*releases\/latest/.test(calls[0]), "  " + calls[0]);
    const slot = d.getElementById("update-slot");
    ok(slot.textContent.includes("Version 9.9.9 is out"), "the home screen says so: " +
       slot.querySelector("h3").textContent);
    const dl = slot.querySelector("a.act");
    ok(dl.getAttribute("href").endsWith("/releases/latest/download/TrainingBuddy.apk"),
       "with a download that goes to the APK");
    ok(dl.target === "_blank", "outside the app, since it cannot install anything itself");

    // waving it away keeps it away, until a newer one still
    w.hideUpdate();
    ok(d.getElementById("update-slot").innerHTML === "", "Not now hides it");
    ev(`save(KEY_UPDATE, {at:Date.now(), version:"9.9.10", hidden:"9.9.9"}); renderHome();`);
    ok(d.getElementById("update-slot").textContent.includes("9.9.10"),
       "but the next release is announced again");
  }

  // --- already current ---
  {
    const { d, ev } = boot(says("v" + NOW), true);
    await wait(150);
    ok(d.getElementById("update-slot").innerHTML === "", "nothing shown when it is the same version");
    ev(`showScreen("about")`);
    ok(d.getElementById("update-line").textContent.indexOf("Up to date") === 0,
       "About says so: " + d.getElementById("update-line").textContent);
  }

  // --- an older release, which happens if a build is pulled ---
  {
    const { d } = boot(says("v0.0.1"), true);
    await wait(150);
    ok(d.getElementById("update-slot").innerHTML === "", "an older release is not offered");
  }

  // --- no signal ---
  {
    const { d, ev } = boot(dead(), true);
    await wait(150);
    ok(d.getElementById("update-slot").innerHTML === "", "a failed check shows nothing");
    ok(d.querySelector(".screen.active").id === "home", "and the app carries on");
    ok(ev("load(KEY_UPDATE, {}).at > 0"), "the attempt is remembered, so it is not retried at once");
  }

  // --- it does not ask again for six hours, but a button can force it ---
  {
    const { w, calls, ev } = boot(says("v9.9.9"), true);
    await wait(150);
    ev("checkUpdate(); checkUpdate();");
    await wait(80);
    ok(calls.length === 1, "three calls, one request: " + calls.length);
    w.checkNow();
    await wait(80);
    ok(calls.length === 2, "the button in About asks anyway: " + calls.length);
    ev(`const s = load(KEY_UPDATE, {}); s.at = Date.now() - 7*3600*1000; save(KEY_UPDATE, s);`);
    ev("checkUpdate();");
    await wait(80);
    ok(calls.length === 3, "and it asks again once six hours have passed");
  }

  // --- closing the app and opening it again asks ---
  {
    const hourAgo = { at: Date.now() - 60*60*1000, version:"", hidden:"" };
    const { calls } = boot(says("v9.9.9"), true, hourAgo);
    await wait(150);
    ok(calls.length === 1,
       "a fresh start asks even though it asked an hour ago: " + calls.length);
  }
  {
    const justNow = { at: Date.now() - 60*1000, version:"", hidden:"" };
    const { calls } = boot(says("v9.9.9"), true, justNow);
    await wait(150);
    ok(calls.length === 0,
       "but a phone restarting the app in a loop is not let through: " + calls.length);
  }

  // --- and so does coming back to it from the background ---
  {
    const { d, calls, ev } = boot(says("v9.9.9"), true);
    await wait(150);
    ok(calls.length === 1, "asked at startup");
    ev(`Object.defineProperty(document, "hidden", { value:true, configurable:true });
        document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "hidden", { value:false, configurable:true });
        document.dispatchEvent(new Event("visibilitychange"));`);
    await wait(80);
    ok(calls.length === 1, "coming straight back does not ask again: " + calls.length);
    ev(`const s = load(KEY_UPDATE, {}); s.at = Date.now() - 7*3600*1000; save(KEY_UPDATE, s);
        Object.defineProperty(document, "hidden", { value:false, configurable:true });
        document.dispatchEvent(new Event("visibilitychange"));`);
    await wait(80);
    ok(calls.length === 2,
       "coming back after six hours does, without the app being closed: " + calls.length);
    ok(d.getElementById("update-slot").textContent.includes("9.9.9"),
       "and what it finds is on the home screen");
  }

  // --- the web version does not ask at all ---
  {
    const { d, calls, ev } = boot(says("v9.9.9"), false);
    await wait(150);
    ok(calls.length === 0, "the web version makes no request: " + calls.length);
    ev(`showScreen("about")`);
    ok(d.getElementById("update-line").textContent.indexOf("The web version") === 0,
       "and says why: " + d.getElementById("update-line").textContent);
  }

  // --- comparing versions as numbers, not as text ---
  {
    const { ev } = boot(dead(), true);
    const cases = [["0.10.0","0.9.1",true], ["0.9.1","0.10.0",false], ["1.0.0","0.99.99",true],
                   ["0.18.0","0.18.0",false], ["v0.18.1","0.18.0",true], ["0.2.0","0.10.0",false]];
    cases.forEach(([a,b,want]) => ok(ev(`newerThan("${a}","${b}")`) === want,
      "  " + a + (want ? " is newer than " : " is not newer than ") + b));
  }
})();

// --- a WebView with no fetch at all must not take startup down with it ---
setTimeout(() => {
  const ok2 = (c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);
  const dom = new JSDOM(html, { runScripts:"dangerously", url:"https://example.org/",
    beforeParse(w){
      w.Capacitor = { isNativePlatform: () => true, Plugins: {
        App:{addListener(){},exitApp(){}},
        Speech:{speak:()=>Promise.resolve(),stop:()=>Promise.resolve(),
                voices:()=>Promise.resolve({voices:[]}),setVoice:()=>Promise.resolve({})},
        LocalNotifications:{requestPermissions:()=>Promise.resolve({display:"denied"}),
                createChannel:()=>Promise.resolve(),schedule:()=>Promise.resolve(),
                cancel:()=>Promise.resolve()}
      }};
      // no fetch defined at all, as on a WebView older than the feature
    }});
  const d = dom.window.document;
  console.log("");
  ok2(d.querySelector(".screen.active").id === "home", "the app still starts with no fetch");
  ok2(!!d.getElementById("cat-list").textContent.trim(), "and the home screen is drawn");
  ok2(d.getElementById("update-slot").innerHTML === "", "with nothing said about updates");
  dom.window.eval(`showScreen("about")`);
  ok2(d.getElementById("update-line").textContent.indexOf("Not checked") === 0,
      "About admits it has not checked: " + d.getElementById("update-line").textContent);
}, 900);
