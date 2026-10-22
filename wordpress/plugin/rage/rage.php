<?php
/**
 * Plugin Name:       RAGE
 * Plugin URI:        https://github.com/GATERAGE/ragebar
 * Description:       Adds the "rage" menu to your header: walk your site's atlas, or switch to the ragebar and search it with RAGE — words (BM25) and meaning (vector search) at once, fused by rank, each method saying whether it worked.
 * Version:           1.1.0
 * Requires at least: 5.8
 * Requires PHP:      7.2
 * Author:            Professor Codephreak
 * Author URI:        https://rage.pythai.net
 * License:           Apache-2.0
 * License URI:       https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain:       rage
 *
 * WHAT IT IS. The menu rage.pythai.net runs, as a plugin. Its first header item, "rage", opens a panel
 * with two modes, and the visitor's choice is remembered in their own browser:
 *
 *   atlas    travel by a word through the site's atlas (a JSON map of branches, paths and articles),
 *            then the full text from WordPress's own search. This is the default.
 *   ragebar  the same box asks a RAGE search service (the ragesearch/1 standard, RAGESEARCH.md):
 *            BM25 over every article's full text, the atlas phrase, and vector search by meaning,
 *            fused with WordPress's own search by reciprocal rank fusion (k = 60). Every method
 *            reports whether it worked and how long it took; a slow one says it is still working.
 *
 * WHY A PLUGIN AND NOT ONLY A WIDGET. rage.pythai.net runs the same code as a footer widget, which
 * needs nothing installed. A plugin can carry settings, loads its files the WordPress way (cached,
 * versioned) and can be installed on another site. Both are built from one file
 * (wordpress/rage-menu-widget.html in GATERAGE/ragebar), so they cannot drift; if both are present
 * the menu loads once.
 *
 * WHAT IT SENDS ANYWHERE. In atlas mode: nothing but a request for the atlas file you configured. In
 * ragebar mode: the words the visitor types, to the search service you configured, and nothing else.
 * No cookies, no account, no tracking. With no search service configured, ragebar mode uses
 * WordPress's own search alone and says so.
 */

if (!defined('ABSPATH')) {
    exit; // no direct access
}

define('RAGE_MENU_VERSION', '1.1.0');
define('RAGE_MENU_SEARCH_DEFAULT', 'https://deltaverse.pythai.net/ragesearch');
define('RAGE_MENU_ATLAS_DEFAULT', 'https://deltaverse.pythai.net/audio/atlas.json');

function rage_menu_defaults() {
    return array(
        'mode'   => 'atlas',                    // atlas | ragebar: how the panel opens until the visitor chooses
        'search' => RAGE_MENU_SEARCH_DEFAULT,   // a ragesearch/1 service; '' = WordPress search alone
        'atlas'  => RAGE_MENU_ATLAS_DEFAULT,    // the atlas JSON the menu walks
    );
}

/** An https URL without a trailing slash, or '' — anything else is dropped rather than half-trusted. */
function rage_menu_url($u) {
    $u = trim((string) $u);
    if ($u === '') {
        return '';
    }
    $u = esc_url_raw($u);
    return wp_parse_url($u, PHP_URL_SCHEME) === 'https' ? untrailingslashit($u) : '';
}

function rage_menu_sanitize($in) {
    $d = rage_menu_defaults();
    $in = is_array($in) ? $in : array();
    $out = array();
    $out['mode'] = (isset($in['mode']) && in_array($in['mode'], array('atlas', 'ragebar'), true)) ? $in['mode'] : $d['mode'];
    $out['search'] = array_key_exists('search', $in) ? rage_menu_url($in['search']) : $d['search'];
    $atlas = array_key_exists('atlas', $in) ? rage_menu_url($in['atlas']) : $d['atlas'];
    $out['atlas'] = $atlas !== '' ? $atlas : $d['atlas'];
    return $out;
}

function rage_menu_opts() {
    $o = get_option('rage_menu_settings', array());
    return rage_menu_sanitize(wp_parse_args(is_array($o) ? $o : array(), rage_menu_defaults()));
}

/** What the script reads as window.RAGE_MENU. An empty search turns the service leg off, not the mode. */
function rage_menu_config() {
    $o = rage_menu_opts();
    return array(
        'mode'    => $o['mode'],
        'search'  => $o['search'],
        'atlas'   => $o['atlas'],
        'version' => RAGE_MENU_VERSION,
    );
}

function rage_menu_enqueue() {
    $base = plugin_dir_url(__FILE__) . 'assets/';
    wp_enqueue_style('rage-menu', $base . 'rage-menu.css', array(), RAGE_MENU_VERSION);
    wp_enqueue_script('rage-menu', $base . 'rage-menu.js', array(), RAGE_MENU_VERSION, true);
    wp_add_inline_script('rage-menu', 'window.RAGE_MENU=' . wp_json_encode(rage_menu_config()) . ';', 'before');
}
add_action('wp_enqueue_scripts', 'rage_menu_enqueue');

/* ── Settings → RAGE ── */
function rage_menu_admin_init() {
    register_setting('rage_menu', 'rage_menu_settings', array('sanitize_callback' => 'rage_menu_sanitize'));
}
add_action('admin_init', 'rage_menu_admin_init');

function rage_menu_admin_menu() {
    add_options_page('RAGE', 'RAGE', 'manage_options', 'rage-menu', 'rage_menu_settings_page');
}
add_action('admin_menu', 'rage_menu_admin_menu');

function rage_menu_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $o = rage_menu_opts();
    $n = 'rage_menu_settings';
    echo '<div class="wrap"><h1>RAGE</h1>';
    echo '<p>The "rage" menu: walk the atlas, or search with RAGE — words and meaning, fused by rank. ';
    echo 'The visitor\'s own choice of mode is kept in their browser; this sets how it opens until they choose.</p>';
    echo '<form method="post" action="options.php">';
    settings_fields('rage_menu');
    echo '<table class="form-table" role="presentation">';
    echo '<tr><th scope="row">Opens in</th><td>';
    foreach (array('atlas' => 'atlas — travel by a word through the atlas', 'ragebar' => 'ragebar — search with RAGE') as $k => $label) {
        printf('<label><input type="radio" name="%s[mode]" value="%s" %s> %s</label><br>', esc_attr($n), esc_attr($k), checked($o['mode'], $k, false), esc_html($label));
    }
    echo '</td></tr>';
    printf('<tr><th scope="row"><label for="rage-search">Search service</label></th><td><input id="rage-search" class="regular-text code" type="url" name="%s[search]" value="%s"><p class="description">A ragesearch/1 service (https). Empty: WordPress search alone. Default: %s</p></td></tr>',
        esc_attr($n), esc_attr($o['search']), esc_html(RAGE_MENU_SEARCH_DEFAULT));
    printf('<tr><th scope="row"><label for="rage-atlas">Atlas</label></th><td><input id="rage-atlas" class="regular-text code" type="url" name="%s[atlas]" value="%s"><p class="description">The atlas JSON the menu walks (https). Default: %s</p></td></tr>',
        esc_attr($n), esc_attr($o['atlas']), esc_html(RAGE_MENU_ATLAS_DEFAULT));
    echo '</table>';
    submit_button();
    echo '</form><p>The standard: <a href="https://github.com/GATERAGE/ragebar/blob/main/RAGESEARCH.md">RAGESEARCH.md</a>.</p></div>';
}

function rage_menu_links($links) {
    array_unshift($links, '<a href="options-general.php?page=rage-menu">Settings</a>');
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'rage_menu_links');
