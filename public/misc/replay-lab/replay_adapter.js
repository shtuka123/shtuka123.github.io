/* Decrypt and replay saved observations. No inference, trading or local API. */
export const STAGES = Object.freeze(['receive_to_forecast','queue','native_handler','forecast_ready',
  'decision_service','receive_to_decision','pacing_lag','pipeline_total']);
const clone = value => structuredClone(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const idPattern = /^run-[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}$/;
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);

export function validateCatalog(catalog) {
  if(catalog?.schema!=='seconds_hosted_replay_catalog_v1' || !Array.isArray(catalog.games) || !Array.isArray(catalog.runs) || !catalog.runs.length)
    throw new Error('Unsupported saved replay catalog.');
  const ids=new Set();
  for(const run of catalog.runs){
    if(!idPattern.test(run.run_id) || ids.has(run.run_id) || typeof run.game_id!=='string'
        || !['blue','red'].includes(run.side) || ![1,10,100].includes(run.recorded_speed)
        || !finite(run.playback_duration_ms) || run.playback_duration_ms<0
        || !/^runs\/[A-Za-z0-9_-]+\.bin$/.test(run.bundle)) throw new Error('Invalid recorded run metadata.');
    ids.add(run.run_id);
    if(!catalog.games.some(game=>typeof game.game_id==='string' && game.game_id===run.game_id))
      throw new Error('Saved run has no catalog game.');
  }
  return catalog;
}

export function validateBundle(bundle, expectedRun=null) {
  if(bundle?.schema!=='seconds_hosted_replay_bundle_v1' || !idPattern.test(bundle.run_id)
      || expectedRun!==null && bundle.run_id!==expectedRun || !Array.isArray(bundle.events)
      || !finite(bundle.playback_duration_ms) || bundle.playback_duration_ms<0
      || !Number.isSafeInteger(bundle.source_start_us) || !Number.isSafeInteger(bundle.source_stop_us)
      || bundle.source_stop_us<=bundle.source_start_us || ![1,10,100].includes(bundle.recorded_speed)
      || !bundle.final || bundle.final.run_id!==bundle.run_id)
    throw new Error('Unsupported saved replay bundle.');
  let previous=-1;
  for(const item of bundle.events){
    if(!finite(item.at_ms) || item.at_ms<previous || item.at_ms>bundle.playback_duration_ms
        || !item.record || !['arrival','quote','forecast','score','paper'].includes(item.record.type))
      throw new Error('Saved replay event order is invalid.');
    previous=item.at_ms;
  }
  if(bundle.journal_download && !/^journals\/[A-Za-z0-9_-]+\.bin$/.test(bundle.journal_download))
    throw new Error('Invalid saved journal location.');
  return bundle;
}

export function latencySummary(values) {
  if(!values.length)return {count:0};
  const ordered=[...values].sort((a,b)=>a-b);
  const quantile=p=>{const index=(ordered.length-1)*p,lo=Math.floor(index);
    return (ordered[lo]+(ordered[Math.min(lo+1,ordered.length-1)]-ordered[lo])*(index-lo))/1000;};
  return {count:values.length,mean_us:values.reduce((s,v)=>s+v,0)/values.length/1000,
    p50_us:quantile(.5),p95_us:quantile(.95),p99_us:quantile(.99),max_us:ordered.at(-1)/1000,
    ge_1ms:values.reduce((s,v)=>s+Number(v>=1_000_000),0)};
}

export function recordedLatencies(t) {
  const needed=['scheduled_ns','delivered_ns','enqueued_ns','dequeued_ns','handler_start_ns',
    'handler_stop_ns','published_ns','decision_done_ns'];
  if(needed.some(k=>!Number.isSafeInteger(t?.[k])))throw new Error('Recorded timing fields are missing.');
  const order=['delivered_ns','enqueued_ns','dequeued_ns','handler_start_ns','handler_stop_ns','published_ns','decision_done_ns'];
  if(order.some((k,i)=>i>0 && t[k]<t[order[i-1]]) || t.delivered_ns<t.scheduled_ns)
    throw new Error('Recorded timing order is invalid.');
  return {receive_to_forecast:t.published_ns-t.delivered_ns,queue:t.dequeued_ns-t.enqueued_ns,
    native_handler:t.handler_stop_ns-t.handler_start_ns,forecast_ready:t.published_ns-t.handler_stop_ns,
    decision_service:t.decision_done_ns-t.published_ns,receive_to_decision:t.decision_done_ns-t.delivered_ns,
    pacing_lag:t.delivered_ns-t.scheduled_ns,pipeline_total:t.published_ns-t.scheduled_ns};
}

