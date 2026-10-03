# Verification record

Verified October 3, 2026, using Node 22.16 and local Google Chrome through Playwright.

## Results

- `npm test`: 12 unit tests passed.
- `npm run build`: production build passed; service worker precached 108 local assets.
- `ATLAS_LIVE=1 ATLAS_OFFLINE=1 ATLAS_TEST_URL=http://127.0.0.1:4173 npx playwright test`: 34 browser tests passed against the production build.
- Desktop (1440 × 1000) and mobile touch viewport (390 × 844) coverage.

## Coverage

Browser checks cover all six chapters, navigation, tide observations and predictions, slider controls, stale and failed requests, formation and marsh controls, photograph galleries, animal groups, anoles, sightings filters, notebook interactions, branding, and both Angela Ray article links. Map checks exercise repeated location selection (including Sadler Road), geometry controls, and mouse-wheel zoom. Accessibility scans found no serious or critical axe violations in the checked views.

Live integration checks fetched NOAA water levels in the browser. Offline checks verified service-worker availability of local creek geometry and bird photographs, explicit unavailability of live measurements, and access to the saved prediction example. Unit checks cover scientific calculations, time handling, data integrity, coordinates, and photograph and observation attribution.

Final desktop map and mobile reptile screenshots were visually inspected. Wildlife photographs were also reviewed during curation. Screenshots and the Playwright report are local, ignored artifacts under `validation/`.

## Scope

Mobile coverage uses Chrome viewport and touch emulation; Safari, Firefox, and physical mobile devices were not tested. External map tiles and current NOAA measurements require a network connection. Geographic and wildlife snapshots have the dates and limits recorded in the application and provenance notes; tests do not establish local creek water depths or a complete wildlife inventory.

## GitHub Pages deployment verification

The `/eganscreek/` production build passed all 12 unit tests and 30 desktop/mobile application checks. Both offline browser checks passed after correcting cache matching for static assets served with a Vary header. The optional live NOAA checks were not repeated for this path-only change. Browser navigation now resolves relative to the configured test base URL, allowing the same suite to check root and project-directory hosting.
