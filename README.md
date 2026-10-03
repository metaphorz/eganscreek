# Egans Creek: A Model

An interactive field atlas of Egans Creek on Amelia Island, Florida. Built with HTML, CSS, JavaScript, Vite, and Leaflet. No backend or API key is required.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The opening **Map** tab shows the creek's USGS channel geometry over an OpenStreetMap basemap. Additional tabs cover tides, geological formation, cordgrass ecology, animals, and restoration history. The Animals submenu defaults to Birds, with Reptiles, Mammals, Amphibians, Fish, and Invertebrates alongside.

```sh
npm run build
npm run preview
```

Serve `dist/` at the root of an HTTPS website (or localhost). Directly opening `index.html` as a file is unsupported. The production service worker stores local assets for offline use after its first successful installation; live observations and external map tiles still require connectivity. External tiles are not bulk downloaded or stored by the app.

## What is measured, mapped, or conceptual

- **Map:** 35 USGS National Hydrography Dataset flowline features named Egans Creek, downloaded October 3, 2026. The highlight follows mapped channel geometry, including paths through open water. It is not a surveyed wetland boundary, property line, or current water extent. The separate habitat schematic explains the north–south relationship.
- **Tides:** the latest NOAA water-level observation at Fernandina Beach station **8720030**, automatically requested when the Tides chapter opens and refreshed every six minutes while visible. Measurement time, age, preliminary status, units, and MLLW datum are shown. Readings older than 18 minutes are labeled stale; a failed request does not fabricate a current reading. This is a nearby reference gauge, not a gauge inside Egans Creek.
- **Tide slider:** astronomical predictions for the selected UTC date, labeled separately from observations and displayed in Eastern time. Dragging leaves the current-observation view; **Now** returns to it. Other modes include a saved NOAA prediction day and a separately labeled idealized learning cycle. Cached daily series carry a cache label. The marsh animation and cross-section are conceptual: there is no surveyed creek elevation grid or calibrated inundation model.
- **Birds:** 12 species from the supplied interpretive-sign photograph, with 44 credited photographs across draggable galleries. Photos depict the species at various locations, not verified sightings at Egans Creek. Gallery sliders, arrow keys/buttons, mouse dragging, and touch swiping are supported. Small birds within the conceptual tide animation remain illustrations.
- **Other animals:** 20 additional species selected from research-grade iNaturalist records in an area around the Greenway, including Brown and Green Anoles. Forty reference photographs show these species; the search rectangle includes neighboring habitats and is not the park boundary.
- **Animal sightings map:** a dated snapshot of 26 openly licensed observation records, with group, species, and date filters, observer attribution, reported accuracy, and source links. Locations must be public and unobscured with reported accuracy at most 100 m. Some groups have no records passing those filters; this does not imply absence. Links open the broader current iNaturalist map and eBird hotspot explorer.
- **Formation and marsh ecology:** source-backed explanatory models. The precise local stratigraphic contacts, wave attenuation, sediment accumulation, and future habitat distributions are not measured by the app.

## Data and assets

- [Research notes](RESEARCH.md) and [original plan](PLAN.md)
- [Data and image provenance](docs/PROVENANCE.md)
- [Verification record](docs/VALIDATION.md)
- `src/data/creek.json`: bundled creek geometry with source query and retrieval metadata.
- `src/data/bird-photos.json`: photo source pages, authors, licenses, and original URLs.
- `public/data/noaa-2026-10-01.json`: downloaded NOAA predictions, not observations.
- `images/` and `stories/`: user-supplied reference materials.

To refresh reference datasets deliberately:

```sh
node scripts/fetch-reference-data.mjs
node scripts/fetch-map-data.mjs
node scripts/fetch-bird-photos.mjs
node scripts/fetch-wildlife.mjs
node scripts/collect-animal-data.mjs
node scripts/curate-animal-photos.mjs
```

The photo collector preserves existing curated galleries. New candidates require visual review; title matching is only a discovery aid. The source may throttle downloads. The app does not scrape or fetch photo metadata at runtime.

## Verification

```sh
npm test
npm run build
npm run dev -- --port 5173
# In another terminal:
npm run test:browser
```

Browser tests use installed Google Chrome on macOS by default. Set `CHROME_PATH` for another compatible Chromium executable, and `ATLAS_TEST_URL` to override the preview URL. The mobile project tests a phone viewport with touch support; it does not emulate Safari.

Optional external-service and production-offline checks:

```sh
ATLAS_LIVE=1 npx playwright test tests/browser/integration.spec.js --grep 'real NOAA'
# Serve dist/ on port 4173 before this check:
ATLAS_OFFLINE=1 ATLAS_TEST_URL=http://127.0.0.1:4173 npx playwright test tests/browser/integration.spec.js --grep 'production service'
```

## Notebook and privacy

Field observations for birds and other guide animals stay in browser local storage. JSON import/export and CSV export are available. Export before clearing browser data or moving devices; there is no account sync. Shared chapter links do not include notebook records. NOAA and OpenStreetMap receive ordinary requests when their online features are used. The app does not request device location.

Third-party photographs retain their individual licenses. USGS/NOAA data and OpenStreetMap map credits are identified separately. No blanket license is asserted over the supplied sign photographs.
