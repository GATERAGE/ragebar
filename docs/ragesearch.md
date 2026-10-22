# ragesearch — RAGE search for rage.pythai.net

The service behind the **rage** menu's ragebar mode, to the ragesearch/1 standard
([GATERAGE/ragebar RAGESEARCH.md](https://github.com/GATERAGE/ragebar/blob/main/RAGESEARCH.md)). Deployed 2026-10-22 UTC.

| | |
|---|---|
| code | `services/ragesearch/server.py` (FastAPI, 127.0.0.1:4035), `ingest.py`, `ragesearch.py` (vendored standard) |
| units | `ragesearch.service` (CPUQuota 30 % of one CPU, MemoryMax 600M), `ragesearch-ingest.service` + `.timer` (every 15 min, CPUQuota 15 %, nice 15, idle I/O) |
| public | `https://deltaverse.pythai.net/ragesearch/search?q=&k=&legs=fast|all&wait=&corpus=articles|self|all`, `/ragesearch/health` (Apache proxy; CORS for the pythai.net origins, as docsplayer) |
| data | `data/ragesearch/corpus.jsonl` (BM25 corpus), `ingest_ledger.json`, `ingest_state.json`, `qvec.jsonl` (query vectors); log `data/logs/ragesearch_ingest.jsonl` |

**Legs.** `bm25` over full text in mindX's chunk shape; `atlas`, the menu's own phrase match over `atlas.json`;
`dense`, `memory_pgvector.semantic_search_docs(include_doc_prefixes=…, query_embedding=…)` over StreamingDiskANN.
The browser adds `wp` (WordPress search) and fuses all four by RRF k = 60.

**Corpora.** `articles`: the posts, embedded by `embed_and_store_doc` as `rage.pythai.net/<id>-<slug>`, newest first,
re-embedded only when `sha256(model | chunk_words | text)` changes, a vanished post pruned only after a complete
fetch. `self`: RAGE retrieving RAGE — `docs/rage/` (embedded by mindX as `rage/<name>`) and the search code and
standard (`rage/ragesearch/<file>`). Only RAGE documents belong under `rage/`; ARIO/ArNS moved to `blockchain/` and
to Parsec's permaweb module on 2026-10-22.

**The query embedding.** Raced between the Hugging Face router (mindX's third cascade leg, the same model) and the
local Ollama; first to answer wins, the dimension is checked against the store. `legs=fast` never waits; `legs=all`
waits up to `wait` ms, else the leg reports `pending`. Query vectors are cached; `ingest.py` pre-embeds the atlas's
most used tags (`RAGESEARCH_WARM_QUERIES` per run). Measured 2026-10-22: Ollama 33 s cold / 151 s warm for one short
query (queued behind mindX's own embeds, 30 % CPU quota), Hugging Face 402.

**Operate.** `curl -s localhost:4035/ragesearch/health` · `systemctl start ragesearch-ingest` · `journalctl -u
ragesearch-ingest` · `sudo -u mindx .mindx_env/bin/python services/ragesearch/ingest.py --dry-run`. Restarting
`ragesearch.service` touches nothing else; it never restarts mindx.service.
