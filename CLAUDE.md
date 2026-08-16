# Training Buddy

Interval timer for training and rehab programs, with spoken cues. Distributed
two ways from the same code:

- **Android app** built with Capacitor – the primary target, because it can
  keep talking with the screen off
- **Web app (PWA)** via GitHub Pages from `docs/` – works everywhere, but the
  phone may mute speech once the screen turns off

## Structure

```
docs/index.html      The whole app – HTML, CSS and JS in ONE file. All app code lives here.
docs/download.html   Download page linking to the latest APK
docs/manifest.json   PWA manifest
tests/               jsdom suites for the app – see tests/README.md
assets/              Source images for the app icon (regenerated on every build)
programs/            Source PDFs for the built-in plans. Local reference only, gitignored.
android/             The Capacitor project, checked into git
.github/workflows/   Cloud build that publishes the APK as a GitHub Release
```

## Hard rules

**The app stays a single HTML file.** No build step, no frameworks, no npm
packages in the frontend. The simplicity is deliberate – the file should be
readable and editable straight through.

**On every change to `docs/index.html`:**

1. Bump `APP_VERSION` (in the script, just after the changelog block)
2. Add an entry at the top of the changelog block
   (`<script type="application/json" id="changelog">`) with the same version

This is not optional: the version drives the release tag in the cloud build.

**Semantic versioning:** bug fix → patch (0.1.1), new feature → minor (0.2.0),
larger rework → major.

**Commit and push straight to `main`.** No pull requests, no feature branches,
unless asked for one. The cloud build only runs on a push to `main`, so work
that stays on a branch never becomes an APK. Finished work belongs on `main`.

## Conventions

- English in all UI text, comments and changelog. Spoken cues are English too.
- **The run screen and the session details are read at about two metres**,
  with the phone on the floor. Their type is sized for that, not for reading
  in the hand – do not shrink it back. The calendar is the exception: seven
  days have to fit across, so it keeps its small type. A phone turned on its
  side has a third of the height, so the run screen caps its type against the
  height as well (`@media (max-height:…)`, pixels first and `min()` second, so
  a WebView that does not know `min()` keeps the portrait sizes): the stage
  centres what it holds and hides the overflow, which cut the step's name in
  half rather than making it smaller.
- Colours are CSS variables at the top: `--run` green, `--walk` blue,
  `--warm` amber (warm-up and cool-down), `--rest` purple, `--lift` pink
  (strength), `--hold` teal (planks and the like), `--stop` red. Four of them
  are not the app's to keep – see the figure, below.

## Data model

Two levels, and the distinction matters:

- A **plan** is a schedule, e.g. six weeks with three run days each. It holds
  no timing logic, only which sessions exist and in what order.
- A **session** is what the clock runs. It is a list of **blocks**, of which
  there are three: a plain `step`, a `repeat` holding two steps (run/walk) and
  a count, and a `circuit` – `names` of stations, `workSec`, `restSec` and
  `rounds` – for the kind of thing that has more than two sides to it. A step's
  `kind` is only a colour and a tone – `KINDS` lists them, `isWork()` says
  which ones get the go tone, and `colorOf()` falls back to green for a kind
  the app no longer knows, so a session saved by an older version still draws.
- `flatten(blocks)` expands blocks into the flat step list the clock uses.
  Everything downstream works on that flat list only. A `repeat` block with
  `dropLast` leaves off the recovery side of its final repeat, which is what
  keeps a plan's last walk from running straight into its cool-down walk; a
  `circuit` leaves off the rest after its last station, for the same reason.
  `stations()` is one line on top of a circuit block, so a built-in workout
  and one made in the editor are the same thing to everything downstream.

Built-in plans are written the way their source PDF is laid out, one row per
week, so they can be checked against the original at a glance. **Never adjust
program times by feel** – they come from a clinician's plan. Change them only
against the source document in `programs/`. Where a source contradicts itself,
code the recipe and let the app work the total out: the printed total is the
part that can be a typo. Say so in a comment rather than picking silently.

A week either spells its days out in `days`, or – as Return to Run does –
gives one interval for the whole week and only the repeats per day, which
`daySpec()` reads either way. A day is one of five things, and the builders
`intervals()`, `walkDay()`, `optionalDay()`, `restDay()` and `raceDay()` are
how a plan says which. Only `isSession()` days have a clock to run; the rest
are ticked off and no more, and they are not counted in "3 of 18 done".
`runDays` is every day that carries something, not only the days with running
in them – the name is older than the idea, and stored copies use it. An
`otherDays` entry may carry a `sessionId`: the strength days of Return to Run
name Strength for Runners, which `otherSession()` looks up, so the day opens
and runs that workout – under the day's own key, so finishing it ticks the day
off in the calendar. Such a day is still not an `isSession()` day and is not
counted in "3 of 18 done", which counts what the plan itself times.

