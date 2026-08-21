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

**A bone pointing out of the page is drawn as its shadow on it.** `footLenA`
and `footLenB` give a foot's shadow as a length; `armLenA`, `armLenB`,
`thighLenA`, `thighLenB`, `shinLenA`, `shinLenB` and `torsoLen` give the rest
as a fraction of the true length. The thigh and the shin are separate because
they are so rarely pointing the same way: a knee raised towards you has a thigh
nearly end on and a shin still hanging straight down the page at full length.

**Work the fraction out; do not feel for it.** A bone raised *a* degrees from
horizontal and swung *b* degrees to the side projects up by sin *a* and across
by sin *b*, both times its true length, and the drawn length is the length of
that pair. A thigh raised forty and swung twenty-five is 26 of its 34, at 123
degrees — which puts the knee twenty-two above the hip and fourteen to the
side. Guessed at, the same knee came out level with the hip with the foot flung
out sideways, which is a side-bend and not a knee raise, and it took three
tries to see that because it was three tries of guessing. A foot turned about 45 degrees out is roughly three quarters of one
seen side on; a Pallof press with the arms straight at you is under half; a
body lying with its head towards you is about a third. There is no third
dimension here to work any of that out from, so the pose says it.

This is not the stretching the rig exists to prevent, and it is worth being
clear why. A bone whose *drawn* length changes while its direction in the page
stays put is a lie. A bone swinging towards you really does grow shorter on the
page, and interpolating the fraction between two poses is that swing. Nothing
side on asks for one, because side on nothing leaves the page — which is why
every drawing made before these existed is unchanged to the byte by them.

The elbow rule above does not apply face on and is not checked there: which way
an elbow may bend depends on which side of the body the arm is on, and a rule
stated wrongly flags good poses.

## What this rig cannot draw

This list was four times longer, and most of what was on it was on it for one
wrong reason: it was being drawn **from the side**. A movement that happens
across the body has nothing to show side on and everything to show face on, so
the first question about anything that will not draw is which way round it is,
not whether the rig can hold it.

- **A rotation about the spine.** A Russian twist. Face on it is a person
  sitting still; side on it is a person sitting still. There is no view in one
  plane where the turning shows.

- **A high elbow held over the hand seen from the side**, as in a snatch.
  Getting the elbow there in the plane means folding the joint past shut,
  because in life it travels out to the side. The sumo deadlift high pull was
  on this list until it was turned round: out to the side is across the page
  face on, and the shape is then the easy one.

- **The floor half of anything drawn face on.** A press-up or a burpee turned
  towards you is a body coming at you: the torso is drawn at a third and the
  chest going the last inches to the boards is four pixels. The lateral burpee
  was tried that way, for the sake of the sideways hop, and it was the wrong
  trade — the burpee is most of the movement. It is drawn from the side, and
  the sideways is said by putting the bell **between him and you**: on the
  floor at his shins, painted over him because that is where it is. The hop is
  straight up the page, because a jump towards the reader has nowhere else to
  go, and nobody looking at a man mid-air over a dumbbell is in doubt which
  line it is. When only part of a movement leaves the page, put the prop in the
  part that stayed.

The answer in each case is no drawing, not a drawing of something else — or,
more often than it used to be, the same drawing from the other side.

Others came off this list once the first attempt was recognised as an attempt
at the wrong thing. The **gorilla row** was a yellow smudge because the stance
was too narrow; standing wide with the hips high puts thirty units between the
feet and the bells. The **heel touch** cannot be drawn arriving — a heel is
eighty-odd units from a shoulder and an arm is forty-eight, and what makes a
real one touch is the trunk tipping sideways — but it can be drawn reaching,
which is what it looks like anyway. **Plank knee-to-elbow** crosses the body,
and the knee arriving is the half that lies in the page. The rule that survives
is narrower than "the rig cannot draw it": draw the part of the movement that
lies in the page, from whichever side leaves the most of it there, and give up
only when that part is nothing.
