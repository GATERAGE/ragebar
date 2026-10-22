# SPDX-License-Identifier: Apache-2.0
"""ragesearch — the RAGE search standard, reference implementation (GATERAGE/ragebar, RAGESEARCH.md).

RAGE searches with several optimized algorithms at once and fuses them by rank. Each algorithm is a *leg*:
it ranks passages its own way (words, meaning, tags, a site's own search), and reports whether it worked and how
long it took. Legs never share a score scale, so fusion uses ranks only: reciprocal rank fusion, k = 60
(Cormack, Clarke and Büttcher 2009). A leg that fails or times out drops out of the fusion and says so in the
response; it never fails the search.

This file is stdlib only and is vendored, unchanged, wherever RAGE search runs:
  - GATERAGE/ragebar python/ragesearch.py (canonical)
  - mindX services/ragesearch/ (rage.pythai.net's search service; its dense leg is mindX's pgvectorscale store)
  - bankML sAGI/ragesearch.py (bankML searching its own code, logs, .memory, .history and gitmind ledger)
`VERSION` and the sha256 of this file are how a copy proves it is the standard.

BM25 here is the formula Savante (bankML), selfcontext.py and browseML/embeddings use, so a word query ranks the
same passages in every one of them: idf = ln(1 + (N − df + 0.5) / (df + 0.5)), k1 = 1.2, b = 0.75, tokens
[a-z0-9]+ over lowercased text."""
from __future__ import annotations

import math
import re
import time

VERSION = "1.0.0"
RRF_K = 60
K1, B = 1.2, 0.75
STOP = frozenset("the and for are was were this that with from what which who whom how why when where does did doing "
                 "done can could would should will shall may might must have has had having been being into onto over "
                 "under about your yours you its they them their there here then than also just only very more most "
                 "some any all not but yes our ours ask tell me my mine please".split())
_TOK = re.compile(r"[a-z0-9]+")


def toks(text: str) -> list:
    return _TOK.findall((text or "").lower())


def query_terms(q: str) -> list:
    """The words of a query that carry meaning: stop words and words under three letters dropped, order kept, once each."""
    seen, out = set(), []
    for w in toks(q):
        if len(w) > 2 and w not in STOP and w not in seen:
            seen.add(w)
            out.append(w)
    return out


def chunk_words(text: str, size: int) -> list:
    """mindX's chunk shape (memory_pgvector.embed_and_store_doc): `size` words per chunk, chunks of 50 characters or
    less skipped. Passage ids (doc, chunk index) then line up between the BM25 leg and the pgvectorscale leg."""
    words = (text or "").split()
    out = []
    for i in range(0, len(words), size):
        c = " ".join(words[i:i + size])
        if len(c.strip()) > 50:
            out.append(c)
    return out


class BM25:
    """An in-memory BM25 index over passages: [{"id": ..., "text": ..., "title"?: ...}]. The title counts twice,
    as in selfcontext.py. Build once, search many times; rebuilding 10k passages takes well under a second."""

    def __init__(self, passages: list):
        self.p = passages
        self.tf, self.ln = [], []
        self.df: dict = {}
        for x in passages:
            tf: dict = {}
            for w in toks(f"{x.get('title', '')} {x.get('title', '')} {x.get('text', '')}"):
                tf[w] = tf.get(w, 0) + 1
            self.tf.append(tf)
            self.ln.append(sum(tf.values()))
            for w in tf:
                self.df[w] = self.df.get(w, 0) + 1
        self.n = len(passages)
        self.avg = (sum(self.ln) / self.n) if self.n else 1.0

    def scores(self, q: str) -> list:
        """[(index, score)] of every passage holding at least one query term, best first."""
        words = query_terms(q)
        if not words or not self.n:
            return []
        out = []
        for i, tf in enumerate(self.tf):
            sc = 0.0
            for w in words:
                f = tf.get(w)
                if f:
                    df = self.df[w]
                    idf = math.log(1 + (self.n - df + 0.5) / (df + 0.5))
                    sc += idf * f * (K1 + 1) / (f + K1 * (1 - B + B * self.ln[i] / self.avg))
            if sc > 0:
                out.append((i, sc))
        out.sort(key=lambda x: -x[1])
        return out

    def search(self, q: str, k: int = 20) -> list:
        return [dict(self.p[i], score=round(s, 4)) for i, s in self.scores(q)[:k]]


def rrf(rankings: dict, k: int = RRF_K) -> list:
    """Reciprocal rank fusion. `rankings` maps a leg name to a list of ids, best first. Returns
    [{"id", "rrf", "ranks": {leg: rank}}] best first. Ranks only: no leg's score scale leaks into another's."""
    acc: dict = {}
    for leg, ids in rankings.items():
        for rank, i in enumerate(ids, 1):
            e = acc.setdefault(i, {"id": i, "rrf": 0.0, "ranks": {}})
            if leg in e["ranks"]:
                continue  # an id listed twice by one leg counts once, at its best rank
            e["rrf"] += 1.0 / (k + rank)
            e["ranks"][leg] = rank
    out = sorted(acc.values(), key=lambda e: (-e["rrf"], e["id"] if isinstance(e["id"], str) else str(e["id"])))
    for e in out:
        e["rrf"] = round(e["rrf"], 6)
    return out


class Leg:
    """A timed leg result: `ok`, `ms`, `n`, and either the ranked ids or the reason it has none."""

    def __init__(self, name: str, algorithm: str):
        self.name, self.algorithm = name, algorithm
        self.t0 = time.monotonic()
        self.ok, self.ids, self.error, self.note = False, [], None, None

    def done(self, ids: list, note: str | None = None) -> "Leg":
        self.ok, self.ids, self.note = True, list(ids), note
        self.ms = round((time.monotonic() - self.t0) * 1000, 1)
        return self

    def fail(self, error: str) -> "Leg":
        self.ok, self.error = False, str(error)[:200]
        self.ms = round((time.monotonic() - self.t0) * 1000, 1)
        return self

    def report(self) -> dict:
        r = {"algorithm": self.algorithm, "ok": self.ok, "ms": self.ms, "n": len(self.ids)}
        if self.error:
            r["error"] = self.error
        if self.note:
            r["note"] = self.note
        return r


def envelope(query: str, legs: list, items: dict, corpus: dict, k: int = 10) -> dict:
    """The standard response (RAGESEARCH.md §3). `items` maps id → the passage's public fields
    (title, url, snippet, ...). Only legs that worked are fused."""
    fused = rrf({lg.name: lg.ids for lg in legs if lg.ok})
    results = []
    for e in fused:
        it = items.get(e["id"])
        if it is None:
            continue
        results.append(dict(it, id=e["id"], rrf=e["rrf"], ranks=e["ranks"]))
        if len(results) >= k:
            break
    return {
        "standard": "ragesearch/" + VERSION.split(".")[0],
        "version": VERSION,
        "query": query,
        "fusion": {"method": "rrf", "k": RRF_K},
        "legs": {lg.name: lg.report() for lg in legs},
        "complete": all(lg.ok for lg in legs),
        "corpus": corpus,
        "results": results,
    }