class RecordedScores {
  constructor(){this.counts={};this.pending=0;this.valid=0;this.error=0;this.hold=0;this.timelyError=0;this.timelyHold=0;}
  apply(record){
    if(this.pending<=0)throw new Error('Score appeared before its recorded forecast.');
    this.pending--;this.counts[record.status]=(this.counts[record.status]||0)+1;
    if(record.absolute_error_cents!==null && record.absolute_error_cents!==undefined){
      if(!finite(record.absolute_error_cents) || !finite(record.hold_absolute_error_cents))throw new Error('Invalid saved error.');
      this.valid++;this.error+=record.absolute_error_cents;this.hold+=record.hold_absolute_error_cents;
      if(record.status==='scored'){this.timelyError+=record.absolute_error_cents;this.timelyHold+=record.hold_absolute_error_cents;}
    }
  }
  snapshot(){const timely=this.counts.scored||0;return {...this.counts,scored:timely,pending:this.pending,
    all_valid:this.valid,timely,mae_cents:this.valid?this.error/this.valid:null,
    hold_mae_cents:this.valid?this.hold/this.valid:null,timely_mae_cents:timely?this.timelyError/timely:null,
    timely_hold_mae_cents:timely?this.timelyHold/timely:null};}
}

export class RecordedReplayReducer {
  constructor(bundle){this.bundle=validateBundle(bundle);this.reset();}
  reset(){
    this.index=0;this.positionMs=0;this.received=0;this.processed=0;this.forecasts=0;this.unavailable=0;
    this.sourceUs=this.bundle.source_start_us;this.latestQuote=null;this.latestForecast=null;
    this.rows=[];this.bySequence=new Map();this.scored=new Set();this.forecastIds=new Set();
    this.queueDepth=0;this.highWatermark=0;
    this.scores={next_quote:new RecordedScores(),one_second:new RecordedScores()};
    this.latencies=Object.fromEntries(['all','forecasts','nonzero'].map(pop=>[pop,Object.fromEntries(STAGES.map(s=>[s,[]]))]));
    this.paper={enabled:this.bundle.config?.paper?.enabled===true,closed:false,
      config:clone(this.bundle.config?.paper||{}),cash_cents:this.bundle.config?.paper?.initial_cash_cents??null,
      position:0,marked_pnl_cents:null,mark_valid:false,counts:{},events:[],
      assumptions:{fill:'Saved paper events only; this page creates no orders or fills.',fees:'Original recorded policy only.'}};
    this.cachedMetrics=null;
  }
  apply(record){
    this.cachedMetrics=null;
    if(record.type==='arrival'){
      this.received++;this.sourceUs=record.source_us;this.queueDepth=record.queue_depth??0;
      this.highWatermark=Math.max(this.highWatermark,this.queueDepth);
    }else if(record.type==='quote'){
      this.latestQuote=clone(record);
    }else if(record.type==='forecast'){
      if(!Number.isSafeInteger(record.sequence) || this.forecastIds.has(record.sequence))throw new Error('Duplicate forecast identity.');
      this.forecastIds.add(record.sequence);this.processed++;
      const f=record.forecast,available=record.available===true;
      if(available && (!f || !finite(f.predicted_cents) || !finite(f.actual_current_cents)))throw new Error('Invalid saved forecast.');
      if(available){this.forecasts++;this.latestForecast=clone(f);for(const score of Object.values(this.scores))score.pending++;}
      else this.unavailable++;
      const times=recordedLatencies(record.timing),populations=['all',...(available?['forecasts']:[]),...(available&&f.change_cents!==0?['nonzero']:[])];
      for(const pop of populations)for(const name of STAGES)this.latencies[pop][name].push(times[name]);
      const row={sequence:record.sequence,source_us:record.source_us,issue_us:record.issue_us??record.source_us+1,
        actual_cents:available?f.actual_current_cents:null,current_cents:available?f.actual_current_cents:null,
        predicted_cents:available?f.predicted_cents:null,available,latency_us:times.receive_to_forecast/1000,
        next_quote:{status:available?'pending':'unavailable'},one_second:{status:available?'pending':'unavailable'}};
      this.rows.push(row);this.bySequence.set(row.sequence,row);
    }else if(record.type==='score'){
      const row=this.bySequence.get(record.forecast_id),key=record.metric+':'+record.forecast_id;
      if(!row?.available || !own(this.scores,record.metric) || this.scored.has(key))throw new Error('Orphan or repeated saved target.');
      this.scored.add(key);this.scores[record.metric].apply(record);row[record.metric]=clone(record);
    }else if(record.type==='paper'){
      const event=clone(record.event);if(!event || typeof event.type!=='string')throw new Error('Invalid recorded paper event.');
      this.paper.events.push(event);if(this.paper.events.length>200)this.paper.events.shift();
      const names={paper_order_submitted:'submitted',paper_fill:'filled',paper_signal_rejected:'rejected',
        paper_order_expired:'expired',paper_order_cancelled:'cancelled'};
      if(names[event.type]){const name=names[event.type];this.paper.counts[name]=(this.paper.counts[name]||0)+1;}
      if(finite(event.cash_cents))this.paper.cash_cents=event.cash_cents;
      if(Number.isSafeInteger(event.position))this.paper.position=event.position;
      if(event.type==='paper_ledger_finalized')this.paper.closed=true;
    }
  }
  seek(milliseconds){
    if(!finite(milliseconds))throw new Error('Finite playback offset required.');
    const target=Math.max(0,Math.min(this.bundle.playback_duration_ms,milliseconds));
    if(target<this.positionMs)this.reset();
    while(this.index<this.bundle.events.length && this.bundle.events[this.index].at_ms<=target)
      this.apply(this.bundle.events[this.index++].record);
    this.positionMs=target;return this;
  }
  metrics(){
    if(!this.cachedMetrics){
      const summarize=pop=>Object.fromEntries(STAGES.map(s=>[s,latencySummary(this.latencies[pop][s])]));
      this.cachedMetrics={latency:summarize('all'),latency_forecasts:summarize('forecasts'),
        latency_nonzero:summarize('nonzero'),next_quote:this.scores.next_quote.snapshot(),one_second:this.scores.one_second.snapshot()};
    }
    return clone(this.cachedMetrics);
  }
  snapshot(status='paused',playbackSpeed=1){
    const b=this.bundle,complete=this.positionMs>=b.playback_duration_ms;
    return {schema:'seconds_hosted_replay_state_v1',status,run_id:b.run_id,historical_only:true,
      hosted_saved_replay:true,game:clone(b.game),side:b.config.side,speed:playbackSpeed,
      model_kind:b.config.model_kind||'current_one_second',
      recorded_source_speed:b.recorded_speed,config:{...clone(b.config),speed:playbackSpeed,
        seek_seconds:this.positionMs/1000,duration_seconds:b.playback_duration_ms/1000},
      server:{worker_active:status==='running'||status==='paused',historical_only:true,model_running:false},
      progress:{received:this.received,processed:this.processed,total:b.final.progress.total,
        forecasts:this.forecasts,unavailable:this.unavailable,source_us:this.sourceUs,
        source_elapsed_seconds:(this.sourceUs-b.source_start_us)/1e6,duration_seconds:(b.source_stop_us-b.source_start_us)/1e6,
        warmup_updates:b.final.progress.warmup_updates},
      playback:{position_ms:this.positionMs,duration_ms:b.playback_duration_ms,speed:playbackSpeed,
        clock:'captured run wall time',recorded_source_speed:b.recorded_speed},
      queue:{depth:complete?0:this.queueDepth,capacity:b.final.queue.capacity,high_watermark:this.highWatermark,
        blocked_count:complete?b.final.queue.blocked_count:null,recorded:true},
      latest_quote:clone(this.latestQuote),latest_forecast:clone(this.latestForecast),
      series:this.rows.slice(-500).map(clone),metrics:this.metrics(),
      paper:complete?{...clone(b.final.paper),recorded_only:true}:clone(this.paper),
      scenario:{model_horizon_ms:b.config.model_kind==='next_quote'?null:1000,
        forecast_target:b.config.model_kind==='next_quote'?'next_received_own_bbo':'midpoint_at_plus_one_second',
        gameplay_delay_ms:1000,new_inference:false,new_orders:false},error:null};
  }
}

