/*!
 * ragewatch — the ragebar, pointed at a leaderboard instead of a corpus.
 * GATERAGE · https://github.com/GATERAGE/ragebar · Apache-2.0
 *
 * Renders one watched model from a benchwatch snapshot (tools/benchwatch.mjs)
 * as a card: BenchLM score and its 90% interval on the meter, overall and
 * open-weight rank, category scores, Hugging Face downloads and likes, and the
 * last fields that moved. It re-reads the snapshot on an interval.
 *
 * The rage is a readout here too:
 *   meter width   → the BenchLM score out of 100
 *   meter surges  → the snapshot changed since this viewer last looked
 *   meter goes red → the last move was a loss (score down, rank number up)
 *                    or a watched repo is missing from the Hub
 *
 * USAGE (load after ragebar.js, or on its own)
 *   Ragebar.watch(document.getElementById('watch'));
 *   Ragebar.watch(el, { src: 'data/benchwatch.json', slug: 'mimo-v2-6-pro', poll: 10 * 60e3 });
 *
 * benchlm.ai sends no CORS headers, so the browser reads the snapshot, never
 * benchlm.ai itself. The default src is the copy the scheduled workflow commits
 * to GitHub, which raw.githubusercontent.com serves with CORS open.
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    src: 'https://raw.githubusercontent.com/GATERAGE/ragebar/main/data/benchwatch.json',
    slug: null,                  // null → the first model in the snapshot
    poll: 10 * 60 * 1000,
    maxChanges: 6
  };

  // Lower is better for ranks; everything else that moves is higher-better.
  function better(field, from, to) {
    if (typeof from !== 'number' || typeof to !== 'number' || from === to) return 0;
    var lowerWins = /rank/i.test(field.split('.').pop()) || /^categoryRanks\./.test(field);
    return (lowerWins ? from > to : to > from) ? 1 : -1;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag); if (cls) n.className = cls;
    if (text != null) n.textContent = text; return n;
  }
  function link(href, text, cls) { var a = el('a', cls, text); a.href = href; a.rel = 'noopener'; return a; }
  function compact(n) {
    if (typeof n !== 'number') return '–';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function ago(iso) {
    var s = (Date.now() - Date.parse(iso)) / 1000;
    if (!(s >= 0)) return '';
    if (s < 90) return 'just now';
    if (s < 5400) return Math.round(s / 60) + 'm ago';
    if (s < 129600) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
  function label(field) {
    // hf.<owner>/<repo>.<what> — a repo id is a name, not camelCase to split.
    if (/^hf\./.test(field)) {
      var rest = field.slice(3), dot = rest.lastIndexOf('.');
      return rest.slice(0, dot).split('/').pop() + ' ' + rest.slice(dot + 1);
    }
    return field.replace(/^benchmarks\./, '').replace(/^categoryScores\./, '').replace(/^categoryRanks\./, 'rank ')
                .replace(/\./g, ' · ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }
  function store(key, val) {
    try { if (val === undefined) return global.localStorage.getItem(key); global.localStorage.setItem(key, val); }
    catch (e) { return null; }
  }

  function watch(container, opts) {
    if (!container || container.dataset.ragewatch) return null;
    container.dataset.ragewatch = '1';
    var o = {}; for (var k in DEFAULTS) o[k] = DEFAULTS[k];
    if (opts) for (var j in opts) o[j] = opts[j];

    var card = el('div', 'rw-card');
    var stat = el('p', 'rb-stat'); stat.setAttribute('role', 'status'); stat.setAttribute('aria-live', 'polite');
    var body = el('div', 'rw-body');
    card.appendChild(body); card.appendChild(stat);
    container.appendChild(card);

    var seen = null, timer = null;

    function say(msg, hot) { stat.textContent = msg; stat.classList.toggle('rb-hot', !!hot); }

    function meter(pct, iv, hot) {
      var m = el('div', 'rb-meter rw-meter'), f = el('i');
      f.style.width = Math.max(0, Math.min(100, pct)) + '%';
      if (hot) f.style.background = 'var(--rb-hot)';
      if (iv) {
        var b = el('b', 'rw-band');
        b.style.left = iv[0] + '%'; b.style.width = Math.max(0, iv[1] - iv[0]) + '%';
        m.appendChild(b);
      }
      m.appendChild(f); return m;
    }

    function render(snap) {
      var ms = snap.models || [], m = null;
      for (var i = 0; i < ms.length; i++) if (!o.slug || ms[i].slug === o.slug) { m = ms[i]; break; }
      while (body.firstChild) body.removeChild(body.firstChild);
      if (!m || m.missing) { say('nothing. ' + (o.slug || 'the model') + ' is not on the board.', true); card.classList.add('rw-hot'); return; }

      var changes = m.changes || [], net = 0;
      for (var c = 0; c < changes.length; c++) net += better(changes[c].field, changes[c].from, changes[c].to);
      var hfMissing = (m.hf || []).some(function (h) { return h.missing; });
      var hot = net < 0;

      var head = el('div', 'rw-head');
      head.appendChild(link(m.url, m.model, 'rw-name'));
      head.appendChild(el('span', 'rw-sub', [m.creator, (m.sourceType || '').toLowerCase(), m.releaseDate].filter(Boolean).join(' · ')));
      body.appendChild(head);

      var score = el('div', 'rw-score');
      score.appendChild(el('b', null, typeof m.displayScore === 'number' ? m.displayScore.toFixed(1) : '–'));
      score.appendChild(el('span', null, '/100' + (m.interval90 ? ' · 90% ' + m.interval90[0].toFixed(1) + '–' + m.interval90[1].toFixed(1) : '') +
                                         (m.evidenceStatus ? ' · ' + m.evidenceStatus : '')));
      body.appendChild(score);
      body.appendChild(meter(m.displayScore || 0, m.interval90, hot));

      var rank = el('p', 'rw-rank');
      rank.appendChild(el('b', null, '#' + (m.overallRank || '–')));
      rank.appendChild(document.createTextNode(' overall' + (snap.source && snap.source.rankedModels ? ' of ' + snap.source.rankedModels : '')));
      if (m.openRank) { rank.appendChild(document.createTextNode(' · ')); rank.appendChild(el('b', null, '#' + m.openRank)); rank.appendChild(document.createTextNode(' open-weight')); }
      body.appendChild(rank);

      var cats = el('ul', 'rw-cats'), cs = m.categoryScores || {}, cr = m.categoryRanks || {};
      Object.keys(cs).forEach(function (name) {
        var li = el('li');
        li.appendChild(el('span', 'rw-k', name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()));
        li.appendChild(meter(cs[name]));
        li.appendChild(el('span', 'rw-v', cs[name].toFixed(1) + (cr[name] ? ' #' + cr[name] : '')));
        cats.appendChild(li);
      });
      if (cats.firstChild) body.appendChild(cats);

      var hf = el('ul', 'rw-hf');
      (m.hf || []).forEach(function (h) {
        var li = el('li', h.missing ? 'rw-miss' : null);
        li.appendChild(link(h.url, h.id));
        li.appendChild(el('span', 'rw-v', h.missing ? 'not on the Hub' : '↓' + compact(h.downloads) + ' ♥' + compact(h.likes)));
        hf.appendChild(li);
      });
      if (hf.firstChild) body.appendChild(hf);

      if (changes.length) {
        var ch = el('ul', 'rw-changes');
        changes.slice(0, o.maxChanges).forEach(function (r) {
          var d = better(r.field, r.from, r.to);
          var li = el('li', d > 0 ? 'rw-up' : d < 0 ? 'rw-down' : null);
          li.appendChild(el('span', 'rw-k', (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '• ') + label(r.field)));
          li.appendChild(el('span', 'rw-v', String(r.from) + ' → ' + String(r.to)));
          ch.appendChild(li);
        });
        if (changes.length > o.maxChanges) ch.appendChild(el('li', 'rw-more', '+' + (changes.length - o.maxChanges) + ' more'));
        body.appendChild(ch);
      }

      var foot = el('p', 'rw-foot');
      var src = snap.source || {};
      foot.appendChild(link('https://benchlm.ai', src.attribution || 'Data from BenchLM.ai'));
      foot.appendChild(document.createTextNode(' · '));
      foot.appendChild(link(src.licenseUrl || 'https://creativecommons.org/licenses/by-nc/4.0/', src.license || 'CC BY-NC 4.0'));
      if (src.sourceLastUpdated) foot.appendChild(document.createTextNode(' · board of ' + src.sourceLastUpdated));
      body.appendChild(foot);

      // The surge: this viewer has not seen this change before.
      var key = 'ragewatch:' + m.slug, fresh = m.changedAt && store(key) !== m.changedAt && changes.length;
      card.classList.toggle('rw-hot', hot || hfMissing);
      if (fresh || (seen && seen !== m.changedAt)) {
        card.classList.remove('rw-surge'); void card.offsetWidth; card.classList.add('rw-surge');
      }
      seen = m.changedAt; if (m.changedAt) store(key, m.changedAt);

      if (hot) say(changes.length + ' move' + (changes.length === 1 ? '' : 's') + ', net loss · ' + ago(m.changedAt) + '. the engine is furious.', true);
      else if (hfMissing) say('a watched repo is missing from the Hub · checked ' + ago(snap.checkedAt) + '.', true);
      else say((changes.length ? changes.length + ' move' + (changes.length === 1 ? '' : 's') + ' ' + ago(m.changedAt) + ' · ' : '') + 'checked ' + ago(snap.checkedAt) + '.');
    }

    function load() {
      return fetch(o.src, { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(render)
        .catch(function () { say('the engine could not reach the watch.', true); card.classList.add('rw-hot'); });
    }

    say('raging through the board...');
    load();
    if (o.poll > 0) timer = setInterval(load, o.poll);

    return { el: card, refresh: load, stop: function () { clearInterval(timer); } };
  }

  var R = global.Ragebar || (global.Ragebar = { version: '1.0.0' });
  R.watch = watch;
  R.watch.defaults = DEFAULTS;
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
})(typeof window !== 'undefined' ? window : this);
