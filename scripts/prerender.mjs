// Post-build prerender for the SPA. Boots a static server on `dist/`,
// loads `/` in headless Chromium, waits for the React mount to complete
// (signalled by `<html data-rendered="1">` set in src/main.tsx), and
// writes the captured HTML back to dist/index.html. Crawlers and link
// previewers (Discord, Twitter, Slack) will see real content instead of
// an empty <div id="root">, while the existing client bundle still
// boots and replaces the DOM with the live React tree on first paint.

import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');
const indexPath = resolve(distDir, 'index.html');

// SPA fallback so deep paths still resolve to index.html, mirroring the
// production nginx `try_files` rule.
const serve = sirv(distDir, { single: true, dev: false, etag: false });
const server = createServer((req, res) => serve(req, res, () => {}));

const port = await new Promise((res, rej) => {
  server.once('error', rej);
  server.listen(0, '127.0.0.1', () => res(server.address().port));
});

console.log(`[prerender] static server on http://127.0.0.1:${port}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  // Forward console errors so build output flags any runtime breakage
  // that prerender alone would have swallowed.
  page.on('pageerror', (err) => console.error('[prerender] pageerror:', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[prerender] console.error:', msg.text());
  });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.rendered === '1', {
    timeout: 15000,
  });

  // Strip the theme class + render marker so the inline theme bootstrap
  // in <head> wins on the user's browser (otherwise dark-theme users
  // would flash whatever class the headless browser captured).
  const html = await page.evaluate(() => {
    document.documentElement.classList.remove('dark', 'light');
    delete document.documentElement.dataset.rendered;
    return '<!doctype html>\n' + document.documentElement.outerHTML;
  });

  await writeFile(indexPath, html, 'utf8');
  const original = await readFile(indexPath, 'utf8');
  console.log(`[prerender] wrote ${indexPath} (${original.length} bytes)`);
} finally {
  await browser.close();
  server.close();
}
