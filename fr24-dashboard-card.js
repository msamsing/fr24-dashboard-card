(() => {
  const CARD_VERSION = "0.1.0";
  const DEFAULTS = {
    title: "FlightRadar24",
    entity: "sensor.flightradar24_current_in_area",
    entered_entity: "sensor.flightradar24_entered_area",
    exited_entity: "sensor.flightradar24_exited_area",
    location_entity: "",
    radius: 25,
    history_hours: 6,
    max_activity_items: 12,
    map_provider: "fr24",
    map_height: 420,
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
    compact: false,
  };

  const MAP_PROVIDERS = {
    fr24: {
      label: "FlightRadar24",
      makeUrl: ({ lat, lon, zoom }) =>
        `https://www.flightradar24.com/${fixed(lat)},${fixed(lon)}/${zoom}`,
    },
    adsbx: {
      label: "ADS-B Exchange",
      makeUrl: ({ lat, lon, zoom }) =>
        `https://globe.adsbexchange.com/?lat=${fixed(lat)}&lon=${fixed(lon)}&zoom=${zoom}`,
    },
    custom: {
      label: "Custom URL",
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
    map_provider: "Map provider",
    map_url_template: "Custom map URL",
    map_height: "Map height",
    card_height: "Total card height (0 = auto)",
    section_max_height: "Maximum section height (0 = auto)",
    grid_columns: "Sections layout width",
    grid_rows: "Sections layout height (0 = auto)",
    default_open: "Sections open by default",
    history_source: "Activity source",
    show_header: "Show header",
    show_stats: "Show stats",
    show_map: "Show map",
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
    };
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
    if (!Number.isFinite(number)) return value || "–";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(number);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatRelative(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const delta = Date.now() - date.getTime();
    const minutes = Math.max(0, Math.round(delta / 60000));
    if (minutes < 1) return "nu";
    if (minutes < 60) return `${minutes} min siden`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} t ${rest} min siden` : `${hours} t siden`;
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

  function asArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return Object.values(value);
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
      this._lastEntityStateFingerprint = "";
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
      this._sections = this._buildInitialSections();
      this._loadLocalActivity();
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._syncCurrentFlights();
      this._loadRecorderHistory();
      this._render();
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

    _syncCurrentFlights() {
      const entity = this._getEntity(this._config.entity);
      if (!entity) return;
      const flights = this._getFlightsFromEntity(entity);
      const fingerprint = JSON.stringify(flights.map((flight) => getFlightKey(flight)));
      if (fingerprint === this._lastEntityStateFingerprint) return;
      this._lastEntityStateFingerprint = fingerprint;

      const seenAt = Date.now();
      for (const flight of flights) {
        const normalized = normalizeFlight(flight, seenAt);
        this._activity.set(
          normalized.key,
          mergeActivity(this._activity.get(normalized.key), normalized),
        );
      }
      this._pruneActivity();
      this._saveLocalActivity();
    }

    async _loadRecorderHistory() {
      if (this._config.history_source !== "recorder") return;
      if (!this._hass?.callWS || !this._config.entity || this._historyLoading) return;

      const key = `${this._config.entity}:${this._config.history_hours}`;
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
          entity_ids: [this._config.entity],
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
        this._historyError = error?.message || "Recorder-historik kunne ikke hentes";
      } finally {
        this._historyLoading = false;
        this._render();
      }
    }

    _getEntity(entityId) {
      return entityId && this._hass?.states ? this._hass.states[entityId] : undefined;
    }

    _getFlightsFromEntity(entity) {
      return this._getFlightsFromState(entity);
    }

    _getFlightsFromState(state) {
      const attributes = state?.attributes || state?.a || {};
      return asArray(attributes.flights || attributes.aircraft || attributes.items).filter(Boolean);
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

    _toggleSection(section) {
      this._sections.set(section, !this._isOpen(section));
      this._saveSectionState();
      this._render();
    }

    _isOpen(section) {
      if (!this._sections.has(section)) return this._config.default_open.includes(section);
      return this._sections.get(section);
    }

    _render() {
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

      this.shadowRoot.innerHTML = `
        <style>${this._styles()}</style>
        <ha-card class="fr24-card${compactClass}" style="${this._renderCardStyle()}">
          ${this._config.show_header ? this._renderHeader(countLabel, location) : ""}
          ${this._config.show_stats ? this._renderStats(countLabel, enteredEntity, exitedEntity) : ""}
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
                  this._renderMap(mapUrl, location),
                )
              : ""
          }
          ${
            this._config.show_activity
              ? this._renderSection(
                  "activity",
                  `Activity · ${this._config.history_hours} hours`,
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
    }

    _buildMapUrl(location) {
      const provider = MAP_PROVIDERS[this._config.map_provider] || MAP_PROVIDERS.fr24;
      return provider.makeUrl({
        lat: location.lat,
        lon: location.lon,
        radius: this._config.radius,
        zoom: radiusToZoom(this._config.radius),
        template: this._config.map_url_template,
      });
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

    _renderHeader(countLabel, location) {
      return `
        <div class="hero">
          <div class="hero-copy">
            <div class="eyebrow">
              <ha-icon icon="mdi:radar"></ha-icon>
              <span>${escapeHtml(this._config.title)}</span>
            </div>
            <div class="hero-title">${escapeHtml(countLabel)} in area</div>
            <div class="hero-subtitle">
              ${escapeHtml(location.label)} · ${formatNumber(this._config.radius)} km radius
            </div>
          </div>
          <div class="radar-orbit" aria-hidden="true">
            <div class="sweep"></div>
            <ha-icon icon="mdi:airplane-marker"></ha-icon>
          </div>
        </div>
      `;
    }

    _renderStats(countLabel, enteredEntity, exitedEntity) {
      return `
        <div class="stats-grid">
          ${this._renderStat("mdi:airplane-marker", "Current", countLabel)}
          ${this._renderStat("mdi:airplane-plus", "Entered", enteredEntity?.state ?? "–")}
          ${this._renderStat("mdi:airplane-minus", "Exited", exitedEntity?.state ?? "–")}
          ${this._renderStat("mdi:map-marker-radius", "Radius", `${formatNumber(this._config.radius)} km`)}
        </div>
      `;
    }

    _renderStat(icon, label, value) {
      return `
        <div class="stat">
          <ha-icon icon="${icon}"></ha-icon>
          <div>
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        </div>
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
        : "–";
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

    _renderMap(mapUrl, location) {
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
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Flight radar map"
          ></iframe>
          <div class="map-overlay">
            <span><ha-icon icon="mdi:crosshairs-gps"></ha-icon>${fixed(location.lat)}, ${fixed(location.lon)}</span>
            <span><ha-icon icon="mdi:map-marker-radius"></ha-icon>${formatNumber(this._config.radius)} km</span>
          </div>
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
                  <div class="activity-icon">
                    <ha-icon icon="mdi:airplane"></ha-icon>
                  </div>
                  <div class="activity-main">
                    <div class="activity-topline">
                      <strong>${escapeHtml(flight.flightNumber)}</strong>
                      <span>${escapeHtml(formatRelative(flight.lastSeen))}</span>
                    </div>
                    <div class="activity-meta">
                      ${escapeHtml(flight.airline)} · ${escapeHtml(flight.aircraft)}
                    </div>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
        ${this._renderHistoryError()}
      `;
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          padding: 0 16px 16px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 12px;
          border: var(--fr24-soft-border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 66%, transparent);
        }

        .stat ha-icon {
          color: var(--fr24-accent);
        }

        .stat span,
        .metric span,
        .muted,
        .activity-meta,
        .activity-topline span,
        .aircraft-card span,
        .aircraft-card small {
          color: var(--secondary-text-color, #64748b);
        }

        .stat span,
        .metric span {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0;
        }

        .stat strong {
          display: block;
          margin-top: 2px;
          font-size: 20px;
          line-height: 1.1;
          overflow-wrap: anywhere;
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
          grid-template-columns: minmax(0, 1.6fr) minmax(220px, 0.8fr);
          gap: 14px;
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
          padding: 16px;
          min-width: 0;
        }

        .flight-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .flight-number {
          font-size: 38px;
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
          margin: 20px 0;
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
          gap: 10px;
        }

        .metric {
          min-width: 0;
          padding: 10px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary-background-color, #f7f9fc) 74%, transparent);
        }

        .metric strong {
          display: block;
          margin-top: 4px;
          font-size: 22px;
          line-height: 1.1;
          overflow-wrap: anywhere;
        }

        .aircraft-card {
          padding: 12px;
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .aircraft-card img,
        .aircraft-placeholder {
          width: 100%;
          aspect-ratio: 16 / 9;
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

        .map-shell iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }

        .map-overlay {
          position: absolute;
          left: 12px;
          top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          pointer-events: none;
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

        .activity-list {
          display: grid;
          gap: 8px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
        }

        .activity-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--fr24-accent) 14%, transparent);
          color: var(--fr24-accent);
          flex: 0 0 auto;
        }

        .activity-main {
          min-width: 0;
          flex: 1;
        }

        .activity-topline {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .activity-topline strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-topline span {
          font-size: 12px;
          white-space: nowrap;
        }

        .activity-meta {
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

        .compact .hero {
          padding: 16px;
        }

        .compact .radar-orbit {
          width: 86px;
          height: 86px;
          flex-basis: 86px;
        }

        .compact .stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @container (max-width: 720px) {
          .hero {
            padding: 18px;
          }

          .hero-title {
            font-size: 36px;
          }

          .flight-number {
            font-size: 32px;
          }

          .radar-orbit {
            width: 82px;
            height: 82px;
            flex-basis: 82px;
          }

          .stats-grid,
          .metric-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .stats-grid {
            padding: 0 12px 12px;
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

          .stats-grid,
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

          .map-shell {
            height: min(var(--fr24-map-height), 360px);
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
    }

    setConfig(config) {
      this._config = normalizeConfig(config || {});
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    _render() {
      if (!this.shadowRoot) return;
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
      if (form) {
        form.hass = this._hass;
        form.data = this._config;
        form.schema = EDITOR_SCHEMA;
        form.computeLabel = this._computeLabel;
      }
      form?.addEventListener("value-changed", (event) => {
        this._config = event.detail.value;
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._cleanConfig(this._config) },
            bubbles: true,
            composed: true,
          }),
        );
      });
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
