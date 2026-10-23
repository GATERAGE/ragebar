/* rage-menu (RAGE plugin 1.5.5) — built from GATERAGE/ragebar wordpress/rage-menu-widget.html by tools/build-plugin.mjs. Edit the widget, not this file. */
(function(){
  if(window.__ragemap) return; window.__ragemap=1;
  var ATLAS='https://deltaverse.pythai.net/audio/atlas.json';
  var RS='https://deltaverse.pythai.net/ragesearch', DEFAULT_MODE='atlas', VERSION='1.1.0';
  var cfg=window.RAGE_MENU||{}; if(typeof cfg.search==='string') RS=cfg.search.replace(/\/+$/,''); if(cfg.atlas) ATLAS=cfg.atlas; if(cfg.mode==='atlas'||cfg.mode==='ragebar') DEFAULT_MODE=cfg.mode;
  var mode=DEFAULT_MODE, selfToo=false; try{ var sm=localStorage.getItem('ragemap_mode'); if(sm==='atlas'||sm==='ragebar') mode=sm; selfToo=localStorage.getItem('ragemap_self')==='1'; }catch(e){}
  var LLAMA='https://coins.llama.fi/prices/current/';
  var VOICE={overlord:'OVERLORD',jaimla:'JAIMLA',neural:'NEURAL'};
  var m=(document.body.className||'').match(/postid-(\d+)/), HERE=m?+m[1]:0;
  var A=null, BY={}, loading=null, trail=[], seen={}, collected={}, nodes=0;
  try{ var s=JSON.parse(sessionStorage.getItem('ragemap_v1')||'null'); if(s){ trail=s.trail||[]; seen=s.seen||{}; collected=s.collected||{}; } }catch(e){}
  function keep(){ try{ sessionStorage.setItem('ragemap_v1',JSON.stringify({trail:trail.slice(-40),seen:seen,collected:collected})); }catch(e){} }
  function h(tag,attrs,kids){
    var el=document.createElement(tag);
    if(attrs) for(var k in attrs){ if(k==='text') el.textContent=attrs[k]; else if(k==='on') for(var ev in attrs.on) el.addEventListener(ev,attrs.on[ev]); else el.setAttribute(k,attrs[k]); }
    (kids||[]).forEach(function(c){ if(c==null) return; el.appendChild(typeof c==='string'?document.createTextNode(c):c); });
    return el;
  }
  function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }
  function ago(t){ var s=Math.max(0,(Date.now()-t)/1000); return s<90?Math.round(s)+' s ago':s<5400?Math.round(s/60)+' min ago':s<172800?Math.round(s/3600)+' h ago':Math.round(s/86400)+' days ago'; }
  function load(){ if(A) return Promise.resolve(A); if(loading) return loading;
    loading=fetch(ATLAS,{cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(j){ A=j; j.art.forEach(function(a){ BY[a.id]=a; }); return j; })
      .catch(function(e){ loading=null; throw e; });
    return loading; }
  /* ── the panel ── */
  var nav=document.querySelector('ul.navigation-main')||document.querySelector('nav ul');
  if(!nav) return;
  var btn=h('button',{type:'button','aria-expanded':'false','aria-controls':'rm-panel',title:'walk rage: the atlas'},[h('span',{'class':'rm-glyph','aria-hidden':'true',text:'◈'}),'rage']);
  var li=h('li',{'class':'menu-item rm-li'},[btn]); nav.insertBefore(li,nav.firstChild);
  // the theme clones the header menu into its drawer (copying this item, or not, depending on timing): exactly one copy
  function mobile(){ var mob=document.querySelector('ul.navigation-mobile'); if(!mob) return; var c=mob.querySelectorAll('.rm-li');
    if(!c.length) mob.insertBefore(li.cloneNode(true),mob.firstChild); for(var i=1;i<c.length;i++) c[i].parentNode.removeChild(c[i]); }
  mobile(); document.addEventListener('DOMContentLoaded',function(){ setTimeout(mobile,0); }); window.addEventListener('load',function(){ mobile(); setTimeout(mobile,1500); });
  var cv=h('canvas',{'class':'rm-canvas','aria-hidden':'true'});
  var find=h('input',{'class':'rm-find',type:'search',placeholder:'travel by a word…','aria-label':'travel the atlas by a word'});
  var xbtn=h('button',{'class':'rm-x',type:'button','aria-label':'close the atlas',text:'×'});
  var mAtlas=h('span',{text:'atlas'}), mRage=h('span',{text:'ragebar'});
  var modeBtn=h('button',{'class':'rm-mode',type:'button',role:'switch','aria-label':'search mode: atlas or ragebar'},[mAtlas,mRage]);
  var legsEl=h('div',{'class':'rm-legs','aria-live':'polite'});
  var bar=h('i'), meterTxt=h('span',{text:''});
  var trailEl=h('div',{'class':'rm-trail','aria-label':'the trail you have travelled'});
  var tagsEl=h('div',{'class':'rm-tags','aria-label':'what you have collected'});
  var body=h('div',{'class':'rm-body',role:'tree','aria-label':'rage atlas'});
  var foot=h('div',{'class':'rm-foot'});
  var head=h('div',{'class':'rm-head'},[cv,h('div',{'class':'rm-row1'},[h('span',{'class':'rm-title',text:'rage · atlas'}),find,modeBtn,xbtn]),h('div',{'class':'rm-meter'},[h('span',{text:'complexity'}),h('span',{'class':'rm-bar'},[bar]),meterTxt]),legsEl,trailEl,tagsEl]);
  var box=h('div',{'class':'rm-box',role:'dialog','aria-label':'rage atlas'},[head,body,foot]);
  var panel=h('div',{'class':'rm-panel',id:'rm-panel'},[box]); document.body.appendChild(panel);
  function paintMode(){ var r=mode==='ragebar'; box.classList.toggle('rm-ragebar',r); mAtlas.className=r?'':'rm-m-on'; mRage.className=r?'rm-m-on':''; modeBtn.setAttribute('aria-checked',r?'true':'false');
    head.querySelector('.rm-title').textContent=r?'rage · ragebar':'rage · atlas';
    find.placeholder=r?'ask RAGE: words and meaning…':'travel by a word…'; find.setAttribute('aria-label',r?'search rage with RAGE: words and meaning':'travel the atlas by a word'); paintLegs(); }
  /* ── sparks, the ragebar's own ── */
  var ctx=cv.getContext('2d'), sparks=[], heat=0, raf=0, reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function sizeCv(){ var d=Math.min(window.devicePixelRatio||1,2); cv.width=head.clientWidth*d; cv.height=head.clientHeight*d; }
  function spark(n,amber){ if(reduce) return; for(var i=0;i<n;i++) sparks.push({x:Math.random()*cv.width,y:cv.height*(0.5+Math.random()*0.5),vx:(Math.random()-0.5)*2.2,vy:-(0.4+Math.random()*1.8),l:1,a:amber}); heat=Math.min(1,heat+n/40); if(!raf) raf=requestAnimationFrame(draw); }
  function draw(){ raf=0; if(!cv.width) return; ctx.clearRect(0,0,cv.width,cv.height); heat*=0.97;
    var g=ctx.createLinearGradient(0,cv.height,0,0); g.addColorStop(0,'rgba(61,220,132,'+(heat*0.16).toFixed(3)+')'); g.addColorStop(1,'rgba(61,220,132,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
    for(var i=sparks.length-1;i>=0;i--){ var s=sparks[i]; s.x+=s.vx; s.y+=s.vy; s.vy+=0.02; s.l-=0.025; if(s.l<=0){ sparks.splice(i,1); continue; } ctx.globalAlpha=s.l*0.85; ctx.fillStyle=s.a?'#ffb340':'#3ddc84'; ctx.fillRect(s.x,s.y,2,2); }
    ctx.globalAlpha=1; if(sparks.length||heat>0.01) raf=requestAnimationFrame(draw); }
  /* ── open / close ── */
  var isOpen=false;
  var from=null;
  function place(){ var r=from&&from.getBoundingClientRect(), vh=window.innerHeight, top=0;
    if(r&&r.height){ if(r.bottom>vh*0.45){ window.scrollBy(0,r.bottom-72); r=from.getBoundingClientRect(); } top=Math.max(0,r.bottom+6); }
    if(vh-top<320) top=Math.max(0,vh-320-12);
    panel.style.top=top+'px'; box.style.maxHeight=Math.max(300,vh-top-12)+'px'; }
  function expanded(v){ Array.prototype.forEach.call(document.querySelectorAll('.rm-li>button'),function(b){ b.setAttribute('aria-expanded',v); }); }
  function open(){ if(isOpen) return; isOpen=true; place(); panel.classList.remove('rm-closing'); panel.classList.add('rm-open'); expanded('true'); sizeCv(); spark(14);
    if(!body.firstChild) build(); setTimeout(function(){ try{ find.focus({preventScroll:true}); }catch(e){} },60); }
  function close(){ if(!isOpen) return; isOpen=false; expanded('false'); panel.classList.add('rm-closing');
    setTimeout(function(){ if(!isOpen){ panel.classList.remove('rm-open','rm-closing'); } }, reduce?0:180); try{ (from&&from.offsetParent?from:btn).focus({preventScroll:true}); }catch(e){} }
  // one handler for every copy of the button: the theme clones the header menu into its mobile drawer
  document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('.rm-li>button'); if(!b) return; e.preventDefault();
    if(isOpen){ close(); return; } from=b;
    if(b.closest('.navigation-mobile')){ var d=document.querySelector('.navigation-mobile-dismiss'); if(d) d.click(); from=null; }
    open(); });
  xbtn.addEventListener('click',close);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&isOpen) close(); });
  document.addEventListener('pointerdown',function(e){ if(isOpen&&!box.contains(e.target)&&!(e.target.closest&&e.target.closest('.rm-li'))) close(); });
  window.addEventListener('resize',function(){ if(isOpen){ place(); sizeCv(); } });
  /* ── the accordion node: drop in, drop out ── */
  function node(o){
    // o: {key,label,sub,n,leaf,spawned,fill(kids),cls}
    var tw=h('span',{'class':'rm-tw','aria-hidden':'true',text:'▸'});
    var lab=h('span',{'class':'rm-lab'},[o.label,o.sub?h('i',{text:o.sub}):null]);
    var sum=h('button',{'class':'rm-sum',type:'button','aria-expanded':'false'},[tw,lab,o.n!=null?h('span',{'class':'rm-n',text:String(o.n)}):null]);
    var kids=h('div',{'class':'rm-kids',role:'group'});
    var el=h('div',{'class':'rm-node'+(o.leaf?' rm-leaf':'')+(o.spawned?' rm-spawned':'')+(o.cls?' '+o.cls:''),role:'treeitem'},[sum,kids]);
    if(o.key&&seen[o.key]) el.classList.add('rm-seen');
    if(o.key) el.setAttribute('data-k',o.key);
    var filled=false;
    el._open=function(on){ if(on===undefined) on=!el.classList.contains('rm-on');
      if(on){ if(!o.spawned&&el.parentNode) Array.prototype.forEach.call(el.parentNode.children,function(sib){ if(sib!==el&&sib._open&&sib.classList.contains('rm-on')&&!sib.classList.contains('rm-spawned')) sib._open(false); });
        if(!filled){ filled=true; o.fill(kids,el); } el.classList.add('rm-on'); sum.setAttribute('aria-expanded','true');
        if(o.key) travel(o.key,o.trailLabel||o.label,o.tags,o.spawned); }
      else { el.classList.remove('rm-on'); sum.setAttribute('aria-expanded','false'); } };
    sum.addEventListener('click',function(){ el._open(); });
    return el;
  }
  /* ── travel: the trail and what it collects ── */
  function travel(key,label,tags,spawned){
    if(!seen[key]){ seen[key]=1; nodes++; }
    trail.push({k:key,l:String(label).slice(0,60)}); if(trail.length>40) trail.shift();
    (tags||[]).forEach(function(t){ collected[t]=(collected[t]||0)+1; });
    keep(); paintTravel(); spark(spawned?10:6,!!spawned);
  }
  function complexity(){ var n=Object.keys(seen).length, t=Object.keys(collected).length; return {n:n,t:t,v:Math.min(1,(n*0.6+t*0.4)/40)}; }
  function paintTravel(){
    if(mode==='ragebar'&&lastRage) paintRageMeter();
    else { var c=complexity(); bar.classList.remove('rm-red'); bar.style.width=Math.round(c.v*100)+'%'; bar.style.background=c.v>0.8?'#ffb340':'#3ddc84';
      meterTxt.textContent=c.n+' nodes · '+c.t+' tags collected'; }
    clear(trailEl); var last=trail.slice(-7);
    last.forEach(function(s,i){ if(i) trailEl.appendChild(h('span',{'class':'rm-sep',text:'›'}));
      trailEl.appendChild(h('button',{type:'button',title:s.l,text:s.l,on:{click:function(){ reveal(s.k); }}})); });
    clear(tagsEl); if(!A) return;
    topCollected(8).forEach(function(p){ tagsEl.appendChild(h('button',{'class':'rm-chip',type:'button',title:'spawn the path of this tag'},[A.tags[p[0]]||('#'+p[0]),h('b',{text:'×'+p[1]})])).addEventListener('click',function(){ spawnTop('tag:'+p[0]); }); });
    if(Object.keys(collected).length>1) tagsEl.appendChild(h('button',{'class':'rm-chip',type:'button',title:'where everything you collected points',text:'◎ converge',on:{click:function(){ spawnTop('converge'); }}}));
    if(trail.length) tagsEl.appendChild(h('button',{'class':'rm-chip',type:'button',title:'forget the trail',text:'↺',on:{click:function(){ trail=[]; seen={}; collected={}; keep(); paintTravel(); Array.prototype.forEach.call(body.querySelectorAll('.rm-seen'),function(e){ e.classList.remove('rm-seen'); }); }}}));
  }
  function topCollected(n){ return Object.keys(collected).map(function(k){ return [k,collected[k]]; }).filter(function(p){ return A&&A.tags[p[0]]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,n); }
  function reveal(key){ var el=body.querySelector('[data-k="'+key.replace(/"/g,'')+'"]'); if(el){ var p=el; while(p&&p!==body){ if(p._open&&!p.classList.contains('rm-on')) p._open(true); p=p.parentNode; } el.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'}); el.querySelector('.rm-sum').focus({preventScroll:true}); } }
  /* ── articles: the points of conclusion ── */
  function tagsOf(a){ return (a.g||[]).map(String).filter(function(t){ return A.tags[t]; }); }
  function score(a,b){ var ta=tagsOf(a), tb=tagsOf(b), inter=ta.filter(function(t){ return tb.indexOf(t)>=0; }).length, uni=ta.length+tb.length-inter;
    var pp=(a.p||[]).filter(function(p){ return (b.p||[]).indexOf(p)>=0; }).length; return (uni?inter/uni:0)+pp*0.35; }
  function kindred(a,n){ return A.art.filter(function(b){ return b.id!==a.id; }).map(function(b){ return [b,score(a,b)]; }).filter(function(p){ return p[1]>0.2; }).sort(function(x,y){ return y[1]-x[1]; }).slice(0,n||6).map(function(p){ return p[0]; }); }
  function thread(a){ var path=(a.p||[])[0], on=A.art.filter(function(b){ return (b.p||[]).indexOf(path)>=0; }).sort(function(x,y){ return x.d<y.d?-1:1; }), i=on.indexOf(a);
    return on.slice(Math.max(0,i-3),i).concat(on.slice(i+1,i+4)); }
  function converge(n){ var w=collected; return A.art.map(function(b){ var s=0; tagsOf(b).forEach(function(t){ s+=(w[t]||0); }); return [b,s]; }).filter(function(p){ return p[1]>0; }).sort(function(x,y){ return y[1]-x[1]; }).slice(0,n||7).map(function(p){ return p[0]; }); }
  function byTag(t){ return A.art.filter(function(b){ return tagsOf(b).indexOf(String(t))>=0; }).slice(0,12); }
  function artNode(a,spawned){
    var key='a'+a.id+(spawned?'@'+spawned:'');
    var el=node({key:'a'+a.id,label:a.t,sub:a.d+(a.v?' · ♪ '+a.v.map(function(v){ return VOICE[v]||v; }).join(' '):''),leaf:true,spawned:!!spawned,tags:tagsOf(a),trailLabel:a.t,cls:a.id===HERE?'rm-here':'',
      fill:function(k,self){
        var end=h('div',{'class':'rm-end'});
        if(a.x) end.appendChild(h('p',{text:a.x}));
        end.appendChild(h('div',{'class':'rm-meta'},[a.d+' · post '+a.id,a.v?h('span',{'class':'rm-voice',text:' · LISTEN in '+a.v.map(function(v){ return VOICE[v]||v; }).join(', ')}):' · not rendered yet']));
        var acts=h('div',{'class':'rm-acts'});
        acts.appendChild(h('a',{'class':'rm-act',href:a.u,text:a.id===HERE?'you are reading it':'read →'}));
        acts.appendChild(h('button',{'class':'rm-act',type:'button',text:'✵ kindred',on:{click:function(){ spawn(k,'kindred · '+a.t,kindred(a),a.id); }}}));
        acts.appendChild(h('button',{'class':'rm-act',type:'button',text:'↔ its thread',on:{click:function(){ spawn(k,'its thread · '+(a.p||[])[0],thread(a),a.id); }}}));
        tagsOf(a).slice(0,5).forEach(function(t){ acts.appendChild(h('button',{'class':'rm-chip',type:'button',text:'#'+A.tags[t],on:{click:function(){ spawn(k,'#'+A.tags[t],byTag(t),a.id); }}})); });
        if(Object.keys(collected).length>1) acts.appendChild(h('button',{'class':'rm-act',type:'button',text:'◎ converge',on:{click:function(){ spawn(k,'where your path converges',converge(),a.id); }}}));
        end.appendChild(acts); k.appendChild(end);
      }});
    el.setAttribute('data-k',key); return el;
  }
  function spawn(kids,label,list,from){
    var el=node({key:'s'+label,label:'↳ '+label,n:list.length,spawned:true,trailLabel:label,
      fill:function(k){ if(!list.length) k.appendChild(h('div',{'class':'rm-empty',text:'no path spawns from here yet: collect more.'})); list.forEach(function(b){ if(b.id!==from) k.appendChild(artNode(b,label)); }); }});
    var drop=h('button',{'class':'rm-x',type:'button','aria-label':'drop this path out',title:'drop out',text:'×',on:{click:function(e){ e.stopPropagation(); el.parentNode&&el.parentNode.removeChild(el); spark(4); }}});
    el.querySelector('.rm-sum').appendChild(drop);
    kids.appendChild(el); el._open(true); el.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});
  }
  function spawnTop(kind){ var list, label;
    if(kind==='converge'){ list=converge(); label='where your path converges'; }
    else { var t=kind.slice(4); list=byTag(t); label='#'+A.tags[t]; }
    var holder=body.querySelector('.rm-spawnroot'); if(!holder){ holder=h('div',{'class':'rm-spawnroot'}); body.insertBefore(holder,body.firstChild); }
    spawn(holder,label,list,0); }
  /* ── the chain diagnostics ── */
  function kv(pairs){ var g=h('div',{'class':'rm-kv'}); pairs.forEach(function(p){ if(p[1]==null||p[1]==='') return; g.appendChild(h('span',{text:p[0]})); g.appendChild(typeof p[1]==='object'?p[1]:h('span',{text:String(p[1])})); }); return g; }
  function verdict(ok,txt,warn){ return h('span',{'class':ok?(warn?'rm-warn':'rm-ok'):'rm-bad',text:txt}); }
  function usd(x){ if(x==null) return '—'; if(x>=1) return '$'+x.toLocaleString(undefined,{maximumFractionDigits:2}); if(x>=0.0001) return '$'+x.toPrecision(4); return '$'+x.toExponential(4); }
  function diagNode(d){
    var sub=(d.ok?'':'unavailable · ')+d.note;
    return node({key:'d'+d.id,label:d.label,sub:sub,leaf:true,trailLabel:d.label,fill:function(k){
      var end=h('div',{'class':'rm-end'}), read='read '+ago(d.read*1000)+' by the atlas';
      if(!d.ok&&d.kind!=='client'){ end.appendChild(kv([['verdict',verdict(false,d.error||'unavailable')],['read',read]])); }
      else if(d.kind==='keeper'){ var age=(Date.now()-Date.parse(d.last))/1000, fresh=age<3*(d.cadence||300);
        end.appendChild(kv([['verdict',verdict(fresh,fresh?'fresh — last batch '+ago(Date.parse(d.last)):'STALE — last batch '+ago(Date.parse(d.last)),!fresh&&age<86400)],['batches',d.batches.toLocaleString()+' since '+String(d.first).slice(0,10)],['coins',d.coins+' chains · '+d.points.toLocaleString()+' points'],['cadence',d.cadence+' s'],['blocktime',Object.keys(d.blocks||{}).map(function(c){ return c+' #'+d.blocks[c].number+' (drift '+d.blocks[c].drift+' s)'; }).join(' · ')],['prices','behind x402 ('+d.paygate+'), not copied here'],['read',read]])); }
      else if(d.kind==='client'){ var out=h('div',{text:'reading DefiLlama from this browser…','class':'rm-meta'}); end.appendChild(out);
        fetch(LLAMA+d.coins.join(',')).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).then(function(j){ clear(out); out.className='';
          out.appendChild(kv(d.coins.map(function(c){ var p=(j.coins||{})[c]; return [p?(p.symbol||c.split(':')[1]).toUpperCase():c.split(':')[1],p?usd(p.price)+' · '+ago(p.timestamp*1000)+(p.confidence!=null?' · confidence '+p.confidence:''):verdict(false,'no price')]; })));
          out.appendChild(h('div',{'class':'rm-meta',text:'read now by your browser from coins.llama.fi — the board ranks 2,700+ chains'})); spark(8); })
        .catch(function(e){ clear(out); out.appendChild(verdict(false,'unavailable: '+e.message)); }); }
      else if(d.kind==='luv'){ end.appendChild(kv([['price',usd(d.priceUsd)],['in ETH',d.priceNative!=null?d.priceNative.toExponential(4):null],['source',d.source+' (Uniswap V2 pair '+String(d.pair).slice(0,10)+'…)'],['24 h txns',d.h24!=null?String(d.h24):null],['oracle read',d.t?ago(d.t):null],['read',read]])); }
      else if(d.kind==='identity'){ var bad=/rekey|absent/i.test(JSON.stringify(d.accounts||[]));
        end.appendChild(kv([['verdict',verdict(d.verdict==='verified'&&!bad,d.verdict)],['network',d.network+' · indexer lag '+d.lag+' rounds']].concat((d.accounts||[]).map(function(a){ return [a.role||'account',String(a.address).slice(0,8)+'…'+String(a.address).slice(-6)+' · '+a.verdict+(a.findings.length?' · '+a.findings.join(', '):'')]; })).concat([['not verified','custody of the key — the chain shows authority, not possession'],['read',read]]))); }
      else if(d.kind==='storage'){ var none=!d.anchored&&!d.ipfs;
        end.appendChild(kv([['verdict',verdict(!none,none?'nothing offloaded or anchored yet':'anchoring',none)],['local / ipfs / thot',d.local+' / '+d.ipfs+' / '+d.thot],['anchored',d.anchored],['last offload',d.last_offload||'never'],['read',read]])); }
      else if(d.kind==='ledger'){ end.appendChild(kv([['verdict',verdict(true,(d.articles_complete||0)+' of '+(d.articles_known||0)+' articles complete')],['renders',(d.renders_ok||0)+' measured ok of '+(d.renders||0)],['voices',(d.voices||[]).map(function(v){ return VOICE[v]||v; }).join(' · ')],['queue',(d.pending!=null?d.pending+' articles':'')+(d.etaSeconds?' · ≈'+Math.round(d.etaSeconds/3600)+' h':'')],['said wrong',d.said_wrong],['read',read]])); }
      else if(d.kind==='links'){ var acts=h('div',{'class':'rm-acts'}); (d.links||[]).forEach(function(l){ acts.appendChild(h('a',{'class':'rm-act',href:l[1],target:'_blank',rel:'noopener',text:l[0]+' ↗'})); }); end.appendChild(acts); }
      if(d.public&&d.kind!=='links'){ end.appendChild(h('div',{'class':'rm-acts'},[h('a',{'class':'rm-act',href:d.public,target:'_blank',rel:'noopener',text:'the source ↗'})])); }
      k.appendChild(end); }});
  }
  /* ── the tree ── */
  function build(){
    clear(body); body.appendChild(h('div',{'class':'rm-empty',text:'drawing the atlas…'}));
    load().then(function(a){
      clear(body);
      a.tree.forEach(function(b){
        body.appendChild(node({key:'b'+b.id,label:b.label,sub:b.note,n:b.n,trailLabel:b.label,fill:function(k){
          if(b.diagnostics) k.appendChild(node({key:'p'+b.id+'/live',label:'live diagnostics',sub:'read every 15 minutes, prices read now',n:a.diagnostics.length,trailLabel:'live diagnostics',fill:function(kk){ a.diagnostics.forEach(function(d){ kk.appendChild(diagNode(d)); }); }}));
          b.paths.forEach(function(p){ if(!p.n) return;
            k.appendChild(node({key:'p'+p.id,label:p.label,n:p.n,trailLabel:p.label,fill:function(kk){
              if(p.months) p.months.forEach(function(mo){ kk.appendChild(node({key:'m'+p.id+mo.m,label:new Date(mo.m+'-15').toLocaleDateString(undefined,{month:'long',year:'numeric'}),n:mo.a.length,trailLabel:mo.m,fill:function(k3){ mo.a.forEach(function(id){ if(BY[id]) k3.appendChild(artNode(BY[id])); }); }})); });
              else p.a.forEach(function(id){ if(BY[id]) kk.appendChild(artNode(BY[id])); });
            }}));
          });
        }}));
      });
      clear(foot); foot.appendChild(h('div',{},['atlas of '+a.articles+' articles · drawn '+ago(Date.parse(a.generated))+' · ',h('a',{href:a.txt,target:'_blank',rel:'noopener',text:'atlas.txt'}),' (for machines) · ',h('a',{href:'/llms.txt',text:'llms.txt'}),' · ',h('a',{href:'/ragebar/',text:'ragebar'})]));
      paintTravel();
      if(HERE&&BY[HERE]){ var me=BY[HERE], first=(me.p||[])[0]||'';
        ['b'+first.split('/')[0],'p'+first,'m'+first+me.d.slice(0,7)].forEach(function(k){ var el=body.querySelector('[data-k="'+k+'"]'); if(el&&!el.classList.contains('rm-on')) el._open(true); });
        var mine=body.querySelector('[data-k="a'+HERE+'"]'); if(mine) mine.scrollIntoView({block:'nearest'}); }
    }).catch(function(e){ clear(body); body.appendChild(h('div',{'class':'rm-empty'},['the atlas could not be read (',String(e.message||e),'). ',h('a',{href:'/ragebar/',text:'search with the ragebar instead'})])); });
  }
  /* ── travel by a word: an instant path from the atlas, then the full text from WordPress ── */
  var timer=null, seq=0, lastRage=null, typed=[];
  function holderEl(){ var holder=body.querySelector('.rm-spawnroot'); if(!holder){ holder=h('div',{'class':'rm-spawnroot'}); body.insertBefore(holder,body.firstChild); } return holder; }
  function atlasFind(q,mine){ load().then(function(){ if(mine!==seq) return; var ql=q.toLowerCase();
      var hits=A.art.filter(function(a){ return (a.t+' '+a.x+' '+tagsOf(a).map(function(t){ return A.tags[t]; }).join(' ')).toLowerCase().indexOf(ql)>=0; }).slice(0,10);
      var holder=holderEl();
      var prev=holder.querySelector('.rm-find-path'); if(prev) prev.parentNode.removeChild(prev);
      spawn(holder,'“'+q+'”',hits,0); holder.lastChild.classList.add('rm-find-path');
      fetch('/wp-json/wp/v2/search?per_page=8&search='+encodeURIComponent(q)).then(function(r){ return r.ok?r.json():[]; }).then(function(j){ if(mine!==seq) return;
        var more=j.map(function(r){ return BY[r.id]; }).filter(function(a){ return a&&hits.indexOf(a)<0; });
        if(more.length){ var k=holder.lastChild.querySelector('.rm-kids'); k.appendChild(h('div',{'class':'rm-meta',text:'… and in the full text:'})); more.forEach(function(a){ k.appendChild(artNode(a,'"'+q+'"')); }); }
      }).catch(function(){}); }); }
  /* ── ragebar mode: RAGE search (ragesearch/1), several legs, fused by rank in this browser ── */
  function rrf(rankings){ var acc={}; Object.keys(rankings).forEach(function(leg){ var seen={}; rankings[leg].forEach(function(id,i){ if(seen[id]) return; seen[id]=1; var e=acc[id]||(acc[id]={id:id,s:0,ranks:{}}); e.s+=1/(60+i+1); e.ranks[leg]=i+1; }); });
    return Object.keys(acc).map(function(k){ return acc[k]; }).sort(function(a,b){ return b.s-a.s||(String(a.id)<String(b.id)?-1:1); }); }
  function legName(n){ return {bm25:'words',dense:'meaning',atlas:'atlas',wp:'wordpress'}[n]||n; }
  function paintLegs(){ clear(legsEl); if(mode!=='ragebar') return;
    if(!lastRage){ legsEl.appendChild(h('span',{text:'RAGE: words (BM25) · meaning (pgvectorscale) · atlas · wordpress — fused by rank'})); }
    else Object.keys(lastRage.legs).forEach(function(n){ var l=lastRage.legs[n], pend=!l.ok&&/^pending/.test(l.error||'');
      legsEl.appendChild(h('span',{title:(l.algorithm||'')+(l.error?' — '+l.error:'')+(l.note?' — '+l.note:'')},[legName(n)+' ',h('b',{'class':l.ok?'rm-ok':pend?'rm-warn':'rm-bad',text:l.ok?(l.n+' · '+Math.round(l.ms)+' ms'):pend?'embedding your words…':(l.error==='not configured'?'not configured':'unavailable')})])); });
    legsEl.appendChild(h('button',{'class':'rm-chip',type:'button',title:'also search RAGE\'s own docs and code',text:(selfToo?'✓ ':'+ ')+'RAGE\'s own docs',on:{click:function(){ selfToo=!selfToo; try{ localStorage.setItem('ragemap_self',selfToo?'1':'0'); }catch(e){} rerun(); }}})); }
  function paintRageMeter(){ var n=lastRage.results.length; bar.classList.toggle('rm-red',!n); bar.style.width=(n?Math.min(100,20+n*8):100)+'%';
    meterTxt.textContent=n?n+' found · '+Object.keys(lastRage.legs).filter(function(k){ return lastRage.legs[k].ok; }).length+' of '+Object.keys(lastRage.legs).length+' legs':'nothing. the engine is furious.'; }
  function rageRender(q,env,wpIds,mine){ if(mine!==seq) return;
    var rankings={}, items={};
    (env&&env.results||[]).forEach(function(r){ items[r.id]=r; Object.keys(r.ranks||{}).forEach(function(leg){ (rankings[leg]=rankings[leg]||[])[r.ranks[leg]-1]=r.id; }); });
    Object.keys(rankings).forEach(function(leg){ rankings[leg]=rankings[leg].filter(function(x){ return x!=null; }); });
    var legs={}; if(env) Object.keys(env.legs).forEach(function(k){ legs[k]=env.legs[k]; });
    if(wpIds){ rankings.wp=wpIds; legs.wp={algorithm:'WordPress search (this browser)',ok:true,ms:wpIds.ms||0,n:wpIds.length}; }
    else legs.wp={algorithm:'WordPress search (this browser)',ok:false,error:'pending: asking WordPress',n:0,ms:0};
    if(!env) legs.ragesearch={algorithm:RS||'no search service',ok:false,error:RS?'unavailable':'not configured',n:0,ms:0};
    var fused=rrf(rankings).slice(0,12);
    lastRage={legs:legs,results:fused}; paintLegs(); paintRageMeter(); spark(Math.min(14,2+fused.length),!fused.length);
    var holder=holderEl(); var prev=holder.querySelector('.rm-find-path'); if(prev) prev.parentNode.removeChild(prev);
    var el=node({key:'s“'+q+'”',label:'↳ RAGE · “'+q+'”',n:fused.length,spawned:true,trailLabel:q,fill:function(k){
      if(!fused.length) k.appendChild(h('div',{'class':'rm-empty',text:'nothing. the engine is furious.'}));
      fused.forEach(function(e){ var ranks=h('span',{'class':'rm-rank',text:Object.keys(e.ranks).map(function(l){ return legName(l)+' '+e.ranks[l]; }).join(' · ')});
        var a=BY[e.id], it=items[e.id]||{};
        if(a){ var an=artNode(a,'RAGE '+q); an.querySelector('.rm-lab').appendChild(ranks); if(it.snippet) an.querySelector('.rm-lab').appendChild(h('span',{'class':'rm-snip',text:it.snippet})); k.appendChild(an); }
        else { var lab=h('span',{'class':'rm-lab'},[it.title||String(e.id),ranks,it.snippet?h('span',{'class':'rm-snip',text:it.snippet}):null]);
          k.appendChild(h('div',{'class':'rm-node rm-leaf rm-spawned'},[h('a',{'class':'rm-sum',href:it.url||'#',target:it.corpus==='self'?'_blank':'',rel:'noopener'},[h('span',{'class':'rm-tw','aria-hidden':'true',text:it.corpus==='self'?'⌘':'▸'}),lab])])); } }); }});
    el.classList.add('rm-find-path');
    el.querySelector('.rm-sum').appendChild(h('button',{'class':'rm-x',type:'button','aria-label':'drop this path out',text:'×',on:{click:function(ev){ ev.stopPropagation(); el.parentNode&&el.parentNode.removeChild(el); lastRage=null; paintLegs(); paintTravel(); }}}));
    holder.appendChild(el); el._open(true); }
  function rageFind(q,mine){ load().catch(function(){}).then(function(){ if(mine!==seq) return;
    var corpus=selfToo?'all':'articles', base=RS+'/search?k=30&corpus='+corpus+'&q='+encodeURIComponent(q), env=null, wp=null, t0=Date.now();
    fetch('/wp-json/wp/v2/search?per_page=10&search='+encodeURIComponent(q)).then(function(r){ return r.ok?r.json():[]; }).then(function(j){ wp=j.map(function(r){ return r.id; }); wp.ms=Date.now()-t0; },function(){ wp=[]; }).then(function(){ if(env!==null) rageRender(q,env||null,wp,mine); });
    (RS?fetch(base+'&legs=fast'):Promise.resolve(null)).then(function(r){ return r&&r.ok?r.json():null; },function(){ return null; }).then(function(j){ env=j||false; rageRender(q,j,wp,mine);
      if(j&&mine===seq) fetch(base+'&legs=all&wait=20000').then(function(r){ return r.ok?r.json():null; },function(){ return null; }).then(function(j2){ if(j2&&j2.legs&&j2.legs.dense){ env=j2; rageRender(q,j2,wp,mine);
        if(!j2.legs.dense.ok&&/^pending/.test(j2.legs.dense.error||'')&&mine===seq) setTimeout(function(){ if(mine!==seq) return; fetch(base+'&legs=all&wait=20000').then(function(r){ return r.ok?r.json():null; }).then(function(j3){ if(j3){ env=j3; rageRender(q,j3,wp,mine); } }).catch(function(){}); },1500); } }); }); }); }
  function rerun(){ var q=find.value.trim(); if(q.length<2){ paintLegs(); return; } var mine=++seq; (mode==='ragebar'?rageFind:atlasFind)(q,mine); }
  find.addEventListener('input',function(){ clearTimeout(timer); var q=find.value.trim(); if(q.length<2) return;
    timer=setTimeout(rerun,300); });
  modeBtn.addEventListener('click',function(){ mode=mode==='ragebar'?'atlas':'ragebar'; try{ localStorage.setItem('ragemap_mode',mode); }catch(e){} lastRage=null; var prev=body.querySelector('.rm-find-path'); if(prev) prev.parentNode.removeChild(prev); paintMode(); paintTravel(); rerun(); find.focus(); });
  find.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); } });
  paintMode();
  paintTravel();
})();
