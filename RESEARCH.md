# Egans Creek research and asset register

Reviewed October 3, 2026. This register supports [PLAN.md](PLAN.md). Findings below distinguish inspected sources from proposed acquisition work. No application, local hydrodynamic model, or live data integration has yet been built or validated.

## Local material inspected

| File | Contents | Planned use and limitation |
|---|---|---|
| [IMG_1933.jpeg](images/IMG_1933.jpeg) | Interpretive smooth-cordgrass panel; habitat, erosion, water, organisms, and seasons | Starting point for interactive marsh anatomy; regional sign claims need independent support |
| [IMG_1934.jpeg](images/IMG_1934.jpeg) | Greenway trail map, marked July 2013 | Dated comparison and orientation; unsuitable as sole source for current routes |
| [IMG_1935.jpeg](images/IMG_1935.jpeg) | Twelve wading-bird profiles | Defines the initial bird-guide roster; photography of signage is not a personal species observation |
| `stories/…106405.webloc` | Link to Fernandina Observer history, part one | Resolved and full article read; published May 16, 2026 |
| `stories/…107197.webloc` | Link to Fernandina Observer history, part two | Resolved and full article read; Angela Ray, May 23, 2026 |

The web research tool could not open the news URLs. Both were subsequently fetched successfully and read as HTML. Article text has not been republished into this project. Exact photo locations and capture dates remain unverified.

## Evidence register

