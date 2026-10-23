=== RAGE ===
Contributors: professorcodephreak
Tags: search, semantic search, vector search, bm25, menu
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.2
Stable tag: 1.5.5
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

RAGE and the ragebar, complete: the "rage" menu and the immersive ragebar — words and meaning at once, fused by rank.

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

= The ragebar (immersive) =

The header search, the [ragebar] field, or the "/" key open a full-screen RAGE field, adapted from Professor
Codephreak's ultimate-input-field (as browseML uses it):

* **RAGE is a mode** in the field's row of buttons (RAGE · atlas). **T** opens the control panel, which in RAGE mode
  is the RAGE panel: legs (words · meaning · atlas · wordpress · persona), corpus (articles · RAGE's own ·
  DeltaVerse · all), k, live diagnostics from the search service, STOP and CLEAR.
* **❏** spawns the current results as a response window you can move; **⌂** calls every window home.
* **Personas** roll in under the field like a rolodex: RAGE, mindX, bankML, Jaimla and Savante are built in; drop any
  .persona on the field and it rolls in beside them. The chosen persona adds a leg: its beliefs, skills and
  exchanges, searched in the visitor's browser. A dropped file is never uploaded.
* The bar shows the DeltaVerse substrate count, read live.
* 👁 turns the camera on and opens the camera.control.panel; 👂 turns the microphone on and opens the
  audio.control.panel; ⇄ opens networking.tools. Nothing turns on except by its own button.
* Commands in the field: :legs, :corpus, :k, :spawn, :clear, :panel, :help.

"classic" keeps the small ragebar over WordPress search; "off" leaves the theme's search alone.

== Installation ==

1. Plugins → Add New → Upload Plugin → choose `rage.zip` → Install → Activate.
2. Settings → RAGE: the rage menu on or off and how it opens (atlas or ragebar), the ragebar (immersive, classic
   or off), the search service (any ragesearch/1 service over https; empty = WordPress search alone), the atlas URL.
3. Open your site: the first header item is now **rage**.

If your site already runs the rage menu as a Custom HTML widget, the menu loads once whichever is present.

== Changelog ==

= 1.5.5 =
* The clear backdrop's scrolling stage takes the pointer inline as well as in the stylesheet, so a page still holding an older stylesheet from its cache scrolls too.

= 1.5.4 =
* Clear backdrop: the results scroll natively, so the scrollbar can be grabbed and dragged; a press on the empty area reaches the ground beneath (its stars, the page's links) and never closes the field.

= 1.5.3 =
* Clear backdrop: the wheel or a touch drag that lands on the ground while the field is open scrolls the results (it used to zoom the ground, or do nothing, anywhere off a card).

= 1.5.2 =
* RAGEBAR.stay = true (a page that is the search itself): results, read → and Enter open the article in a new tab, so the search and its ground stay where they are.

= 1.5.1 =
* atlas on a page without the rage menu (a substrate such as deltaverse.pythai.net/rage) walks every article in the field, newest first, instead of leaving for the site's front page. RAGEBAR.wordpress = false (a host without WordPress) drops the wordpress leg, so no question waits on a missing /wp-json.

= 1.5.0 =
* Jaimla's faice: drag 👁 or 👂 out of the row (mouse or touch) and drop it on Jaimla's faice, ollywoo's BASIC FAICE whose organs are the devices. Her eyes become the camera (the live picture is the iris), her ears swell with what the microphone hears, and her mouth is the waveform of the voice speaking the answer in Jaimla's voice. Click an eye or an ear for its control panel; drag the globe to turn it. Also opened from the ◉ on Jaimla's card, its own eyes / ears buttons, or :face. three.js and faice.js load only when the faice is opened; nothing leaves the browser.

= 1.4.0 =
* Article results respond as the rage menu's top pick does: they open in place (excerpt, LISTEN voices, read, kindred, its thread, tags, converge) and spawn further articles; one trail shared with the menu. Enter opens the first article, Enter again reads it.

= 1.3.0 =
* 👁 the camera.control.panel (preview, camera choice, mirror, ollywoo's faicey face toolkit), 👂 the audio.control.panel (microphone choice, scope, dictation, voaicey speaking the answer in the persona's voice), ⇄ networking.tools (every service RAGE uses, timed). Each turns on only by its own button; closing the field turns them off.

= 1.2.1 =
* The immersive ragebar announces every answer as a dv:rage event, so a DeltaVerse substrate (rage-substrate.js) can draw it.

= 1.2.0 =
* RAGE and the ragebar as one plugin: the immersive ragebar (modes, control panel, response windows, persona
  rolodex, DeltaVerse corpus and substrate count), the classic ragebar as an option, the [ragebar] shortcode.

= 1.1.0 =
* Two modes, atlas and ragebar, remembered per visitor. RAGE search (ragesearch/1): BM25, atlas, vector search
  and WordPress search, fused by rank; every method reports itself.
