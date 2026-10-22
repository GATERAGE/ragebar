#!/usr/bin/env node
// Build the RAGE WordPress plugin's assets from the one source, wordpress/rage-menu-widget.html, so the widget
// rage.pythai.net runs and the plugin anyone can install are the same code. Then zip it with its sha256.
//   node tools/build-plugin.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const w = readFileSync(join(root, 'wordpress/rage-menu-widget.html'), 'utf8');
const between = (open, close) => { const i = w.indexOf(open); if (i < 0) throw new Error('missing ' + open); return w.slice(i + open.length, w.indexOf(close, i)); };
const css = between('<style id="ragemap-css">', '</style>').trim() + '\n';
const js = between('<script id="ragemap-js">', '</script>').trim() + '\n';
const ver = (js.match(/VERSION='([^']+)'/) || [])[1];
const head = `/* RAGE menu ${ver} — built from GATERAGE/ragebar wordpress/rage-menu-widget.html by tools/build-plugin.mjs. Edit the widget, not this file. */\n`;
const dir = join(root, 'wordpress/plugin');
writeFileSync(join(dir, 'rage/assets/rage-menu.css'), head + css);
writeFileSync(join(dir, 'rage/assets/rage-menu.js'), head + js);
const php = readFileSync(join(dir, 'rage/rage.php'), 'utf8');
const pv = (php.match(/define\('RAGE_MENU_VERSION', '([^']+)'\)/) || [])[1];
if (pv !== ver) throw new Error(`rage.php says ${pv}, the widget says ${ver}: bump both`);
rmSync(join(dir, 'rage.zip'), { force: true });
execFileSync('zip', ['-qrX', 'rage.zip', 'rage', '-x', '*.DS_Store'], { cwd: dir });
const sha = createHash('sha256').update(readFileSync(join(dir, 'rage.zip'))).digest('hex');
writeFileSync(join(dir, 'rage.zip.sha256'), `${sha}  rage.zip\n`);
console.log(`rage ${ver}: assets built, rage.zip ${sha}`);