`planSession(plan, week, dayIndex)` is the one door into a plan's sessions.
A built-in plan generates them from `runSec`/`walkSec`/`reps`; a **copied
plan** (`custom: true`, stored in `tb.myplans`) carries them as written-out
blocks in `week.sessions` so each one can be edited. Both come back in the
same shape, so the calendar, the sheet and the clock never need to know which
kind they are looking at. A copy keeps its own id, and progress keys are built
from that id, so ticking days off in a copy never touches the original.

The UI calls a user-made program a **session**, which is what it is; the code
still says `programs`, because `session` is taken by the one the clock is
running, and `tb.programs` is what is on people's phones.

A new session starts **empty**. It used to open with a warm-up, six intervals
and a cool-down in it, which is somebody else's session: everyone who wanted
something else had to delete three blocks first. The three add buttons carry
the explanation instead.

The editor works at session level. A user-made program is simply a plan with
one session; copying a single day out of a plan produces exactly that, an
ordinary program with no link back. Blocks are added, removed, duplicated and
moved up or down; a step's `list` is typed one line to a line and disappears
when it is emptied, which turns the step back into a plain one. Every duration
carries a row of chips (`WORK_SECS`, `REST_SECS`) beside its two boxes, a block
wears `colorOf()` its kind down its left edge, and `miniTimeline()` draws the
session under the total as it is built. `START_FROM` is the honest version of
the blocks that used to be written in unasked: two shapes, offered only while
the session is empty. Editing a session *inside* a copied plan uses the same
editor, but `editing.planId` sends the result back into the plan instead of
into the program list.

`BUILTIN_PROGRAMS` are single sessions with no schedule around them. A step
may carry a `list` of strings – movements to work through, as on a gym
whiteboard. The list has no timing, so it is never timed – only shown, in the
sheet and on the run screen, and typed as lines in the editor.

**A drawing is offered where the name is not enough.** A movement the app has
been drawn for shows a looping figure at the end of its line in the session
details – `subRow()` puts it there, for a work list and for a circuit's
stations alike, after the words, so a list still reads down its left edge. It
is offered **once per session**, against the first line that names it: a
workout counting 21-15-9 down one arm and back up the other names the same
movement six times, and six copies of one figure is one explanation and five
things moving in front of the words.
A session opens with them **off**: a drawing answers "what is that", which is
a question you ask once, and after that it is a moving thing in front of the
list you came to read. The eye beside the session's name turns them on and is
remembered in `tb.demos`; `renderEye()` only offers it on a session that has a
drawing in it, because a switch with nothing behind it is a lie.
`DEMOS` maps the exact wordings a movement is written under to the drawing it
gets, after a leading count is stripped, anything after a comma set aside
("21 dumbbell snatches, arm 1" says which arm, not which movement) and a plural
tried as a singular; it is a table and not a guess, because matching on a word
inside the line would put an air squat beside "50 goblet squats", and a
whiteboard that says only "snatches" has not said with what. **No drawing is the right answer for
everything the app has not been drawn for**, which is most of it, and adding
one means drawing it rather than widening the match.

A movement seen from the side is done **to the right** unless there is a reason
not to. Mirroring a pose is 180 minus every angle and every bend sign the other
way round, which is what turning the press-up round came to.

**Every drawing is at one scale**, so a person is the same size in all of them.
Each `<svg>` carries its own width and height in pixels while its view box is
in the units the poses are written in; the ratio between the two is that one
scale, and the CSS sets no size at all. Forcing them all to the same height
instead made a press-up – a person lying down, so a short wide drawing –
twice the size of everybody else.

The drawings themselves live in `<div id="demos" hidden>` and are copied to
where they are needed. `tools/into-app.js` writes that whole block; its
`SHIPPED` list is what goes in, and it is deliberately not every drawing
`tools/all.js` can make – one goes in when it has been looked at and approved,
not when it renders. Each is a person made of thick round strokes, animated
by SMIL: a pose is the set of *angles* at the joints, so nothing stretches as it
moves, and the frames are worked out ahead of time and written into the file as
lists of positions. **The numbers are output, not source** – the rig and the
key poses live in `tools/`, outside the app and shipped with nothing, so a
drawing is changed by editing a pose and regenerating it, never by editing the
lists by hand. `tools/README.md` says how, and lists the movements this rig has been tried on and cannot draw – anything that turns out of the page, anything lateral, and anything where the hands and the feet end up in the same place.

**The figure beside the app's name is the same person as the drawings.** He is
`data-demo="mascot"` in the same block, made by the same rig, standing and
breathing; tapping him opens the Colours screen. `--vest`, `--shorts`, `--hair`
and `--shoe` are therefore the reader's rather than the app's: `KIT` is what
can be picked, `applyKit()` writes the four variables onto the root element,
and `tb.kit` remembers. `--shoe-far` is worked out from `--shoe` by `dim()`
rather than chosen, so there is one decision per thing rather than two.

