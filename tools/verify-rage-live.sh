#!/bin/bash
# verify-rage-live.sh — read-only checks of rage.pythai.net after a widget deploy (curl only, no browser).
#   tools/verify-rage-live.sh [OUTDIR]
# Checks: which ragebar / atlas widget versions the page serves, that the header chooser is gone
# (the v2 atlas hides it once docked), and ragesearch: totals, first-8 ids and timings for the
# three benchmark queries (compare with rage-wp-backups/<stamp>/ragesearch.before.txt).
set -u
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
OUT=${1:-.}; mkdir -p "$OUT"
curl -s -A "$UA" -o "$OUT/home.after.html" -w 'home %{http_code} %{time_total}s %{size_download}B\n' https://rage.pythai.net/
grep -q 'ragebar atlas menu v2' "$OUT/home.after.html" && echo 'atlas: v2 (docked, no chooser)' || echo 'atlas: NOT v2'
grep -q 'ragebar widget v1.1' "$OUT/home.after.html" && echo 'ragebar: v1.1.x' || echo 'ragebar: NOT v1.1'
grep -q "nav.insertBefore(li,nav.firstChild)" "$OUT/home.after.html" && echo 'chooser: the old "rage" header button is still served' || echo 'chooser: gone'
for q in mindx RAGE deltaverse; do
  for run in 1 2 3; do
    curl -s -A "$UA" -D "$OUT/h" -o "$OUT/b" -w "%{http_code} %{time_total}" \
      "https://rage.pythai.net/wp-json/wp/v2/search?per_page=8&search=$q" > "$OUT/w"
    tot=$(grep -i '^x-wp-total:' "$OUT/h" | tr -d '\r' | awk '{print $2}')
    ids=$(python3 -c "import json,sys;print(','.join(str(r['id']) for r in json.load(open(sys.argv[1]))))" "$OUT/b" 2>/dev/null)
    echo "$q run$run $(cat "$OUT/w") total=$tot ids=$ids"
  done
done | tee "$OUT/ragesearch.after.txt"
rm -f "$OUT/h" "$OUT/b" "$OUT/w"
