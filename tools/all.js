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
/* The ball is carried on a pair of numbers of its own rather than on the hand,
   so that at the top it can go on without them - which is the whole movement.
   It is left out of the crop: it is meant to leave the picture, and growing
   the box to follow it would shrink the person for the sake of the air. */
const wbStand = P(wb, { hipX: 94, hipY: 120, torso: -90, head: -88,
                        upperA: 105, foreA: -25, upperB: 100, foreB: -30,
                        ballX: 108, ballY: 89 });
const wbLow   = P(wb, { hipX: 76, hipY: 154, torso: -58, head: -50,
                        upperA: 100, foreA: -30, upperB: 96, foreB: -34,
                        ballX: 116, ballY: 128 });
const wbThrow = P(wb, { hipX: 94, hipY: 118, torso: -90, head: -84,
                        upperA: -60, foreA: -70, upperB: -56, foreB: -66,
                        ballX: 114, ballY: 26 });
const wbGone  = P(wb, { hipX: 94, hipY: 118, torso: -90, head: -84,
                        upperA: -62, foreA: -74, upperB: -58, foreB: -70,
                        ballX: 118, ballY: -12 });

const wallball = {
  ground: 190, dur: "3.6s", frames: 30,
  carry: [{ what: "ball", at: "ball", cls: "kitload", crop: false }],
  keys: [
    { t: 0,   pose: wbStand },
    { t: .30, pose: wbLow },
    { t: .38, pose: wbLow },
    /* the drive and the throw are one movement: the ball is not put anywhere */
    { t: .54, flow: true, pose: wbThrow },
    { t: .64, pose: wbGone },
    { t: 1,   pose: wbStand }
  ]
};

/* ===================== kettlebell swing =====================
   The arms stay long: the bell is swung by the hips, not lifted by the arms,
   and a drawing that bends the elbow is teaching the wrong thing. */
