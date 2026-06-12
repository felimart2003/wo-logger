# IronLog — Workout Tracker

A Hevy/Strong-style workout logger that runs entirely in your browser. All data is stored
locally (localStorage) — no account, no backend, no community features.

## Run it

```sh
npm install
npm run dev
```

Then open the printed localhost URL. `npm run build` produces a static production build in `dist/`.

## Features

**Dashboard**
- Workouts this week, week streak, weekly volume, total workouts
- Body weight tracking: log entries, see a progress graph, and view your change as both a
  magnitude (± kg/lb) and a percentage (± %) over 1M / 3M / 6M / 1Y / All
- Workouts-per-week bar chart and recent workout list
- Settings: kg/lb units, default rest timer, JSON export/import backup, wipe data

**Workout**
- Start an empty workout or one-tap start from a routine
- Custom routines (templates): preset exercises, sets, weights, reps, per-exercise rest timers;
  edit, duplicate, delete, and **bookmark favourites** (★ pins them to the top)
- Live logging: elapsed timer, per-set weight/reps/duration, set types (Warmup / Drop / Failure —
  tap the set number), "previous" column showing your last session (tap to autofill),
  automatic rest timer with beep and +15s/−15s/skip controls, live volume/set counts
- Finish summary with duration, volume, sets, and automatic PR detection
  (heaviest weight, estimated 1RM, best set volume, most reps, longest duration)

**History**
- All past workouts grouped by month with duration/volume/set stats
- Open a workout to edit it in place, repeat it, save it as a routine, or delete it

**Exercises**
- 115+ seeded exercises, searchable and filterable by muscle group
- Create / edit / delete your own custom exercises (weight×reps, reps-only, duration,
  or weight×duration)
- Per-exercise detail: personal records, lifetime totals, progress charts
  (heaviest weight, est. 1RM, session volume, total reps) and full session history

## Notes

- Weights are stored in kg internally and converted for display, so switching units is lossless.
- An in-progress workout survives page reloads.
