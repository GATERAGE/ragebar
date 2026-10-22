/* ragebar-immersive (RAGE plugin 1.2.1) — built from GATERAGE/ragebar wordpress/ragebar-immersive.html by tools/build-plugin.mjs. Edit the widget, not this file. */
(function(){
  if(window.__ragebarImmersive) return; window.__ragebarImmersive=1; window.__ragebar=1;
  var VERSION='1.0.0', cfg=window.RAGEBAR||{}, RS=typeof cfg.search==='string'?cfg.search.replace(/\/+$/,''):'https://deltaverse.pythai.net/ragesearch';
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
  var panel=h('div',{'class':'ri-panel',role:'region','aria-label':'RAGE control panel'}), diag=h('div',{'class':'ri-diag'});
  var mRage=h('button',{type:'button','aria-pressed':'true',title:'RAGE mode: search, and the control panel is the RAGE panel',text:'RAGE'}), mAtlas=h('button',{type:'button','aria-pressed':'false',title:'atlas: walk every article as a path (the rage menu)',text:'atlas'});
  var modeRow=h('span',{'class':'ri-mode',role:'group','aria-label':'mode'},[mRage,mAtlas]);
  var dvEl=h('a',{'class':'ri-dv',href:'https://deltaverse.pythai.net/',target:'_blank',rel:'noopener',title:'the DeltaVerse substrate sequence, counted live from engine/ngn/substrate-sequence.json',text:'DeltaVerse ◇ …'});
  var rolo=h('div',{'class':'ri-rolo',tabindex:'0',role:'listbox','aria-label':'personas: drop a .persona on the field to add one'});
  var xBtn=h('button',{'class':'ri-btn',type:'button','aria-label':'close RAGE search',text:'esc ×'});
  var vars=h('div',{'class':'ri-vars',role:'group','aria-label':'RAGE variables'});
  var fill=h('i'), status=h('span',{text:''});
  var hint=h('div',{'class':'ri-hint',text:''});
  var field=h('div',{'class':'ri-field'},[h('div',{'class':'ri-bar'},[h('span',{'class':'ri-dot'}),h('b',{text:'RAGE'}),modeRow,h('span',{'class':'ri-sp'}),dvEl,termBtn,spawnBtn,homeBtn,xBtn]),q,rolo,h('div',{'class':'ri-meter'},[h('span',{'class':'ri-bar2'},[fill]),status]),hint,panel]);
  var legsEl=h('div',{'class':'ri-legs','aria-live':'polite'}), log=h('div',{'class':'ri-term-log','aria-live':'polite'}), list=h('ol',{'class':'ri-results','aria-label':'results'});
  var foot=h('div',{'class':'ri-foot'},['ragebar immersive '+VERSION+' · RAGE search to the ',h('a',{href:'https://github.com/GATERAGE/ragebar/blob/main/RAGESEARCH.md',target:'_blank',rel:'noopener',text:'ragesearch/1 standard'}),' · variables after ',h('a',{href:'https://github.com/Professor-Codephreak/ultimate-input-field',target:'_blank',rel:'noopener',text:'ultimate-input-field'}),' · ',h('a',{href:'/ragebar/',text:'the ragebar page'})]);
  var stage=h('div',{'class':'ri-stage'},[field,legsEl,log,list,foot]);
  var box=h('div',{'class':'ri',role:'dialog','aria-modal':'true','aria-label':'RAGE search'},[h('div',{'class':'ri-back'}),cv,stage]);
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
    substrates(); paintRolo(); loadBuilt(current()); if(V.panel) diagnose(); if(seed!=null&&seed!==''&&q.value!==seed){ q.value=seed; rerun(); } setTimeout(function(){ try{ q.focus({preventScroll:true}); }catch(e){} },30); }
  function close(){ if(!isOpen) return; isOpen=false; box.classList.add('ri-closing'); document.documentElement.style.overflow='';
    setTimeout(function(){ if(!isOpen) box.classList.remove('ri-open','ri-closing'); },reduce?0:180); try{ back&&back.focus&&back.focus({preventScroll:true}); }catch(e){} }
  xBtn.addEventListener('click',close);
  box.addEventListener('pointerdown',function(e){ if(e.target===stage||e.target.classList.contains('ri-back')) close(); });
  window.addEventListener('resize',function(){ if(isOpen) size(); });
  document.addEventListener('keydown',function(e){ var t=e.target, typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);
    if(e.key==='Escape'&&isOpen){ e.preventDefault(); close(); }
    else if(e.key==='/'&&!typing&&!isOpen){ e.preventDefault(); open(''); } });
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
    var fused=rrf(R).slice(0,V.k); paintLegs(legs); clear(list);
    // the DeltaVerse event contract: a substrate (rage-substrate.js) draws what RAGE just did
    try{ document.dispatchEvent(new CustomEvent('dv:rage',{detail:{query:query,legs:legs,results:fused.map(function(e){ return {id:e.id,title:(items[e.id]||{}).title,ranks:e.ranks}; })}})); }catch(e){}
    fused.forEach(function(e,i){ var it=items[e.id]||{}, max=fused[0].s;
      var ranks=h('div',{'class':'ri-ranks'}); Object.keys(e.ranks).forEach(function(l){ ranks.appendChild(h('span',{'class':'ri-rank',text:legName(l)+' '+e.ranks[l]})); });
      var card=h(it.url?'a':'div',{'class':'ri-card',href:it.url||null,tabindex:'0',style:'animation-delay:'+(i*35)+'ms'},[h('div',{'class':'ri-t',text:it.title||String(e.id)}),h('div',{'class':'ri-m',text:[it.date,it.corpus==='self'?"RAGE's own":'',it.kind&&it.kind!=='article'?it.kind:''].filter(Boolean).join(' · ')}),it.snippet?h('div',{'class':'ri-s',text:it.snippet}):null,ranks,h('div',{'class':'ri-fuse',style:'width:'+Math.round(e.s/max*100)+'%'})]);
      if(it.corpus==='self'||it.kind==='persona'){ if(it.url){ card.target='_blank'; card.rel='noopener'; } }
      if(!it.url) card.removeAttribute('href'); list.appendChild(h('li',{},[card])); });
    var pend=function(k){ return !legs[k].ok&&/^pending/.test(legs[k].error||''); };
    var done=Object.keys(legs).every(function(k){ return !pend(k); }), wordsDone=Object.keys(legs).every(function(k){ return k==='dense'||!pend(k); });
    if(!fused.length&&wordsDone){ meter(1,true,'nothing. the engine is furious.'+(done?'':' · meaning still raging…')); if(done||!box.__red){ spark(30,true); } box.__red=1; }
    else { box.__red=0; meter(.3+Math.min(.7,fused.length/Math.max(1,V.k)*.7),false,fused.length+' found · '+Object.keys(legs).filter(function(k){ return legs[k].ok; }).length+' of '+Object.keys(legs).length+' legs'+(done?'':' · still raging…')); spark(Math.min(20,3+fused.length)); } }
  function legsParam(dense){ var a=[]; if(V.legs.bm25) a.push('bm25'); if(V.legs.atlas) a.push('atlas'); if(dense&&V.legs.dense) a.push('dense'); return a.join(','); }
  function search(query){ inflight.forEach(function(c){ try{ c.abort(); }catch(e){} }); inflight=[]; lastQuery=query;
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
    else if(c==='panel'){ V.panel=!V.panel; keep(); paintVars(); if(V.panel) diagnose(); return; }
    else if(c==='help'||!c){ say(':legs words meaning atlas wordpress — which algorithms run\n:corpus articles|self|all — what is searched (self = RAGE retrieving RAGE)\n:k n — how many results\n:spawn — this answer as a response window · :clear · :panel\nanything else — the question'); return; }
    else { say('unknown: :'+c+' (try :help)'); return; }
    keep(); paintVars(); if(lastQuery) search(lastQuery); }
  q.addEventListener('input',function(){ var n=Date.now(); keys.push(n); keys=keys.filter(function(x){ return n-x<1500; }); meter(Math.min(.9,keys.length/9),false); spark(1);
    clearTimeout(timer); timer=setTimeout(rerun,260); });
  q.addEventListener('keydown',function(e){
    var v=q.value.trim(), cmd=v.charAt(0)===':'||!v;
    if(e.key==='Enter'){ e.preventDefault(); if(!v) return; hist.push(v); hi=hist.length; if(v.charAt(0)===':'){ say('› '+v); command(v); q.value=''; return; }
      var a=list.querySelector('a'); if(a) location.href=a.href; }
    else if((e.key==='ArrowUp'||(e.key==='ArrowDown'&&cmd))&&cmd&&hist.length){ e.preventDefault(); hi=Math.max(0,Math.min(hist.length,hi+(e.key==='ArrowUp'?-1:1))); q.value=hist[hi]||''; }
    else if(e.key==='ArrowDown'){ var f=list.querySelector('a'); if(f){ e.preventDefault(); f.focus(); } } });
  list.addEventListener('keydown',function(e){ var L=Array.prototype.slice.call(list.querySelectorAll('a')), i=L.indexOf(document.activeElement); if(i<0) return;
    if(e.key==='ArrowDown'){ e.preventDefault(); (L[i+1]||L[0]).focus(); } else if(e.key==='ArrowUp'){ e.preventDefault(); if(i===0) q.focus(); else L[i-1].focus(); } });
  window.RagebarImmersive={open:open,close:close,spawn:spawn,home:home,version:VERSION,vars:V};
})();
