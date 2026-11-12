export const sideColors = {blue: "#89c6ff", red: "#ff9fac"};
const minute = 60;
const eventColors = {
  combat: "#ffa4ac",
  structures: "#b6a5fd",
  objectives: "#e8c187",
  other: "#9eacbd",
};
const shortDate = new Intl.DateTimeFormat("en-US", {timeZone: "UTC", month: "short", day: "numeric"});
const clockUTC = new Intl.DateTimeFormat("en-GB", {timeZone: "UTC", hour: "2-digit", minute: "2-digit"});
const formatNumber = new Intl.NumberFormat("en-US", {maximumFractionDigits: 2});

export function price(value) {
  return Number.isFinite(value) ? formatNumber.format(value * 100) + "¢" : "—";
}

export function midpoint(candle) {
  const bid = candle.bid.close;
  const ask = candle.ask.close;
  return Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask < 1 && bid <= ask ?
    (bid + ask) / 2 : null;
}

export function gameClock(value) {
  if (!Number.isFinite(value)) return "—";
  const seconds = Math.max(0, Math.floor(value));
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

export function eventKind(event) {
  const tag = event.tags?.find((value) => value.toLowerCase().replace(/[_-]/g, " ") === "first blood");
  return tag ? "First Blood" : event.type;
}

export function eventCategory(event) {
  const kind = eventKind(event);
  if (["First Blood", "Ace", "Kill", "Death", "Multikill", "Shutdown"].includes(kind)) return "combat";
  if (["Structure", "Tower", "Turret", "Plate", "Inhibitor", "Nexus"].includes(kind)) return "structures";
  if (["Baron", "Dragon", "Herald", "Voidgrub", "Atakhan", "Elder Dragon", "Objective", "Scuttler"].includes(kind)) return "objectives";
  return "other";
}

export function eventLabel(event) {
  const kind = eventKind(event);
  const detail = event.detail?.trim();
  if (!detail || detail.toLowerCase() === kind.toLowerCase()) return kind;
  if (["Baron", "Dragon", "Herald", "Voidgrub", "Atakhan"].includes(kind)) return detail;
  return kind + " · " + detail;
}

function epoch(value) {
  if (Number.isFinite(value)) return value;
  return Date.parse(value) / 1000;
}

function explicitTiming(event) {
  const end = epoch(event.feed_after_utc);
  const start = epoch(event.feed_before_utc);
  if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
    return {time: (start + end) / 2, start, end, direct: true};
  }
  const time = epoch(event.estimated_utc);
  if (!Number.isFinite(time)) return null;
  const uncertainty = event.timing_uncertainty_seconds;
  return {
    time,
    start: Number.isFinite(uncertainty) ? time - uncertainty : time,
    end: Number.isFinite(uncertainty) ? time + uncertainty : time,
    direct: false,
  };
}

export function createGameTiming(game) {
  const direct = [];
  const estimates = [];
  for (const event of game.events) {
    const timing = explicitTiming(event);
    if (!timing || !Number.isFinite(event.time)) continue;
    const list = timing.direct ? direct : estimates;
    list.push(timing.time - event.time);
  }
  const source = estimates.length ? estimates : direct;
  const sorted = source.toSorted((a, b) => a - b);
  const anchor = epoch(game.estimated_start_utc ?? game.start_utc ?? game.started_at_utc);
  const start = Number.isFinite(anchor) ? anchor : sorted[Math.floor(sorted.length / 2)];
  const hasStart = Number.isFinite(start);
  const available = hasStart && (!sorted.length || sorted.at(-1) - sorted[0] <= 15);
  return {
    start: hasStart ? start : null,
    canScrub: available && Number.isFinite(game.duration),
    event: explicitTiming,
  };
}

function closestIndex(sorted, time) {
  if (!sorted.length) return -1;
  let low = 0;
  let high = sorted.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (sorted[middle] < time) low = middle + 1;
    else high = middle;
  }
  return low && time - sorted[low - 1] < sorted[low] - time ? low - 1 : low;
}

function marketSide(market, game) {
  if (Object.hasOwn(sideColors, market.side)) return market.side;
  if (market.team === game.blue) return "blue";
  if (market.team === game.red) return "red";
  const winningSide = game.winner === game.blue ? "blue" : "red";
  return market.result === "yes" ? winningSide : winningSide === "blue" ? "red" : "blue";
}

