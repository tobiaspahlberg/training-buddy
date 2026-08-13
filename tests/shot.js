/* A screenshot of a screen the app has to be walked into first: jsdom cannot
   draw, so the app is stepped there and the page written out for Chromium. */
const fs=require("fs"), {JSDOM}=require("jsdom");
const html=fs.readFileSync(require("path").join(__dirname, "..", "docs", "index.html"),"utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.org/"});
const w=dom.window;
w.eval(process.argv[2] || "");
/* Freeze it as it stands: the screens are divs, so the active one is enough. */
fs.writeFileSync(process.argv[3], "<!doctype html>" + dom.serialize());
