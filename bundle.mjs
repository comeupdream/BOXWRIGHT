/* Inline the site into a single self-contained page.
 *
 *   node bundle.mjs            -> dist/boxwright.html   (Artifact-shaped: no
 *                                 <html>/<head>/<body> wrapper, styles and
 *                                 scripts inlined, Google Fonts left external)
 *   node bundle.mjs --full     -> dist/boxwright-full.html (a complete, openable
 *                                 standalone HTML document)
 *
 * The source of truth stays index.html / styles.css / catalog.js / app.js —
 * this only ever assembles them, so the bundle cannot drift from the site.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

const html = read('index.html');
const css = read('styles.css');
const catalog = read('catalog.js');
const app = read('app.js');

const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'Boxwright Co.'])[1];
const fontLinks = (html.match(/<link rel="preconnect"[\s\S]*?fonts\.googleapis\.com\/css2[^>]*>/) || [''])[0];

let body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
body = body.replace(/\s*<script src="(catalog|app)\.js"><\/script>/g, '');

const inlined = [
  `<title>${title}</title>`,
  fontLinks,
  `<style>\n${css}\n</style>`,
  body.trim(),
  `<script>\n${catalog}\n</script>`,
  `<script>\n${app}\n</script>`,
].join('\n');

mkdirSync(join(here, 'dist'), { recursive: true });

if (process.argv.includes('--full')) {
  const doc = `<!doctype html>\n<html lang="en" data-theme="signature">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="color-scheme" content="light dark">\n${inlined.slice(0, inlined.indexOf('<a class="skip"'))}\n</head>\n<body style="margin:0">\n${inlined.slice(inlined.indexOf('<a class="skip"'))}\n</body>\n</html>\n`;
  writeFileSync(join(here, 'dist/boxwright-full.html'), doc);
  console.log('dist/boxwright-full.html', doc.length, 'bytes');
} else {
  writeFileSync(join(here, 'dist/boxwright.html'), inlined);
  console.log('dist/boxwright.html', inlined.length, 'bytes');
}
