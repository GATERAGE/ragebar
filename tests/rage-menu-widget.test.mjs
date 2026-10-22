#!/usr/bin/env node
/*
 * rage-menu-widget.test.mjs — the "rage" menu (custom_html-7, v1.1.0) in a DOM, offline.
 *   JSDOM=/path/to/node_modules/jsdom node --test tests/rage-menu-widget.test.mjs
 * Atlas mode must behave as v1 did; ragebar mode asks ragesearch/1 and fuses WordPress's search in.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (f) => readFileSync(join(here, 'fixtures', f), 'utf8');
let JSDOM = null;
try { ({ JSDOM } = createRequire(import.meta.url)(process.env.JSDOM || 'jsdom')); } catch (e) { /* skipped */ }
const skip = !JSDOM && 'jsdom not found (set JSDOM=)';
const ATLAS = JSON.parse(fx('atlas.json'));
const A0 = ATLAS.art[0], A1 = ATLAS.art[1], A2 = ATLAS.art[2];
const widget = readFileSync(join(here, '..', 'wordpress', 'rage-menu-widget.html'), 'utf8');
const page = `<!doctype html><html><head></head><body class="home blog"><header><nav><ul class="navigation-main">
<li><a href="https://github.com/gaterage">codebase</a></li></ul></nav></header><main id="site-content"></main>
<footer><aside id="custom_html-7">${widget}</aside></footer></body></html>`;

function env(q, legs, dense) {
  const L = { bm25: { algorithm: 'BM25', ok: true, ms: 2, n: 2 }, atlas: { algorithm: 'atlas', ok: true, ms: 1, n: 0 } };
  const results = [{ id: A0.id, title: A0.t, url: A0.u, snippet: 'words snippet', rrf: 0.0164, ranks: { bm25: 1 } },
                   { id: A1.id, title: A1.t, url: A1.u, snippet: '', rrf: 0.0161, ranks: { bm25: 2 } }];
  if (legs === 'all') {
    L.dense = dense ? { algorithm: 'pgvectorscale', ok: true, ms: 40, n: 2 } : { algorithm: 'pgvectorscale', ok: false, ms: 0, n: 0, error: 'pending: embedding the query' };
    if (dense) { results[1].ranks.dense = 1; results.push({ id: A2.id, title: A2.t, url: A2.u, snippet: 'meaning', rrf: 0.016, ranks: { dense: 2 } }); }
  }
  return { standard: 'ragesearch/1', query: q, legs: L, complete: legs !== 'all' || !!dense, results };
}

function boot(store, opts = {}) {
  const calls = [];
  const dom = new JSDOM(page, {
    url: 'https://rage.pythai.net/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false });
      w.Element.prototype.scrollIntoView = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
      if (store) for (const k in store) w.localStorage.setItem(k, store[k]);
      w.fetch = (url) => {
        calls.push(String(url));
        const u = new URL(url, 'https://rage.pythai.net/');
        let body;
        if (u.pathname.endsWith('/atlas.json')) body = ATLAS;
        else if (u.pathname === '/wp-json/wp/v2/search') body = [{ id: A2.id }, { id: A0.id }];
        else if (u.pathname === '/ragesearch/search') {
          if (opts.down) return Promise.reject(new Error('down'));
          body = env(u.searchParams.get('q'), u.searchParams.get('legs'), opts.dense);
        } else body = [];
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, json: () => Promise.resolve(body) });
      };
    },
  });
  return { w: dom.window, d: dom.window.document, calls };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(d) { d.querySelector('.rm-li>button').click(); await tick(30); }
async function type(w, d, q) { const f = d.querySelector('.rm-find'); f.value = q; f.dispatchEvent(new w.Event('input')); await tick(380); }

test('default: atlas mode, the menu as it was', { skip }, async () => {
  const { w, d, calls } = boot();
  await open(d);
  assert.equal(d.querySelector('.rm-title').textContent, 'rage · atlas');
  assert.equal(d.querySelector('.rm-mode .rm-m-on').textContent, 'atlas');
  assert.equal(d.querySelector('.rm-find').placeholder, 'travel by a word…');
  await type(w, d, A0.t.split(' ')[0].toLowerCase());
  assert.ok(d.querySelector('.rm-find-path'), 'the instant path from the atlas is spawned');
  assert.ok(!calls.some((c) => c.includes('/ragesearch/')), 'atlas mode never calls ragesearch');
  assert.ok(calls.some((c) => c.startsWith('/wp-json/wp/v2/search')), 'then the full text from WordPress');
});

