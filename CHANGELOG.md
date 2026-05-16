# Changelog

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
