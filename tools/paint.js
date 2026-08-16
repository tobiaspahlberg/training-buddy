/* The skeleton, dressed and painted. A limb is a thick round stroke, which is
   a filled capsule; the vest and the shorts are thicker strokes over the same
   bones; a shoe is a short fat one at the end of a shin.

   Whole units throughout: a drawing is drawn about 200 across and shown in a
   box under a hundred pixels wide, so a tenth of a unit is invisible and the
   file is a fifth smaller without it. */
const { sample } = require("./rig.js");
const r = Math.round;

/* Pixels to the unit, for every drawing alike. */
const SCALE = 0.55;

/* The far side of the body, which everything else lies over. */
const FAR = [
  ["hip", "kneeB", "far", 13], ["kneeB", "ankleB", "far", 11],
  ["ankleB", "toeB", "shoe-far", 9],
  ["shoulder", "elbowB", "far", 10], ["elbowB", "handB", "far", 9]
];
const NEAR = [
  ["hip", "shoulder", "vest", 25],
  ["hip", "kneeA", "skin", 15], ["kneeA", "ankleA", "skin", 12],
  ["hip", "kneeA", "shorts", 24],
  ["ankleA", "toeA", "shoe", 10]
];
const PAINT = FAR.concat(NEAR);

/* The near arm is painted after the head, because it is the arm that goes
   overhead and it went behind the face when it got there. */
const OVER = [
  ["shoulder", "elbowA", "skin", 11], ["elbowA", "handA", "skin", 10]
];

/* Something held: a shape drawn about nothing, carried to a hand, and turned
   with it. Two nested groups, because one element can only be given one
   transform. */
const HELD = {
  dumbbell: '<rect x="-12" y="-3.5" width="24" height="7" rx="2"/>' +
            '<rect x="-15" y="-9" width="7.5" height="18" rx="2.5"/>' +
            '<rect x="7.5" y="-9" width="7.5" height="18" rx="2.5"/>',
  /* A kettlebell hangs below the hand, so it is drawn below the origin. */
  kettle:   '<path d="M-6 3a6 6 0 0 1 12 0z" fill="none" stroke-width="3.5"/>' +
            '<circle cx="0" cy="12" r="9"/><rect x="-7" y="5" width="14" height="7" rx="2"/>',
  ball:     '<circle cx="0" cy="0" r="15"/>',
  /* A loaded barbell, end on: what you see from the side is the plate. */
  plate:    '<circle cx="0" cy="0" r="15" fill="none" stroke-width="9"/>',
  /* An erg handle, end on, and the seat under the hip. */
  bar:      '<rect x="-13" y="-4" width="26" height="8" rx="4"/>',
  seat:     '<rect x="-13" y="6" width="26" height="9" rx="4"/>'
};

/* How far a held thing reaches from the hand, for the crop. */
const HOLDS = { dumbbell: 16, kettle: 22, ball: 16, bar: 14, seat: 16, plate: 21 };

