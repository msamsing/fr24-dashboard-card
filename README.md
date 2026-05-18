# FR24 Dashboard Card

A Home Assistant Lovelace dashboard card for FlightRadar24-style aircraft tracking sensors. It combines the current aircraft in your area, a configurable radar/map view, summary stats, and a recent activity list in one scalable card.

The card is designed for the FlightRadar24 Home Assistant integration, but it is intentionally tolerant of similar sensor attributes as long as the configured `current in area` sensor exposes a `flights`, `aircraft`, or `items` attribute.

## Features

- Compact current aircraft header with primary flight number and aircraft type, plus small Current, Entered, Exited, map radius, and optional current radius supporting text.
- Current aircraft overview with flight number, callsign, airline, route, aircraft type, altitude, speed, and distance.
- Single-row activity list of aircraft seen in the area during the last configurable number of hours, showing Danish military DTG, flight number, airline, route, and aircraft type.
- Local radar map using OpenStreetMap tiles and all aircraft coordinates from the configured FlightRadar24 current sensor.
- Optional embedded provider map using FlightRadar24, ADS-B Exchange, or a custom URL template.
- Optional map action buttons to open the provider map or account login page in a new tab.
- Collapsible sections for current aircraft, map, and activity.
- Scalable width and height for Home Assistant Sections layouts.
- Optional fixed card height and per-section scroll areas.
- Visual configuration editor in Home Assistant with field descriptions and a compact help section.
- Uses Home Assistant's configured location, a location entity, or fixed coordinates.
- Radar modes: NOR, MIL, and ATC with live aircraft-derived overlays.

## Recommended Repository Name

Use this GitHub repository name:

```text
fr24-dashboard-card
```

HACS expects a plugin repository to include a JavaScript file that matches the repository name. This repository contains `fr24-dashboard-card.js`, so `fr24-dashboard-card` is the cleanest name.

## Installation With HACS

1. Create a public GitHub repository named `fr24-dashboard-card`.
2. Push this repository to GitHub.
3. In Home Assistant, open HACS.
4. Open the menu and choose **Custom repositories**.
5. Add your repository URL, for example:

   ```text
   https://github.com/YOUR_GITHUB_USERNAME/fr24-dashboard-card
   ```

6. Select **Dashboard** as the category.
7. Install **FR24 Dashboard Card**.
8. Refresh your browser.

HACS usually manages the Lovelace resource automatically for dashboard plugins. If you need to add it manually, use:

```yaml
url: /hacsfiles/fr24-dashboard-card/fr24-dashboard-card.js
type: module
```

## Manual Installation

Copy `fr24-dashboard-card.js` to:

```text
/config/www/fr24-dashboard-card.js
```

Then add this Lovelace resource:

```yaml
url: /local/fr24-dashboard-card.js
type: module
```

## Basic Configuration

```yaml
type: custom:fr24-dashboard-card
entity: sensor.flightradar24_current_in_area
entered_entity: sensor.flightradar24_entered_area
exited_entity: sensor.flightradar24_exited_area
title: FlightRadar24
radius: 25
current_radius: 0
history_hours: 6
map_provider: fr24
```

## Position And Radius

By default, the card uses the Home Assistant instance location. You can also use a location entity:

```yaml
location_entity: person.example
radius: 25
current_radius: 5
```

Or fixed coordinates:

```yaml
latitude: 51.5007
longitude: -0.1246
radius: 25
current_radius: 5
```

`radius` controls the local map range and should normally match the radius configured in the FlightRadar24 integration. The local map plots every aircraft reported by the configured current sensor that includes coordinates. `current_radius` is optional; when set above `0`, the header and Current Aircraft section only show aircraft within that smaller radius. A value of `0` disables the extra current filter.

## Map Providers

The default map mode is the local radar map. It does not embed ADS-B Exchange or FlightRadar24, so it avoids provider-side iframe/API errors such as ADS-B Exchange `403` responses.

```yaml
map_render_mode: local
tile_url_template: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
```

If you still want to embed an external provider map:

```yaml
map_render_mode: external
```

FlightRadar24:

```yaml
map_provider: fr24
```

The map section can show action buttons for opening the external provider in a normal browser tab and signing in to the selected provider account. This is disabled by default because the local radar map does not need provider login:

```yaml
show_map_actions: false
```

The default login targets are:

- FlightRadar24: `https://www.flightradar24.com/premium/signin`
- ADS-B Exchange: `https://account.adsbexchange.com/`

To override the login target:

```yaml
map_login_url: "https://example.com/account/login"
```

ADS-B Exchange:

```yaml
map_provider: adsbx
```

