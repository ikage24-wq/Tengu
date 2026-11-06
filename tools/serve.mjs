// Serves the game for `npm start`: http://localhost:8000 (a port argument or PORT= changes it).
// It works like `python3 -m http.server` (index.html for a folder, a listing when there's none,
// 404s), but every reply says `Cache-Control: no-cache`, so the browser checks each file is
// current before using its copy. Without that, a returning player's browser can keep an old module
// next to a new one that imports a name the old one lacks, and the game starts blank ("does not
// provide an export named ..."). Unchanged files still come back as quick 304s. No packages; the
// desktop app reads its files from disk and doesn't use this.
// Usage: node tools/serve.mjs [port] [-b address] [-d folder]   (the folder defaults to the repo)
import { createServer } from 'node:http';
import { createReadStream, realpathSync } from 'node:fs';
import { stat, readdir } from 'node:fs/promises';
import { join, extname, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.py': 'text/x-python; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
};

export const typeOf = (file) => TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (title, body) =>
  `<!DOCTYPE HTML>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${esc(title)}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

// The server for one folder (not yet listening). `log` gets a line for every error reply.
export function serve(root, { log = () => {} } = {}) {
  root = resolve(root);
  return createServer(async (req, res) => {
    const send = (code, headers, body) => {
      res.writeHead(code, { 'Cache-Control': 'no-cache', ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
      if (code >= 400) log(`${code} ${req.method} ${req.url}`);
    };
    const fail = (code, message) => {
      const body = page('Error response', `<h1>Error response</h1>\n<p>Error code: ${code}</p>\n<p>Message: ${esc(message)}.</p>`);
      send(code, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }, body);
    };
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return fail(501, `Unsupported method (${req.method})`);
      const [rawPath, query] = req.url.split('#')[0].split(/\?(.*)/s);
      let name;
      try { name = decodeURIComponent(rawPath); } catch { return fail(400, 'Bad request path'); }
      if (name.includes('\0')) return fail(400, 'Bad request path');
      const rel = posix.normalize('/' + name); // '..' can't climb above the root
      const full = join(root, rel);
      if (full !== root && !full.startsWith(root + sep)) return fail(404, 'File not found');
      let file = full;
      let info = await stat(file).catch(() => null);
      if (!info) return fail(404, 'File not found');
      if (info.isDirectory()) {
        const href = rel.split('/').map(encodeURIComponent).join('/').replace(/\/?$/, '/');
        if (!rawPath.endsWith('/')) {
          return send(301, { Location: href + (query !== undefined ? '?' + query : ''), 'Content-Length': 0 });
        }
        for (const index of ['index.html', 'index.htm']) {
          const st = await stat(join(full, index)).catch(() => null);
          if (st?.isFile()) { file = join(full, index); info = st; break; }
        }
        if (file === full) {
          const entries = await readdir(full, { withFileTypes: true });
          entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
          const items = entries.map((e) => {
            const shown = e.name + (e.isDirectory() ? '/' : '');
            return `<li><a href="${esc(encodeURIComponent(e.name) + (e.isDirectory() ? '/' : ''))}">${esc(shown)}</a></li>`;
          });
          const title = `Directory listing for ${rel.replace(/\/?$/, '/')}`;
          const body = page(title, `<h1>${esc(title)}</h1>\n<hr>\n<ul>\n${items.join('\n')}\n</ul>\n<hr>`);
          return send(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }, body);
        }
      }
      if (!info.isFile()) return fail(404, 'File not found');
      const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
      const headers = { 'Content-Type': typeOf(file), 'Last-Modified': info.mtime.toUTCString(), ETag: etag };
      const tags = req.headers['if-none-match'];
      const since = Date.parse(req.headers['if-modified-since'] ?? '');
      const fresh = tags !== undefined
        ? tags.split(',').some((t) => { t = t.trim(); return t === '*' || t.replace(/^W\//, '') === etag.slice(2); })
        : since >= Math.floor(info.mtimeMs / 1000) * 1000;
      if (fresh) return send(304, headers);
      res.writeHead(200, { 'Cache-Control': 'no-cache', ...headers, 'Content-Length': info.size });
      if (req.method === 'HEAD') return res.end();
      createReadStream(file)
        .on('error', () => res.destroy())
        .pipe(res);
    } catch (e) {
      if (res.headersSent) res.destroy();
      else fail(500, e?.code ?? 'Server error');
    }
  });
}

function args(argv) {
  const opts = { port: process.env.PORT || 8000, host: undefined, dir: fileURLToPath(new URL('..', import.meta.url)) };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-b' || a === '--bind') opts.host = argv[++i];
    else if (a === '-d' || a === '--directory') opts.dir = argv[++i];
    else if (/^\d+$/.test(a)) opts.port = a;
    else throw new Error(`Unknown option ${a}. Usage: node tools/serve.mjs [port] [-b address] [-d folder]`);
  }
  opts.port = Number(opts.port);
  if (!Number.isInteger(opts.port) || opts.port < 0 || opts.port > 65535) throw new Error(`Bad port ${opts.port}`);
  return opts;
}

const isMain = () => { try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } };

if (isMain()) {
  let opts;
  try { opts = args(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  const server = serve(opts.dir, { log: (line) => console.error(line) });
  server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE'
      ? `Port ${opts.port} is already in use (is the game already being served?). Try another: PORT=${opts.port + 1} npm start`
      : `Couldn't start the server: ${e.message}`);
    process.exit(1);
  });
  server.listen(opts.port, opts.host, () => {
    const { port } = server.address();
    console.log(`Serving ${opts.dir} at http://localhost:${port}/ (Ctrl+C to stop)`);
  });
}
