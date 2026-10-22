# GITMIND — the work, collected and categorized

> Collected 2026-10-22 (UTC). gitmind is part of RAGE's world: it keeps an LLM's `.memory` and `.history` as versions
> (every add, removal and rollback a commit and a ledger line), RAGE recalls them fast, embeddings bring the meaning.
> The design doc is [GITMIND](GITMIND.md).

## The library

| what | where | version |
|---|---|---|
| gitmind, standalone (MIT): git monitor, rollback ledger, bundle backup to local / IPFS / Arweave | github.com/Professor-Codephreak/gitmind | 0.1.0 (`c4b379c`, one commit) |

## Vendored copies

| what | where | version |
|---|---|---|
| bankML's copy, used by `sAGI/memgit.py` for `.memory` versions (also connectors.py, savante.py) | cryptoAGI/bankml `sAGI/gitmind/` | 0.1.0 at `c4b379c` + SPDX headers, vendoring note, LICENSE (bankml 0.4.4) |
| the same, in bankonpythai | `bankonpythai/sAGI/gitmind/` | same |
| easyAGI's bridge ("permanence of memory + rollback") | easyAGI `kernel/gitmind_bridge.py`, `docs/gitmind.md` | — |

## mindX's own build and its integrations

| what | where |
|---|---|
| mindX's extended gitmind (1,235 lines): THOT / THlNK lineage, `self.git` mirror, sources local · IPFS · Arweave · HF, `offload_data` | `mindx/gitmind/` |
| CLI, tests, runtime state (ledger, last_state, backups) | `scripts/gitmind.py`, `tests/test_gitmind_efficient.py`, `data/gitmind/` |
| API surface | `GET /insight/gitmind` (OVERLORD-gated), `obsidian_routes.py`, `sharedcpu_routes.py` |
| users | `agents/author_agent.py` (`assess_gitmind_milestones`), `scripts/install_forgejo.sh` (the Forgejo third origin, git.pythai.net), `scripts/ario/generate_arweave_wallet.py` (ArweaveSource), the mindxhfgradio Space (`ui.py`, `modules.py`) |
| `/gitmind/ingest` (browseML pushes a browser `.memory` here) | on branch `docs/bankml-0.4.4` only (`mindx_backend_service/gitmind_ingest_routes.py` + test) — **not merged** into the working branch |

## browseML

| what | where |
|---|---|
| a browser `.memory` kept as git history that gitmind and memgit can read; pushed to mindX `/gitmind/ingest` | browseML `app/src/bankml/gitmind.ts` (+ test), `app/src/clientside/{GitMind.tsx, gitmindStore.ts, modules/memoryPush.tsx}` (0.8.6) |

## Search

gitmind's ledgers are a corpus of bankML's self-search (`sAGI/selfsearch.py`, corpus `gitmind`), beside `.memory`
and `.history` — RAGE over the versions of memory.

## Open

- The standalone repo is at 0.1.0 while mindX's build has THlNK, Forgejo, HF and offload: upstreaming is undone.
- `/gitmind/ingest` exists only on `docs/bankml-0.4.4`; browseML 0.8.6+ pushes to a route the working branch lacks.
