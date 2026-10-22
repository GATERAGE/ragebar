#!/usr/bin/env node
/*
 * ragebar-immersive.test.mjs — the immersive ragebar (v1.0.0) in a DOM, offline.
 *   JSDOM=/path/to/node_modules/jsdom node --test tests/ragebar-immersive.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let JSDOM = null;
try { ({ JSDOM } = createRequire(import.meta.url)(process.env.JSDOM || 'jsdom')); } catch (e) { /* skipped */ }
const skip = !JSDOM && 'jsdom not found (set JSDOM=)';
const widget = readFileSync(join(here, '..', 'wordpress', 'ragebar-immersive.html'), 'utf8');
const page = (pre = '') => `<!doctype html><html><head></head><body><header><form class="head-search-form">
<input type="search" id="head-search-input" class="head-search-input"></form><a href="#" class="head-search-trigger">⌕</a></header>
<main></main>${pre}<footer><aside id="custom_html-2">${widget}</aside></footer></body></html>`;

function boot({ store, empty, pre } = {}) {
  const calls = [];
  const dom = new JSDOM(page(pre), {
    url: 'https://rage.pythai.net/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false }); w.Element.prototype.scrollIntoView = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({}) });
      if (store) for (const k in store) w.localStorage.setItem(k, store[k]);
      w.fetch = (url) => {
        calls.push(String(url));
        const u = new URL(url, 'https://rage.pythai.net/');
        let body;
        if (u.pathname.endsWith('/substrate-sequence.json')) body = { name: 'DeltaVerse substrate sequence', version: '1.0.0', total: 1024, bundleCount: 128 };
        else if (u.hostname === 'raw.githubusercontent.com') body = { persona: 'mindx', name: 'mindX', mantra: 'Code is Law.', bdi: { beliefs: [] }, awareness: [{ belief: 'My memory is pgvectorscale with StreamingDiskANN.', source: 'docs/rage/EMBEDDING_SYSTEM.md' }] };
        else if (u.pathname === '/wp-json/wp/v2/search') body = empty ? [] : [{ id: 2, title: 'Two', url: 'https://rage.pythai.net/two/' }];
        else if (u.pathname === '/ragesearch/health') body = { standard: 'ragesearch/1', version: '1.0.0', documents: { articles: 226 }, passages: { articles: 1659 }, dense_documents: { self: 9 }, model: 'mxbai-embed-large', dims: 1024, query_vectors_cached: 3, embedding_now: 0, ingest: { last_run: '2026-10-22T06:00:00Z', errors: [] } };
        else if (u.pathname === '/ragesearch/search') {
          const legs = u.searchParams.get('legs').split(','), L = {}, res = [];
          if (legs.includes('bm25')) L.bm25 = { algorithm: 'BM25', ok: true, ms: 2, n: empty ? 0 : 1 };
          if (legs.includes('atlas')) L.atlas = { algorithm: 'atlas', ok: true, ms: 1, n: 0 };
          if (legs.includes('dense')) L.dense = { algorithm: 'pgvectorscale', ok: false, ms: 0, n: 0, error: 'pending: embedding the query' };
          if (!empty && L.bm25) res.push({ id: 1, title: 'One', url: 'https://rage.pythai.net/one/', date: '2026-10-22', snippet: 'words', ranks: { bm25: 1 } });
          body = { standard: 'ragesearch/1', legs: L, results: res };
        } else body = [];
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) });
      };
    },
  });
  return { w: dom.window, d: dom.window.document, calls };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms));
async function ask(w, d, text) { const q = d.querySelector('.ri-q'); q.value = text; q.dispatchEvent(new w.Event('input')); await tick(340); }

