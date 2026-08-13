/* A screenshot of a screen the app has to be walked into first: jsdom cannot
   draw, so the app is stepped there and the page written out for Chromium.
 *
 *   node shot.js 'openCategory("cardio")' /tmp/x.html
 *   chromium --headless=new --window-size=500,1200 \
 *            --screenshot=/tmp/x.png file:///tmp/x.html
 *
 * The page carries its own script, so it starts itself again when the browser
 * opens it - and anything drawn from storage would be drawn again, from an
 * empty phone, over the top of what was walked to. Whatever the walk put in
 * localStorage is therefore written into the page ahead of the app, so the
 * second run finds the same phone the first one did.
 */
const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window;

w.eval(process.argv[2] || "");

const store = {};
for(let i = 0; i < w.localStorage.length; i++){
  const key = w.localStorage.key(i);
  store[key] = w.localStorage.getItem(key);
}
const seed = "<script>Object.entries(" + JSON.stringify(store) +
  ").forEach(function(e){ localStorage.setItem(e[0], e[1]); });<\/script>";

/* Freeze it as it stands: the screens are divs, so the active one is enough. */
fs.writeFileSync(process.argv[3],
  "<!doctype html>" + dom.serialize().replace("<head>", "<head>" + seed));
