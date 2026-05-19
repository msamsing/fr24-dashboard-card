# Changelog

## v0.1.13

- Add an always-visible local map data status line with card version, source entity, plotted/received aircraft count, and source update time.
- Make it easier to diagnose browser cache/version mismatches and missing aircraft coordinates across different clients.

## v0.1.12

- Add detailed UI descriptions to the Home Assistant visual editor schema.
- Add a compact Configuration help section with hover text for all card options.

## v0.1.11

- Listen for live FlightRadar24 entry/exit/area events and add them to the 24-hour activity cache while the card is open.
- Parse numeric values more tolerantly so coordinates, distance, speed, and altitude still work when Home Assistant provides formatted strings.
- Show plotted/received aircraft counts on the local map to make missing coordinates visible.

## v0.1.10

- Store and load a fixed 24-hour activity cache, while filtering the displayed list by `history_hours`.
- Load 24 hours from Home Assistant Recorder so dashboards can rebuild activity history more consistently.
- Add `current_radius` for filtering the Current Aircraft header/section separately from the map radius.
- Keep the local map based on all tracked aircraft reported by the configured current sensor.

## v0.1.9

- Add a Danish military-style DTG column to the activity log, based on each aircraft's last seen time.

## v0.1.8

- Add NOR, MIL, and ATC radar modes to the card header.
- Add a radar-scope overlay to the local map when MIL or ATC mode is active.
- Add animated green sweep, bearing labels, scanlines, and circular radar range rings.
- Fade the local map tiles into subtle green background lines in radar modes.
- Render aircraft as small heading-aware plane symbols in MIL mode.
- Add ATC target squares with live track lines, flight number, speed, and altitude labels.
- Add live radar HUD readouts and remove the local map attribution badge from the radar image.
- Add a MAP toggle for showing a live green line-map tile layer in MIL and ATC modes.

## v0.1.7

- Show the primary flight number and aircraft type in the header instead of the area count.
- Move Current, Entered, Exited, and Radius into a very small supporting text line under the location subtitle.
- Compact each activity entry to a single row with flight number, airline, route, and aircraft type.

## v0.1.6

- Add a dashboard toggle for Military graphics mode.
- Add an optional default setting for Military graphics in the visual editor.
- Restyle the card in Military graphics mode with OPS-room inspired colors, map treatment, and tactical markers.
- Make the Current, Entered, Exited, and Radius stats much smaller and less prominent.

## v0.1.5

- Make the local radar map fully independent of external provider URLs.
- Disable provider open/login action buttons by default.
- Keep external provider maps available only when `map_render_mode: external` is selected.

## v0.1.4

- Use a local radar map by default to avoid provider-side iframe/API errors such as ADS-B Exchange `403` responses.
- Add support for extra activity source sensors via `activity_entities`.
- Read activity from current, entered, and exited FlightRadar24 sensors.
- Make the current aircraft section more compact.
- Use numeric semantic version tags for HACS releases.

## v0.1.3

- Add provider open/login actions for embedded maps.

## v0.1.2

- Avoid unnecessary card re-renders that could reset dashboard scroll position.

## v0.1.1

- Fix config editor focus resets.

## v0.1.0

- Initial HACS-ready dashboard card.
