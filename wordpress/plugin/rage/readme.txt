=== RAGE ===
Contributors: professorcodephreak
Tags: search, semantic search, vector search, bm25, menu
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.2
Stable tag: 1.1.0
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

The "rage" menu: walk your site's atlas, or search it with RAGE — words and meaning at once, fused by rank.

== Description ==

RAGE adds one item to the start of your header menu, **rage**. It opens a panel with two modes. The visitor's
choice is remembered in their own browser.

* **atlas** (the default): travel by a word through your site's atlas, then the full text from WordPress's own
  search. Every article you open is kept on a trail; its tags are collected; kindred articles, its thread and
  "converge" spawn from it.
* **ragebar**: the same box asks a RAGE search service. Several retrieval methods answer at once: BM25 over every
  article's full text, the atlas phrase, and vector search by meaning. Your browser fuses them with WordPress's
  own search by reciprocal rank fusion (k = 60). Each method says whether it worked and how long it took. A slow
  one (meaning, while it embeds the words) says so, and its ranking folds in when it arrives.

This is the menu that runs on [rage.pythai.net](https://rage.pythai.net). The search follows the RAGE search
standard, [RAGESEARCH.md](https://github.com/GATERAGE/ragebar/blob/main/RAGESEARCH.md).

= What it sends =

In atlas mode, only a request for the atlas file. In ragebar mode, the words the visitor types, to the search
service you set, and nothing else. No cookies, no account, no tracking.

== Installation ==

1. Plugins → Add New → Upload Plugin → choose `rage.zip` → Install → Activate.
2. Settings → RAGE: choose how the panel opens (atlas or ragebar), the search service (any ragesearch/1 service
   over https; leave empty for WordPress search alone) and the atlas URL.
3. Open your site: the first header item is now **rage**.

If your site already runs the rage menu as a Custom HTML widget, the menu loads once whichever is present.

== Changelog ==

= 1.1.0 =
* Two modes, atlas and ragebar, remembered per visitor. RAGE search (ragesearch/1): BM25, atlas, vector search
  and WordPress search, fused by rank; every method reports itself.
