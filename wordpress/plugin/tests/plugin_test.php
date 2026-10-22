<?php
// Enough of WordPress to exercise the plugin's decisions. Run from wordpress/plugin/:
//   docker run --rm -v "$PWD:/w:ro" -w /w php:8.3-cli php tests/plugin_test.php
define('ABSPATH', '/wp/');
$GLOBALS['T'] = ['option' => [], 'enq' => [], 'inline' => [], 'actions' => []];
function get_option($k, $d = false) { return $GLOBALS['T']['option'][$k] ?? $d; }
function wp_parse_args($a, $d) { return array_merge($d, is_array($a) ? $a : []); }
function esc_url_raw($u) { return filter_var($u, FILTER_SANITIZE_URL); }
function wp_parse_url($u, $c = -1) { return parse_url($u, $c); }
function untrailingslashit($s) { return rtrim($s, '/'); }
function add_action($h, $f) { $GLOBALS['T']['actions'][$h] = $f; }
function add_filter() {} function register_setting() {} function add_options_page() {}
function plugin_basename($f) { return 'rage/rage.php'; }
function plugin_dir_url($f) { return 'https://site.example/wp-content/plugins/rage/'; }
function wp_enqueue_style($h, $src, $d, $v) { $GLOBALS['T']['enq'][] = [$h, $src, $v]; }
function wp_enqueue_script($h, $src, $d, $v, $f) { $GLOBALS['T']['enq'][] = [$h, $src, $v, $f]; }
function wp_add_inline_script($h, $js, $pos) { $GLOBALS['T']['inline'][] = [$h, $js, $pos]; }
function wp_json_encode($v) { return json_encode($v, JSON_UNESCAPED_SLASHES); }
function add_shortcode($t, $f) { $GLOBALS['T']['shortcodes'][$t] = $f; }
function shortcode_atts($pairs, $atts, $tag = '') { return array_merge($pairs, is_array($atts) ? $atts : []); }
function esc_attr($s) { return htmlspecialchars((string) $s, ENT_QUOTES); }
require '/w/rage/rage.php';

$fail = 0;
function is_it($label, $got, $want) {
    global $fail; $ok = $got === $want; if (!$ok) { $fail++; }
    printf("%-4s %-56s got=%s%s\n", $ok ? 'PASS' : 'FAIL', $label, json_encode($got, JSON_UNESCAPED_SLASHES), $ok ? '' : '  want=' . json_encode($want, JSON_UNESCAPED_SLASHES));
}
$c = rage_menu_config();
is_it('defaults: opens in atlas (the menu as it was)', $c['mode'], 'atlas');
is_it('defaults: the rage.pythai.net search service', $c['search'], 'https://deltaverse.pythai.net/ragesearch');
is_it('defaults: the rage atlas', $c['atlas'], 'https://deltaverse.pythai.net/audio/atlas.json');
is_it('version passed to the script', $c['version'], RAGE_MENU_VERSION);

$GLOBALS['T']['option']['rage_menu_settings'] = ['mode' => 'ragebar', 'search' => 'https://rage.example/ragesearch/', 'atlas' => 'https://rage.example/atlas.json'];
$c = rage_menu_config();
is_it('mode ragebar kept', $c['mode'], 'ragebar');
is_it('trailing slash trimmed from the service', $c['search'], 'https://rage.example/ragesearch');
is_it('custom atlas kept', $c['atlas'], 'https://rage.example/atlas.json');

$GLOBALS['T']['option']['rage_menu_settings'] = ['mode' => 'evil', 'search' => 'http://plain.example/s', 'atlas' => 'javascript:alert(1)'];
$c = rage_menu_config();
is_it('unknown mode falls back to atlas', $c['mode'], 'atlas');
is_it('a non-https service is dropped, not half-trusted', $c['search'], '');
is_it('a bad atlas falls back to the default', $c['atlas'], 'https://deltaverse.pythai.net/audio/atlas.json');

$GLOBALS['T']['option']['rage_menu_settings'] = ['search' => ''];
is_it('an empty service means WordPress search alone', rage_menu_config()['search'], '');
$GLOBALS['T']['option']['rage_menu_settings'] = 'garbage';
is_it('a non-array option reads as the defaults', rage_menu_config()['mode'], 'atlas');

$GLOBALS['T']['option'] = [];
rage_menu_enqueue();
is_it('style enqueued, versioned', $GLOBALS['T']['enq'][0], ['rage-menu', 'https://site.example/wp-content/plugins/rage/assets/rage-menu.css', RAGE_MENU_VERSION]);
is_it('the immersive ragebar by default', array_column($GLOBALS['T']['enq'], 0), ['rage-menu', 'rage-menu', 'ragebar-immersive', 'ragebar-immersive']);
is_it('the ragebar gets the search service', $GLOBALS['T']['inline'][1][1], 'window.RAGEBAR={"search":"https://deltaverse.pythai.net/ragesearch"};');
is_it('script in the footer, versioned', $GLOBALS['T']['enq'][1], ['rage-menu', 'https://site.example/wp-content/plugins/rage/assets/rage-menu.js', RAGE_MENU_VERSION, true]);
is_it('config inlined before the script', [$GLOBALS['T']['inline'][0][0], $GLOBALS['T']['inline'][0][2], strpos($GLOBALS['T']['inline'][0][1], 'window.RAGE_MENU={"mode":"atlas"') === 0], ['rage-menu', 'before', true]);
$GLOBALS['T']['enq'] = []; $GLOBALS['T']['option']['rage_menu_settings'] = ['menu' => 0, 'ragebar' => 'classic'];
rage_menu_enqueue();
is_it('menu off, classic ragebar', array_column($GLOBALS['T']['enq'], 0), ['ragebar-classic', 'ragebar-classic']);
$GLOBALS['T']['enq'] = []; $GLOBALS['T']['option']['rage_menu_settings'] = ['ragebar' => 'off', 'menu' => 0];
rage_menu_enqueue();
is_it('both off: nothing loads', $GLOBALS['T']['enq'], []);
$GLOBALS['T']['option']['rage_menu_settings'] = ['ragebar' => 'evil'];
is_it('an unknown ragebar falls back to immersive', rage_menu_opts()['ragebar'], 'immersive');
$GLOBALS['T']['option'] = [];
is_it('[ragebar] prints the field the ragebar opens from', strpos(call_user_func($GLOBALS['T']['shortcodes']['ragebar'], []), 'id="ragebar-input"') !== false, true);
is_it('hooked to wp_enqueue_scripts', $GLOBALS['T']['actions']['wp_enqueue_scripts'] ?? null, 'rage_menu_enqueue');
$js = file_get_contents('/w/rage/assets/rage-menu.js');
is_it('built menu carries its build stamp', strpos($js, 'RAGE plugin ' . RAGE_MENU_VERSION) !== false, true);
foreach (['ragebar-immersive', 'ragebar-classic'] as $a) {
    is_it("built $a.js and .css present", is_file("/w/rage/assets/$a.js") && is_file("/w/rage/assets/$a.css"), true);
}
is_it('the immersive ragebar guards against loading twice', strpos(file_get_contents('/w/rage/assets/ragebar-immersive.js'), 'if(window.__ragebarImmersive) return;') !== false, true);
is_it('built script guards against loading twice (widget + plugin)', strpos($js, 'if(window.__ragemap) return;') !== false, true);
printf("\n%s %d checks failed\n", $fail ? 'FAIL' : 'PASS', $fail);
exit($fail ? 1 : 0);
