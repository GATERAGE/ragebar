/* ragebar-classic (RAGE plugin 1.2.0) — built from GATERAGE/ragebar wordpress/ragebar-widget.html by tools/build-plugin.mjs. Edit the widget, not this file. */
/* ragebar widget v1.1.0 | github.com/GATERAGE/ragebar wordpress/ragebar-widget.html
   v1.1.0: the canvas sleeps when idle (no endless animation loop), repeated queries answer from a
   5-minute in-page cache, arrow keys walk the results and Esc returns to the field, "/" opens the
   search from anywhere, the header magnifier is visible and focusable, and a link reaches every result.
   The search itself is unchanged: same endpoint, per_page=8, 260 ms debounce, 2-character minimum. */
(function(){
  if(window.__ragebar) return; window.__ragebar=1;
  function attach(input){
    if(!input||input.dataset.rb) return; input.dataset.rb='1';
    // Build the UI with the DOM API, never innerHTML with markup: WordPress
    // content filters rewrite HTML inside strings (wpautop turned the blank
    // lines in the first version of this script into </p><p> and broke it).
    var wrap=document.createElement('div'); wrap.className='rb-wrap';
    var cv=document.createElement('canvas'); cv.className='rb-canvas'; cv.setAttribute('aria-hidden','true');
    var meter=document.createElement('div'); meter.className='rb-meter';
    var fill=document.createElement('i'); meter.appendChild(fill);
    var stat=document.createElement('p'); stat.className='rb-stat'; stat.setAttribute('role','status'); stat.setAttribute('aria-live','polite');
    var list=document.createElement('ul'); list.className='rb-list';
    var uid='rb'+(++window.__ragebarN||(window.__ragebarN=1));
    list.id=uid+'-list'; list.setAttribute('aria-label','search results'); stat.id=uid+'-stat';
    var all=document.createElement('a'); all.className='rb-all'; all.style.display='none';
    var keysHint=document.createElement('p'); keysHint.className='rb-keys';
    [['↓','results'],['esc','back'],['enter','all results']].forEach(function(k,i){ if(i) keysHint.appendChild(document.createTextNode(' · ')); var b=document.createElement('kbd'); b.textContent=k[0]; keysHint.appendChild(b); keysHint.appendChild(document.createTextNode(' '+k[1])); });
    keysHint.style.display='none';
    input.setAttribute('aria-controls',list.id); input.setAttribute('aria-describedby',stat.id); input.setAttribute('autocomplete','off');
    wrap.appendChild(cv); wrap.appendChild(meter); wrap.appendChild(stat); wrap.appendChild(list); wrap.appendChild(all); wrap.appendChild(keysHint);
    input.parentNode.insertBefore(wrap, input.nextSibling);
    var ctx=cv.getContext('2d'), rage=0, target=0, sparks=[], last=0, keys=[];
    var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
    function resize(){var d=Math.min(window.devicePixelRatio||1,2);cv.width=(wrap.clientWidth||560)*d;cv.height=52*d;}
    function spark(n,hot){for(var i=0;i<n;i++){sparks.push({x:Math.random()*cv.width,y:cv.height*(0.4+Math.random()*0.5),vx:(Math.random()-0.5)*2.4,vy:-(0.5+Math.random()*2),l:1,hot:hot});}}
    var raf=0;
    function wake(){ if(!raf&&!reduce) raf=requestAnimationFrame(draw); }
    function draw(now){
      raf=0;
      if(reduce||!cv.width) return;
      if(sparks.length||target>0.004||rage>0.004) raf=requestAnimationFrame(draw);
      if(now-last<33) return; last=now;
      rage+=(target-rage)*0.09; target*=0.965;
      ctx.clearRect(0,0,cv.width,cv.height);
      var g=ctx.createLinearGradient(0,cv.height,0,0);
      g.addColorStop(0,'rgba(61,220,132,'+(0.04+rage*0.22).toFixed(3)+')');
      g.addColorStop(1,'rgba(61,220,132,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
      for(var i=sparks.length-1;i>=0;i--){var s=sparks[i];s.x+=s.vx;s.y+=s.vy;s.vy+=0.02;s.l-=0.022;
        if(s.l<=0){sparks.splice(i,1);continue;}
        ctx.globalAlpha=Math.max(0,s.l)*0.85; ctx.fillStyle=s.hot?'#ff3b30':'#3ddc84'; ctx.fillRect(s.x,s.y,2,2);}
      ctx.globalAlpha=1;
    }
    window.addEventListener('resize',resize); resize();
    function setRage(v,hot){
      target=Math.max(target,Math.min(1,v));
      fill.style.width=Math.round(Math.min(1,target)*100)+'%';
      fill.style.background=hot?'#ff3b30':'#3ddc84';
      if(!reduce){ spark(hot?18:8,!!hot); wake(); }
    }
    function say(msg,hot){ stat.textContent=msg; if(hot){stat.classList.add('rb-hot');} else {stat.classList.remove('rb-hot');} }
    function row(title,url,q,type){
      var li=document.createElement('li'), a=document.createElement('a');
      if(type&&type!=='post'){ var t=document.createElement('span'); t.className='rb-t'; t.textContent=type; a.appendChild(t); }
      a.href=url; var i=title.toLowerCase().indexOf(q.toLowerCase());
      if(i<0||!q){ a.textContent=title; }
      else{
        a.appendChild(document.createTextNode(title.slice(0,i)));
        var k=document.createElement('span'); k.className='rb-k'; k.textContent=title.slice(i,i+q.length);
        a.appendChild(k); a.appendChild(document.createTextNode(title.slice(i+q.length)));
      }
      li.appendChild(a); return li;
    }
    var timer=null, ctl=null, seq=0;
    function clearList(){ while(list.firstChild) list.removeChild(list.firstChild); all.style.display='none'; keysHint.style.display='none'; }
    function show(o,q){
      clearList();
      if(!o.j.length){ say('nothing. the engine is furious.',true); setRage(1,true); return; }
      for(var i=0;i<o.j.length;i++){ list.appendChild(row(String(o.j[i].title||'(untitled)'), String(o.j[i].url||'#'), q, String(o.j[i].subtype||''))); }
      var n=o.tot||o.j.length;
      say(n+' result'+(String(n)==='1'?'':'s')+' - showing '+o.j.length+'.');
      if(+n>o.j.length){ all.href='/?s='+encodeURIComponent(q); all.textContent='all '+n+' results for \u201c'+q+'\u201d \u2192'; all.style.display=''; }
      keysHint.style.display='';
      setRage(0.35+Math.min(0.6,o.j.length/8*0.6));
    }
    function search(q){
      var mine=++seq, key=q.toLowerCase(), hit=CACHE[key];
      if(ctl){ try{ctl.abort();}catch(e){} }
      if(hit&&Date.now()-hit.t<300000){ show(hit.o,q); return; }
      ctl=('AbortController' in window)? new AbortController() : null;
      say('raging through the corpus...');
      fetch('/wp-json/wp/v2/search?per_page=8&search='+encodeURIComponent(q), ctl?{signal:ctl.signal}:undefined)
        .then(function(r){ if(!r.ok) throw new Error(r.status); var tot=r.headers.get('X-WP-Total');
          return r.json().then(function(j){ return {j:j,tot:tot}; }); })
        .then(function(o){
          if(Array.isArray(o.j)) CACHE[key]={t:Date.now(),o:o};
          if(mine!==seq) return;
          show(o,q);
        })
        .catch(function(e){ if(e&&e.name==='AbortError') return; if(mine!==seq) return;
          say('the engine could not reach the corpus.',true); setRage(1,true); });
    }
    input.addEventListener('input',function(){
      var q=input.value.trim(), n=Date.now();
      keys.push(n); keys=keys.filter(function(x){return n-x<1500;});
      setRage(Math.min(0.9,keys.length/9));
      clearTimeout(timer);
      if(q.length<2){ seq++; clearList(); say(q?'keep going...':''); return; }
      timer=setTimeout(function(){ search(q); },260);
    });
    // keyboard: arrows walk the results, Esc comes back to the field (Enter in the field still submits the theme's search form)
    function links(){ return Array.prototype.slice.call(list.querySelectorAll('a')); }
    function go(i){ var L=links(); if(!L.length) return; i=(i+L.length)%L.length; L.forEach(function(a,j){ a.setAttribute('aria-selected',j===i?'true':'false'); }); L[i].focus(); }
    input.addEventListener('keydown',function(e){
      if(e.key==='ArrowDown'&&links().length){ e.preventDefault(); go(0); }
      else if(e.key==='Escape'&&input.value){ e.preventDefault(); e.stopPropagation(); input.value=''; seq++; clearList(); say(''); }
    });
    list.addEventListener('keydown',function(e){
      var L=links(), i=L.indexOf(document.activeElement); if(i<0) return;
      if(e.key==='ArrowDown'){ e.preventDefault(); go(i+1); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); if(i===0){ L[0].setAttribute('aria-selected','false'); input.focus(); } else go(i-1); }
      else if(e.key==='Home'){ e.preventDefault(); go(0); }
      else if(e.key==='End'){ e.preventDefault(); go(L.length-1); }
      else if(e.key==='Escape'){ e.preventDefault(); L[i].setAttribute('aria-selected','false'); input.focus(); }
    });
  }
  var CACHE={};
  // "/" opens the search from anywhere (not while typing in a field)
  document.addEventListener('keydown',function(e){
    if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey) return;
    var t=e.target, tag=(t&&t.tagName)||''; if(/^(INPUT|TEXTAREA|SELECT)$/.test(tag)||(t&&t.isContentEditable)) return;
    var page=document.getElementById('ragebar-input'), head=document.getElementById('head-search-input');
    if(page){ e.preventDefault(); page.focus(); return; }
    if(head){ e.preventDefault(); var trig=document.querySelector('.head-search-trigger');
      if(trig) trig.click(); setTimeout(function(){ head.focus(); },60); }   // the theme's trigger only ever opens, and focuses the field
  });
  function boot(){
    attach(document.getElementById('head-search-input'));
    attach(document.getElementById('ragebar-input'));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
