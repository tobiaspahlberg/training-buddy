# The drawings

The looping figures in the session details are generated here and pasted into
`docs/index.html`. **The numbers in that file are output, not source.** A
drawing is changed by editing a pose and running this again, never by editing
the lists of positions by hand.

```bash
node tools/page.js /tmp/all.html          # every drawing, to look at in a browser
node tools/stills.js /tmp/s.html burpee   # one movement, pose by pose
```

```bash
node tools/into-app.js                    # write them into docs/index.html
```

`into-app.js` replaces the whole of `<div id="demos" hidden>`. Its `SHIPPED`
list is what goes in, and it is deliberately not everything `all.js` can make:
a drawing goes into the app when it has been looked at and approved, not when
it renders. Nothing here is loaded by the app and nothing here is shipped: it
is a workshop, not a build step.

## Which way round

A movement seen from the side is done **to the right** unless there is a reason
not to. Mirroring a pose is 180 minus every angle, and every `bend`/`arm` sign
the other way round.

## How a figure is made

- **`rig.js`** – the skeleton. Bone lengths are fixed and a pose is the set of
  *angles* at the joints, so nothing can stretch as it moves and every joint
  travels on an arc. A foot or a hand can be **pinned** instead of angled: give
  `ankleAX/Y` or `handAX/Y` and the joint above is worked out by inverse
  kinematics. That is what a foot on the floor is, and what a hand on the floor
  or on a bar is – the body moves and the hand does not.

  `sample()` walks the key poses and produces the frames. A key is an anchor by
  default: the movement eases into it and stops. A key marked `flow` is a
  waypoint instead – passed through without stopping, with the easing belonging
  to the whole run between the two anchors either side. That is the difference
  between a snatch and a snatch mimed in stages.

- **`paint.js`** – dresses the skeleton. A limb is a thick round stroke, which
  is a filled capsule; the vest and shorts are thicker strokes over the same
  bones; a shoe is a short fat one at the end of a shin. It also crops each
  drawing to what is actually drawn over every frame, and writes the frames out
  as SMIL `<animate>` value lists.

- **`all.js`** – the movements themselves, as key poses.

## Two things that bite

- **Every pose of one movement must carry the same keys.** Interpolation runs
  over the keys of the pose it is coming from, so a pose that has `handAX` and
  one that does not produce `NaN` between them. A burpee therefore pins its
  hands even while standing: a hand pinned where it would have hung anyway is
  the same drawing.

- **An elbow bends one way.** An arm angle is an absolute direction, but what
  the joint can do is the *difference*: with the figure facing right,
  `foreA - upperA` belongs between about −155° (shut) and 0° (straight).
  Anything above 0 is a joint bending backwards, which reads as wrong without
  being easy to name. `page.js` checks every pose and says so.

  Which of the two solutions a *pinned* limb takes is the `bendA`/`armB` signs,
  and it depends on which side of the root the pinned end is, not on which limb
  it is: a pull-up's two hands sit either side of the shoulders and so take
  opposite signs.

  A high elbow held over the hand – what a snatch looks like from the side – is
  a shape this rig cannot make, because getting the elbow up there in the plane
  of the drawing means folding the joint past shut. The elbow is high in life
  because it travels out to the side, and that is the one direction a
  two-dimensional rig has not got.

## Face on

A pose can ask for `spread`, the half-width across the torso. The legs hang
from a hip each and the arms from a shoulder each, set half again as wide, so
the width comes from the body rather than from splaying the joints out of one
point. Nothing asks for it side on, where the two sides stand behind one
another and one point is the truth – which is why every drawing in the app is
unchanged to the byte by it.

With a spread, `face: "front"` also draws two eyes instead of a nose and gives
the shorts their far leg in the same colour as the near one. The vest stops
being a stroke and becomes a tapered `<path>`: a stroke is one width from end
to end, which is a barrel, so the shape is drawn wide at the shoulders and
narrow at the waist. Both widths are **measured off the pose** – the distance
across `shoulderA`/`shoulderB` and across `hipA`/`hipB` – so the body cannot
drift away from the limbs hanging off it, and a vest that ends at the hips ends
where the shorts start.

**A class drawn here needs a rule in the app.** `paint.js` writes the CSS the
workshop pages use, and `docs/index.html` has its own copy of the same rules;
they are two lists of one set of class names and they drift silently, because
an SVG `<path>` with no rule of its own is filled black rather than missing.
`tests/demos.js` now fails if a class inside `<div id="demos">` has no rule in
the app's stylesheet.

The spread's **sign** says which of his sides is towards you, and that is the
whole of what mirroring a face-on pose is: negate it and take every angle from
180. The near limbs stay near and swap which of his they are, exactly as they
do in a mirror.

`footLenA`/`footLenB` are the one place a bone may be given a length. Every
other bone lies in the plane of the drawing and so is drawn at its true length;
a foot face on does not, because it points partly at you, and what is drawn is
its shadow on the page. A foot turned about 45 degrees out is roughly three
quarters of one seen side on, and a foot pointing straight at you is a stub.
There is no third dimension here to work that out from, so the pose says it —
as a number per drawing, never per frame, or it is the stretching the whole rig
exists to prevent.

The elbow rule above does not apply face on and is not checked there: which way
an elbow may bend depends on which side of the body the arm is on, and a rule
stated wrongly flags good poses.

## What this rig cannot draw

Some movements have been tried and taken out again. They are listed so nobody
works out the same thing twice.

- **The clamshell** and anything else that turns out of the page. A pose here
  is angles in one plane; a knee opening towards the viewer has nowhere to go.

- **The gorilla row.** Bent over a bell in each hand, the hands, the bells and
  the feet all end up within twenty units of each other, because that is where
  they are. Full size it is a person; in a list row it is a yellow smudge with
  a head.

- **Anything lateral.** A burpee that goes sideways over a dumbbell, a lateral
  jump: the movement is towards the viewer, and the drawing is from the side.

- **A high elbow held over the hand**, as in a snatch or a sumo deadlift high
  pull. Getting the elbow there in the plane of the drawing means folding the
  joint past shut.

The answer in each case is no drawing, not a drawing of something else.
