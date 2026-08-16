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
