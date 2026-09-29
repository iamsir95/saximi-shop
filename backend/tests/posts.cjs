const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { PostStore } = require('../dist/posts.js');
const { mountPostRoutes } = require('../dist/post-routes.js');

test('article lifecycle, pagination, sanitization, permissions and server SEO', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saximi-post-tests-'));
  const store = new PostStore(path.join(dir, 'posts.json'));
  const app = express(); app.use(express.json());
  app.get('/shell', (_req, res) => res.send('<html><head><title>Shop</title></head><body><div id="app"></div></body></html>'));
  mountPostRoutes(app, (req, res, next) => {
    if (!req.headers.authorization) return res.sendStatus(401);
    req.admin = { role: req.headers.authorization }; next();
  }, () => 'https://hpn.saximi.com.vn', store);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.POST_APP_SHELL_URL = `${base}/shell`;
  const payload = { title: 'Thông tin cần biết', content: '<h2>Thông tin</h2><p>Nội dung</p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Link</a>', category: 'news', status: 'draft', seoTitle: 'Tiêu đề SEO' };
  const save = (body, role = 'SUPER_ADMIN', id) => fetch(`${base}/api/admin/posts${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: { Authorization: role, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(`${base}/api/admin/posts`)).status, 401);
    assert.equal((await save(payload, 'CUSTOMER')).status, 403);
    const draftResponse = await save(payload); assert.equal(draftResponse.status, 201);
    const draft = await draftResponse.json();
    assert.equal(draft.slug, 'thong-tin-can-biet'); assert.equal(draft.publishedAt, null);
    assert.doesNotMatch(draft.content, /script|onerror|javascript:/);
    assert.equal((await fetch(`${base}/api/posts/${draft.slug}`)).status, 404);
    assert.equal((await (await fetch(`${base}/api/posts`)).json()).items.length, 0);
    assert.equal((await save(payload)).status, 409);
    assert.equal((await save({ ...payload, category: 'invalid' })).status, 409);
    assert.equal((await save({ ...payload, slug: 'invalid', category: 'invalid' })).status, 400);
    const published = await (await save({ ...draft, status: 'published' }, 'SUPER_ADMIN', draft.id)).json();
    assert.ok(published.publishedAt);
    for (let i = 0; i < 18; i++) store.save({ ...payload, title: `Bài ${i}`, status: 'published', category: i % 2 ? 'event' : 'news' });
    const found = []; let cursor;
    do {
      const page = store.list({ limit: '5', cursor }); found.push(...page.items.map(p => p.id)); cursor = page.nextCursor;
      assert.ok(page.items.every(p => !('content' in p)));
    } while (cursor);
    assert.equal(found.length, 19); assert.equal(new Set(found).size, 19);
    assert.ok(store.list({ category: 'event' }).items.every(p => p.category === 'event'));
    assert.equal(store.list({ q: 'Thông tin cần biết' }).items.length, 1);
    assert.equal(store.list({ ids: published.id }).items.length, 1);
    assert.equal(store.list({ ids: '' }).items.length, 0);
    assert.throws(() => store.list({ cursor: 'invalid' }));
    assert.equal(new PostStore(path.join(dir, 'posts.json')).all().length, 19);
    const htmlResponse = await fetch(`${base}/news/${published.slug}`);
    assert.equal(htmlResponse.status, 200); const html = await htmlResponse.text();
    assert.match(html, /<title>Tiêu đề SEO<\/title>/); assert.match(html, /application\/ld\+json/); assert.match(html, /<h2>Thông tin<\/h2>/); assert.match(html, /rel="canonical"/);
    assert.equal((await fetch(`${base}/news/missing`)).status, 404);
    assert.match(await (await fetch(`${base}/sitemap.xml`)).text(), /thong-tin-can-biet/);
    store.save({ ...published, status: 'archived' }, published.id);
    assert.equal((await fetch(`${base}/api/posts/${published.slug}`)).status, 404);
    assert.doesNotMatch(await (await fetch(`${base}/sitemap.xml`)).text(), /thong-tin-can-biet/);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
});
