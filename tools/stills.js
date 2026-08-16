/* Every key pose of every movement, all at the scale of its own animation.
   A still is where broken geometry shows; the animation only blurs it. */
const fs = require("fs");
const { ALL, dressed, CSS } = require("./all.js");

const rows = ALL.filter(([id]) => !process.argv[3] || process.argv[3].split(",").includes(id))
  .map(([id, name, o]) => {
    const box = dressed(o).match(/width="\d+" height="\d+" viewBox="[^"]+"/)[0];
    const stills = o.keys.map((k, i) =>
      dressed(Object.assign({}, o, { frames: 1,
        keys: [{ t: 0, pose: k.pose }, { t: 1, pose: k.pose }] }))
        .replace(/width="\d+" height="\d+" viewBox="[^"]+"/, box));
    return '<h2>' + name + '</h2><div class="strip">' +
      stills.map((s, i) => '<div>' + s + '<b>' + o.keys[i].t + (o.keys[i].flow ? " ~" : "") + '</b></div>').join("") +
      '</div>';
  }).join("");

fs.writeFileSync(process.argv[2] || "/tmp/stills.html", `<!doctype html><meta charset=utf-8>
<style>
  :root{--bg:#0E1712;--surface:#17241D;--line:#2C4438;--text:#F2F7F4;--dim:#8CA79A;
        --skin:#F2C9A0;--skin-far:#C79A74;--vest:#3F6098;--shorts:#6E7A82;--shorts-far:#4E5760;
        --shoe:#EDEFEC;--shoe-far:#AAB0AE;--hair:#3E2C1E;--warm:#FBBF24;--kit:#7C8A99}
  body{margin:0;background:var(--bg);color:var(--text);padding:12px;
    font-family:-apple-system,sans-serif}
  h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);margin:14px 0 6px}
  .strip{display:flex;flex-wrap:wrap;gap:4px}
  .strip>div{border:1px solid var(--line);border-radius:8px;padding:2px;text-align:center}
  .strip b{display:block;font-size:10px;color:var(--dim);font-weight:400}
  ${CSS}
  .strip>div{zoom:1.8}
  .kitload circle,.kitload rect{fill:var(--kit)}
  .far-load rect{fill:#B98C1B}
</style>` + rows);
console.log("stills written");