| ID | Source and locator | Why it matters | Treatment |
|---|---|---|---|
| G1 | [Olsen Associates, Marine Geological Field Investigation, May 10, 2016](https://rossi.urs-tally.com/Document/Download/92), §2.1, printed p. 4 / PDF p. 8 | Explicit connection between island development and Egan’s lagoon/marsh interpretation | Strong lead, but local history is a synthesis of Henry (1971), not new Greenway cores |
| G2 | [FDEP approved Fort Clinch plan](https://floridadep.gov/sites/default/files/FCSP_Approved_1.pdf), Geology | Independent official account of older and younger island deposits | Use broad stratigraphy; reconcile legacy ages |
| G3 | [ICS chart](https://stratigraphy.org/chart/) | Modern epoch boundaries | Governs geological time labels |
| G4 | [FDEP Fort Clinch draft chapter](https://floridadep.gov/sites/default/files/Fort%20Clinch%20State%20Park%20Complete%20Chapter%20AG%20Draft.pdf), Salt Marsh, printed p. 29 | Describes dredged creek/ditches and vegetation change near the park | Draft and geographically scoped; do not generalize every statement to the whole Greenway |
| H1 | [Fernandina Observer part one](https://www.fernandinaobserver.org/stories/the-history-of-egans-creek-greenway-the-pride-of-amelia-island,106405) | Conservation and drainage history | Secondary narrative; its suggested historic southern extent is explicitly tentative |
| H2 | [Fernandina Observer part two](https://www.fernandinaobserver.org/stories/the-history-of-the-ron-sapp-egans-creek-greenway-the-pride-of-amelia-island,107197) | First-person restoration account and southern saltwater impacts | Attribute memory and interpretation; independently source precise project dates |
| H3 | [City coastal-management analysis, 2011](https://fbfl.us/DocumentCenter/View/6428/5_CCM-Data-and-Analysis-FINAL_092011?bidId=) | Documents restoration and subsequent control work | Historical municipal evidence, not a current as-built drawing |
| H4 | [Florida Administrative Weekly, vol. 37, no. 43, 2011](https://www.flrules.org/gateway/GotoLink.asp?Goto=BigDocFAW&Para=2011%2F3743%2F3743doc.pdf), p. 3591 | FDOT workshop on southern restoration alternatives | Shows follow-up planning continued; do not imply 2009 ended all management work |
| L1 | [City Greenway page](https://fbfl.us/104/Egans-Creek-Greenway) | Official name, access points, facilities, general site description | Recheck visitor information before release |
| L2 | [City brochure and map](https://www.fbfl.us/DocumentCenter/View/22800/Egans-Creek-Greenway-brochure-and-trails-map) | Northern/southern habitat distinction and visitor map | Primary interpretive source; map publication and current conditions need reconciliation |
| T1 | [NOAA station 8720030](https://www.tidesandcurrents.noaa.gov/stationhome.html?id=8720030) | Nearby reference station and tidal statistics | Regional water-level reference; not a gauge inside the Greenway |
| T2 | [NOAA CO-OPS API](https://api.tidesandcurrents.noaa.gov/api/dev) | Prediction and observation retrieval contract | Integration still needs request/response and CORS testing |
| P1 | [UF/IFAS smooth cordgrass](https://plant-directory.ifas.ufl.edu/plant-directory/spartina-alterniflora/) | Florida occurrence and identification | Regional plant account |
| P2 | [Kew accepted plant name](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77144694-1) | Resolves name used on the sign versus current taxonomy | Store both names, with taxonomy authority |
| P3 | [NOAA salt marsh overview](https://oceanservice.noaa.gov/facts/saltmarsh.html) | General marsh processes and ecological functions | General explanation, not local quantitative measurements |
| P4 | [NOAA marsh ecology research](https://coastalscience.noaa.gov/project/salt-marsh-ecology-era-sea-level-rise/) | Root production, sediment, and elevation processes | Informs conceptual dynamics |
| P5 | [UF/IFAS salt marsh restoration](https://ask.ifas.ufl.edu/publication/FA269) | Restoration approaches and plant–mussel interactions | Optional depth for marsh module; avoid site-specific restoration advice |
| P6 | [Florida Sea Grant marsh plants](https://flseagrant.ifas.ufl.edu/media/flseagrantifasufledu/sea-grant/pdf-files/Saltmarsh-Plants-of-NE-Florida.pdf) | Regional comparison species | Presence at individual locations still needs evidence |
| B1 | [Florida Birding Trail: Egans Creek](https://floridabirdingtrail.com/site/egans-creek-greenway/) | Independent local birding context | Broad occurrence context; not a live sightings feed |
| B2–B13 | Twelve Cornell accounts linked individually in PLAN.md | Traits, age differences, habitats and feeding behavior | Use for biology; clear photo/audio permissions separately |
| M1 | [Leaflet](https://leafletjs.com/) and [API reference](https://leafletjs.com/reference.html) | Mapping capability and interaction model | Pin a stable version at build time |
| M2 | [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) | Attribution, cache and offline restrictions | Choose provider and offline strategy accordingly |
| D1 | [NOAA Data Access Viewer](https://coast.noaa.gov/digitalcoast/tools/dav.html) | Candidate imagery/elevation acquisition | Local dataset coverage and metadata not yet audited |
| D2 | [USGS 3DEP](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services) | Candidate terrain data | Check resolution, date, vertical datum, vegetation and water limitations |
| D3 | [USFWS NWI data](https://www.fws.gov/program/national-wetlands-inventory/wetlands-data) | Candidate wetland polygons | Classification context; not property or jurisdictional boundaries |

## Research conclusions and unresolved distinctions

**Geology:** confidence is good for the broad older-core/younger-deposit interpretation, lower for exact local contact geometry and age. “Accretion wedge” should remain a question, not a formal unit assignment. Locate Henry’s original 1971 work and a modern local surficial/geological map before fine-grained reconstruction. A diagram can be complete while explicitly schematic.

**Hydrology:** separate water level, current, salinity, and inundation. A remote tide prediction establishes none of the latter three precisely inside the marsh. The northern/southern distinction is essential; exact contemporary gate operations and tidal penetration require current municipal/FDOT material.

**History:** sources refer to different restoration acreages (roughly 50 versus 70 acres). Do not silently pick a number; it may reflect cleared area versus project footprint. Use “northern restoration area” until scope is reconciled. A documented 2009 intervention and a 2011 alternatives workshop can both be true.

**Plants:** signage is useful but some claims are broad, such as a global ecosystem-productivity ranking and percentages of commercially important species. Omit rankings and percentages unless their scope and original evidence are clear. Do not imply sediment retention permanently neutralizes every pollutant or that every marsh keeps pace with sea-level rise.

**Birds:** all twelve sign species belong in the guide. Their frequency, breeding status, seasonal peaks and exact feeding locations require separate local evidence. The current Cornell name is Western Cattle-Egret (*Ardea ibis*); preserve the sign’s older label as an alias. Do not equate a conservation summary category with current federal/state legal status; omit legal-status badges until separately verified.

**Visitor map:** authoritative pages and old maps may disagree about routes and mileage. Review current geometry and public access before adding itinerary lengths or turn-by-turn navigation. The project is an interpretive atlas, with links to the city for current conditions.

## Acquisition tasks for implementation

| Priority | Work item | Evidence required | Safe completion path if unavailable |
|---|---|---|---|
| P0 | Current trails and facilities | City GIS/map with date; route comparison | Use a clearly dated interpretive route map and location list |
| P0 | Modern hydrological structures | Current gate/culvert locations and drawings | Schematic connectivity diagram with no engineering dimensions |
| P0 | Tide data fixture and adapter | Successful NOAA response, metadata, quality flags, timestamp | Dated educational dataset with explicit illustrative label |
| P0 | Bird imagery | Twelve accurate, licensed images; extra juvenile comparisons | Commission original verified illustrations |
| P0 | Source and rights records | Claim-to-source mapping and per-asset permission | Link to sources; publish original summaries/art |
| P1 | Geological detail | Original Henry reference, current geological mapping | Broad conceptual periods and uncertain-contact bands |
| P1 | Terrain and wetland boundaries | Downloaded local extract with resolution, date and datum | No modeled flood footprint; retain conceptual tide section |
| P1 | Seasonal bird occurrence | Verified local survey/checklist data with effort context | Qualitative habitat and regional seasonal notes |
| P1 | Local marsh anatomy details | Sources for salt glands, root aeration, regional phenology | Limit animation to supported macroscopic processes |
| P2 | Historic imagery | Georeferenced dated images with reuse rights | Original historical state diagrams |
| P2 | Bird audio | Correct species recording and reuse license | Visual behavior and text descriptions |
| P2 | Local tide transfer | Paired local and NOAA measurements | No phase/height correction claimed for Egans Creek |

No outstanding item requires inventing data or prevents designing the complete application. They determine where the first release uses measured geography, attributed narrative, or labeled illustration.
