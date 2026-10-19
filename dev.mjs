// Local dev server for site/: serves the files and reloads the browser when one changes.
// No dependencies. Usage: npm run dev  (PORT=8080 by default)

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const ROOT = resolve('site');
// drafts/ is never deployed, but the dev server shows it at /drafts/
const DRAFTS = resolve('drafts');
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
};

const RELOAD = `<script>
new EventSource('/__reload').addEventListener('change', () => location.reload());
</script>`;

const clients = new Set();

async function resolveFile(urlPath) {
  let clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  let base = ROOT;
  if (clean === 'drafts' || clean.startsWith('drafts' + sep)) {
    base = DRAFTS;
    clean = clean.slice('drafts'.length).replace(/^([/\\])+/, '');
  }
  let file = join(base, clean);
  if (file !== base && !file.startsWith(base + sep)) return null;
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const file = await resolveFile(req.url);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  }

  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  let body = await readFile(file);
  if (type.startsWith('text/html')) {
    body = body.toString().replace('</body>', `${RELOAD}\n</body>`);
  }
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
});

let timer = null;
function onChange(_event, name) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`changed: ${name ?? '(something)'}, reloading ${clients.size} tab(s)`);
    for (const c of clients) c.write('event: change\ndata: reload\n\n');
  }, 60);
}
watch(ROOT, { recursive: true }, onChange);
try { watch(DRAFTS, { recursive: true }, onChange); } catch { /* no drafts/ folder */ }

server.listen(PORT, () => {
  console.log(`abstrct.ca dev server: http://localhost:${PORT}  (serving ${ROOT}, live reload on)`);
});