export class HostedReplayApi {
  constructor({baseUrl=new URL('./data/',import.meta.url),fetcher=globalThis.fetch.bind(globalThis),
    now=()=>performance.now(),fragment=()=>globalThis.location?.hash||''}={}){
    this.baseUrl=baseUrl;this.fetcher=fetcher;this.now=now;this.fragment=fragment;
    this.key=null;this.catalog=null;this.bundleCache=new Map();this.current=null;this.status='idle';
    this.speed=1;this.anchorMs=0;this.anchorWall=0;this.endMs=0;
  }
  async decrypt(path,asJson=true){
    if(!/^(catalog\.bin|runs\/[A-Za-z0-9_-]+\.bin|journals\/[A-Za-z0-9_-]+\.bin)$/.test(path))
      throw new Error('Unsupported encrypted artifact path.');
    if(!this.key){
      const key=new URLSearchParams(this.fragment().replace(/^#/, '')).get('key')||'';
      if(!/^[A-Za-z0-9_-]{43}$/.test(key))throw new Error('Open the complete shared link, including its unlock fragment.');
      const bytes=Uint8Array.from(atob(key.replaceAll('-','+').replaceAll('_','/')+'='),c=>c.charCodeAt(0));
      this.key=await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['decrypt']);
    }
    const response=await this.fetcher(new URL(path,this.baseUrl),{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw new Error(`Saved artifact request failed (${response.status}).`);
    const blob=new Uint8Array(await response.arrayBuffer());
    if(blob.length<28)throw new Error('Encrypted artifact is truncated.');
    let plain;
    try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:blob.subarray(0,12)},this.key,blob.subarray(12));}
    catch{throw new Error('The shared link could not unlock this saved replay.');}
    const decoded=new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip')));
    return asJson?decoded.json():decoded.arrayBuffer();
  }
  async getCatalog(){
    if(!this.catalog)this.catalog=validateCatalog(await this.decrypt('catalog.bin'));
    return this.catalog;
  }
  async load(runId){
    const catalog=await this.getCatalog(),meta=catalog.runs.find(r=>r.run_id===runId);
    if(!meta)throw new Error('This saved run is not in the shared catalog.');
    if(!this.bundleCache.has(runId)){
      const bundle=validateBundle(await this.decrypt(meta.bundle),runId);
      if(bundle.recorded_speed!==meta.recorded_speed || bundle.playback_duration_ms!==meta.playback_duration_ms
          || bundle.game?.game_id!==meta.game_id || bundle.config?.side!==meta.side)
        throw new Error('Catalog and recorded run contract differ.');
      if(this.bundleCache.size>=2)this.bundleCache.delete(this.bundleCache.keys().next().value);
      this.bundleCache.set(runId,bundle);
    }
    return this.bundleCache.get(runId);
  }
  tick(){
    if(this.current && this.status==='running'){
      const position=Math.min(this.endMs,this.anchorMs+Math.max(0,this.now()-this.anchorWall)*this.speed);
      this.current.seek(position);
      if(position>=this.endMs)this.status=position>=this.current.bundle.playback_duration_ms?'completed':'stopped';
    }
  }
  state(){this.tick();return this.current?this.current.snapshot(this.status,this.speed):
    {status:'idle',run_id:null,historical_only:true,hosted_saved_replay:true,metrics:{},series:[],paper:{enabled:false}};}
  async handle(path,data){
    const catalog=await this.getCatalog();
    if(path==='catalog')return {...clone(catalog),games:catalog.games.filter(g=>catalog.runs.some(r=>r.game_id===g.game_id)),
      capabilities:{model_target_by_recording:true,gameplay_delay_ms:1000,historical_only:true,new_inference:false,live_orders:false}};
    if(path==='runs')return {runs:catalog.runs.map(r=>({run_id:r.run_id,status:'saved',label:r.label,model_kind:r.model_kind||'current_one_second',
      config:{game_id:r.game_id,side:r.side,speed:r.recorded_speed,paper:{enabled:r.paper_enabled===true}}}))};
    if(path==='state')return this.state();
    if(path.startsWith('run/')){
      const id=decodeURIComponent(path.slice(4));
      if(this.current?.bundle.run_id!==id){this.current=new RecordedReplayReducer(await this.load(id));this.current.seek(0);this.status='paused';this.endMs=this.current.bundle.playback_duration_ms;}
      return this.state();
    }
    if(path!=='control' || !data)throw new Error('This static viewer only supports saved playback.');
    this.tick();
    if(data.action==='start'){
      if(![1,10,100].includes(data.speed??1))throw new Error('Choose playback speed1x,10x or100x.');
      const side=data.side===1||data.side==='red'?'red':'blue';
      const meta=data.run_id?catalog.runs.find(r=>r.run_id===data.run_id):
        catalog.runs.find(r=>r.game_id===String(data.game_id)&&r.side===side);
      if(!meta)throw new Error('No recorded run exists for this game and outcome.');
      const bundle=await this.load(meta.run_id);
      const offset=Number(data.seek_seconds??0)*1000,requested=data.duration_seconds==null?null:Number(data.duration_seconds)*1000;
      if(!finite(offset)||offset<0||offset>=bundle.playback_duration_ms||requested!==null&&(!finite(requested)||requested<=0))
        throw new Error('Choose a seek/duration inside the recorded wall-time span.');
      this.current=new RecordedReplayReducer(bundle);this.current.seek(offset);this.speed=data.speed??1;
      this.anchorMs=offset;this.anchorWall=this.now();this.endMs=Math.min(bundle.playback_duration_ms,requested===null?Infinity:offset+requested);
      this.status='running';return this.state();
    }
    if(!this.current)throw new Error('Choose a saved run first.');
    if(data.action==='speed'){
      if(![1,10,100].includes(data.speed))throw new Error('Choose playback speed1x,10x or100x.');
      this.anchorMs=this.current.positionMs;this.anchorWall=this.now();this.speed=data.speed;return this.state();
    }
    if(data.action==='pause'){this.status='paused';return this.state();}
    if(data.action==='resume'){this.anchorMs=this.current.positionMs;this.anchorWall=this.now();this.status='running';return this.state();}
    if(data.action==='stop'){this.status='stopped';return this.state();}
    if(data.action==='seek'){
      const seconds=Number(data.seconds);if(!finite(seconds))throw new Error('Finite playback offset required.');
      // Preserve the exact endpoint even when seconds→milliseconds rounds down by one ULP.
      const target=seconds>=this.endMs/1000?this.endMs:seconds*1000;
      this.current.seek(Math.min(target,this.endMs));this.anchorMs=this.current.positionMs;this.anchorWall=this.now();
      if(this.status==='completed')this.status='paused';return this.state();
    }
    throw new Error('No new model, configuration or order operation is available.');
  }
  async download(runId,file){
    const bundle=await this.load(runId);
    if(file==='final.json')return new Blob([JSON.stringify(bundle.final,null,2)],{type:'application/json'});
    if(file!=='records.jsonl')throw new Error('Unsupported saved download.');
    const raw=bundle.journal_download?await this.decrypt(bundle.journal_download,false):
      bundle.events.map(x=>JSON.stringify(x.record)).join('\n')+'\n';
    return new Blob([raw],{type:'application/x-ndjson'});
  }
}
