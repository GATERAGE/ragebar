# ragebar

**The search bar that rages while it retrieves.**

Zero dependencies. No build step. No framework. Attach it to any `<input>` and
that input becomes a live retrieval surface: results as you type, and a meter
driven by the search itself.

The rage is not decoration — it is a readout of retrieval:

| signal | what drives it |
|---|---|
| meter climbs | your typing speed, while you are still asking |
| meter surges | how many results the corpus actually returned |
| meter goes red | the corpus returned nothing — *"nothing. the engine is furious."* |

Live on every page of [rage.pythai.net](https://rage.pythai.net) — press the
magnifier, top right.

---

## Where RAGE actually lives

Retrieval Augmented Generation is a pattern. **RAGE — the Retrieval Augmented
Generative Engine — is the engine that runs it**, and the most innovative
deployment of it is not in this repository or any other single one. It is inside
**[mindX](https://mindx.pythai.net)**, in the **pgvectorscale** store.

That deployment is worth stating precisely, because the numbers are measured
rather than claimed:

- **pgvectorscale 0.9.0** on PostgreSQL, with a **StreamingDiskANN** index over
  the cosine space — approximate nearest-neighbour search that stays fast as the
  corpus grows, which is the operation everything else depends on.
- **48,472 embedded chunks** across ~40,000 documents, embedded with
  **bge-m3 at 1024 dimensions** through local Ollama — no embedding provider, no
  per-token bill, and no third party sees the corpus.
- Retrieval that **excludes gated material in SQL, not after the fact**. Filter
  afterwards and private chunks still consume slots inside the top-k, silently
  displacing the public results that should have been returned. Nothing leaks,
  but the answer quietly gets worse and nothing logs it.
- The numbers and the meanings live in **separate databases on one cluster**: an
  append-heavy relational store for prices and time series, pgvectorscale for
  what those numbers mean. A price wants exactness; a chain wants proximity.
  ([the long version](https://rage.pythai.net/chainmarketcap-two-stores/))

The ragebar is the smallest possible front door to that idea: *retrieval first,
generation second.* That is what the R and the G in RAGE are for.

---

## The GATERAGE lineage

**gaterage is the ragegate** — the way in. The org carries three kinds of
repository, and they should not be read as equals:

**The engine and its variants** — [RAGE](https://github.com/GATERAGE/RAGE)
(the engine itself, GPL-3.0) · [deeprage](https://github.com/GATERAGE/deeprage)
(multi-model MVP, local + API) ·
[deepragetemplate](https://github.com/GATERAGE/deepragetemplate) (the template
others start from) · [DeepSeekRAGE](https://github.com/GATERAGE/DeepSeekRAGE)
(DeepSeek + streaming) · [ragemini2](https://github.com/GATERAGE/ragemini2)
(Gemini) · [RAGEmini](https://github.com/GATERAGE/RAGEmini)

**The cognitive corners** — [aGLM](https://github.com/GATERAGE/aglm), the
Autonomous General Learning Model, extrapolated from `automindx` ·
[mastermind](https://github.com/GATERAGE/mastermind), strategic orchestration,
directive → plan → execute ·
[neuralnet](https://github.com/GATERAGE/neuralnet), RAGE integrated with a mini
production transformer · [RAGEnet](https://github.com/GATERAGE/RAGEnet) ·
[drage](https://github.com/GATERAGE/drage), dynamic self-prompting from
`agency.txt`

**The surfaces** — [rageminibar](https://github.com/GATERAGE/rageminibar)
(modular Streamlit menus) · [RAGE-ui](https://github.com/GATERAGE/RAGE-ui) ·
and this repository.

The rest of the org is forks, and they are honest about what they are: study
material. Of 73 repositories, 13 are original and another 17 are forked *within
our own orgs* (`pythaiml`, `augml`, `DeltaVML`, `UIUXt`) — so GitHub's fork
badge undercounts the work considerably. The remaining 43 are external.

The clearest map of how this came to be is
[github.com/professor-codephreak](https://github.com/professor-codephreak); the
narrative is told properly in the articles on
[rage.pythai.net](https://rage.pythai.net).

---

## Use it

```html
<link rel="stylesheet" href="src/ragebar.css">
<input id="q" class="ragebar-input" type="search" placeholder="search...">
<script src="src/ragebar.js"></script>
<script>Ragebar.attach(document.getElementById('q'));</script>
```

Corpus-agnostic — the WordPress REST search API is only the default:

```js
Ragebar.attach(input, {
  endpoint: '/my/search?q=',                 // ? or & terminated
  parse:    (json) => json.hits.map(h => ({ title: h.name, url: h.href })),
  total:    (headers) => headers.get('X-Total-Count'),
  minChars: 2, debounce: 260
});
```

`Ragebar.attach()` returns `{ input, search, el }`, or `null` if that input was
already attached.

### WordPress

`wordpress/ragebar-widget.html` is the deployed drop-in: paste it into a
**Custom HTML widget** in any always-rendered sidebar and it upgrades the
theme's existing header search in place.

Two traps, learned the hard way:

- **`wpautop` destroys `<script>` in post/page content.** Blank lines inside a
  script become `</p><p>` — a syntax error — and HTML inside JS strings gets
  rewritten. Custom HTML *widgets* are not filtered this way. That is why the
  library builds every node with `createElement` and never with `innerHTML`.
- **`POST /wp/v2/widgets` ignores the `sidebar` field**, leaving the widget in
  `wp_inactive_widgets`. Assign it with `POST /wp/v2/sidebars/<id>` — which
  *blanks the content* — then write the content again. Three calls, in that order.

## Design notes

- **30fps cap, `requestAnimationFrame`, rage decays** — the canvas is cheap and
  idles at nothing.
- **Stale answers lose.** Every search takes a sequence number and aborts the
  previous request; a slow reply for an old query can never overwrite a fast one.
- **`prefers-reduced-motion`** removes the canvas entirely; the bar stays fully
  functional.
- **Accessible**: `role="status"` + `aria-live="polite"` on the readout, the
  canvas is `aria-hidden`, results are real links.

## Licence

Apache-2.0.
