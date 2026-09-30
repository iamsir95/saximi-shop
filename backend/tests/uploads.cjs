const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const sharp = require('sharp');
const { mountUploads } = require('../dist/uploads.js');

test('image upload checks permissions and file contents, persists a public optimized image', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saximi-upload-test-'));
  const app = express(); app.use(express.json({ limit: '8mb' }));
  const assets = [];
  mountUploads(app, (req, res, next) => { if (!req.headers.authorization) return res.sendStatus(401); req.admin = { role: req.headers.authorization }; next(); }, (url, title) => assets.push({ url, title }), dir);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const png = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#EF6A8C' } }).png().toBuffer();
  const data = `data:image/png;base64,${png.toString('base64')}`;
  const send = (data, role = 'SUPER_ADMIN') => fetch(`${base}/api/admin/uploads`, { method: 'POST', headers: { Authorization: role, 'Content-Type': 'application/json' }, body: JSON.stringify({ data, name: '../../test.png' }) });
  try {
    assert.equal((await send(data, '')).status, 401);
    assert.equal((await send(data, 'CUSTOMER')).status, 403);
    assert.equal((await send('data:image/svg+xml;base64,PHN2Zz4=')).status, 400);
    assert.equal((await send('data:image/png;base64,aW52YWxpZA==')).status, 400);
    assert.equal((await send(`data:image/png;base64,${Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64')}`)).status, 413);
    const response = await send(data); assert.equal(response.status, 201);
    const { url } = await response.json(); assert.match(url, /^\/api\/uploads\/[a-f0-9-]+\.webp$/);
    const image = await fetch(base + url); assert.equal(image.status, 200); assert.match(image.headers.get('content-type'), /image\/webp/);
    const meta = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
    assert.equal(meta.width, 1920); assert.equal(meta.height, 960); assert.equal(meta.exif, undefined);
    assert.equal(assets.length, 1); assert.equal(fs.readdirSync(dir).length, 1);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
});
