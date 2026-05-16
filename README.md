# FR24 Dashboard Card

A Home Assistant Lovelace dashboard card for FlightRadar24-style aircraft tracking sensors. It combines the current aircraft in your area, a configurable radar/map view, summary stats, and a recent activity list in one scalable card.

The card is designed for the FlightRadar24 Home Assistant integration, but it is intentionally tolerant of similar sensor attributes as long as the configured `current in area` sensor exposes a `flights`, `aircraft`, or `items` attribute.

## Features

- Current aircraft overview with flight number, callsign, airline, route, aircraft type, altitude, speed, and distance.
- Activity list of aircraft that have been seen in the area during the last configurable number of hours.
- Local radar map using OpenStreetMap tiles and aircraft coordinates from the Home Assistant sensor.
- Optional embedded provider map using FlightRadar24, ADS-B Exchange, or a custom URL template.
- Optional map action buttons to open the provider map or account login page in a new tab.
- Collapsible sections for current aircraft, map, and activity.
- Scalable width and height for Home Assistant Sections layouts.
- Optional fixed card height and per-section scroll areas.
- Visual configuration editor in Home Assistant.
- Uses Home Assistant's configured location, a location entity, or fixed coordinates.

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
history_hours: 6
map_provider: fr24
```

## Position And Radius

By default, the card uses the Home Assistant instance location. You can also use a location entity:

```yaml
location_entity: person.example
radius: 25
```

Or fixed coordinates:

```yaml
latitude: 51.5007
longitude: -0.1246
radius: 25
```

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
military_graphics: false
compact: false
```

## Military Graphics

The existing layout can be switched into an OPS-room inspired visual mode from the dashboard itself. Use the **Military graphics** button in the card header to toggle it on or off.

The choice is stored in the browser's `localStorage`. You can also make the card start in that mode:

```yaml
military_graphics: true
```

This is a visual treatment only. It does not change the data source, map provider, or aircraft tracking logic.

## Activity History

The card first tries to read Home Assistant Recorder history through the frontend WebSocket API. It also keeps a local browser-side activity cache so recently seen aircraft can still appear when Recorder history is unavailable or does not include the needed attributes.

```yaml
history_hours: 12
max_activity_items: 20
history_source: recorder
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

The FlightRadar24 integration exposes `flights` attributes on Current in area, Entered area, Exited area, and Additional tracked sensors. If you want a longer event-style history, create a Home Assistant template sensor from the integration's `flightradar24_entry` or `flightradar24_exit` events and add it to `activity_entities`.

## Versioning

Releases use numeric semantic version tags, for example:

```text
v0.1.6
```

HACS uses GitHub release tag names as the remote version when releases are available, so releases should be installed by version number rather than commit hash.

## Privacy Notes

This card does not include any hardcoded personal location, account, or installation data. It reads the entities you configure in Home Assistant.

When `remember_sections` or activity tracking is enabled, the card stores small UI/activity state records in the browser's `localStorage`. The selected external map provider may receive map requests containing the configured latitude and longitude.

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
