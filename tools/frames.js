/* Every frame of one movement, not every key pose.
 *
 * `stills.js` shows the poses that were written down, and they can all be
 * right while the movement between them is wrong: an angle is only settled to
 * within a whole turn, so a thigh that ends up pointing left can get there by
 * swinging left or by going up over the top, and nothing in the key poses says
 * which. This lays the sampled frames out in order, which does.
 *
 *   node tools/frames.js /tmp/f.html rotknee [24]
 */
const fs = require("fs");
const { ALL, dressed, CSS } = require("./all.js");
const { sample } = require("./rig.js");

const id = process.argv[3];
const row = ALL.find(x => x[0] === id);
if(!row){ console.error("no such drawing: " + id); process.exit(1); }
const o = row[2];
const n = Number(process.argv[4]) || o.frames || 24;

/* Every frame in the box of the whole animation, or each one is cropped to
   itself and the figure jumps about inside a still strip. */
const box = dressed(o).match(/width="\d+" height="\d+" viewBox="[^"]+"/)[0];
const cells = sample(o.keys, n).map((f, i) =>
  '<div>' + dressed(Object.assign({}, o, { frames: 1,
      keys: [{ t: 0, pose: f.pose }, { t: 1, pose: f.pose }] }))
      .replace(/width="\d+" height="\d+" viewBox="[^"]+"/, box) +
  "<b>" + i + "</b></div>").join("");

fs.writeFileSync(process.argv[2] || "/tmp/frames.html", `<!doctype html><meta charset=utf-8>
<title>${row[1]}, frame by frame</title>
<style>
  :root{--bg:#0E1712;--line:#2C4438;--dim:#8CA79A;
        --skin:#F2C9A0;--skin-far:#C79A74;--vest:#7E8891;--shorts:#33496E;--shorts-far:#28364F;
        --shoe:#EDEFEC;--shoe-far:#AAB0AE;--hair:#6E4A2E;--warm:#FBBF24;--kit:#7C8A99}
  body{margin:0;background:var(--bg);color:#F2F7F4;padding:12px;
    font-family:-apple-system,sans-serif}
  .strip{display:flex;flex-wrap:wrap;gap:4px}
  .strip>div{border:1px solid var(--line);border-radius:6px;padding:2px;text-align:center;zoom:1.4}
  .strip b{display:block;font-size:9px;color:var(--dim);font-weight:400}
  ${CSS}
  .kitload circle,.kitload rect{fill:var(--kit)}
  .far-load rect,.far-load circle{fill:#B98C1B;stroke:#B98C1B}
</style><div class="strip">${cells}</div>`);
console.log(n + " frames of " + id);