function dressed(o){
  const frames = sample(o.keys, o.frames || 26);
  const dur = o.dur || "3s";
  const vals = fn => frames.map(fn).concat([fn(frames[0])]).join(";");
  /* A joint that does not move over the whole loop is written once as an
     attribute rather than as a list of the same number forty times. Half of
     what a drawing weighs is a pinned foot repeating itself. */
  const same = fn => frames.every(f => fn(f) === fn(frames[0]));
  const anim = (attr, fn, type) =>
    same(fn) ? "" :
    "<animate" + (type ? "Transform" : "") + ' attributeName="' + attr + '"' +
    (type ? ' type="' + type + '"' : "") + ' values="' + vals(fn) +
    '" dur="' + dur + '" repeatCount="indefinite"/>';

  let out = "";
  if(o.props) out += o.props;
  if(o.ground)
    out += '<ellipse class="shadow" cx="' + r((frames[0].ankleA.x + frames[0].ankleB.x) / 2) +
      '" cy="' + o.ground + '" rx="26" ry="5"/>';

  const paint = ([a, b, cls, w]) => {
    /* Shorts stop half way down the thigh, so they are that bone cut short. */
    const cut = cls === "shorts" ? 0.62 : 1;
    const p = (f, k) => {
      const A = f[a], B = f[b];
      const q = { x1: A.x, y1: A.y, x2: A.x + (B.x - A.x) * cut, y2: A.y + (B.y - A.y) * cut };
      return q[k];
    };
    out += '<line class="' + cls + '" stroke-width="' + w + '"' +
      ["x1", "y1", "x2", "y2"].map(k => ' ' + k + '="' + r(p(frames[0], k)) + '"').join("") + ">" +
      ["x1", "y1", "x2", "y2"].map(k => anim(k, f => r(p(f, k)))).join("") +
      "</line>";
  };
  /* Something held can be painted between the two sides of the body, which is
     the only way a kettlebell is ever between the legs: in front of the far
     one and behind the near one. */
  /* What a thing is carried on is usually a joint, but it can be a pair of
     numbers written into the pose instead - which is how a ball leaves the
     hands and keeps going. */
  const where = (f, at) => f[at] || { x: f.pose[at + "X"], y: f.pose[at + "Y"] };
  const held = c => {
    const j = c.at || "handA";
    const move = f => r(where(f, j).x) + " " + r(where(f, j).y);
    const spin = f => r(c.spin ? f.pose[c.spin] || 0 : 0);
    /* An animate that was dropped for standing still leaves the group with no
       transform at all, so a constant one is written out as an attribute. */
    const fixed = (fn, kind) => anim("transform", fn, kind) ? "" :
      ' transform="' + kind + "(" + fn(frames[0]) + ')"';
    out += '<g class="' + (c.cls || "load") + '"><g' + fixed(move, "translate") + ">" +
      anim("transform", move, "translate") + "<g" + fixed(spin, "rotate") + ">" +
      anim("transform", spin, "rotate") +
      HELD[c.what] + "</g></g></g>";
  };

  FAR.forEach(paint);
  (o.carry || []).filter(c => c.behind).forEach(held);
  NEAR.forEach(paint);

  /* A tether: a line from a fixed point to something that moves, which is a
     chain on a rowing machine and nothing else so far. */
  if(o.tether){
    const t = o.tether;
    out += '<line class="' + (t.cls || "chain") + '" stroke-width="' + (t.w || 3) +
      '" x1="' + t.at[0] + '" y1="' + t.at[1] + '" x2="' + r(frames[0][t.to].x) +
      '" y2="' + r(frames[0][t.to].y) + '">' +
      anim("x2", f => r(f[t.to].x)) + anim("y2", f => r(f[t.to].y)) + "</line>";
  }

  const spot = (cls, rad, dx, dy) =>
    '<circle class="' + cls + '" r="' + rad + '" cx="' + r(frames[0].head.x + dx) +
    '" cy="' + r(frames[0].head.y + dy) + '">' +
    anim("cx", f => r(f.head.x + dx)) + anim("cy", f => r(f.head.y + dy)) + "</circle>";
  const face = o.facing === -1 ? -1 : 1;
  out += spot("hair", 12, -3 * face, -3);
  out += spot("skin-fill", 11, 0, 0);
  out += spot("nose", 2.6, 9 * face, 1);
  OVER.forEach(paint);

  (o.carry || []).filter(c => !c.behind).forEach(held);

  /* Crop to what is actually drawn, over every frame of it: the poses are
     written in a big square because that is easy to think in, and the figure
     uses about half of it. Strokes are measured from their edge, not their
     centre line, or the drawing is trimmed into. */
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const box = (x, y, rx, ry) => { x0 = Math.min(x0, x - rx); x1 = Math.max(x1, x + rx);
                                  y0 = Math.min(y0, y - (ry === undefined ? rx : ry));
                                  y1 = Math.max(y1, y + (ry === undefined ? rx : ry)); };
  frames.forEach(f => {
    PAINT.concat(OVER).forEach(([a, b, cls, w]) => { box(f[a].x, f[a].y, w / 2); box(f[b].x, f[b].y, w / 2); });
    box(f.head.x, f.head.y, 15);
    /* `crop:false` keeps a thing out of the box: a ball thrown out of the top
       of the picture is meant to be out of the picture, and growing the box to
       hold it shrinks the person for the sake of the empty air it flew
       through. */
    (o.carry || []).filter(c => c.crop !== false).forEach(c => {
      const p = where(f, c.at || "handA");
      box(p.x, p.y, HOLDS[c.what]);
    });
  });
  /* The shadow is wide and flat, and boxing it as a circle put twenty units of
     empty floor under every standing figure. */
  if(o.ground) box((frames[0].ankleA.x + frames[0].ankleB.x) / 2, o.ground, 26, 5);
  (o.include || []).forEach(p => box(p[0], p[1], 0));
  const pad = 2, W = Math.ceil(x1 - x0 + pad * 2), H = Math.ceil(y1 - y0 + pad * 2);
  /* Every drawing is authored in the same units - a person is about 150 tall -
     so one scale for all of them is what makes the figures the same size. The
     width and height are pixels, the view box is units, and the difference
     between them is the whole of it: a drawing whose box happens to be short
     and wide, which is what a press-up is, must come out small and wide rather
     than being stretched to the height of a standing one. */
  return '<svg class="demo" width="' + Math.round(W * SCALE) +
    '" height="' + Math.round(H * SCALE) + '" viewBox="' +
    Math.floor(x0 - pad) + " " + Math.floor(y0 - pad) + " " + W + " " + H + '">' + out + "</svg>";
}

const CSS = `
  .demo line{stroke-linecap:round;fill:none}
  .demo .skin{stroke:var(--skin)}
  .demo .far{stroke:var(--skin-far)}
  .demo .vest{stroke:var(--vest)}
  .demo .shorts{stroke:var(--shorts)}
  .demo .shoe{stroke:var(--shoe)}
  .demo .shoe-far{stroke:var(--shoe-far)}
  .demo .skin-fill{fill:var(--skin)}
  .demo .hair{fill:var(--hair)}
  .demo .nose{fill:var(--skin-far)}
  .demo .shadow{fill:rgba(255,255,255,.055)}
  .demo .load rect,.demo .load circle,.demo .load path{fill:var(--warm);stroke:var(--warm)}
  .demo .kit{fill:none;stroke:var(--kit);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
  .demo .kit-fill{fill:var(--kit);stroke:none}
  .demo .chain{stroke:var(--kit)}`;

module.exports = { dressed, CSS, PAINT, OVER };
