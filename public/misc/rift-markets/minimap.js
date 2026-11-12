const mapBounds = {left: -120, right: 14870, bottom: -120, top: 14980};
const riftArt = "https://ddragon.leagueoflegends.com/cdn/10.18.1/img/map/map11.png";
const eventArt = "https://gol.gg/_img/minimapbig2-S14-2.png";
const riftMap = new URL("./rift-map.png", import.meta.url);
const eventMap = new URL("./rift-event-map.png", import.meta.url);
const deathMarkerSeconds = 8;

// Summoner's Rift building positions from https://hextechdocs.dev/map-data/.
const buildings = {
  blue: {
    top: [[981, 10441], [1512, 6699], [1169, 4287], [1171, 3571]],
    mid: [[5846, 6396], [5048, 4812], [3651, 3696], [3203, 3208]],
    bot: [[10504, 1029], [6919, 1483], [4281, 1253], [3452, 1236]],
    nexus: {top: [1748, 2270], bot: [2177, 1807]},
  },
  red: {
    top: [[4318, 13875], [7943, 13411], [10481, 13650], [11261, 13676]],
    mid: [[8955, 8510], [9767, 10113], [11134, 11207], [11598, 11667]],
    bot: [[13866, 4505], [13327, 8226], [13624, 10572], [13604, 11316]],
    nexus: {top: [12611, 13084], bot: [13052, 12612]},
  },
};
const pits = [
  {name: "Baron pit", label: "B", x: 4887, y: 10560, types: ["Baron", "Herald", "Voidgrub"]},
  {name: "Dragon pit", label: "D", x: 9921, y: 4363, types: ["Dragon", "Elder"]},
];
const objectiveTypes = new Set([...pits.flatMap((pit) => pit.types), "Atakhan"]);
const sides = ["blue", "red"];
const laneLabels = {top: "Top", mid: "Mid", bot: "Bottom"};

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function clock(time) {
  const seconds = Math.max(0, Math.floor(time));
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

function portrait(champion) {
  const image = make("span", "rift-portrait", champion.slice(0, 2).toUpperCase());
  image.setAttribute("aria-hidden", "true");
  const key = champion.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key) {
    const art = make("img", "rift-portrait-image");
    art.alt = "";
    art.width = 24;
    art.height = 24;
    art.hidden = true;
    art.addEventListener("load", () => { art.hidden = false; }, {once: true});
    art.src = new URL("./champion-icons/" + key + ".png", import.meta.url);
    image.append(art);
  }
  return image;
}

function place(element, x, y) {
  element.style.left = 100 * x + "%";
  element.style.top = 100 * y + "%";
}

function moveTo(element, x, y, eventBackground) {
  const left = (x - mapBounds.left) / (mapBounds.right - mapBounds.left);
  const top = (mapBounds.top - y) / (mapBounds.top - mapBounds.bottom);
  // Fit static map features to the GoL reference image when displaying native event pixels.
  place(element, eventBackground ? left * 1.018 - .0146 : left,
    eventBackground ? top * 1.012 - .0244 : top);
}

function makeBuildings(layer) {
  const markers = new Map();
  function add(side, key, kind, label, [x, y]) {
    const marker = make("span", "rift-structure " + kind + " " + side);
    layer.append(marker);
    markers.set(side + ":" + key, {marker, label, x, y});
  }
  for (const side of sides) {
    for (const [lane, label] of Object.entries(laneLabels)) {
      buildings[side][lane].forEach((position, index) => {
        const names = ["outer turret", "inner turret", "inhibitor turret", "inhibitor"];
        add(side, lane + ":" + (index + 1), index === 3 ? "inhibitor" : "turret",
          label + " " + names[index], position);
      });
    }
    for (const [lane, position] of Object.entries(buildings[side].nexus)) {
      add(side, "nexus:" + lane, "turret", laneLabels[lane] + " Nexus turret", position);
    }
  }
  return markers;
}

function structureKey(event) {
  if (!event.target_side || !event.lane) return null;
  const prefix = event.target_side + ":";
  if (event.structure === "nexus_tower") return prefix + "nexus:" + event.lane;
  if (event.structure === "inhibitor" || event.type === "Inhibitor") return prefix + event.lane + ":4";
  if (event.structure === "lane_tower" || event.type === "Tower") {
    return prefix + event.lane + ":" + event.tier;
  }
  return null;
}

