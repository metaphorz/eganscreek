# Data and image provenance

Reviewed October 3, 2026. The application uses the spelling **Egans Creek**, consistent with the City of Fernandina Beach and the USGS hydrography records.

## Creek geography

The geometry in `src/data/creek.json` is downloaded from the USGS National Hydrography Dataset, Flowline – Large Scale, layer 6:

https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6

The query selects `gnis_name LIKE '%Egan%'` within a bounding box covering northern Amelia Island and returns WGS84 GeoJSON. All 35 returned features are named Egans Creek. Full query URL and retrieval time are retained in metadata; the original feature properties and coordinates are retained. Feature dates may precede retrieval (the downloaded features include March 2022 dates). The service describes public-domain hydrography, not current measured water extent or site-specific regulatory boundaries.

The flowline bounds are approximately 30.641507–30.692374° N and 81.459891–81.438775° W. The about-5.7-km value in the map legend is the north–south geographic span, not summed channel length. Named area and waterbody queries returned no matching polygons; consequently the app draws centerlines rather than inventing a filled boundary. The Greenway focus button changes the view, not the dataset or a claimed property boundary.

Basemap: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright. Tiles are requested from the standard tile endpoint for visible map areas; the application does not bulk cache them. Creek geometry is locally bundled and remains available offline.

The Atlantic Recreation Center reference coordinate is from Florida Hikes; official city access information provides context. NOAA station coordinates were updated from the NOAA water-level API metadata. Both references are retained in `src/data/places.json`. Jasmine Street uses a geocoded street reference near the creek; Sadler Road uses the geocoded Residence Inn address at 2301 Sadler Road. These are labeled street/hotel references, not surveyed trailhead points. The published access descriptions come from the City and the Great Florida Birding and Wildlife Trail; geocoding results are retained in `public/data/access-geocoding.json` with OSM feature IDs and source queries.

## NOAA water levels

Station 8720030, Fernandina Beach. API documentation:

https://api.tidesandcurrents.noaa.gov/api/prod/

`product=water_level&date=latest` supplies the recent observation. Units are requested in metres, datum MLLW, times GMT/UTC. Display conversions use 0.3048 metres per foot. NOAA preliminary status and measurement age are displayed. The latest endpoint is not served from a local saved-data fallback. If unavailable, the app says so; if a later refresh fails, it retains the prior reading with a refresh-failure message.

Daily astronomical predictions use `product=predictions&interval=6`. The observations comparison uses six-minute `water_level` records. Daily series may fall back to prior local-storage downloads, with a cache label. No interpolation bridges gaps longer than 12 minutes or extrapolates past a series. The displayed scene can be driven by actual station measurements, but its normalized water extent remains a conceptual illustration, not a hydrodynamic model.

The stored October 1, 2026 reference day contains 240 prediction samples, with request URL, datum, units, timestamps, and download metadata. It is explicitly archived, not presented as current.

## Photographs

Three original trail-sign photographs were supplied by the user. Their display WebP copies omit EXIF metadata. The app does not assert ownership of underlying sign artwork or photographs.

Species photographs were obtained from Wikimedia Commons through species-page image discovery and Commons image metadata. `src/data/bird-photos.json` records each displayed image's author, source file page, license, license URL, original URL, title, and supplied description. Credits and license links appear on cards, galleries, comparison views, and quizzes. The downloaded reference photographs retain their licenses (CC BY, CC BY-SA, or public domain). They are resized for display and shown with `object-fit: contain`; the underlying photo composition is preserved. A source image may already have been cropped by its contributor, as indicated on the source page.

The 44 displayed photos were visually reviewed in a contact sheet. Duplicate references and a Wood Stork egg-specimen image were excluded from the galleries. The 12 species are those listed on the user's photographed sign. Some galleries include juveniles, nests, or flight views. These photographs are not claimed to have been taken at Egans Creek.

Collection scripts preserve a reviewed gallery if it already exists. Metadata discovery alone is not sufficient validation of future additions: review the actual downloaded images and their source pages before changing the curated manifest.

## Scientific narrative

See `RESEARCH.md` and the in-app Sources & methods panel for geology, restoration, botany, and bird-life references. The geological sequence is a regional interpretation consistent with an older island core and younger coastal deposits. Precise contacts, ages of individual pictured beds, and a specific local accretion-wedge geometry remain unverified.

## Additional animals and sighting records

`public/data/animal-species-counts.json` preserves an iNaturalist species-count query from October 3, 2026. The search rectangle is 30.639–30.669° N, 81.447–81.432° W; it covers the Greenway corridor and adjacent neighborhoods, not a surveyed park polygon. Twenty non-bird species were selected for the guide from the first 100 taxa returned by observation count. Counts are research-grade reports in that search area, not populations, density estimates, a complete inventory, or guaranteed encounters.

Both *Anolis sagrei* and *Anolis carolinensis* occur in these records. The anole field-mark comparison and Florida native/introduced distinction are supported by UF/IFAS: https://ask.ifas.ufl.edu/publication/UW486. A Green Anole can turn brown; color alone is insufficient.

`src/data/animal-observations.json` contains a 26-record snapshot for the sightings map. Separate queries cover birds, reptiles, mammals, amphibians, fish, and invertebrates. The collector selects research-grade, non-captive observations with public, unobscured coordinates and stated positional accuracy of 100 m or better, retaining only CC0, CC BY, or CC BY-SA records. Each record retains its date, source URL, observer, coordinates, accuracy, and license. Amphibians and fish have no records passing these stricter saved-map filters in this snapshot, although the broader species-count query contains them. The app explicitly displays an empty state and links to the current area search. No absence claim follows from missing records.

The data are observations made on their stated dates, not current animal locations. The map is biased by access, observer interest, reporting effort, identification, licensing, and georeferencing. It is neither a habitat suitability model nor a systematic population survey. Authoritative current identification and license information remain available on each linked source record.

Additional animal reference photographs are recorded in `src/data/animals.json`, with source file pages, authors, licenses, and original URLs. Commons photographs were selected after reviewing initial discovery candidates; the reference images may depict animals far from Egans Creek. Galleries include different views and some life stages or color variants, as described by their captions.
