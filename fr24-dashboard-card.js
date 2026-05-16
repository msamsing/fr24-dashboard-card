(() => {
  const CARD_VERSION = "0.1.9";
  const DEFAULTS = {
    title: "FlightRadar24",
    entity: "sensor.flightradar24_current_in_area",
    entered_entity: "sensor.flightradar24_entered_area",
    exited_entity: "sensor.flightradar24_exited_area",
    location_entity: "",
    radius: 25,
    history_hours: 6,
    max_activity_items: 12,
    map_render_mode: "local",
    map_provider: "fr24",
    map_login_url: "",
    tile_url_template: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    map_line_tile_url_template: "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
    map_height: 420,
    show_map_actions: false,
    card_height: 0,
    section_max_height: 0,
    grid_columns: 12,
    grid_rows: 0,
    show_header: true,
    show_stats: true,
    show_map: true,
    show_activity: true,
    show_aircraft_image: true,
    default_open: ["overview", "map", "activity"],
    remember_sections: true,
    history_source: "recorder",
    activity_entities: [],
    radar_mode: "nor",
    radar_map_lines: true,
    military_graphics: false,
    compact: false,
  };

  const RADAR_MODES = ["nor", "mil", "atc"];
  const RADAR_MODE_LABELS = {
    nor: "NOR",
    mil: "MIL",
    atc: "ATC",
  };
  const DANISH_DTG_MONTHS = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAJ",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OKT",
    "NOV",
    "DEC",
  ];

  const MAP_PROVIDERS = {
    fr24: {
      label: "FlightRadar24",
      loginUrl: "https://www.flightradar24.com/premium/signin",
      makeUrl: ({ lat, lon, zoom }) =>
        `https://www.flightradar24.com/${fixed(lat)},${fixed(lon)}/${zoom}`,
    },
    adsbx: {
      label: "ADS-B Exchange",
      loginUrl: "https://account.adsbexchange.com/",
      makeUrl: ({ lat, lon, zoom }) =>
        `https://globe.adsbexchange.com/?lat=${fixed(lat)}&lon=${fixed(lon)}&zoom=${zoom}`,
    },
    custom: {
      label: "Custom URL",
      loginUrl: "",
      makeUrl: ({ lat, lon, radius, zoom, template }) =>
        template
          ? template
              .replaceAll("{lat}", fixed(lat))
              .replaceAll("{lon}", fixed(lon))
              .replaceAll("{radius}", String(radius))
              .replaceAll("{zoom}", String(zoom))
          : "",
    },
  };

  const FIELD_ALIASES = {
    id: ["id", "flight_id", "fr24_id", "hex", "icao", "icao_24bit", "aircraft_hex"],
    flight: ["flight_number", "flight", "number", "callsign", "ident", "callsign_icao"],
    callsign: ["callsign", "ident", "flight"],
    airline: ["airline_short", "airline_name", "airline", "operator", "owner"],
    aircraft: ["aircraft_model", "aircraft_type", "aircraft_code", "type", "model"],
    registration: ["aircraft_registration", "registration", "reg"],
    origin: [
      "origin_airport_iata",
      "origin_airport_icao",
      "origin_airport_name",
      "origin_city",
      "airport_origin_city",
      "airport_origin_name",
      "airport_origin_code_iata",
      "airport_origin_code_icao",
      "airport_origin",
      "from",
    ],
    destination: [
      "destination_airport_iata",
      "destination_airport_icao",
      "destination_airport_name",
      "destination_city",
      "airport_destination_city",
      "airport_destination_name",
      "airport_destination_code_iata",
      "airport_destination_code_icao",
      "airport_destination",
      "to",
    ],
    altitude: ["altitude", "altitude_ft", "alt", "alt_baro"],
    speed: ["ground_speed", "speed", "groundspeed", "gs"],
    distance: ["distance_to_tracker", "distance", "distance_km", "range"],
    heading: ["heading", "track", "bearing"],
    latitude: ["latitude", "lat"],
    longitude: ["longitude", "lon", "lng"],
    image: [
      "aircraft_photo",
      "aircraft_photo_small",
      "aircraft_image",
      "image",
      "thumbnail",
      "photo_url",
    ],
    status: ["status", "tracked_type"],
  };

  const EDITOR_SCHEMA = [
    {
      name: "entity",
      required: true,
      selector: { entity: { domain: "sensor" } },
    },
    {
      name: "entered_entity",
      selector: { entity: { domain: "sensor" } },
    },
    {
      name: "exited_entity",
      selector: { entity: { domain: "sensor" } },
    },
    {
      name: "title",
      selector: { text: {} },
    },
    {
      name: "location_entity",
      selector: { entity: { domain: ["device_tracker", "person", "zone"] } },
    },
    {
      name: "latitude",
      selector: { number: { mode: "box", step: 0.000001 } },
    },
    {
      name: "longitude",
      selector: { number: { mode: "box", step: 0.000001 } },
    },
    {
      name: "radius",
      selector: { number: { min: 1, max: 500, mode: "box", unit_of_measurement: "km" } },
    },
    {
      name: "history_hours",
      selector: { number: { min: 1, max: 168, mode: "box", unit_of_measurement: "h" } },
    },
    {
      name: "max_activity_items",
      selector: { number: { min: 1, max: 50, mode: "box" } },
    },
    {
      name: "map_render_mode",
      selector: {
        select: {
          options: [
            { value: "local", label: "Local radar map" },
            { value: "external", label: "Embedded provider map" },
          ],
        },
      },
    },
    {
      name: "map_provider",
      selector: {
        select: {
          options: [
            { value: "fr24", label: "FlightRadar24" },
            { value: "adsbx", label: "ADS-B Exchange" },
            { value: "custom", label: "Custom URL" },
          ],
        },
      },
    },
    {
      name: "map_url_template",
      selector: { text: {} },
    },
    {
      name: "tile_url_template",
      selector: { text: {} },
    },
    {
      name: "map_line_tile_url_template",
      selector: { text: {} },
    },
    {
      name: "map_login_url",
      selector: { text: {} },
    },
    {
      name: "map_height",
      selector: { number: { min: 220, max: 900, mode: "box", unit_of_measurement: "px" } },
    },
    {
      name: "card_height",
      selector: { number: { min: 0, max: 1400, mode: "box", unit_of_measurement: "px" } },
    },
    {
      name: "section_max_height",
      selector: { number: { min: 0, max: 900, mode: "box", unit_of_measurement: "px" } },
    },
    {
      name: "grid_columns",
      selector: { number: { min: 4, max: 12, mode: "box" } },
    },
    {
      name: "grid_rows",
      selector: { number: { min: 0, max: 40, mode: "box" } },
    },
    {
      name: "default_open",
      selector: {
        select: {
          multiple: true,
          options: [
            { value: "overview", label: "Current aircraft" },
            { value: "map", label: "Radar" },
            { value: "activity", label: "Activity" },
          ],
        },
      },
    },
    {
      name: "history_source",
      selector: {
        select: {
          options: [
            { value: "recorder", label: "Recorder + local memory" },
            { value: "local", label: "Local memory only" },
          ],
        },
      },
    },
    {
      name: "activity_entities",
      selector: { entity: { multiple: true, domain: "sensor" } },
    },
    {
      name: "radar_mode",
      selector: {
        select: {
          options: [
            { value: "nor", label: "NOR" },
            { value: "mil", label: "MIL" },
            { value: "atc", label: "ATC" },
          ],
        },
      },
    },
    {
      name: "radar_map_lines",
      selector: { boolean: {} },
    },
    {
      name: "show_header",
      selector: { boolean: {} },
    },
    {
      name: "show_stats",
      selector: { boolean: {} },
    },
    {
      name: "show_map",
      selector: { boolean: {} },
    },
    {
      name: "show_map_actions",
      selector: { boolean: {} },
    },
    {
      name: "show_activity",
      selector: { boolean: {} },
    },
    {
      name: "show_aircraft_image",
      selector: { boolean: {} },
    },
    {
      name: "remember_sections",
      selector: { boolean: {} },
    },
    {
      name: "compact",
      selector: { boolean: {} },
    },
  ];

  const EDITOR_LABELS = {
    entity: "Sensor: Current in area",
    entered_entity: "Sensor: Entered area",
    exited_entity: "Sensor: Exited area",
    title: "Title",
    location_entity: "Location entity",
    latitude: "Fixed latitude",
    longitude: "Fixed longitude",
    radius: "Radius",
    history_hours: "Activity window",
    max_activity_items: "Maximum activity items",
    map_render_mode: "Map render mode",
    map_provider: "External map provider",
    map_url_template: "Custom map URL",
    tile_url_template: "Map tile URL template",
    map_line_tile_url_template: "Map line tile URL template",
    map_login_url: "Custom login URL",
    map_height: "Map height",
    card_height: "Total card height (0 = auto)",
    section_max_height: "Maximum section height (0 = auto)",
    grid_columns: "Sections layout width",
    grid_rows: "Sections layout height (0 = auto)",
    default_open: "Sections open by default",
    history_source: "Activity source",
    activity_entities: "Additional activity sensors",
    radar_mode: "Default radar mode",
    radar_map_lines: "Show map line layer in MIL/ATC",
    show_header: "Show header",
    show_stats: "Show stats",
    show_map: "Show map",
    show_map_actions: "Show map open/login actions",
    show_activity: "Show activity list",
    show_aircraft_image: "Show aircraft image",
    remember_sections: "Remember opened/closed sections",
    compact: "Compact layout",
  };

  function fixed(value) {
    return Number(value || 0).toFixed(5);
  }

  function normalizeConfig(config) {
    return {
      ...DEFAULTS,
      ...config,
      radius: numberOrDefault(config.radius, DEFAULTS.radius),
      history_hours: numberOrDefault(config.history_hours, DEFAULTS.history_hours),
      max_activity_items: numberOrDefault(config.max_activity_items, DEFAULTS.max_activity_items),
      map_height: numberOrDefault(config.map_height, DEFAULTS.map_height),
      card_height: numberOrDefault(config.card_height, DEFAULTS.card_height),
      section_max_height: numberOrDefault(
        config.section_max_height,
        DEFAULTS.section_max_height,
      ),
      grid_columns: clamp(numberOrDefault(config.grid_columns, DEFAULTS.grid_columns), 4, 12),
      grid_rows: clamp(numberOrDefault(config.grid_rows, DEFAULTS.grid_rows), 0, 40),
      default_open: Array.isArray(config.default_open)
        ? config.default_open
        : DEFAULTS.default_open,
      activity_entities: Array.isArray(config.activity_entities)
        ? config.activity_entities.filter(Boolean)
        : DEFAULTS.activity_entities,
      radar_mode: normalizeRadarMode(config.radar_mode, config.military_graphics),
      radar_map_lines:
        config.radar_map_lines === undefined
          ? DEFAULTS.radar_map_lines
          : Boolean(config.radar_map_lines),
    };
  }

  function normalizeRadarMode(value, legacyMilitary = false) {
    const mode = String(value || "").toLowerCase();
    if (RADAR_MODES.includes(mode)) return mode;
    return legacyMilitary ? "mil" : DEFAULTS.radar_mode;
  }

  function numberOrDefault(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hasValue(value) {
    return (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "unknown" &&
      value !== "unavailable"
    );
  }

  function firstValue(source, aliases) {
    if (!source) return undefined;
    for (const alias of aliases) {
      const value = source[alias];
      if (hasValue(value)) return value;
    }
    return undefined;
  }

  function formatNumber(value, maximumFractionDigits = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value || "-";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(number);
  }

  function formatDanishMilitaryDtg(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Copenhagen",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value || "";
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    const month = Number(get("month"));
    const year = get("year");
    const localYear = Number(`20${year}`);
    const localUtcTime = Date.UTC(localYear, month - 1, Number(day), Number(hour), Number(minute));
    const offsetHours = Math.round((localUtcTime - date.getTime()) / 3600000);
    const zoneLetter = offsetHours >= 2 ? "B" : "A";
    const monthLabel = DANISH_DTG_MONTHS[month - 1] || "---";

    return `${day}${hour}${minute}${zoneLetter} ${monthLabel} ${year}`;
  }

  function radiusToZoom(radius) {
    if (radius <= 5) return 12;
    if (radius <= 10) return 11;
    if (radius <= 25) return 10;
    if (radius <= 50) return 9;
    if (radius <= 100) return 8;
    if (radius <= 200) return 7;
    return 6;
  }

  function latLonToTile(lat, lon, zoom) {
    const latitude = clamp(Number(lat), -85.05112878, 85.05112878);
    const longitude = Number(lon);
    const latRad = (latitude * Math.PI) / 180;
    const scale = 2 ** zoom;
    return {
      x: ((longitude + 180) / 360) * scale,
      y:
        ((1 -
          Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
          2) *
        scale,
    };
  }

  function wrapTileX(x, zoom) {
    const scale = 2 ** zoom;
    return ((x % scale) + scale) % scale;
  }

  function clampTileY(y, zoom) {
    const max = 2 ** zoom - 1;
    return clamp(y, 0, max);
  }

  function tileUrl(template, x, y, z) {
    return template
      .replaceAll("{x}", String(x))
      .replaceAll("{y}", String(y))
      .replaceAll("{z}", String(z));
  }

  function metersPerPixel(lat, zoom) {
    return (156543.03392 * Math.cos((Number(lat) * Math.PI) / 180)) / 2 ** zoom;
  }

  function asArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return Object.values(value);
    return [];
  }

  function parseMaybeJson(value) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed || !["[", "{"].includes(trimmed[0])) return value;
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  function looksLikeFlightObject(value) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Boolean(
        firstValue(value, FIELD_ALIASES.flight) ||
          firstValue(value, FIELD_ALIASES.airline) ||
          firstValue(value, FIELD_ALIASES.aircraft) ||
          firstValue(value, FIELD_ALIASES.registration) ||
          (hasValue(firstValue(value, FIELD_ALIASES.latitude)) &&
            hasValue(firstValue(value, FIELD_ALIASES.longitude))),
      )
    );
  }

  function asFlightList(value) {
    const parsed = parseMaybeJson(value);
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (looksLikeFlightObject(parsed)) return [parsed];
    if (typeof parsed === "object") {
      return Object.values(parsed).flatMap((item) => asFlightList(item));
    }
    return [];
  }

  function flattenHistoryResponse(response) {
    if (!response) return [];
    if (Array.isArray(response)) {
      if (Array.isArray(response[0])) return response.flat();
      return response;
    }
    if (typeof response === "object") {
      return Object.values(response).flatMap((value) => flattenHistoryResponse(value));
    }
    return [];
  }

  function getFlightKey(flight) {
    return (
      firstValue(flight, FIELD_ALIASES.id) ||
      firstValue(flight, FIELD_ALIASES.registration) ||
      firstValue(flight, FIELD_ALIASES.flight) ||
      JSON.stringify([
        firstValue(flight, FIELD_ALIASES.airline),
        firstValue(flight, FIELD_ALIASES.aircraft),
        firstValue(flight, FIELD_ALIASES.origin),
        firstValue(flight, FIELD_ALIASES.destination),
      ])
    );
  }

  function normalizeFlight(rawFlight, seenAt = Date.now()) {
    const flight = rawFlight || {};
    const flightNumber = firstValue(flight, FIELD_ALIASES.flight);
    const callsign = firstValue(flight, FIELD_ALIASES.callsign);
    const airline = firstValue(flight, FIELD_ALIASES.airline);
    const aircraft = firstValue(flight, FIELD_ALIASES.aircraft);
    const registration = firstValue(flight, FIELD_ALIASES.registration);
    const origin = firstValue(flight, FIELD_ALIASES.origin);
    const destination = firstValue(flight, FIELD_ALIASES.destination);
    const altitude = firstValue(flight, FIELD_ALIASES.altitude);
    const speed = firstValue(flight, FIELD_ALIASES.speed);
    const distance = firstValue(flight, FIELD_ALIASES.distance);
    const heading = firstValue(flight, FIELD_ALIASES.heading);
    const latitude = firstValue(flight, FIELD_ALIASES.latitude);
    const longitude = firstValue(flight, FIELD_ALIASES.longitude);
    const image = firstValue(flight, FIELD_ALIASES.image);
    const status = firstValue(flight, FIELD_ALIASES.status);

    return {
      key: getFlightKey(flight),
      flightNumber: flightNumber || callsign || "Unknown",
      callsign,
      airline: airline || "Unknown airline",
      aircraft: aircraft || "Unknown aircraft type",
      registration,
      origin,
      destination,
      altitude,
      speed,
      distance,
      heading,
      latitude,
      longitude,
      image,
      status,
      raw: flight,
      firstSeen: seenAt,
      lastSeen: seenAt,
    };
  }

  function mergeActivity(existing, flight) {
    const merged = { ...existing, ...flight };
    merged.firstSeen = Math.min(existing?.firstSeen || flight.firstSeen, flight.firstSeen);
    merged.lastSeen = Math.max(existing?.lastSeen || flight.lastSeen, flight.lastSeen);
    return merged;
  }

  function buildLocalStorageKey(entity) {
    return `fr24-dashboard-card:${entity || "default"}`;
  }

  class Fr24DashboardCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = normalizeConfig({});
      this._hass = null;
      this._activity = new Map();
      this._historyRequestKey = "";
      this._historyLoading = false;
      this._historyError = "";
      this._sections = new Map();
      this._sectionStorageKey = "";
      this._radarModeStorageKey = "";
      this._radarMapLinesStorageKey = "";
      this._radarMode = DEFAULTS.radar_mode;
      this._radarMapLines = DEFAULTS.radar_map_lines;
      this._lastEntityStateFingerprint = "";
      this._lastRenderFingerprint = "";
      this._hasRendered = false;
    }

    static getConfigElement() {
      return document.createElement("fr24-dashboard-card-editor");
    }

    static getStubConfig(hass) {
      const currentEntity = hass
        ? Object.keys(hass.states).find(
            (entityId) =>
              entityId.includes("flightradar24") && entityId.includes("current_in_area"),
          )
        : "";
      return {
        type: "custom:fr24-dashboard-card",
        entity: currentEntity || DEFAULTS.entity,
        title: DEFAULTS.title,
        radius: DEFAULTS.radius,
        history_hours: DEFAULTS.history_hours,
        map_provider: DEFAULTS.map_provider,
        show_map: true,
        show_activity: true,
      };
    }

    setConfig(config) {
      if (!config) throw new Error("Configuration is missing");
      this._config = normalizeConfig(config);
      this._sectionStorageKey = this._getSectionStorageKey();
      this._radarModeStorageKey = this._getRadarModeStorageKey();
      this._radarMapLinesStorageKey = this._getRadarMapLinesStorageKey();
      this._sections = this._buildInitialSections();
      this._radarMode = this._loadRadarModeState();
      this._radarMapLines = this._loadRadarMapLinesState();
      this._loadLocalActivity();
      this._render(true);
    }

    set hass(hass) {
      this._hass = hass;
      const activityChanged = this._syncActivitySources();
      this._loadRecorderHistory();
      this._render(activityChanged);
    }

    getCardSize() {
      let size = 4;
      if (this._config.show_map) size += Math.ceil(this._config.map_height / 50);
      if (this._config.show_activity) size += 3;
      return size;
    }

    getGridOptions() {
      const mapRows = this._config.show_map ? Math.ceil(this._config.map_height / 56) + 1 : 0;
      const headerRows = this._config.show_header ? 3 : 0;
      const statsRows = this._config.show_stats ? 2 : 0;
      const activityRows = this._config.show_activity ? 4 : 0;
      const autoRows = Math.max(6, headerRows + statsRows + mapRows + activityRows + 4);
      const rows = this._config.grid_rows > 0 ? this._config.grid_rows : autoRows;

      return {
        columns: this._config.grid_columns,
        min_columns: Math.min(6, this._config.grid_columns),
        rows,
        min_rows: 6,
      };
    }

    _syncActivitySources() {
      const sources = this._getActivitySourceEntityIds()
        .map((entityId) => [entityId, this._getEntity(entityId)])
        .filter(([, entity]) => entity);
      if (!sources.length) return false;

      const fingerprint = JSON.stringify(
        sources.map(([entityId, entity]) => ({
          entityId,
          state: entity.state,
          changed: entity.last_changed,
          updated: entity.last_updated,
          flights: this._getFlightsFromEntity(entity).map((flight) => this._rawFlightFingerprint(flight)),
        })),
      );
      if (fingerprint === this._lastEntityStateFingerprint) return false;
      this._lastEntityStateFingerprint = fingerprint;

      const seenAt = Date.now();
      for (const [, entity] of sources) {
        for (const flight of this._getFlightsFromEntity(entity)) {
          const normalized = normalizeFlight(flight, seenAt);
          this._activity.set(
            normalized.key,
            mergeActivity(this._activity.get(normalized.key), normalized),
          );
        }
      }
      this._pruneActivity();
      this._saveLocalActivity();
      return true;
    }

    _rawFlightFingerprint(flight) {
      const normalized = normalizeFlight(flight, 0);
      return this._flightRenderData(normalized);
    }

    async _loadRecorderHistory() {
      if (this._config.history_source !== "recorder") return;
      if (!this._hass?.callWS || !this._config.entity || this._historyLoading) return;

      const entityIds = this._getActivitySourceEntityIds();
      const key = `${entityIds.join(",")}:${this._config.history_hours}`;
      if (key === this._historyRequestKey) return;

      this._historyRequestKey = key;
      this._historyLoading = true;
      this._historyError = "";

      try {
        const end = new Date();
        const start = new Date(Date.now() - this._config.history_hours * 3600000);
        const response = await this._hass.callWS({
          type: "history/history_during_period",
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          entity_ids: entityIds,
          minimal_response: false,
          no_attributes: false,
        });

        for (const state of flattenHistoryResponse(response)) {
          const seenAt = new Date(
            state.last_changed || state.last_updated || state.lu || state.lc || Date.now(),
          ).getTime();
          const flights = this._getFlightsFromState(state);
          for (const flight of flights) {
            const normalized = normalizeFlight(flight, seenAt);
            this._activity.set(
              normalized.key,
              mergeActivity(this._activity.get(normalized.key), normalized),
            );
          }
        }
        this._pruneActivity();
        this._saveLocalActivity();
      } catch (error) {
        this._historyError = error?.message || "Recorder history could not be loaded";
      } finally {
        this._historyLoading = false;
        this._render(true);
      }
    }

    _getEntity(entityId) {
      return entityId && this._hass?.states ? this._hass.states[entityId] : undefined;
    }

    _getActivitySourceEntityIds() {
      return [
        this._config.entity,
        this._config.entered_entity,
        this._config.exited_entity,
        ...this._config.activity_entities,
      ].filter((entityId, index, entityIds) => entityId && entityIds.indexOf(entityId) === index);
    }

    _getFlightsFromEntity(entity) {
      return this._getFlightsFromState(entity);
    }

    _getFlightsFromState(state) {
      const attributes = state?.attributes || state?.a || {};
      return [
        attributes.flights,
        attributes.aircraft,
        attributes.items,
        attributes.flight,
        attributes.last_flight,
        attributes.latest_flight,
      ].flatMap((candidate) => asFlightList(candidate));
    }

    _getLocation() {
      const fromConfig =
        Number.isFinite(Number(this._config.latitude)) &&
        Number.isFinite(Number(this._config.longitude))
          ? {
              lat: Number(this._config.latitude),
              lon: Number(this._config.longitude),
              label: "Fixed position",
            }
          : null;

      const tracker = this._getEntity(this._config.location_entity);
      const trackerLat = tracker
        ? firstValue(tracker.attributes || {}, ["latitude", "lat"])
        : undefined;
      const trackerLon = tracker
        ? firstValue(tracker.attributes || {}, ["longitude", "lon", "lng"])
        : undefined;

      if (hasValue(trackerLat) && hasValue(trackerLon)) {
        return {
          lat: Number(trackerLat),
          lon: Number(trackerLon),
          label: tracker.attributes?.friendly_name || this._config.location_entity,
        };
      }

      if (fromConfig) return fromConfig;

      return {
        lat: Number(this._hass?.config?.latitude || 0),
        lon: Number(this._hass?.config?.longitude || 0),
        label: "Home Assistant",
      };
    }

    _getCurrentFlights() {
      const entity = this._getEntity(this._config.entity);
      return this._getFlightsFromEntity(entity).map((flight) => normalizeFlight(flight));
    }

    _getActivityFlights() {
      const cutoff = Date.now() - this._config.history_hours * 3600000;
      return [...this._activity.values()]
        .filter((entry) => entry.lastSeen >= cutoff || entry.firstSeen >= cutoff)
        .sort((a, b) => b.lastSeen - a.lastSeen)
        .slice(0, this._config.max_activity_items);
    }

    _pruneActivity() {
      const cutoff = Date.now() - Math.max(this._config.history_hours, 24) * 3600000;
      for (const [key, entry] of this._activity.entries()) {
        if (entry.lastSeen < cutoff) this._activity.delete(key);
      }
    }

    _loadLocalActivity() {
      this._activity.clear();
      try {
        const raw = localStorage.getItem(buildLocalStorageKey(this._config.entity));
        const entries = raw ? JSON.parse(raw) : [];
        for (const entry of entries) {
          if (entry?.key) this._activity.set(entry.key, entry);
        }
      } catch {
        this._activity.clear();
      }
    }

    _saveLocalActivity() {
      try {
        localStorage.setItem(
          buildLocalStorageKey(this._config.entity),
          JSON.stringify([...this._activity.values()].slice(0, 200)),
        );
      } catch {
        // localStorage can be disabled in some kiosk browsers.
      }
    }

    _buildInitialSections() {
      const persisted = this._config.remember_sections ? this._loadSectionState() : {};
      return new Map(
        ["overview", "map", "activity"].map((section) => [
          section,
          typeof persisted[section] === "boolean"
            ? persisted[section]
            : this._config.default_open.includes(section),
        ]),
      );
    }

    _getSectionStorageKey() {
      return `fr24-dashboard-card:sections:${this._config.entity}:${this._config.title}`;
    }

    _getRadarModeStorageKey() {
      return `fr24-dashboard-card:radar-mode:${this._config.entity}:${this._config.title}`;
    }

    _getRadarMapLinesStorageKey() {
      return `fr24-dashboard-card:radar-map-lines:${this._config.entity}:${this._config.title}`;
    }

    _getLegacyMilitaryStorageKey() {
      return `fr24-dashboard-card:military:${this._config.entity}:${this._config.title}`;
    }

    _loadSectionState() {
      try {
        return JSON.parse(localStorage.getItem(this._sectionStorageKey) || "{}");
      } catch {
        return {};
      }
    }

    _saveSectionState() {
      if (!this._config.remember_sections) return;
      try {
        localStorage.setItem(
          this._sectionStorageKey,
          JSON.stringify(Object.fromEntries(this._sections.entries())),
        );
      } catch {
        // localStorage can be disabled in some kiosk browsers.
      }
    }

    _loadRadarModeState() {
      try {
        const stored = localStorage.getItem(this._radarModeStorageKey);
        if (RADAR_MODES.includes(stored)) return stored;

        const legacy = localStorage.getItem(this._getLegacyMilitaryStorageKey());
        if (legacy === "true") return "mil";
        if (legacy === "false") return "nor";
      } catch {
        // localStorage can be disabled in some kiosk browsers.
      }
      return this._config.radar_mode;
    }

    _saveRadarModeState() {
      try {
        localStorage.setItem(this._radarModeStorageKey, this._radarMode);
      } catch {
        // localStorage can be disabled in some kiosk browsers.
      }
    }

    _loadRadarMapLinesState() {
      try {
        const stored = localStorage.getItem(this._radarMapLinesStorageKey);
        if (stored === "true") return true;
        if (stored === "false") return false;
      } catch {
        // localStorage can be disabled in some kiosk browsers.
      }
      return this._config.radar_map_lines;
    }

    _saveRadarMapLinesState() {
      try {
        localStorage.setItem(this._radarMapLinesStorageKey, String(this._radarMapLines));
      } catch {
        // localStorage can be disabled in some kiosk browsers.
      }
    }

    _setRadarMode(mode) {
      const nextMode = normalizeRadarMode(mode);
      if (nextMode === this._radarMode) return;
      this._radarMode = nextMode;
      this._saveRadarModeState();
      this._render(true);
    }

    _toggleRadarMapLines() {
      this._radarMapLines = !this._radarMapLines;
      this._saveRadarMapLinesState();
      this._render(true);
    }

    _toggleSection(section) {
      this._sections.set(section, !this._isOpen(section));
      this._saveSectionState();
      this._render(true);
    }

    _isOpen(section) {
      if (!this._sections.has(section)) return this._config.default_open.includes(section);
      return this._sections.get(section);
    }

    _render(force = false) {
      if (!this.shadowRoot || !this._config) return;

      const currentFlights = this._getCurrentFlights();
      const mainFlight = currentFlights
        .slice()
        .sort((a, b) => Number(a.distance || Infinity) - Number(b.distance || Infinity))[0];
      const activityFlights = this._getActivityFlights();
      const entity = this._getEntity(this._config.entity);
      const enteredEntity = this._getEntity(this._config.entered_entity);
      const exitedEntity = this._getEntity(this._config.exited_entity);
      const location = this._getLocation();
      const mapUrl = this._buildMapUrl(location);
      const currentCount = Number(entity?.state);
      const countLabel = Number.isFinite(currentCount) ? currentCount : currentFlights.length;
      const compactClass = this._config.compact ? " compact" : "";
      const modeClass =
        this._radarMode === "mil" ? " military mil" : this._radarMode === "atc" ? " atc" : "";
      const mapLinesClass = this._radarMapLines ? "" : " map-lines-off";
      const renderFingerprint = this._buildRenderFingerprint({
        currentFlights,
        activityFlights,
        enteredEntity,
        exitedEntity,
        location,
        mapUrl,
        countLabel,
      });

      if (!force && this._hasRendered && renderFingerprint === this._lastRenderFingerprint) {
        return;
      }

      this._lastRenderFingerprint = renderFingerprint;
      this._hasRendered = true;
      const scrollState = this._captureScrollState();

      this.shadowRoot.innerHTML = `
        <style>${this._styles()}</style>
        <ha-card class="fr24-card${compactClass}${modeClass}${mapLinesClass}" style="${this._renderCardStyle()}">
          ${
            this._config.show_header
              ? this._renderHeader(mainFlight, countLabel, location, enteredEntity, exitedEntity)
              : ""
          }
          ${
            !this._config.show_header && this._config.show_stats
              ? this._renderStats(countLabel, enteredEntity, exitedEntity)
              : ""
          }
          ${this._renderSection(
            "overview",
            "Current Aircraft",
            "mdi:airplane-clock",
            this._renderOverview(mainFlight, currentFlights),
          )}
          ${
            this._config.show_map
              ? this._renderSection(
                  "map",
                  "Radar",
                  "mdi:radar",
                  this._renderMap(mapUrl, location, currentFlights),
                )
              : ""
          }
          ${
            this._config.show_activity
              ? this._renderSection(
                  "activity",
                  `Activity - ${this._config.history_hours} hours`,
                  "mdi:format-list-bulleted",
                  this._renderActivity(activityFlights),
                )
              : ""
          }
        </ha-card>
      `;

      for (const button of this.shadowRoot.querySelectorAll("[data-section]")) {
        button.addEventListener("click", () => this._toggleSection(button.dataset.section));
      }
      for (const button of this.shadowRoot.querySelectorAll("[data-radar-mode]")) {
        button.addEventListener("click", () => this._setRadarMode(button.dataset.radarMode));
      }
      this.shadowRoot
        .querySelector("[data-map-lines-toggle]")
        ?.addEventListener("click", () => this._toggleRadarMapLines());
      this._restoreScrollState(scrollState);
    }

    _buildRenderFingerprint(model) {
      return JSON.stringify({
        config: {
          title: this._config.title,
          radius: this._config.radius,
          map_provider: this._config.map_provider,
          map_render_mode: this._config.map_render_mode,
          map_url_template: this._config.map_url_template,
          map_login_url: this._config.map_login_url,
          tile_url_template: this._config.tile_url_template,
          map_height: this._config.map_height,
          card_height: this._config.card_height,
          section_max_height: this._config.section_max_height,
          compact: this._config.compact,
          radar_map_lines: this._radarMapLines,
          show_header: this._config.show_header,
          show_stats: this._config.show_stats,
          show_map: this._config.show_map,
          show_map_actions: this._config.show_map_actions,
          show_activity: this._config.show_activity,
          show_aircraft_image: this._config.show_aircraft_image,
          radar_mode: this._radarMode,
        },
        countLabel: model.countLabel,
        entered: model.enteredEntity?.state,
        exited: model.exitedEntity?.state,
        location: model.location,
        mapUrl: model.mapUrl,
        sections: Object.fromEntries(this._sections.entries()),
        historyLoading: this._historyLoading,
        historyError: this._historyError,
        currentFlights: model.currentFlights.map((flight) => this._flightRenderData(flight)),
        activityFlights: model.activityFlights.map((flight) => ({
          ...this._flightRenderData(flight),
          firstSeen: flight.firstSeen,
          lastSeen: flight.lastSeen,
        })),
      });
    }

    _flightRenderData(flight) {
      return {
        key: flight.key,
        flightNumber: flight.flightNumber,
        callsign: flight.callsign,
        airline: flight.airline,
        aircraft: flight.aircraft,
        registration: flight.registration,
        origin: flight.origin,
        destination: flight.destination,
        altitude: flight.altitude,
        speed: flight.speed,
        distance: flight.distance,
        latitude: flight.latitude,
        longitude: flight.longitude,
        heading: flight.heading,
        status: flight.status,
        image: flight.image,
      };
    }

    _captureScrollState() {
      const scroller = this._findScrollParent();
      if (!scroller) return null;
      return {
        scroller,
        top: scroller.scrollTop,
        left: scroller.scrollLeft,
      };
    }

    _restoreScrollState(scrollState) {
      if (!scrollState?.scroller) return;
      const restore = () => {
        if (
          scrollState.scroller === document.scrollingElement ||
          scrollState.scroller.isConnected
        ) {
          scrollState.scroller.scrollTop = scrollState.top;
          scrollState.scroller.scrollLeft = scrollState.left;
        }
      };

      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(restore);
      } else {
        setTimeout(restore, 0);
      }
    }

    _findScrollParent() {
      let node = this;
      while (node) {
        if (node instanceof HTMLElement) {
          const style = getComputedStyle(node);
          const canScroll = /(auto|scroll|overlay)/.test(style.overflowY);
          if (canScroll && node.scrollHeight > node.clientHeight) return node;
        }
        node = this._getComposedParent(node);
      }

      return document.scrollingElement || document.documentElement;
    }

    _getComposedParent(node) {
      if (node.parentNode) return node.parentNode;
      const root = node.getRootNode?.();
      return root?.host || null;
    }

    _buildMapUrl(location) {
      const provider = this._getMapProvider();
      return provider.makeUrl({
        lat: location.lat,
        lon: location.lon,
        radius: this._config.radius,
        zoom: radiusToZoom(this._config.radius),
        template: this._config.map_url_template,
      });
    }

    _getMapProvider() {
      return MAP_PROVIDERS[this._config.map_provider] || MAP_PROVIDERS.fr24;
    }

    _getMapLoginUrl() {
      return this._config.map_login_url || this._getMapProvider().loginUrl || "";
    }

    _renderCardStyle() {
      const styles = [
        `--fr24-grid-columns: ${this._config.grid_columns}`,
        `--fr24-map-height: ${this._config.map_height}px`,
      ];

      if (this._config.card_height > 0) {
        styles.push(`--fr24-card-height: ${this._config.card_height}px`);
      }

      if (this._config.section_max_height > 0) {
        styles.push(`--fr24-section-max-height: ${this._config.section_max_height}px`);
      }

      return styles.join("; ");
    }

    _renderHeader(mainFlight, countLabel, location, enteredEntity, exitedEntity) {
      return `
        <div class="hero">
          <div class="hero-copy">
            <div class="eyebrow">
              <ha-icon icon="mdi:radar"></ha-icon>
              <span>${escapeHtml(this._config.title)}</span>
            </div>
            <div class="hero-title">${escapeHtml(this._renderHeroTitle(mainFlight))}</div>
            <div class="hero-subtitle">
              ${escapeHtml(location.label)} - ${formatNumber(this._config.radius)} km radius
            </div>
            ${this._config.show_stats ? this._renderStatsLine(countLabel, enteredEntity, exitedEntity) : ""}
          </div>
          <div class="hero-tools">
            ${this._renderRadarModeSelector()}
            ${this._renderMapLinesToggle()}
            <div class="radar-orbit" aria-hidden="true">
              <div class="sweep"></div>
              <ha-icon icon="mdi:airplane-marker"></ha-icon>
            </div>
          </div>
        </div>
      `;
    }

    _renderMapLinesToggle() {
      return `
        <button
          class="map-lines-toggle ${this._radarMapLines ? "active" : ""}"
          type="button"
          data-map-lines-toggle
          aria-pressed="${this._radarMapLines}"
          title="Toggle live map line layer in MIL and ATC"
        >
          MAP ${this._radarMapLines ? "ON" : "OFF"}
        </button>
      `;
    }

    _renderRadarModeSelector() {
      return `
        <div class="mode-toggle-group" role="group" aria-label="Radar mode">
          ${RADAR_MODES.map(
            (mode) => `
              <button
                class="mode-toggle ${this._radarMode === mode ? "active" : ""}"
                type="button"
                data-radar-mode="${mode}"
                aria-pressed="${this._radarMode === mode}"
                title="Radar mode ${RADAR_MODE_LABELS[mode]}"
              >
                ${escapeHtml(RADAR_MODE_LABELS[mode])}
              </button>
            `,
          ).join("")}
        </div>
      `;
    }

    _renderStats(countLabel, enteredEntity, exitedEntity) {
      return this._renderStatsLine(countLabel, enteredEntity, exitedEntity);
    }

    _renderHeroTitle(mainFlight) {
      if (!mainFlight) return "No aircraft";
      return `${mainFlight.flightNumber}, ${mainFlight.aircraft}`;
    }

    _renderStatsLine(countLabel, enteredEntity, exitedEntity) {
      const current = escapeHtml(countLabel);
      const entered = escapeHtml(enteredEntity?.state ?? "-");
      const exited = escapeHtml(exitedEntity?.state ?? "-");
      const radius = escapeHtml(`${formatNumber(this._config.radius)} km`);
      return `
        <p class="stats-inline">Current ${current} / Entered ${entered} / Exited ${exited} / Radius ${radius}</p>
      `;
    }

    _renderSection(section, title, icon, content) {
      const open = this._isOpen(section);
      const bodyId = `fr24-section-${section}`;
      return `
        <section class="panel ${open ? "open" : "closed"}">
          <button
            class="panel-title"
            type="button"
            data-section="${section}"
            aria-expanded="${open}"
            aria-controls="${bodyId}"
          >
            <span>
              <ha-icon icon="${icon}"></ha-icon>
              ${escapeHtml(title)}
            </span>
            <ha-icon class="chevron" icon="mdi:chevron-${open ? "up" : "down"}"></ha-icon>
          </button>
          <div class="panel-body" id="${bodyId}">${open ? content : ""}</div>
        </section>
      `;
    }

    _renderOverview(mainFlight, currentFlights) {
      if (!mainFlight) {
        return `
          <div class="empty-state">
            <ha-icon icon="mdi:airplane-off"></ha-icon>
            <span>No aircraft in the area right now</span>
          </div>
        `;
      }

      return `
        <div class="overview-grid">
          <div class="flight-focus">
            <div class="flight-heading">
              <div>
                <div class="flight-number">${escapeHtml(mainFlight.flightNumber)}</div>
                <div class="muted">${escapeHtml(mainFlight.callsign || "Live tracking")}</div>
              </div>
              <span class="live-badge">${escapeHtml(mainFlight.status || "Live")}</span>
            </div>
            <div class="route-line">
              <span>${escapeHtml(mainFlight.origin || "Unknown")}</span>
              <i></i>
              <ha-icon icon="mdi:airplane-takeoff"></ha-icon>
              <i></i>
              <span>${escapeHtml(mainFlight.destination || "Unknown")}</span>
            </div>
            <div class="metric-row">
              ${this._renderMetric("Altitude", mainFlight.altitude, "ft")}
              ${this._renderMetric("Speed", mainFlight.speed, "kts")}
              ${this._renderMetric("Distance", mainFlight.distance, "km", 1)}
            </div>
          </div>
          <div class="aircraft-card">
            ${
              this._config.show_aircraft_image && mainFlight.image
                ? `<img src="${escapeHtml(mainFlight.image)}" alt="">`
                : `<div class="aircraft-placeholder"><ha-icon icon="mdi:airplane"></ha-icon></div>`
            }
            <div>
              <strong>${escapeHtml(mainFlight.airline)}</strong>
              <span>${escapeHtml(mainFlight.aircraft)}</span>
              ${
                mainFlight.registration
                  ? `<small>${escapeHtml(mainFlight.registration)}</small>`
                  : ""
              }
            </div>
          </div>
        </div>
        ${this._renderCurrentStrip(currentFlights)}
      `;
    }

    _renderMetric(label, value, unit, precision = 0) {
      const numeric = Number(value);
      const display = hasValue(value)
        ? Number.isFinite(numeric)
          ? `${formatNumber(numeric, precision)} ${unit}`
          : String(value)
        : "-";
      return `
        <div class="metric">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(display)}</strong>
        </div>
      `;
    }

    _renderCurrentStrip(flights) {
      if (flights.length <= 1) return "";
      return `
        <div class="current-strip">
          ${flights
            .slice(0, 8)
            .map(
              (flight) => `
                <div class="mini-flight">
                  <span>${escapeHtml(flight.flightNumber)}</span>
                  <small>${escapeHtml(flight.aircraft)}</small>
                </div>
              `,
            )
            .join("")}
        </div>
      `;
    }

    _renderMap(mapUrl, location, currentFlights) {
      if (this._config.map_render_mode !== "external") {
        return this._renderLocalMap(mapUrl, location, currentFlights);
      }

      if (!mapUrl) {
        return `
          <div class="empty-state">
            <ha-icon icon="mdi:map-alert"></ha-icon>
            <span>Enter a custom map URL</span>
          </div>
        `;
      }

      return `
        <div class="map-shell">
          <iframe
            src="${escapeHtml(mapUrl)}"
            loading="lazy"
            referrerpolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Flight radar map"
          ></iframe>
          <div class="map-overlay">
            <span><ha-icon icon="mdi:crosshairs-gps"></ha-icon>${fixed(location.lat)}, ${fixed(location.lon)}</span>
            <span><ha-icon icon="mdi:map-marker-radius"></ha-icon>${formatNumber(this._config.radius)} km</span>
          </div>
          ${this._config.show_map_actions ? this._renderMapActions(mapUrl) : ""}
        </div>
      `;
    }

    _renderLocalMap(externalMapUrl, location, currentFlights) {
      const zoom = radiusToZoom(this._config.radius);
      const radarStyleMap = this._radarMode !== "nor";
      const tileTemplate = radarStyleMap
        ? this._config.map_line_tile_url_template || DEFAULTS.map_line_tile_url_template
        : this._config.tile_url_template || DEFAULTS.tile_url_template;
      const center = latLonToTile(location.lat, location.lon, zoom);
      const centerTileX = Math.floor(center.x);
      const centerTileY = Math.floor(center.y);
      const centerOffsetX = (center.x - centerTileX) * 256;
      const centerOffsetY = (center.y - centerTileY) * 256;
      const tileRange = [-1, 0, 1];
      const tileSize = 256;
      const gridSize = tileSize * tileRange.length;
      const radiusPixels = Math.max(
        34,
        (Number(this._config.radius) * 1000) / metersPerPixel(location.lat, zoom),
      );
      const plottedFlights = currentFlights.filter(
        (flight) => hasValue(flight.latitude) && hasValue(flight.longitude),
      );

      return `
        <div class="local-map-shell">
          <div class="local-map-viewport">
            <div class="tile-grid" style="--tile-grid-size: ${gridSize}px">
              ${tileRange
                .flatMap((row) =>
                  tileRange.map((col) => {
                    const x = centerTileX + col;
                    const y = centerTileY + row;
                    return `
                      <img
                        alt=""
                        loading="lazy"
                        src="${escapeHtml(
                          tileUrl(
                            tileTemplate,
                            wrapTileX(x, zoom),
                            clampTileY(y, zoom),
                            zoom,
                          ),
                        )}"
                        style="left: ${gridSize / 2 + col * tileSize - centerOffsetX}px; top: ${
                          gridSize / 2 + row * tileSize - centerOffsetY
                        }px;"
                      >
                    `;
                  }),
                )
                .join("")}
              <div class="radius-ring" style="width: ${radiusPixels * 2}px; height: ${
                radiusPixels * 2
              }px;"></div>
              <div class="home-marker" title="Center"></div>
            </div>
            ${this._renderRadarScopeOverlay(location, plottedFlights)}
            <div class="map-marker-layer">
              ${plottedFlights.map((flight) => this._renderMapMarker(flight, location, zoom)).join("")}
            </div>
          </div>
          <div class="map-overlay">
            <span><ha-icon icon="mdi:crosshairs-gps"></ha-icon>${fixed(location.lat)}, ${fixed(location.lon)}</span>
            <span><ha-icon icon="mdi:map-marker-radius"></ha-icon>${formatNumber(this._config.radius)} km</span>
            <span><ha-icon icon="mdi:airplane"></ha-icon>${plottedFlights.length} plotted</span>
          </div>
          ${
            this._config.show_map_actions && externalMapUrl
              ? this._renderMapActions(externalMapUrl)
              : ""
          }
        </div>
      `;
    }

    _renderRadarScopeOverlay(location, plottedFlights) {
      const stats = this._getRadarStats(plottedFlights);
      return `
        <div class="radar-scope-overlay" aria-hidden="true">
          <div class="radar-rings"></div>
          <div class="radar-crosshair"></div>
          <div class="radar-sweep"></div>
          <div class="radar-scanlines"></div>
          <div class="radar-hud hud-location">
            <b>LOCATION</b>
            <span>${fixed(location.lat)}, ${fixed(location.lon)}</span>
          </div>
          <div class="radar-hud hud-readouts">
            <span>R0 = ${formatNumber(this._config.radius)} KM</span>
            <span>R1 = ${formatNumber(this._config.radius * 0.75)} KM</span>
            <span>R2 = ${formatNumber(this._config.radius * 0.5)} KM</span>
            <span>R3 = ${formatNumber(this._config.radius * 0.25)} KM</span>
          </div>
          <div class="radar-live-bars">
            <span>TRK <i style="--bar-value: ${stats.trackPercent}%"></i></span>
            <span>SPD <i style="--bar-value: ${stats.speedPercent}%"></i></span>
            <span>ALT <i style="--bar-value: ${stats.altitudePercent}%"></i></span>
            <span>RNG <i style="--bar-value: ${stats.rangePercent}%"></i></span>
          </div>
          <div class="radar-hud hud-track">
            <span>${String(stats.count).padStart(2, "0")} TRACKS</span>
            <span>MAX ${stats.maxSpeedLabel}</span>
            <span>ALT ${stats.maxAltitudeLabel}</span>
            <span>NEAR ${stats.nearestLabel}</span>
          </div>
          <div class="radar-ruler ruler-top"></div>
          <div class="radar-ruler ruler-bottom"></div>
          <span class="radar-bearing bearing-n">000</span>
          <span class="radar-bearing bearing-e">090</span>
          <span class="radar-bearing bearing-s">180</span>
          <span class="radar-bearing bearing-w">270</span>
        </div>
      `;
    }

    _getRadarStats(plottedFlights) {
      const speeds = plottedFlights.map((flight) => Number(flight.speed)).filter(Number.isFinite);
      const altitudes = plottedFlights
        .map((flight) => Number(flight.altitude))
        .filter(Number.isFinite);
      const distances = plottedFlights
        .map((flight) => Number(flight.distance))
        .filter(Number.isFinite);
      const maxSpeed = speeds.length ? Math.max(...speeds) : null;
      const maxAltitude = altitudes.length ? Math.max(...altitudes) : null;
      const nearest = distances.length ? Math.min(...distances) : null;
      const radius = Number(this._config.radius) || DEFAULTS.radius;

      return {
        count: plottedFlights.length,
        maxSpeedLabel: maxSpeed === null ? "- KT" : `${formatNumber(maxSpeed)} KT`,
        maxAltitudeLabel: maxAltitude === null ? "- FT" : `${formatNumber(maxAltitude)} FT`,
        nearestLabel: nearest === null ? "- KM" : `${formatNumber(nearest, 1)} KM`,
        trackPercent: clamp((plottedFlights.length / Math.max(this._config.max_activity_items, 1)) * 100, 8, 100),
        speedPercent: clamp(((maxSpeed || 0) / 600) * 100, 8, 100),
        altitudePercent: clamp(((maxAltitude || 0) / 45000) * 100, 8, 100),
        rangePercent: clamp((radius / 500) * 100, 8, 100),
      };
    }

    _renderMapMarker(flight, location, zoom) {
      const center = latLonToTile(location.lat, location.lon, zoom);
      const point = latLonToTile(flight.latitude, flight.longitude, zoom);
      const x = (point.x - center.x) * 256;
      const y = (point.y - center.y) * 256;
      const headingValue = Number(flight.heading || 0);
      const heading = Number.isFinite(headingValue) ? headingValue : 0;
      const speed = Number(flight.speed);
      const altitude = Number(flight.altitude);
      const trackLength = clamp((Number.isFinite(speed) ? speed : 220) / 600 * 58, 18, 58);
      const speedLabel = Number.isFinite(speed) ? `${formatNumber(speed)} kts` : "- kts";
      const altitudeLabel = Number.isFinite(altitude) ? `${formatNumber(altitude)} ft` : "- ft";

      return `
        <div
          class="plane-marker"
          style="--plane-x: ${x}px; --plane-y: ${y}px; --plane-heading: ${heading}deg; --track-length: ${trackLength}px;"
          title="${escapeHtml(`${flight.flightNumber} - ${flight.aircraft}`)}"
        >
          <span class="track-line"></span>
          <span class="atc-target"></span>
          <svg class="plane-symbol" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"></path>
          </svg>
          <span class="atc-label">
            <b>${escapeHtml(flight.flightNumber)}</b>
            <span>${escapeHtml(`${speedLabel} ${altitudeLabel}`)}</span>
          </span>
        </div>
      `;
    }

    _renderMapActions(mapUrl) {
      const loginUrl = this._getMapLoginUrl();
      return `
        <div class="map-actions">
          <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">
            <ha-icon icon="mdi:open-in-new"></ha-icon>
            <span>Open map</span>
          </a>
          ${
            loginUrl
              ? `<a href="${escapeHtml(loginUrl)}" target="_blank" rel="noopener noreferrer">
                  <ha-icon icon="mdi:account-circle"></ha-icon>
                  <span>Login</span>
                </a>`
              : ""
          }
        </div>
      `;
    }

    _renderActivity(activityFlights) {
      if (!activityFlights.length) {
        const historyHint = this._historyLoading
          ? "Loading history from Home Assistant"
          : "Activity will appear when aircraft are detected in the area";
        return `
          <div class="empty-state">
            <ha-icon icon="mdi:timeline-clock-outline"></ha-icon>
            <span>${escapeHtml(historyHint)}</span>
          </div>
          ${this._renderHistoryError()}
        `;
      }

      return `
        <div class="activity-list">
          ${activityFlights
            .map(
              (flight) => `
                <article class="activity-item">
                  <span class="activity-dtg">${escapeHtml(formatDanishMilitaryDtg(flight.lastSeen))}</span>
                  <span class="activity-flight">${escapeHtml(flight.flightNumber)}</span>
                  <span>${escapeHtml(flight.airline)}</span>
                  <span>${escapeHtml(this._formatRoute(flight))}</span>
                  <span>${escapeHtml(flight.aircraft)}</span>
                </article>
              `,
            )
            .join("")}
        </div>
        ${this._renderHistoryError()}
      `;
    }

    _formatRoute(flight) {
      if (flight.origin && flight.destination) return `${flight.origin} -> ${flight.destination}`;
      return flight.origin || flight.destination || "Unknown route";
    }

    _renderHistoryError() {
      if (!this._historyError) return "";
      return `<div class="history-note">${escapeHtml(this._historyError)}. Using local dashboard memory.</div>`;
    }

    _styles() {
      return `
        :host {
          display: block;
          width: 100%;
          min-width: 0;
          container-type: inline-size;
          --fr24-accent: var(--primary-color, #03a9f4);
          --fr24-warn: var(--warning-color, #ffb300);
          --fr24-success: var(--success-color, #19a974);
          --fr24-card-radius: var(--ha-card-border-radius, 12px);
          --fr24-soft-border: 1px solid color-mix(in srgb, var(--divider-color, #d8dee9) 72%, transparent);
        }

        ha-card.fr24-card {
          width: 100%;
          min-width: 0;
          height: var(--fr24-card-height, auto);
          max-height: var(--fr24-card-height, none);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          overflow-y: auto;
          background: var(--ha-card-background, var(--card-background-color, #fff));
          color: var(--primary-text-color, #1f2933);
          border-radius: var(--fr24-card-radius);
          scrollbar-width: thin;
        }

        ha-card.fr24-card.military,
        ha-card.fr24-card.atc {
          --fr24-accent: #80ff9a;
          --fr24-warn: #ffd45f;
          --fr24-success: #80ff9a;
          --fr24-soft-border: 1px solid rgba(128, 255, 154, 0.28);
          position: relative;
          background:
            linear-gradient(180deg, rgba(128, 255, 154, 0.05), transparent 34%),
            repeating-linear-gradient(0deg, rgba(128, 255, 154, 0.035) 0 1px, transparent 1px 7px),
            #07110d;
          color: #d9ffe2;
          border: 1px solid rgba(128, 255, 154, 0.36);
          box-shadow:
            inset 0 0 0 1px rgba(255, 212, 95, 0.08),
            0 0 28px rgba(128, 255, 154, 0.12);
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 22px;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--fr24-accent) 16%, transparent), transparent 54%),
            linear-gradient(180deg, color-mix(in srgb, var(--primary-background-color, #f6f8fb) 88%, transparent), transparent);
        }

        .hero-copy {
          min-width: 0;
        }

        .hero-tools {
          display: grid;
          justify-items: end;
          align-content: start;
          gap: 10px;
          flex: 0 0 auto;
        }

        .mode-toggle-group {
          display: inline-flex;
          gap: 3px;
          padding: 3px;
          border: var(--fr24-soft-border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 70%, transparent);
        }

        .mode-toggle {
          min-width: 42px;
          min-height: 28px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 0 8px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--primary-text-color, #1f2933);
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .mode-toggle.active {
          background: color-mix(in srgb, var(--fr24-accent) 18%, transparent);
          color: var(--primary-text-color, #1f2933);
        }

        .map-lines-toggle {
          min-height: 26px;
          padding: 0 10px;
          border: var(--fr24-soft-border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 70%, transparent);
          color: var(--primary-text-color, #1f2933);
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .map-lines-toggle.active {
          background: color-mix(in srgb, var(--fr24-accent) 18%, transparent);
        }

        .fr24-card:not(.military):not(.atc) .map-lines-toggle {
          display: none;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--secondary-text-color, #64748b);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .eyebrow ha-icon {
          color: var(--fr24-accent);
        }

        .hero-title {
          margin-top: 8px;
          font-size: 44px;
          line-height: 1;
          font-weight: 800;
        }

        .hero-subtitle {
          margin-top: 8px;
          color: var(--secondary-text-color, #64748b);
          font-size: 15px;
        }

        .stats-inline {
          margin: 6px 0 0;
          color: var(--secondary-text-color, #64748b);
          font-size: 10px;
          line-height: 1.4;
          font-weight: 500;
        }

        .radar-orbit {
          position: relative;
          width: 112px;
          height: 112px;
          flex: 0 0 112px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid color-mix(in srgb, var(--fr24-accent) 35%, transparent);
          background:
            radial-gradient(circle, color-mix(in srgb, var(--fr24-accent) 18%, transparent) 0 9%, transparent 10% 32%, color-mix(in srgb, var(--fr24-accent) 12%, transparent) 33% 34%, transparent 35% 58%, color-mix(in srgb, var(--fr24-accent) 10%, transparent) 59% 60%, transparent 61%);
          overflow: hidden;
        }

        .radar-orbit ha-icon {
          --mdc-icon-size: 38px;
          color: var(--fr24-accent);
          transform: rotate(-24deg);
          z-index: 1;
        }

        .sweep {
          position: absolute;
          inset: 50% 50% 0 0;
          transform-origin: 100% 0;
          background: linear-gradient(60deg, color-mix(in srgb, var(--fr24-accent) 40%, transparent), transparent 68%);
          animation: sweep 4.5s linear infinite;
        }

        @keyframes sweep {
          to { transform: rotate(360deg); }
        }

        .metric span,
        .muted,
        .aircraft-card span,
        .aircraft-card small {
          color: var(--secondary-text-color, #64748b);
        }

        .metric span {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0;
        }

        .panel {
          border-top: var(--fr24-soft-border);
        }

        .panel-title {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 18px;
          border: 0;
          background: transparent;
          color: var(--primary-text-color, #1f2933);
          cursor: pointer;
          font: inherit;
          font-weight: 700;
          text-align: left;
        }

        .panel-title span {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .panel-title ha-icon:first-child {
          color: var(--fr24-accent);
        }

        .chevron {
          color: var(--secondary-text-color, #64748b);
        }

        .panel-body {
          padding: 0 16px 16px;
          max-height: var(--fr24-section-max-height, none);
          overflow: auto;
          scrollbar-width: thin;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(150px, 0.28fr);
          gap: 10px;
        }

        .flight-focus,
        .aircraft-card,
        .mini-flight,
        .activity-item {
          border: var(--fr24-soft-border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--card-background-color, #fff) 92%, var(--primary-background-color, #f7f9fc));
        }

        .flight-focus {
          padding: 12px;
          min-width: 0;
        }

        .flight-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .flight-number {
          font-size: 30px;
          line-height: 1;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--fr24-warn) 24%, transparent);
          color: color-mix(in srgb, var(--fr24-warn) 54%, var(--primary-text-color, #1f2933));
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .route-line {
          display: grid;
          grid-template-columns: max-content minmax(18px, 1fr) 24px minmax(18px, 1fr) max-content;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
          font-weight: 700;
        }

        .route-line span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .route-line i {
          display: block;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--fr24-accent), transparent);
        }

        .route-line ha-icon {
          color: var(--fr24-accent);
        }

        .metric-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .metric {
          min-width: 0;
          padding: 8px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 74%, transparent);
        }

        .metric strong {
          display: block;
          margin-top: 3px;
          font-size: 18px;
          line-height: 1.1;
          overflow-wrap: anywhere;
        }

        .aircraft-card {
          padding: 10px;
          display: grid;
          gap: 8px;
          align-content: start;
        }

        .aircraft-card img,
        .aircraft-placeholder {
          width: 100%;
          max-height: 92px;
          aspect-ratio: 4 / 3;
          border-radius: 8px;
          object-fit: cover;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 82%, transparent);
        }

        .aircraft-placeholder {
          display: grid;
          place-items: center;
        }

        .aircraft-placeholder ha-icon {
          --mdc-icon-size: 58px;
          color: var(--fr24-accent);
        }

        .aircraft-card strong,
        .aircraft-card span,
        .aircraft-card small {
          display: block;
          overflow-wrap: anywhere;
        }

        .current-strip {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .mini-flight {
          padding: 10px 12px;
          min-width: 0;
        }

        .mini-flight span,
        .mini-flight small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mini-flight span {
          font-weight: 800;
        }

        .mini-flight small {
          color: var(--secondary-text-color, #64748b);
        }

        .map-shell {
          position: relative;
          min-height: 240px;
          height: var(--fr24-map-height);
          overflow: hidden;
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 82%, transparent);
          border: var(--fr24-soft-border);
        }

        .local-map-shell {
          position: relative;
          min-height: 240px;
          height: var(--fr24-map-height);
          overflow: hidden;
          border-radius: 8px;
          background: #dbe7ec;
          border: var(--fr24-soft-border);
        }

        .map-shell iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }

        .local-map-viewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #dbe7ec;
        }

        .tile-grid {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--tile-grid-size);
          height: var(--tile-grid-size);
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .tile-grid img {
          position: absolute;
          width: 256px;
          height: 256px;
          user-select: none;
          pointer-events: none;
        }

        .map-marker-layer {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }

        .radius-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 2px solid color-mix(in srgb, var(--fr24-warn) 82%, transparent);
          border-radius: 50%;
          background: color-mix(in srgb, var(--fr24-warn) 14%, transparent);
          box-shadow: 0 0 34px color-mix(in srgb, var(--fr24-warn) 22%, transparent);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .home-marker {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid var(--fr24-accent);
          box-shadow: 0 2px 8px rgba(18, 28, 38, 0.35);
          transform: translate(-50%, -50%);
        }

        .plane-marker {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          margin: -15px 0 0 -15px;
          color: #fff;
          background: color-mix(in srgb, var(--fr24-accent) 90%, #111827);
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(18, 28, 38, 0.36);
          transform: translate(var(--plane-x), var(--plane-y));
          transform-origin: center;
        }

        .plane-symbol {
          width: 18px;
          height: 18px;
          fill: currentColor;
          transform: rotate(var(--plane-heading));
          transform-origin: center;
        }

        .track-line,
        .atc-target,
        .atc-label {
          display: none;
        }

        .map-overlay {
          position: absolute;
          left: 12px;
          top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          pointer-events: none;
          z-index: 4;
        }

        .map-overlay span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          color: #fff;
          background: rgba(18, 28, 38, 0.78);
          backdrop-filter: blur(8px);
          font-size: 12px;
          font-weight: 700;
        }

        .map-overlay ha-icon {
          --mdc-icon-size: 17px;
        }

        .map-actions {
          position: absolute;
          right: 12px;
          top: 12px;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          max-width: calc(100% - 24px);
          z-index: 4;
        }

        .map-actions a {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border-radius: 8px;
          color: #fff;
          background: rgba(18, 28, 38, 0.82);
          backdrop-filter: blur(8px);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .map-actions a:hover {
          background: rgba(18, 28, 38, 0.94);
        }

        .map-actions ha-icon {
          --mdc-icon-size: 17px;
        }

        .radar-scope-overlay {
          position: absolute;
          inset: 0;
          display: none;
          overflow: hidden;
          border-radius: inherit;
          pointer-events: none;
          color: #80ff9a;
          z-index: 2;
        }

        .radar-scope-overlay > * {
          position: absolute;
        }

        .radar-scope-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at center, rgba(128, 255, 154, 0.16) 0 7%, rgba(18, 120, 56, 0.17) 8% 38%, rgba(2, 26, 11, 0.5) 68%, rgba(0, 8, 3, 0.9) 100%),
            linear-gradient(90deg, rgba(128, 255, 154, 0.06), transparent 18%, transparent 82%, rgba(128, 255, 154, 0.06));
          box-shadow: inset 0 0 92px rgba(0, 0, 0, 0.72), inset 0 0 36px rgba(128, 255, 154, 0.14);
        }

        .radar-rings {
          left: 50%;
          top: 50%;
          width: min(90%, calc(var(--fr24-map-height) - 34px));
          max-width: calc(100% - 24px);
          max-height: calc(100% - 24px);
          aspect-ratio: 1;
          border-radius: 50%;
          border: 1px solid rgba(128, 255, 154, 0.72);
          background:
            repeating-radial-gradient(circle, transparent 0 calc(14.25% - 1px), rgba(128, 255, 154, 0.44) calc(14.25% - 1px) 14.25%),
            repeating-conic-gradient(rgba(128, 255, 154, 0.58) 0 0.7deg, transparent 0.7deg 4deg);
          box-shadow: 0 0 26px rgba(128, 255, 154, 0.16), inset 0 0 54px rgba(128, 255, 154, 0.08);
          opacity: 0.82;
          transform: translate(-50%, -50%);
          -webkit-mask: radial-gradient(circle, transparent 0 9%, #000 10% 100%);
          mask: radial-gradient(circle, transparent 0 9%, #000 10% 100%);
        }

        .radar-crosshair {
          left: 50%;
          top: 50%;
          width: min(90%, calc(var(--fr24-map-height) - 34px));
          max-width: calc(100% - 24px);
          max-height: calc(100% - 24px);
          aspect-ratio: 1;
          border-radius: 50%;
          opacity: 0.48;
          transform: translate(-50%, -50%);
        }

        .radar-crosshair::before,
        .radar-crosshair::after {
          content: "";
          position: absolute;
          background: rgba(128, 255, 154, 0.52);
          box-shadow: 0 0 12px rgba(128, 255, 154, 0.26);
        }

        .radar-crosshair::before {
          left: 50%;
          top: 0;
          width: 1px;
          height: 100%;
        }

        .radar-crosshair::after {
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
        }

        .radar-sweep {
          left: 50%;
          top: 50%;
          width: min(126%, calc(var(--fr24-map-height) + 120px));
          max-width: calc(100% + 120px);
          max-height: calc(100% + 120px);
          aspect-ratio: 1;
          border-radius: 50%;
          background: conic-gradient(from -18deg, rgba(128, 255, 154, 0.44) 0deg, rgba(128, 255, 154, 0.16) 34deg, rgba(128, 255, 154, 0.04) 56deg, transparent 78deg 360deg);
          mix-blend-mode: screen;
          transform: translate(-50%, -50%);
          transform-origin: center;
          animation: radar-scope-spin 5.6s linear infinite;
        }

        .radar-sweep::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 50%;
          height: 2px;
          background: linear-gradient(90deg, rgba(128, 255, 154, 0.05), rgba(128, 255, 154, 0.94));
          box-shadow: 0 0 12px rgba(128, 255, 154, 0.68);
          transform-origin: left center;
        }

        .radar-scanlines {
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(128, 255, 154, 0.06) 0 1px, transparent 1px 5px);
          mix-blend-mode: screen;
          opacity: 0.45;
        }

        .radar-bearing {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          color: rgba(151, 255, 99, 0.92);
          text-shadow: 0 0 10px rgba(128, 255, 154, 0.52);
          z-index: 1;
        }

        .bearing-n {
          left: 50%;
          top: 8px;
          transform: translateX(-50%);
        }

        .bearing-e {
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        .bearing-s {
          left: 50%;
          bottom: 8px;
          transform: translateX(-50%);
        }

        .bearing-w {
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        .radar-hud {
          z-index: 1;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          color: rgba(79, 255, 116, 0.92);
          text-shadow: 0 0 10px rgba(79, 255, 116, 0.35);
          font-size: 10px;
          line-height: 1.25;
          letter-spacing: 0;
        }

        .radar-hud b,
        .radar-hud span {
          display: block;
        }

        .hud-location {
          left: 12px;
          top: 12px;
        }

        .hud-readouts {
          left: 12px;
          top: 126px;
        }

        .hud-track {
          right: 12px;
          top: 12px;
          width: 150px;
        }

        .radar-live-bars {
          left: 12px;
          top: 54px;
          display: grid;
          gap: 5px;
          width: 92px;
          z-index: 1;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 9px;
          color: rgba(79, 255, 116, 0.92);
        }

        .radar-live-bars span {
          display: grid;
          grid-template-columns: 26px minmax(0, 1fr);
          align-items: center;
          gap: 5px;
        }

        .radar-live-bars i {
          display: block;
          height: 4px;
          background: linear-gradient(90deg, #4fff74 0 var(--bar-value), rgba(79, 255, 116, 0.14) var(--bar-value) 100%);
          box-shadow: 0 0 9px rgba(79, 255, 116, 0.24);
        }

        .radar-ruler {
          left: 8px;
          right: 8px;
          height: 11px;
          opacity: 0.56;
          background: repeating-linear-gradient(90deg, rgba(79, 255, 116, 0.75) 0 2px, transparent 2px 10px);
          z-index: 1;
        }

        .ruler-top {
          top: 4px;
          border-top: 2px solid rgba(79, 255, 116, 0.7);
        }

        .ruler-bottom {
          bottom: 4px;
          border-bottom: 2px solid rgba(79, 255, 116, 0.7);
        }

        @keyframes radar-scope-spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .activity-list {
          display: grid;
          gap: 4px;
        }

        .activity-item {
          box-sizing: border-box;
          display: grid;
          grid-template-columns: minmax(94px, 0.85fr) minmax(58px, 0.7fr) minmax(0, 1.1fr) minmax(0, 1.25fr) minmax(0, 1.3fr);
          align-items: center;
          gap: 8px;
          min-height: 30px;
          padding: 4px 8px;
          font-size: 12px;
          line-height: 1.2;
          overflow: hidden;
        }

        .activity-item span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-dtg {
          color: var(--secondary-text-color, #64748b);
          font-family: var(--code-font-family, "Roboto Mono", monospace);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0;
        }

        .activity-flight {
          font-weight: 800;
          color: var(--primary-text-color, #1f2933);
        }

        .history-note,
        .empty-state {
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 78%, transparent);
          color: var(--secondary-text-color, #64748b);
        }

        .empty-state {
          min-height: 112px;
          display: grid;
          place-items: center;
          gap: 8px;
          text-align: center;
          padding: 20px;
        }

        .empty-state ha-icon {
          --mdc-icon-size: 34px;
          color: var(--fr24-accent);
        }

        .history-note {
          margin-top: 10px;
          padding: 10px 12px;
          font-size: 12px;
        }

        .military .hero,
        .atc .hero {
          background:
            linear-gradient(135deg, rgba(128, 255, 154, 0.15), transparent 48%),
            repeating-linear-gradient(90deg, rgba(128, 255, 154, 0.04) 0 1px, transparent 1px 22px),
            #08150f;
          border-bottom: 1px solid rgba(128, 255, 154, 0.18);
        }

        .military .eyebrow,
        .atc .eyebrow,
        .military .hero-subtitle,
        .atc .hero-subtitle,
        .military .stats-inline,
        .atc .stats-inline,
        .military .muted,
        .atc .muted,
        .military .aircraft-card span,
        .atc .aircraft-card span,
        .military .aircraft-card small,
        .atc .aircraft-card small,
        .military .mini-flight small,
        .atc .mini-flight small,
        .military .chevron,
        .atc .chevron {
          color: rgba(217, 255, 226, 0.68);
        }

        .military .hero-title,
        .atc .hero-title,
        .military .flight-number,
        .atc .flight-number {
          color: #f0fff3;
          text-shadow: 0 0 14px rgba(128, 255, 154, 0.26);
        }

        .military .mode-toggle,
        .atc .mode-toggle,
        .military .map-lines-toggle,
        .atc .map-lines-toggle {
          color: #d9ffe2;
          background: rgba(4, 12, 8, 0.78);
          border-color: rgba(128, 255, 154, 0.32);
          text-transform: uppercase;
        }

        .military .mode-toggle.active,
        .atc .mode-toggle.active,
        .military .map-lines-toggle.active,
        .atc .map-lines-toggle.active {
          color: #06110c;
          background: #80ff9a;
          box-shadow: 0 0 18px rgba(128, 255, 154, 0.28);
        }

        .military .radar-orbit,
        .atc .radar-orbit {
          border-color: rgba(128, 255, 154, 0.42);
          background:
            radial-gradient(circle, rgba(128, 255, 154, 0.25) 0 8%, transparent 9% 30%, rgba(128, 255, 154, 0.14) 31% 32%, transparent 33% 58%, rgba(128, 255, 154, 0.12) 59% 60%, transparent 61%);
        }

        .military .sweep,
        .atc .sweep {
          background: linear-gradient(60deg, rgba(128, 255, 154, 0.58), transparent 68%);
        }

        .military .flight-focus,
        .atc .flight-focus,
        .military .aircraft-card,
        .atc .aircraft-card,
        .military .mini-flight,
        .atc .mini-flight,
        .military .activity-item,
        .atc .activity-item,
        .military .empty-state,
        .atc .empty-state,
        .military .history-note,
        .atc .history-note {
          background: rgba(5, 17, 11, 0.82);
          border-color: rgba(128, 255, 154, 0.24);
          box-shadow: inset 0 0 0 1px rgba(255, 212, 95, 0.04);
        }

        .military .metric span,
        .atc .metric span {
          color: rgba(128, 255, 154, 0.7);
        }

        .military .metric strong,
        .atc .metric strong,
        .military .activity-flight,
        .atc .activity-flight,
        .military .activity-dtg,
        .atc .activity-dtg,
        .military .aircraft-card strong,
        .atc .aircraft-card strong,
        .military .mini-flight span,
        .atc .mini-flight span {
          color: #eaffef;
        }

        .military .metric,
        .atc .metric {
          background: rgba(128, 255, 154, 0.07);
          border: 1px solid rgba(128, 255, 154, 0.12);
        }

        .military .live-badge,
        .atc .live-badge {
          color: #06110c;
          background: #ffd45f;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .military .local-map-shell,
        .atc .local-map-shell,
        .military .map-shell,
        .atc .map-shell {
          background: #06110c;
          border-color: rgba(128, 255, 154, 0.34);
          box-shadow: inset 0 0 34px rgba(128, 255, 154, 0.08);
        }

        .military .local-map-viewport,
        .atc .local-map-viewport {
          background: #010d05;
        }

        .military .tile-grid img,
        .atc .tile-grid img {
          filter: grayscale(1) brightness(1.6) sepia(1) hue-rotate(68deg) saturate(4.8) contrast(1.25);
          opacity: 0.74;
          mix-blend-mode: screen;
        }

        .military.map-lines-off .tile-grid img,
        .atc.map-lines-off .tile-grid img {
          opacity: 0;
        }

        .military:not(.map-lines-off) .radar-scope-overlay::before,
        .atc:not(.map-lines-off) .radar-scope-overlay::before {
          background:
            radial-gradient(circle at center, rgba(128, 255, 154, 0.08) 0 7%, rgba(18, 120, 56, 0.08) 8% 38%, rgba(2, 26, 11, 0.26) 68%, rgba(0, 8, 3, 0.58) 100%),
            linear-gradient(90deg, rgba(128, 255, 154, 0.04), transparent 18%, transparent 82%, rgba(128, 255, 154, 0.04));
        }

        .military .radar-scope-overlay,
        .atc .radar-scope-overlay {
          display: block;
        }

        .military .map-overlay,
        .atc .map-overlay {
          display: none;
        }

        .military .radius-ring,
        .atc .radius-ring {
          border-color: rgba(128, 255, 154, 0.76);
          border-style: dashed;
          background: rgba(128, 255, 154, 0.04);
          box-shadow: 0 0 26px rgba(128, 255, 154, 0.2);
        }

        .military .home-marker,
        .atc .home-marker {
          background: #07110d;
          border-color: #80ff9a;
          box-shadow: 0 0 18px rgba(128, 255, 154, 0.42);
        }

        .military .plane-marker {
          width: 24px;
          height: 24px;
          margin: -12px 0 0 -12px;
          color: #9cff9a;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          text-shadow: 0 0 10px rgba(128, 255, 154, 0.8);
        }

        .military .plane-symbol {
          width: 24px;
          height: 24px;
          filter: drop-shadow(0 0 5px rgba(128, 255, 154, 0.72));
        }

        .atc .radar-sweep {
          opacity: 0.2;
          animation-duration: 8s;
        }

        .atc .plane-marker {
          width: 7px;
          height: 7px;
          margin: -3px 0 0 -3px;
          color: #b7ffcb;
          background: #b7ffcb;
          border: 1px solid rgba(183, 255, 203, 0.9);
          border-radius: 1px;
          box-shadow: 0 0 8px rgba(183, 255, 203, 0.74);
        }

        .atc .plane-symbol {
          display: none;
        }

        .atc .track-line {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--track-length);
          height: 1px;
          background: linear-gradient(90deg, rgba(183, 255, 203, 0.86), transparent);
          box-shadow: 0 0 7px rgba(183, 255, 203, 0.36);
          transform: rotate(calc(var(--plane-heading) + 180deg));
          transform-origin: left center;
        }

        .atc .atc-label {
          display: block;
          position: absolute;
          left: 11px;
          top: -18px;
          min-width: 92px;
          color: #c8fff7;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 10px;
          line-height: 1.15;
          letter-spacing: 0;
          text-shadow: 0 0 8px rgba(108, 255, 241, 0.62);
          white-space: nowrap;
        }

        .atc .atc-label b,
        .atc .atc-label span {
          display: block;
        }

        .military .map-overlay span,
        .atc .map-overlay span,
        .military .map-actions a,
        .atc .map-actions a {
          color: #d9ffe2;
          background: rgba(4, 12, 8, 0.84);
          border: 1px solid rgba(128, 255, 154, 0.24);
          text-transform: uppercase;
        }

        .military .panel,
        .atc .panel {
          border-top-color: rgba(128, 255, 154, 0.18);
        }

        .military .panel-title,
        .atc .panel-title {
          color: #eaffef;
          text-transform: uppercase;
        }
        .compact .hero {
          padding: 16px;
        }

        .compact .radar-orbit {
          width: 86px;
          height: 86px;
          flex-basis: 86px;
        }

        @container (max-width: 720px) {
          .hero {
            padding: 18px;
          }

          .hero-title {
            font-size: 36px;
          }

          .flight-number {
            font-size: 28px;
          }

          .radar-orbit {
            width: 82px;
            height: 82px;
            flex-basis: 82px;
          }

          .metric-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .panel-body {
            padding: 0 12px 12px;
          }
        }

        @container (max-width: 480px) {
          .hero {
            align-items: center;
          }

          .hero-title {
            font-size: 32px;
          }

          .radar-orbit {
            display: none;
          }

          .mode-toggle span {
            display: none;
          }

          .metric-row {
            grid-template-columns: 1fr;
          }

          .route-line {
            grid-template-columns: 1fr 20px 1fr;
          }

          .route-line i {
            display: none;
          }

          .route-line ha-icon {
            justify-self: center;
          }

          .activity-item {
            grid-template-columns: minmax(80px, 0.85fr) minmax(46px, 0.55fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1fr);
            gap: 5px;
            padding: 4px 6px;
            font-size: 11px;
          }

          .activity-dtg {
            font-size: 10px;
          }

          .map-shell,
          .local-map-shell {
            height: min(var(--fr24-map-height), 360px);
          }

          .map-overlay,
          .map-actions {
            position: static;
            margin: 8px;
          }

          .map-shell,
          .local-map-shell {
            display: flex;
            flex-direction: column;
          }

          .map-shell iframe,
          .local-map-viewport {
            position: relative;
            min-height: 0;
            flex: 1;
          }
        }
      `;
    }
  }

  class Fr24DashboardCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = {};
      this._hass = null;
      this._rendered = false;
      this._valueChangedHandler = this._handleValueChanged.bind(this);
    }

    setConfig(config) {
      this._config = normalizeConfig(config || {});
      this._renderOnce();
      this._updateForm();
    }

    set hass(hass) {
      this._hass = hass;
      this._updateForm();
    }

    _renderOnce() {
      if (!this.shadowRoot || this._rendered) return;
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          ha-form { display: block; }
          .hint {
            margin: 12px 0 0;
            color: var(--secondary-text-color);
            font-size: 12px;
            line-height: 1.45;
          }
        </style>
        <ha-form></ha-form>
        <div class="hint">
          Custom URLs can use {lat}, {lon}, {radius}, and {zoom}.
        </div>
      `;

      const form = this.shadowRoot.querySelector("ha-form");
      form?.addEventListener("value-changed", this._valueChangedHandler);
      this._rendered = true;
    }

    _updateForm() {
      if (!this.shadowRoot) return;
      this._renderOnce();
      const form = this.shadowRoot.querySelector("ha-form");
      if (form) {
        form.hass = this._hass;
        form.data = this._config;
        form.schema = EDITOR_SCHEMA;
        form.computeLabel = this._computeLabel;
      }
    }

    _handleValueChanged(event) {
      this._config = event.detail.value;
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._cleanConfig(this._config) },
          bubbles: true,
          composed: true,
        }),
      );
    }

    _computeLabel(schema) {
      return EDITOR_LABELS[schema.name] || schema.name;
    }

    _cleanConfig(config) {
      const cleaned = { ...config };
      for (const [key, value] of Object.entries(cleaned)) {
        if (value === "" || value === undefined || value === null) delete cleaned[key];
      }
      return cleaned;
    }
  }

  if (!customElements.get("fr24-dashboard-card")) {
    customElements.define("fr24-dashboard-card", Fr24DashboardCard);
  }

  if (!customElements.get("fr24-dashboard-card-editor")) {
    customElements.define("fr24-dashboard-card-editor", Fr24DashboardCardEditor);
  }

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "fr24-dashboard-card",
    name: "FR24 Dashboard Card",
    description: "Combined FlightRadar24 radar, current aircraft, and activity list.",
    preview: true,
  });

  console.info(`%cFR24 Dashboard Card%c ${CARD_VERSION}`, "color: #03a9f4; font-weight: 700", "");
})();
