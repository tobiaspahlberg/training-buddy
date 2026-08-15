/* Take two.
 *
 * The first attempt animated the ends of every bone separately, so the bones
 * changed length as they moved - a thigh that grows by a fifth on the way up
 * is exactly the thing that reads as "wrong" without being able to say why.
 *
 * This one is a skeleton: fixed bone lengths, and a pose is the set of ANGLES
 * at the joints. Positions are worked out from the angles, so nothing can
 * stretch, and every joint travels on an arc because that is what a joint on
 * the end of a bone does. The in-between frames are computed here and written
 * out as a list of positions, so the phone only has to play them.
 *
 * Angles are degrees, 0 pointing right, 90 pointing down the screen.
 */
const fs = require("fs");

const rad = d => d * Math.PI / 180;
const step = (p, ang, len) => ({ x: p.x + Math.cos(rad(ang)) * len, y: p.y + Math.sin(rad(ang)) * len });
const r1 = n => Math.round(n * 10) / 10;

/* One body, in units of the view box. A figure is drawn twice over: the far
   side of the body thin and dim, the near side full - which is what makes a
   drawing read as three-quarters rather than as a diagram. */
const BODY = {
  torso: 46, neck: 13, upper: 25, fore: 23, hand: 0,
  thigh: 34, shin: 32, foot: 13, head: 11
};

/* Work out where everything is, for one pose. */
function skeleton(P, B){
  const L = Object.assign({}, BODY, B || {});
  const hip = { x: P.hipX, y: P.hipY };
  const shoulder = step(hip, P.torso, L.torso);
  const neck = step(shoulder, P.torso, L.neck * 0.4);
  const head = step(shoulder, P.head === undefined ? P.torso : P.head, L.neck + L.head * 0.8);

  /* Two bones, a root, and either the angles or the far end. Pinning the far
     end is what a foot on the floor is - and a hand on the floor, which is
     every press-up, and a hand on a bar, which is every pull-up: the body
     moves and the hand does not. */
  const reach = (root, ax, ay, first, second, bend) => {
    const dx = ax - root.x, dy = ay - root.y;
    const d = Math.min(Math.hypot(dx, dy), first + second - 0.001);
    const base = Math.atan2(dy, dx);
    const cos = (d * d + first * first - second * second) / (2 * d * first);
    const off = Math.acos(Math.min(1, Math.max(-1, cos))) * (bend < 0 ? -1 : 1);
    return { x: root.x + Math.cos(base + off) * first,
             y: root.y + Math.sin(base + off) * first };
  };

  const arm = (up, fo, pin, bend) => {
    if(pin){
      const elbow = reach(shoulder, pin.x, pin.y, L.upper, L.fore, bend);
      return { elbow: elbow, hand: pin };
    }
    const elbow = step(shoulder, up, L.upper);
    return { elbow: elbow, hand: step(elbow, fo, L.fore) };
  };
  /* Two ways to place a leg. Either the joints are given as angles, or the
     ankle is pinned where it stands and the knee is worked out - which is
     what a foot on the floor is, and what feet held together are. Without
     this a clamshell drags its own foot across the mat. */
  const leg = (th, sh, ft, pin, bend) => {
    if(pin){
      const knee = reach(hip, pin.x, pin.y, L.thigh, L.shin, bend);
      return { knee: knee, ankle: pin, toe: step(pin, ft, L.foot) };
    }
    const knee = step(hip, th, L.thigh);
    const ankle = step(knee, sh, L.shin);
    return { knee: knee, ankle: ankle, toe: step(ankle, ft, L.foot) };
  };

  const grip = s => P["hand" + s + "X"] === undefined ? null
                    : { x: P["hand" + s + "X"], y: P["hand" + s + "Y"] };
  const near = arm(P.upperA, P.foreA, grip("A"), P.armA === undefined ? 1 : P.armA);
  const far  = arm(P.upperB, P.foreB, grip("B"), P.armB === undefined ? 1 : P.armB);
  const pinA = P.ankleAX === undefined ? null : { x: P.ankleAX, y: P.ankleAY };
  const pinB = P.ankleBX === undefined ? null : { x: P.ankleBX, y: P.ankleBY };
  const nearLeg = leg(P.thighA, P.shinA, P.footA, pinA, P.bendA === undefined ? 1 : P.bendA);
  const farLeg  = leg(P.thighB, P.shinB, P.footB, pinB, P.bendB === undefined ? 1 : P.bendB);
  return {
    hip: hip, shoulder: shoulder, neck: neck, head: head,
    elbowA: near.elbow, handA: near.hand, elbowB: far.elbow, handB: far.hand,
    kneeA: nearLeg.knee, ankleA: nearLeg.ankle, toeA: nearLeg.toe,
    kneeB: farLeg.knee, ankleB: farLeg.ankle, toeB: farLeg.toe
  };
}

/* The far side first so the near side lies over it. */
const BONES = [
  ["hip", "kneeB", "far"], ["kneeB", "ankleB", "far"], ["ankleB", "toeB", "far"],
  ["shoulder", "elbowB", "far"], ["elbowB", "handB", "far"],
  ["hip", "shoulder", "near"], ["shoulder", "neck", "near"],
  ["hip", "kneeA", "near"], ["kneeA", "ankleA", "near"], ["ankleA", "toeA", "near"],
  ["shoulder", "elbowA", "armA"], ["elbowA", "handA", "armA"]
];

/* Ease in and out of every key pose, so the movement leans into itself
   instead of sliding at one speed from end to end. */
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* Sample the whole cycle. Each key pose carries the fraction of the loop it
   sits at, so a snatch can spend a long time setting up and a moment
   punching, which is what it actually feels like.

   A key is an anchor by default: the movement eases into it and comes to a
   stop. A key marked `flow` is a waypoint instead - the shape is passed
   through without stopping, and the easing belongs to the whole run of
   waypoints between the two anchors either side. That is the difference
   between a snatch and a snatch mimed in stages: the weight leaves the floor
   and arrives overhead in one movement, and only the floor and the lockout
   are places anybody actually stands still. */
function sample(keys, frames){
  const anchors = keys.map((k, i) => i).filter(i => !keys[i].flow);
  const out = [];
  for(let f = 0; f < frames; f++){
    const t = f / frames;
    /* Ease across the whole phase, from one anchor to the next … */
    let p = 0;
    while(p < anchors.length - 2 && keys[anchors[p + 1]].t <= t) p++;
    const a0 = keys[anchors[p]], b0 = keys[anchors[p + 1]];
    const span = b0.t - a0.t;
    const u = ease(span <= 0 ? 0 : Math.min(1, Math.max(0, (t - a0.t) / span)));
    /* … and read the shape off the waypoints at the eased time, not the real
       one, so passing one changes the direction without changing the speed. */
    const tv = a0.t + u * span;
    let i = anchors[p];
    while(i < anchors[p + 1] - 1 && keys[i + 1].t <= tv) i++;
    const a = keys[i], b = keys[i + 1];
    const leg = b.t - a.t;
    const k = leg <= 0 ? 0 : Math.min(1, Math.max(0, (tv - a.t) / leg));
    const pose = {};
    Object.keys(a.pose).forEach(j => {
      pose[j] = a.pose[j] + (b.pose[j] - a.pose[j]) * k;
    });
    /* The pose rides along with the joints it produced: a frame sometimes
       carries a number that is not a joint at all - which way up the weight
       is, for one - and working it out twice is how the two drift apart. */
    out.push(Object.assign(skeleton(pose, keys.body), { pose: pose }));
  }
  return out;
}


module.exports = { skeleton, sample, BODY, rad, step, r1 };
