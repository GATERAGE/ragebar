/* ragebar-immersive (RAGE plugin 1.5.0) — built from GATERAGE/ragebar wordpress/ragebar-immersive.html by tools/build-plugin.mjs. Edit the widget, not this file. */
(function(){
  if(window.__ragebarImmersive) return; window.__ragebarImmersive=1; window.__ragebar=1;
  var VERSION='1.3.0', cfg=window.RAGEBAR||{}, RS=typeof cfg.search==='string'?cfg.search.replace(/\/+$/,''):'https://deltaverse.pythai.net/ragesearch';
  var LEGS=[['bm25','words'],['dense','meaning'],['atlas','atlas'],['wp','wordpress'],['persona','persona']], CORPORA=[['articles','articles'],['self',"RAGE's own"],['deltaverse','DeltaVerse'],['all','all']], KS=[5,10,20];
  var V={legs:{bm25:true,dense:true,atlas:true,wp:true,persona:true},corpus:'articles',k:10,panel:false,persona:'rage'};
  try{ var sv=JSON.parse(localStorage.getItem('ragebar_vars')||'null'); if(sv){ if(sv.legs) for(var l in V.legs) if(l in sv.legs) V.legs[l]=!!sv.legs[l]; if(sv.corpus) V.corpus=sv.corpus; if(sv.k) V.k=+sv.k; V.panel=!!sv.panel; if(sv.persona) V.persona=sv.persona; } }catch(e){}
  function keep(){ try{ localStorage.setItem('ragebar_vars',JSON.stringify(V)); }catch(e){} }
  function h(tag,attrs,kids){ var el=document.createElement(tag); if(attrs) for(var k in attrs){ if(k==='text') el.textContent=attrs[k]; else if(k==='on') for(var ev in attrs.on) el.addEventListener(ev,attrs.on[ev]); else el.setAttribute(k,attrs[k]); }
    (kids||[]).forEach(function(c){ if(c!=null) el.appendChild(typeof c==='string'?document.createTextNode(c):c); }); return el; }
  function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }
  /* ── the stage ── */
  var cv=h('canvas',{'class':'ri-sparks','aria-hidden':'true'});
  var q=h('input',{'class':'ri-q',type:'search',autocomplete:'off',spellcheck:'false','aria-label':'ask RAGE'});
  var termBtn=h('button',{'class':'ri-btn',type:'button',title:'T — the control panel: RAGE variables, diagnostics, STOP, CLEAR','aria-pressed':'false','aria-label':'control panel',text:'T'});
  var spawnBtn=h('button',{'class':'ri-btn',type:'button',title:'❏ spawn a response window with these results','aria-label':'spawn a response window',text:'❏'});
  var homeBtn=h('button',{'class':'ri-btn',type:'button',title:'⌂ call every response window home','aria-label':'call the response windows home',text:'⌂'});
  var eyeBtn=h('button',{'class':'ri-btn ri-organ',type:'button',title:"👁 the camera: on, and the camera.control.panel · drag it onto Jaimla's faice and her eyes are the camera",'aria-label':'camera',text:'👁'});
  var earBtn=h('button',{'class':'ri-btn ri-organ',type:'button',title:"👂 the microphone: on, and the audio.control.panel · drag it onto Jaimla's faice and her ears are the microphone",'aria-label':'microphone',text:'👂'});
  var netBtn=h('button',{'class':'ri-btn',type:'button',title:'⇄ networking.tools: every service RAGE uses, timed','aria-label':'networking tools',text:'⇄'});
  var camPanel=h('div',{'class':'ri-dev',role:'region','aria-label':'camera.control.panel'}), audPanel=h('div',{'class':'ri-dev',role:'region','aria-label':'audio.control.panel'}), netPanel=h('div',{'class':'ri-dev',role:'region','aria-label':'networking.tools'}), fzPanel=h('div',{'class':'ri-dev ri-fz',role:'region','aria-label':"Jaimla's faice"});
  var panel=h('div',{'class':'ri-panel',role:'region','aria-label':'RAGE control panel'}), diag=h('div',{'class':'ri-diag'});
  var mRage=h('button',{type:'button','aria-pressed':'true',title:'RAGE mode: search, and the control panel is the RAGE panel',text:'RAGE'}), mAtlas=h('button',{type:'button','aria-pressed':'false',title:'atlas: walk every article as a path (the rage menu)',text:'atlas'});
  var modeRow=h('span',{'class':'ri-mode',role:'group','aria-label':'mode'},[mRage,mAtlas]);
  var dvEl=h('a',{'class':'ri-dv',href:'https://deltaverse.pythai.net/',target:'_blank',rel:'noopener',title:'the DeltaVerse substrate sequence, counted live from engine/ngn/substrate-sequence.json',text:'DeltaVerse ◇ …'});
  var rolo=h('div',{'class':'ri-rolo',tabindex:'0',role:'listbox','aria-label':'personas: drop a .persona on the field to add one'});
  var xBtn=h('button',{'class':'ri-btn',type:'button','aria-label':'close RAGE search',text:'esc ×'});
  var vars=h('div',{'class':'ri-vars',role:'group','aria-label':'RAGE variables'});
  var fill=h('i'), status=h('span',{text:''});
  var hint=h('div',{'class':'ri-hint',text:''});
  var field=h('div',{'class':'ri-field'},[h('div',{'class':'ri-bar'},[h('span',{'class':'ri-dot'}),h('b',{text:'RAGE'}),modeRow,h('span',{'class':'ri-sp'}),dvEl,termBtn,eyeBtn,earBtn,netBtn,spawnBtn,homeBtn,xBtn]),q,rolo,h('div',{'class':'ri-meter'},[h('span',{'class':'ri-bar2'},[fill]),status]),hint,panel,fzPanel,camPanel,audPanel,netPanel]);
  var legsEl=h('div',{'class':'ri-legs','aria-live':'polite'}), log=h('div',{'class':'ri-term-log','aria-live':'polite'}), list=h('ol',{'class':'ri-results','aria-label':'results'});
  var foot=h('div',{'class':'ri-foot'},['ragebar immersive '+VERSION+' · RAGE search to the ',h('a',{href:'https://github.com/GATERAGE/ragebar/blob/main/RAGESEARCH.md',target:'_blank',rel:'noopener',text:'ragesearch/1 standard'}),' · variables after ',h('a',{href:'https://github.com/Professor-Codephreak/ultimate-input-field',target:'_blank',rel:'noopener',text:'ultimate-input-field'}),' · ',h('a',{href:'/ragebar/',text:'the ragebar page'})]);
  var trailEl=h('div',{'class':'ri-trail','aria-label':'the trail you have travelled (shared with the rage menu)'});
  var stage=h('div',{'class':'ri-stage'},[field,legsEl,log,trailEl,list,foot]);
  var box=h('div',{'class':'ri'+(cfg.backdrop==='clear'?' ri-clear':''),role:'dialog','aria-modal':cfg.backdrop==='clear'?'false':'true','aria-label':'RAGE search'},[h('div',{'class':'ri-back'}),cv,stage]);
  function mount(){ if(!box.parentNode) document.body.appendChild(box); }
  /* ── the variables: chips, after ultimate-input-field's action buttons ── */
  var stopBtn=h('button',{'class':'ri-btn ri-stop',type:'button',text:'STOP',title:'stop every request in flight',on:{click:function(){ stop(); }}});
  var clearBtn=h('button',{'class':'ri-btn',type:'button',text:'CLEAR',title:'clear the results, the log and every response window',on:{click:function(){ clearAll(); }}});
  panel.appendChild(h('h4',{text:'RAGE · variables'})); panel.appendChild(vars);
  panel.appendChild(h('h4',{text:'diagnostics'})); panel.appendChild(diag);
  panel.appendChild(h('h4',{text:'actions'})); panel.appendChild(h('div',{'class':'ri-acts'},[stopBtn,clearBtn]));
  function paintVars(){ clear(vars);
    vars.appendChild(h('span',{'class':'ri-lab',text:'legs'}));
    LEGS.forEach(function(L){ var on=V.legs[L[0]]; vars.appendChild(h('button',{'class':'ri-chip',type:'button','aria-pressed':on?'true':'false',title:{bm25:'BM25 over full text',dense:'meaning: mindX pgvectorscale',atlas:'the atlas phrase',wp:'WordPress search (this browser)'}[L[0]],text:L[1],on:{click:function(){ V.legs[L[0]]=!V.legs[L[0]]; if(!anyLeg()) V.legs[L[0]]=true; keep(); paintVars(); rerun(); }}})); });
    vars.appendChild(h('span',{'class':'ri-lab',text:'corpus'}));
    CORPORA.forEach(function(C){ vars.appendChild(h('button',{'class':'ri-chip',type:'button','aria-pressed':V.corpus===C[0]?'true':'false',text:C[1],on:{click:function(){ V.corpus=C[0]; keep(); paintVars(); rerun(); }}})); });
    vars.appendChild(h('span',{'class':'ri-lab',text:'k'}));
    KS.forEach(function(n){ vars.appendChild(h('button',{'class':'ri-chip',type:'button','aria-pressed':V.k===n?'true':'false',text:String(n),on:{click:function(){ V.k=n; keep(); paintVars(); rerun(); }}})); });
    termBtn.setAttribute('aria-pressed',V.panel?'true':'false'); field.classList.toggle('ri-panel-on',V.panel);
    q.placeholder='ask RAGE: words and meaning…  (:help)';
    hint.textContent='legs '+LEGS.filter(function(L){ return V.legs[L[0]]; }).map(function(L){ return L[1]; }).join(' · ')+' · corpus '+V.corpus+' · k '+V.k+'  —  Enter opens the first result · ↓ walks them · ❏ spawns a window · T control panel · Esc closes'; }
  function anyLeg(){ for(var l in V.legs) if(V.legs[l]) return true; return false; }
  termBtn.addEventListener('click',function(){ V.panel=!V.panel; keep(); paintVars(); if(V.panel) diagnose(); q.focus(); });
  /* ── diagnostics: what the service says about itself (GET /health) ── */
  function diagnose(){ clear(diag); diag.appendChild(h('span',{text:'service'})); diag.appendChild(h('span',{text:RS||'not configured'}));
    if(!RS) return; var t0=Date.now();
    fetch(RS+'/health').then(function(r){ return r.ok?r.json():null; },function(){ return null; }).then(function(d){
      var rows=d?[['standard',d.standard+' '+d.version],['documents',Object.keys(d.documents||{}).map(function(k){ return k+' '+d.documents[k]; }).join(' · ')],
        ['passages',Object.keys(d.passages||{}).map(function(k){ return k+' '+d.passages[k]; }).join(' · ')],
        ['meaning covers',Object.keys(d.dense_documents||{}).map(function(k){ return k+' '+d.dense_documents[k]; }).join(' · ')||'nothing embedded yet'],
        ['model',d.model+' · '+d.dims+' d'],['query vectors',d.query_vectors_cached+' cached · '+d.embedding_now+' embedding now'],
        ['last ingest',(d.ingest&&d.ingest.last_run||'never')+((d.ingest&&d.ingest.errors&&d.ingest.errors.length)?' · '+d.ingest.errors[0]:'')],['read',(Date.now()-t0)+' ms, now']]:[['verdict','unavailable']];
      rows.forEach(function(r){ diag.appendChild(h('span',{text:r[0]})); diag.appendChild(h('span',{'class':r[0]==='verdict'?'ri-bad':'',text:String(r[1])})); }); }); }
  /* ── sparks: the rage, full screen ── */
  var ctx=cv.getContext&&cv.getContext('2d'), sparks=[], heat=0, raf=0, reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function size(){ var d=Math.min(window.devicePixelRatio||1,2); cv.width=innerWidth*d; cv.height=innerHeight*d; }
  function spark(n,red){ if(reduce||!ctx) return; var r=field.getBoundingClientRect(), d=Math.min(window.devicePixelRatio||1,2);
    for(var i=0;i<n;i++) sparks.push({x:(r.left+Math.random()*r.width)*d,y:(r.bottom-4)*d,vx:(Math.random()-.5)*3,vy:-(.6+Math.random()*2.6),l:1,c:red?'#ff3b30':(Math.random()<.12?'#ffb340':'#3ddc84')});
    heat=Math.min(1,heat+n/50); if(!raf) raf=requestAnimationFrame(draw); }
  function draw(){ raf=0; if(!cv.width) return; ctx.clearRect(0,0,cv.width,cv.height); heat*=.975;
    for(var i=sparks.length-1;i>=0;i--){ var s=sparks[i]; s.x+=s.vx; s.y+=s.vy; s.vy+=.025; s.l-=.018; if(s.l<=0){ sparks.splice(i,1); continue; } ctx.globalAlpha=s.l*.9; ctx.fillStyle=s.c; ctx.fillRect(s.x,s.y,2.4,2.4); }
    ctx.globalAlpha=1; if(sparks.length||heat>.01) raf=requestAnimationFrame(draw); }
  function meter(v,red,txt){ fill.style.width=Math.round(Math.max(0,Math.min(1,v))*100)+'%'; field.classList.toggle('ri-red',!!red); field.classList.toggle('ri-lit',!red&&v>0); if(txt!=null) status.textContent=txt; }
  /* ── open / close ── */
  var isOpen=false, back=null;
  function open(seed){ mount(); if(!isOpen){ isOpen=true; back=document.activeElement; box.classList.remove('ri-closing'); box.classList.add('ri-open'); document.documentElement.style.overflow='hidden'; size(); paintVars(); spark(24); }
    substrates(); paintRolo(); loadBuilt(current()); atlasLoad().then(paintTrail,function(){}); if(V.panel) diagnose(); if(seed!=null&&seed!==''&&q.value!==seed){ q.value=seed; rerun(); } setTimeout(function(){ try{ q.focus({preventScroll:true}); }catch(e){} },30); }
  function close(){ if(!isOpen) return; isOpen=false; if(cam.stream) camOff(); if(mic.stream) micOff(); faceHide(); box.classList.add('ri-closing'); document.documentElement.style.overflow='';
    setTimeout(function(){ if(!isOpen) box.classList.remove('ri-open','ri-closing'); },reduce?0:180); try{ back&&back.focus&&back.focus({preventScroll:true}); }catch(e){} }
  xBtn.addEventListener('click',close);
  box.addEventListener('pointerdown',function(e){ if(e.target===stage||e.target.classList.contains('ri-back')) close(); });
  window.addEventListener('resize',function(){ if(isOpen) size(); });
  document.addEventListener('keydown',function(e){ var t=e.target, typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);
    if(e.key==='Escape'&&isOpen){ e.preventDefault(); close(); }
    else if(e.key==='/'&&!typing&&!isOpen){ e.preventDefault(); open(''); }
    else if(cfg.typeToOpen&&!typing&&!isOpen&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&/\S/.test(e.key)){ e.preventDefault(); open(''); q.value=e.key; } });
  if(cfg.open) setTimeout(function(){ open(''); },400);
  // the theme's header search and the /ragebar/ page's field open the stage instead of their own box
  function hook(inp){ if(!inp||inp.__ri) return; inp.__ri=1;
    inp.addEventListener('focus',function(){ var v=inp.value; inp.blur(); open(v); });
    inp.addEventListener('input',function(){ var v=inp.value; inp.value=''; open(v); }); }
  function hookAll(){ hook(document.getElementById('head-search-input')); hook(document.getElementById('ragebar-input'));
    Array.prototype.forEach.call(document.querySelectorAll('.head-search-trigger,[data-ragebar-open]'),function(a){ if(a.__ri) return; a.__ri=1; a.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); open(''); },true); }); }
  hookAll(); document.addEventListener('DOMContentLoaded',hookAll); window.addEventListener('load',hookAll);
  /* ── DeltaVerse awareness: the substrate count, read live (its first 4 KB carry total and bundleCount) ── */
  var DVSEQ='https://deltaverse.pythai.net/engine/ngn/substrate-sequence.json';
  function substrates(){ var c=null; try{ c=JSON.parse(sessionStorage.getItem('ragebar_dv')||'null'); }catch(e){}
    var show=function(x){ dvEl.textContent='DeltaVerse ◇ '+x.total.toLocaleString()+' substrates · '+x.bundles+' bundles'; dvEl.title='the DeltaVerse substrate sequence v'+x.v+', counted live from '+DVSEQ; };
    if(c&&c.total){ show(c); return; }
    fetch(DVSEQ,{headers:{Range:'bytes=0-4095'}}).then(function(r){ return r.ok?r.text():Promise.reject(r.status); }).then(function(t){
      var tot=t.match(/"total"\s*:\s*(\d+)/), b=t.match(/"bundleCount"\s*:\s*(\d+)/), v=t.match(/"version"\s*:\s*"([^"]+)"/); if(!tot) throw 'no total';
      var x={total:+tot[1],bundles:b?+b[1]:'?',v:v?v[1]:'?'}; try{ sessionStorage.setItem('ragebar_dv',JSON.stringify(x)); }catch(e){} show(x); })
      .catch(function(){ dvEl.textContent='DeltaVerse ◇ count unavailable'; }); }
  /* ── devices: 👁 camera.control.panel · 👂 audio.control.panel · ⇄ networking.tools ── */
  var DV=(typeof cfg.deltaverse==='string'?cfg.deltaverse:'https://deltaverse.pythai.net').replace(/\/+$/,'');
  function kv(el,rows){ clear(el); rows.forEach(function(r){ el.appendChild(h('span',{text:r[0]})); el.appendChild(h('span',{'class':r[2]||'',text:String(r[1])})); }); }
  function devSelect(kind,cur,onpick){ var sel=h('select',{'aria-label':kind==='videoinput'?'camera':'microphone'});
    if(navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices) navigator.mediaDevices.enumerateDevices().then(function(ds){ clear(sel); ds.filter(function(d){ return d.kind===kind; }).forEach(function(d,i){ var o=h('option',{value:d.deviceId,text:d.label||((kind==='videoinput'?'camera ':'microphone ')+(i+1))}); if(d.deviceId===cur) o.selected=true; sel.appendChild(o); }); });
    sel.addEventListener('change',function(){ onpick(sel.value); }); return sel; }
  // the camera
  var cam={stream:null,video:null,mirror:true,face:null,raf:0,dev:''}, camRead=h('div',{'class':'ri-diag'});
  function camOff(){ if(cam.raf) cancelAnimationFrame(cam.raf); cam.raf=0; if(cam.stream) cam.stream.getTracks().forEach(function(t){ t.stop(); }); cam.stream=null; eyeBtn.classList.remove('ri-live'); camPanel.classList.remove('ri-show'); fz.eyes=false; faceDevices(); say('camera off'); }
  function camOn(dev,quiet){ if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ say('this browser offers no camera here'); return; }
    if(cam.stream) cam.stream.getTracks().forEach(function(t){ t.stop(); });
    navigator.mediaDevices.getUserMedia({video:dev?{deviceId:{exact:dev}}:{facingMode:'user'},audio:false}).then(function(st){ cam.stream=st; cam.dev=(st.getVideoTracks()[0].getSettings()||{}).deviceId||dev||''; eyeBtn.classList.add('ri-live'); paintCam(); if(!quiet) camPanel.classList.add('ri-show'); faceDevices(); if(fz.eyes) say("Jaimla's eyes are the camera"); })
      .catch(function(e){ say('the camera did not open: '+(e.name||e.message||e)); }); }
  function paintCam(){ clear(camPanel); cam.video=h('video',{'class':cam.mirror?'ri-mirror':'',autoplay:'',muted:'',playsinline:''}); cam.video.muted=true; cam.video.srcObject=cam.stream; try{ cam.video.play(); }catch(e){}
    var t=cam.stream&&cam.stream.getVideoTracks()[0], st=t&&t.getSettings?t.getSettings():{};
    camPanel.appendChild(h('h4',{text:'camera.control.panel'})); camPanel.appendChild(cam.video);
    camPanel.appendChild(h('div',{'class':'ri-acts'},[devSelect('videoinput',cam.dev,camOn),
      h('button',{'class':'ri-btn',type:'button','aria-pressed':cam.mirror?'true':'false',text:'mirror',on:{click:function(){ cam.mirror=!cam.mirror; paintCam(); }}}),
      h('button',{'class':'ri-btn',type:'button','aria-pressed':cam.face?'true':'false',title:"ollywoo's faicey: MediaPipe FaceLandmarker, about 30 MB, loaded once from "+DV,text:'◉ faicey',on:{click:function(){ cam.face?faceOff():faceOn(); }}}),
      h('button',{'class':'ri-btn ri-stop',type:'button',text:'camera OFF',on:{click:camOff}})]));
    camPanel.appendChild(camRead); kv(camRead,[['camera',(t&&t.label)||'on'],['frame',(st.width||'?')+' × '+(st.height||'?')+(st.frameRate?' · '+Math.round(st.frameRate)+' fps':'')],['faicey',cam.face?'reading the face…':'off — ◉ faicey reads presence, distance, head pose and expression']]);
    camPanel.appendChild(h('div',{'class':'ri-note',text:'The picture stays in this browser. faicey runs here too: its model is downloaded, your face is not uploaded.'})); }
  function faceOn(){ cam.face='loading'; paintCam(); kv(camRead,[['faicey','loading MediaPipe from '+DV+' …']]);
    import(DV+'/ollywoo/faicey.js').then(function(F){ return F.initFaicey().then(function(){ return F; }); }).then(function(F){ cam.face=F; paintCam();
      (function loop(){ cam.raf=requestAnimationFrame(loop); if(!cam.video||!cam.face||cam.face==='loading') return; var r=F.detect(cam.video,performance.now()); if(!r) return;
        if(!r.present){ kv(camRead,[['face','not in view']]); return; }
        var bs=Object.keys(r.blendshapes||{}).map(function(k){ return [k,r.blendshapes[k]]; }).filter(function(x){ return x[0]!=='_neutral'; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,4);
        var deg=function(x){ return x==null?'?':Math.round(x*180/Math.PI)+'°'; }, P=r.pose||{};
        kv(camRead,[['face','present'+(r.faces>1?' · '+r.faces+' faces':''),'ri-ok'],['distance','≈ '+r.distance_m+' m · proximity '+r.proximity.toFixed(2)],['head','yaw '+deg(P.yaw!=null?P.yaw:P.y)+' · pitch '+deg(P.pitch!=null?P.pitch:P.x)+' · roll '+deg(P.roll!=null?P.roll:P.z)],['expression',bs.map(function(x){ return x[0]+' '+x[1].toFixed(2); }).join(' · ')]]); })(); })
      .catch(function(e){ cam.face=null; paintCam(); kv(camRead,[['faicey','could not load: '+(e.message||e),'ri-bad']]); }); }
  function faceOff(){ if(cam.raf) cancelAnimationFrame(cam.raf); cam.raf=0; cam.face=null; paintCam(); }
  eyeBtn.addEventListener('click',function(){ if(Date.now()-(eyeBtn._dragged||0)<500) return; if(!cam.stream) camOn(''); else camPanel.classList.toggle('ri-show'); });
  // the microphone
  var mic={stream:null,ctx:null,an:null,raf:0,rec:null,voice:null,dev:''}, micRead=h('div',{'class':'ri-diag'}), scope=h('canvas',{'class':'ri-scope','aria-hidden':'true'});
  var Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
  function micOff(){ if(mic.raf) cancelAnimationFrame(mic.raf); mic.raf=0; if(mic.rec){ try{ mic.rec.stop(); }catch(e){} mic.rec=null; } if(mic.stream) mic.stream.getTracks().forEach(function(t){ t.stop(); }); mic.stream=null;
    if(mic.ctx){ try{ mic.ctx.close(); }catch(e){} mic.ctx=null; } earBtn.classList.remove('ri-live'); audPanel.classList.remove('ri-show'); fz.ears=false; faceDevices(); say('microphone off'); }
  function micOn(dev,quiet){ if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ say('this browser offers no microphone here'); return; }
    if(mic.stream) mic.stream.getTracks().forEach(function(t){ t.stop(); });
    navigator.mediaDevices.getUserMedia({audio:dev?{deviceId:{exact:dev}}:true,video:false}).then(function(st){ mic.stream=st; mic.dev=(st.getAudioTracks()[0].getSettings()||{}).deviceId||dev||''; earBtn.classList.add('ri-live');
      try{ var AC=window.AudioContext||window.webkitAudioContext; if(mic.ctx) mic.ctx.close(); mic.ctx=new AC(); mic.an=mic.ctx.createAnalyser(); mic.an.fftSize=1024; mic.ctx.createMediaStreamSource(st).connect(mic.an); }catch(e){ mic.an=null; }
      paintAud(); if(!quiet) audPanel.classList.add('ri-show'); drawScope(); faceDevices(); if(fz.ears) say("Jaimla's ears are the microphone"); }).catch(function(e){ say('the microphone did not open: '+(e.name||e.message||e)); }); }
  function drawScope(){ if(mic.raf) cancelAnimationFrame(mic.raf); var c=scope.getContext&&scope.getContext('2d'); if(!c||!mic.an) return; var buf=new Uint8Array(mic.an.fftSize);
    (function loop(){ mic.raf=requestAnimationFrame(loop); var w=scope.width=scope.clientWidth||300, hh=scope.height=56; mic.an.getByteTimeDomainData(buf); var peak=0;
      c.clearRect(0,0,w,hh); c.strokeStyle='#3ddc84'; c.lineWidth=1.5; c.beginPath(); for(var i=0;i<buf.length;i++){ var v=(buf[i]-128)/128; peak=Math.max(peak,Math.abs(v)); var x=i/buf.length*w, y=hh/2+v*hh/2; if(i) c.lineTo(x,y); else c.moveTo(x,y); } c.stroke();
      if(peak>.2) spark(1); })(); }
  function paintAud(){ clear(audPanel); var t=mic.stream&&mic.stream.getAudioTracks()[0], st=t&&t.getSettings?t.getSettings():{};
    audPanel.appendChild(h('h4',{text:'audio.control.panel'})); audPanel.appendChild(scope);
    audPanel.appendChild(h('div',{'class':'ri-acts'},[devSelect('audioinput',mic.dev,micOn),
      h('button',{'class':'ri-btn',type:'button','aria-pressed':mic.rec?'true':'false',title:Rec?"dictate into the field with this browser's speech recogniser":'this browser has no speech recogniser',text:mic.rec?'⏺ dictating':'⏺ dictate',on:{click:function(){ mic.rec?dictateOff():dictateOn(); }}}),
      h('button',{'class':'ri-btn',type:'button',title:"voaicey (ollywoo's voicey) speaks the answer in the chosen persona's voice",text:'🗣 speak the answer',on:{click:speakAnswer}}),
      h('button',{'class':'ri-btn ri-stop',type:'button',text:'microphone OFF',on:{click:micOff}})]));
    audPanel.appendChild(micRead); kv(micRead,[['microphone',(t&&t.label)||'on'],['signal',(st.sampleRate?st.sampleRate+' Hz · ':'')+(st.channelCount||1)+' ch'+(st.echoCancellation?' · echo cancel':'')+(st.noiseSuppression?' · noise suppr.':'')],['voice',mic.voice?mic.voice:'not loaded — 🗣 loads voaicey']]);
    audPanel.appendChild(h('div',{'class':'ri-note',text:"The sound stays in this browser, except dictation: that is the browser's own recogniser, which in Chrome and Edge sends the audio to Google or Microsoft (Firefox has none). The answer is spoken by voaicey: on this machine where it can, else by the DeltaVerse voice renderer, which receives only the answer's text."})); }
  function dictateOn(){ if(!Rec){ say('this browser has no speech recogniser: dictation is not available here'); return; } var r=new Rec(); r.lang=navigator.language||'en-US'; r.interimResults=true; r.continuous=false;
    r.onresult=function(e){ var txt='', fin=false; for(var i=e.resultIndex;i<e.results.length;i++){ txt+=e.results[i][0].transcript; if(e.results[i].isFinal) fin=true; } q.value=txt.trim(); if(fin){ say('heard: '+q.value); rerun(); } };
    r.onerror=function(e){ say('dictation: '+(e.error||'stopped')); }; r.onend=function(){ mic.rec=null; if(mic.stream) paintAud(); };
    try{ r.start(); mic.rec=r; paintAud(); }catch(e){ say('dictation did not start: '+e.message); } }
  function dictateOff(){ if(mic.rec){ try{ mic.rec.stop(); }catch(e){} } mic.rec=null; paintAud(); }
  function speakAnswer(){ var cards=Array.prototype.slice.call(list.querySelectorAll('.ri-t')).slice(0,3).map(function(t){ return t.textContent; });
    if(!cards.length){ say('nothing to speak yet: ask first'); return; } var text=(lastQuery?'For '+lastQuery+': ':'')+cards.join('. ')+'.';
    window.OLLYWOO_ENGINE_BASE=window.OLLYWOO_ENGINE_BASE||DV+'/engine/ngn/'; window.OLLYWOO_DOCSPLAYER_URL=window.OLLYWOO_DOCSPLAYER_URL||DV+'/docsplayer';
    var p=faceOpen()?jaimla():current(); import(DV+'/ollywoo/voicey.js').then(function(Vy){ return Vy.initVoicey({id:p.id,name:p.name,voice:p.id==='jaimla'?{docsplayer:'jaimla'}:undefined}).then(function(){ return Vy; }); })
      .then(function(Vy){ fz.Vy=Vy; mic.voice=(Vy.label&&Vy.label())||Vy.tierNow(); if(mic.stream) paintAud(); if(faceOpen()) paintFace(); say('speaking in '+p.name+"'s voice · "+mic.voice); return Vy.speak(text); })
      .catch(function(e){ say('voaicey could not speak: '+(e.message||e)); }); }
  earBtn.addEventListener('click',function(){ if(Date.now()-(earBtn._dragged||0)<500) return; if(!mic.stream) micOn(''); else audPanel.classList.toggle('ri-show'); });
  /* ── Jaimla's faice (ollywoo faice.js): drop 👁 on it and its eyes are the camera, 👂 and its ears are the microphone ── */
  var fzCv=h('canvas',{'aria-label':"Jaimla's faice: drop 👁 on it for the eyes, 👂 for the ears; drag to turn it; click an eye or an ear for its panel"}), fzRead=h('div',{'class':'ri-diag'});
  var fz={F:null,T:null,R:null,sc:null,c3:null,raf:0,last:0,w:0,eyes:false,ears:false,seeing:null,video:null,Vy:null,buf:null,loading:null,err:''};
  function jaimla(){ var L=people(); for(var i=0;i<L.length;i++) if(L[i].id==='jaimla') return L[i]; return current(); }
  function faceOpen(){ return fzPanel.classList.contains('ri-show'); }
  function paintFace(){ var vt=cam.stream&&cam.stream.getVideoTracks()[0], at=mic.stream&&mic.stream.getAudioTracks()[0], see=!!(fz.eyes&&cam.stream), hear=!!(fz.ears&&mic.stream);
    kv(fzRead,[['eyes',see?'the camera · '+((vt&&vt.label)||'on'):'closed · drop 👁 here',see?'ri-ok':''],['ears',hear?'the microphone · '+((at&&at.label)||'on'):'not listening · drop 👂 here',hear?'ri-ok':''],
      ['mouth',fz.Vy?'the voice · '+((fz.Vy.label&&fz.Vy.label())||fz.Vy.tierNow()):'closed · 🗣 speaks the answer in her voice'],
      ['faice',fz.err?'could not load: '+fz.err:fz.F?'ollywoo faice.js on three.js, drawn in this browser':'loading three.js and faice.js from '+DV+' …',fz.err?'ri-bad':(fz.F?'ri-ok':'ri-pend')]]); }
  function faceShow(){ if(!faceOpen()){ fzPanel.classList.add('ri-show'); try{ fzPanel.scrollIntoView({block:'nearest'}); }catch(e){} } fz.err=''; paintFace();
    faceLoad().then(function(){ if(faceOpen()&&!fz.raf&&fz.F) faceFrame(); }); }
  function faceHide(){ fzPanel.classList.remove('ri-show'); if(fz.raf) cancelAnimationFrame(fz.raf); fz.raf=0; }
  function faceLoad(){ if(fz.F) return Promise.resolve(); if(fz.loading) return fz.loading;
    fz.loading=(typeof cfg.faice==='function'?Promise.resolve(cfg.faice()):Promise.all([import(DV+'/vendor/three/build/three.module.min.js'),import(DV+'/ollywoo/faice.js')])).then(function(m){ var T=m[0];
      fz.R=new T.WebGLRenderer({canvas:fzCv,alpha:true,antialias:true}); fz.R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      fz.sc=new T.Scene(); fz.c3=new T.PerspectiveCamera(30,1,.1,10); fz.c3.position.set(0,0,2.1);
      fz.sc.add(new T.HemisphereLight(0xdfffe9,0x050807,1.6)); var dl=new T.DirectionalLight(0xffffff,2.2); dl.position.set(.7,.9,1.6); fz.sc.add(dl);
      fz.F=m[1].createFaice(T,{accent:'#3ddc84',radius:.42}); fz.T=T; fz.sc.add(fz.F.group); fz.F.attachDrag(fzCv); faceEyes(); paintFace(); })
      .catch(function(e){ fz.loading=null; fz.err=String(e&&e.message||e); paintFace(); }); return fz.loading; }
  // the eyes see through the camera: the same stream, in a video of the faice's own (the panel's preview may be hidden)
  function faceEyes(){ if(!fz.F) return; var s=fz.eyes&&cam.stream||null; if(s===fz.seeing) return; fz.seeing=s;
    if(!s){ if(fz.video) fz.video.srcObject=null; fz.F.setCamera(null); return; }
    if(!fz.video){ fz.video=h('video',{muted:'',playsinline:'',autoplay:'','aria-hidden':'true',style:'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none'}); fz.video.muted=true; box.appendChild(fz.video); }
    fz.video.srcObject=s; try{ var pp=fz.video.play(); if(pp&&pp.catch) pp.catch(function(){}); }catch(e){} fz.F.setCamera(fz.video); }
  function faceDevices(){ faceEyes(); if(faceOpen()) paintFace(); }
  function faceFrame(){ fz.raf=requestAnimationFrame(faceFrame); if(document.hidden||!fz.F||!isOpen) return; var now=performance.now(); if(now-fz.last<33) return; fz.last=now;
    var w=fzCv.clientWidth||220; if(fz.w!==w){ fz.w=w; fz.R.setSize(w,w,false); }
    var ml=0; if(fz.ears&&mic.an&&mic.an.getFloatTimeDomainData){ if(!fz.buf||fz.buf.length!==mic.an.fftSize) fz.buf=new Float32Array(mic.an.fftSize); mic.an.getFloatTimeDomainData(fz.buf); var s=0; for(var i=0;i<fz.buf.length;i++) s+=fz.buf[i]*fz.buf[i]; ml=Math.min(1,Math.sqrt(s/fz.buf.length)*5); }
    var Vy=fz.Vy, sp=!!(Vy&&Vy.speaking());
    fz.F.update({wave:sp?Vy.wave():null,speaking:sp,micLevel:ml,camOn:!!fz.seeing,level:sp&&Vy.level?Vy.level():0}); fz.R.render(fz.sc,fz.c3); }
  function plug(organ){ faceShow(); if(organ==='eyes'){ fz.eyes=true; if(cam.stream){ faceDevices(); say("Jaimla's eyes are the camera"); } else camOn('',true); }
    else { fz.ears=true; if(mic.stream){ faceDevices(); say("Jaimla's ears are the microphone"); } else micOn('',true); } spark(16); }
  // a click (not a turn) on an eye or an ear: plugged, its panel; not yet, plug it
  var fzDown=null; fzCv.addEventListener('pointerdown',function(e){ fzDown={x:e.clientX,y:e.clientY}; });
  fzCv.addEventListener('pointerup',function(e){ if(!fzDown||!fz.F) return; var moved=Math.abs(e.clientX-fzDown.x)+Math.abs(e.clientY-fzDown.y); fzDown=null; if(moved>5) return;
    var r=fzCv.getBoundingClientRect(), T=fz.T, rc=new T.Raycaster(); if(fz.c3.updateMatrixWorld) fz.c3.updateMatrixWorld(); rc.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)),fz.c3);
    var eyes=fz.F.organs.eyes, hit=rc.intersectObjects(eyes.concat(fz.F.organs.ears),false)[0]; if(!hit) return;
    if(eyes.indexOf(hit.object)>=0){ if(fz.eyes&&cam.stream) camPanel.classList.toggle('ri-show'); else plug('eyes'); } else { if(fz.ears&&mic.stream) audPanel.classList.toggle('ri-show'); else plug('ears'); } });
  // 👁 and 👂 drag out of the row (pointer events: mouse, pen and touch alike); a press without a drag is still a click
  function organDrag(btn,organ){ var st=null, ghost=null;
    function over(e){ if(!faceOpen()) return false; var r=fzCv.getBoundingClientRect(); return e.clientX>=r.left-24&&e.clientX<=r.right+24&&e.clientY>=r.top-24&&e.clientY<=r.bottom+24; }
    btn.addEventListener('pointerdown',function(e){ if(e.button) return; st={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false}; });
    btn.addEventListener('pointermove',function(e){ if(!st||st.id!==e.pointerId) return;
      if(!st.moved){ if(Math.abs(e.clientX-st.x)+Math.abs(e.clientY-st.y)<8) return; st.moved=true; try{ btn.setPointerCapture(e.pointerId); }catch(x){} ghost=h('div',{'class':'ri-ghost','aria-hidden':'true',text:btn.textContent}); box.appendChild(ghost); faceShow(); }
      ghost.style.left=e.clientX+'px'; ghost.style.top=e.clientY+'px'; fzPanel.classList.toggle('ri-hover',over(e)); });
    function end(e){ if(!st||st.id!==e.pointerId) return; var moved=st.moved; st=null; if(ghost&&ghost.parentNode) ghost.parentNode.removeChild(ghost); ghost=null; fzPanel.classList.remove('ri-hover'); if(!moved) return;
      btn._dragged=Date.now(); if(e.type==='pointerup'&&over(e)) plug(organ); else say('drop '+btn.textContent+" on Jaimla's faice"); }
    btn.addEventListener('pointerup',end); btn.addEventListener('pointercancel',end); }
  organDrag(eyeBtn,'eyes'); organDrag(earBtn,'ears');
  fzPanel.appendChild(h('h4',{text:"Jaimla's faice"})); fzPanel.appendChild(fzCv);
  fzPanel.appendChild(h('div',{'class':'ri-acts'},[h('button',{'class':'ri-btn',type:'button',title:'her eyes are the camera',text:'👁 eyes',on:{click:function(){ plug('eyes'); }}}),
    h('button',{'class':'ri-btn',type:'button',title:'her ears are the microphone',text:'👂 ears',on:{click:function(){ plug('ears'); }}}),
    h('button',{'class':'ri-btn',type:'button',title:"the answer, in Jaimla's voice; her mouth is its waveform",text:'🗣 speak the answer',on:{click:function(){ speakAnswer(); }}}),
    h('button',{'class':'ri-btn ri-stop',type:'button',text:'close',on:{click:faceHide}})]));
  fzPanel.appendChild(fzRead);
  fzPanel.appendChild(h('div',{'class':'ri-note',text:"ollywoo's BASIC FAICE: each organ is a device, so the face shows what the machine is actually doing. Her eyes are your camera, her ears your microphone, her mouth the waveform of the voice she speaks in (a flat line when the voice is the browser's own, which exposes no samples). A globe, not an invented likeness: Jaimla's embodiment is only ever cloned from a real capture. Nothing leaves this browser; three.js and faice.js are loaded once from "+DV+"."}));
  // networking.tools
  var netRead=h('div',{'class':'ri-diag'}), lastLegs=null;
  function timed(url,o){ var t0=performance.now(); return fetch(url,o).then(function(r){ return {ok:o&&o.mode==='no-cors'?true:r.ok,code:o&&o.mode==='no-cors'?'reached':r.status,ms:Math.round(performance.now()-t0)}; },function(e){ return {ok:false,code:e.name||'failed',ms:Math.round(performance.now()-t0)}; }); }
  function netRun(){ clear(netPanel); netPanel.appendChild(h('h4',{text:'networking.tools'})); netPanel.appendChild(netRead);
    netPanel.appendChild(h('div',{'class':'ri-acts'},[h('button',{'class':'ri-btn',type:'button',text:'run again',on:{click:netRun}}),h('button',{'class':'ri-btn ri-stop',type:'button',text:'close',on:{click:function(){ netPanel.classList.remove('ri-show'); }}})]));
    netPanel.appendChild(h('div',{'class':'ri-note',text:'Every round trip is timed from this browser. LUVping is reached without reading its answer (it does not offer it cross-origin), so only the round trip counts.'}));
    var rows=[], c=navigator.connection||{}; rows.push(['this connection',(navigator.onLine?'online':'offline')+(c.effectiveType?' · '+c.effectiveType:'')+(c.rtt!=null?' · rtt '+c.rtt+' ms':'')+(c.downlink!=null?' · '+c.downlink+' Mb/s':'')]);
    if(lastLegs) rows.push(['last search',Object.keys(lastLegs).map(function(k){ var l=lastLegs[k]; return legName(k)+' '+(l.ok?Math.round(l.ms)+' ms':(l.error||'—')); }).join(' · ')]);
    kv(netRead,rows.concat([['checking','…']]));
    var checks=[['RAGE search /health',RS?RS+'/health':null,{cache:'no-store'}],['RAGE search, words',RS?RS+'/search?legs=bm25&k=1&q=rage':null,{cache:'no-store'}],['WordPress search','/wp-json/wp/v2/search?per_page=1&search=rage',{cache:'no-store'}],
      ['DeltaVerse sequence',DVSEQ,{headers:{Range:'bytes=0-255'},cache:'no-store'}],['ollywoo toolkit',DV+'/ollywoo/voicey.js',{method:'HEAD',cache:'no-store'}],['LUVping (luv.pythai.net)','https://luv.pythai.net/luvping',{mode:'no-cors',cache:'no-store'}]];
    var out=rows.slice(); (function next(i){ if(i>=checks.length){ kv(netRead,out); return; } var ck=checks[i]; if(!ck[1]){ out.push([ck[0],'not configured','ri-bad']); next(i+1); return; }
      timed(ck[1],ck[2]).then(function(r){ out.push([ck[0],(r.ok?'':'✕ ')+r.code+' · '+r.ms+' ms',r.ok?(r.ms>1500?'ri-pend':'ri-ok'):'ri-bad']); kv(netRead,out.concat(i+1<checks.length?[['checking','…']]:[])); next(i+1); }); })(0); }
  netBtn.addEventListener('click',function(){ if(netPanel.classList.contains('ri-show')) netPanel.classList.remove('ri-show'); else { netPanel.classList.add('ri-show'); netRun(); } });
  /* ── modes: RAGE here; atlas hands over to the rage menu ── */
  mAtlas.addEventListener('click',function(){ var b=document.querySelector('.rm-li>button'); close(); if(b) setTimeout(function(){ b.click(); },200); else location.href='/'; });
  mRage.addEventListener('click',function(){ q.focus(); });
  /* ── personas, in a rolodex under the field: drop a .persona and it rolls in ── */
  var BUILT=[{id:'rage',name:'RAGE',line:'no persona: the corpus alone',items:[]},
    {id:'mindx',name:'mindX',url:'https://raw.githubusercontent.com/cryptoAGI/bankml/main/sAGI/personas/mindx.persona'},
    {id:'bankml',name:'bankML',url:'https://raw.githubusercontent.com/cryptoAGI/bankml/main/sAGI/personas/bankml.persona'},
    {id:'jaimla',name:'Jaimla',url:'https://raw.githubusercontent.com/cryptoAGI/jaimla/main/jaimla.persona'},
    {id:'savante',name:'Savante',role:'gatekeeper',url:'https://raw.githubusercontent.com/cryptoAGI/savante/main/savante.persona'}];
  var mine=[]; try{ mine=JSON.parse(localStorage.getItem('ragebar_personas')||'[]'); if(!Array.isArray(mine)) mine=[]; }catch(e){ mine=[]; }
  function people(){ return BUILT.concat(mine); }
  function keepPeople(){ try{ localStorage.setItem('ragebar_personas',JSON.stringify(mine.slice(-12))); }catch(e){ say('this browser would not keep the persona (storage full or off): it stays for this visit'); } }
  // every belief, desire, skill, exchange … of a .persona as a passage with its source, nested sections (bdi.beliefs) included
  function flatten(d){ var out=[], SKIP={system_prompt:1,format:1,kind:1,persona:1,name:1};
    (function walk(o,path,depth,nostr){ Object.keys(o).forEach(function(key){ if(!depth&&SKIP[key]) return; var v=o[key], k=path?path+'.'+key:key;
      if(Array.isArray(v)) v.forEach(function(it){ if(it&&typeof it==='object'&&!Array.isArray(it)){ var t=Object.keys(it).filter(function(x){ return x!=='source'&&(typeof it[x]==='string'||typeof it[x]==='number'); }).map(function(x){ return it[x]; }).join(' ');
          if(t.trim()) out.push({k:k,t:t,src:typeof it.source==='string'?it.source:''}); if(depth<3) walk(it,k,depth+1,true); }
        else if(typeof it==='string'&&it.length>20) out.push({k:k,t:it,src:''}); });
      else if(v&&typeof v==='object'){ if(depth<3) walk(v,k,depth+1); }
      else if(!nostr&&typeof v==='string'&&v.length>20&&!/_source$/.test(key)) out.push({k:k,t:v,src:typeof o[key+'_source']==='string'?o[key+'_source']:''}); }); })(d,'',0);
    return out.slice(0,800); }
  function parsePersona(text){ var d=JSON.parse(text); if(!d||typeof d!=='object'||!(d.name||d.persona)) throw new Error('not a .persona: it needs a name');
    var items=flatten(d); if(!items.length&&!d.system_prompt) throw new Error('this .persona holds nothing to search');
    return {id:'p-'+String(d.persona||d.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,32),name:String(d.name||d.persona).slice(0,40),line:String(d.mantra||d.opening||d.description||'').slice(0,140),items:items,rage:d.rage&&typeof d.rage==='object'?d.rage:null}; }
  function loadBuilt(p){ if(p.items||!p.url) return Promise.resolve(p); if(p.loading) return p.loading;
    p.loading=fetch(p.url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); }).then(function(t){ var x=parsePersona(t); p.items=x.items; p.line=x.line; p.rage=x.rage; paintRolo(); return p; })
      .catch(function(e){ p.loading=null; p.line='could not be read: '+e.message; paintRolo(); return p; }); return p.loading; }
  function current(){ var L=people(); for(var i=0;i<L.length;i++) if(L[i].id===V.persona) return L[i]; return L[0]; }
  function choose(id,fresh){ V.persona=id; keep(); var p=current(); if(p.rage){ if(p.rage.corpus) V.corpus=p.rage.corpus; if(p.rage.k) V.k=Math.max(1,Math.min(30,+p.rage.k)); if(p.rage.legs) LEGS.forEach(function(L){ V.legs[L[0]]=p.rage.legs.indexOf(L[0])>=0||p.rage.legs.indexOf(L[1])>=0; }); }
    paintRolo(fresh?id:null); paintVars(); loadBuilt(p).then(function(){ if(lastQuery) search(lastQuery); }); }
  function paintRolo(fresh){ clear(rolo); var L=people(), at=0; L.forEach(function(p,i){ if(p.id===V.persona) at=i; });
    L.forEach(function(p,i){ var off=i-at, card=h('div',{'class':'ri-pc'+(off===0?' ri-on':'')+(p.id===fresh?' ri-new':''),role:'option','aria-selected':off===0?'true':'false',title:p.name+(p.items?' · '+p.items.length+' passages':'')},[h('b',{text:p.name}),h('i',{text:p.line||(p.url?'built in · read from its public .persona':'')})]);
      card.style.transform='translateX('+(off*150)+'px) translateZ('+(-Math.abs(off)*70)+'px) rotateY('+(-off*28)+'deg)'; card.style.opacity=Math.abs(off)>2?'0':String(1-Math.abs(off)*.28); card.style.zIndex=String(10-Math.abs(off));
      if(i>=BUILT.length){ var x=h('span',{'class':'ri-px',title:'remove this persona',text:'×'}); x.addEventListener('click',function(ev){ ev.stopPropagation(); mine=mine.filter(function(m){ return m.id!==p.id; }); keepPeople(); if(V.persona===p.id) V.persona='rage'; paintRolo(); }); card.appendChild(x); }
      if(p.id==='jaimla'){ var fc=h('span',{'class':'ri-fzc',role:'button',tabindex:'0',title:"Jaimla's faice: drop 👁 or 👂 on it",text:'◉ faice'}); fc.addEventListener('click',function(ev){ ev.stopPropagation(); faceShow(); }); fc.addEventListener('keydown',function(ev){ if(ev.key==='Enter'){ ev.stopPropagation(); faceShow(); } }); card.appendChild(fc); }
      card.addEventListener('click',function(){ choose(p.id); }); rolo.appendChild(card); }); }
  rolo.addEventListener('keydown',function(e){ var L=people(), i=L.indexOf(current()); if(e.key==='ArrowRight'&&i<L.length-1){ e.preventDefault(); choose(L[i+1].id); } else if(e.key==='ArrowLeft'&&i>0){ e.preventDefault(); choose(L[i-1].id); } });
  rolo.addEventListener('wheel',function(e){ if(Math.abs(e.deltaX)+Math.abs(e.deltaY)<8) return; e.preventDefault(); var L=people(), i=L.indexOf(current()), d=(e.deltaY||e.deltaX)>0?1:-1; if(L[i+d]) choose(L[i+d].id); },{passive:false});
  function addPersonaText(text){ try{ var p=parsePersona(text); mine=mine.filter(function(m){ return m.id!==p.id; }); mine.push(p); keepPeople(); choose(p.id,true); say('persona '+p.name+' rolled in · '+p.items.length+' passages, searched here only'); spark(30); }
    catch(e){ say('that file is not a .persona this field can read: '+e.message); meter(1,true,'not a .persona'); } }
  ['dragenter','dragover'].forEach(function(t){ field.addEventListener(t,function(e){ e.preventDefault(); field.classList.add('ri-drop'); }); });
  ['dragleave','drop'].forEach(function(t){ field.addEventListener(t,function(e){ if(t==='dragleave'&&field.contains(e.relatedTarget)) return; field.classList.remove('ri-drop'); }); });
  field.addEventListener('drop',function(e){ e.preventDefault(); var fs=e.dataTransfer&&e.dataTransfer.files; if(!fs||!fs.length){ var t=e.dataTransfer&&e.dataTransfer.getData('text'); if(t) addPersonaText(t); return; }
    Array.prototype.forEach.call(fs,function(f){ if(f.size>512*1024){ say(f.name+': over 512 KB, not a .persona'); return; } var rd=new FileReader(); rd.onload=function(){ addPersonaText(String(rd.result)); }; rd.readAsText(f); }); });
  /* the persona leg: BM25 (the standard's formula) over what the chosen persona holds */
  var STOPW={'the':1,'and':1,'for':1,'are':1,'was':1,'this':1,'that':1,'with':1,'from':1,'what':1,'which':1,'who':1,'how':1,'why':1,'when':1,'where':1,'does':1,'did':1,'can':1,'you':1,'your':1,'its':1,'they':1,'there':1,'about':1,'not':1,'but':1,'all':1,'any':1};
  function toks(t){ return String(t||'').toLowerCase().match(/[a-z0-9]+/g)||[]; }
  function personaLeg(query){ var p=current(), t0=Date.now(); if(!p.items||!p.items.length) return null;
    var words=[]; toks(query).forEach(function(w){ if(w.length>2&&!STOPW[w]&&words.indexOf(w)<0) words.push(w); }); if(!words.length) return {ids:[],ms:0,name:p.name,items:{}};
    var docs=p.items.map(function(it){ var tf={}, n=0; toks(it.k+' '+it.t).forEach(function(w){ tf[w]=(tf[w]||0)+1; n++; }); return {tf:tf,n:n}; }), N=docs.length, avg=docs.reduce(function(a,d){ return a+d.n; },0)/N||1, df={};
    docs.forEach(function(d){ for(var w in d.tf) df[w]=(df[w]||0)+1; });
    var sc=docs.map(function(d,i){ var s=0; words.forEach(function(w){ var f=d.tf[w]; if(f){ s+=Math.log(1+(N-df[w]+.5)/(df[w]+.5))*f*2.2/(f+1.2*(.25+.75*d.n/avg)); } }); return [i,s]; }).filter(function(x){ return x[1]>0; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,8);
    var items={}, ids=sc.map(function(x){ var it=p.items[x[0]], id='persona:'+p.id+'#'+x[0]; items[id]={title:p.name+' · '+it.k,snippet:it.t.slice(0,260),url:/^https?:/.test(it.src)?it.src:'',kind:'persona',corpus:'persona',date:it.src&&!/^https?:/.test(it.src)?'source: '+it.src.slice(0,80):''}; return id; });
    return {ids:ids,ms:Date.now()-t0,name:p.name,items:items}; }
  /* ── the atlas: articles respond as the rage menu's top pick does (same atlas, same trail) ── */
  var ATLAS=typeof cfg.atlas==='string'?cfg.atlas:'https://deltaverse.pythai.net/audio/atlas.json', VOICE={overlord:'OVERLORD',jaimla:'JAIMLA',neural:'NEURAL',savante:'SAVANTE'};
  var A=null, BY={}, aLoading=null;
  function atlasLoad(){ if(A) return Promise.resolve(A); if(aLoading) return aLoading;
    aLoading=fetch(ATLAS,{cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).then(function(j){ A=j; (j.art||[]).forEach(function(a){ BY[a.id]=a; }); return j; }).catch(function(e){ aLoading=null; throw e; });
    return aLoading; }
  function tstate(){ var s=null; try{ s=JSON.parse(sessionStorage.getItem('ragemap_v1')||'null'); }catch(e){} s=s||{}; s.trail=s.trail||[]; s.seen=s.seen||{}; s.collected=s.collected||{}; return s; }
  function tkeep(s){ try{ sessionStorage.setItem('ragemap_v1',JSON.stringify({trail:s.trail.slice(-40),seen:s.seen,collected:s.collected})); }catch(e){} }
  function tagsOf(a){ return (a.g||[]).map(String).filter(function(t){ return A&&A.tags&&A.tags[t]; }); }
  function aScore(a,b){ var ta=tagsOf(a), tb=tagsOf(b), inter=ta.filter(function(t){ return tb.indexOf(t)>=0; }).length, uni=ta.length+tb.length-inter;
    var pp=(a.p||[]).filter(function(x){ return (b.p||[]).indexOf(x)>=0; }).length; return (uni?inter/uni:0)+pp*0.35; }
  function kindred(a,n){ return A.art.filter(function(b){ return b.id!==a.id; }).map(function(b){ return [b,aScore(a,b)]; }).filter(function(x){ return x[1]>0.2; }).sort(function(x,y){ return y[1]-x[1]; }).slice(0,n||6).map(function(x){ return x[0]; }); }
  function thread(a){ var path=(a.p||[])[0], on=A.art.filter(function(b){ return (b.p||[]).indexOf(path)>=0; }).sort(function(x,y){ return x.d<y.d?-1:1; }), i=on.indexOf(a); return on.slice(Math.max(0,i-3),i).concat(on.slice(i+1,i+4)); }
  function converge(n){ var w=tstate().collected; return A.art.map(function(b){ var sc=0; tagsOf(b).forEach(function(t){ sc+=(w[t]||0); }); return [b,sc]; }).filter(function(x){ return x[1]>0; }).sort(function(x,y){ return y[1]-x[1]; }).slice(0,n||7).map(function(x){ return x[0]; }); }
  function byTag(t){ return A.art.filter(function(b){ return tagsOf(b).indexOf(String(t))>=0; }).slice(0,12); }
  function travel(a){ var s=tstate(); s.seen['a'+a.id]=1; s.trail.push({k:'a'+a.id,l:String(a.t).slice(0,60)}); tagsOf(a).forEach(function(t){ s.collected[t]=(s.collected[t]||0)+1; }); tkeep(s); paintTrail(); spark(6); }
  function paintTrail(){ clear(trailEl); if(!A) return; var s=tstate(), last=s.trail.slice(-6);
    if(!last.length) return; trailEl.appendChild(h('span',{text:'trail'}));
    last.forEach(function(t){ var a=BY[+String(t.k).slice(1)]; trailEl.appendChild(h('button',{type:'button',title:t.l,text:t.l,on:{click:function(){ if(a) spawnList(list,'from your trail',[a],true); }}})); });
    var top=Object.keys(s.collected).filter(function(k){ return A.tags[k]; }).sort(function(x,y){ return s.collected[y]-s.collected[x]; }).slice(0,5);
    top.forEach(function(k){ trailEl.appendChild(h('button',{'class':'ri-tag',type:'button',title:'every article with this tag',text:A.tags[k]+' ×'+s.collected[k],on:{click:function(){ spawnList(list,'#'+A.tags[k],byTag(k),true); }}})); });
    if(top.length>1) trailEl.appendChild(h('button',{'class':'ri-tag',type:'button',title:'where everything you collected points',text:'◎ converge',on:{click:function(){ spawnList(list,'where your path converges',converge(),true); }}}));
    trailEl.appendChild(h('button',{type:'button',title:'forget the trail (also the rage menu\'s)',text:'↺',on:{click:function(){ tkeep({trail:[],seen:{},collected:{}}); paintTrail(); }}})); }
  function spawnList(into,label,arts,top){ var x=h('button',{'class':'ri-btn',type:'button','aria-label':'drop this path out',text:'×'});
    var sub=h('div',{'class':'ri-sub',role:'group','aria-label':label},[h('div',{'class':'ri-sub-h'},[h('span',{text:'↳ '+label+' · '+arts.length}),x])].concat(arts.length?arts.map(function(b){ return artCard(b); }):[h('div',{'class':'ri-m',text:'no path spawns from here yet: collect more.'})]));
    x.addEventListener('click',function(){ sub.parentNode&&sub.parentNode.removeChild(sub); });
    if(top&&into===list){ var li=h('li',{},[sub]); list.insertBefore(li,list.firstChild); } else into.appendChild(sub);
    try{ sub.scrollIntoView({block:'nearest'}); }catch(e){} spark(8); return sub; }
  // an article as the rage menu shows it: drop in, drop out; it is the point of conclusion and paths spawn from it
  function artCard(a,extra){ extra=extra||{}; var seen=tstate().seen['a'+a.id];
    var voices=(a.v||[]).map(function(v){ return VOICE[v]||v; });
    var head=h('button',{'class':'ri-ah',type:'button','aria-expanded':'false'},[h('div',{'class':'ri-t',text:a.t}),h('div',{'class':'ri-m',text:[a.d,voices.length?'♪ '+voices.join(' '):''].filter(Boolean).join(' · ')}),extra.snippet?h('div',{'class':'ri-s',text:extra.snippet}):null,extra.ranks||null,extra.fuse||null]);
    var body=h('div',{'class':'ri-body'}), card=h('div',{'class':'ri-card ri-art'+(seen?' ri-seen':''),'data-id':String(a.id)},[head,body]), filled=false;
    card._open=function(on){ if(on===undefined) on=!card.classList.contains('ri-on'); card.classList.toggle('ri-on',on); head.setAttribute('aria-expanded',on?'true':'false');
      if(on&&!filled){ filled=true;
        if(a.x) body.appendChild(h('p',{text:a.x}));
        body.appendChild(h('div',{'class':'ri-m'},[a.d+' · post '+a.id,voices.length?h('span',{'class':'ri-voice',text:' · LISTEN in '+voices.join(', ')}):' · not rendered yet']));
        var acts=h('div',{'class':'ri-acts2'});
        acts.appendChild(h('a',{'class':'ri-act',href:a.u,text:'read →'}));
        acts.appendChild(h('button',{'class':'ri-act',type:'button',text:'✵ kindred',on:{click:function(){ spawnList(body,'kindred · '+a.t,kindred(a)); }}}));
        acts.appendChild(h('button',{'class':'ri-act',type:'button',text:'↔ its thread',on:{click:function(){ spawnList(body,'its thread · '+((a.p||[])[0]||''),thread(a)); }}}));
        tagsOf(a).slice(0,5).forEach(function(t){ acts.appendChild(h('button',{'class':'ri-act',type:'button',text:'#'+A.tags[t],on:{click:function(){ spawnList(body,'#'+A.tags[t],byTag(t)); }}})); });
        if(Object.keys(tstate().collected).length>1) acts.appendChild(h('button',{'class':'ri-act',type:'button',text:'◎ converge',on:{click:function(){ spawnList(body,'where your path converges',converge()); }}}));
        body.appendChild(acts); }
      if(on){ travel(a); card.classList.add('ri-seen'); } };
    head.addEventListener('click',function(){ card._open(); });
    return card; }
  document.addEventListener('dv:rage.pick',function(e){ var id=(e.detail||{}).id; if(id==null) return; if(!isOpen) open('');
    var c=list.querySelector('.ri-art[data-id="'+String(id).replace(/"/g,'')+'"]'); if(c){ c._open(true); try{ c.scrollIntoView({block:'center',behavior:'smooth'}); }catch(x){} return; }
    atlasLoad().then(function(){ if(BY[id]){ var sub=spawnList(list,'from the ground',[BY[id]],true); var cc=sub.querySelector('.ri-art'); if(cc) cc._open(true); } }).catch(function(){}); });
  /* ── response windows: ❏ spawns the results of this question as a window you can move; ⌂ calls them home ── */
  var wins=[], lastQuery='', inflight=[];
  function home(){ wins.forEach(function(w,i){ w.style.left=Math.max(16,innerWidth-Math.min(420,innerWidth-32)-16-i*18)+'px'; w.style.top=(72+i*28)+'px'; }); spark(6); }
  function spawn(){ if(!list.firstChild){ say('nothing to spawn yet: ask first'); return; }
    var body=h('div',{'class':'ri-win-body'}); Array.prototype.forEach.call(list.querySelectorAll('.ri-card'),function(c){ var k=c.cloneNode(true); k.style.animationDelay='0ms'; body.appendChild(k); });
    var x=h('button',{'class':'ri-btn',type:'button','aria-label':'close this window',text:'×'});
    var bar=h('div',{'class':'ri-win-bar'},[h('span',{text:'❏ “'+lastQuery+'”'+(V.persona!=='rage'?' · '+current().name:'')+' · '+LEGS.filter(function(L){ return V.legs[L[0]]; }).map(function(L){ return L[1]; }).join('+')+' · '+V.corpus}),x]);
    var w=h('div',{'class':'ri-win',role:'region','aria-label':'response window: '+lastQuery},[bar,body]); box.appendChild(w); wins.push(w); home();
    x.addEventListener('click',function(){ w.parentNode&&w.parentNode.removeChild(w); wins.splice(wins.indexOf(w),1); });
    bar.addEventListener('pointerdown',function(e){ if(e.target===x) return; e.preventDefault(); var r=w.getBoundingClientRect(), dx=e.clientX-r.left, dy=e.clientY-r.top; w.classList.add('ri-drag'); box.appendChild(w);
      function mv(ev){ w.style.left=Math.max(0,Math.min(innerWidth-60,ev.clientX-dx))+'px'; w.style.top=Math.max(0,Math.min(innerHeight-40,ev.clientY-dy))+'px'; }
      function up(){ w.classList.remove('ri-drag'); document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up); }
      document.addEventListener('pointermove',mv); document.addEventListener('pointerup',up); }); }
  function stop(){ seq++; inflight.forEach(function(c){ try{ c.abort(); }catch(e){} }); inflight=[]; meter(0,false,'stopped.'); }
  function clearAll(){ stop(); clear(list); clear(legsEl); clear(log); q.value=''; wins.slice().forEach(function(w){ w.parentNode&&w.parentNode.removeChild(w); }); wins=[]; meter(0,false,''); }
  spawnBtn.addEventListener('click',spawn); homeBtn.addEventListener('click',home);
  function sig(){ if(!('AbortController' in window)) return undefined; var c=new AbortController(); inflight.push(c); return {signal:c.signal}; }
  /* ── RAGE search: the legs you chose, fused by rank in this browser (RRF k=60) ── */
  function rrf(R){ var acc={}; Object.keys(R).forEach(function(leg){ var seen={}; R[leg].forEach(function(id,i){ if(seen[id]) return; seen[id]=1; var e=acc[id]||(acc[id]={id:id,s:0,ranks:{}}); e.s+=1/(61+i); e.ranks[leg]=i+1; }); });
    return Object.keys(acc).map(function(k){ return acc[k]; }).sort(function(a,b){ return b.s-a.s||(String(a.id)<String(b.id)?-1:1); }); }
  function legName(n){ if(n==='persona'){ var p=current(); return p&&p.id!=='rage'?p.name:'persona'; } for(var i=0;i<LEGS.length;i++) if(LEGS[i][0]===n) return LEGS[i][1]; return n; }
  var timer=null, seq=0, keys=[];
  function paintLegs(legs){ clear(legsEl); Object.keys(legs).forEach(function(n){ var l=legs[n], pend=!l.ok&&/^pending/.test(l.error||'');
    legsEl.appendChild(h('span',{title:(l.algorithm||'')+(l.error?' — '+l.error:'')},[legName(n)+' ',h('b',{'class':l.ok?'ri-ok':pend?'ri-pend':'ri-bad',text:l.ok?(l.n+' · '+Math.round(l.ms)+' ms'):pend?'embedding your words…':(l.error==='not configured'?'not configured':'unavailable')})])); }); }
  function render(env,wp,mine,query){ if(mine!==seq) return;
    var R={}, items={}, legs={};
    if(env&&env.legs) Object.keys(env.legs).forEach(function(k){ legs[k]=env.legs[k]; });
    (env&&env.results||[]).forEach(function(r){ items[r.id]=r; Object.keys(r.ranks||{}).forEach(function(leg){ (R[leg]=R[leg]||[])[r.ranks[leg]-1]=r.id; }); });
    Object.keys(R).forEach(function(leg){ R[leg]=R[leg].filter(function(x){ return x!=null; }); });
    if(V.legs.wp){ if(wp){ R.wp=wp.map(function(x){ if(!items[x.id]) items[x.id]={title:x.title,url:x.url}; return x.id; }); legs.wp={algorithm:'WordPress search (this browser)',ok:true,n:wp.length,ms:wp.ms||0}; }
      else legs.wp={algorithm:'WordPress search (this browser)',ok:false,n:0,ms:0,error:'pending: asking WordPress'}; }
    if(V.legs.persona&&V.persona!=='rage'){ var pl=personaLeg(query); if(pl){ R.persona=pl.ids; for(var pk in pl.items) items[pk]=pl.items[pk]; legs.persona={algorithm:'BM25 over '+pl.name+"'s .persona (this browser)",ok:true,n:pl.ids.length,ms:pl.ms}; }
      else legs.persona={algorithm:'the persona',ok:false,n:0,ms:0,error:'pending: reading the .persona'}; }
    var server=V.legs.bm25||V.legs.dense||V.legs.atlas; if(server&&!env) legs.ragesearch={algorithm:RS||'no search service',ok:false,n:0,ms:0,error:RS?(env===false?'unavailable':'pending: asking RAGE'):'not configured'};
    var fused=rrf(R).slice(0,V.k); paintLegs(legs); clear(list); lastLegs=legs;
    // the DeltaVerse event contract: a substrate (rage-substrate.js) draws what RAGE just did
    try{ document.dispatchEvent(new CustomEvent('dv:rage',{detail:{query:query,legs:legs,results:fused.map(function(e){ return {id:e.id,title:(items[e.id]||{}).title,ranks:e.ranks}; })}})); }catch(e){}
    fused.forEach(function(e,i){ var it=items[e.id]||{}, max=fused[0].s;
      var ranks=h('div',{'class':'ri-ranks'}); Object.keys(e.ranks).forEach(function(l){ ranks.appendChild(h('span',{'class':'ri-rank',text:legName(l)+' '+e.ranks[l]})); });
      var fuse=h('div',{'class':'ri-fuse',style:'width:'+Math.round(e.s/max*100)+'%'});
      if(BY[e.id]&&(it.corpus==null||it.corpus==='articles')){ var ac=artCard(BY[e.id],{ranks:ranks,snippet:it.snippet,fuse:fuse}); ac.style.animationDelay=(i*35)+'ms'; list.appendChild(h('li',{},[ac])); return; }
      var card=h(it.url?'a':'div',{'class':'ri-card',href:it.url||null,tabindex:'0',style:'animation-delay:'+(i*35)+'ms'},[h('div',{'class':'ri-t',text:it.title||String(e.id)}),h('div',{'class':'ri-m',text:[it.date,it.corpus==='self'?"RAGE's own":'',it.kind&&it.kind!=='article'?it.kind:''].filter(Boolean).join(' · ')}),it.snippet?h('div',{'class':'ri-s',text:it.snippet}):null,ranks,fuse]);
      if(it.corpus==='self'||it.kind==='persona'){ if(it.url){ card.target='_blank'; card.rel='noopener'; } }
      if(!it.url) card.removeAttribute('href'); list.appendChild(h('li',{},[card])); });
    var pend=function(k){ return !legs[k].ok&&/^pending/.test(legs[k].error||''); };
    var done=Object.keys(legs).every(function(k){ return !pend(k); }), wordsDone=Object.keys(legs).every(function(k){ return k==='dense'||!pend(k); });
    if(!fused.length&&wordsDone){ meter(1,true,'nothing. the engine is furious.'+(done?'':' · meaning still raging…')); if(done||!box.__red){ spark(30,true); } box.__red=1; }
    else { box.__red=0; meter(.3+Math.min(.7,fused.length/Math.max(1,V.k)*.7),false,fused.length+' found · '+Object.keys(legs).filter(function(k){ return legs[k].ok; }).length+' of '+Object.keys(legs).length+' legs'+(done?'':' · still raging…')); spark(Math.min(20,3+fused.length)); } }
  function legsParam(dense){ var a=[]; if(V.legs.bm25) a.push('bm25'); if(V.legs.atlas) a.push('atlas'); if(dense&&V.legs.dense) a.push('dense'); return a.join(','); }
  function search(query){ if(!A&&!search._waited){ search._waited=1; atlasLoad().then(function(){ paintTrail(); search(query); },function(){ search(query); }); return; }
    inflight.forEach(function(c){ try{ c.abort(); }catch(e){} }); inflight=[]; lastQuery=query;
    var mine=++seq, env=null, wp=null, t0=Date.now(), base=RS+'/search?k=30&corpus='+V.corpus+'&q='+encodeURIComponent(query);
    meter(.15,false,'raging through the corpus…');
    if(V.legs.wp) fetch('/wp-json/wp/v2/search?per_page=10&search='+encodeURIComponent(query),sig()).then(function(r){ return r.ok?r.json():[]; }).then(function(j){ wp=j.map(function(x){ return {id:x.id,title:x.title,url:x.url}; }); wp.ms=Date.now()-t0; },function(){ wp=[]; }).then(function(){ render(env,wp,mine,query); });
    var fast=legsParam(false);
    var first=(RS&&fast?fetch(base+'&legs='+fast,sig()).then(function(r){ return r.ok?r.json():false; },function(){ return false; }):Promise.resolve(null));
    first.then(function(j){ env=j||(RS&&fast?false:null); render(env,wp,mine,query);
      if(RS&&V.legs.dense&&mine===seq){ var all=legsParam(true), tries=0;
        (function ask(){ fetch(base+'&legs='+all+'&wait=20000',sig()).then(function(r){ return r.ok?r.json():null; },function(){ return null; }).then(function(j2){ if(!j2||mine!==seq) return; env=j2; render(env,wp,mine,query);
          var d=j2.legs&&j2.legs.dense; if(d&&!d.ok&&/^pending/.test(d.error||'')&&++tries<3) setTimeout(ask,1500); }); })(); } }); }
  function rerun(){ var v=q.value.trim(); if(v.charAt(0)===':') return; if(v.length<2){ seq++; clear(list); clear(legsEl); meter(0,false,v?'keep going…':''); return; } search(v); }
  /* ── commands in the field: the variables, typed (browseML's field takes commands the same way) ── */
  var hist=[], hi=-1;
  function say(t){ log.appendChild(document.createTextNode(t+'\n')); }
  function command(line){ var p=line.slice(1).trim().split(/\s+/), c=p.shift();
    if(c==='legs'){ var want={}, map={words:'bm25',bm25:'bm25',meaning:'dense',dense:'dense',atlas:'atlas',wordpress:'wp',wp:'wp'}; p.forEach(function(w){ if(map[w]) want[map[w]]=true; });
      if(!Object.keys(want).length){ say('legs: words meaning atlas wordpress (now: '+LEGS.filter(function(L){ return V.legs[L[0]]; }).map(function(L){ return L[1]; }).join(' ')+')'); return; }
      LEGS.forEach(function(L){ V.legs[L[0]]=!!want[L[0]]; }); say('legs → '+LEGS.filter(function(L){ return V.legs[L[0]]; }).map(function(L){ return L[1]; }).join(' ')); }
    else if(c==='corpus'){ var m={articles:'articles',self:'self',rage:'self',own:'self',all:'all',both:'all'}[p[0]]; if(!m){ say('corpus: articles · self · all'); return; } V.corpus=m; say('corpus → '+m); }
    else if(c==='k'){ var n=parseInt(p[0],10); if(!(n>=1&&n<=30)){ say('k: 1..30'); return; } V.k=n; say('k → '+n); }
    else if(c==='spawn'){ spawn(); return; }
    else if(c==='clear'){ clearAll(); return; }
    else if(c==='face'||c==='faice'){ if(faceOpen()) faceHide(); else faceShow(); return; }
    else if(c==='panel'){ V.panel=!V.panel; keep(); paintVars(); if(V.panel) diagnose(); return; }
    else if(c==='help'||!c){ say(':legs words meaning atlas wordpress — which algorithms run\n:corpus articles|self|all — what is searched (self = RAGE retrieving RAGE)\n:k n — how many results\n:spawn — this answer as a response window · :clear · :panel\n:face — Jaimla’s faice: drop 👁 / 👂 on it\nanything else — the question'); return; }
    else { say('unknown: :'+c+' (try :help)'); return; }
    keep(); paintVars(); if(lastQuery) search(lastQuery); }
  q.addEventListener('input',function(){ var n=Date.now(); keys.push(n); keys=keys.filter(function(x){ return n-x<1500; }); meter(Math.min(.9,keys.length/9),false); spark(1);
    clearTimeout(timer); timer=setTimeout(rerun,260); });
  q.addEventListener('keydown',function(e){
    var v=q.value.trim(), cmd=v.charAt(0)===':'||!v;
    if(e.key==='Enter'){ e.preventDefault(); if(!v) return; hist.push(v); hi=hist.length; if(v.charAt(0)===':'){ say('› '+v); command(v); q.value=''; return; }
      var first=list.querySelector('.ri-card'); if(!first) return;
      if(first.classList.contains('ri-art')){ if(first.classList.contains('ri-on')){ var rd=first.querySelector('a.ri-act'); if(rd) location.href=rd.href; } else first._open(true); }
      else if(first.href) location.href=first.href; }
    else if((e.key==='ArrowUp'||(e.key==='ArrowDown'&&cmd))&&cmd&&hist.length){ e.preventDefault(); hi=Math.max(0,Math.min(hist.length,hi+(e.key==='ArrowUp'?-1:1))); q.value=hist[hi]||''; }
    else if(e.key==='ArrowDown'){ var f=list.querySelector('.ri-ah, a.ri-card'); if(f){ e.preventDefault(); f.focus(); } } });
  list.addEventListener('keydown',function(e){ var L=Array.prototype.slice.call(list.querySelectorAll('.ri-ah, a.ri-card, .ri-act')), i=L.indexOf(document.activeElement); if(i<0) return;
    if(e.key==='ArrowDown'){ e.preventDefault(); (L[i+1]||L[0]).focus(); } else if(e.key==='ArrowUp'){ e.preventDefault(); if(i===0) q.focus(); else L[i-1].focus(); } });
  window.RagebarImmersive={open:open,close:close,spawn:spawn,home:home,version:VERSION,vars:V};
})();
