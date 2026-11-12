import {createMinimap} from "./minimap.js";
import {
  createGameTiming, createPriceChart, eventCategory, eventKind, eventLabel, gameClock, midpoint, price,
} from "./price-chart.js";

const $ = (id) => document.getElementById(id);
const snapshot = document.querySelector('meta[name="rift-snapshot"]')?.content;
const encrypted = snapshot === "encrypted";
const sharedLink = new URLSearchParams(location.hash.slice(1));
let snapshotKey;
const state = {
  games: [], game: null, ticker: null, request: 0, focus: null, timing: null,
};
const numbers = new Intl.NumberFormat("en-US", {maximumFractionDigits: 2});
const compact = new Intl.NumberFormat("en-US", {notation: "compact", maximumFractionDigits: 2});
const shortDate = new Intl.DateTimeFormat("en-US", {timeZone: "UTC", month: "short", day: "numeric"});
const fullUTC = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
});
let chart;
const minimap = createMinimap($("minimap"), {onTime: (seconds) => chart?.setGameTime(seconds)});
chart = createPriceChart({
  canvas: $("chart"),
  tooltip: $("chart-tip"),
  empty: $("chart-empty"),
  ranges: document.querySelectorAll("[data-range]"),
  onTime: (seconds) => minimap.setTime(seconds),
  onEvent: (event) => selectEvent(event),
});

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function formatUTC(value) {
  return value ? fullUTC.format(new Date(value)) + " UTC" : "—";
}

async function getGameData(gameId) {
  const path = gameId === undefined ? "games" : "games/" + gameId;
  if (encrypted && !snapshotKey) {
    const key = sharedLink.get("key") || "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(key)) {
      throw new Error("Open the full dashboard link to unlock the snapshot.");
    }
    const bytes = Uint8Array.from(atob(key.replaceAll("-", "+").replaceAll("_", "/") + "="),
      (char) => char.charCodeAt(0));
    snapshotKey = await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["decrypt"]);
  }
  const url = snapshot ? new URL("./data/" + path + (encrypted ? ".bin" : ".json"), import.meta.url) :
    "/api/" + path;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed (" + response.status + ")");
  if (!encrypted) return response.json();
  const blob = new Uint8Array(await response.arrayBuffer());
  let plain;
  try {
    plain = await crypto.subtle.decrypt({name: "AES-GCM", iv: blob.subarray(0, 12)},
      snapshotKey, blob.subarray(12));
  } catch {
    throw new Error("This dashboard link could not unlock the snapshot.");
  }
  const decoded = new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(decoded).json();
}

function notice(message) {
  $("notice").hidden = !message;
  $("notice").textContent = message;
  $("details").hidden = Boolean(message);
}

function renderList() {
  const query = $("search").value.trim().toLowerCase();
  const tournament = $("tournaments").value;
  const games = state.games.filter((game) => {
    const text = [game.blue, game.red, game.event_ticker, game.stage, game.date].join(" ").toLowerCase();
    return (!tournament || game.tournament === tournament) && query.split(/\s+/).every((word) => text.includes(word));
  });
  $("game-count").textContent = games.length === state.games.length ? games.length : games.length + " / " + state.games.length;
  const list = $("game-list");
  list.replaceChildren();
  if (!games.length) {
    list.append(element("p", "small muted", "No games match these filters."));
    return;
  }
  for (const game of games) {
    const button = element("button", "game-button");
    button.type = "button";
    button.dataset.game = game.id;
    button.setAttribute("aria-current", String(state.game?.id === game.id));
    const title = element("div", "game-top");
    title.append(element("span", "", game.blue + " vs " + game.red), element("span", "game-num", "G" + game.number));
    const meta = element("div", "game-meta");
    meta.append(
      element("span", "", shortDate.format(new Date(game.date)) + " · " + game.stage.toLowerCase()),
      element("span", "", game.baron_count + (game.baron_count === 1 ? " Baron" : " Barons")),
    );
    button.append(title, meta);
    button.addEventListener("click", () => selectGame(game.id));
    list.append(button);
  }
}

async function selectGame(id) {
  const request = ++state.request;
  if (!state.game) notice("Loading game…");
  try {
    const game = await getGameData(id);
    if (state.request !== request) return;
    state.game = game;
    state.ticker = game.markets.find((market) => chart.marketSide(market, game) === "blue")?.ticker ??
      game.markets[0]?.ticker;
    state.focus = null;
    state.timing = createGameTiming(game);
    if (encrypted) sharedLink.set("game", id);
    history.replaceState(null, "", encrypted ? "#" + sharedLink : "#game-" + id);
    for (const button of $("game-list").querySelectorAll(".game-button")) {
      button.setAttribute("aria-current", String(Number(button.dataset.game) === id));
    }
    renderGame();
  } catch (error) {
    if (state.request === request) notice("Could not load this game. " + error.message);
  }
}