function mostRecentFrame(frames, time, maxAge) {
  let low = 0;
  let high = frames.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (frames[middle].time <= time) low = middle + 1;
    else high = middle;
  }
  const frame = frames[low - 1];
  return frame && time - frame.time <= maxAge ? frame : null;
}

function playerStatus(player, frame, time, timeEstimated) {
  if (!player) return "No sample";
  if (player.dead) {
    if (Number.isFinite(player.respawnSeconds)) {
      const countdown = Math.max(0, Math.ceil(player.respawnSeconds - (time - frame.time)));
      const estimated = timeEstimated || Number.isFinite(player.respawnObservedAt);
      return "Respawn " + (estimated ? "≈" : "") + countdown + "s";
    }
    return "Dead · timer unavailable";
  }
  if (Number.isFinite(player.health) && Number.isFinite(player.maxHealth) && player.maxHealth > 0) {
    return Math.round(player.health / player.maxHealth * 100) + "% HP";
  }
  return player.dead === false ? "Alive" : "No sample";
}

export function createMinimap(section, {onTime} = {}) {
  const header = make("div", "panel-head");
  const heading = make("h2", "", "Game minimap");
  const timeOutput = make("output", "rift-clock", "0:00");
  const timeGroup = make("div", "rift-time");
  timeGroup.append(make("span", "muted small", "Game clock"), timeOutput);
  header.append(heading, timeGroup);

  const scrubber = make("div", "rift-scrubber");
  const rail = make("div", "rift-ticks");
  rail.setAttribute("aria-hidden", "true");
  const previewLine = make("span", "rift-preview");
  rail.append(previewLine);
  const range = make("input", "rift-range");
  range.type = "range";
  range.min = "0";
  range.step = "1";
  range.value = "0";
  range.setAttribute("aria-label", "Minimap game time");
  const scale = make("div", "rift-scale muted small");
  const endLabel = make("span", "", "0:00");
  scale.append(make("span", "", "0:00"), endLabel);
  scrubber.append(rail, range, scale);

  const content = make("div", "rift-content");
  const mapColumn = make("div", "rift-map-column");
  const map = make("div", "rift-map");
  map.setAttribute("role", "img");
  map.setAttribute("aria-label", "Summoner's Rift minimap with structures, objective pits, and recorded positions");
  const image = make("img", "rift-art");
  image.src = riftMap;
  image.alt = "";
  image.width = 512;
  image.height = 512;
  const structureLayer = make("div", "rift-layer");
  const objectiveLayer = make("div", "rift-layer");
  const eventLayer = make("div", "rift-layer");
  const championLayer = make("div", "rift-layer");
  map.append(image, structureLayer, objectiveLayer, eventLayer, championLayer);
  const mapKey = make("div", "rift-map-key muted small");
  const eventKey = make("span", "rift-event-key", "Death location · last " + deathMarkerSeconds + "s");
  const positionKey = make("span", "rift-position-key", "Champion position");
  mapKey.append(make("span", "rift-turret-key", "Turret"), make("span", "rift-destroyed-key", "Destroyed"),
    make("span", "rift-inhibitor-key", "Inhibitor"), make("span", "rift-objective-key", "Objective pit"),
    eventKey, positionKey);
  const attribution = make("a", "rift-credit small", "Map art · Riot Data Dragon ↗");
  attribution.href = riftArt;
  attribution.target = "_blank";
  attribution.rel = "noopener";
  const portraitCredit = make("a", "rift-credit small", "Champion portraits · Riot Data Dragon ↗");
  portraitCredit.href = "https://developer.riotgames.com/docs/lol#data-dragon";
  portraitCredit.target = "_blank";
  portraitCredit.rel = "noopener";
  const positionCredit = make("a", "rift-credit small", "Position source ↗");
  positionCredit.target = "_blank";
  positionCredit.rel = "noopener";
  positionCredit.hidden = true;
  const credits = make("div", "rift-credits");
  credits.append(attribution, portraitCredit, positionCredit);
  mapColumn.append(map, mapKey, credits);
  const markers = makeBuildings(structureLayer);
  const pitMarkers = pits.map((pit) => {
    const marker = make("span", "rift-pit", pit.label);
    objectiveLayer.append(marker);
    return marker;
  });

  const sidebar = make("div", "rift-sidebar");
  const coverage = make("p", "rift-coverage small muted");
  const championHeading = make("h3", "rift-section-title", "Champions");
  const roster = make("div", "rift-roster");
  const objectiveHeading = make("h3", "rift-section-title", "Recorded objectives");
  const objectives = make("ul", "rift-objectives");
  sidebar.append(championHeading, coverage, roster, objectiveHeading, objectives);
  content.append(mapColumn, sidebar);
  section.replaceChildren(header, scrubber, content);

  let game = null;
  let events = [];
  let frames = [];
  let positionFrames = [];
  let rosterViews = [];
  let teamLabels = {};
  let eventBackground = false;
  let locationEvents = [];
  let deathMarkers = new Map();
  let duration = 0;
  let pinned = 0;
  let chartTime = null;
  let pointerTime = null;
  let rendered = null;
  let pendingDraw = 0;

  function paint() {
    if (!game) return;
    const time = pointerTime ?? chartTime ?? pinned;
    if (rendered === time) return;
    rendered = time;
    timeOutput.textContent = clock(time);
    range.setAttribute("aria-valuetext", clock(pinned) + " game time");
    previewLine.style.left = (duration ? 100 * time / duration : 0) + "%";
    previewLine.hidden = time === pinned;

    const fallen = new Map();
    const turrets = {blue: 0, red: 0};
    const latest = new Map();
    for (const event of events) {
      if (event.time > time) break;
      const key = structureKey(event);
      if (key) fallen.set(key, event);
      if (event.type === "Tower" && event.side in turrets) turrets[event.side]++;
      if (objectiveTypes.has(event.type)) latest.set(event.type, event);
    }
    for (const [key, {marker, label}] of markers) {
      const last = fallen.get(key);
      const side = key.split(":")[0];
      const inhibitor = marker.classList.contains("inhibitor");
      const withinRespawn = inhibitor && last && time - last.time < 300;
      marker.classList.toggle("destroyed", Boolean(last) && (!inhibitor || withinRespawn));
      marker.classList.toggle("was-destroyed", inhibitor && Boolean(last) && !withinRespawn);
      const history = last ? " · Destroyed at " + clock(last.time) : " · No destruction recorded";
      marker.title = game[side] + " · " + label + history +
        (inhibitor && last && !withinRespawn ? " · Respawn time unavailable" : "");
    }
    pits.forEach((pit, index) => {
      const take = pit.types.map((type) => latest.get(type)).filter(Boolean).sort((a, b) => b.time - a.time)[0];
      pitMarkers[index].title = pit.name + (take
        ? " · Last recorded take: " + take.detail + ", " + take.team + " at " + clock(take.time)
        : " · No take recorded yet");
      pitMarkers[index].classList.toggle("taken", Boolean(take));
    });
    const recentDeaths = [];
    for (const event of locationEvents) {
      if (event.time <= time - deathMarkerSeconds) continue;
      if (event.time > time) break;
      recentDeaths.push(deathMarker(event));
    }
    eventLayer.replaceChildren(...recentDeaths);
    renderPlayers(time, turrets);
    objectives.replaceChildren();
    for (const event of [...latest.values()].sort((a, b) => b.time - a.time)) {
      const row = make("li");
      row.append(make("span", "", event.detail || event.type),
        make("span", "muted", event.team + " · " + clock(event.time)));
      objectives.append(row);
    }
    if (!latest.size) objectives.append(make("li", "muted", "No objective take recorded by " + clock(time)));
  }

  function prepareRoster(members) {
    rosterViews = [];
    teamLabels = {};
    roster.replaceChildren();
    championLayer.replaceChildren();
    for (const side of sides) {
      const group = make("div", "rift-team " + side);
      const name = make("div", "rift-team-name");
      teamLabels[side] = make("span", "muted small");
      name.append(make("span", "", game[side]), teamLabels[side]);
      group.append(name);
      for (const member of members.filter((player) => player.side === side)) {
        const champion = member.champion || member.name;
        const row = make("div", "rift-champion");
        const state = make("span", "rift-status muted");
        row.append(portrait(champion), make("span", "", champion), make("span", "muted", member.name), state);
        group.append(row);
        const marker = make("span", "rift-player " + side);
        marker.hidden = true;
        marker.append(portrait(champion));
        championLayer.append(marker);
        rosterViews.push({member, champion, state, marker});
      }
      roster.append(group);
    }
  }

  function deathMarker(event) {
    if (deathMarkers.has(event)) return deathMarkers.get(event);
    const victim = event.victim || event.detail;
    const target = rosterViews.find(({member}) =>
      member.side === event.target_side && member.name.toLowerCase() === victim?.toLowerCase());
    const champion = target?.champion || event.victim_champion;
    const side = target?.member.side || event.target_side;
    const marker = make("span", "rift-kill-location " + (champion ? "rift-death-portrait " : "") + (side || ""));
    marker.title = clock(event.time) + " · Recorded death location" + (victim ? " · " + victim : "") +
      (champion ? " (" + champion + ")" : "") + (event.player ? " · Killed by " + event.player : "");
    if (champion) marker.append(portrait(champion), make("span", "rift-death-cross", "×"));
    place(marker, event.map_x, event.map_y);
    deathMarkers.set(event, marker);
    return marker;
  }

  function renderPlayers(time, turrets) {
    const meta = game.minimap;
    const frame = mostRecentFrame(frames, time, meta?.maxFrameAge ?? 2);
    const positionFrame = mostRecentFrame(positionFrames, time, meta?.maxPositionAge ?? 2);
    const samples = new Map(frame?.champions?.map((player) => [player.id, player]) ?? []);
    const coordinates = new Map(positionFrame?.champions?.map((player) => [player.id, player]) ?? []);
    const observedDeaths = new Set(events.filter((event) => event.time === time && event.victim)
      .map((event) => event.target_side + ":" + event.victim.toLowerCase()));
    let positions = 0;
    let estimated = 0;
    let lastPositionTime = null;
    for (const side of sides) teamLabels[side].textContent = turrets[side] + " turret takes";
    for (const {member, champion, state, marker} of rosterViews) {
      const sample = samples.get(member.id);
      const tracked = coordinates.get(member.id);
      const observedDeath = observedDeaths.has(member.side + ":" + member.name.toLowerCase());
      const status = observedDeath && !(sample?.dead && Number.isFinite(sample.respawnSeconds))
        ? "Death at " + clock(time)
        : playerStatus(sample, frame, time, meta?.timeEstimated);
      state.textContent = status;
      state.hidden = !frames.length && !observedDeath;
      state.classList.toggle("rift-dead", Boolean(sample?.dead || observedDeath));
      const separate = showPosition(marker, tracked, meta?.positionCoordinateSpace || meta?.coordinateSpace);
      const combined = !separate && showPosition(marker, sample, meta?.coordinateSpace);
      marker.hidden = !separate && !combined;
      if (!marker.hidden) {
        const sampledAt = separate ? positionFrame.time : frame.time;
        const approximate = separate && meta.positionApproximate;
        marker.classList.toggle("dead", Boolean(sample?.dead || tracked?.dead));
        marker.title = champion + " · " + member.name + (approximate ? " · Estimated position at " : " · Recorded position at ") + clock(sampledAt) +
          (sample || observedDeath ? " · " + status : "");
        lastPositionTime = Math.max(lastPositionTime ?? sampledAt, sampledAt);
        positions++;
        if (approximate) estimated++;
      }
    }
    positionKey.hidden = !positions;
    const observed = frame
      ? "Player state sampled at " + (meta?.timeEstimated ? "≈" : "") + clock(frame.time)
      : frames.length ? "No player-state sample at this time" : "Historical player-state telemetry unavailable";
    const positionType = estimated === positions ? " estimated " : estimated ? " " : " recorded ";
    const mix = estimated && estimated < positions ? " (" + estimated + " estimated)" : "";
    const positionSummary = positions
      ? positions + positionType + (positions === 1 ? "position" : "positions") + mix +
        " · Latest sample at " + clock(lastPositionTime) + (meta?.positionSource ? " · " + meta.positionSource : "")
      : "Champion positions unavailable";
    coverage.textContent = observed + " · " + positionSummary;
  }

  function showPosition(marker, location, space) {
    if (!Number.isFinite(location?.x) || !Number.isFinite(location?.y)) return false;
    const {x, y} = location;
    if (space === "normalized-map" && x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      place(marker, x, y);
      return true;
    }
    if (space === "summoners-rift" && x >= mapBounds.left && x <= mapBounds.right &&
        y >= mapBounds.bottom && y <= mapBounds.top) {
      moveTo(marker, x, y, eventBackground);
      return true;
    }
    return false;
  }

  function queuePaint() {
    if (pendingDraw) return;
    pendingDraw = requestAnimationFrame(() => {
      pendingDraw = 0;
      paint();
    });
  }

  function clamp(seconds) {
    return Math.max(0, Math.min(duration, seconds));
  }

  function seek(seconds) {
    if (!Number.isFinite(seconds)) return;
    pinned = Math.round(clamp(seconds));
    range.value = String(pinned);
    chartTime = null;
    pointerTime = null;
    paint();
  }

  range.addEventListener("input", () => {
    seek(Number(range.value));
    onTime?.(pinned);
  });
  range.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || event.buttons || !duration) return;
    const box = range.getBoundingClientRect();
    const next = Math.round(clamp((event.clientX - box.left - 7) / Math.max(1, box.width - 14) * duration));
    if (pointerTime === next) return;
    pointerTime = next;
    onTime?.(next);
    queuePaint();
  });
  range.addEventListener("pointerleave", () => {
    if (pointerTime === null) return;
    pointerTime = null;
    onTime?.(pinned);
    queuePaint();
  });

  return {
    setGame(selected) {
      game = selected;
      events = [...(game.events ?? [])].filter((event) => Number.isFinite(event.time)).sort((a, b) => a.time - b.time);
      locationEvents = events.filter((event) => event.type === "Kill" && Number.isFinite(event.map_x) && Number.isFinite(event.map_y) &&
        event.map_x >= 0 && event.map_x <= 1 && event.map_y >= 0 && event.map_y <= 1);
      deathMarkers = new Map();
      eventBackground = Boolean(locationEvents.length) || game.minimap?.positionCoordinateSpace === "normalized-map";
      image.src = eventBackground ? eventMap : riftMap;
      image.classList.toggle("rift-event-art", eventBackground);
      attribution.href = eventBackground ? eventArt : riftArt;
      attribution.textContent = "Map art · " + (eventBackground ? "Games of Legends" : "Riot Data Dragon") + " ↗";
      const positionUrl = game.minimap?.positionSourceUrl || "";
      positionCredit.hidden = !/^https?:\/\//i.test(positionUrl);
      if (!positionCredit.hidden) {
        positionCredit.href = positionUrl;
        positionCredit.title = game.minimap.positionSource || "Position source";
      }
      eventKey.hidden = !locationEvents.length;
      for (const {marker, x, y} of markers.values()) moveTo(marker, x, y, eventBackground);
      pits.forEach((pit, index) => moveTo(pitMarkers[index], pit.x, pit.y, eventBackground));
      frames = [...(game.minimap?.frames ?? [])].filter((frame) => Number.isFinite(frame.time)).sort((a, b) => a.time - b.time);
      positionFrames = [...(game.minimap?.positionFrames ?? [])].filter((frame) => Number.isFinite(frame.time))
        .sort((a, b) => a.time - b.time);
      prepareRoster(game.minimap?.roster ?? []);
      duration = Math.ceil(game.duration || Math.max(
        events.at(-1)?.time ?? 0, frames.at(-1)?.time ?? 0, positionFrames.at(-1)?.time ?? 0,
      ));
      range.max = String(duration);
      range.disabled = !duration;
      endLabel.textContent = clock(duration);
      rendered = null;
      rail.replaceChildren();
      const locatedDeaths = new Set(locationEvents);
      for (const event of events) {
        if (!duration || event.time > duration) continue;
        const objective = objectiveTypes.has(event.type);
        const death = locatedDeaths.has(event);
        if (!objective && !death && !["Tower", "Inhibitor"].includes(event.type)) continue;
        const tick = make("span", "rift-tick" + (objective ? " objective" : death ? " death" : ""));
        tick.style.left = (100 * event.time / duration) + "%";
        rail.append(tick);
      }
      rail.append(previewLine);
      const hasPosition = (frame) => frame.time >= 0 && frame.time <= 60 &&
        frame.champions?.some(({x, y}) => Number.isFinite(x) && Number.isFinite(y));
      const firstPosition = positionFrames.find(hasPosition) || frames.find(hasPosition);
      seek(firstPosition ? Math.ceil(firstPosition.time) : 0);
    },
    setTime(seconds) {
      chartTime = Number.isFinite(seconds) ? Math.round(clamp(seconds)) : null;
      queuePaint();
    },
    seek,
  };
}
