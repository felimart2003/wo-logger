# IronLog · Workout journal

A private workout tracker for turning consistent training into measurable progress. Built with React, TypeScript, and Vite; no account or backend required.

**[Live demo](https://felimart2003.github.io/wo-logger/)** · [Source](https://github.com/felimart2003/wo-logger)

## Features

- Log weighted, bodyweight, timed, and weighted-duration exercises.
- Build, bookmark, duplicate, and repeat workout routines.
- Rest timers, previous-set autofill, training volume, and personal records.
- Workout history, exercise progress charts, and body-weight trends.
- Kilogram/pound conversion without changing stored canonical kilogram values.
- Persistent active sessions, JSON backup/restore, and custom exercises.
- Responsive dashboard, keyboard-accessible modal dialogs, and local-storage failure warnings.

## Local setup

Requires Node.js 22 and npm. No environment variables or external services are needed.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Open the URL printed by Vite (the app uses `/wo-logger/` as its deployment base). `dist` contains the production website.

## Checks

```sh
npm run lint
npm test
npm audit
```

Playwright uses installed Microsoft Edge by default. Install Chromium with `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium` to use that browser instead. Tests cover invalid backup/state rejection, adding exercises and completed sets, finishing a workout, persistence after reload, keyboard modal dismissal, mobile overflow, and browser runtime errors.

## Architecture and data

`src/store.tsx` provides shared state and versioned local-storage persistence. `src/validation.ts` validates nested persisted records and whole backups before changes are applied. `src/utils.ts` contains unit conversion, workout totals, prior-set lookup, and personal-record calculations. Page components compose shared exercise editors, dialogs, and SVG charts.

All data stays in your browser. Storage is not encrypted and there is no cloud sync. Export backups in Dashboard → Settings before clearing browser data or switching devices. Importing a backup replaces saved collections after confirmation; invalid backups are rejected. Browser storage failures are surfaced so the user can export before closing.

## Deployment

The free demo runs on GitHub Pages. The Actions workflow builds and publishes `dist` on pushes to the default branch. Enable **Settings → Pages → GitHub Actions**. Change `base` in `vite.config.ts` when using a different subpath or a root domain. The static architecture has no server, credentials, or paid services.
