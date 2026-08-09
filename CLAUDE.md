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

## Conventions

- English in all UI text, comments and changelog. Spoken cues are English too.
- Colours are CSS variables at the top: `--run` green, `--walk` blue,
  `--warm` amber (warm-up and cool-down), `--rest` purple, `--stop` red

## Data model

Two levels, and the distinction matters:

- A **plan** is a schedule, e.g. six weeks with three run days each. It holds
  no timing logic, only which sessions exist and in what order.
- A **session** is what the clock runs. It is a list of **blocks**: either a
  plain `step` or a `repeat` block holding two steps (run/walk) and a count.
- `flatten(blocks)` expands blocks into the flat step list the clock uses.
  Everything downstream works on that flat list only.

Built-in plans are written the way their source PDF is laid out, one row per
week, so they can be checked against the original at a glance. **Never adjust
program times by feel** – they come from a clinician's plan. Change them only
against the source document in `programs/`.

The editor works at session level, so a user-made program is simply a plan
with one session.

## Pitfalls

**Time is always derived from timestamps**, never by counting a variable down.
Android can kill the app at any moment; elapsed time is reconstructed from
`startedAt` and `pausedTotal` when the session resumes.

**A running session is written to localStorage on every event** plus every
three seconds while running and when the app goes to the background. Programs
and completed sessions are NEVER removed automatically – only by an explicit
delete with confirmation.

**Speech needs a user gesture before it works.** `unlockAudio()` runs on the
Start tap and speaks one silent utterance; without it the browser stays quiet
for the rest of the session.

**Android channels cannot be changed after the fact.** If a channel's sound or
vibration changes, the channel id has to change too, otherwise the phone keeps
the old settings until the app is reinstalled.

**`npx cap sync android` only copies the web files** – icons come from
`npx @capacitor/assets generate --android`. The cloud build runs both.

**Native code only runs in the app.** Anything touching Capacitor sits behind
a native check so the web version keeps working unchanged.

## Common commands

```bash
npx cap sync android                      # before a local build in Android Studio
npx @capacitor/assets generate --android  # after changing the icon
cd android && ./gradlew assembleDebug     # build the APK locally
```

The cloud build does all of this on push to `main` and publishes the APK as a
release tagged `v<APP_VERSION>`.

## Testing

No automated test suite. Test manually with a short custom program (for
example 3 × 20 s run : 10 s walk) – it runs through quickly and exercises
every feature: step changes, spoken cues, countdown, pause, skip, the finish
sound, and resuming after the app is killed.