function renderGame() {
  const game = state.game;
  $("breadcrumb").textContent = game.tournament + " / " + game.stage.toLowerCase() + " / Game " + game.number;
  $("match-title").textContent = game.blue + " vs " + game.red;
  $("game-facts").replaceChildren(
    element("span", "winner", game.winner + " won"),
    element("span", "", shortDate.format(new Date(game.date)) + ", " + game.date.slice(0, 4)),
    element("span", "", "Patch " + game.patch),
    element("span", "", gameClock(game.duration) + " game time"),
  );
  $("contracts").replaceChildren();
  for (const market of game.markets) {
    $("contracts").add(new Option(market.team + " wins · YES", market.ticker));
  }
  $("contracts").value = state.ticker;
  $("gol-link").href = game.source_url;
  notice("");
  minimap.setGame(game);
  chart.setGame(game, state.timing);
  $("blue-price-label").textContent = game.blue;
  $("red-price-label").textContent = game.red;
  $("price-subtitle").textContent = "YES prices to win Game " + game.number;
  $("market-metrics").replaceChildren(...game.markets
    .toSorted((left, right) => chart.marketSide(left, game).localeCompare(chart.marketSide(right, game)))
    .map(marketCard));
  const filters = $("events-filter");
  filters.replaceChildren(
    new Option("All events", "All"),
    new Option("Combat", "combat"),
    new Option("Structures", "structures"),
    new Option("Objectives", "objectives"),
  );
  for (const kind of [...new Set(game.events.map(eventKind))].sort()) {
    filters.add(new Option(kind, kind));
  }
  $("event-list").scrollTop = 0;
  renderEvents();
  renderMarket();
}

function selectEvent(event) {
  state.focus = state.focus === event ? null : event;
  chart.setEvent(state.focus);
  if (state.focus) minimap.seek(state.focus.time);
  const toggle = document.querySelector('[data-series="events"]');
  toggle.setAttribute("aria-pressed", "true");
  chart.setVisible("events", true);
  for (const row of $("event-list").querySelectorAll(".event-row")) {
    row.setAttribute("aria-pressed", String(state.focus === state.game.events[Number(row.dataset.index)]));
  }
  if (state.focus) {
    const target = state.timing.event(state.focus) ? $("price-title") : $("minimap");
    target.scrollIntoView({block: "nearest", behavior: "smooth"});
  }
}

function renderEvents() {
  const {events} = state.game;
  const filter = $("events-filter").value;
  const filterEvent = (event) => filter === "All" || eventKind(event) === filter || eventCategory(event) === filter;
  const subset = events.filter(filterEvent);
  chart.setEventFilter(filterEvent);
  const target = $("event-list");
  const position = target.scrollTop;
  target.replaceChildren();
  const aligned = subset.map(state.timing.event).filter(Boolean);
  const measured = aligned.filter((timing) => timing.direct).length;
  const estimated = aligned.length - measured;
  const unaligned = subset.length - aligned.length;
  $("event-subtitle").textContent = subset.length + (subset.length === 1 ? " event" : " events") +
    " · Select an event to inspect";
  $("event-chart-status").textContent = [
    measured ? measured + " feed-timed" : "",
    estimated ? estimated + " estimated" : "",
    unaligned ? unaligned + " game clock only" : "",
  ].filter(Boolean).join(" · ");
  for (const event of subset) {
    const row = element("button", "event-row " + eventCategory(event));
    row.type = "button";
    row.dataset.index = events.indexOf(event);
    row.setAttribute("aria-pressed", String(state.focus === event));
    const description = element("span", "event-kind", eventLabel(event));
    row.append(
      element("span", "event-time", gameClock(event.time)),
      element("span", "event-mark"),
      description,
      element("span", "team", event.team ?? ""),
    );
    const timing = state.timing.event(event);
    const label = [event.player, event.inferred ? "Inferred" : ""].filter(Boolean);
    if (timing) {
      const utc = new Date(timing.time * 1000).toISOString().slice(11, 19);
      label.push((timing.direct ? "Feed " : "≈ ") + utc + " UTC");
      row.title = timing.direct ?
        "LiveStats interval " + event.feed_before_utc + " to " + event.feed_after_utc :
        "Estimated from the validated game clock. Pauses or feed delays can shift the timing.";
    }
    if (label.length) description.append(element("span", "event-detail", label.join(" · ")));
    row.addEventListener("click", () => selectEvent(event));
    target.append(row);
  }
  if (!subset.length) target.append(element("p", "empty", "No recorded events of this type."));
  target.scrollTop = position;
}

