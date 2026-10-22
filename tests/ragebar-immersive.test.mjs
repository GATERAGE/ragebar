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
        if (u.pathname.endsWith('/atlas.json')) body = { tags: { 7: 'memory', 9: 'pgvectorscale' }, art: [
          { id: 1, t: 'One', u: 'https://rage.pythai.net/one/', d: '2026-10-21', x: 'the excerpt of one', g: [7, 9], p: ['machine/rage'], v: ['neural', 'jaimla'] },
          { id: 2, t: 'Two', u: 'https://rage.pythai.net/two/', d: '2026-10-20', x: 'the excerpt of two', g: [7], p: ['machine/rage'] },
          { id: 3, t: 'Three', u: 'https://rage.pythai.net/three/', d: '2026-10-19', x: 'three', g: [9], p: ['machine/rage'] }] };
        else if (u.pathname.endsWith('/substrate-sequence.json')) body = { name: 'DeltaVerse substrate sequence', version: '1.0.0', total: 1024, bundleCount: 128 };
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

function devBoot(opts) {
  const r = boot(opts);
  const w = r.w, stopped = [];
  const track = (kind) => ({ kind, label: kind === 'video' ? 'FaceTime HD' : 'Built-in mic', stop() { stopped.push(kind); }, getSettings: () => (kind === 'video' ? { deviceId: 'cam1', width: 640, height: 480, frameRate: 30 } : { deviceId: 'mic1', sampleRate: 48000, channelCount: 1 }) });
  Object.defineProperty(w.navigator, 'mediaDevices', { value: {
    getUserMedia: (c) => Promise.resolve({ getTracks() { return [track(c.video ? 'video' : 'audio')]; }, getVideoTracks() { return [track('video')]; }, getAudioTracks() { return [track('audio')]; } }),
    enumerateDevices: () => Promise.resolve([{ kind: 'videoinput', deviceId: 'cam1', label: 'FaceTime HD' }, { kind: 'audioinput', deviceId: 'mic1', label: 'Built-in mic' }]) } });
  w.AudioContext = function () { return { createAnalyser: () => ({ fftSize: 1024, getByteTimeDomainData(b) { b.fill(128); }, getFloatTimeDomainData(b) { b.fill(0.1); } }), createMediaStreamSource: () => ({ connect() {} }), close() {} }; };
  w.HTMLMediaElement.prototype.play = () => Promise.resolve();
  return { ...r, stopped };
}

test('👁 camera.control.panel; 👂 audio.control.panel; OFF stops the tracks; closing the stage turns them off', { skip }, async () => {
  const { w, d, stopped } = devBoot();
  await tick(20); w.RagebarImmersive.open(''); await tick(30);
  const btn = (t) => [...d.querySelectorAll('.ri-bar .ri-btn')].find((b) => b.textContent === t);
  btn('👁').click(); await tick(40);
  const cam = d.querySelector('[aria-label="camera.control.panel"]');
  assert.ok(cam.classList.contains('ri-show') && btn('👁').classList.contains('ri-live'), 'camera on, its panel open');
  assert.match(cam.textContent, /FaceTime HD/); assert.match(cam.textContent, /640 × 480 · 30 fps/);
  assert.ok(cam.querySelector('video.ri-mirror'), 'mirrored preview');
  [...cam.querySelectorAll('.ri-btn')].find((b) => b.textContent === 'camera OFF').click(); await tick(10);
  assert.deepEqual(stopped, ['video']); assert.ok(!cam.classList.contains('ri-show') && !btn('👁').classList.contains('ri-live'));
  btn('👂').click(); await tick(40);
  const aud = d.querySelector('[aria-label="audio.control.panel"]');
  assert.ok(aud.classList.contains('ri-show') && aud.querySelector('canvas.ri-scope'));
  assert.match(aud.textContent, /48000 Hz/);
  [...aud.querySelectorAll('.ri-btn')].find((b) => /dictate/.test(b.textContent)).click(); await tick(10);
  assert.match(d.querySelector('.ri-term-log').textContent, /no speech recogniser/, 'said plainly where there is none');
  btn('👁').click(); await tick(40);
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await tick(220);
  assert.deepEqual(stopped.sort(), ['audio', 'video', 'video'], 'closing the stage stops the camera and the microphone');
});

