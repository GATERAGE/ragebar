#!/usr/bin/env node
/*
 * wordpress-widgets.test.mjs — the two rage.pythai.net widgets in a DOM, offline.
 *
 *   node --test tests/wordpress-widgets.test.mjs
 *
 * jsdom is NOT a dependency of this repo (ragebar stays zero-dependency). Point JSDOM at any
 * installed copy:  JSDOM=/path/to/node_modules/jsdom node --test tests/wordpress-widgets.test.mjs
 * Without it the suite skips.
 *
 * The page skeleton copies the blockchain-lite markup rage.pythai.net serves (head-mast nav,
 * head search form, #site-content). Search answers are recorded verbatim from
 * /wp-json/wp/v2/search on 2026-10-15; the atlas is a trimmed copy of atlas.json.
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
try {
  const req = createRequire(import.meta.url);
  ({ JSDOM } = req(process.env.JSDOM || 'jsdom'));
} catch (e) { /* skipped below */ }

const TOTALS = Object.fromEntries(fx('totals.txt').trim().split('\n').map((l) => l.split(' ')));
const widget = (f) => readFileSync(join(here, '..', 'wordpress', f), 'utf8');

function page(bodyClass) {
  return `<!doctype html><html><head></head><body class="${bodyClass}">
<header class="header"><div class="head-intro"><form action="/" class="head-search-form">
<input type="search" name="s" id="head-search-input" class="head-search-input"></form>
<a href="#" class="head-search-trigger"><i class="fas fa-search"></i></a></div>
<div class="head-mast"><div class="container"><div class="row">
<div class="col-lg-12"><div class="site-branding"><a href="/">Retrieval Augmented Generative Engine</a></div></div>
<div class="col-lg-12"><nav class="nav"><ul id="header-menu-1" class="navigation-main">
<li><a target="_blank" href="https://github.com/gaterage" title="source code">codebase</a></li>
<li><a target="_blank" href="https://github.com/GATERAGE/RAGE/blob/main/ragepaper.md" title="RAGE paper">whitepaper</a></li>
<li><a href="https://rage.pythai.net/ragebar/">ragebar</a></li></ul></nav>
<a href="#mobilemenu" class="mobile-nav-trigger">Menu</a></div></div></div></div></header>
<main class="main"><div class="container"><div class="row"><div id="site-content" class="col-lg-9">
<div class="row row-items"><div class="entry-item">first card</div></div></div></div></div></main>
<footer><aside id="custom_html-2">${widget('ragebar-widget.html')}</aside>
<aside id="custom_html-7">${widget('ragebar-atlas-widget.html')}</aside></footer></body></html>`;
}

function boot(bodyClass, store) {
  const calls = [];
  const dom = new JSDOM(page(bodyClass), {
    url: 'https://rage.pythai.net/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false });
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
      if (store) for (const k in store) w.localStorage.setItem(k, store[k]);
      w.fetch = (url) => {
        calls.push(String(url));
        const u = new URL(url, 'https://rage.pythai.net/');
        let body, headers = {};
        if (u.pathname.endsWith('/atlas.json')) body = fx('atlas.json');
        else if (u.pathname === '/wp-json/wp/v2/search') {
          const q = u.searchParams.get('search');
          body = TOTALS[q] ? fx(q + '.json') : '[]';
          headers['X-WP-Total'] = TOTALS[q] || '0';
        } else body = '[]';
        return Promise.resolve({ ok: true, status: 200, headers: { get: (h) => headers[h] ?? null },
          json: () => Promise.resolve(JSON.parse(body)) });
      };
    },
  });
  return { dom, w: dom.window, d: dom.window.document, calls };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

