const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
const ok=(c,m)=>console.log((c?"  ok  ":"FAIL  ")+m);

// The Android app hands a running session's cues to a foreground service, so
// they keep coming when the WebView is frozen behind another app. This stands
// in for the Speech plugin and records what the page asks of it.
function boot(opts){
  opts = opts || {};
  const log = { workout: [], ended: [], spoken: [], notes: 0, asked: 0 };
  const dom = new JSDOM(html, { runScripts:"dangerously", url:"https://example.org/",
    beforeParse(w){
      if(opts.saved) w.localStorage.setItem("tb.current", JSON.stringify(opts.saved));
      const Speech = {
        speak(o){ log.spoken.push(o.text); return Promise.resolve(); },
        stop:()=>Promise.resolve(),
        voices:()=>Promise.resolve({voices:[]}), setVoice:()=>Promise.resolve({})
      };
      if(!opts.oldApk){
        Speech.workout = o => { log.workout.push(JSON.parse(JSON.stringify(o)));
                                return opts.refuse ? Promise.reject(new Error("no")) : Promise.resolve(); };
        Speech.workoutEnd = o => { log.ended.push(o); return Promise.resolve(); };
      }
      w.Capacitor = { isNativePlatform: () => true, Plugins: {
        App: { addListener(){}, exitApp(){} },
        Speech: Speech,
        LocalNotifications: {
          requestPermissions(){ log.asked++; return Promise.resolve({ display: "granted" }); },
          createChannel(){ return Promise.resolve(); },
          schedule(){ log.notes++; return Promise.resolve(); },
          cancel(){ return Promise.resolve(); }
        }
      }};
    }});
  return { w: dom.window, d: dom.window.document, log, ev: e => dom.window.eval(e) };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const last = a => a[a.length - 1];
const SESSION = `{ id:"s1", name:"Quick test", blocks:[
  {type:"repeat", reps:2, a:{text:"Run", kind:"run", sec:20}, b:{text:"Walk", kind:"walk", sec:10}}
]}`;

(async () => {
  // ---- start, with no count-in ----
  {
    const { w, d, log, ev } = boot();
    ev(`setLead(0); begin(${SESSION}); mainButton();`);
    await wait(300);
    ok(log.workout.length === 1, "starting hands the schedule to the service once: " + log.workout.length);
    const o = log.workout[0], now = Date.now();
    ok(o.title === "Quick test", "titled with the session: " + o.title);
    ok(o.note.indexOf("Run") === 0, "the notification says the step that is on: " + o.note);
    const first = o.cues[0];
    ok(/^Run/.test(first.text) && Math.abs(first.at - now) < 1000,
       "the first cue is the first step, now: " + first.text);
    ok(first.tones && first.tones[0] === 880, "with the go tone");
    const texts = o.cues.map(c => c.text);
    ok(texts.filter(t => /^Walk/.test(t)).length === 2, "both walks are in it");
    ok(texts.filter(t => t === "3").length === 3,
       "a 3-2-1 before every step change but the finish: " + texts.filter(t => t === "3").length);
    const fin = last(o.cues);
    ok(fin.finish === true && /complete/.test(fin.text), "it ends with the finish");
    ok(fin.tones.length === 3, "and the finish's three tones");
    ok(Math.abs(fin.at - (now + 60000)) < 1000, "a minute from now, which is the session's length");
    ok(o.cues.every((c, i) => !i || c.at >= o.cues[i - 1].at), "in order of time");
    ok(log.spoken.length === 0, "and the page itself said nothing: " + JSON.stringify(log.spoken));
    ok(log.notes === 0, "the page posts no notification of its own – the service owns it");
    ok(log.asked === 1, "but it does ask for permission to show one");

    // pause
    w.mainButton();
    await wait(100);
    const p = last(log.workout);
    ok(p.note === "Paused" && p.cues.length === 0, "a pause keeps the notification and drops the cues");
    ok(last(log.spoken) === "Paused", "and is still said by the page");

    // resume
    w.mainButton();
    await wait(100);
    const r = last(log.workout);
    ok(r.cues.length > 0 && !/^Run/.test(r.cues[0].text),
       "resuming does not repeat the step already on: " + r.cues[0].text);

    // skip
    w.skipStep();
    await wait(100);
    const k = last(log.workout);
    ok(/^Walk/.test(k.cues[0].text) && Math.abs(k.cues[0].at - Date.now()) < 1000,
       "a skip sends the schedule again, starting with the next step now");
    ok(log.spoken.filter(t => /^Walk/.test(t)).length === 0, "and the page does not say it as well");

    // stop
    w.confirmQuit();
    d.getElementById("dlg-ok").onclick();
    await wait(100);
    ok(log.ended.length === 1 && log.ended[0].finish === false, "stopping ends the service, without a finish");
  }

  // ---- the count-in ----
  {
    const { log, ev } = boot();
    ev(`setLead(5); begin(${SESSION}); mainButton();`);
    await wait(200);
    const o = log.workout[0];
    ok(o.note === "Get ready", "while it counts in, the notification says so");
    ok(o.cues.slice(0, 3).map(c => c.text).join() === "3,2,1", "the count-in is in the schedule");
    ok(/^Run/.test(o.cues[3].text), "followed by the first step");
    ev("stopTicker();");
  }

  // ---- the finish ----
  {
    const { d, log, ev } = boot();
    ev(`setLead(0); begin({ id:"s2", name:"Short", blocks:[{type:"step",text:"Go",kind:"run",sec:1}]}); mainButton();`);
    await wait(1600);
    ok(d.querySelector(".screen.active").id === "done", "session finished");
    ok(log.ended.length === 1 && log.ended[0].finish === true,
       "the service is told it is a finish, so the last cue is heard exactly once");
    ok(log.spoken.indexOf("Workout complete. Well done.") < 0, "and the page does not say it too");
  }

  // ---- back after Android killed the app ----
  {
    const startedAt = Date.now() - 25000;   // 25 s in: the first walk
    const saved = { id:"s1", name:"Quick test", planName:"", startedAt, pausedAt:0, pausedTotal:0,
      steps:[{text:"Run",kind:"run",sec:20,end:20,rep:1,reps:2},{text:"Walk",kind:"walk",sec:10,end:30,rep:1,reps:2},
             {text:"Run",kind:"run",sec:20,end:50,rep:2,reps:2}] };
    const { d, log, ev } = boot({ saved });
    await wait(200);
    ok(d.querySelector(".screen.active").id === "run", "opening the app goes straight back into the workout");
    const o = log.workout[0];
    ok(o && /^Walk/.test(o.cues[0].text) && Math.abs(o.cues[0].at - Date.now()) < 1000,
       "and says the step it is on, now");
    ev("stopTicker();");
  }
  {
    const saved = { id:"s1", name:"Quick test", planName:"", startedAt: Date.now() - 25000,
      pausedAt: Date.now() - 5000, pausedTotal:0,
      steps:[{text:"Run",kind:"run",sec:20,end:20}] };
    const { d } = boot({ saved });
    await wait(200);
    ok(d.querySelector(".screen.active").id === "home", "a paused workout waits on home, as before");
  }

  // ---- the fallbacks ----
  {
    const { log, ev } = boot({ oldApk: true });
    ev(`setLead(0); begin(${SESSION}); mainButton();`);
    await wait(300);
    ok(log.spoken.some(t => /^Run/.test(t)), "an APK without the service: the page speaks, as before");
    ok(log.notes > 0, "and posts its own notification");
    ev("stopTicker();");
  }
  {
    const { log, ev } = boot({ refuse: true });
    ev(`setLead(0); begin(${SESSION}); mainButton();`);
    await wait(500);
    ok(log.spoken.some(t => /^Run/.test(t)), "a service that will not start: the page takes over the cues");
    ev("stopTicker();");
  }
})();