function seriesLine(context, candles, value, x, y, color, thickness, dash = []) {
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = thickness;
  context.setLineDash(dash);
  context.beginPath();
  let previous = null;
  const singles = [];
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const current = value(candle);
    if (!Number.isFinite(current)) {
      previous = null;
      continue;
    }
    if (previous !== null && candle.time - previous <= minute) {
      context.lineTo(x(candle.time), y(current));
    } else {
      context.moveTo(x(candle.time), y(current));
      const next = candles[i + 1];
      if (!next || next.time - candle.time > minute || !Number.isFinite(value(next))) singles.push(candle);
    }
    previous = candle.time;
  }
  context.stroke();
  context.setLineDash([]);
  for (const candle of singles) context.fillRect(x(candle.time) - 1.2, y(value(candle)) - 1.2, 2.4, 2.4);
}

export function createPriceChart({canvas, tooltip, empty, ranges, onTime, onEvent}) {
  const context = canvas.getContext("2d");
  let game = null;
  let timing = null;
  let markets = [];
  let markers = [];
  let selected = null;
  let range = "game";
  let pointer = null;
  let externalTime = null;
  let frame = null;
  let eventFilter = () => true;
  const visible = new Set(["blue", "red", "mid", "price", "events"]);
  const marketExtents = {start: 0, end: 0};

  function domain() {
    if (selected) return {start: selected.time - 5 * minute, end: selected.time + 5 * minute};
    if (range === "game" && timing?.canScrub) {
      return {start: timing.start - 2 * minute, end: timing.start + game.duration + 2 * minute};
    }
    return {
      start: range === "0" ? marketExtents.start - minute :
        marketExtents.end - (range === "game" ? 3600 : Number(range)),
      end: marketExtents.end,
    };
  }

  function coordinates(start, end) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const left = 41;
    const right = width - 15;
    const top = 14;
    const bottom = height - 29;
    const priceBottom = bottom - 72;
    const eventY = priceBottom + 14;
    const duration = Math.max(minute, end - start);
    const x = (time) => left + (time - start) / duration * (right - left);
    const y = (value) => priceBottom - value * (priceBottom - top);
    return {width, height, left, right, top, priceBottom, eventY, bottom, x, y};
  }

  function clusterMarkers(rows, x) {
    const groups = [];
    for (const marker of rows) {
      const position = x(marker.time);
      const group = groups.at(-1);
      if (group && position - group.x < 13) group.markers.push(marker);
      else groups.push({x: position, markers: [marker]});
    }
    return groups;
  }

  function drawAxes({width, left, right, height, eventY, bottom, x, y}, start, end) {
    context.font = "11px Consolas, monospace";
    context.textBaseline = "middle";
    context.fillStyle = "#a4adba";
    context.strokeStyle = "#303541";
    context.lineWidth = 1;
    context.textAlign = "right";
    for (const level of [0, .25, .5, .75, 1]) {
      context.beginPath();
      context.moveTo(left, y(level));
      context.lineTo(right, y(level));
      context.stroke();
      context.fillText(price(level), left - 7, y(level));
    }
    context.fillText("Ev", left - 7, eventY);
    context.fillText("Vol", left - 7, bottom - 6);
    context.beginPath();
    context.moveTo(left, eventY);
    context.lineTo(right, eventY);
    context.stroke();
    const ticks = width < 450 ? 3 : 5;
    for (let i = 0; i <= ticks; i++) {
      const time = start + (end - start) * i / ticks;
      const date = new Date(time * 1000);
      context.textAlign = i === 0 ? "left" : i === ticks ? "right" : "center";
      context.fillText(end - start > 18 * 3600 ? shortDate.format(date) : clockUTC.format(date), x(time), height - 10);
    }
  }

  function drawMarkets(rows, {right, left, bottom, eventY, x, y}, duration) {
    let highest = 1;
    for (const {candles} of rows) {
      for (const candle of candles) highest = Math.max(highest, candle.volume ?? 0);
    }
    const barWidth = Math.max(1, Math.min(5, (right - left) * 24 / duration));
    const volumeHeight = Math.max(8, bottom - eventY - 12);
    for (const {candles, side} of rows) {
      const color = sideColors[side];
      context.fillStyle = color + "65";
      for (const candle of candles) {
        const size = (candle.volume ?? 0) / highest * volumeHeight;
        const offset = side === "blue" ? -barWidth : 0;
        context.fillRect(x(candle.time) + offset, bottom - size, barWidth, size);
      }
      if (visible.has("quote")) {
        seriesLine(context, candles, (candle) => candle.bid.close, x, y, color + "75", 1, [2, 4]);
        seriesLine(context, candles, (candle) => candle.ask.close, x, y, color + "75", 1, [2, 4]);
      }
      if (visible.has("price")) {
        seriesLine(context, candles, (candle) => candle.price.close, x, y, color + "aa", 1.25, [3, 3]);
      }
      if (visible.has("mid")) seriesLine(context, candles, midpoint, x, y, color, 1.8);
    }
  }

  function drawMarkers(groups, {top, eventY, left, right, x}) {
    context.textAlign = "center";
    for (const group of groups) {
      const marker = group.markers.find((item) => item.event === selected?.event) ?? group.markers[0];
      const color = eventColors[eventCategory(marker.event)];
      const chosen = marker.event === selected?.event;
      const uncertainWidth = Math.min(right, x(marker.end)) - Math.max(left, x(marker.start));
      if (uncertainWidth >= 2) {
        context.fillStyle = color + "16";
        context.fillRect(Math.max(left, x(marker.start)), top, uncertainWidth, eventY - top);
      }
      context.strokeStyle = color + (chosen ? "da" : "48");
      context.setLineDash(marker.direct ? [] : [3, 4]);
      context.beginPath();
      context.moveTo(group.x, top);
      context.lineTo(group.x, eventY);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = marker.direct ? color : "#171a21";
      context.strokeStyle = color;
      context.beginPath();
      context.arc(group.x, eventY, group.markers.length > 1 ? 6 : 3.8, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      if (group.markers.length > 1) {
        context.fillStyle = marker.direct ? "#101217" : color;
        context.font = "9px Consolas, monospace";
        context.fillText(String(Math.min(99, group.markers.length)), group.x, eventY + .5);
      }
    }
  }

  function drawCrosshair(time, geometry) {
    const position = geometry.x(time);
    context.strokeStyle = "#b9c4d49e";
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(position, geometry.top);
    context.lineTo(position, geometry.bottom);
    context.stroke();
    context.setLineDash([]);
  }

  function drawTooltip(time, group, geometry) {
    const minuteEnd = group ? Math.ceil(time / minute) * minute : time;
    const date = new Date(minuteEnd * 1000);
    const info = [shortDate.format(date) + " · " + clockUTC.format(date) + " UTC candle close"];
    for (const {market, atTime} of markets) {
      const candle = atTime.get(minuteEnd);
      if (!candle) {
        info.push(market.team + " · No candle");
        continue;
      }
      info.push(
        market.team + " · " + price(midpoint(candle)) + " mid · " + price(candle.price.close) + " trade",
        "Bid / ask " + price(candle.bid.close) + " / " + price(candle.ask.close) +
          " · Vol " + (Number.isFinite(candle.volume) ? formatNumber.format(candle.volume) : "—"),
        "Trade OHLC " + ["open", "high", "low", "close"].map((key) => price(candle.price[key])).join(" / "),
      );
    }
    if (group) {
      for (const marker of group.markers.slice(0, 5)) {
        info.push(
          (marker.direct ? "Feed · " : "Estimated · ") + gameClock(marker.event.time) + " " +
          eventLabel(marker.event) + (marker.event.inferred ? " · Inferred" : ""),
        );
      }
      if (group.markers.length > 5) info.push("+" + (group.markers.length - 5) + " events");
    }
    tooltip.textContent = info.join("\n");
    tooltip.hidden = false;
    tooltip.style.left = Math.max(2, Math.min(geometry.width - tooltip.offsetWidth - 2, geometry.x(time) + 12)) + "px";
  }

  function markerAt(position, chartFrame) {
    return position && chartFrame.groups.find((group) =>
      Math.abs(group.x - position.x) <= 8 && Math.abs(chartFrame.geometry.eventY - position.y) <= 11,
    );
  }

  function draw() {
    for (const button of ranges) {
      button.disabled = button.dataset.range === "game" && !timing?.canScrub;
      const activeRange = range === "game" && !timing?.canScrub ? "3600" : range;
      button.setAttribute("aria-pressed", String(!selected && button.dataset.range === activeRange));
    }
    tooltip.hidden = true;
    if (!game) return;
    const {start, end} = domain();
    const geometry = coordinates(start, end);
    const {width, height, left, right, x} = geometry;
    if (!width || !height || right <= left) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const rows = markets.filter(({side}) => visible.has(side)).map(({market, side}) => ({
      market, side, candles: market.candles.filter((candle) => candle.time >= start && candle.time <= end),
    }));
    const timestamps = [...new Set(rows.flatMap(({candles}) => candles.map(({time}) => time)))].sort((a, b) => a - b);
    const displayedMarkers = visible.has("events") ?
      markers.filter((marker) => marker.time >= start && marker.time <= end && eventFilter(marker.event)) : [];
    const groups = clusterMarkers(displayedMarkers, x);
    frame = {start, end, timestamps, groups, geometry};
    empty.hidden = timestamps.length > 0 || groups.length > 0;
    drawAxes(geometry, start, end);
    drawMarkets(rows, geometry, Math.max(minute, end - start));
    drawMarkers(groups, geometry);
    const group = markerAt(pointer, frame);
    if (group) {
      const time = group.markers[0].time;
      drawCrosshair(time, geometry);
      drawTooltip(time, group, geometry);
    } else if (pointer?.time != null) {
      drawCrosshair(pointer.time, geometry);
      drawTooltip(pointer.time, null, geometry);
    } else if (Number.isFinite(externalTime) && externalTime >= start && externalTime <= end) {
      drawCrosshair(externalTime, geometry);
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    if (!frame) return;
    const {start, end, timestamps, geometry} = frame;
    const fraction = (event.offsetX - geometry.left) / (geometry.right - geometry.left);
    const time = start + Math.max(0, Math.min(1, fraction)) * (end - start);
    pointer = {x: event.offsetX, y: event.offsetY, time: timestamps[closestIndex(timestamps, time)]};
    const markedEvent = markerAt(pointer, frame)?.markers[0].event;
    const seconds = markedEvent ? markedEvent.time : timing?.canScrub ? time - timing.start : null;
    onTime(seconds !== null && seconds >= 0 && seconds <= game.duration ? seconds : null);
    draw();
  });
  canvas.addEventListener("click", () => {
    if (!frame || !pointer) return;
    const group = markerAt(pointer, frame);
    if (group) onEvent(group.markers[0].event);
  });
  function resetPointer() {
    pointer = null;
    onTime(null);
    draw();
  }
  canvas.addEventListener("pointerleave", resetPointer);
  canvas.addEventListener("blur", resetPointer);
  canvas.addEventListener("keydown", (event) => {
    if (!frame?.timestamps.length || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const dates = frame.timestamps;
    const step = event.key === "ArrowLeft" ? -1 : 1;
    const index = pointer?.time != null ? closestIndex(dates, pointer.time) : dates.length - 1;
    const time = dates[Math.max(0, Math.min(dates.length - 1, index + step))];
    pointer = {time};
    const seconds = timing?.canScrub ? time - timing.start : null;
    onTime(seconds !== null && seconds >= 0 && seconds <= game.duration ? seconds : null);
    draw();
  });
  new ResizeObserver(draw).observe(canvas);

  return {
    setGame(next, mapping) {
      game = next;
      timing = mapping;
      selected = null;
      pointer = null;
      externalTime = null;
      markets = game.markets.map((market) => ({
        market, side: marketSide(market, game), atTime: new Map(market.candles.map((candle) => [candle.time, candle])),
      }));
      const first = game.markets.filter((market) => market.candles.length).map((market) => market.candles[0].time);
      const last = game.markets.filter((market) => market.candles.length).map((market) => market.candles.at(-1).time);
      marketExtents.start = first.length ? Math.min(...first) : 0;
      marketExtents.end = last.length ? Math.max(...last) : 0;
      markers = game.events.map((event) => {
        const alignment = timing.event(event);
        return alignment ? {event, ...alignment} : null;
      }).filter(Boolean).sort((a, b) => a.time - b.time);
      draw();
    },
    marketSide,
    setRange(value) {
      range = value;
      selected = null;
      pointer = null;
      draw();
    },
    setVisible(name, value) {
      if (value) visible.add(name);
      else visible.delete(name);
      draw();
    },
    setEventFilter(filter) {
      eventFilter = filter;
      draw();
    },
    setEvent(event) {
      selected = markers.find((marker) => marker.event === event) ?? null;
      pointer = null;
      draw();
    },
    setGameTime(seconds) {
      externalTime = timing?.canScrub && Number.isFinite(seconds) ? timing.start + seconds : null;
      pointer = null;
      draw();
    },
  };
}