test('landing: the atlas is docked open at the top of the content, no chooser', { skip: !JSDOM && 'jsdom not found (set JSDOM=)' }, async () => {
  const { d } = boot('home blog');
  await tick(30);
  const site = d.getElementById('site-content');
  assert.equal(site.firstElementChild.id, 'rm-panel', 'atlas is the first thing in the content');
  assert.ok(d.documentElement.classList.contains('rm-docked'), 'header menu hidden only once the atlas is in');
  assert.equal(d.querySelectorAll('.rm-li').length, 0, 'no "rage" chooser button is added to the header');
  const panel = d.getElementById('rm-panel');
  assert.ok(!panel.classList.contains('rm-folded'), 'home lands with the atlas open');
  assert.equal(d.querySelectorAll('.rm-body > .rm-node').length, JSON.parse(fx('atlas.json')).tree.length, 'every branch drawn');
  const links = [...d.querySelectorAll('.rm-foot .rm-links a')].map((a) => a.textContent);
  assert.deepEqual(links, ['codebase', 'whitepaper', 'ragebar'], 'the header links moved into the atlas');
  assert.notEqual(d.activeElement && d.activeElement.className, 'rm-find', 'landing does not steal focus');
});

test('other pages: docked and folded to its head, unfold remembered', { skip: !JSDOM && 'jsdom not found (set JSDOM=)' }, async () => {
  let { w, d } = boot('post-template-default single single-post postid-1628');
  await tick(10);
  const panel = d.getElementById('rm-panel');
  assert.ok(panel.classList.contains('rm-folded'));
  assert.equal(d.querySelector('.rm-body').children.length, 0, 'atlas.json not fetched until unfolded');
  assert.equal(d.querySelectorAll('.rm-foot .rm-links a').length, 3, 'links still reachable while folded');
  const fold = d.querySelector('.rm-fold');
  assert.equal(fold.getAttribute('aria-expanded'), 'false');
  fold.click(); await tick(30);
  assert.ok(!panel.classList.contains('rm-folded'));
  assert.equal(fold.getAttribute('aria-expanded'), 'true');
  assert.ok(d.querySelector('.rm-here'), '"you are here" marks the article being read');
  assert.equal(w.localStorage.getItem('ragemap_fold_v2'), '0');
  ({ d } = boot('single postid-1628', { ragemap_fold_v2: '0' }));
  await tick(30);
  assert.ok(!d.getElementById('rm-panel').classList.contains('rm-folded'), 'the reader\'s choice is kept');
});

test('ragesearch: same endpoint, same answers; cache, keys, all-results link', { skip: !JSDOM && 'jsdom not found (set JSDOM=)' }, async () => {
  const { w, d, calls } = boot('home blog');
  await tick(20);                                    // DOMContentLoaded: the widgets attach
  const input = d.getElementById('head-search-input');
  for (const q of ['mindx', 'RAGE', 'deltaverse']) {
    input.value = q; input.dispatchEvent(new w.Event('input'));
    await tick(320);
    const want = JSON.parse(fx(q + '.json'));
    const rows = [...input.parentNode.querySelectorAll('.rb-list a')];
    assert.equal(rows.length, want.length, q + ': one row per result');
    assert.deepEqual(rows.map((a) => a.href), want.map((r) => r.url), q + ': same urls, same order');
    assert.match(input.parentNode.querySelector('.rb-stat').textContent, new RegExp('^' + TOTALS[q] + ' results'));
    const all = input.parentNode.querySelector('.rb-all');
    assert.equal(all.getAttribute('href'), '/?s=' + encodeURIComponent(q));
  }
  const searches = calls.filter((c) => c.includes('/wp/v2/search'));
  assert.deepEqual(searches, ['mindx', 'RAGE', 'deltaverse'].map((q) => '/wp-json/wp/v2/search?per_page=8&search=' + q));
  input.value = 'mindx'; input.dispatchEvent(new w.Event('input')); await tick(320);
  assert.equal(calls.filter((c) => c.includes('/wp/v2/search')).length, 3, 'a repeated query answers from the cache');
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  const first = input.parentNode.querySelector('.rb-list a');
  assert.equal(d.activeElement, first, 'ArrowDown walks into the results');
  first.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(d.activeElement, input.parentNode.querySelectorAll('.rb-list a')[1]);
  d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(d.activeElement, input, 'Esc returns to the field');
  input.value = 'zzqqxx'; input.dispatchEvent(new w.Event('input')); await tick(320);
  assert.equal(input.parentNode.querySelector('.rb-stat').textContent, 'nothing. the engine is furious.');
});