Both the width and the height are set on every drawing, so CSS that asks for
one of them and leaves the other alone letterboxes the figure inside a taller
box instead of making him bigger. Ask for one and say `width:auto`.

**Recent** is the first thing on home: the last `RECENT_MAX` sessions actually
finished, each once however often it has been run. A history entry holds only
an id, so `recentTarget()` works out what it points at – one of yours, a
built-in workout, or a day of a plan, whose id carries the plan and the day
inside it – and a row whose target no longer resolves is not drawn, because it
would open nothing.

**Done** means two different things, deliberately. `progress` holds the day a
session was last finished. For a day of a plan that is final: it is done and
stays done, because a plan is walked through once. A program is repeated, so
its green mark only shows while `progress[id]` is today – it clears itself
overnight – and the date under the name is what remembers. `tb.history` is the
permanent record: every finished session with its date and length. Resetting a
program or a plan clears marks, never history.

A **category** (`CATEGORIES` in the script) is what the home screen is made
of: home lists every category, and the plans and programs only appear once one
is opened. They sort by one axis – what a session trains – with `crossfn` for
the things that train both at once, and `rehab` as the deliberate exception: a
reason rather than a quality, and the reason wins, because being injured is how
you go looking for it.

**An id is stored and a label is shown.** `CATEGORIES` holds ids (`crossfn`),
`CAT_LABEL` holds what is written on the screen ("Cross-functional"), and
`categoryOf()` is the only place that reads the field. A name can therefore be
thought better of for the price of one line.

`CAT_WAS` maps the names stored before ids existed, and it is a removal van
rather than a permanent translation: `migrateStoredCategories()` rewrites the
phone once at startup, and `mergeBackup()` rewrites whatever a restored file
brought with it. Nothing had been released when the names changed, so once no
phone and no backup can still say "Training", that map can go.

A new session is made from inside a category, which is how it gets the right
one; home has no New button of its own.

## Pitfalls

**Time is always derived from timestamps**, never by counting a variable down.
Android can kill the app at any moment; elapsed time is reconstructed from
`startedAt` and `pausedTotal` when the session resumes.

**Start means "in a moment".** `startedAt` is set *into the future* by the
count-in (`leadSec`, default 5 s, chosen in About), so `leadLeft()` is the same
subtraction as `elapsed()` with the sign turned round – it pauses, it survives
the app being killed, and `skipStep()` ends it. The run screen therefore has
three states, not two: `!startedAt` is "Ready", `leadLeft() > 0` is "Get ready",
and only past that is a step actually running.

**A backup is a merge, never a wipe.** `mergeBackup()` is the whole contract:
sessions and plan copies are replaced by id, a day ticked off in either copy
stays ticked off (the later date wins), and the two histories are pooled and
de-duplicated on id plus timestamp. Restoring the same file twice must leave
the phone exactly as it was.

**The app cannot back itself up.** There is nowhere to put a file that is not
this same phone, and a copy beside the original is no copy at all against the
thing that actually happens, which is losing the phone. What it does instead is
notice: `backupNudge()` puts a card at the foot of home when there is something
worth keeping and either no backup has ever been made or the last one is over a
month old, and "Not now" holds it for a week. Saving a file and copying the text
both count as having backed up.