Custom URL template:

```yaml
map_provider: custom
map_url_template: "https://example.com/map?lat={lat}&lon={lon}&radius={radius}&zoom={zoom}"
```

Available template variables:

- `{lat}`
- `{lon}`
- `{radius}`
- `{zoom}`

## Scaling And Sections

The card supports Home Assistant Sections layout sizing through `getGridOptions()`.

```yaml
grid_columns: 12
grid_rows: 0
```

Use `grid_columns` for the card width. Use `grid_rows` for the card height. A value of `0` means automatic height.

For a fixed-height card with internal scrolling:

```yaml
card_height: 720
section_max_height: 360
```

Sections can be opened and closed directly from the dashboard view by pressing the section header.

```yaml
default_open:
  - overview
  - map
  - activity
remember_sections: true
```

Available section IDs:

- `overview`
- `map`
- `activity`

## Display Options

```yaml
show_header: true
show_stats: true
show_map: true
show_map_actions: false
show_activity: true
show_aircraft_image: true
map_height: 420
radar_mode: nor
radar_map_lines: true
listen_events: true
map_line_tile_url_template: "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
compact: false
```

## Radar Modes

The existing layout can be switched from the dashboard itself using the **NOR**, **MIL**, and **ATC** controls in the card header.

The choice is stored in the browser's `localStorage`. You can also make the card start in a specific mode:

```yaml
radar_mode: atc
```

Available values are `nor`, `mil`, and `atc`. Existing configurations using `military_graphics: true` still start in `mil` mode for backward compatibility.

When the local radar map is used, MIL mode adds a radar-style overlay with a rotating green sweep, compact HUD readouts, and heading-aware plane symbols. ATC mode uses small target squares with track lines and labels showing flight number, speed in knots, and altitude in feet. Overlay readouts are derived from configured location, radius, and current aircraft data.

In MIL and ATC modes, the **MAP** toggle shows or hides a live line-map tile layer behind the radar scope. By default it uses a dark no-label basemap and renders it as monotone green linework. You can set the default state with:

```yaml
radar_map_lines: true
```

You can also use your own line-style tile source:

```yaml
map_line_tile_url_template: "https://example.com/tiles/{z}/{x}/{y}.png"
```

## Activity History

The card first tries to read the last 24 hours from Home Assistant Recorder through the frontend WebSocket API. It also keeps a 24-hour browser-side activity cache so recently seen aircraft can still appear when Recorder history is unavailable or does not include the needed attributes. The `history_hours` option only controls which cached entries are shown.

While the card is open, it also listens for FlightRadar24 entry, exit, landing, and takeoff events and stores those flights in the same local cache:

```yaml
history_hours: 12
max_activity_items: 20
history_source: recorder
listen_events: true
entered_entity: sensor.flightradar24_entered_area
exited_entity: sensor.flightradar24_exited_area
```

Local browser memory only:

```yaml
history_source: local
```

You can add more sensors that expose a `flights` attribute:

```yaml
activity_entities:
  - sensor.flightradar24_last_5_flights
  - sensor.flightradar24_additional_tracked
```

The FlightRadar24 integration exposes `flights` attributes on Current in area, Entered area, Exited area, and Additional tracked sensors. For consistent history across different browsers/devices, create a Home Assistant template sensor from the integration's `flightradar24_entry` or `flightradar24_exit` events and add it to `activity_entities`.

## Versioning

Releases use numeric semantic version tags, for example:

```text
v0.1.12
```

HACS uses GitHub release tag names as the remote version when releases are available, so releases should be installed by version number rather than commit hash.

## Privacy Notes

This card does not include any hardcoded personal location, account, or installation data. It reads the entities you configure in Home Assistant.

When `remember_sections` or activity tracking is enabled, the card stores small UI/activity state records in the browser's `localStorage`. This browser-side cache is shared between card instances in the same browser profile, but Home Assistant Recorder is needed for consistent history across different devices. The selected external map provider may receive map requests containing the configured latitude and longitude.

The card does not store third-party account credentials. Sign-in is handled by the selected provider in a separate browser tab. Whether the embedded iframe can use that signed-in session depends on the provider and the browser's third-party cookie policy.

## HACS Validation

This repository includes:

- `hacs.json`
- `.github/workflows/validate.yml`
- `fr24-dashboard-card.js` in the repository root

That matches the HACS Dashboard/Plugin custom repository structure.

## Development

Run a syntax check:

```bash
npm run check
```

Open the local demo:

```bash
python3 -m http.server 8123
```

Then visit:

```text
http://127.0.0.1:8123/demo.html
```

## License

MIT
