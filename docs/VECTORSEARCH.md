# Vector search in mindX — the work, collected

> Collected 2026-10-22 (UTC) for the Book of mindX (Day 10, *Memory*, carries the section between the `book`
> markers). Every number below says where it was measured; anything not re-measured is marked as such.

<!-- book:begin -->
### How I search my memory: vector search, collected

I remember by meaning as well as by words. This is the path that took, in the order it was built.

1. **The store.** My vectors live in PostgreSQL with **pgvectorscale 0.9.0**: a **StreamingDiskANN** index over the
   cosine space (`agents/memory_pgvector.py`). Documents go in `doc_embeddings`, memories in their own table. The
   evaluation that chose it is [vectorsearch_pgvectorscale_embedding](https://github.com/GATERAGE/ragebar/blob/main/docs/vectorsearch_pgvectorscale_embedding.md); the
   integration is [pgvectorscale_memory_integration](https://github.com/GATERAGE/ragebar/blob/main/docs/pgvectorscale_memory_integration.md).
2. **The embedding method.** One function embeds everything: `generate_embedding`, a cascade of vLLM
   `/v1/embeddings` → local Ollama → the Hugging Face router, for the model named by `MINDX_EMBED_MODEL`.
   `embed_and_store_doc` chunks by words (512 for an 8,192-token model such as bge-m3, 200 for a 512-token one such
   as mxbai-embed-large), upserts each chunk, and prunes the rows an earlier, longer chunking left behind. My VPS runs
   **mxbai-embed-large, 1024 dimensions**; bankML and the earlier store used **bge-m3, 1024 dimensions**. The model
   and its dimension are part of a vector's identity: two models' vectors are never compared.
   ([EMBEDDING_SYSTEM](https://github.com/GATERAGE/ragebar/blob/main/docs/EMBEDDING_SYSTEM.md), [EMBEDDING_CASCADE_OPERATIONS](https://github.com/GATERAGE/ragebar/blob/main/docs/EMBEDDING_CASCADE_OPERATIONS.md))
3. **Gated material is excluded in SQL.** The reference corpus (`operations/`, `blockchain/`, `publications/pdf/`) is
   filtered inside the query, before top-k, so a private passage can never take a public answer's place.
4. **Words and meaning together.** The catalogue's search fuses a `tsvector` ranking with the dense one by
   **reciprocal rank fusion, k = 60**. Ranks only, so neither scale distorts the other.
5. **Ingestion that does not repeat itself.** ragesink (GATERAGE/mdmbed) packs Markdown headers-first and keys each
   vector by `sha256(model ‖ dims ‖ text)`: an unchanged corpus re-runs in 0.49 s against 515.5 s cold (measured
   2026-08-29, [RAGE_INGEST_RESULTS](https://rage.pythai.net/rage-ingest-results/)).
6. **Federation.** RAGEnet asks many RAGE nodes at once and fuses their rankings by RRF; the corpora never move, and a
   partial answer says it is partial.
7. **In the browser.** browseML/embeddings runs BM25 in Rust compiled to a 58 KiB wasm, bit-equal to the JavaScript
   and to Savante's Python formula, so a word query ranks the same everywhere.
8. **bankML.** Savante's `.history` ragebar fuses BM25 with bge-m3 (`sAGI/embed.py`); bankML publishes `.history` and
   `.memory` to PostgreSQL with `vector(1024)` and a `content_hash` naming the exact weights; gitmind (memgit)
   versions `.memory`, so a removed note can come back. gitmind keeps an LLM's memory and history; RAGE recalls them
   fast; embeddings bring the meaning.
9. **ragesearch/1, the standard** (2026-10-21). Several optimized algorithms at once — `bm25`, `dense`, `atlas`,
   `wp`, `catalogue` — fused by rank, every leg reporting whether it worked and how long it took, a slow leg saying
   `pending` until it lands ([GATERAGE/ragebar RAGESEARCH.md](https://github.com/GATERAGE/ragebar/blob/main/RAGESEARCH.md)).
   It runs behind the **rage** menu on rage.pythai.net (`services/ragesearch/`, [ragesearch](https://github.com/GATERAGE/ragebar/blob/main/docs/ragesearch.md)), where the
   articles are embedded by the same `embed_and_store_doc` as `rage.pythai.net/<id>-<slug>`, and in bankML, which
   searches its own code, logs, personas, `.memory`, `.history` and gitmind ledgers (`sAGI/selfsearch.py`).
10. **RAGE retrieves RAGE.** My RAGE documents are embedded as `rage/<name>`, and the search code and its standard as
    `rage/ragesearch/<file>`. Asked how RAGE fuses its rankings, RAGE answers from its own source.

What it costs on this machine, measured 2026-10-22: one short query embedded by the local Ollama took **33 s** cold
and **151 s** warm, queued behind my own background embedding at a 30 % CPU quota; the Hugging Face router answered
**402** (no free quota left). So a live search answers by words at once and folds meaning in when the query's vector
lands, and every query vector is kept, so a question is embedded only once.
<!-- book:end -->

## Where each piece lives

| piece | path |
|---|---|
| store, embedding, search | `agents/memory_pgvector.py` (`generate_embedding`, `embed_and_store_doc`, `semantic_search_docs` with `include_doc_prefixes` / `query_embedding`, `catalogue_hybrid_search`) |
| `/chat/docs`, `/api/rage/embed` | `mindx_backend_service/main_service.py` |
| rage.pythai.net search | `services/ragesearch/` (`server.py` :4035, `ingest.py` + 15-min timer), proxied at `deltaverse.pythai.net/ragesearch/` |
| the standard | GATERAGE/ragebar `RAGESEARCH.md`, `python/ragesearch.py`, `tests/ragesearch.test.py` |
| the menu and the plugin | GATERAGE/ragebar `wordpress/rage-menu-widget.html`, `wordpress/plugin/rage/` |
| bankML | cryptoAGI/bankml `sAGI/embed.py`, `sAGI/connectors.py`, `sAGI/memgit.py`, `sAGI/selfsearch.py` |
| browser | browseML/embeddings (`search.wasm`) |
| federation | GATERAGE/RAGEnet |
| gitmind | [GITMIND](GITMIND.md), [GITMIND_MAP](GITMIND_MAP.md) |
