/* Puts the drawings into docs/index.html, replacing whatever is in
   <div id="demos" hidden>. Run it after changing a pose:

       node tools/into-app.js            # every drawing that is shipped
       node tools/into-app.js --list     # say which those are and stop

   SHIPPED is the list, and it is deliberately not "all of them": a drawing
   goes in when it has been looked at and approved, not when it renders. */
const fs = require("fs"), path = require("path");
const { ALL, dressed } = require("./all.js");

const SHIPPED = ["squat", "snatch", "pushup", "pullup", "boxjump", "burpee",
                 "wallball", "swing", "lunge", "press", "pushpress", "thruster",
                 "kneeraise", "deadlift", "goblet", "situp", "row"];

if(process.argv.includes("--list")){
  console.log(SHIPPED.join(" "));
  process.exit(0);
}

/* One element to a line, so the block can be read down even though nobody
   should be editing it by hand. */
const lines = svg => {
  const out = []; let buf = "";
  svg.replace(/></g, ">\n<").split("\n").forEach(l => {
    if(l.startsWith("<animate")) buf += l;
    else { if(buf) out.push(buf); buf = l; }
  });
  if(buf) out.push(buf);
  return out.join("\n");
};

const block = SHIPPED.map(id => {
  const found = ALL.find(row => row[0] === id);
  if(!found) throw new Error("no drawing called " + id);
  return lines(dressed(found[2]).replace('<svg class="demo"',
    '<svg class="demo" data-demo="' + id + '"'));
}).join("\n");

const file = path.join(__dirname, "..", "docs", "index.html");
const html = fs.readFileSync(file, "utf8");
const open = '<div id="demos" hidden>\n', shut = '\n</div>\n\n<!-- Changelog.';
const a = html.indexOf(open), b = html.indexOf(shut, a);
if(a < 0 || b < 0) throw new Error("cannot find the drawings block in docs/index.html");
fs.writeFileSync(file, html.slice(0, a + open.length) + block + html.slice(b));

console.log(SHIPPED.length + " drawings, " + block.length + " bytes:");
SHIPPED.forEach(id => console.log("  " + id.padEnd(10) +
  String(dressed(ALL.find(r => r[0] === id)[2]).length).padStart(6)));
