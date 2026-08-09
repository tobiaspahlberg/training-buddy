# Training Buddy

Interval timer for training and rehab programs, with spoken cues. Put the
phone in your pocket and let it tell you when to run and when to walk.

## What it does

- **Built-in plans.** *Return to Run – Phase 1: Restore* (Spark Healthy Runner)
  is included as a six week schedule with three sessions a week. The app keeps
  track of which sessions you have finished.
- **Spoken cues.** Every step is announced out loud, with a three second
  countdown before each change.
- **Your own programs.** Build intervals of your own – warm-up, a repeating
  run/walk block, cool-down – and they are saved on the phone.
- **Survives being killed.** Time is derived from timestamps, so a session
  picks up exactly where it was even if Android shuts the app down mid-run.

## Getting it

- **Android:** download the APK from the
  [latest release](../../releases/latest) or the [download page](docs/download.html).
- **Web:** open the GitHub Pages site and add it to the home screen.

Headphones are recommended. On the web version the phone may mute speech once
the screen turns off; the Android app keeps it running.

## Development

Everything lives in `docs/index.html` – one file, no build step. Open it in a
browser and it runs.

```bash
npx cap sync android                   # copy web files into the Android project
cd android && ./gradlew assembleDebug  # build the APK locally
```

Pushing to `main` builds the APK in the cloud and publishes it as a release.
See `CLAUDE.md` for the rules that keep the project consistent.

## Source of the built-in plan

The Return to Run plan comes from Spark Healthy Runner (Dr. Duane Scotti, PT,
DPT, PhD, OCS). The PDF is kept locally in `programs/` for reference and is
not part of this repository. Session times are transcribed from it and should
never be changed on a hunch.
