/* Every drawing the app has or is being asked for.
 *
 * A pose is angles at the joints, in degrees, 0 pointing right and 90 pointing
 * down the screen. Feet and hands can be pinned instead: `ankleAX/Y` puts a
 * foot where it stands, `handAX/Y` puts a hand on the floor or on a bar, and
 * the joint above is worked out. A `flow` key is a shape the movement passes
 * through rather than stops at.
 *
 * Every pose of one movement must carry the SAME keys, or interpolating
 * between them produces NaN. That is why a burpee pins its hands even while
 * standing: a hand pinned where it would hang anyway is the same drawing.
 */
const { dressed, CSS } = require("./paint.js");

const P = (base, o) => Object.assign({}, base, o);

/* ===================== air squat ===================== */
const squat = {
  w: 180, h: 210, ground: 190, dur: "3.2s", frames: 26,
  keys: [
    { t: 0,   pose: { hipX: 96, hipY: 126, torso: -92, head: -90,
                      upperA: 84, foreA: 88, upperB: 88, foreB: 92,
                      ankleAX: 100, ankleAY: 190, footA: 0, bendA: -1,
                      ankleBX: 84, ankleBY: 190, footB: 0, bendB: -1,
                      thighA: 0, shinA: 0, thighB: 0, shinB: 0 } },
    { t: .40, pose: { hipX: 78, hipY: 158, torso: -58, head: -52,
                      upperA: -6, foreA: -2, upperB: -2, foreB: 2,
                      ankleAX: 100, ankleAY: 190, footA: 0, bendA: -1,
                      ankleBX: 84, ankleBY: 190, footB: 0, bendB: -1,
                      thighA: 0, shinA: 0, thighB: 0, shinB: 0 } },
    { t: .52, pose: { hipX: 78, hipY: 158, torso: -58, head: -52,
                      upperA: -6, foreA: -2, upperB: -2, foreB: 2,
                      ankleAX: 100, ankleAY: 190, footA: 0, bendA: -1,
                      ankleBX: 84, ankleBY: 190, footB: 0, bendB: -1,
                      thighA: 0, shinA: 0, thighB: 0, shinB: 0 } },
    { t: 1,   pose: { hipX: 96, hipY: 126, torso: -92, head: -90,
                      upperA: 84, foreA: 88, upperB: 88, foreB: 92,
                      ankleAX: 100, ankleAY: 190, footA: 0, bendA: -1,
                      ankleBX: 84, ankleBY: 190, footB: 0, bendB: -1,
                      thighA: 0, shinA: 0, thighB: 0, shinB: 0 } }
  ]
};

