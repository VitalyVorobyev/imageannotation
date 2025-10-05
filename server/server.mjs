import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { cwd } from 'node:process';

const defaultStaticDir = resolve(cwd(), process.env.STATIC_DIR || 'dist');
const staticDir = defaultStaticDir;
const port = Number(process.env.PORT || 8080);
const indexDocument = process.env.INDEX_DOCUMENT || 'index.html';

const contentTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.map', 'application/json; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.gif', 'image/gif'],
    ['.ico', 'image/x-icon'],
    ['.txt', 'text/plain; charset=utf-8'],
    ['.wasm', 'application/wasm'],
    ['.webp', 'image/webp'],
    ['.avif', 'image/avif']
]);

const ok = JSON.stringify({ status: 'ok' });

const server = createServer(async (req, res) => {
    if (!req.url) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Bad Request');
        return;
    }

    const method = req.method ?? 'GET';

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        if (method !== 'HEAD') {
            res.end(ok);
        } else {
            res.end();
        }
        return;
    }

    if (!['GET', 'HEAD'].includes(method)) {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
        res.end('Method Not Allowed');
        return;
    }

    const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
    const normalizedPath = normalize(decodedUrl).replace(/^\/+/, '');
    let filePath = resolve(staticDir, normalizedPath);

    if (!filePath.startsWith(staticDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    try {
        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
            filePath = join(filePath, indexDocument);
            await access(filePath);
        }
    } catch (error) {
        filePath = join(staticDir, indexDocument);
        try {
            await access(filePath);
        } catch (innerError) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = contentTypes.get(ext) ?? 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });

    if (method === 'HEAD') {
        res.end();
        return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', () => {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
    });
    stream.pipe(res);
});

server.listen(port, () => {
    console.log(`Static server listening on port ${port}`);
});