test('⇄ networking.tools times every service RAGE uses', { skip }, async () => {
  const { w, d, calls } = boot();
  await tick(20); w.RagebarImmersive.open(''); await ask(w, d, 'memory'); await tick(60);
  [...d.querySelectorAll('.ri-bar .ri-btn')].find((b) => b.textContent === '⇄').click(); await tick(120);
  const net = d.querySelector('[aria-label="networking.tools"]');
  assert.ok(net.classList.contains('ri-show'));
  for (const label of ['this connection', 'last search', 'RAGE search /health', 'WordPress search', 'DeltaVerse sequence', 'ollywoo toolkit', 'LUVping']) assert.match(net.textContent, new RegExp(label));
  assert.ok(calls.some((c) => c.includes('luv.pythai.net/luvping')));
});

test('articles respond as the rage menu does: open in place, kindred, thread, tags; one trail with the menu', { skip }, async () => {
  const { w, d } = boot();
  await tick(20); w.RagebarImmersive.open(''); await ask(w, d, 'memory'); await tick(80);
  const card = d.querySelector('.ri-results .ri-art[data-id="1"]');
  assert.ok(card, 'an article result is an atlas article node');
  const q = d.querySelector('.ri-q'); q.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter' })); await tick(20);
  assert.ok(card.classList.contains('ri-on'), 'Enter opens the first article in place');
  assert.match(card.querySelector('.ri-body').textContent, /the excerpt of one/);
  assert.match(card.querySelector('.ri-body').textContent, /LISTEN in NEURAL, JAIMLA/);
  const acts = [...card.querySelectorAll('.ri-act')].map((a) => a.textContent);
  assert.deepEqual(acts.slice(0, 3), ['read →', '✵ kindred', '↔ its thread']);
  assert.ok(acts.includes('#memory') && acts.includes('#pgvectorscale'));
  [...card.querySelectorAll('.ri-act')].find((a) => a.textContent === '✵ kindred').click(); await tick(10);
  const sub = card.querySelector('.ri-sub');
  assert.ok(sub && /kindred · One/.test(sub.textContent) && sub.querySelectorAll('.ri-art').length >= 1, 'kindred spawn beneath it');
  const tr = JSON.parse(w.sessionStorage.getItem('ragemap_v1'));
  assert.equal(tr.trail[0].k, 'a1'); assert.equal(tr.collected['7'], 1, 'the rage menu\'s own trail and collected tags');
  assert.match(d.querySelector('.ri-trail').textContent, /trail/);
  assert.match(d.querySelector('.ri-trail').textContent, /memory ×1/);
});

test('a star picked on the ground opens its article here (dv:rage.pick)', { skip }, async () => {
  const { w, d } = boot();
  await tick(20); w.RagebarImmersive.open(''); await ask(w, d, 'memory'); await tick(80);
  d.dispatchEvent(new w.CustomEvent('dv:rage.pick', { detail: { id: 3 } })); await tick(40);
  const c = d.querySelector('.ri-art[data-id="3"]');
  assert.ok(c && c.classList.contains('ri-on'), 'not among the results: spawned from the ground and opened');
  d.dispatchEvent(new w.CustomEvent('dv:rage.pick', { detail: { id: 1 } })); await tick(20);
  assert.ok(d.querySelector('.ri-results .ri-art[data-id="1"]').classList.contains('ri-on'), 'among the results: opened in place');
});

test('substrate page config: clear backdrop, opens by itself, type anywhere to ask', { skip }, async () => {
  const { w, d } = boot({ pre: '<script>window.RAGEBAR={search:"/ragesearch",backdrop:"clear",typeToOpen:true,open:true}</script>' });
  await tick(500);
  const box = d.querySelector('.ri');
  assert.ok(box.classList.contains('ri-clear') && box.classList.contains('ri-open'), 'opens over a clear backdrop');
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await tick(220);
  d.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'g', bubbles: true })); await tick(40);
  assert.ok(box.classList.contains('ri-open') && d.querySelector('.ri-q').value === 'g', 'a letter typed anywhere opens it with that letter');
});

// a stand-in for three.js and ollywoo's faice.js, handed in through RAGEBAR.faice (the seam a page with its own three.js uses)
const FAKE_FAICE = `<script>window.FZ={cams:[],ups:[],drag:0};
window.RAGEBAR={faice:function(){ function K(){} K.prototype.add=function(){}; K.prototype.set=function(){};
  var T={WebGLRenderer:function(){ this.setPixelRatio=function(){}; this.setSize=function(){}; this.render=function(){}; },Scene:function(){ this.add=function(){}; },
    PerspectiveCamera:function(){ this.position={set:function(){}}; },HemisphereLight:function(){},DirectionalLight:function(){ this.position={set:function(){}}; },
    Vector2:function(x,y){ this.x=x; this.y=y; },Raycaster:function(){ this.setFromCamera=function(){}; this.intersectObjects=function(L){ return window.FZ.hit?[{object:L[window.FZ.hit==='eyes'?0:4]}]:[]; }; }};
  var eyes=[{},{},{},{}], ears=[{},{}];
  return [T,{createFaice:function(){ return {group:{},organs:{eyes:eyes,ears:ears},attachDrag:function(){ window.FZ.drag++; },setCamera:function(v){ window.FZ.cams.push(v?v.tagName:null); },update:function(s){ window.FZ.ups.push(s); }}; }}]; }};</script>`;

