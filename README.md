# Bill App

Offline-first mobile PWA scaffold for Android, built with React, Vite, TypeScript, Tailwind CSS, vite-plugin-pwa, and native IndexedDB preparation.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Architecture

- `src/components` contains reusable app shell, navigation, icon, and theme UI primitives.
- `src/screens` contains route-level screens for Calculator, History, and Settings.
- `src/services` contains platform services such as PWA service worker registration.
- `src/storage` contains IndexedDB schema and database opening utilities.
- `src/hooks` contains client state hooks for hash navigation and theme selection.
- `src/styles` contains Tailwind entry CSS and design tokens.
- `src/types` contains shared TypeScript contracts.
- `src/utils` contains framework-neutral helpers.

The app intentionally avoids a routing library for now. Hash navigation keeps the SPA lightweight while preserving shareable/reloadable screen state.

## Offline Strategy

The PWA uses `vite-plugin-pwa` with Workbox generation. Build assets and the app shell are precached, navigation falls back to `index.html`, image assets use cache-first runtime caching, and the registered service worker checks for updates hourly.

IndexedDB is prepared with versioned stores for future calculation history and settings. The database is not opened during startup, keeping initial render fast.
