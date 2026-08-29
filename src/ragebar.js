/*!
 * ragebar — the search bar that rages while it retrieves.
 * GATERAGE · https://github.com/GATERAGE/ragebar · Apache-2.0
 *
 * Zero dependencies, no build step, no framework. Attach it to any <input> and
 * it turns that input into a live retrieval surface: results as you type, and a
 * meter driven by the search itself — how fast you are typing, how much came
 * back, and whether the corpus had anything at all.
 *
 * The rage is not decoration. It is a readout of retrieval:
 *   typing speed  → the meter climbs while you are still asking
 *   result count  → it surges when the corpus answers
 *   empty corpus  → it goes red, because nothing found IS the failure state
 *
 * USAGE
 *   Ragebar.attach(document.querySelector('#q'));
 *   Ragebar.attach(input, {
 *     endpoint: '/wp-json/wp/v2/search?per_page=8&search=',  // ? or & terminated
 *     parse:    function (json, headers) {                   // → [{title,url}]
 *       return json.map(function (r) { return { title: r.title, url: r.url }; });
 *     },
 *     total:    function (headers) { return headers.get('X-WP-Total'); },
 *     minChars: 2, debounce: 260
 *   });
 *
 * Defaults target the WordPress REST search API because that is where it was
 * born (rage.pythai.net), but `endpoint` + `parse` make it corpus-agnostic.
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    endpoint: '/wp-json/wp/v2/search?per_page=8&search=',
    perPage: 8,
    minChars: 2,
    debounce: 260,
    parse: function (json) {
      if (!json || !json.length) return [];
      return json.map(function (r) {
        return { title: String(r.title || r.name || '(untitled)'), url: String(r.url || r.link || '#') };
      });
    },
    total: function (headers) { try { return headers.get('X-WP-Total'); } catch (e) { return null; } },
    texts: {
      searching: 'raging through the corpus...',
      empty: 'nothing. the engine is furious.',
      error: 'the engine could not reach the corpus.',
      more: 'keep going...'
    }
  };

  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

  function attach(input, opts) {
    if (!input || input.dataset.ragebar) return null;
    input.dataset.ragebar = '1';
    var o = {}; for (var k in DEFAULTS) o[k] = DEFAULTS[k];
    if (opts) for (var j in opts) o[j] = opts[j];

    // Built with the DOM API on purpose. This began life inside a WordPress
    // widget, where wpautop rewrites HTML that appears inside JS strings — it
    // turned blank lines into </p><p> and broke the whole script. createElement
    // is immune to every content filter.
    var wrap = el('div', 'rb-wrap');
    var cv = el('canvas', 'rb-canvas'); cv.setAttribute('aria-hidden', 'true');
    var meter = el('div', 'rb-meter'); var fill = el('i'); meter.appendChild(fill);
    var stat = el('p', 'rb-stat'); stat.setAttribute('role', 'status'); stat.setAttribute('aria-live', 'polite');
    var list = el('ul', 'rb-list');
    wrap.appendChild(cv); wrap.appendChild(meter); wrap.appendChild(stat); wrap.appendChild(list);
    input.parentNode.insertBefore(wrap, input.nextSibling);

    var ctx = cv.getContext('2d'), rage = 0, target = 0, sparks = [], last = 0, keys = [];
    var reduce = global.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

    function resize() {
      var d = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = (wrap.clientWidth || 560) * d; cv.height = 52 * d;
    }
    function spark(n, hot) {
      for (var i = 0; i < n; i++) sparks.push({
        x: Math.random() * cv.width, y: cv.height * (0.4 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 2.4, vy: -(0.5 + Math.random() * 2), l: 1, hot: hot
      });
    }
    function draw(now) {
      requestAnimationFrame(draw);
      if (reduce || !cv.width) return;
      if (now - last < 33) return; last = now;                 // 30fps cap
      rage += (target - rage) * 0.09; target *= 0.965;         // rage decays
      ctx.clearRect(0, 0, cv.width, cv.height);
      var g = ctx.createLinearGradient(0, cv.height, 0, 0);
      g.addColorStop(0, 'rgba(61,220,132,' + (0.04 + rage * 0.22).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(61,220,132,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      for (var i = sparks.length - 1; i >= 0; i--) {
        var s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.02; s.l -= 0.022;
        if (s.l <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, s.l) * 0.85;
        ctx.fillStyle = s.hot ? '#ff3b30' : '#3ddc84';
        ctx.fillRect(s.x, s.y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    global.addEventListener('resize', resize); resize(); requestAnimationFrame(draw);

    function setRage(v, hot) {
      target = Math.max(target, Math.min(1, v));
      fill.style.width = Math.round(Math.min(1, target) * 100) + '%';
      fill.style.background = hot ? '#ff3b30' : '#3ddc84';
      if (!reduce) spark(hot ? 18 : 8, !!hot);
    }
    function say(msg, hot) {
      stat.textContent = msg;
      if (hot) stat.classList.add('rb-hot'); else stat.classList.remove('rb-hot');
    }
    function row(title, url, q) {
      var li = el('li'), a = el('a'); a.href = url;
      var i = q ? title.toLowerCase().indexOf(q.toLowerCase()) : -1;
      if (i < 0) { a.textContent = title; }
      else {
        a.appendChild(document.createTextNode(title.slice(0, i)));
        var m = el('span', 'rb-k'); m.textContent = title.slice(i, i + q.length);
        a.appendChild(m); a.appendChild(document.createTextNode(title.slice(i + q.length)));
      }
      li.appendChild(a); return li;
    }

    var timer = null, ctl = null, seq = 0;
    function search(q) {
      var mine = ++seq;                                   // stale answers lose
      if (ctl) { try { ctl.abort(); } catch (e) {} }
      ctl = ('AbortController' in global) ? new AbortController() : null;
      say(o.texts.searching);
      fetch(o.endpoint + encodeURIComponent(q), ctl ? { signal: ctl.signal } : undefined)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          var tot = o.total(r.headers);
          return r.json().then(function (j) { return { rows: o.parse(j, r.headers), tot: tot }; });
        })
        .then(function (res) {
          if (mine !== seq) return;
          while (list.firstChild) list.removeChild(list.firstChild);
          if (!res.rows.length) { say(o.texts.empty, true); setRage(1, true); return; }
          for (var i = 0; i < res.rows.length; i++) list.appendChild(row(res.rows[i].title, res.rows[i].url, q));
          var n = res.tot || res.rows.length;
          say(n + ' result' + (String(n) === '1' ? '' : 's') + ' - showing ' + res.rows.length + '.');
          setRage(0.35 + Math.min(0.6, res.rows.length / o.perPage * 0.6));
        })
        .catch(function (e) {
          if (e && e.name === 'AbortError') return;
          if (mine !== seq) return;
          say(o.texts.error, true); setRage(1, true);
        });
    }

    input.addEventListener('input', function () {
      var q = input.value.trim(), now = Date.now();
      keys.push(now); keys = keys.filter(function (x) { return now - x < 1500; });
      setRage(Math.min(0.9, keys.length / 9));            // the asking itself rages
      clearTimeout(timer);
      if (q.length < o.minChars) {
        while (list.firstChild) list.removeChild(list.firstChild);
        say(q ? o.texts.more : ''); return;
      }
      timer = setTimeout(function () { search(q); }, o.debounce);
    });

    return { input: input, search: search, el: wrap };
  }

  var Ragebar = { attach: attach, defaults: DEFAULTS, version: '1.0.0' };
  if (typeof module !== 'undefined' && module.exports) module.exports = Ragebar;
  global.Ragebar = Ragebar;
})(typeof window !== 'undefined' ? window : this);