const kb = { ankleAX: 112, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 96, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
/* The arms point down and only a little back: further back than this and the
   bell swings past the leg instead of between them, which is the difference
   between a swing and waving a weight about behind you. */
const kbBack = P(kb, { hipX: 72, hipY: 148, torso: -28, head: -14,
                       upperA: 149, foreA: 147, upperB: 147, foreB: 145, kbA: 55 });
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

/* ===================== thruster =====================
   A front squat and a press, and it is drawn as exactly that: the two are one
   movement, so standing is passed through on the way up rather than stood in. */
const feetAB = { ankleAX: 100, ankleAY: 182, footA: 0, bendA: -1,
                 ankleBX: 86, ankleBY: 184, footB: 0, bendB: -1,
                 thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const rackArms = { upperA: 95, foreA: -55, upperB: 85, foreB: -65 };
const overArms = { upperA: -85, foreA: -90, upperB: -88, foreB: -92 };

const thRack = P(feetAB, Object.assign({ hipX: 94, hipY: 120, torso: -90, head: -88 }, rackArms));
const thLow  = P(feetAB, Object.assign({ hipX: 78, hipY: 152, torso: -58, head: -50 }, rackArms));
const thTop  = P(feetAB, Object.assign({ hipX: 94, hipY: 118, torso: -90, head: -88 }, overArms));

const twoBells = [{ what: "dumbbell", at: "handB", cls: "load far-load" },
                  { what: "dumbbell", at: "handA" }];

const thruster = {
  ground: 190, dur: "3.8s", frames: 32, carry: twoBells,
  keys: [
    { t: 0,   pose: thRack },
    { t: .26, pose: thLow },
    { t: .34, pose: thLow },
    { t: .46, flow: true, pose: thRack },
    { t: .58, pose: thTop },
    { t: .74, pose: thTop },
    { t: 1,   pose: thRack }
  ]
};

/* ===================== push press =====================
   The strict press with a dip in it, which is the whole difference between
   them: a short bend at the knees, and the legs start the weight. */
const ppDip = P(feetAB, Object.assign({ hipX: 94, hipY: 134, torso: -90, head: -88 }, rackArms));

const pushpress = {
  ground: 190, dur: "3.4s", frames: 28, carry: twoBells,
  keys: [
    { t: 0,   pose: thRack },
    { t: .20, pose: ppDip },
    { t: .30, flow: true, pose: thRack },
    { t: .44, pose: thTop },
    { t: .62, pose: thTop },
    { t: 1,   pose: thRack }
  ]
};

/* ===================== hanging knee raise =====================
   The pull-up's bar and the pull-up's hang, with the knees doing the work
   instead of the arms. */
const hk = { handAX: 108, handAY: 34, handBX: 78, handBY: 36, armA: 1, armB: -1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             footA: 25, footB: 25, bendA: 1, bendB: 1, hipX: 92, hipY: 126 };
const hkHang = P(hk, { torso: -90, head: -88,
                       thighA: 96, shinA: 94, thighB: 92, shinB: 90 });
const hkUp   = P(hk, { torso: -96, head: -94,
                       thighA: -33, shinA: 40, thighB: -37, shinB: 36 });

const kneeraise = {
  dur: "3.2s", frames: 26, props: bar, include: [[34, 26], [158, 34]],
  keys: [{ t: 0, pose: hkHang }, { t: .36, pose: hkUp },
         { t: .48, pose: hkUp }, { t: 1, pose: hkHang }]
};

/* ===================== deadlift ===================== */
const dl = { ankleAX: 104, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 88, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             upperA: 92, foreA: 90, upperB: 88, foreB: 86 };
const dlFloor = P(dl, { hipX: 70, hipY: 146, torso: -34, head: -14 });
const dlStand = P(dl, { hipX: 92, hipY: 122, torso: -90, head: -88 });

const deadlift = {
  ground: 190, dur: "3.4s", frames: 28, carry: [{ what: "plate" }],
  keys: [{ t: 0, pose: dlFloor }, { t: .36, pose: dlStand },
         { t: .50, pose: dlStand }, { t: 1, pose: dlFloor }]
};

/* ===================== goblet squat =====================
   The air squat with a bell held at the chest, which is the only difference
   and the reason it is a different line on the board. */
const gbArms = { upperA: 100, foreA: -30, upperB: 92, foreB: -38 };
const gbStand = P(feetAB, Object.assign({ hipX: 94, hipY: 120, torso: -90, head: -88 }, gbArms));
const gbLow   = P(feetAB, Object.assign({ hipX: 78, hipY: 152, torso: -58, head: -50 }, gbArms));

const goblet = {
  ground: 190, dur: "3.2s", frames: 26, carry: [{ what: "kettle" }],
  keys: [{ t: 0, pose: gbStand }, { t: .36, pose: gbLow },
         { t: .48, pose: gbLow }, { t: 1, pose: gbStand }]
};

/* ===================== good morning =====================
   A hinge with a barbell across the back, which is how it is nearly always
   done. What you see of the bar from the side is the plate, as in the
   deadlift, and it rides on the hands - which are pinned onto the bar, so it
   sits where it belongs on the traps and travels with the shoulders.

   The arms are the one liberty here. Hands on a bar behind the neck have the
   upper arm hanging back and the forearm coming back up to it, which in this
   one plane is an elbow bending the wrong way: the joint is only legal because
   the whole arm is turned out to the side, and out to the side is the
   direction a flat drawing has not got. Pinning the hands is what says so -
   `page.js` leaves a pinned limb to the rig rather than checking it - and at
   the size this is looked at, an elbow is four pixels. */
const gm = { ankleAX: 100, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 86, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             armA: -1, armB: -1, upperA: 0, foreA: 0, upperB: 0, foreB: 0 };
const gmTall = P(gm, { hipX: 94, hipY: 122, torso: -90, head: -86,
                       handAX: 78, handAY: 84, handBX: 74, handBY: 86 });
/* Hinged: the hips go back over the heels and the back stays flat, so the
   torso comes down as one piece and the bar with it. */
const gmOver = P(gm, { hipX: 76, hipY: 126, torso: -16, head: -8,
                       handAX: 108, handAY: 100, handBX: 104, handBY: 102 });

const goodmorning = {
  ground: 190, dur: "3.4s", frames: 28,
  carry: [{ what: "plate", at: "handB", cls: "load far-load" },
          { what: "plate", at: "handA" }],
  keys: [{ t: 0, pose: gmTall }, { t: .38, pose: gmOver },
         { t: .50, pose: gmOver }, { t: 1, pose: gmTall }]
};

/* ===================== ostrich walk =====================
   A short step forward and the whole trunk folded over the front foot with
   both arms, legs straight: it is a hamstring stretch you walk with, so the
   drawing alternates which foot is in front rather than travelling, the way
   the walking lunge does. */
const ow = { thighA: 0, shinA: 0, thighB: 0, shinB: 0, bendA: -1, bendB: -1,
             armA: 1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             footA: 0, footB: 0 };
const owTall = P(ow, { hipX: 100, hipY: 122, torso: -90, head: -88,
                       ankleAX: 108, ankleAY: 182, ankleBX: 94, ankleBY: 184,
                       handAX: 96, handAY: 124, handBX: 92, handBY: 126 });
const owNear = P(ow, { hipX: 100, hipY: 124, torso: -26, head: -14,
                       ankleAX: 126, ankleAY: 182, ankleBX: 86, ankleBY: 184,
                       handAX: 132, handAY: 152, handBX: 128, handBY: 154 });
const owFar  = P(ow, { hipX: 100, hipY: 124, torso: -26, head: -14,
                       ankleAX: 88, ankleAY: 182, ankleBX: 124, ankleBY: 184,
                       handAX: 130, handAY: 154, handBX: 126, handBY: 156 });

const ostrich = {
  ground: 190, dur: "4.6s", frames: 38,
  keys: [
    { t: 0,   pose: owTall },
    { t: .18, pose: owNear },
    { t: .30, pose: owNear },
    { t: .46, pose: owTall },
    { t: .62, pose: owFar },
    { t: .74, pose: owFar },
    { t: 1,   pose: owTall }
  ]
};

/* ===================== bow, bend, squat =====================
   Three things one after another, which is why the name has commas in it: fold
   down to the feet, stand and arch back with the arms overhead, then an
   ordinary air squat. Drawn as three, with a pause at each, because it is
   three. */
const bbs = { ankleAX: 100, ankleAY: 190, footA: 0, bendA: -1,
              ankleBX: 84, ankleBY: 190, footB: 0, bendB: -1,
              thighA: 0, shinA: 0, thighB: 0, shinB: 0,
              armA: 1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0 };
const bbsTall  = P(bbs, { hipX: 96, hipY: 126, torso: -92, head: -90,
                          handAX: 92, handAY: 128, handBX: 88, handBY: 130 });
const bbsBow   = P(bbs, { hipX: 80, hipY: 140, torso: -20, head: -4,
                          handAX: 112, handAY: 172, handBX: 108, handBY: 174 });
const bbsArch  = P(bbs, { hipX: 96, hipY: 124, torso: -98, head: -108,
                          handAX: 78, handAY: 36, handBX: 74, handBY: 40 });
const bbsSquat = P(bbs, { hipX: 78, hipY: 158, torso: -58, head: -52,
                          handAX: 146, handAY: 112, handBX: 142, handBY: 114 });

const bowbend = {
  ground: 190, dur: "6s", frames: 46,
  keys: [
    { t: 0,   pose: bbsTall },
    { t: .14, pose: bbsBow },
    { t: .24, pose: bbsBow },
    { t: .38, flow: true, pose: bbsTall },
    { t: .46, pose: bbsArch },
    { t: .56, pose: bbsArch },
    { t: .68, flow: true, pose: bbsTall },
    { t: .78, pose: bbsSquat },
    { t: .86, pose: bbsSquat },
    { t: 1,   pose: bbsTall }
  ]
};

/* ===================== heel touch =====================
   The sit-up's start, held, with the hands going down the sides by turns. From
   the side they cannot arrive: a heel is eighty-odd units from a shoulder and
   an arm is forty-eight, and the reason a real one touches is that the trunk
   tips sideways - which is the one direction there is not. What is drawn is
   the reaching, alternate and endless, which is what it looks like anyway. */
const hl = { ankleAX: 140, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 130, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             armA: 1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             hipX: 100, hipY: 174, torso: 195, head: 200 };
const hlNear = P(hl, { handAX: 98, handAY: 180, handBX: 64, handBY: 140 });
const hlFar  = P(hl, { handAX: 66, handAY: 142, handBX: 96, handBY: 182 });

const heeltouch = {
  ground: 190, dur: "3s", frames: 26,
  keys: [{ t: 0, pose: hlNear }, { t: .30, pose: hlNear },
         { t: .52, pose: hlFar }, { t: .80, pose: hlFar },
         { t: 1, pose: hlNear }]
};

/* ===================== gorilla row =====================
   This was in tools/README.md as one the rig could not draw, and it was: bent
   over a bell in each hand, the hands, the bells and the feet all landed
   within twenty units of each other and it came out a smudge with a head. What
   was wrong was the stance. Standing wide with the hips high puts thirty units
   between the feet and the bells, which is enough, and one bell comes to the
   ribs while the other stays on the floor - the alternating is the movement. */
const gr = { ankleAX: 108, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 68, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             armA: 1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             hipX: 84, hipY: 150, torso: -20, head: -6,
             handBX: 140, handBY: 180 };
const grDown = P(gr, { handAX: 146, handAY: 178 });
const grPull = P(gr, { handAX: 112, handAY: 148 });

const gorilla = {
  ground: 190, dur: "3.4s", frames: 28,
  carry: [{ what: "dumbbell", at: "handB", cls: "load far-load" },
          { what: "dumbbell", at: "handA" }],
  keys: [{ t: 0, pose: grDown }, { t: .38, pose: grPull },
         { t: .52, pose: grPull }, { t: 1, pose: grDown }]
};

/* ===================== plank knee-to-elbow =====================
   A plank with a knee driven forward to the elbow, and then the other. It goes
   across the body in life, and across is towards you here, so what is drawn is
   the half of it that lies in the page: the knee arriving. */
const pk = { handAX: 180, handAY: 182, handBX: 188, handBY: 184, armA: 1, armB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             bendA: -1, bendB: -1, footA: 115, footB: 115,
             hipX: 133, hipY: 150, torso: -18, head: -22 };
const pkFlat = P(pk, { ankleAX: 73, ankleAY: 174, ankleBX: 81, ankleBY: 178 });
const pkNear = P(pk, { ankleAX: 152, ankleAY: 172, ankleBX: 81, ankleBY: 178,
                       footA: 150 });
const pkFar  = P(pk, { ankleAX: 73, ankleAY: 174, ankleBX: 146, ankleBY: 176,
                       footB: 150 });

const plankknee = {
  dur: "4s", frames: 32,
  keys: [
    { t: 0,   pose: pkFlat },
    { t: .16, pose: pkNear },
    { t: .28, pose: pkNear },
    { t: .44, flow: true, pose: pkFlat },
    { t: .60, pose: pkFar },
    { t: .72, pose: pkFar },
    { t: 1,   pose: pkFlat }
  ]
};

/* ===================== broad jump =====================
   The box jump with the box taken away: the whole of it is that he lands
   somewhere else, so he jumps to the right and stays there long enough to be
   seen standing before the loop takes him back. */
const bd = { upperB: 0, foreB: 0, upperA: 0, foreA: 0,
             footA: 0, footB: 0, bendA: -1, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const bdStand = P(bd, { hipX: 62, hipY: 120, torso: -90, head: -88,
                        ankleAX: 70, ankleAY: 182, ankleBX: 56, ankleBY: 184,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });
const bdDip   = P(bd, { hipX: 52, hipY: 146, torso: -54, head: -46,
                        ankleAX: 70, ankleAY: 182, ankleBX: 56, ankleBY: 184,
                        upperA: 158, foreA: 146, upperB: 154, foreB: 142 });
/* Off the floor the arms are thrown forward and the legs are behind: a jump
   for distance is a body laid out along where it is going. */
const bdFly   = P(bd, { hipX: 104, hipY: 108, torso: -70, head: -58,
                        ankleAX: 96, ankleAY: 150, ankleBX: 84, ankleBY: 154,
                        upperA: -20, foreA: -30, upperB: -16, foreB: -26,
                        footA: 40, footB: 40 });
const bdLand  = P(bd, { hipX: 140, hipY: 142, torso: -62, head: -54,
                        ankleAX: 156, ankleAY: 182, ankleBX: 144, ankleBY: 184,
                        upperA: 6, foreA: 14, upperB: 10, foreB: 18 });
const bdUp    = P(bd, { hipX: 148, hipY: 120, torso: -90, head: -88,
                        ankleAX: 156, ankleAY: 182, ankleBX: 144, ankleBY: 184,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });

const broadjump = {
  ground: 190, dur: "4s", frames: 32,
  keys: [
    { t: 0,   pose: bdStand },
    { t: .16, pose: bdDip },
    { t: .28, flow: true, pose: bdFly },
    { t: .40, pose: bdLand },
    { t: .54, pose: bdUp },
    { t: .74, pose: bdUp },
    { t: 1,   pose: bdStand }
  ]
};

/* ===================== ball slam =====================
   Overhead and then straight down into the floor. The ball rides on numbers of
   its own rather than on the hand, because the point of a slam is that the
   ball goes on without it: the hands stop at the knees and the ball does not.
   Then he stands up with it again, which is the only honest way to loop. */
const bs = { ankleAX: 102, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 86, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const bsUp    = P(bs, { hipX: 94, hipY: 120, torso: -90, head: -84,
                        upperA: -80, foreA: -86, upperB: -84, foreB: -90,
                        ballX: 100, ballY: 12 });
const bsThrow = P(bs, { hipX: 88, hipY: 132, torso: -70, head: -56,
                        upperA: 30, foreA: 24, upperB: 34, foreB: 28,
                        ballX: 138, ballY: 108 });
const bsFloor = P(bs, { hipX: 76, hipY: 150, torso: -40, head: -22,
                        upperA: 82, foreA: 76, upperB: 86, foreB: 80,
                        ballX: 130, ballY: 176 });
const bsPick  = P(bs, { hipX: 76, hipY: 150, torso: -40, head: -22,
                        upperA: 62, foreA: 58, upperB: 66, foreB: 62,
                        ballX: 124, ballY: 176 });

const ballslam = {
  ground: 190, dur: "3.8s", frames: 32,
  carry: [{ what: "ball", at: "ball", cls: "kitload" }],
  keys: [
    { t: 0,   pose: bsUp },
    { t: .16, flow: true, pose: bsThrow },
    { t: .26, pose: bsFloor },
    { t: .40, pose: bsPick },
    { t: .72, pose: bsUp },
    { t: 1,   pose: bsUp }
  ]
};

/* ===================== hip thrust =====================
   Shoulders on the bench, feet under the knees, and nothing moves but the
   hips. He lies head to the left and feet to the right, which is the way the
   sit-up and the C-crunch lie: face up, the rule about facing right has
   nothing to say, and what is left is that the two of them should agree. The
   bench is therefore on the left. */
const bench = '<rect class="kit-fill" x="40" y="150" width="76" height="9" rx="4"/>' +
              '<rect class="kit-fill" x="49" y="159" width="9" height="32" rx="3"/>';
const ht = { ankleAX: 184, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 196, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             upperA: 160, foreA: 164, upperB: 156, foreB: 160 };
const htDown = P(ht, { hipX: 140, hipY: 182, torso: 213, head: 206 });
const htTop  = P(ht, { hipX: 140, hipY: 157, torso: 184, head: 178 });

const hipthrust = {
  dur: "3.2s", frames: 26, props: bench,
  include: [[40, 150], [116, 191]],
  keys: [{ t: 0, pose: htDown }, { t: .36, pose: htTop },
         { t: .52, pose: htTop }, { t: 1, pose: htDown }]
};

/* ===================== reverse lunge =====================
   The walking lunge stepping the other way: the front foot never moves, and
   the back one goes behind and comes back to it. That difference is the whole
   reason it is its own line on a board. */
const rl = { thighA: 0, shinA: 0, thighB: 0, shinB: 0, bendA: -1, bendB: -1 };
const rlStand = P(rl, { hipX: 100, hipY: 120, torso: -90, head: -88,
                        ankleAX: 108, ankleAY: 182, footA: 0,
                        ankleBX: 96, ankleBY: 184, footB: 0,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });
const rlBack  = P(rl, { hipX: 100, hipY: 150, torso: -84, head: -80,
                        ankleAX: 108, ankleAY: 182, footA: 0,
                        ankleBX: 58, ankleBY: 172, footB: 55,
                        upperA: 104, foreA: 100, upperB: 84, foreB: 80 });

const revlunge = {
  ground: 190, dur: "3.4s", frames: 28,
  keys: [{ t: 0, pose: rlStand }, { t: .36, pose: rlBack },
         { t: .48, pose: rlBack }, { t: 1, pose: rlStand }]
};

/* ===================== overhead lunge =====================
   The walking lunge with the weight locked out over the head, which is where
   all the difficulty of it is. */
const olStand = P(ln, { hipX: 92, hipY: 120, torso: -90, head: -88,
                        ankleAX: 100, ankleAY: 182, footA: 0,
                        ankleBX: 86, ankleBY: 184, footB: 0,
                        upperA: -85, foreA: -90, upperB: -88, foreB: -92 });
const olDown  = P(ln, { hipX: 96, hipY: 150, torso: -88, head: -84,
                        ankleAX: 126, ankleAY: 182, footA: 0,
                        ankleBX: 62, ankleBY: 172, footB: 55,
                        upperA: -84, foreA: -89, upperB: -87, foreB: -91 });

const ohlunge = {
  ground: 190, dur: "3.4s", frames: 28, carry: twoBells,
  keys: [{ t: 0, pose: olStand }, { t: .36, pose: olDown },
         { t: .48, pose: olDown }, { t: 1, pose: olStand }]
};

/* ===================== overhead triceps extension =====================
   The one shape in this family the rig can hold: the elbow stays where it is,
   high, and only the forearm moves - which folds the joint the way it shuts,
   not the way a snatch asks it to. */
const te = { ankleAX: 98, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 84, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             hipX: 92, hipY: 120, torso: -90, head: -88 };
const teTop  = P(te, { upperA: -84, foreA: -88, upperB: -88, foreB: -92 });
const teBack = P(te, { upperA: -84, foreA: -202, upperB: -88, foreB: -206 });

const tricep = {
  ground: 190, dur: "3.2s", frames: 26, carry: [{ what: "dumbbell" }],
  keys: [{ t: 0, pose: teTop }, { t: .36, pose: teBack },
         { t: .50, pose: teBack }, { t: 1, pose: teTop }]
};

/* ===================== C-crunch =====================
   Not a sit-up: the back never leaves the floor as one piece. The shoulders
   and the knees come towards each other and the body makes the letter, which
   is where the name is from and what the drawing has to show. */
const cc = { footA: -20, footB: -20, bendA: 1, bendB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             hipX: 104, hipY: 172, armA: 1, armB: 1 };
const ccLong  = P(cc, { torso: 186, head: 184,
                        thighA: -6, shinA: -2, thighB: -10, shinB: -6,
                        handAX: 128, handAY: 158, handBX: 124, handBY: 162 });
const ccTight = P(cc, { torso: 205, head: 212,
                        thighA: -84, shinA: 4, thighB: -88, shinB: 0,
                        handAX: 100, handAY: 148, handBX: 96, handBY: 152 });

const ccrunch = {
  ground: 190, dur: "3.2s", frames: 26,
  keys: [{ t: 0, pose: ccLong }, { t: .38, pose: ccTight },
         { t: .50, pose: ccTight }, { t: 1, pose: ccLong }]
};

/* ===================== ski erg =====================
   Standing at the machine, which is what tells it from the rower: the handles
   come from over the head and finish past the hips, and the hinge does most of
   it. The frame is drawn for the same reason the erg's is - a figure pulling
   at the air is any number of things. */
const skiFrame =
  '<rect class="kit-fill" x="150" y="16" width="10" height="176" rx="4"/>' +
  '<rect class="kit-fill" x="126" y="16" width="40" height="10" rx="4"/>' +
  '<rect class="kit-fill" x="120" y="168" width="52" height="9" rx="4"/>';
const sk = { ankleAX: 96, ankleAY: 182, footA: 0, bendA: -1,
             ankleBX: 82, ankleBY: 184, footB: 0, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0,
             armA: 1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0 };
const skTall = P(sk, { hipX: 92, hipY: 120, torso: -90, head: -86,
                       handAX: 128, handAY: 40, handBX: 122, handBY: 44 });
const skPull = P(sk, { hipX: 78, hipY: 138, torso: -46, head: -34,
                       handAX: 112, handAY: 150, handBX: 106, handBY: 154 });

const ski = {
  ground: 190, dur: "3.4s", frames: 28, props: skiFrame,
  include: [[120, 16], [172, 192]],
  tether: { at: [155, 24], to: "handA" },
  carry: [{ what: "bar", at: "handA", cls: "kitload" }],
  keys: [{ t: 0, pose: skTall }, { t: .36, pose: skPull },
         { t: .48, pose: skPull }, { t: 1, pose: skTall }]
};

/* ===================== kneeling ball slam =====================
   The same slam with the legs taken out of it, which is the whole point of
   naming it: down on both knees, so nothing but the arms and the trunk can
   move. The shins are pinned behind him and the knees fall where they must. */
const kbs = { ankleAX: 64, ankleAY: 186, footA: -20, bendA: -1,
              ankleBX: 54, ankleBY: 188, footB: -20, bendB: -1,
              thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const kbsUp    = P(kbs, { hipX: 94, hipY: 148, torso: -90, head: -84,
                          upperA: -80, foreA: -86, upperB: -84, foreB: -90,
                          ballX: 100, ballY: 42 });
const kbsThrow = P(kbs, { hipX: 92, hipY: 150, torso: -74, head: -60,
                          upperA: 26, foreA: 20, upperB: 30, foreB: 24,
                          ballX: 132, ballY: 122 });
const kbsFloor = P(kbs, { hipX: 88, hipY: 152, torso: -52, head: -34,
                          upperA: 74, foreA: 68, upperB: 78, foreB: 72,
                          ballX: 128, ballY: 176 });
const kbsPick  = P(kbs, { hipX: 88, hipY: 152, torso: -52, head: -34,
                          upperA: 56, foreA: 50, upperB: 60, foreB: 54,
                          ballX: 122, ballY: 176 });

const kneelslam = {
  ground: 190, dur: "3.8s", frames: 32,
  carry: [{ what: "ball", at: "ball", cls: "kitload" }],
  keys: [
    { t: 0,   pose: kbsUp },
    { t: .16, flow: true, pose: kbsThrow },
    { t: .26, pose: kbsFloor },
    { t: .40, pose: kbsPick },
    { t: .72, pose: kbsUp },
    { t: 1,   pose: kbsUp }
  ]
};

/* ===================== renegade row =====================
   A plank on two bells with one of them pulled to the ribs. The body is meant
   not to move, which is the exercise and also a problem for a drawing: what
   moves is one arm, so the far bell stays on the floor and the near one comes
   up, and the hips are allowed the little they really do give. */
const rn = { handBX: 188, handBY: 184, armA: 1, armB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             ankleAX: 73, ankleAY: 174, footA: 115, bendA: -1,
             ankleBX: 81, ankleBY: 178, footB: 115, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const rnPlank = P(rn, { hipX: 133, hipY: 150, torso: -18, head: -22,
                        handAX: 180, handAY: 182 });
const rnRow   = P(rn, { hipX: 133, hipY: 148, torso: -16, head: -20,
                        handAX: 172, handAY: 150 });

const renegade = {
  dur: "3.4s", frames: 28,
  carry: [{ what: "dumbbell", at: "handB", cls: "load far-load" },
          { what: "dumbbell", at: "handA" }],
  keys: [{ t: 0, pose: rnPlank }, { t: .38, pose: rnRow },
         { t: .50, pose: rnRow }, { t: 1, pose: rnPlank }]
};

/* ===================== devil's press =====================
   A burpee holding two bells, and then they go over the head in one swing. It
   is the burpee's five places with a sixth on the end, and the sixth is the
   only reason it is not a burpee. */
const dp = { footA: 0, footB: 0, bendA: -1, bendB: -1, armA: 1, armB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const dpHang = P(dp, { hipX: 146, hipY: 120, torso: -90, head: -88,
                       ankleAX: 150, ankleAY: 182, ankleBX: 138, ankleBY: 184,
                       handAX: 144, handAY: 121, handBX: 136, handBY: 123 });
const dpDown = P(dp, { hipX: 128, hipY: 163, torso: -30, head: -12,
                       ankleAX: 150, ankleAY: 182, ankleBX: 138, ankleBY: 184,
                       handAX: 180, handAY: 182, handBX: 188, handBY: 184,
                       footA: 20, footB: 20 });
const dpLow  = P(dp, { hipX: 136, hipY: 166, torso: -7, head: -12,
                       ankleAX: 73, ankleAY: 174, ankleBX: 81, ankleBY: 178,
                       handAX: 180, handAY: 182, handBX: 188, handBY: 184,
                       footA: 115, footB: 115 });
/* Halfway up, the bells swung out in front: passed through, never stood in */
const dpSwing = P(dp, { hipX: 140, hipY: 132, torso: -68, head: -56,
                        ankleAX: 150, ankleAY: 182, ankleBX: 138, ankleBY: 184,
                        handAX: 182, handAY: 120, handBX: 176, handBY: 124 });
const dpOver = P(dp, { hipX: 148, hipY: 118, torso: -90, head: -84,
                       ankleAX: 150, ankleAY: 182, ankleBX: 138, ankleBY: 184,
                       handAX: 152, handAY: 28, handBX: 144, handBY: 32 });

const devilpress = {
  ground: 190, dur: "5.2s", frames: 42, carry: twoBells,
  keys: [
    { t: 0,   pose: dpHang },
    { t: .11, pose: dpDown },
    { t: .24, pose: dpLow },
    { t: .33, pose: dpLow },
    { t: .45, pose: dpDown },
    { t: .55, flow: true, pose: dpSwing },
    { t: .66, pose: dpOver },
    { t: .80, pose: dpOver },
    { t: 1,   pose: dpHang }
  ]
};

/* ===================== box jump over =====================
   A box jump, and then he steps off the far side instead of back down the way
   he came. That is what the name means: nobody clears the box, and the whole
   difference is the ending - which is why the step down is the half of this
   drawing worth watching, and why the jump up is exactly the box jump's. */
const boxo = '<rect class="kit-fill" x="112" y="146" width="52" height="46" rx="4"/>';
const bo = { upperB: 0, foreB: 0, upperA: 0, foreA: 0,
             footA: 0, footB: 0, bendA: -1, bendB: -1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const boStand = P(bo, { hipX: 66, hipY: 120, torso: -90, head: -88,
                        ankleAX: 74, ankleAY: 182, ankleBX: 60, ankleBY: 184,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });
const boDip   = P(bo, { hipX: 54, hipY: 142, torso: -58, head: -50,
                        ankleAX: 74, ankleAY: 182, ankleBX: 60, ankleBY: 184,
                        upperA: 152, foreA: 140, upperB: 148, foreB: 136 });
const boFly   = P(bo, { hipX: 88, hipY: 96, torso: -78, head: -68,
                        ankleAX: 112, ankleAY: 122, ankleBX: 100, ankleBY: 126,
                        upperA: -24, foreA: -34, upperB: -20, foreB: -30 });
const boLand  = P(bo, { hipX: 130, hipY: 112, torso: -66, head: -58,
                        ankleAX: 142, ankleAY: 146, ankleBX: 128, ankleBY: 148,
                        upperA: 8, foreA: 16, upperB: 12, foreB: 20 });
const boUp    = P(bo, { hipX: 134, hipY: 84, torso: -90, head: -88,
                        ankleAX: 142, ankleAY: 146, ankleBX: 128, ankleBY: 148,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });
/* The step off: the lead foot reaches for the floor on the far side while the
   other is still on the box, which is the moment that says "over" and not
   "onto". */
const boStep  = P(bo, { hipX: 152, hipY: 116, torso: -84, head: -80,
                        ankleAX: 184, ankleAY: 182, ankleBX: 132, ankleBY: 148,
                        upperA: 120, foreA: 112, upperB: 70, foreB: 62 });
const boOff   = P(bo, { hipX: 180, hipY: 120, torso: -90, head: -88,
                        ankleAX: 188, ankleAY: 182, ankleBX: 174, ankleBY: 184,
                        upperA: 95, foreA: 92, upperB: 92, foreB: 88 });

const boxover = {
  ground: 192, dur: "5s", frames: 40, props: boxo, include: [[112, 146], [164, 192]],
  keys: [
    { t: 0,   pose: boStand },
    { t: .14, pose: boDip },
    { t: .24, flow: true, pose: boFly },
    { t: .32, pose: boLand },
    { t: .44, pose: boUp },
    { t: .56, pose: boUp },
    { t: .70, pose: boStep },
    { t: .80, pose: boOff },
    { t: .94, pose: boOff },
    { t: 1,   pose: boStand }
  ]
};

/* ===================== burpee box jump =====================
   The burpee, moved left to leave room, and then he goes up onto the box
   instead of jumping on the spot. Two movements written as one, because that
   is what it is on the board and what it feels like on the floor. */
const bbox = '<rect class="kit-fill" x="150" y="146" width="52" height="46" rx="4"/>';
const bb = { footA: 0, footB: 0, bendA: -1, bendB: -1, armA: 1, armB: 1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const bbStand = P(bb, { hipX: 96, hipY: 120, torso: -90, head: -88,
                        ankleAX: 100, ankleAY: 182, ankleBX: 88, ankleBY: 184,
                        handAX: 94, handAY: 121, handBX: 86, handBY: 123 });
const bbDown  = P(bb, { hipX: 78, hipY: 163, torso: -30, head: -12,
                        ankleAX: 100, ankleAY: 182, ankleBX: 88, ankleBY: 184,
                        handAX: 130, handAY: 182, handBX: 138, handBY: 184,
                        footA: 20, footB: 20 });
const bbLow   = P(bb, { hipX: 86, hipY: 166, torso: -7, head: -12,
                        ankleAX: 23, ankleAY: 174, ankleBX: 31, ankleBY: 178,
                        handAX: 130, handAY: 182, handBX: 138, handBY: 184,
                        footA: 115, footB: 115 });
const bbFly   = P(bb, { hipX: 130, hipY: 100, torso: -78, head: -68,
                        ankleAX: 152, ankleAY: 124, ankleBX: 140, ankleBY: 128,
                        handAX: 150, handAY: 82, handBX: 142, handBY: 86,
                        footA: 45, footB: 45 });
const bbLand  = P(bb, { hipX: 168, hipY: 112, torso: -66, head: -58,
                        ankleAX: 180, ankleAY: 146, ankleBX: 166, ankleBY: 148,
                        handAX: 190, handAY: 112, handBX: 182, handBY: 116 });
const bbTop   = P(bb, { hipX: 172, hipY: 84, torso: -90, head: -88,
                        ankleAX: 180, ankleAY: 146, ankleBX: 166, ankleBY: 148,
                        handAX: 170, handAY: 85, handBX: 162, handBY: 87 });

const burpeebox = {
  ground: 192, dur: "5.4s", frames: 44, props: bbox, include: [[150, 146], [202, 192]],
  keys: [
    { t: 0,   pose: bbStand },
    { t: .10, pose: bbDown },
    { t: .22, pose: bbLow },
    { t: .30, pose: bbLow },
    { t: .42, pose: bbDown },
    { t: .52, flow: true, pose: bbStand },
    { t: .62, flow: true, pose: bbFly },
    { t: .70, pose: bbLand },
    { t: .80, pose: bbTop },
    { t: .90, pose: bbTop },
    { t: 1,   pose: bbStand }
  ]
};

/* ===================== burpee pull-up =====================
   The burpee done under a bar, and the jump at the end of it goes onto the
   bar. Hanging, the knees come up: with the floor drawn - and it has to be,
   there is a burpee on it - a hanging figure whose feet reach the ground is
   just a man standing under a bar. */
const bpuBar = '<rect class="kit-fill" x="44" y="24" width="112" height="8" rx="4"/>';
const bu = { footA: 0, footB: 0, bendA: -1, bendB: -1, armA: 1, armB: -1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const buStand = P(bu, { hipX: 96, hipY: 120, torso: -90, head: -88,
                        ankleAX: 100, ankleAY: 182, ankleBX: 88, ankleBY: 184,
                        handAX: 94, handAY: 121, handBX: 86, handBY: 123 });
const buDown  = P(bu, { hipX: 78, hipY: 163, torso: -30, head: -12,
                        ankleAX: 100, ankleAY: 182, ankleBX: 88, ankleBY: 184,
                        handAX: 130, handAY: 182, handBX: 138, handBY: 184,
                        footA: 20, footB: 20 });
const buLow   = P(bu, { hipX: 86, hipY: 166, torso: -7, head: -12,
                        ankleAX: 23, ankleAY: 174, ankleBX: 31, ankleBY: 178,
                        handAX: 130, handAY: 182, handBX: 138, handBY: 184,
                        footA: 115, footB: 115 });
const buHang  = P(bu, { hipX: 98, hipY: 126, torso: -90, head: -88,
                        ankleAX: 94, ankleAY: 166, ankleBX: 82, ankleBY: 170,
                        handAX: 114, handAY: 32, handBX: 84, handBY: 34,
                        footA: 25, footB: 25 });
const buPull  = P(bu, { hipX: 100, hipY: 104, torso: -90, head: -88,
                        ankleAX: 118, ankleAY: 150, ankleBX: 106, ankleBY: 154,
                        handAX: 114, handAY: 32, handBX: 84, handBY: 34,
                        footA: 25, footB: 25 });

const burpeepull = {
  ground: 190, dur: "5.4s", frames: 44, props: bpuBar, include: [[44, 24], [156, 32]],
  keys: [
    { t: 0,   pose: buStand },
    { t: .10, pose: buDown },
    { t: .22, pose: buLow },
    { t: .30, pose: buLow },
    { t: .42, pose: buDown },
    { t: .52, flow: true, pose: buStand },
    { t: .62, pose: buHang },
    { t: .74, pose: buPull },
    { t: .84, pose: buPull },
    { t: .94, flow: true, pose: buHang },
    { t: 1,   pose: buStand }
  ]
};

/* ============ five movements that had to be turned round ============
   These are the ones the side view had nothing to say about, because what
   happens in them happens across the body: a knee swinging left and right, a
   hop sideways, an elbow going out. Turned to face you they are all in the
   page again. The rig is the mascot's - a spread, two hips and two shoulders,
   `face: "front"` - and what it costs is the other direction: anything that
   now points at you is drawn as its shadow, which is what `armLen` and the
   rest are for. */
/* Face on gets him the front of his own head - two eyes rather than a nose in
   profile, which on a body squarely facing you reads as a person looking away
   - and the same smile as the figure beside the app's name, who is drawn from
   here too. It also gives the far leg its shorts: face on both legs are the
   same cloth in the same light. */
const FRONT = { face: "front", smile: true };
/* Feet face on point at you as much as across, so they are short and turned
   out, the way the mascot's are. */
const stance = (ax, bx, y) => ({
  ankleAX: ax, ankleAY: y, footA: 22, footLenA: 10, bendA: -1,
  ankleBX: bx, ankleBY: y + 2, footB: 158, footLenB: 10, bendB: 1,
  thighA: 0, shinA: 0, thighB: 0, shinB: 0 });

/* ===================== Pallof press =====================
   The movement is the not-turning: a band pulls from one side and the press
   away from the chest is what it gets to pull against.

   Face on, the press goes straight at you, and the hands therefore do not move
   on the page at all - they start in front of the sternum and finish in front
   of the sternum, further away. What moves is the elbows. Held in, they are
   out at his sides where you can see them; pressed out, the arms point at you
   and are drawn at half, which puts the elbow on the line between shoulder and
   hand and takes it out of the picture. Elbows there, elbows gone: that is
   what a press looks like from the front, and it is the only part of it that
   is in the page. Drawn instead as the arms simply shrinking, it read as him
   pulling them in, which is the movement backwards.

   The hands are pinned rather than angled, so the band ends where they are.
   From angles they wandered off behind his hip and the band stopped in mid-air
   beside him. */
const post = '<rect class="kit-fill" x="14" y="46" width="10" height="140" rx="4"/>';
const pf = Object.assign({ spread: 10, hipX: 100, hipY: 118, torso: -90, head: -90,
                           armA: -1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0,
                           handAX: 101, handAY: 96, handBX: 99, handBY: 97 },
                         stance(111, 89, 184));
const pfIn  = P(pf, { armLenA: 1, armLenB: 1 });
const pfOut = P(pf, { armLenA: .6, armLenB: .6 });

const pallof = Object.assign({}, FRONT, {
  ground: 190, dur: "3.6s", frames: 30, props: post,
  include: [[14, 46], [24, 186]],
  tether: { at: [24, 96], to: "handA", w: 4 },
  keys: [{ t: 0, pose: pfIn }, { t: .36, pose: pfOut },
         { t: .54, pose: pfOut }, { t: 1, pose: pfIn }]
});

/* ===================== rotating hanging knee raise =====================
   Hanging, and then the knees come up in front and the whole lower body turns
   with them. Three things had to be right before it read as that at all.

   The arms hang **straight**. The bar is far enough above the shoulders that
   there is nothing for the elbows to do; a hand pinned closer than the arm is
   long makes a diamond over his head that reads as a shrug.

   The knees come up **towards you**, so the thigh is nearly end on and drawn
   at two fifths while the shin still hangs down the page at its full length.
   That is why those two lengths are separate now: one number for the pair drew
   the legs as a horizontal bar sticking out of his hip.

   The turn is then what is left over. The knee moves a little to one side and
   the foot below it a long way, because the foot is further from the axis it
   is turning about. */
const rk = { spread: 10, hipX: 100, hipY: 128, torso: -90, head: -90,
             handAX: 118, handAY: 32, handBX: 82, handBY: 34, armA: 1, armB: -1,
             upperA: 0, foreA: 0, upperB: 0, foreB: 0,
             footLenA: 10, footLenB: 10,
             thighLenA: 1, thighLenB: 1, shinLenA: 1, shinLenB: 1 };
const rkHang = P(rk, { thighA: 92, shinA: 90, thighB: 88, shinB: 86,
                       footA: 30, footB: 150 });
/* Measured off a photograph, which is the only way this was ever going to come
   out right. Three tries of arithmetic all missed the same thing: in the real
   movement the knees do not come up in front and then turn. They go up and *to
   the side* together, so the thigh ends up close to horizontal - four fifths of
   its length, twenty degrees above the horizon - with the knee bent square and
   the shin hanging straight down off it. The knee lands level with the hip and
   a long way out, not twenty above it and a little way out.

   And the trunk leans the other way, which is what the hips do the work of.
   Leaning the torso tilts the pelvis with it, because `across()` measures the
   hip line square to the torso: swing the legs left and the left hip hikes up,
   which is what a body does and what the photograph shows. That tilt is most
   of what makes it read as a turn rather than a leg being lifted. */
const tuck = o => P(rk, Object.assign({ thighLenA: .8, thighLenB: .8 }, o));
const rkRight = tuck({ hipX: 96, torso: -98, head: -96,
                       thighA: -20, shinA: 100, thighB: -16, shinB: 96,
                       footA: 30, footB: 150 });
/* The other side is this one in a mirror and nothing else: 200 minus the hip,
   180 minus every angle, the feet included - they were left pointing the same
   way as each other and that was the half of it that looked wrong. The hands
   are the one thing not mirrored, because a mirror would slide his grip along
   the bar; which of the two legs is painted in front is not mirrored either,
   and at this size nobody can tell. */
const rkLeft  = tuck({ hipX: 104, torso: -82, head: -84,
                       thighA: -160, shinA: 80, thighB: -164, shinB: 84,
                       footA: 150, footB: 30 });

const rotknee = Object.assign({}, FRONT, {
  dur: "4.4s", frames: 36, props: bar, include: [[34, 26], [158, 34]],
  keys: [
    { t: 0,   pose: rkHang },
    { t: .18, pose: rkRight },
    { t: .30, pose: rkRight },
    { t: .44, flow: true, pose: rkHang },
    { t: .60, pose: rkLeft },
    { t: .72, pose: rkLeft },
    { t: 1,   pose: rkHang }
  ]
});

/* ===================== lateral jump =====================
   Two feet over a line and back. Nothing in it happens front to back, which is
   why the side view had nothing to draw. */
const line = '<rect class="kit-fill" x="92" y="184" width="16" height="6" rx="3"/>';
const lj = { spread: 10, torso: -90, head: -88,
             footA: 22, footLenA: 10, footB: 158, footLenB: 10, bendA: -1, bendB: 1,
             upperA: 60, foreA: 80, upperB: 120, foreB: 100,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const ljRight = P(lj, { hipX: 124, hipY: 122,
                        ankleAX: 136, ankleAY: 184, ankleBX: 114, ankleBY: 186 });
/* In the air the feet are pinned to where the air is, not left out: a key that
   has an ankle and one that has not interpolate to NaN between them. */
const ljAir   = P(lj, { hipX: 100, hipY: 104,
                        ankleAX: 112, ankleAY: 152, ankleBX: 90, ankleBY: 156,
                        upperA: 40, foreA: 60, upperB: 140, foreB: 120 });
const ljLeft  = P(lj, { hipX: 76, hipY: 122,
                        ankleAX: 88, ankleAY: 184, ankleBX: 66, ankleBY: 186 });

const latjump = Object.assign({}, FRONT, {
  ground: 190, dur: "3s", frames: 26, props: line, include: [[92, 184], [108, 190]],
  keys: [
    { t: 0,   pose: ljRight },
    { t: .16, flow: true, pose: ljAir },
    { t: .30, pose: ljLeft },
    { t: .50, pose: ljLeft },
    { t: .66, flow: true, pose: ljAir },
    { t: .80, pose: ljRight },
    { t: 1,   pose: ljRight }
  ]
});

/* ===================== lateral burpee over a dumbbell =====================
   Turned back to the side, and the drawing is better for it. Face on, the
   floor half of a burpee is a man coming at you and there is almost nothing of
   it to see; from the side it is the burpee this app already draws, exactly.

   What the side costs is the sideways, and the answer is to put the bell
   between him and you: it lies on the floor in front of his feet, painted over
   him because that is where it is, and he goes up and over it towards you. The
   hop itself is straight up on the page, because a jump towards the reader has
   nowhere else to go - but nobody looking at a man mid-air with a dumbbell at
   his shins is in any doubt which line this is. */
/* Low enough that the plank passes over it: laid on the floor at his shins it
   is in front of him, but at the bottom of a press-up he is in front of it and
   the bell reads as lying on his back. */
const bell = { bellX: 144, bellY: 187 };
const lbStand = P(bpStand, bell);
const lbDown  = P(bpDown, bell);
const lbLow   = P(bpLow, bell);
const lbJump  = P(bpJump, bell);

const latburpee = {
  ground: 190, dur: "4.6s", frames: 38,
  carry: [{ what: "dumbbell", at: "bell" }],
  keys: [
    { t: 0,   pose: lbStand },
    { t: .13, pose: lbDown },
    { t: .28, pose: lbLow },
    { t: .38, pose: lbLow },
    { t: .52, pose: lbDown },
    { t: .62, flow: true, pose: lbStand },
    { t: .72, pose: lbJump },
    { t: .84, pose: lbStand },
    { t: 1,   pose: lbStand }
  ]
};

/* ===================== sumo deadlift high pull =====================
   Face on for a reason the side view spelled out the hard way: the finish is
   the elbow above the hand, and getting it there in a side view means folding
   the joint past shut, because in life the elbow goes out to the side. Out to
   the side is across the page here, so the shape the rig could not make is the
   easy one. The stance is the other half of the name and is across the page
   too. */
/* Knees out over the toes, which is the whole of what "sumo" means and the
   one thing a narrow-stance deadlift does not do. The bend signs are what
   choose it: the knee goes to the side of the hip-to-ankle line that the sign
   picks, and inwards is the other one. */
const sm = { spread: 10, head: -90, torso: -90,
             ankleAX: 136, ankleAY: 184, footA: 30, footLenA: 11, bendA: -1,
             ankleBX: 64, ankleBY: 186, footB: 150, footLenB: 11, bendB: 1,
             thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
/* Folded over the bar. Face on that fold is the trunk pointing at you, so it
   is not a tilt - a tilt face on is a lean sideways - but a shortening: the
   torso is drawn at just over half, which brings the shoulders down to where
   straight arms reach the floor. */
const smDown = P(sm, { hipX: 100, hipY: 152, torsoLen: .62,
                       upperA: 90, foreA: 90, upperB: 90, foreB: 90,
                       barX: 100, barY: 172 });
/* The bar finishes at the collarbone, which is as low as it can finish: with
   the elbow above the hand the arm has folded, and a folded arm puts the hand
   back at the height it started from. That is the movement, not a compromise -
   a high pull that came to the belly would be a deadlift. */
const smPull = P(sm, { hipX: 100, hipY: 122, torsoLen: 1,
                       upperA: -37, foreA: 146, upperB: 217, foreB: 34,
                       barX: 100, barY: 74 });

const sumo = Object.assign({}, FRONT, {
  ground: 190, dur: "3.6s", frames: 30,
  carry: [{ what: "barbell", at: "bar" }],
  keys: [{ t: 0, pose: smDown }, { t: .40, pose: smPull },
         { t: .54, pose: smPull }, { t: 1, pose: smDown }]
});

/* ===================== the mascot =====================
   Not a movement: the figure that stands beside the app's name. He is here
   rather than drawn by hand because he has to be the same person as the ones
   in the sessions - same rig, same clothes, same colours - and he is defined
   further down, as `lean8`, because he is one of the poses that were drawn to
   choose between. */

/* ---- the same figure, doing something ----
   Candidates for the header. He is on screen the whole time home is, so
   whatever he does has to bear being looked at for a long time and not much
   at all. */

/* Running on the spot. Nothing is pinned: the feet leave the floor by turns,
   which is what running is, so the legs are given as angles and land where the
   angles put them. The knee comes up and the shin folds back under it - a shin
   that swings forward instead is a kick, and that is what the first attempt
   was. Opposite arm to opposite leg, as people are built. */
const runA = { footA: 30, footB: 30, bendA: 1, bendB: 1,
               hipX: 94, hipY: 112, torso: -88, head: -86,
               thighA: -14, shinA: 118, thighB: 108, shinB: 74,
               upperA: 140, foreA: 60, upperB: 60, foreB: -20 };
const runB = { footA: 30, footB: 30, bendA: 1, bendB: 1,
               hipX: 94, hipY: 112, torso: -88, head: -86,
               thighA: 108, shinA: 74, thighB: -18, shinB: 114,
               upperA: 60, foreA: -20, upperB: 140, foreB: 60 };
const runMid = { footA: 20, footB: 20, bendA: 1, bendB: 1,
                 hipX: 94, hipY: 118, torso: -89, head: -87,
                 thighA: 80, shinA: 95, thighB: 92, shinB: 88,
                 upperA: 100, foreA: 20, upperB: 100, foreB: 20 };

const mascotRun = {
  ground: 190, dur: "1.3s", frames: 18,
  keys: [
    { t: 0,   pose: runA },
    { t: .25, flow: true, pose: runMid },
    { t: .5,  pose: runB },
    { t: .75, flow: true, pose: runMid },
    { t: 1,   pose: runA }
  ]
};

/* A slow squat: the movement the app has most of, done by the figure who
   introduces it. */
const msFeet = { ankleAX: 100, ankleAY: 182, footA: 0, bendA: -1,
                 ankleBX: 86, ankleBY: 184, footB: 0, bendB: -1,
                 thighA: 0, shinA: 0, thighB: 0, shinB: 0 };
const sqUp   = P(msFeet, { hipX: 94, hipY: 118, torso: -90, head: -88,
                           upperA: 94, foreA: 90, upperB: 90, foreB: 86 });
const sqDown = P(msFeet, { hipX: 78, hipY: 150, torso: -60, head: -54,
                           upperA: -4, foreA: 0, upperB: 0, foreB: 4 });

const mascotSquat = {
  ground: 190, dur: "3.4s", frames: 24,
  keys: [{ t: 0, pose: sqUp }, { t: .40, pose: sqDown },
         { t: .50, pose: sqDown }, { t: 1, pose: sqUp }]
};

/* Skipping on the spot: two feet, small hops, hands turning at the hips as
   though there were a rope. There is no rope, because a rope in the header at
   twenty pixels is a scribble. */
const hopDown = { footA: 0, footB: 0, bendA: 1, bendB: 1,
                  hipX: 94, hipY: 126, torso: -88, head: -86,
                  thighA: 74, shinA: 102, thighB: 78, shinB: 106,
                  upperA: 126, foreA: 24, upperB: 122, foreB: 20 };
const hopUp   = { footA: 55, footB: 55, bendA: 1, bendB: 1,
                  hipX: 94, hipY: 98, torso: -91, head: -89,
                  thighA: 66, shinA: 128, thighB: 70, shinB: 132,
                  upperA: 136, foreA: 56, upperB: 132, foreB: 52 };

const mascotHop = {
  ground: 190, dur: "1.6s", frames: 16,
  keys: [{ t: 0, pose: hopDown }, { t: .38, pose: hopUp },
         { t: .62, flow: true, pose: hopUp }, { t: 1, pose: hopDown }]
};

/* ==================================================================
   Ten things the figure in the header could be doing. He is on screen the
   whole time home is, so whatever he does has to bear being looked at for a
   long time and not much at all.

   Some of these are drawn FRONT ON, which the rig was never asked for before.
   It costs nothing: both legs still hang off one hip and both arms off one
   shoulder, and splaying them a few degrees either side reads as a person
   facing you, because the vest is drawn wide enough to be a body. The one
   rule that does not survive the turn is the elbow's: face on, the two arms
   are mirrors, so one bends the way a side view allows and the other bends
   the opposite way, and both are right.
   ================================================================== */

const HEAD = { face: "front", smile: true, band: true };
const SIDE = { smile: true, band: true };

/* The feet of a figure standing face on. The legs hang straight down now: it
   is `spread` that sets them apart, one from each hip, which is what a person
   has. Splaying both thighs from a single hip was what made him look like he
   was standing sideways with one leg. */
const upright = { spread: 9, footA: 0, footB: 180, bendA: 1, bendB: -1,
                  thighA: 90, shinA: 90, thighB: 90, shinB: 90 };
const U = o => P(upright, o);
const breath = (a, b, o) => Object.assign({ ground: 190, dur: "4s", frames: 18 }, o, {
  keys: [{ t: 0, pose: a }, { t: .5, pose: b }, { t: 1, pose: a }] });

/* 1 - arms folded, face on */
const foldUp = U({ hipX: 94, hipY: 118, torso: -90, head: -90,
                   upperA: 60, foreA: 175, upperB: 120, foreB: 5 });
const foldDn = U({ hipX: 94, hipY: 121, torso: -89, head: -89,
                   upperA: 62, foreA: 177, upperB: 118, foreB: 3 });
const poseFold = breath(foldUp, foldDn, HEAD);

/* 2 - leaning on the wall to his left, ankles crossed */
const leanA = { handBX: 60, handBY: 88, armB: 1, footA: 0, footB: 0,
                bendA: -1, bendB: -1, thighA: 0, shinA: 0, thighB: 0, shinB: 0,
                ankleAX: 96, ankleAY: 182, ankleBX: 110, ankleBY: 183,
                hipX: 104, hipY: 126, torso: -102, head: -96,
                upperA: 90, foreA: 86 };
const poseLean = breath(P(leanA, {}),
  P(leanA, { hipY: 129, torso: -101, upperA: 92, foreA: 88 }),
  Object.assign({}, SIDE, { props: '<rect class="kit-fill" x="46" y="44" width="9" height="146" rx="4"/>',
                            include: [[46, 44], [55, 190]] }));

/* 3 - hands on hips, face on */
const hipsUp = U({ hipX: 94, hipY: 118, torso: -90, head: -90,
                   upperA: 55, foreA: 125, upperB: 125, foreB: 55 });
const poseHips = breath(hipsUp, U({ hipX: 94, hipY: 121, torso: -89, head: -89,
                   upperA: 57, foreA: 127, upperB: 123, foreB: 53 }), HEAD);

/* 4 - flexing, face on: one arm curled up, the other down */
const flexIn  = U({ hipX: 94, hipY: 118, torso: -90, head: -90,
                    upperA: 20, foreA: -78, upperB: 96, foreB: 92 });
const flexOut = U({ hipX: 94, hipY: 118, torso: -90, head: -90,
                    upperA: 22, foreA: -98, upperB: 96, foreB: 92 });
const poseFlex = Object.assign(breath(flexIn, flexOut, HEAD), { dur: "2.4s" });

/* 5 - waving, face on */
const waveA = U({ hipX: 94, hipY: 119, torso: -90, head: -90,
                  upperA: -70, foreA: -58, upperB: 96, foreB: 92 });
const waveB = U({ hipX: 94, hipY: 119, torso: -90, head: -90,
                  upperA: -70, foreA: -104, upperB: 96, foreB: 92 });
const poseWave = Object.assign(breath(waveA, waveB, HEAD), { dur: "1.6s" });

/* 6 - a long stretch, arms overhead, face on */
const stretchDn = U({ hipX: 94, hipY: 120, torso: -90, head: -90,
                      upperA: 88, foreA: 86, upperB: 92, foreB: 94 });
const stretchUp = U({ hipX: 94, hipY: 116, torso: -90, head: -92,
                      upperA: -78, foreA: -82, upperB: -102, foreB: -98 });
const poseStretch = Object.assign(breath(stretchDn, stretchUp, HEAD),
  { dur: "5s", frames: 26 });

/* 7 - star jumps, face on: in the plane of the drawing, which is the one
       jump this rig can do, and only because he has turned to face you */
const starIn  = U({ hipX: 94, hipY: 120, torso: -90, head: -90,
                    upperA: 84, foreA: 82, upperB: 96, foreB: 98 });
const starOut = { spread: 9, footA: 30, footB: 150, bendA: 1, bendB: -1,
                  hipX: 94, hipY: 112, torso: -90, head: -90,
                  thighA: 62, shinA: 60, thighB: 118, shinB: 120,
                  upperA: -38, foreA: -32, upperB: -142, foreB: -148 };
const poseStar = Object.assign({}, HEAD, { ground: 190, dur: "1.5s", frames: 16,
  keys: [{ t: 0, pose: starIn }, { t: .42, pose: starOut },
         { t: .58, flow: true, pose: starOut }, { t: 1, pose: starIn }] });

/* 8 - running on the spot, from the side (as before) */
const poseRun = Object.assign({}, mascotRun, SIDE);

/* 9 - a slow squat, from the side (as before) */
const poseSquat = Object.assign({}, mascotSquat, SIDE);

/* 10 - reaching for his toes and standing up again */
const foldFeet = { ankleAX: 102, ankleAY: 182, footA: 0, bendA: -1,
                   ankleBX: 88, ankleBY: 184, footB: 0, bendB: -1,
                   thighA: 0, shinA: 0, thighB: 0, shinB: 0,
                   handAX: 0, handAY: 0, handBX: 0, handBY: 0,
                   armA: 1, armB: 1, upperA: 0, foreA: 0, upperB: 0, foreB: 0 };
const toeUp   = P(foldFeet, { hipX: 94, hipY: 120, torso: -90, head: -88,
                              handAX: 92, handAY: 122, handBX: 84, handBY: 124 });
const toeDown = P(foldFeet, { hipX: 88, hipY: 130, torso: -26, head: -8,
                              handAX: 122, handAY: 172, handBX: 112, handBY: 174 });
const poseToes = Object.assign({}, SIDE, { ground: 190, dur: "4.4s", frames: 24,
  keys: [{ t: 0, pose: toeUp }, { t: .38, pose: toeDown },
         { t: .52, pose: toeDown }, { t: 1, pose: toeUp }] });

/* ==================================================================
   Ten ways of leaning. The wall is the left edge of the button he sits on:
   every one of these fixes the crop's left edge at the same x with `include`,
   so whatever he rests on it lands exactly there, and the plate's padding on
   that side is nothing. Two of them draw a wall as well, to be compared
   against the ones that do not.
   ================================================================== */
const WALL = 58;
const atWall = { ground: 190, dur: "4.6s", frames: 18, include: [[WALL, 34]] };
const drawnWall = '<rect class="kit-fill" x="' + (WALL - 9) + '" y="30" width="9" height="160" rx="4"/>';
const LEAN = Object.assign({ smile: true, band: true }, atWall);
/* Face on, the wall is behind him rather than beside him, so there is nothing
   for the crop to reach out to: these are cropped to the figure like any
   other, and the plate behind him is the wall. */
const LEANF = Object.assign({ smile: true, band: true, face: "front" },
  atWall, { include: undefined });
const sway = (a, b, o) => Object.assign({}, o, {
  keys: [{ t: 0, pose: a }, { t: .5, pose: b }, { t: 1, pose: a }] });

/* ankles crossed, seen from the side: one leg carries the weight, the other
   comes across it and rests on its toe */
const crossed = { ankleAX: 118, ankleAY: 178, footA: 42, bendA: -1,
                  ankleBX: 102, ankleBY: 183, footB: 0, bendB: -1,
                  thighA: 0, shinA: 0, thighB: 0, shinB: 0 };

/* 1 - the photograph: a straight arm high on the wall */
const highA = P(crossed, { handBX: WALL + 2, handBY: 74, armB: 1,
                           hipX: 106, hipY: 130, torso: -100, head: -84,
                           upperA: 96, foreA: 62 });
const lean1 = sway(highA, P(highA, { hipY: 132, torso: -99, foreA: 64 }), LEAN);

/* 2 - the same, with a wall actually drawn */
const lean2 = Object.assign({}, lean1,
  { props: drawnWall, include: [[WALL - 9, 30], [WALL, 190]] });

/* 3 - the other photograph: back to the wall, arms folded, face on */
const foldCross = { spread: 9, footA: 0, footB: 180, bendA: 1, bendB: -1,
                    thighA: 108, shinA: 112, thighB: 92, shinB: 88,
                    hipX: 94, hipY: 120, torso: -90, head: -90,
                    upperA: 60, foreA: 175, upperB: 120, foreB: 5 };
const lean3 = sway(foldCross, P(foldCross, { hipY: 123, head: -89 }), LEANF);

/* 4 - the same, tilted: he is resting on one shoulder, not standing to
       attention against a wall */
const foldTilt = P(foldCross, { hipX: 96, torso: -97, head: -95 });
const lean4 = sway(foldTilt, P(foldTilt, { hipY: 123, torso: -96 }), LEANF);

/* 5 - a shoulder against it, side on, arms folded */
const shoulderA = P(crossed, { hipX: 82, hipY: 128, torso: -106, head: -88,
                               upperA: 118, foreA: 26, upperB: 112, foreB: 20,
                               ankleAX: 112, ankleAY: 178, ankleBX: 96, ankleBY: 183 });
const lean5 = sway(shoulderA, P(shoulderA, { hipY: 130, torso: -105 }), LEAN);

/* 6 - a forearm along it, head near the hand */
const elbowA = P(crossed, { handBX: WALL + 2, handBY: 62, armB: -1,
                            hipX: 104, hipY: 130, torso: -100, head: -70,
                            upperA: 96, foreA: 62 });
const lean6 = sway(elbowA, P(elbowA, { hipY: 132, torso: -99 }), LEAN);

/* 7 - a hand on it at hip height, hip pushed out */
const lowA = P(crossed, { handBX: WALL + 2, handBY: 118, armB: 1,
                          hipX: 100, hipY: 128, torso: -96, head: -86,
                          upperA: 94, foreA: 58 });
const lean7 = sway(lowA, P(lowA, { hipY: 130, torso: -95 }), LEAN);

/* 8 - back to it, hands at the hips, face on: the mascot.
   The spread is negative, which is the mirror: the side of him that is nearest
   is his right rather than his left. That settles the legs' order, which is
   the thing you notice - his right crosses in front of his left, and the near
   limbs are the ones that are painted last.

   The legs are then his rather than the drawing's. The right comes across,
   its knee folded just enough that the shin can drop to a foot standing
   vertically on its toe; the left is straight and set in under him, carrying
   the lot. Both ankles are pinned, so the floor holds them while he settles on
   the wall - given as angles the whole leg travels with the hip and the feet
   slide through the floor by the same three units.

   The feet are the one place this drawing has to admit it is flat. His left
   foot is turned about 45 degrees out, which face on is a foot pointing as
   much at you as across the page: what is drawn is a short stroke lying nearly
   along the floor, not a foot's length of it. The right rests on its toe and
   points almost straight down, and is short for the same reason. */
const hipsCross = { spread: -9,
                    hipX: 94, hipY: 120, torso: -90, head: -90,
                    upperA: 125, foreA: 55, upperB: 55, foreB: 125,
                    ankleAX: 110, ankleAY: 176, footA: 90, footLenA: 11, bendA: 1,
                    ankleBX: 97,  ankleBY: 186, footB: 22, footLenB: 10, bendB: -1 };
const lean8 = sway(hipsCross, P(hipsCross, { hipY: 123 }), LEANF);

/* 9 - a foot flat against it behind him, arms folded, side on */
const footWall = { ankleAX: 104, ankleAY: 182, footA: 0, bendA: -1,
                   ankleBX: WALL + 12, ankleBY: 150, footB: -84, bendB: 1,
                   thighA: 0, shinA: 0, thighB: 0, shinB: 0,
                   hipX: 96, hipY: 124, torso: -98, head: -86,
                   upperA: 120, foreA: 28, upperB: 114, foreB: 22 };
const lean9 = sway(footWall, P(footWall, { hipY: 126, torso: -97 }), LEAN);

/* 10 - one hand high on it, the other behind his head */
const easyA = P(crossed, { handBX: WALL + 2, handBY: 70, armB: 1,
                           hipX: 106, hipY: 130, torso: -100, head: -84,
                           upperA: -46, foreA: -170 });
const lean10 = sway(easyA, P(easyA, { hipY: 132, torso: -99, foreA: -166 }), LEAN);

const ALL = [
  ["lean-1", "1. Straight arm high on it &mdash; the photograph", lean1, "Leaning."],
  ["lean-2", "2. The same, with a wall drawn in", lean2, "Leaning."],
  ["lean-3", "3. Back to it, arms folded &mdash; the other photograph", lean3, "Leaning."],
  ["lean-4", "4. The same, tilted onto one shoulder", lean4, "Leaning."],
  ["lean-5", "5. A shoulder against it, arms folded", lean5, "Leaning."],
  ["lean-6", "6. A forearm along it, head near the hand", lean6, "Leaning."],
  ["lean-7", "7. A hand on it at hip height", lean7, "Leaning."],
  ["mascot", "The mascot", lean8, "Leaning on the edge of his own button."],
  ["lean-9", "9. A foot flat against it behind him", lean9, "Leaning."],
  ["lean-10", "10. One hand on it, one behind his head", lean10, "Leaning."],
  ["pose-fold", "1. Arms folded, face on", poseFold, "A header candidate."],
  ["pose-lean", "2. Leaning on the wall, ankles crossed", poseLean, "A header candidate."],
  ["pose-hips", "3. Hands on hips", poseHips, "A header candidate."],
  ["pose-flex", "4. Flexing", poseFlex, "A header candidate."],
  ["pose-wave", "5. Waving", poseWave, "A header candidate."],
  ["pose-stretch", "6. A long stretch", poseStretch, "A header candidate."],
  ["pose-star", "7. Star jumps", poseStar, "A header candidate."],
  ["pose-run", "8. Running on the spot", poseRun, "A header candidate."],
  ["pose-squat", "9. Squatting", poseSquat, "A header candidate."],
  ["pose-toes", "10. Touching his toes", poseToes, "A header candidate."],
  ["mascot-run", "Mascot, running on the spot", mascotRun, "A header candidate."],
  ["mascot-squat", "Mascot, squatting", mascotSquat, "A header candidate."],
  ["mascot-hop", "Mascot, skipping", mascotHop, "A header candidate."],
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
  ["thruster", "Thruster", thruster, "A front squat and a press, in one movement."],
  ["pushpress", "Push press", pushpress, "The strict press with a dip in it, which is the difference."],
  ["kneeraise", "Hanging knee raise", kneeraise, "The pull-up's bar, with the knees doing the work."],
  ["deadlift", "Deadlift", deadlift, "What you see of a barbell from the side is the plate."],
  ["goblet", "Goblet squat", goblet, "The air squat with a bell at the chest."],
  ["row", "Row", row, "Mostly machine: &ldquo;1000 m row&rdquo; means the erg."],
  ["goodmorning", "Good morning", goodmorning, "A hinge, hands behind the head."],
  ["broadjump", "Broad jump", broadjump, "The box jump with the box taken away."],
  ["ballslam", "Ball slam", ballslam, "The ball goes on without the hands."],
  ["hipthrust", "Hip thrust", hipthrust, "Shoulders on the bench, and only the hips move."],
  ["revlunge", "Reverse lunge", revlunge, "The front foot never moves."],
  ["ohlunge", "Overhead lunge", ohlunge, "The lunge with the weight locked out."],
  ["tricep", "Overhead triceps extension", tricep, "The elbow stays; the forearm folds."],
  ["ccrunch", "C-crunch", ccrunch, "The back stays down and the body makes the letter."],
  ["ski", "Ski erg", ski, "Standing, which is what tells it from the rower."],
  ["kneelslam", "Kneeling ball slam", kneelslam, "The slam with the legs taken out of it."],
  ["renegade", "Renegade row", renegade, "A plank on two bells, one pulled to the ribs."],
  ["devilpress", "Devil&rsquo;s press", devilpress, "A burpee with two bells, and they finish overhead."],
  ["boxover", "Box jump over", boxover, "Over it, not onto it: nothing rests on the box."],
  ["burpeebox", "Burpee box jump", burpeebox, "The burpee, and the jump goes onto the box."],
  ["burpeepull", "Burpee pull-up", burpeepull, "The burpee under a bar, and the jump goes onto it."],
  ["ostrich", "Ostrich walk", ostrich, "A step, and the trunk folded over the front foot."],
  ["bowbend", "Bow, bend, squat", bowbend, "Three things one after another, and the name says so."],
  ["heeltouch", "Heel touch", heeltouch, "The reaching, which is what it looks like anyway."],
  ["gorilla", "Gorilla row", gorilla, "Wide and high-hipped, which is what it needed."],
  ["plankknee", "Plank knee-to-elbow", plankknee, "The half of it that lies in the page."],
  ["pallof", "Pallof press", pallof, "Face on: the press goes at you, so the arms are their shadow."],
  ["rotknee", "Rotating hanging knee raise", rotknee, "Face on: the swing is the whole of it."],
  ["latjump", "Lateral jump", latjump, "Face on: nothing in it happens front to back."],
  ["latburpee", "Lateral burpee over a dumbbell", latburpee, "Face on, for the hop that gives it its name."],
  ["sumo", "Sumo deadlift high pull", sumo, "Face on: the elbow going out is across the page here."]
];

module.exports = { ALL, dressed, CSS };
