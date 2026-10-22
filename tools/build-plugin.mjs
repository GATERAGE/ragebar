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
const dir = join(root, 'wordpress/plugin');
const php = readFileSync(join(dir, 'rage/rage.php'), 'utf8');
const pv = (php.match(/define\('RAGE_MENU_VERSION', '([^']+)'\)/) || [])[1];
// [widget source, style id, script id, asset name]: the plugin carries exactly what the widgets run
const PARTS = [['rage-menu-widget.html', 'ragemap-css', 'ragemap-js', 'rage-menu'],
               ['ragebar-immersive.html', 'ragebar-immersive-css', 'ragebar-immersive-js', 'ragebar-immersive'],
               ['ragebar-widget.html', 'ragebar-css', 'ragebar-js', 'ragebar-classic']];
for (const [src, sid, jid, name] of PARTS) {
  const w = readFileSync(join(root, 'wordpress', src), 'utf8');
  const between = (open, close) => { const i = w.indexOf(open); if (i < 0) throw new Error(`${src}: missing ${open}`); return w.slice(i + open.length, w.indexOf(close, i)); };
  const head = `/* ${name} (RAGE plugin ${pv}) — built from GATERAGE/ragebar wordpress/${src} by tools/build-plugin.mjs. Edit the widget, not this file. */\n`;
  writeFileSync(join(dir, `rage/assets/${name}.css`), head + between(`<style id="${sid}">`, '</style>').trim() + '\n');
  writeFileSync(join(dir, `rage/assets/${name}.js`), head + between(`<script id="${jid}"`, '</script>').replace(/^[^>]*>/, '').trim() + '\n');
}
const ver = pv;
rmSync(join(dir, 'rage.zip'), { force: true });
execFileSync('zip', ['-qrX', 'rage.zip', 'rage', '-x', '*.DS_Store'], { cwd: dir });
const sha = createHash('sha256').update(readFileSync(join(dir, 'rage.zip'))).digest('hex');
writeFileSync(join(dir, 'rage.zip.sha256'), `${sha}  rage.zip\n`);
console.log(`rage ${ver}: assets built, rage.zip ${sha}`);
