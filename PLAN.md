# Egans Creek: A Living Landscape

Application plan • Research reviewed October 3, 2026 • Planning deliverable, not an implemented application

Build an interactive natural-history atlas of Egans Creek, Amelia Island, Florida: a place visitors can explore geographically, move through geological time, watch a tidal cycle, examine a cordgrass marsh, and learn to recognize its birds. The central experience should connect these subjects: **landform → water movement → marsh vegetation → food web → bird behavior**.

Use semantic HTML, modular JavaScript, CSS, Leaflet, and original SVG/Canvas illustrations. A static deployment should support the complete educational experience; optional online data should enrich it. Target curious adults, families, and visitors returning from a walk, with concise introductory explanations and expandable scientific detail.

## Scientific foundation

Your hypothesis is broadly supported, with qualifications. Olsen Associates’ 2016 marine geology report, summarizing Henry (1971), describes a late-Pleistocene island core and a later lagoon at the interface with younger coastal deposits that developed into Egans Creek salt marsh. This supports a story of an older core, younger barrier development, and an intervening wetland. It does not establish a surveyed “Holocene accretion wedge” beneath the particular spot you visited. Use that phrase as a hypothesis to explore, not the title of a proven local unit. The report’s offshore cores are not cores through the Greenway. [Geological report, §2.1, printed p. 4](https://rossi.urs-tally.com/Document/Download/92)

The Fort Clinch management plan independently describes Pleistocene deposits beneath younger Holocene material. Its local ages and the geological report’s chronology need modern reconciliation before precise dates are attached to strata. The Holocene begins approximately 11,700 years ago; do not repeat the report’s 18,000-year epoch boundary. [FDEP management plan](https://floridadep.gov/sites/default/files/FCSP_Approved_1.pdf), [International Commission on Stratigraphy](https://stratigraphy.org/chart/)

The contemporary creek also has an engineering history. Municipal records describe tidal restoration in 2003 and a water-control intervention at Jasmine Street in 2009 following saltwater impacts farther south. The city’s visitor brochure distinguishes northern salt marsh from southern freshwater habitat. These differences must shape the map and simulations. [City coastal-management analysis](https://fbfl.us/DocumentCenter/View/6428/5_CCM-Data-and-Analysis-FINAL_092011?bidId=), [City brochure](https://www.fbfl.us/DocumentCenter/View/22800/Egans-Creek-Greenway-brochure-and-trails-map)

Every scientific component should distinguish **documented local information**, **regional explanation**, and **illustrative reconstruction**. These can be small, readable labels next to a diagram or in its evidence drawer. Avoid a visually authoritative map of boundaries or water depths that the research cannot establish.

## Experience and navigation

Offer two complementary ways to explore:

- **Take the story:** a guided sequence of six chapters, roughly 12–18 minutes, with optional deeper exploration.
- **Explore freely:** a map-centered workspace with tabs for Formation, Tides, Marsh, Birds, and History. Changes persist between tabs where meaningful.

Opening scene: an illustrated marsh with water at a selected stage, cordgrass at its edges, and a few recognizable birds. A short invitation leads directly to “Move the tide” or “Explore the creek.” Do not block entry with a long cinematic introduction.

Proposed guided chapters:

| Chapter | Main question | Principal interaction | Connection forward |
|---|---|---|---|
| An island within an island | How did this landscape form? | Scrub a sequence of schematic landforms and a cross-section | Locate the low corridor now occupied by wetlands |
| Water comes and goes | What changes between low and high tide? | Move a time cursor across a tide graph | Reveal changing access to marsh edges |
| The grass builds habitat | What does smooth cordgrass do? | Inspect roots, stems, sediment, and food-web links | Follow prey into the bird guide |
| A place to feed | Why do different birds use different places? | Compare birds and animate feeding strategies | Link behavior to water depth and habitat |
| A landscape changed twice | How did people alter the creek? | Compare historical hydrological states | Explain today’s north/south distinction |
| Return to the trail | What can I look for on another visit? | Save a field checklist and choose interpretive stops | Connect the digital story with the real place |

Desktop layout: a generous primary scene or map, a narrow explanation panel, and a persistent compact control bar. Mobile: scene first, controls second, explanation in a collapsible bottom sheet that never covers all usable map space. Provide an explicit “Read the story” view without spatial interaction.

Shared context: selected place, tide time/mode, season, selected bird, enabled map layers, units, motion preference. Geological era and historical infrastructure state remain separate from contemporary tide time, preventing accidental combinations such as a modern observation presented on an ancient coastline.

## 1. Geological formation explorer

Create a linked plan-view illustration and west–east conceptual cross-section. Clearly mark orientation, horizontal distance if supported, and vertical exaggeration. Show Egan’s wetland corridor relative to older upland and younger coastal deposits; do not invent precise subsurface contacts.

Proposed stages:

1. Older barrier/coastal deposits establish the island’s underlying framework.
2. A lower-sea-level interval exposes more coastal plain; a regional inset explains that present coastlines have moved.
3. Postglacial sea-level rise and sediment redistribution reorganize the coastal landscape.
4. Younger coastal deposits and sheltered low areas develop; the lagoon-to-marsh interpretation appears.
5. Modern wetland topography is superimposed, followed separately by documented human alterations.

These are interpretive stages, not a continuous dated reconstruction. Allow play/pause, previous/next, direct stage selection, and dragging the timeline. Show broad geological periods until local dating supports finer detail.

Selectable layers: older sand, younger sand, marsh sediment, water, present-day landmarks. Tapping a layer opens “What is this?”, “Why do we think it is here?”, and “What remains uncertain?”. An evidence toggle replaces clean solid contacts with approximate bands where the boundaries are interpretive.

Add a “Test the hypothesis” panel with the user’s proposed explanation, the evidence supporting its broad outline, and what would require local coring or a more detailed geological map. Explain accretion in plain language as sediment accumulation; distinguish shoreline growth from upward marsh-soil accumulation.

An optional process sandbox lets visitors change conceptual sea level and sediment supply. Label it a thought experiment; the response illustrates possible processes rather than predicting the island’s precise past or future. Keep it visually separate from the documented timeline.

Completion criteria: users can explain the difference between the older core and younger deposits, find the wetland corridor, and tell which parts are reconstructed. No unsupported local formation date, core log, or ancient shoreline is displayed as measured.

## 2. Tide explorer

This should be the application’s most developed interaction: a synchronized tide chart, animated marsh cross-section, and map context.

Use NOAA Fernandina Beach station **8720030** as the nearby reference. NOAA reports a mean tidal range of **6.02 ft**, approximately **1.83 m**, and a great diurnal range of **6.56 ft**, approximately **2.00 m**. These are station statistics, not guaranteed water-level ranges within the Greenway. [NOAA station information](https://www.tidesandcurrents.noaa.gov/stationhome.html?id=8720030)

Provide three explicit modes:

| Mode | Behavior | Visible label |
|---|---|---|
| Learn a tidal cycle | A stored educational cycle always works, including offline | Illustrative cycle |
| Explore a date | NOAA astronomical predictions control the time series | Predicted tide at Fernandina Beach |
| Compare observations | Plot observations and predictions together when both are available | Observed water level at Fernandina Beach |

Controls: play/pause, speed, draggable time cursor, low/high buttons, date selection, feet/metres, reset, and optional side-by-side high/low comparison. Include a selectable spring/neap explanation; “spring” refers to tidal range, not the season. Use a sourced instructional diagram for lunar geometry without suggesting local high water coincides exactly with the Moon passing overhead. [NOAA spring/neap explanation](https://oceanservice.noaa.gov/facts/springtide.html)

As the cursor moves, animate exposed banks, water among stems, submerged roots, accessible shallows, and conceptual movement of small aquatic animals. Birds can shift feeding positions as the available shallows change. The chart, illustration, and textual description must agree.

Use water-level rise/fall to label “rising” and “falling.” Treat current arrows as conceptual: tidal current reversal and slack water cannot be inferred precisely from a nearby water-level maximum. Do not turn a chart derivative into a claimed local current velocity.

The map’s default display shows the tidal study area and selected cross-section location. Optional animated wetting of marsh polygons must say “illustrative inundation.” Keep the freshwater area outside that routine tidal treatment. Do not produce trail-flooding forecasts from a simple height slider.

Numerical model contract:

- Maintain time internally in UTC, display in `America/New_York`, and handle daylight-saving transitions explicitly.
- Maintain vertical values internally in metres with a named datum. MLLW water heights and NAVD88 terrain elevations cannot be subtracted without a supported conversion.
- For a conceptual section, depth is `max(0, waterSurface - bedElevation)` with both values in the same illustrative reference frame.
- Interpolate only short, valid data intervals. Display gaps; do not extrapolate observations or silently manufacture missing tides.
- Never assign an invented creek lag or attenuation coefficient. Introduce one only after comparison with local measurements, with calibration dates and uncertainty.
- Any future terrain-based inundation model needs connected flow paths, barriers, culverts, wetland elevation uncertainty, and local validation. An elevation-only “bathtub” fill is inadequate here.

The data adapter should request a short window of six-minute predictions and, when appropriate, observations; fetch station metadata through the metadata service. Use explicit product, station, dates, units, datum, timezone, and format parameters. NOAA limits six-minute retrieval windows; handle service errors and missing products. [NOAA API documentation](https://api.tidesandcurrents.noaa.gov/api/dev)

Cache a dated response for continuity and display its timestamp. If the network fails, distinguish previously fetched data from the educational example. No application API key should be needed for the basic NOAA integration; validate browser CORS and response schemas during implementation. A sample endpoint could not be retrieved through the research browser, so end-to-end integration remains untested.

Completion criteria: scrubbing gives identical time and level across views; source/mode/datum remain visible; offline mode is honest; northern and southern areas behave differently; no displayed values imply a measured creek gauge.

## 3. The living marsh and smooth cordgrass

Use the supplied [cordgrass photograph](images/IMG_1933.jpeg) as a field reference and an optional zoomable artifact. Build a clear original interactive illustration rather than making visitors read the photographed text through glare.

Display **smooth cordgrass**, with *Spartina alterniflora* as the familiar sign name and *Sporobolus alterniflorus* as the name accepted by Kew. The plant is native in this region. [UF/IFAS species profile](https://plant-directory.ifas.ufl.edu/plant-directory/spartina-alterniflora/), [Kew taxonomy](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77144694-1)

Four linked views:

- **Above and below the mud:** tap leaves, stems, roots, and rhizomes; animate plant growth and sediment around the root network.
- **A wave through the grass:** compare sparse and dense stems under the same illustrative conditions. Show relative energy reduction without unsupported percentages.
- **Follow a particle:** a suspended particle enters the marsh; some material settles, some leaves with the water. Differentiate sediment retention, nutrient cycling, and pollution removal rather than implying everything disappears.
- **Follow the food:** connect plant production, decomposers, detrital consumers, small fish/crustaceans, and wading birds. Include algae as another food-web input so grass is not presented as the sole energy source.

Marshes can buffer waves, retain sediment, support aquatic animals, and process nutrients. Root production and sediment deposition contribute to elevation change; success under rising sea level depends on conditions. [NOAA salt-marsh overview](https://oceanservice.noaa.gov/facts/saltmarsh.html), [NOAA marsh-elevation research](https://coastalscience.noaa.gov/project/salt-marsh-ecology-era-sea-level-rise/)

A season control changes the illustration and the explanation; northern temperate seasonal timing on the sign should not automatically become exact northeast Florida phenology. Add source-backed treatment of salt excretion and belowground aeration before implementing those microscopic animations.

An optional longer-timescale experiment combines relative sediment supply, plant cover, and rising-water scenarios. Keep its illustrative timescale separate from the daily tide slider. Explain that marshes can gain elevation, migrate, or lose habitat; do not claim they always keep pace. Carbon content can be illustrated, but local carbon tonnes require local measurements.

Compare smooth cordgrass with black needlerush and saltmeadow cordgrass in a small regional plant guide; only map local patches when documented. A regional source is not proof that a species occurs at a chosen map point. [Florida Sea Grant identification sheet](https://flseagrant.ifas.ufl.edu/media/flseagrantifasufledu/sea-grant/pdf-files/Saltmarsh-Plants-of-NE-Florida.pdf)

Completion criteria: every hotspot works by keyboard and touch; grass-density comparisons share the same conditions; ecological effects are qualitative unless supported; the food web can be read as a simple ordered list.

## 4. Wading-bird field guide

Include all twelve species on [the photographed sign](images/IMG_1935.jpeg). A sign listing is local interpretive evidence, not evidence that the user personally saw every species or that each is equally common today.

| Species | Proposed identification or behavior focus | Reference |
|---|---|---|
| Western Cattle-Egret | Stocky white bird; contrast terrestrial insect feeding with aquatic foragers; retain “Cattle Egret” as the sign alias | [Cornell](https://www.allaboutbirds.org/guide/Western_Cattle-Egret/overview) |
| Snowy Egret | Black bill and yellow feet in adults; compare with Great Egret | [Cornell](https://www.allaboutbirds.org/guide/Snowy_Egret/id) |
| Great Egret | Larger white egret with yellow bill and dark legs | [Cornell](https://www.allaboutbirds.org/guide/Great_Egret/id) |
| White Ibis | Curved bill; probing strategy | [Cornell](https://www.allaboutbirds.org/guide/White_Ibis/lifehistory) |
| Roseate Spoonbill | Spoon-shaped bill and lateral sweeping | [Cornell](https://www.allaboutbirds.org/guide/Roseate_Spoonbill/lifehistory) |
| Wood Stork | Bare head; tactile feeding | [Cornell](https://www.allaboutbirds.org/guide/Wood_Stork/lifehistory) |
| Tricolored Heron | White belly contrasted with darker body | [Cornell](https://www.allaboutbirds.org/guide/Tricolored_Heron/id) |
| Great Blue Heron | Large gray-blue silhouette and deliberate stalking | [Cornell](https://www.allaboutbirds.org/guide/Great_Blue_Heron/id) |
| Green Heron | Compact posture and feeding from the water’s edge | [Cornell](https://www.allaboutbirds.org/guide/Green_Heron/lifehistory) |
| Little Blue Heron | Compare white immature plumage with dark adult plumage | [Cornell](https://www.allaboutbirds.org/guide/Little_Blue_Heron/id) |
| Yellow-crowned Night Heron | Head pattern and crustacean feeding | [Cornell](https://www.allaboutbirds.org/guide/Yellow-crowned_Night_Heron/lifehistory) |
| Black-crowned Night Heron | Stocky silhouette and dusk/night activity | [Cornell](https://www.allaboutbirds.org/guide/Black-crowned_Night_Heron/lifehistory) |

Species cards contain an adult image, an alternate age/plumage image where useful, field marks, size comparison, food, typical habitat, behavior, local-evidence note, and references. Keep species IDs stable even if taxonomy changes. Do not copy the sign’s older scientific names wholesale.

Interactions:

1. Compare two or three birds at the same approximate scale, with annotations for bills, feet, body shape, and plumage.
2. Filter by visible traits and habitat; offer “not sure” for each trait.
3. Play brief original feeding animations: stalking, foot stirring, probing, sweeping, and tactile capture.
4. Show a bird in the tide scene, with a readable explanation of habitat accessibility. Habitat suitability is not a sighting probability.
5. Offer a five-question identification challenge with explanations and no timer.
6. Save a personal checklist locally, with date, broad location, notes, and confidence; export JSON/CSV and delete entries.

Cornell describes Wood Stork feeding in roughly 4–12 inches of water. This can illustrate why depth matters, but it is not a universal habitat cutoff or a model calibrated for Egans Creek. [Cornell Wood Stork account](https://www.allaboutbirds.org/guide/Wood_Stork/lifehistory)

The Florida Birding Trail recognizes the site as a substantial birding location. Use verified local records for any abundance or seasonal chart; otherwise retain qualitative descriptions. Include a distinction between birds listed on the sign, documented at the site, and recorded in a user’s notebook. [Florida Birding Trail](https://floridabirdingtrail.com/site/egans-creek-greenway/)

Use rights-cleared photos and audio. Cornell reference pages do not confer reuse rights to their media. Audio, if acquired, starts only on demand. A field-mode switch disables playback prompts. Avoid mapping sensitive nest locations.

Completion criteria: twelve complete cards; compare and filters work without color alone; juvenile/adult distinctions are accurate; checklist export/import round-trips; no fabricated sightings, seasonal curves, or encounter percentages.

## 5. Map and spatial data

**Recommend Leaflet.** This is primarily a two-dimensional interpretive map with a modest set of local overlays. Leaflet supports GeoJSON, imagery, vector layers, and touch interaction directly. Keep complex scientific animation in adjacent SVG/Canvas views. Consider MapLibre only if later requirements justify large vector-tile datasets or continuous terrain rendering. [Leaflet documentation](https://leafletjs.com/)

Map extents: start with the Greenway, then provide a whole-island view and a regional coastal inset. Make the creek, Greenway, and Egans Creek Park distinguishable rather than treating their names as interchangeable.

Proposed layers:

| Layer | Acquisition and preparation | Presentation |
|---|---|---|
| Streets and place context | Licensed tile provider using OSM or equivalent data | Quiet base map with attribution |
| Aerial imagery | Acquire an authorized source and record capture date | Toggle, not permanent background |
| Trails, bridges, trailheads, facilities | Current city material/GIS; reconcile against dated sign | Clickable routes and stop cards |
| Waterways and structures | City/agency GIS and imagery review | Distinguish creeks, ditches, culverts, and gates |
| Wetland classes | NWI extract, clipped and simplified locally | Explain survey date and classification limits |
| Elevation/hillshade | Evaluate NOAA Digital Coast or USGS 3DEP coverage | Relief context, not automatic flood depths |
| Geological interpretation | Evidence-backed original diagrams | Approximate boundaries visibly marked |
| User photographs | Local photo registry | Approximate marker only if location is known |
| Interpretive bird habitat | Curated habitat polygons | Suitable habitat, not live bird positions |

Candidate authoritative repositories: [NWI wetlands data](https://www.fws.gov/program/national-wetlands-inventory/wetlands-data), [NOAA Data Access Viewer](https://coast.noaa.gov/digitalcoast/tools/dav.html), and [USGS 3DEP products](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services). Exact local acquisitions, resolution, and dates still need inspection.

The supplied trail-map photograph is dated July 2013. Preserve it as a dated reference. Do not trace it into a purportedly current navigation map without reconciliation. Never stretch a tilted photograph directly over the basemap as if it were georeferenced.

Use stable feature IDs, WGS84 GeoJSON coordinates in longitude/latitude order, and metadata for source, date, accuracy, and license. Derive route distances from reviewed geometry, not conflicting promotional mileage totals. Provide a searchable list of locations equivalent to all map interactions.

Public OpenStreetMap standard tiles require attribution and compliance with usage policy; do not bulk-download or prefetch them for offline use. Offline mode uses a small original schematic and locally bundled overlays, or a separately licensed offline tile product. [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/)

## 6. Restoration history and the visitor’s photographs

Create a before/after comparison with discrete states: natural wetland interpretation; drainage and tidal restriction; protected public landscape; northern restoration; southern freshwater protection. Dates belong on documented events, not invented images.

The supplied May 2026 articles add a first-person account of the conservation effort and recolonization, and describe unintended damage to red maples after saltwater entered the southern area. Attribute recollections to the author. Keep interpretive judgments distinct from measured outcomes. [Fernandina Observer, part one](https://www.fernandinaobserver.org/stories/the-history-of-egans-creek-greenway-the-pride-of-amelia-island,106405), [part two](https://www.fernandinaobserver.org/stories/the-history-of-the-ron-sapp-egans-creek-greenway-the-pride-of-amelia-island,107197)

An interactive gate diagram lets visitors compare an open tidal connection with a one-way outlet. It should illustrate the management tradeoff and label its simplified behavior; a present-day engineering specification requires current drawings.

Add a “From the trail” drawer with all three original photographs, descriptive captions, zoom, and links into the related module. Exact visit date and photo locations are unconfirmed. Do not turn “a couple of days ago” into a precise timestamp. Preserve originals and strip GPS from any public derivative unless its publication is intended.

## Visual and interaction design

Use a naturalist-atlas aesthetic: warm paper backgrounds, deep green typography, marsh-gold vegetation, blue-gray water, dark peat cross-sections, and restrained rose accents for highlights. Distinguish factual maps from reconstructions through drawing style and labels. An understated serif can carry the narrative; use a highly legible sans-serif for controls and data.

Create original vector illustrations for cross-sections, grass anatomy, feeding actions, and the food web. Use real, licensed photography for bird identification. Avoid decorative particle motion that suggests scientifically meaningful flow where none has been modeled.

All motion is user-controlled. Support `prefers-reduced-motion`, visible pause/reset controls, keyboard sliders, generous touch targets, and static end-state alternatives. Do not hijack page scrolling. Provide full-screen scene expansion without trapping focus.

Use plain language first, then “Go deeper” drawers for terms such as tidal datum, rhizome, Pleistocene, accretion, and brackish. Tooltips must also open on focus and tap. Color is supplemented by symbols, labels, or patterns.

## Technical architecture

Choose vanilla JavaScript ES modules and Vite for development/build tooling; native CSS with custom properties, grid, and container queries where supported. The application is complex enough to need explicit state and components, but its scope does not require a large framework. Pin dependency versions at implementation after checking the stable releases.

Use SVG for accessible diagrams and charts; Canvas only for dense particle effects or illustrative scenes, with equivalent HTML descriptions. Load Leaflet when the map is first needed. Use a small charting dependency only if native SVG implementation becomes harder to maintain.

Proposed structure:

```text
index.html
src/
  main.js
  state/                 # validated actions, derived state, URL serialization
  components/            # accessible controls, drawers, dialogs, figure captions
  modules/
    map/ formation/ tides/ marsh/ birds/ history/ notebook/
  services/              # NOAA adapter, cache, content loading
  styles/                # tokens, layout, component and print styles
public/
  data/                  # reviewed JSON, clipped GeoJSON, dated tide example
  assets/                # optimized photos, original SVG, licensed media
scripts/                 # source validation and reproducible data preparation
tests/                   # scientific logic, integration, accessibility journeys
docs/                    # data provenance, asset rights, maintenance guidance
```

Content models:

| Record | Required information |
|---|---|
| Source | ID, title, publisher, URL, publication/review date, locator, evidence scope |
| Claim | ID, text, source IDs, local/regional/inferred status, caveat, review state |
| Place | ID, geometry, type, description, source IDs, accuracy, valid-as-of date |
| Species | Stable ID, current and sign names, traits, habitat, media, local-evidence status |
| Timeline event | Date or range, event text, evidence level, source IDs, illustration ID |
| Tide series | Station, product, datum, units, timezone, timestamps, values, flags, fetched-at |
| Asset | Path, creator, license/permission, source, credit, alt text, dimensions |
| Notebook entry | Local ID, date, species, confidence, broad location, notes |

Keep rendering separate from scientific calculations. A single animation clock drives the tide chart and scene; changes dispatch state actions, and each view derives its own rendering. Preserve shareable settings in the URL, but never place private notebook notes there. Version local storage and imported notebook formats.

No accounts or database are necessary for the planned release. Use a static build on any suitable static host. If an optional eBird integration is later commissioned, add a small server-side adapter for credentials, quotas, and caching; keep it outside the essential experience.

For offline access, cache the application shell, educational content, schematic map, and selected optimized media. Prompt for large optional downloads. Store neither an unlimited tile cache nor an unbounded observation archive. Handle service-worker upgrades with an explicit refresh notice and migration tests.

## Quality targets and validation

Targets are acceptance goals, not measured results:

- Core reading works without JavaScript; each enhanced module has a useful textual fallback.
- Keyboard and screen-reader users can complete the guided story, compare birds, operate time controls, and use the location list.
- Aim for WCAG 2.2 AA; manually review charts, focus, dialogs, captions, and reduced motion alongside automated checks.
- Initial route excludes full-resolution images and unnecessary map assets; target under 1.5 MB compressed on first entry, with remaining modules/media loaded on demand.
- Target LCP below 2.5 seconds, INP below 200 ms, and CLS below 0.1 on a representative mobile test setup; document conditions.
- Smooth animation on a typical recent phone, with a lower-density mode if rendering slows; pause work in hidden tabs.
- Test current Safari/iOS, Chrome/Android, Firefox, and Edge at narrow and wide widths.

Meaningful automated tests: unit/datum guards; UTC/DST conversion; tide interpolation across gaps; scientific-state separation; stale-data labels; geometry validation; bird-filter outcomes; source-reference integrity; notebook export/import and deletion.

End-to-end journeys: complete the story; scrub a tide and inspect a bird; compare northern/southern water systems; reopen a shared scene; operate everything with keyboard only; load offline; recover from failed NOAA/map requests. Visually review low/mid/high tide, geological stages, the twelve species cards, mobile controls, and printed field notes.

Scientific review should check morphology, bird traits, hydrological labels, and evidence status. Each figure should have a sentence answering: “What does the viewer have permission to infer from this image?”

## Delivery sequence

| Phase | Deliverable | Exit condition | Indicative focused effort |
|---|---|---|---|
| 1. Evidence and assets | Final claim register; local geometry; tide fixture; media rights | All public claims have support; uncertain geometry is marked | 3–5 days |
| 2. Design and vertical slice | Responsive shell, map, one working tide section | One complete accessible exploration works on mobile | 3–4 days |
| 3. Connected scientific modules | Geology, full tides, cordgrass and food web | Shared state works; diagrams meet scientific constraints | 5–7 days |
| 4. Birds and place history | Twelve species, comparison, notebook, history/photos | Content and interactions are complete | 4–6 days |
| 5. Verification and release preparation | Offline behavior, performance, accessibility, editorial review | Acceptance journeys pass; source and rights audit closes | 3–5 days |

Total planning estimate: **18–27 focused implementation days**, excluding external permission waits or newly commissioned field research. This is an effort estimate, not a promised calendar delivery date. All four requested scientific subjects belong in the complete release; later enhancements can include authenticated observation feeds, independently reviewed local inundation modeling, and additional languages.

Before exact spatial or numerical claims ship, resolve the specific items in [RESEARCH.md](RESEARCH.md): geological contacts and dates, current gate configuration, current trails, local tide transfer, media permissions, and species seasonality. The educational application can still be complete using clearly labeled conceptual sections and documented habitat context.

The finished application should let someone change one thing—time, water level, vegetation, or viewpoint—and understand what else changes and why, while keeping the real geography and the evidence visible.
