# RAGESEARCH — the RAGE search standard (ragesearch/1)

**Status:** 1.0.0, 2026-10-21. Reference implementation: [`python/ragesearch.py`](python/ragesearch.py) (stdlib only).
First deployment: rage.pythai.net's atlas menu, answered by mindX's `ragesearch` service.

RAGE searches with **several optimized algorithms at once** and fuses what they find **by rank**. This document fixes
how, so a ragebar, a WordPress plugin, mindX and bankML all search the same way and say the same things about it.

## 1. Legs

A **leg** is one retrieval algorithm over one corpus. Each ranks passages its own way and returns a list of document
ids, best first. A deployment names its legs; these names are reserved:

| leg | algorithm | where it runs |
|---|---|---|
| `bm25` | BM25, `idf = ln(1 + (N − df + 0.5)/(df + 0.5))`, k1 = 1.2, b = 0.75, tokens `[a-z0-9]+` on lowercased text, title counted twice | anywhere (Python, JS, Rust→wasm: browseML/embeddings is bit-equal) |
| `dense` | embedding cosine: the query embedded with **the same model and dimension as the store**, nearest neighbours by cosine. In mindX: pgvectorscale **StreamingDiskANN** over `doc_embeddings`, embedded by `memory_pgvector.embed_and_store_doc` | the node holding the vectors |
| `atlas` | the phrase inside a title, excerpt or tag of a site's atlas (rage.pythai.net's menu) | browser or node |
| `wp` | WordPress's own search (`/wp-json/wp/v2/search`) | the visitor's browser, same origin |
| `catalogue` | mindX's catalogue hybrid (`fts` tsvector + dense, RRF inside) | mindX |

Rules:
1. **A leg never fails the search.** It reports `ok: false` with an `error`, and fusion goes on without it.
2. **A slow leg may be `pending`.** It reports `ok: false, error: "pending: …"`; the client may ask again with
   `legs=all&wait=<ms>` and fuse the late ranking in.
3. **The embedding model and dimension are part of a dense leg's identity.** Vectors from two models are never
   compared. Query vectors may be cached, keyed by `sha256(model | normalized query)`.
4. **Gated material is excluded inside the leg** (in SQL for a database), never filtered from the results afterwards,
   so private passages cannot take top-k places.

## 2. Fusion

Reciprocal rank fusion: `score(d) = Σ over legs of 1 / (k + rank_leg(d))`, **k = 60** (Cormack, Clarke and Büttcher
2009). Ranks only: no leg's score scale reaches another's, so a weak or missing leg is safe. A document listed twice
by one leg counts once, at its best rank. Fusion may run on the node, in the browser (a node's ranking fused with a
`wp` ranking the browser fetched), or both, and gives the same order for the same rankings.

## 3. The response

`GET <base>/search?q=<query>&k=<n>&legs=fast|all&wait=<ms>&corpus=<name>`

```json
{
  "standard": "ragesearch/1", "version": "1.0.0", "query": "…",
  "fusion": {"method": "rrf", "k": 60},
  "legs": {"bm25": {"algorithm": "…", "ok": true, "ms": 4.4, "n": 40},
           "dense": {"algorithm": "…", "ok": false, "ms": 0.3, "n": 0, "error": "pending: embedding the query"}},
  "complete": false,
  "corpus": {"name": "…", "documents": {…}, "passages": {…}, "chunk_words": 200, "model": "mxbai-embed-large", "dims": 1024},
  "results": [{"id": 1288, "title": "…", "url": "…", "date": "…", "snippet": "…", "rrf": 0.0164, "ranks": {"bm25": 1, "dense": 3}}]
}
```

- `complete` is true only when every leg asked for worked. A partial answer says it is partial.
- `ranks` shows, for each result, which legs found it and where: the retrieval is visible, not just its output.
- `legs=fast` runs the legs that answer in milliseconds; `legs=all` adds the slow ones (dense) and waits up to `wait`.
- `GET <base>/health` reports the corpus sizes, how much of it the dense leg covers, the model, and the last ingest.

## 4. Corpora: RAGE retrieves RAGE

A deployment may serve several corpora under `corpus=`. One is reserved: **`self`, RAGE's own docs and code**, so RAGE
can answer questions about RAGE from its own source. In mindX: `docs/rage/` (doc_name `rage/<name>`) and the search
code and this standard (`rage/ragesearch/<file>`). bankML's `self` is its own codebase, diagnostic logs, `.memory`,
`.history`, gitmind ledger and the mindX persona (`sAGI/ragesearch.py`, `sAGI/selfsearch.py`).

## 5. Ingestion

Chunk in the shape the dense store uses (mindX: `DEFAULT_CHUNK_WORDS` words, chunks of ≤ 50 characters skipped) so a
`bm25` passage and a `dense` passage are the same text. Re-embed a document only when
`sha256(model | chunk_words | text)` changes. Prune a vanished document only after a fetch that read everything.

## 6. Conformance

A copy of `ragesearch.py` is the standard when its `VERSION` matches and it passes
[`tests/ragesearch.test.py`](tests/ragesearch.test.py) (BM25 against fixed scores, RRF order and tie-break, envelope
shape). Copies: mindX `services/ragesearch/ragesearch.py`, bankML `sAGI/ragesearch.py`.
