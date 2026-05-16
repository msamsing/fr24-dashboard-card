# Changelog

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