test('switch to ragebar: remembered, asks RAGE, fuses WordPress in the browser', { skip }, async () => {
  const { w, d, calls } = boot();
  await open(d);
  d.querySelector('.rm-mode').click(); await tick(20);
  assert.equal(w.localStorage.getItem('ragemap_mode'), 'ragebar');
  assert.equal(d.querySelector('.rm-title').textContent, 'rage · ragebar');
  await type(w, d, 'memory');
  await tick(60);
  assert.ok(calls.some((c) => c.includes('/ragesearch/search') && c.includes('legs=fast')));
  assert.ok(calls.some((c) => c.includes('/ragesearch/search') && c.includes('legs=all')), 'then the meaning leg');
  const path = d.querySelector('.rm-find-path');
  assert.ok(path && /RAGE/.test(path.textContent));
  const first = path.querySelector('.rm-kids .rm-node .rm-lab');
  assert.equal(first.firstChild.textContent, A0.t, 'bm25 1 + wp 2 ranks first');
  assert.match(first.querySelector('.rm-rank').textContent, /words 1 · wordpress 2/);
  const legs = d.querySelector('.rm-legs').textContent;
  assert.match(legs, /words/); assert.match(legs, /wordpress/); assert.match(legs, /embedding your words/, 'a pending meaning leg says so');
  // the next visit opens in ragebar
  const b = boot({ ragemap_mode: 'ragebar' }); await open(b.d);
  assert.equal(b.d.querySelector('.rm-mode .rm-m-on').textContent, 'ragebar');
});

test('meaning arrives: dense ranks fused, kindred still spawn from a result', { skip }, async () => {
  const { w, d } = boot({ ragemap_mode: 'ragebar' }, { dense: true });
  await open(d); await type(w, d, 'memory'); await tick(80);
  const rows = [...d.querySelectorAll('.rm-find-path .rm-kids > .rm-node')];
  assert.equal(rows.length, 3);
  assert.match(rows.map((r) => r.querySelector('.rm-rank').textContent).join('|'), /meaning 1/);
  assert.match(d.querySelector('.rm-legs').textContent, /meaning\s*2 · 40 ms/);
  rows[0].querySelector('.rm-sum').click(); await tick(10);
  assert.ok([...rows[0].querySelectorAll('.rm-act')].some((b) => /kindred/.test(b.textContent)), 'an article result is a full atlas article');
});

test('ragesearch down: WordPress alone, the failure named', { skip }, async () => {
  const { w, d } = boot({ ragemap_mode: 'ragebar' }, { down: true });
  await open(d); await type(w, d, 'memory'); await tick(60);
  assert.match(d.querySelector('.rm-legs').textContent, /ragesearch\s*unavailable/);
  assert.equal(d.querySelectorAll('.rm-find-path .rm-kids > .rm-node').length, 2, 'the WordPress leg still answers');
});

test('plugin config: opens in ragebar, no service configured → WordPress alone, said plainly', { skip }, async () => {
  const calls = [];
  const dom = new JSDOM(page.replace('<footer>', '<script>window.RAGE_MENU={"mode":"ragebar","search":"","atlas":"https://example.org/atlas.json"}</script><footer>'), {
    url: 'https://example.org/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false }); w.Element.prototype.scrollIntoView = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
      w.fetch = (url) => { calls.push(String(url)); const u = new URL(url, 'https://example.org/');
        const body = u.pathname.endsWith('/atlas.json') ? ATLAS : u.pathname === '/wp-json/wp/v2/search' ? [{ id: A2.id }] : [];
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, json: () => Promise.resolve(body) }); };
    } });
  const w = dom.window, d = w.document;
  await open(d);
  assert.equal(d.querySelector('.rm-mode .rm-m-on').textContent, 'ragebar', 'the site default applies until the visitor chooses');
  await type(w, d, 'memory'); await tick(60);
  assert.ok(calls.includes('https://example.org/atlas.json'), 'the configured atlas');
  assert.ok(!calls.some((c) => c.includes('ragesearch')), 'no service is called');
  assert.match(d.querySelector('.rm-legs').textContent, /not configured/);
  assert.equal(d.querySelectorAll('.rm-find-path .rm-kids > .rm-node').length, 1);
});
