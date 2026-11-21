/* Saved-record viewer. All predictions and timings were produced before export. */
import { HostedReplayApi } from './replay_adapter.js';
const replay = new HostedReplayApi();
const $ = id => document.getElementById(id);
const countFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const activeStates = new Set(['initializing', 'warming_up', 'running', 'paused', 'stopping']);
const model = { games: [], speed: 1, target: 'next', latencyPopulation: 'forecasts', formRun: null, view: '', viewLoading: false, historyLoading: false, nextHistoryAt: 0, history: [], hold: false, busy: false, connected: false, snapshot: null, focused: -1, geometry: null };
export function numeric(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
const number = (x, fallback = 0) => numeric(x) ?? fallback;
const first = (...items) => items.find(x => x !== null && x !== undefined);
const escapeHtml = text => String(text ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const count = x => countFormat.format(number(x));
const fixed = (x, digits = 3) => numeric(x) === null ? '—' : Number(x).toFixed(digits);
const price = x => numeric(x) === null ? '—' : `${fixed(x)}¢`;
export function signedPrice(value) { const n=numeric(value);return n===null?'—':`${n>0?'+':n<0?'−':''}${Math.abs(n).toFixed(3)}¢`; }
const elapsed = seconds => { const s = Math.max(0, Math.floor(number(seconds))); return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; };
const dateAt = us => numeric(us) === null ? null : new Date(Number(us)/1000);
const timeAt = us => { const d = dateAt(us); return d && !Number.isNaN(d.valueOf()) ? d.toISOString().slice(11,23) : '—'; };
const duration = us => numeric(us) === null ? '—' : us >= 1000 ? `${fixed(us/1000,2)} ms` : `${fixed(us,1)} µs`;
const safeStatus = status => String(status || 'pending').replace(/[^a-z0-9_-]/gi,'');
const statusHtml = status => `<span class="row-status ${safeStatus(status)}"><i></i>${escapeHtml(String(status || 'pending').replaceAll('_',' '))}</span>`;

export function normalizeLatency(raw = {}) {
  const metric = key => numeric(raw[`${key}_us`]) ?? (numeric(raw[`${key}_ns`]) === null ? null : Number(raw[`${key}_ns`])/1000);
  return { count: number(raw.count), mean: metric('mean'), p50: metric('p50'), p95: metric('p95'), p99: metric('p99'), max: metric('max'), misses: numeric(raw.ge_1ms) };
}
export function normalizePoint(row) {
  const next = row.next_quote || {}, one = row.one_second || {};
  const predicted = numeric(row.predicted_cents);
  const actual = numeric(next.target_cents), oneActual = numeric(one.target_cents);
  const available = row.available !== false && predicted !== null;
  return {
    id: String(first(row.forecast_id, row.sequence, row.id, '')),
    issue: numeric(first(row.issue_us, row.source_us)),
    current: numeric(first(row.current_cents, row.actual_current_cents, row.actual_cents)),
    predicted, actual, oneActual,
    nextTime: numeric(next.target_receive_us), oneTime: numeric(one.target_receive_us),
    nextError: numeric(next.absolute_error_cents), oneError: numeric(one.absolute_error_cents), nextDelta: numeric(next.error_cents),
    waitMs: numeric(next.horizon_ms),
    status: available ? (next.status || 'pending') : 'unavailable',
    oneStatus: available ? (one.status || 'pending') : 'unavailable',
    available
  };
}
export function normalizeSnapshot(raw = {}) {
  const m = raw.metrics || {}, p = raw.progress || {}, q = raw.queue || {}, config = raw.config || {};
  const next = m.next_quote || {}, one = m.one_second || {};
  const points = (Array.isArray(raw.series) ? raw.series : []).map(normalizePoint);
  const normalizeStages = values => Object.fromEntries(Object.entries(values || {}).map(([k,v]) => [k,normalizeLatency(v)]));
  const latency = normalizeStages(m.latency);
  const latencyByPopulation = {all:latency,forecasts:normalizeStages(m.latency_forecasts),nonzero:normalizeStages(m.latency_nonzero)};
  return { raw, status: raw.status || 'idle', run: raw.run_id || null,
    game: {game_id:config.game_id, ...(raw.game || {})}, side: first(raw.side,config.side), speed: number(first(raw.speed,config.speed),1),
    processed: number(p.processed), received: number(p.received), total: number(p.total),
    progress: number(p.total) > 0 ? Math.min(100, 100*number(p.processed)/number(p.total)) : 0,
    source: numeric(p.source_us), elapsed: numeric(p.source_elapsed_seconds), duration: numeric(first(p.duration_seconds,config.duration_seconds)),
    queue: q, latency, latencyByPopulation, primaryLatency: latencyByPopulation.forecasts.receive_to_forecast || normalizeLatency(),
    next, one, points,
    issued: numeric(first(p.forecasts, m.forecasts_issued, m.forecasts?.issued, p.forecasts_issued)),
    unavailable: numeric(first(m.unavailable, m.forecasts?.unavailable, p.unavailable)),
    paper: raw.paper || {enabled:false}, error: raw.error
  };
}
export function selectLatency(snapshot, population='forecasts') {
  if(!['forecasts','nonzero','all'].includes(population))throw new Error('Unknown latency population');
  const stages=snapshot.latencyByPopulation[population];
  return {stages,primary:stages.receive_to_forecast || normalizeLatency()};
}
export function activeFormConfig(snapshot, lastSyncedRun) {
  const c=snapshot.raw.config;
  if(!snapshot.run || snapshot.run===lastSyncedRun || !activeStates.has(snapshot.status) || !c || c.game_id===undefined)return null;
  const p=c.paper || {};
  return {run:snapshot.run,game_id:String(c.game_id),side:c.side==='red'?1:c.side==='blue'?0:number(c.side),
    speed:number(c.speed,1),seek:number(c.seek_seconds),duration:c.duration_seconds==null?'':String(c.duration_seconds),
    paper:p.enabled===true,minEdge:first(p.min_edge_cents,.25),maxPosition:first(p.max_position,10),orderDelay:first(p.order_latency_ms,25)};
}
export function targetExclusions(scores={}) {
  const censored=Object.entries(scores).filter(([key])=>key.startsWith('censored_'));
  return {late:number(scores.late),invalid:number(scores.invalid_target),discontinuous:number(scores.discontinuous),
    censored:censored.length?censored.reduce((sum,[,value])=>sum+number(value),0):number(scores.censored)};
}
export function normalizeRunId(value) { return typeof value==='string' && /^run-[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}$/.test(value)?value:''; }export function sharedReplayHref(href,runId) {  if(!normalizeRunId(runId))throw new Error('Invalid saved recording identity');  const url=new URL(href);url.searchParams.set('run',runId);  return url.pathname+url.search+url.hash;}
export function recordedRunForForm(view,runs,gameId,side) {
  const selected=runs.find(run=>run.run_id===view),sideName=Number(side)===1?'red':'blue';
  return selected?.game_id===String(gameId)&&selected.side===sideName?selected.run_id:null;
}
export function recordedSourceSpeedLabel(raw) {
  const speed=raw.recorded_source_speed;
  return `Original capture speed: ${[1,10,100].includes(speed)?`${speed}× source replay`:'—'}`;
}
export function readableCadenceRows(rows) {
  const labels={'All normalized update groups':'All recorded inputs',
    'Own-token BBO groups, both outcome legs':'Same-outcome quote updates',
    'Riot valid source-frame groups':'Riot source frames'};
  return rows.map(row=>({...row,label:labels[row.label]||row.label}));
}
export function normalizeRuns(raw={},games=[]) {
  const seen=new Set();
  return (Array.isArray(raw.runs)?raw.runs:[]).slice(0,30).flatMap(run=>{
    const id=normalizeRunId(run.run_id);if(!id || seen.has(id))return [];seen.add(id);
    const c=run.config || {}, game=games.find(g=>String(g.game_id)===String(c.game_id)), side=c.side==='red'||c.side===1?1:0;
    const team=gameTokens(game).find(t=>t.side===side)?.team || c.side || 'outcome';
    const stamp=`${id.slice(8,10)}/${id.slice(10,12)} ${id.slice(13,15)}:${id.slice(15,17)} UTC`;
    return [{id,label:`${stamp} · ${game?.label || c.game_id || 'Archived game'} · ${team} · recorded source ${number(c.speed,1)}× · ${c.paper?.enabled?'paper ledger · ':''}${run.status || 'saved'}`}];
  });
}
export function canControlViewedRun(snapshot,view) { return snapshot?.raw.hosted_saved_replay===true || !view || snapshot?.raw.server?.worker_active===true; }
export function canSeekRecorded(snapshot,busy=false,loading=false) {
  return !busy&&!loading&&snapshot?.raw.hosted_saved_replay===true&&Number.isFinite(snapshot.raw.playback?.duration_ms);
}

async function api(path, data) {
  return replay.handle(path,data);
}
function alertMessage(text) { $('alert').hidden = !text; $('alert').textContent = text || ''; }
function connection(ok) { model.connected = ok; $('connection').className = `connection ${ok?'connected':'error'}`; $('connection').innerHTML = `<i></i>${ok?'Saved replay unlocked':'Saved replay unavailable'}`; }
function chosenGame() { return model.games.find(g => String(g.game_id) === $('game').value); }
function gameTokens(game) {
  return (game?.tokens || []).map((t,i) => ({...t, side: t.side === 'blue' ? 0 : t.side === 'red' ? 1 : number(t.side,i)})).sort((a,b)=>a.side-b.side);
}
function selectGame() {
  const g = chosenGame(), tokens = gameTokens(g).filter(t=>(model.savedRuns||[]).some(r=>r.game_id===g?.game_id&&r.side===(t.side===0?'blue':'red')));
  $('outcome').replaceChildren(...tokens.map(t => new Option(t.team || (t.side===0?g.blue:g.red) || `Outcome ${t.side+1}`,String(t.side))));
  $('game-detail').textContent = g ? `${elapsed(g.duration_seconds)} archive span · recorded outcomes only` : 'Choose a saved game.';
  if (!model.snapshot?.run && g) { $('session-title').textContent = g.label || `${g.blue} vs ${g.red}`; $('session-subtitle').textContent = 'Ready to replay the selected outcome from its archived observations.'; }
  controls();
}
function setSpeed(speed) {
  model.speed = speed;
  document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed)===speed)));
  $('speed-note').textContent = `${speed}× playback of captured run wall time. Original worker timings never change.`;
  if(replay.current && replay.speed!==speed)replay.handle('control',{action:'speed',speed}).then(render).catch(e=>alertMessage(e.message));
}
function controls() {
  const state = model.snapshot?.status || 'idle', active = activeStates.has(state), paused = state==='paused';
  const canControl=canControlViewedRun(model.snapshot,model.view);
  $('session-form').querySelectorAll('input,select,[data-speed]').forEach(x => { x.disabled = active || model.busy || model.viewLoading; });
  document.querySelectorAll('[data-speed]').forEach(x=>{x.disabled=model.busy||model.viewLoading;});
  for(const id of ['paper-enabled','min-edge','max-position','order-delay'])$(id).disabled=true;
  $('start').disabled = active || model.busy || model.viewLoading || !model.connected || !chosenGame() || !$('outcome').value;
  $('start').innerHTML = `<span aria-hidden="true">▶</span> ${['completed','stopped','failed','interrupted'].includes(state)?'Replay saved recording':'Play saved recording'}`;
  $('pause').disabled = model.busy || model.viewLoading || !canControl || !['running','paused','warming_up'].includes(state);
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('stop').disabled = model.busy || model.viewLoading || !canControl || !active || state==='stopping';
  $('run-view').disabled=model.busy;
  $('playback-seek').disabled=!canSeekRecorded(model.snapshot,model.busy,model.viewLoading);
}
async function command(action, settings = {}) {
  model.busy = true; controls(); alertMessage('');
  try { const body = await api('control',{action,...settings}); connection(true); if(action==='start'){model.view='';model.formRun=null;model.viewLoading=false;updateViewUrl();renderRunChoices();model.nextHistoryAt=0;}if (body.status) render(body); }
  catch(e) { alertMessage(e.message || 'The command could not be completed.'); }
  finally { model.busy=false; controls(); }
}
function start(event) {
  event.preventDefault();
  const durationValue = $('duration-seconds').value;
  const selectedRun=recordedRunForForm(model.view,model.savedRuns||[],$('game').value,$('outcome').value);
  command('start', { game_id:$('game').value, side:Number($('outcome').value), speed:model.speed,
    ...(selectedRun?{run_id:selectedRun}:{}),
    seek_seconds:number($('seek-seconds').value), ...(durationValue ? {duration_seconds:Number(durationValue)} : {}),
  });
}
function metric(id, value, suffix) { $(id).innerHTML = `${fixed(value)}<small>${suffix}</small>`; }
function updateViewUrl() {
  const url=new URL(location.href);model.view?url.searchParams.set('run',model.view):url.searchParams.delete('run');
  window.history.replaceState(null,'',url);
}
function renderRunChoices() {
  const options=[new Option('Current saved playback',''),...model.history.map(r=>new Option(r.label,r.id))];
  if(model.view && !model.history.some(r=>r.id===model.view))options.push(new Option(`Saved run · ${model.view}`,model.view));
  $('run-view').replaceChildren(...options);$('run-view').value=model.view;
}
async function refreshRuns() {
  if(model.historyLoading)return;
  model.historyLoading=true;$('refresh-runs').disabled=true;
  try{model.history=normalizeRuns(await api('runs'),model.games);renderRunChoices();}
  catch(e){$('view-note').textContent='Saved-run list unavailable. The current view remains available.';}
  finally{model.historyLoading=false;model.nextHistoryAt=Date.now()+10000;$('refresh-runs').disabled=false;}
}
function changeView(value) {
  model.view=normalizeRunId(value);model.formRun=null;model.focused=-1;model.viewLoading=true;updateViewUrl();alertMessage('');
  render({status:'loading',run_id:model.view || null});$('view-note').textContent=model.view?'Loading saved run…':'Loading saved playback…';controls();
}
function syncActiveForm(snapshot) {
  const c=activeFormConfig(snapshot,model.formRun);
  if(!c || !model.games.some(g=>g.game_id===c.game_id))return;
  $('game').value=c.game_id;selectGame();$('outcome').value=String(c.side);setSpeed(c.speed);
  $('seek-seconds').value=String(c.seek);$('duration-seconds').value=c.duration;
  $('paper-enabled').checked=c.paper;$('paper-fields').hidden=!c.paper;
  $('min-edge').value=String(c.minEdge);$('max-position').value=String(c.maxPosition);$('order-delay').value=String(c.orderDelay);
  model.formRun=c.run;
}
function render(raw) {
  const s = normalizeSnapshot(raw); model.snapshot=s;
  syncActiveForm(s);
  const stateNames = {idle:'Choose a recording',loading:'Decrypting recording',initializing:'Loading saved data',warming_up:'Loading saved data',running:'Playing saved records',paused:'Playback paused',stopping:'Stopping playback',completed:'Recording ended',stopped:'Playback stopped',failed:'Unavailable',interrupted:'Unavailable'};
  $('run-status').className = `run-status ${['failed','interrupted'].includes(s.status)?'error':s.status}`;
  $('run-status').innerHTML = `<i></i><span>${escapeHtml(stateNames[s.status] || s.status)}</span>`;
  if (s.error) alertMessage(s.error);
  if (s.run) {
    const catalogGame = model.games.find(g=>String(g.game_id)===String(s.game.game_id));
    const tokens=gameTokens(catalogGame || s.game), side=s.side==='blue'?0:s.side==='red'?1:Number(s.side);
    $('session-title').textContent=catalogGame?.label || `${s.game.series || 'Archived game'} · Map ${s.game.map_number || '—'}`;
    $('session-subtitle').textContent=`${tokens.find(t=>t.side===side)?.team || s.side || 'Selected outcome'} · Saved 1-second forecasts · captured at ${raw.recorded_source_speed||'—'}× source replay`;
  }
  $('archive-clock').textContent=timeAt(s.source);
  $('archive-date').textContent=dateAt(s.source)?.toISOString().slice(0,10) || 'Awaiting replay';
  $('recorded-source-speed').textContent=recordedSourceSpeedLabel(raw);
  $('elapsed').textContent=`Source elapsed ${elapsed(s.elapsed)} / ${s.duration===null?'—':elapsed(s.duration)}`;
  $('progress-value').textContent=`${s.progress.toFixed(1)}%`;
  $('progress').setAttribute('aria-valuenow',s.progress.toFixed(1)); $('progress').firstElementChild.style.width=`${s.progress}%`;
  $('events-processed').textContent=`${count(s.processed)} / ${count(s.total)} observations processed`;
  $('pace-label').textContent=`${s.speed}× recorded-wall-time playback`;
  const playback=raw.playback;
  if(playback){
    const seek=$('playback-seek');seek.max=String(playback.duration_ms/1000);
    if(document.activeElement!==seek)seek.value=String(playback.position_ms/1000);
    $('playback-position').textContent=`${elapsed(playback.position_ms/1000)} / ${elapsed(playback.duration_ms/1000)} recorded wall time`;
  }
  metric('next-mae',s.next.mae_cents,'¢'); metric('one-second-mae',s.one.mae_cents,'¢');
  $('next-mae-note').textContent=`${count(first(s.next.all_valid,s.next.scored))} valid incl. late · hold ${price(s.next.hold_mae_cents)} · variable horizon`;
  $('one-second-note').textContent=`${count(first(s.one.all_valid,s.one.scored))} valid incl. late · hold ${price(s.one.hold_mae_cents)} · +1,000 ms`;
  const handler=s.latency.native_handler || normalizeLatency();
  $('handler-p99').innerHTML=`${fixed(handler.p99,1)}<small>µs</small>`;
  $('handler-note').textContent=`${count(handler.count)} all-update calls · max ${duration(handler.max)}`;
  $('forecast-count').textContent=s.issued===null?'—':count(s.issued);
  $('forecast-note').textContent=`${count(s.next.pending)} next-quote pending · ${s.unavailable===null?'—':count(s.unavailable)} unavailable`;
  $('coverage-tag').textContent=s.issued!==null && s.processed ? `${(100*s.issued/s.processed).toFixed(1)}% AVAILABLE` : 'AVAILABILITY';
  const selectedLatency=selectLatency(s,model.latencyPopulation), fullPath=selectedLatency.primary;
  const populationLabel={forecasts:'Actual forecasts',nonzero:'Nonzero forecasts',all:'All updates, including unavailable'}[model.latencyPopulation];
  $('latency-population-note').textContent=`${populationLabel} · ${count(fullPath.count)} calls`;
  for (const k of ['p50','p95','p99','max']) $(`latency-${k}`).innerHTML=`${fixed(fullPath[k],1)}<em>µs</em>`;
  $('deadline-misses').textContent=fullPath.misses===null?'—':count(fullPath.misses);
  const stages=[['queue','Queue wait'],['native_handler','Native handler'],['forecast_ready','Forecast ready'],['receive_to_forecast','Receive → forecast'],['decision_service','Decision service'],['receive_to_decision','Receive → decision']];
  $('stages').innerHTML='<div class="stage-tail-row stage-tail-head"><span>Measured interval</span><strong>p99</strong><strong>Max</strong></div>'+stages.map(([k,title])=>`<div class="stage-tail-row ${k==='receive_to_forecast'?'primary-path':''}"><span>${title}</span><strong>${fixed(selectedLatency.stages[k]?.p99,1)}</strong><strong>${fixed(selectedLatency.stages[k]?.max,1)}</strong></div>`).join('');
  $('queue-depth').textContent=`${count(s.queue.depth)} / ${count(s.queue.capacity)}`;
  $('queue-depth').title=`High watermark: ${count(s.queue.high_watermark)} · Backpressure: ${count(s.queue.blocked_count)}`;
  $('pacing-lag').textContent=duration(selectedLatency.stages.pacing_lag?.p99); $('pacing-lag').title=`Source pacing lag, p99 · ${populationLabel}`;
  const quoteUs=numeric(raw.latest_quote?.receive_us);
  $('source-age').textContent=quoteUs!==null && s.source!==null ? `${fixed(Math.max(0,s.source-quoteUs)/1000,1)} ms` : '—';
  $('source-age').title='Archive clock minus latest received same-token quote; not network delay';
  $('run-id').textContent=s.run || 'No active session';
  $('view-note').textContent='Only previously recorded forecasts and target releases are played. No model or order service runs in this page.';
  const permalink=$('run-permalink');permalink.hidden=!s.run;
  if(s.run)permalink.href=sharedReplayHref(location.href,s.run);
  for (const [id,file] of [['download-records','records.jsonl'],['download-summary','final.json']]) {
    const link=$(id); link.hidden=!s.run; link.href='#';link.dataset.run=s.run||'';link.dataset.file=file;
    if(id==='download-records')link.textContent='Download saved journal';
    else link.hidden=!s.run || !['completed','stopped'].includes(s.status);
  }
  const exclusionText=(name,score)=>{const e=targetExclusions(score);return `${name}: ${count(e.late)} late · ${count(e.invalid)} invalid · ${count(e.discontinuous)} discontinuous · ${count(e.censored)} censored`;};
  $('scoring-note').textContent=`${exclusionText('Next quote',s.next)}\n${exclusionText('+1 second',s.one)}\nMAE includes valid late targets; invalid, discontinuous and censored targets are excluded.`;
  renderPredictions(s.points); renderPaper(s.paper); drawChart(); controls();
  $('updated-at').textContent='Recorded worker timings · browser playback is not inference';
}
function renderPredictions(points) {
  const recent=points.slice(-35).reverse(); $('recent-count').textContent=`${count(recent.length)} recent rows`;
  $('predictions-body').innerHTML=recent.length ? recent.map(p=>`<tr><td title="Forecast ${escapeHtml(p.id)}">${timeAt(p.issue)}</td><td>${price(p.current)}</td><td class="predicted">${price(p.predicted)}</td><td>${price(p.actual)}</td><td title="Predicted minus next actual, in cents" class="${p.nextError!==null && p.nextError>.25?'negative':''}">${signedPrice(p.nextDelta)}</td><td>${p.waitMs===null?'—':`${fixed(p.waitMs,1)} ms`}</td><td title="${escapeHtml(p.oneStatus)}">${price(p.oneActual)}</td><td>${statusHtml(p.status)}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="8">No forecasts yet. Pending actuals remain visible until they resolve.</td></tr>';
}
function renderPaper(p) {
  const enabled=p.enabled===true;
  $('paper-status').textContent=enabled?(p.closed?'RECORDED FINAL LEDGER':'RECORDED EVENTS'):'NOT RECORDED';
  $('paper-empty').hidden=enabled; $('paper-content').hidden=!enabled;
  if(!enabled)return;
  $('paper-position').textContent=count(p.position);
  $('paper-realized').textContent=price(p.cash_cents);
  $('paper-unrealized').textContent=price(p.marked_pnl_cents);
  const counts=p.counts || {};
  $('paper-order-count').textContent=`${count(counts.submitted)} / ${count(counts.filled)}`;
  $('paper-assumptions').textContent=`Previously recorded example ledger only. This page creates no orders or fills. ${p.assumptions?.fill || ''} ${p.mark_valid===false?'A recorded mark is unavailable at this playback point.':''}`;
  const events=(p.events || []).slice(-20).reverse();
  $('paper-body').innerHTML=events.length ? events.map(e=>`<tr><td>${timeAt(first(e.source_us,e.time_us,e.receive_us))}</td><td>${escapeHtml(first(e.side,e.type,e.kind,'—'))}</td><td>${numeric(e.quantity)===null?'—':count(e.quantity)}</td><td title="${numeric(first(e.price_cents,e.fill_price_cents))===null?'Order limit price':'Observed simulated fill price'}">${price(paperPrice(e))}</td><td>${statusHtml(first(e.status,e.type,e.kind))}</td><td>${escapeHtml(e.reason || '—')}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="6">No paper events yet.</td></tr>';
}
export function paperPrice(event) { return numeric(first(event.price_cents,event.fill_price_cents,event.limit_cents)); }

function drawChart() {
  const canvas=$('price-chart'), rect=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio || 1;
  if(!rect.width || !rect.height)return;
  canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
  const c=canvas.getContext('2d'); c.scale(dpr,dpr);
  const w=rect.width,h=rect.height, points=(model.snapshot?.points || []).filter(p=>p.issue!==null).slice(-1800);
  const next=model.target==='next';
  $('chart-empty').hidden=points.some(p=>p.predicted!==null);
  $('chart-target-note').textContent=next?'Recorded variable-horizon target · next same-token quote':'Recorded fixed-horizon target · issue +1,000 ms';
  $('chart-count').textContent=points.length ? `${count(points.length)} recent observations · aggregate metrics use full run` : 'No forecast points yet';
  const actual=p=>next?p.actual:p.oneActual, error=p=>next?p.nextError:p.oneError;
  const prices=points.flatMap(p=>[p.predicted,actual(p),...(model.hold?[p.current]:[])]).filter(v=>v!==null);
  if(!prices.length){model.geometry=null;$('chart-tip').hidden=true;return;}
  const left=68,right=w-16,top=13,bottom=h-100,errorTop=h-68,errorBottom=h-26;
  const xmin=points[0].issue,xmax=Math.max(xmin+1,points.at(-1).issue);
  const minimum=Math.min(...prices), maximum=Math.max(...prices), pad=Math.max(.05,(maximum-minimum)*.12);
  const ymin=Math.max(0,minimum-pad),ymax=Math.min(100,maximum+pad);
  const yrange=Math.max(.01,ymax-ymin);
  const x=t=>left+(t-xmin)/(xmax-xmin)*(right-left), y=p=>bottom-(p-ymin)/yrange*(bottom-top);
  c.font='13px Consolas, monospace'; c.textAlign='right';
  for(let i=0;i<=4;i++){
    const value=ymin+yrange*i/4, yy=y(value);
    c.strokeStyle='#22313a';c.lineWidth=.6;c.beginPath();c.moveTo(left,yy);c.lineTo(right,yy);c.stroke();
    c.fillStyle='#7d94a3';c.fillText(value.toFixed(2),left-9,yy+3);
  }
  const line=(get,color,dash=[])=>{
    c.strokeStyle=color;c.lineWidth=1.4;c.setLineDash(dash);c.beginPath();let drawing=false;
    for(const p of points){const v=get(p);if(v===null){drawing=false;continue;}const xx=x(p.issue),yy=y(v);drawing?c.lineTo(xx,yy):c.moveTo(xx,yy);drawing=true;}c.stroke();c.setLineDash([]);
  };
  if(model.hold)line(p=>p.current,'#ffba73',[3,3]);
  line(actual,'#d7e4ed');line(p=>p.predicted,'#5ddbc1');
  // Error dots use received target errors only. The guide is a target, never a censoring rule.
  const errors=points.map(error).filter(v=>v!==null), errorMax=Math.max(.5,...errors);
  const ey=v=>errorBottom-v/errorMax*(errorBottom-errorTop);
  c.strokeStyle='#253840';c.beginPath();c.moveTo(left,errorTop-13);c.lineTo(right,errorTop-13);c.stroke();
  c.fillStyle='#8296a4';c.textAlign='left';c.fillText('ABS. ERROR · ¢',left,errorTop-18);
  c.setLineDash([2,4]);c.strokeStyle='#b27b4b';c.beginPath();c.moveTo(left,ey(.25));c.lineTo(right,ey(.25));c.stroke();c.setLineDash([]);
  c.fillStyle='#b89779';c.textAlign='right';c.fillText('0.25',left-9,ey(.25)+3);
  for(const p of points){const e=error(p);if(e===null)continue;c.fillStyle=e>.25?'#ffba73':'#5ddbc1';c.beginPath();c.arc(x(p.issue),ey(e),1.7,0,Math.PI*2);c.fill();}
  c.fillStyle='#69808f';
  for(let i=0;i<3;i++){const t=xmin+(xmax-xmin)*i/2;c.textAlign=i===0?'left':i===2?'right':'center';c.fillText(timeAt(t).slice(0,8),x(t),h-7);}
  model.geometry={points,x,left,right,top,bottom,width:w,height:h};
  if(model.focused>=0 && model.focused<points.length){const p=points[model.focused],xx=x(p.issue);c.strokeStyle='#668a96';c.setLineDash([3,4]);c.beginPath();c.moveTo(xx,top);c.lineTo(xx,errorBottom);c.stroke();c.setLineDash([]);showTooltip(p,xx,w);}
  else $('chart-tip').hidden=true;
}
function showTooltip(p,x,width) {
  const next=model.target==='next', a=next?p.actual:p.oneActual, e=next?p.nextError:p.oneError, target=next?p.nextTime:p.oneTime, status=next?p.status:p.oneStatus;
  const tip=$('chart-tip');tip.hidden=false;
  tip.innerHTML=`<strong>Issued ${timeAt(p.issue)} UTC</strong><dl><dt>Current</dt><dd>${price(p.current)}</dd><dt>Predicted</dt><dd>${price(p.predicted)}</dd><dt>${next?'Next quote':'+1s actual'}</dt><dd>${price(a)}</dd><dt>Absolute error</dt><dd>${price(e)}</dd></dl><p class="tip-note">${escapeHtml(status.replaceAll('_',' '))}${target!==null?` · actual ${timeAt(target)}`:''}</p>`;
  tip.style.left=`${Math.max(3,Math.min(width-225,x+12))}px`;tip.style.top='8px';
}
function chartPointer(event) {
  const g=model.geometry;if(!g)return;
  const xx=event.clientX-$('price-chart').getBoundingClientRect().left;
  let best=0,distance=Infinity;
  g.points.forEach((p,i)=>{const d=Math.abs(g.x(p.issue)-xx);if(d<distance){best=i;distance=d;}});
  model.focused=best;drawChart();
}
async function poll() {
  let next=250;const view=model.view;
  try { const raw=await api(view?`run/${encodeURIComponent(view)}`:'state');if(view===model.view){connection(true);model.viewLoading=false;render(raw);}next=document.hidden || model.view?1000:250; }
  catch(e) {if(view===model.view){connection(false);model.viewLoading=false;$('updated-at').textContent='Connection interrupted · retrying';if(view)alertMessage(`Saved run unavailable: ${e.message}`);next=2000;controls();}}
  if(Date.now()>=model.nextHistoryAt)await refreshRuns();
  setTimeout(poll,next);
}
function renderCadence(summary) {
  if(!summary || !Array.isArray(summary.rows))return;
  $('cadence-panel').hidden=false;
  $('cadence-content').innerHTML=`<p>14 historical maps. Gaps are measured within each game; quote gaps are measured separately for each outcome. These archive intervals are not a fixed live API cadence, and the next arrival time is unknown when a forecast is issued.</p><div class="table-wrap"><table><thead><tr><th>Recorded stream</th><th>Median gap</th><th>p99 gap</th><th>Mean gap</th></tr></thead><tbody>${readableCadenceRows(summary.rows).map(row=>`<tr><td>${escapeHtml(row.label)}</td><td>${fixed(row.p50_ms,2)} ms</td><td>${fixed(row.p99_ms,2)} ms</td><td>${fixed(row.mean_ms,2)} ms</td></tr>`).join('')}</tbody></table></div><ul>${(summary.limitations || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}<li>Playback 1× means one second of captured run wall time per browser second. A recording captured at 100× advances archive time faster; worker timings are still the original measurements.</li></ul>`;
}
async function init() {
  model.view=normalizeRunId(new URLSearchParams(location.search).get('run'));
  renderRunChoices();
  $('run-view').addEventListener('change',()=>changeView($('run-view').value));
  $('refresh-runs').addEventListener('click',refreshRuns);
  $('session-form').addEventListener('submit',start);
  $('game').addEventListener('change',selectGame);
  $('pause').addEventListener('click',()=>command(model.snapshot?.status==='paused'?'resume':'pause'));
  $('stop').addEventListener('click',()=>command('stop'));
  $('playback-seek').addEventListener('change',()=>command('seek',{seconds:Number($('playback-seek').value)}));
  for(const id of ['download-records','download-summary'])$(id).addEventListener('click',async event=>{
    event.preventDefault();const link=$(id);if(!link.dataset.run)return;
    try{const blob=await replay.download(link.dataset.run,link.dataset.file),url=URL.createObjectURL(blob),anchor=document.createElement('a');
      anchor.href=url;anchor.download=`${link.dataset.run}-${link.dataset.file}`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch(error){alertMessage(error.message);}
  });
  $('paper-enabled').addEventListener('change',()=>{$('paper-fields').hidden=!$('paper-enabled').checked;});
  document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>setSpeed(Number(b.dataset.speed))));
  document.querySelectorAll('[data-target]').forEach(b=>b.addEventListener('click',()=>{model.target=b.dataset.target;model.focused=-1;document.querySelectorAll('[data-target]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawChart();}));
  document.querySelectorAll('[data-latency-population]').forEach(b=>b.addEventListener('click',()=>{model.latencyPopulation=b.dataset.latencyPopulation;document.querySelectorAll('[data-latency-population]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(model.snapshot)render(model.snapshot.raw);}));
  $('hold-toggle').addEventListener('click',()=>{model.hold=!model.hold;$('hold-toggle').setAttribute('aria-pressed',String(model.hold));drawChart();});
  $('price-chart').addEventListener('pointermove',chartPointer);
  $('price-chart').addEventListener('pointerleave',()=>{model.focused=-1;drawChart();});
  $('price-chart').addEventListener('keydown',e=>{const n=model.geometry?.points.length;if(!n)return;if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key))return;e.preventDefault();model.focused=e.key==='Escape'?-1:e.key==='Home'?0:e.key==='End'?n-1:Math.max(0,Math.min(n-1,model.focused+(e.key==='ArrowLeft'?-1:1)));drawChart();});
  new ResizeObserver(drawChart).observe($('price-chart'));
  try {
    const catalog=await api('catalog');
    model.savedRuns=catalog.runs||[];
    if(catalog.capabilities && (catalog.capabilities.model_horizon_ms!==1000 || catalog.capabilities.gameplay_delay_ms!==1000))throw new Error('The saved model timing does not match this dashboard.');
    model.games=(catalog.games || []).map(g=>{if(typeof g.game_id==='number' && !Number.isSafeInteger(g.game_id))throw new Error('Catalog game IDs must be lossless strings.');return {...g,game_id:String(g.game_id)};});
    $('game').replaceChildren(...model.games.map(g=>new Option(g.label || `${g.blue} vs ${g.red}`,g.game_id)));
    if(catalog.default_game_id!==undefined)$('game').value=String(catalog.default_game_id);
    connection(true);selectGame();
    if(!model.view && normalizeRunId(catalog.default_run_id)){model.view=catalog.default_run_id;updateViewUrl();}
    renderCadence(catalog.cadence_summary);
  } catch(e) {connection(false);alertMessage(`Catalog unavailable: ${e.message}`);$('game').replaceChildren(new Option('Catalog unavailable',''));}
  await refreshRuns();poll();
}
if(typeof document!=='undefined')init();