test("drag 👁 and 👂 onto Jaimla's faice: her eyes are the camera, her ears the microphone", { skip }, async () => {
  const { w, d, stopped } = devBoot({ pre: FAKE_FAICE });
  await tick(20); w.RagebarImmersive.open(''); await tick(30);
  const btn = (t) => [...d.querySelectorAll('.ri-bar .ri-btn')].find((b) => b.textContent === t);
  const fzp = d.querySelector('[aria-label="Jaimla\'s faice"]'), cam = d.querySelector('[aria-label="camera.control.panel"]'), aud = d.querySelector('[aria-label="audio.control.panel"]');
  assert.ok(!fzp.classList.contains('ri-show'), 'the faice waits until it is asked for');
  const P = (el, type, x, y) => el.dispatchEvent(new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }));
  const drag = async (el) => { P(el, 'pointerdown', 120, 40); P(el, 'pointermove', 80, 30); assert.ok(d.querySelector('.ri-ghost'), 'the organ follows the pointer');
    assert.ok(fzp.classList.contains('ri-show'), 'the faice opens as the drag begins'); P(el, 'pointermove', 4, 4); assert.ok(fzp.classList.contains('ri-hover'), 'lit as a target');
    P(el, 'pointerup', 4, 4); el.click(); await tick(120); };
  await drag(btn('👁'));
  assert.ok(!d.querySelector('.ri-ghost'), 'the ghost is gone on drop');
  assert.ok(btn('👁').classList.contains('ri-live'), 'dropped on the faice: the camera is on');
  assert.ok(!cam.classList.contains('ri-show'), 'the click that ends a drag is not a click: no panel');
  assert.deepEqual([...w.FZ.cams], ['VIDEO'], 'her eyes are the camera stream');
  assert.ok(w.FZ.drag === 1, 'the globe turns when grabbed');
  assert.ok(w.FZ.ups.some((u) => u.camOn === true), 'the lids open');
  assert.match(fzp.textContent, /eyes.*the camera · FaceTime HD/);
  assert.match(d.querySelector('.ri-term-log').textContent, /Jaimla's eyes are the camera/);
  await drag(btn('👂'));
  assert.ok(btn('👂').classList.contains('ri-live') && !aud.classList.contains('ri-show'), 'the microphone is on, quietly');
  assert.ok(w.FZ.ups.some((u) => u.micLevel > 0.4), 'her ears hear the microphone');
  assert.match(fzp.textContent, /ears.*the microphone · Built-in mic/);
  // a click on an eye opens its panel; a plain click on 👁 is still the button
  w.FZ.hit = 'eyes'; const cv = fzp.querySelector('canvas'); P(cv, 'pointerdown', 10, 10); P(cv, 'pointerup', 11, 10);
  assert.ok(cam.classList.contains('ri-show'), 'clicking her eye opens the camera.control.panel');
  [...cam.querySelectorAll('.ri-btn')].find((b) => b.textContent === 'camera OFF').click(); await tick(60);
  assert.deepEqual([...w.FZ.cams], ['VIDEO', null], 'camera off: her eyes go blind');
  assert.match(fzp.textContent, /closed · drop 👁 here/);
  // dropped somewhere else: nothing turns on
  P(btn('👁'), 'pointerdown', 120, 40); P(btn('👁'), 'pointermove', 60, 300); P(btn('👁'), 'pointerup', 600, 600); await tick(30);
  assert.ok(!btn('👁').classList.contains('ri-live'), 'missed the faice: the camera stays off');
  // the faice from the rolodex and from :face
  [...fzp.querySelectorAll('.ri-btn')].find((b) => b.textContent === 'close').click();
  assert.ok(!fzp.classList.contains('ri-show'));
  const chip = [...d.querySelectorAll('.ri-pc')].find((c) => /Jaimla/.test(c.textContent)).querySelector('.ri-fzc');
  assert.ok(chip, "◉ on Jaimla's card"); chip.click(); assert.ok(fzp.classList.contains('ri-show'));
  const q = d.querySelector('.ri-q'); q.value = ':face'; q.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await tick(10);
  assert.ok(!fzp.classList.contains('ri-show'), ':face toggles it');
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await tick(220);
  assert.ok(stopped.includes('audio'), 'closing the stage still turns the microphone off');
});