function selectedMarket() {
  return state.game?.markets.find((market) => market.ticker === state.ticker);
}

function metric(label, value) {
  const node = element("div", "metric");
  node.append(element("span", "metric-label", label), element("span", "metric-value", value));
  return node;
}

function detail(label, value) {
  const row = element("div");
  row.append(element("dt", "", label), element("dd", "", value));
  return row;
}

function marketCard(market) {
  const first = market.candles.find((candle) => midpoint(candle) !== null);
  const last = market.candles.findLast((candle) => candle.price.close !== null);
  const volumes = market.volume === null ? "—" : compact.format(market.volume);
  const card = element("div", "market-card " + chart.marketSide(market, state.game));
  const heading = element("div", "market-card-heading");
  heading.append(
    element("span", "market-team", market.team),
    element("span", "market-result", "Settled " + market.result.toUpperCase()),
  );
  const metrics = element("div", "market-card-metrics");
  metrics.append(
    metric("First midpoint", price(first ? midpoint(first) : null)),
    metric("Last trade close", price(last?.price.close)),
    metric("Contracts traded", volumes),
  );
  card.append(heading, metrics);
  return card;
}

function renderMarket() {
  const market = selectedMarket();
  if (!market) return;
  $("kalshi-link").href = "https://kalshi.com/markets/kxlolmap/league-of-legends-game-winner/" +
    state.game.event_ticker.toLowerCase() + "?op_market_ticker=" + encodeURIComponent(market.ticker);
  $("contract-details").replaceChildren(
    detail("Ticker", market.ticker),
    detail("Opened", formatUTC(market.opened_utc)),
    detail("Closed", formatUTC(market.closed_utc)),
    detail("One-minute candles", numbers.format(market.candles.length)),
    detail("Individual trades", market.trade_count === null ? "Pending import" : numbers.format(market.trade_count)),
  );
  $("contract-rules").textContent = market.rules;
  const trades = $("recent-trades");
  trades.replaceChildren();
  trades.hidden = market.trade_count === null;
  if (!trades.hidden) {
    trades.append(element("h3", "", "Latest trades · final " + market.trade_hours + "h of market"));
    for (const trade of market.recent_trades) {
      const row = element("div", "trade-row");
      row.append(
        element("span", "", new Date(trade.time).toISOString().slice(11, 19) + " UTC"),
        element("span", "", price(trade.price)),
        element("span", "", trade.size === null ? "—" : numbers.format(trade.size) + " contracts"),
      );
      trades.append(row);
    }
    if (!market.recent_trades.length) trades.append(element("p", "small muted", "No trades in the imported window."));
  }
}

for (const button of document.querySelectorAll("[data-range]")) {
  button.addEventListener("click", () => {
    state.focus = null;
    chart.setRange(button.dataset.range);
    for (const row of $("event-list").querySelectorAll("button")) row.setAttribute("aria-pressed", "false");
  });
}
for (const button of document.querySelectorAll("[data-series]")) {
  button.addEventListener("click", () => {
    const value = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(value));
    chart.setVisible(button.dataset.series, value);
  });
}
$("search").addEventListener("input", renderList);
$("tournaments").addEventListener("change", renderList);
$("events-filter").addEventListener("change", renderEvents);
$("contracts").addEventListener("change", (event) => {
  state.ticker = event.target.value;
  renderMarket();
});
if (encrypted) {
  document.querySelector(".brand").addEventListener("click", (event) => {
    event.preventDefault();
    if (state.games.length) selectGame(state.games[0].id);
  });
}

try {
  state.games = await getGameData();
  const tournaments = [...new Set(state.games.map((game) => game.tournament))].sort();
  for (const tournament of tournaments) $("tournaments").add(new Option(tournament, tournament));
  renderList();
  const requested = encrypted ? Number(sharedLink.get("game")) : Number(location.hash.replace("#game-", ""));
  const initial = state.games.find((game) => game.id === requested) || state.games[0];
  if (initial) {
    await selectGame(initial.id);
    $("game-list").querySelector("[aria-current=true]")?.scrollIntoView({block: "nearest"});
  } else {
    notice(snapshot ? "The snapshot contains no games." :
      "The dataset is empty. Run python backfill.py to import completed games.");
  }
} catch (error) {
  notice(snapshot ? error.message : "Could not open the local dataset. " + error.message);
}