test('the header search opens the immersive stage, focused', { skip }, async () => {
  const { w, d } = boot();
  await tick(20);
  d.getElementById('head-search-input').dispatchEvent(new w.Event('focus'));
  await tick(60);
  assert.ok(d.querySelector('.ri').classList.contains('ri-open'));
  assert.equal(d.activeElement, d.querySelector('.ri-q'));
  assert.match(d.querySelector('.ri-dv').textContent, /DeltaVerse ◇ 1,024 substrates · 128 bundles/, 'the substrate count, live');
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await tick(220);
  assert.ok(!d.querySelector('.ri').classList.contains('ri-open'), 'Esc closes');
  d.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: '/', bubbles: true })); await tick(40);
  assert.ok(d.querySelector('.ri').classList.contains('ri-open'), '"/" opens it');
});

test('words + wordpress fused; the legs chosen are the legs asked', { skip }, async () => {
  const { w, d, calls } = boot();
  await tick(20); w.RagebarImmersive.open('');
  await ask(w, d, 'memory'); await tick(60);
  assert.ok(calls.some((c) => /\/ragesearch\/search\?.*legs=bm25,atlas(&|$)/.test(c)), 'fast legs first');
  assert.ok(calls.some((c) => /legs=bm25,atlas,dense&wait=20000/.test(c)), 'then meaning');
  const cards = [...d.querySelectorAll('.ri-results .ri-card')];
  assert.deepEqual(cards.map((c) => c.querySelector('.ri-t').textContent), ['One', 'Two']);
  assert.match(cards[0].querySelector('.ri-ranks').textContent, /words 1/);
  assert.match(d.querySelector('.ri-legs').textContent, /meaning\s*embedding your words/);
  // T: the control panel with the variables; switch meaning and atlas off
  d.querySelector('.ri-bar .ri-btn').click(); await tick(30);
  assert.ok(d.querySelector('.ri-field').classList.contains('ri-panel-on'));
  assert.match(d.querySelector('.ri-diag').textContent, /226/, 'diagnostics read from /health');
  const chip = (t) => [...d.querySelectorAll('.ri-chip')].find((c) => c.textContent === t);
  chip('meaning').click(); chip('atlas').click(); await tick(340);
  assert.ok(calls.some((c) => /legs=bm25&/.test(c) || /legs=bm25$/.test(c)), 'only words asked of the service');
  const saved = JSON.parse(w.localStorage.getItem('ragebar_vars'));
  assert.equal(saved.legs.dense, false); assert.equal(saved.panel, true);
});

test('❏ spawns a response window; ⌂ calls it home; :commands set the variables', { skip }, async () => {
  const { w, d, calls } = boot();
  await tick(20); w.RagebarImmersive.open('');
  await ask(w, d, 'memory'); await tick(60);
  w.RagebarImmersive.spawn(); await tick(10);
  const win = d.querySelector('.ri-win');
  assert.ok(win && win.querySelectorAll('.ri-card').length === 2, 'the results, as a window');
  assert.match(win.querySelector('.ri-win-bar').textContent, /memory/);
  win.style.left = '5px'; w.RagebarImmersive.home(); assert.notEqual(win.style.left, '5px', 'called home');
  const q = d.querySelector('.ri-q');
  q.value = ':corpus self'; q.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter' })); await tick(80);
  assert.ok(calls.some((c) => c.includes('corpus=self')), ':corpus re-asks the last question');
  q.value = ':k 5'; q.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter' })); await tick(40);
  assert.equal(w.RagebarImmersive.vars.k, 5);
  q.value = ':clear'; q.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter' })); await tick(20);
  assert.equal(d.querySelectorAll('.ri-win').length, 0); assert.equal(d.querySelectorAll('.ri-results li').length, 0);
});

test('nothing found: red, said plainly', { skip }, async () => {
  const { w, d } = boot({ empty: true });
  await tick(20); w.RagebarImmersive.open('');
  await ask(w, d, 'zzzz'); await tick(80);
  assert.ok(d.querySelector('.ri-field').classList.contains('ri-red'));
  assert.match(d.querySelector('.ri-meter').textContent, /nothing\. the engine is furious\./);
});