**A WebView will not download anything.** Nothing in Capacitor listens for a
download and a `blob:` URL is not something Android can fetch, so the anchor
that saves a file in a browser clicks and does nothing at all inside the app –
silently, which is how it once claimed to have saved a backup that was never
written. `BackupPlugin` writes it instead, through MediaStore into the shared
Downloads folder (no permission needed from Android 10; older phones get the
app's own external folder rather than a permission prompt). Wherever it lands,
the real path comes back and is put on the screen, not only in a message that
fades. The clipboard is the fallback when the write is refused.

**A running session is written to localStorage on every event** plus every
three seconds while running and when the app goes to the background. Nothing
is ever removed automatically – only by an explicit delete. A delete does not
stop to ask: it happens, and `offerUndo()` holds what went, its place in the
list and any progress that belonged to it, long enough to put it back. Only
one thing is held at a time.

**Speech needs a user gesture before it works.** `unlockAudio()` runs on the
Start tap and speaks one silent utterance; without it the browser stays quiet
for the rest of the session.

**The back button is handled in one place.** The app is a single page, so
there is nothing to go back to on its own: one spare history entry is kept
armed and re-armed, and `goBack()` decides what a press means. Android routes
its hardware button to the same function through the `App` plugin instead of
through history. Anything new that covers the screen has to be closed there
too, or the button will skip past it.

**Lists are rebuilt on every change**, so their rows cannot own their
handlers. `bindTapAndHold(host, opts)` binds both gestures once to the
container that survives, and finds rows by the data attribute they carry:
`data-sel`/`data-week` in the calendar, `data-open` on a category card. It
takes an `ignore` selector for controls inside a row that answer for
themselves. A long press sets a flag that swallows the click the browser
sends afterwards; the flag is cleared on the next `pointerdown`.

**A session opens before it runs.** Tapping anything with a clock in it –
a day of a plan, a built-in workout, one of your own – opens the sheet, and
Start is a second, deliberate tap. Your own sessions used to start under the
thumb, which meant there was no way to look at one without editing it.

**The editor asks before it throws work away.** Everywhere else a delete
happens and `offerUndo()` covers it; leaving the editor cannot be undone once
the screen is gone, so `cancelEdit()` compares against `editing.opened` – the
state as the editor opened – and asks only when something really changed. A
session will not save without a name either: "Untitled session" was a name
nobody chose and nobody could find again.

**A long press is never the only way to do something.** Holding a day is a
shortcut into select mode, which the header button also opens; holding a
program or a copied plan deletes it, which the bin on its card, the editor
and the plan itself also do. Nothing is reachable by gesture alone, and a
hold that declines a row returns `false` so the phone does not buzz at
nobody.

**Leaving a workout goes back where it was started**, through `leaveRun()`:
the plan a day belongs to, or the category it sits in. It reads the live
`openPlanId` and `currentCategory` rather than anything stored, so a session
resumed after the app was killed has nothing behind it and lands on home,
which is right.

**Android channels cannot be changed after the fact.** If a channel's sound or
vibration changes, the channel id has to change too, otherwise the phone keeps
the old settings until the app is reinstalled.

**The app asks GitHub whether a newer release exists** on every start – the
moment somebody wonders is the moment they close it and open it again – and
again whenever it is brought back to the front, having not asked for six
hours. A cold start keeps a five minute floor, so an app restarting in a loop
cannot knock sixty times an hour. Every failure is silent: no network, a
private repository and a rate limit all mean the same thing, which is that
nothing is shown. It cannot install
anything – Android will not let it without permissions this app has no
business holding – so the button opens the APK and the phone takes over.
Only the Android app asks; the web version has no service worker, so a
reload is already the update.

**A phone only accepts an update signed with the same key.** The cloud build
signs with a keystore kept in the repository secrets
(`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`), handed to Gradle through `TB_*` environment
variables. Lose that keystore and no future build can update an installed app
– it has to be uninstalled first. Without the secrets the build falls back to
a debug key and says in the job summary that the APK cannot be installed over
an older version.

**`versionCode` has to go up on every release**, or Android sees the same app.
It is derived from `APP_VERSION` by the cloud build (`major*10000 +
minor*100 + patch`) and passed in as `-PtbVersionCode`; a local build without
the flag gets 1.

**`npx cap sync android` only copies the web files** – icons come from
`npx @capacitor/assets generate --android`. The cloud build runs both.

**Native code only runs in the app.** Anything touching Capacitor sits behind
a native check so the web version keeps working unchanged.

**A running session posts an ongoing notification** through
`@capacitor/local-notifications`, so there is a way back to the clock from
wherever the phone has wandered. It is scheduled, not served by a foreground
service: the plugin was already in the project and needs no manifest entry of
its own. It follows the step, never stacks (one id, replaced), survives a
pause and goes when the session does. Naming a `smallIcon` the app does not
have would leave it blank, so none is named.

## Common commands

```bash
cd tests && npm test                      # the suites, before pushing anything
npx cap sync android                      # before a local build in Android Studio
npx @capacitor/assets generate --android  # after changing the icon
cd android && ./gradlew assembleDebug     # build the APK locally
```

The cloud build does all of this on push to `main` and publishes the APK as a
release tagged `v<APP_VERSION>`.

## Testing

**Run the suites before pushing.** They live in `tests/`, load `docs/index.html`
into jsdom and drive the app the way a thumb would; there is no framework and
nothing to build.

```bash
cd tests && npm install   # once, jsdom only
npm test                  # every suite; exits non-zero if anything failed
```

`tests/README.md` says what each suite holds onto and how to add one. Two rules
worth repeating here: a new suite has to be named in `SUITES` at the top of
`run.sh` or it is reported as never run, and anything touching the Android side
must inject `window.Capacitor` through jsdom's `beforeParse`, because `NATIVE`,
`TTS` and `NOTES` are read once as the script loads.

The suites cannot hear, see or feel, so **also test by hand on the phone** with
a short session (3 × 20 s run : 10 s walk): the count-in, the spoken cues, the
tones, the ongoing notification, the vibration, and resuming after Android has
killed the app.