/* ===================== dumbbell snatch ===================== */
const sfeet = { ankleAX: 108, ankleAY: 182, footA: 0, bendA: -1,
                ankleBX: 92,  ankleBY: 184, footB: 0, bendB: -1,
                thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const sn = o => P(sfeet, o);
const sFloor = sn({ hipX: 70, hipY: 152, torso: -32, head: -10,
                    upperA: 92, foreA: 90, upperB: 140, foreB: 125, dbA: 0 });
const sTall  = sn({ hipX: 92, hipY: 124, torso: -90, head: -88,
                    upperA: -84, foreA: -90, upperB: 96, foreB: 92, dbA: -180 });
const sKnee  = sn({ hipX: 76, hipY: 138, torso: -50, head: -36,
                    upperA: 94, foreA: 92, upperB: 130, foreB: 115, dbA: -32 });
const sBelt  = sn({ hipX: 82, hipY: 130, torso: -70, head: -56,
                    upperA: 96, foreA: 94, upperB: 120, foreB: 110, dbA: -50 });
const sPull  = sn({ hipX: 86, hipY: 126, torso: -80, head: -68,
                    upperA: 85, foreA: -60, upperB: 112, foreB: 100, dbA: -111 });
const sTurn  = sn({ hipX: 90, hipY: 125, torso: -86, head: -80,
                    upperA: -55, foreA: -155, upperB: 100, foreB: 96, dbA: -156 });

const snatch = {
  ground: 190, dur: "4.2s", frames: 36, carry: [{ what: "dumbbell", spin: "dbA" }],
  keys: [
    { t: 0,    pose: sFloor },
    { t: .075, flow: true, pose: sKnee },
    { t: .118, flow: true, pose: sBelt },
    { t: .265, flow: true, pose: sPull },
    { t: .362, flow: true, pose: sTurn },
    { t: .42,  pose: sTall },
    { t: .60,  pose: sTall },
    { t: .656, flow: true, pose: sTurn },
    { t: .748, flow: true, pose: sPull },
    { t: .888, flow: true, pose: sBelt },
    { t: .928, flow: true, pose: sKnee },
    { t: 1,    pose: sFloor }
  ]
};

/* ===================== push-up =====================
   Hands on the floor and toes on the floor: the two ends are pinned and
   everything between them is worked out, which is what a press-up is. */
const pu = { handAX: 180, handAY: 182, handBX: 188, handBY: 184, armA: 1, armB: 1,
             ankleAX: 73, ankleAY: 174, footA: 115, bendA: -1,
             ankleBX: 81, ankleBY: 178, footB: 115, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0 };
const puTop = P(pu, { hipX: 133, hipY: 152, torso: -20, head: -25 });
const puLow = P(pu, { hipX: 136, hipY: 166, torso: -7, head: -12 });

const pushup = {
  /* Head at the right end, like everything else here: a movement seen from
     the side is done to the right unless there is a reason. Mirroring a pose
     is 180 minus every angle, and every bend sign the other way round. */
  dur: "3s", frames: 26,
  keys: [{ t: 0, pose: puTop }, { t: .40, pose: puLow },
         { t: .50, pose: puLow }, { t: 1, pose: puTop }]
};

/* ===================== pull-up =====================
   The hands are the only thing that does not move. */
const bar = '<rect class="kit-fill" x="34" y="26" width="124" height="8" rx="4"/>';
/* The two arms take opposite bends, because the hands are on opposite sides of
   the shoulder: which solution of the two an elbow should take depends on
   which side of the body its hand is, not on which arm it is. */
const pl = { handAX: 108, handAY: 34, handBX: 78, handBY: 36, armA: 1, armB: -1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             footA: 25, footB: 25, bendA: 1, bendB: 1 };
const plHang = P(pl, { hipX: 92, hipY: 126, torso: -90, head: -88,
                       thighA: 96, shinA: 94, thighB: 92, shinB: 90 });
const plTop  = P(pl, { hipX: 94, hipY: 104, torso: -90, head: -88,
                       thighA: 104, shinA: 128, thighB: 100, shinB: 124 });

const pullup = {
  dur: "3.4s", frames: 28, props: bar, include: [[34, 26], [158, 34]],
  keys: [{ t: 0, pose: plHang }, { t: .38, pose: plTop },
         { t: .50, pose: plTop }, { t: 1, pose: plHang }]
};

/* ===================== box jump =====================
   The feet are pinned on the floor, then not pinned at all - which is what
   being in the air is - and then pinned on top of the box. */
const box = '<rect class="kit-fill" x="132" y="146" width="62" height="46" rx="4"/>';
const bj = { upperB: 0, foreB: 0, upperA: 0, foreA: 0,
             footA: 0, footB: 0, bendA: -1, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const bjStand = P(bj, { hipX: 86, hipY: 120, torso: -90, head: -88,
                        ankleAX: 94, ankleAY: 182, ankleBX: 80, ankleBY: 184,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });
const bjDip   = P(bj, { hipX: 74, hipY: 142, torso: -58, head: -50,
                        ankleAX: 94, ankleAY: 182, ankleBX: 80, ankleBY: 184,
                        upperA: 152, foreA: 140, upperB: 148, foreB: 136 });
const bjFly   = P(bj, { hipX: 108, hipY: 96, torso: -78, head: -68,
                        ankleAX: 132, ankleAY: 122, ankleBX: 120, ankleBY: 126,
                        upperA: -24, foreA: -34, upperB: -20, foreB: -30 });
const bjLand  = P(bj, { hipX: 150, hipY: 112, torso: -66, head: -58,
                        ankleAX: 162, ankleAY: 146, ankleBX: 148, ankleBY: 148,
                        upperA: 8, foreA: 16, upperB: 12, foreB: 20 });
const bjUp    = P(bj, { hipX: 154, hipY: 84, torso: -90, head: -88,
                        ankleAX: 162, ankleAY: 146, ankleBX: 148, ankleBY: 148,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });

const boxjump = {
  ground: 192, dur: "4s", frames: 32, props: box, include: [[132, 146], [194, 192]],
  keys: [
    { t: 0,   pose: bjStand },
    { t: .18, pose: bjDip },
    { t: .30, flow: true, pose: bjFly },
    { t: .42, pose: bjLand },
    { t: .58, pose: bjUp },
    { t: .74, pose: bjUp },
    { t: 1,   pose: bjStand }
  ]
};

/* ===================== burpee =====================
   Five places, and it is the press-up with three more around it: the hands go
   down in front and stay there while the feet shoot back, and the shape at the
   bottom is the bottom of a press-up, because that is what it is.

   The hands are pinned the whole way through. On the floor that is the point -
   they stay while everything else moves - and standing, a hand pinned where it
   would have hung anyway draws the same arm. */
const bp = { footA: 0, footB: 0, bendA: -1, bendB: -1, armA: 1, armB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };

/* 1. stood up straight */
const bpStand = P(bp, { hipX: 146, hipY: 120, torso: -90, head: -88,
                        ankleAX: 150, ankleAY: 182, ankleBX: 138, ankleBY: 184,
                        handAX: 144, handAY: 121, handBX: 136, handBY: 123 });
/* 2. down on the knees with the hands on the floor, in front */
const bpDown  = P(bp, { hipX: 128, hipY: 163, torso: -30, head: -12,
                        ankleAX: 150, ankleAY: 182, ankleBX: 138, ankleBY: 184,
                        handAX: 180, handAY: 182, handBX: 188, handBY: 184,
                        footA: 20, footB: 20 });
/* 3. feet jumped back, and the shape is the bottom of a press-up */
const bpLow   = P(bp, { hipX: 136, hipY: 166, torso: -7, head: -12,
                        ankleAX: 73, ankleAY: 174, ankleBX: 81, ankleBY: 178,
                        handAX: 180, handAY: 182, handBX: 188, handBY: 184,
                        footA: 115, footB: 115 });
/* 5. up and off the floor, hands clapped over the head */
const bpJump  = P(bp, { hipX: 146, hipY: 94, torso: -90, head: -88,
                        ankleAX: 150, ankleAY: 156, ankleBX: 138, ankleBY: 158,
                        handAX: 148, handAY: 3, handBX: 144, handBY: 6,
                        footA: 55, footB: 55 });

const burpee = {
  ground: 190, dur: "4.6s", frames: 38,
  keys: [
    { t: 0,   pose: bpStand },
    { t: .13, pose: bpDown },
    { t: .28, pose: bpLow },
    { t: .38, pose: bpLow },
    { t: .52, pose: bpDown },
    /* standing is passed through on the way up, not stood in: the last of it
       is a jump, and stopping first makes it two movements */
    { t: .62, flow: true, pose: bpStand },
    { t: .72, pose: bpJump },
    { t: .84, pose: bpStand },
    { t: 1,   pose: bpStand }
  ]
};

/* ===================== wall ball ===================== */
const wb = { ankleAX: 102, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 86, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const wbStand = P(wb, { hipX: 94, hipY: 120, torso: -90, head: -88,
                        upperA: 105, foreA: -25, upperB: 100, foreB: -30 });
const wbLow   = P(wb, { hipX: 76, hipY: 154, torso: -58, head: -50,
                        upperA: 100, foreA: -30, upperB: 96, foreB: -34 });
const wbThrow = P(wb, { hipX: 94, hipY: 118, torso: -90, head: -84,
                        upperA: -60, foreA: -70, upperB: -56, foreB: -66 });

const wallball = {
  ground: 190, dur: "3.6s", frames: 30, carry: [{ what: "ball", cls: "kitload" }],
  keys: [
    { t: 0,   pose: wbStand },
    { t: .32, pose: wbLow },
    { t: .40, pose: wbLow },
    { t: .58, pose: wbThrow },
    { t: .70, pose: wbThrow },
    { t: 1,   pose: wbStand }
  ]
};

/* ===================== kettlebell swing =====================
   The arms stay long: the bell is swung by the hips, not lifted by the arms,
   and a drawing that bends the elbow is teaching the wrong thing. */
const kb = { ankleAX: 112, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 96, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const kbBack = P(kb, { hipX: 72, hipY: 148, torso: -28, head: -14,
                       upperA: 132, foreA: 130, upperB: 136, foreB: 134, kbA: 40 });
const kbMid  = P(kb, { hipX: 88, hipY: 132, torso: -62, head: -50,
                       upperA: 55, foreA: 53, upperB: 59, foreB: 57, kbA: -37 });
const kbTop  = P(kb, { hipX: 100, hipY: 120, torso: -90, head: -86,
                       upperA: 5, foreA: 3, upperB: 9, foreB: 7, kbA: -87 });

const swing = {
  ground: 190, dur: "3.4s", frames: 30,
  /* The far hand, and painted between the two sides of the body: from the side
     the bell goes between the legs, which means behind the near one. */
  carry: [{ what: "kettle", at: "handB", spin: "kbA", behind: true }],
  keys: [
    { t: 0,   pose: kbBack },
    { t: .16, flow: true, pose: kbMid },
    { t: .40, pose: kbTop },
    { t: .62, flow: true, pose: kbMid },
    { t: 1,   pose: kbBack }
  ]
};

/* ===================== walking lunge ===================== */
const ln = { thighA: 0, shinA: 0, thighB: 0, shinB: 0, bendA: -1, bendB: -1 };
const lnStand = P(ln, { hipX: 92, hipY: 120, torso: -90, head: -88,
                        ankleAX: 100, ankleAY: 182, footA: 0,
                        ankleBX: 86, ankleBY: 184, footB: 0,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });
const lnDown  = P(ln, { hipX: 96, hipY: 150, torso: -88, head: -84,
                        ankleAX: 126, ankleAY: 182, footA: 0,
                        ankleBX: 62, ankleBY: 172, footB: 55,
                        upperA: 100, foreA: 96, upperB: 88, foreB: 84 });

const lunge = {
  ground: 190, dur: "3.4s", frames: 28,
  keys: [{ t: 0, pose: lnStand }, { t: .36, pose: lnDown },
         { t: .48, pose: lnDown }, { t: 1, pose: lnStand }]
};

/* ===================== strict press ===================== */
const pr = { ankleAX: 98, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 84, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             hipX: 92, hipY: 120, torso: -90 };
const prRack = P(pr, { head: -88, upperA: 95, foreA: -55, upperB: 85, foreB: -65, dbA: 0 });
const prTop  = P(pr, { head: -88, upperA: -85, foreA: -90, upperB: -88, foreB: -92, dbA: 0 });

const press = {
  ground: 190, dur: "3.2s", frames: 26,
  carry: [{ what: "dumbbell", at: "handB", cls: "load far-load" },
          { what: "dumbbell", at: "handA" }],
  keys: [{ t: 0, pose: prRack }, { t: .38, pose: prTop },
         { t: .52, pose: prTop }, { t: 1, pose: prRack }]
};

/* ===================== sit-up =====================
   Lying down the torso points left, sitting up it points up and right. Written
   as 300 rather than -60 so it swings up through the vertical: read as -60 the
   body would come up through the floor. */
const su = { ankleAX: 140, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 130, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0, hipX: 100, hipY: 176 };
const suDown = P(su, { torso: 178, head: 176, upperA: -10, foreA: -120,
                       upperB: -16, foreB: -126 });
const suUp   = P(su, { torso: 300, head: 305, upperA: 110, foreA: 10,
                       upperB: 104, foreB: 4 });

const situp = {
  ground: 190, dur: "3.2s", frames: 26,
  keys: [{ t: 0, pose: suDown }, { t: .40, pose: suUp },
         { t: .52, pose: suUp }, { t: 1, pose: suDown }]
};

/* ===================== row, on the machine =====================
   The one drawing that is mostly not a person: "1000 m row" means the erg,
   and without the rail and the flywheel a seated figure pulling at the air is
   any number of things. */
const erg =
  '<rect class="kit-fill" x="30" y="164" width="160" height="8" rx="4"/>' +
  '<rect class="kit-fill" x="182" y="96" width="26" height="76" rx="8"/>' +
  '<rect class="kit-fill" x="150" y="126" width="10" height="26" rx="3"/>';
const rw = { footA: -30, footB: -30, bendA: -1, bendB: -1, armA: 1, armB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             ankleAX: 154, ankleAY: 138, ankleBX: 146, ankleBY: 142,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const rwCatch  = P(rw, { hipX: 128, hipY: 152, torso: -70, head: -58,
                         handAX: 182, handAY: 118, handBX: 176, handBY: 120 });
const rwFinish = P(rw, { hipX: 92, hipY: 152, torso: -112, head: -100,
                         handAX: 106, handAY: 126, handBX: 100, handBY: 128 });

const row = {
  dur: "3.6s", frames: 30, props: erg, include: [[30, 96], [208, 172]],
  tether: { at: [190, 118], to: "handA" },
  carry: [{ what: "seat", at: "hip", cls: "kitload" },
          { what: "bar", at: "handA", cls: "kitload" }],
  keys: [
    { t: 0,   pose: rwCatch },
    { t: .40, pose: rwFinish },
    { t: .52, pose: rwFinish },
    { t: 1,   pose: rwCatch }
  ]
};

const ALL = [
  ["squat", "Air squat", squat, "In the app already."],
  ["snatch", "Dumbbell snatch", snatch, "In the app already."],
  ["pushup", "Push-up", pushup, "Six lines call for this one, more than anything else."],
  ["pullup", "Pull-up", pullup, "The bar is drawn because a hanging figure without one is falling."],
  ["boxjump", "Box jump", boxjump, "Feet pinned on the floor, then on nothing, then on the box."],
  ["burpee", "Burpee", burpee, "The long one: down, back, chest, in, up."],
  ["wallball", "Wall ball", wallball, "The ball stays in the hands – thrown, it would have to come back."],
  ["swing", "Kettlebell swing", swing, "The arms stay long: it is the hips that swing it."],
  ["lunge", "Walking lunge", lunge, "Back heel up, front knee over the foot."],
  ["press", "Strict press", press, "No leg drive – the hips do not move."],
  ["situp", "Sit-up", situp, "Feet down, torso up."],
  ["row", "Row", row, "Mostly machine: &ldquo;1000 m row&rdquo; means the erg."]
];

module.exports = { ALL, dressed, CSS };
