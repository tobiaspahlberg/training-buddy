# Tests

The app is one HTML file with no build step, so these suites load
`docs/index.html` into [jsdom](https://github.com/jsdom/jsdom), drive it the
way a thumb would, and read the result back out of the DOM. There is no test
framework: a suite is a plain Node script that prints `  ok` or `FAIL` per
assertion, and `run.sh` counts them.

```bash
cd tests
npm install     # once, jsdom only
npm test        # every suite
node lead.js    # one of them, with its output in full
```

`npm test` exits non-zero if anything failed, so it can be trusted by a script.

## What is in here

| Suite | What it holds onto |
| --- | --- |
| `smoke` | the whole way through: home, category, plan, copy, editor, save |
| `clock`, `lead`, `speech` | the running session: steps, the count-in, cues, skipping |
| `hist`, `delhist` | finished sessions, and removing one |
| `del`, `delplan`, `undo` | deleting a session or a plan copy, and taking it back |
| `wods`, `rehab`, `plan5k` | the built-in workouts and plans, against their sources |
| `colour`, `size`, `sheet`, `kinds` | how things are drawn, and where a session opens from |
| `voices`, `latevoice`, `note` | speech engines, the voice picker, the ongoing notification |
| `search`, `update`, `backup`, `editor` | search, the update check, backup and restore, the editor |
| `cats`, `recent` | the categories and the old names they replace, and what is on home |

`shot.js` is not a suite. It walks the app to a screen and writes the page out
as HTML, so a real browser can take a picture of a screen jsdom cannot draw.
Whatever the walk leaves in `localStorage` is written into the page ahead of the
app, because the page starts itself again when the browser opens it – without
that, anything drawn from storage is drawn a second time from an empty phone:

```bash
node shot.js 'openCategory("cardio"); newProgram("cardio");' /tmp/x.html
chromium --headless=new --window-size=500,1200 --screenshot=/tmp/x.png file:///tmp/x.html
```

## Adding one

Copy the top four lines of any suite, write assertions, and add the file's name
to `SUITES` at the top of `run.sh` – a file that is not in that list is reported
at the end of a run rather than silently skipped.

Two things worth knowing, both learned the hard way:

- **A crash is a failure.** `run.sh` decides that from node's exit code and from
  a stack trace at the start of a line. It does not grep the output for words
  like "error", which once matched an assertion's own wording and reported a
  passing suite as broken.
- **The app reads `window.Capacitor` once, as it loads**, because `NATIVE`,
  `TTS` and `NOTES` are `const`. To test the Android side of anything, put the
  fake plugins in through jsdom's `beforeParse`, not afterwards.