test('no service configured: WordPress alone, "not configured"', { skip }, async () => {
  const { w, d, calls } = boot({ pre: '<script>window.RAGEBAR={search:""}</script>' });
  await tick(20); w.RagebarImmersive.open('');
  await ask(w, d, 'memory'); await tick(60);
  assert.ok(!calls.some((c) => c.includes('ragesearch')));
  assert.match(d.querySelector('.ri-legs').textContent, /not configured/);
  assert.equal(d.querySelectorAll('.ri-results .ri-card').length, 1);
});

function drop(w, el, text) { const ev = new w.Event('drop', { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'dataTransfer', { value: { files: [], getData: () => text } }); el.dispatchEvent(ev); }

test('personas: a dropped .persona rolls in, is kept, and its leg is fused', { skip }, async () => {
  const { w, d } = boot();
  await tick(20); w.RagebarImmersive.open('');
  await tick(40);
  const names = () => [...d.querySelectorAll('.ri-pc b')].map((b) => b.textContent);
  assert.deepEqual(names(), ['RAGE', 'mindX', 'bankML', 'Jaimla', 'Savante'], 'built in: RAGE, mindX, bankML, Jaimla, Savante');
  const field = d.querySelector('.ri-field');
  field.dispatchEvent(new w.Event('dragover', { bubbles: true, cancelable: true }));
  assert.ok(field.classList.contains('ri-drop'), 'the field says where to drop');
  drop(w, field, JSON.stringify({ persona: 'quokka', name: 'Quokka', mantra: 'Small and sure.', beliefs: [{ belief: 'The quokka ridge holds the heliotrope ledger.', source: 'https://example.org/quokka' }] }));
  await tick(40);
  assert.ok(!field.classList.contains('ri-drop'));
  assert.deepEqual(names(), ['RAGE', 'mindX', 'bankML', 'Jaimla', 'Savante', 'Quokka'], 'rolled in beside them');
  assert.ok(d.querySelector('.ri-pc.ri-on b').textContent === 'Quokka' && d.querySelector('.ri-pc.ri-new'), 'chosen, with the roll-in');
  assert.equal(JSON.parse(w.localStorage.getItem('ragebar_personas'))[0].name, 'Quokka', 'kept in this browser');
  await ask(w, d, 'heliotrope ledger'); await tick(60);
  const cards = [...d.querySelectorAll('.ri-results .ri-card')];
  const pc = cards.find((c) => /Quokka · beliefs/.test(c.textContent));
  assert.ok(pc, 'the persona leg found the belief');
  assert.match(pc.querySelector('.ri-ranks').textContent, /Quokka 1/);
  assert.equal(pc.getAttribute('href'), 'https://example.org/quokka', 'its source is the link');
  assert.match(d.querySelector('.ri-legs').textContent, /Quokka\s*1/);
});

test('personas: a built-in is read from its public file; a bad drop is refused plainly', { skip }, async () => {
  const { w, d, calls } = boot();
  await tick(20); w.RagebarImmersive.open(''); await tick(30);
  [...d.querySelectorAll('.ri-pc')].find((c) => c.querySelector('b').textContent === 'mindX').click(); await tick(60);
  assert.ok(calls.some((c) => c.includes('raw.githubusercontent.com/cryptoAGI/bankml/main/sAGI/personas/mindx.persona')));
  await ask(w, d, 'pgvectorscale memory'); await tick(60);
  const seen = [...d.querySelectorAll('.ri-card')].map((c) => c.textContent);
  assert.ok(seen.some((t) => /mindX · awareness/.test(t)), 'persona leg: ' + JSON.stringify(seen) + ' legs: ' + d.querySelector('.ri-legs').textContent + ' active: ' + (d.querySelector('.ri-pc.ri-on b') || {}).textContent);
  drop(w, d.querySelector('.ri-field'), 'not json');
  await tick(20);
  assert.match(d.querySelector('.ri-term-log').textContent, /not a \.persona this field can read/);
  assert.equal(d.querySelectorAll('.ri-pc').length, 5, 'nothing rolled in');
  d.querySelector('.ri-mode button:last-child').click(); await tick(220);
  assert.ok(!d.querySelector('.ri').classList.contains('ri-open'), 'atlas hands over (the menu is not on this test page)');
});
