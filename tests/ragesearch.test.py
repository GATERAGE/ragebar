#!/usr/bin/env python3
"""Conformance tests for ragesearch.py (RAGESEARCH.md §6). Run: python3 tests/ragesearch.test.py [path/to/ragesearch.py]"""
import importlib.util, math, sys
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "python" / "ragesearch.py"
spec = importlib.util.spec_from_file_location("ragesearch", path)
rs = importlib.util.module_from_spec(spec); spec.loader.exec_module(rs)
fails = 0
def check(name, ok):
    global fails
    print(("ok   " if ok else "FAIL ") + name); fails += 0 if ok else 1

docs = [{"id": "a", "title": "pgvectorscale", "text": "StreamingDiskANN index over cosine distance"},
        {"id": "b", "title": "ragebar", "text": "the search bar that rages while it retrieves"},
        {"id": "c", "title": "gitmind", "text": "versions of memory and history for an LLM, with rollback"}]
ix = rs.BM25(docs)
# hand-computed BM25 for "memory": only doc c holds it, tf=1
n, df = 3, 1
ln_c = len(rs.toks("gitmind gitmind versions of memory and history for an LLM, with rollback"))
avg = sum(len(rs.toks(f"{d['title']} {d['title']} {d['text']}")) for d in docs) / 3
want = math.log(1 + (n - df + 0.5) / (df + 0.5)) * 1 * 2.2 / (1 + 1.2 * (0.25 + 0.75 * ln_c / avg))
got = ix.scores("memory")
check("bm25 formula (k1 1.2, b 0.75, Lucene idf)", len(got) == 1 and got[0][0] == 2 and abs(got[0][1] - want) < 1e-12)
check("bm25 title counts twice", ix.search("ragebar")[0]["id"] == "b")
check("stop words and short words dropped", rs.query_terms("what is the gitmind of it") == ["gitmind"])
check("no match → empty", ix.scores("zzzz") == [])
f = rs.rrf({"bm25": ["a", "b", "c"], "dense": ["c", "a"]})
check("rrf order", [e["id"] for e in f] == ["a", "c", "b"])
check("rrf score k=60", abs(f[0]["rrf"] - round(1/61 + 1/62, 6)) < 1e-9 and f[0]["ranks"] == {"bm25": 1, "dense": 2})
check("rrf duplicate counts once at best rank", rs.rrf({"x": ["a", "a"]})[0]["rrf"] == round(1/61, 6))
check("rrf tie broken by id", [e["id"] for e in rs.rrf({"x": ["b"], "y": ["a"]})] == ["a", "b"])
ok, bad = rs.Leg("bm25", "t").done(["a"]), rs.Leg("dense", "t").fail("pending: x")
env = rs.envelope("q", [ok, bad], {"a": {"title": "A"}}, {"name": "t"})
check("envelope shape", env["standard"] == "ragesearch/1" and env["complete"] is False and env["legs"]["dense"]["error"] == "pending: x"
      and env["results"][0]["ranks"] == {"bm25": 1} and env["fusion"] == {"method": "rrf", "k": 60})
check("chunk_words: mindX shape", [len(c.split()) for c in rs.chunk_words("w " * 450, 200)] == [200, 200, 50] and rs.chunk_words("x " * 20, 200) == [])
print(f"\n{'PASS' if not fails else 'FAIL'} ragesearch {rs.VERSION} at {path}")
sys.exit(1 if fails else 0)
