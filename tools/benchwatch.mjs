#!/usr/bin/env node
/*!
 * benchwatch — follow models on BenchLM.ai and the Hugging Face Hub.
 * GATERAGE · https://github.com/GATERAGE/ragebar · Apache-2.0 (the code; see data/README.md for the data)
 *
 * benchlm.ai publishes its rankings as open JSON (/data/models.json) but sends
 * no CORS headers, so a browser cannot read it from another origin. This script
 * reads it on a schedule and writes a small snapshot that a page can read:
 *
 *   node tools/benchwatch.mjs [benchwatch.json]
 *
 *   data/benchwatch.json           the current state of every watched model
 *   data/benchwatch-history.jsonl  one line per field that moved, append-only
 *
 * Zero dependencies (Node 18+ fetch). The models file is several MB, so it is
 * fetched with If-None-Match and skipped when the ETag has not moved. The
 * snapshot is rewritten only when something other than `checkedAt` changed,
 * so a scheduled run that finds nothing new leaves git clean.
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const cfgPath = resolve(process.argv[2] || 'benchwatch.json');
const root = dirname(cfgPath);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const OUT = resolve(root, cfg.out || 'data/benchwatch.json');
const HIST = resolve(root, cfg.history || 'data/benchwatch-history.jsonl');
const UA = 'ragebar-benchwatch/1.0 (+https://github.com/GATERAGE/ragebar)';

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;

async function getJSON(url, etag) {
  const headers = { 'user-agent': UA, accept: 'application/json' };
  if (etag) headers['if-none-match'] = etag;
  const r = await fetch(url, { headers });
  if (r.status === 304) return { notModified: true };
  if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
  return { json: await r.json(), etag: r.headers.get('etag') };
}

// {agentic:{gdpvalAa:1673}} → {"agentic.gdpvalAa":1673}; nulls dropped.
function flatten(obj, pre = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = pre ? pre + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else if (v !== null && v !== undefined) out[key] = v;
  }
  return out;
}

function fromBenchlm(items, slug) {
  const m = items.find((x) => x.slug === slug || x.canonicalModelKey === slug);
  if (!m) return { slug, missing: true };
  const open = items
    .filter((x) => x.sourceType === 'Open Weight' && typeof x.overallRank === 'number')
    .sort((a, b) => a.overallRank - b.overallRank);
  const openRank = m.sourceType === 'Open Weight' ? open.findIndex((x) => x.slug === m.slug) + 1 || null : null;
  const iv = m.scoreInterval90 || {};
  return {
    slug: m.slug,
    model: m.model,
    creator: m.creator,
    url: m.url,
    releaseDate: m.releaseDate,
    sourceType: m.sourceType,
    evidenceStatus: m.evidenceStatus,
    displayScore: m.displayScore,
    interval90: iv.lower != null ? [iv.lower, iv.upper] : null,
    overallRank: m.overallRank ?? null,
    openRank,
    categoryScores: flatten((m.scores || {}).displayCategoryScores),
    categoryRanks: flatten((m.ranking || {}).categoryRanks),
    benchmarks: flatten(m.benchmarks),
    benchmarkCount: (m.coverage || {}).trustedBenchmarkCount ?? null,
  };
}

async function fromHub(id) {
  try {
    const r = await fetch('https://huggingface.co/api/models/' + id, { headers: { 'user-agent': UA } });
    if (!r.ok) return { id, url: 'https://huggingface.co/' + id, missing: true, status: r.status };
    const j = await r.json();
    return { id, url: 'https://huggingface.co/' + id, sha: j.sha, lastModified: j.lastModified,
             downloads: j.downloads ?? null, likes: j.likes ?? null };
  } catch (e) {
    return { id, url: 'https://huggingface.co/' + id, missing: true, error: String(e.message || e) };
  }
}

// Fields whose movement is worth a history line. Downloads tick every hour;
// they live in the snapshot but would drown the history.
const TRACKED = ['displayScore', 'overallRank', 'openRank', 'evidenceStatus', 'benchmarkCount', 'missing'];
function diff(slug, a, b, ts) {
  if (!a) return [];
  const rows = [];
  const push = (field, from, to) => { if (JSON.stringify(from) !== JSON.stringify(to)) rows.push({ ts, slug, field, from: from ?? null, to: to ?? null }); };
  for (const f of TRACKED) push(f, a[f], b[f]);
  for (const g of ['categoryScores', 'categoryRanks', 'benchmarks']) {
    const keys = new Set([...Object.keys(a[g] || {}), ...Object.keys(b[g] || {})]);
    for (const k of keys) push(g + '.' + k, (a[g] || {})[k], (b[g] || {})[k]);
  }
  const ah = Object.fromEntries((a.hf || []).map((h) => [h.id, h]));
  for (const h of b.hf || []) {
    const o = ah[h.id];
    if (!o) continue;
    push('hf.' + h.id + '.sha', o.sha, h.sha);
    push('hf.' + h.id + '.likes', o.likes, h.likes);
    push('hf.' + h.id + '.missing', !!o.missing, !!h.missing);
  }
  return rows;
}

const now = new Date().toISOString();
let src;
// A model added to the watchlist since the last run has no cached row, so the
// conditional fetch is only safe when every watched slug is already known.
const known = new Set(((prev && prev.models) || []).map((m) => m.slug));
const etag = cfg.models.every((w) => known.has(w.benchlm)) && prev && prev.source && prev.source.etag;
const got = await getJSON(cfg.source, etag);
if (got.notModified) {
  src = prev.source;
} else {
  const j = got.json;
  src = {
    url: cfg.source, etag: got.etag, generatedAt: j.generatedAt, sourceLastUpdated: j.sourceLastUpdated,
    totalModels: (j.counts || {}).totalModels ?? null, rankedModels: (j.counts || {}).rankingEligibleModels ?? null,
    attribution: j.attribution || 'Data from BenchLM.ai', license: j.license || 'CC BY-NC 4.0', licenseUrl: j.licenseUrl,
    items: j.items,
  };
}

const prevBySlug = Object.fromEntries(((prev && prev.models) || []).map((m) => [m.slug, m]));
const models = [];
for (const w of cfg.models) {
  const b = src.items ? fromBenchlm(src.items, w.benchlm) : { ...prevBySlug[w.benchlm] };
  delete b.hf; delete b.changes; delete b.changedAt;
  b.hf = await Promise.all((w.hf || []).map(fromHub));
  models.push(b);
}
delete src.items;

const history = [];
for (const m of models) {
  const p = prevBySlug[m.slug];
  const rows = diff(m.slug, p, m, now);
  history.push(...rows);
  m.changes = rows.length ? rows : (p && p.changes) || [];
  m.changedAt = rows.length ? now : (p && p.changedAt) || now;
}

const snap = { schema: 'ragebar.benchwatch/1', checkedAt: now, source: src, models };
const strip = (s) => JSON.stringify({ ...s, checkedAt: null });
if (prev && strip(prev) === strip(snap)) {
  console.log('benchwatch: nothing moved (' + (got.notModified ? 'ETag unchanged' : 'same values') + ')');
  process.exit(0);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(snap, null, 2) + '\n');
if (history.length) appendFileSync(HIST, history.map((r) => JSON.stringify(r)).join('\n') + '\n');
for (const m of models) {
  console.log('benchwatch: ' + (m.model || m.slug) + ' score ' + m.displayScore + ' · rank #' + m.overallRank +
              (m.openRank ? ' · open #' + m.openRank : '') + ' · ' + m.hf.map((h) => h.id + (h.missing ? ' (missing)' : ' ↓' + h.downloads + ' ♥' + h.likes)).join(' · '));
}
console.log('benchwatch: ' + history.length + ' change(s) → ' + OUT);
