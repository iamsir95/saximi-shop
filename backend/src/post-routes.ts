import { Express, RequestHandler } from 'express';
import { PostStore, PostError, Post } from './posts.js';
import type { Coupon } from './db.js';

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const labels: Record<string, string> = { news: 'Thông tin cần biết', event: 'Sự kiện', promotion: 'Khuyến mãi', policy: 'Chính sách' };

export function mountPostRoutes(app: Express, authenticate: RequestHandler, siteUrl: () => string, store = new PostStore(), getCoupons: () => Coupon[] = () => []) {
  const vouchers = (post: { voucherIds?: number[] }) => (post.voucherIds || []).flatMap(id => {
    const c = getCoupons().find(coupon => coupon.id === id);
    if (!c) return [];
    const expiry = /^\d{4}-\d{2}-\d{2}$/.test(c.expiryDate) ? `${c.expiryDate}T23:59:59+07:00` : c.expiryDate;
    return [{ ...c, available: c.isActive && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) >= Date.now() }];
  });
  const savePost = (body: Record<string, unknown>, id?: string) => {
    if (Array.isArray(body?.voucherIds)) {
      const old = id ? store.all().find(p => p.id === id)?.voucherIds || [] : [];
      if (body.voucherIds.some(v => !getCoupons().some(c => c.id === v) && !old.includes(v))) throw new PostError('Voucher được chọn không tồn tại.');
    }
    return store.save(body, id);
  };
  const guard: RequestHandler = (req, res, next) => {
    if ((req as any).admin?.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Bạn không có quyền quản lý bài viết.' });
    next();
  };
  const handle = (fn: RequestHandler): RequestHandler => (req, res, next) => {
    try { fn(req, res, next); }
    catch (error) {
      if (error instanceof PostError) return res.status(error.status).json({ message: error.message });
      console.error('Post operation failed', error);
      res.status(500).json({ message: 'Chưa xử lý được bài viết. Vui lòng thử lại.' });
    }
  };
  app.get(['/posts', '/api/posts'], handle((req, res) => {
    const query = Object.fromEntries(['category', 'q', 'cursor', 'limit', 'ids'].map(key => [key, typeof req.query[key] === 'string' ? req.query[key] : undefined]));
    const page = store.list(query);
    res.json({ ...page, items: page.items.map(p => ({ ...p, vouchers: vouchers(p) })) });
  }));
  app.get(['/posts/:slug', '/api/posts/:slug'], handle((req, res) => {
    const post = store.all().find(p => p.slug === req.params.slug && p.status === 'published');
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại hoặc chưa được xuất bản.' });
    res.json({ ...post, vouchers: vouchers(post) });
  }));
  app.get('/api/admin/posts', authenticate, guard, handle((req, res) => {
    res.json(store.all(req.query.trash === 'true').filter(p => req.query.trash === 'true' ? Boolean(p.deletedAt) : true).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }));
  app.post('/api/admin/posts', authenticate, guard, handle((req, res) => { res.status(201).json(savePost(req.body)); }));
  app.put('/api/admin/posts/:id', authenticate, guard, handle((req, res) => { res.json(savePost(req.body, req.params.id)); }));
  app.delete('/api/admin/posts/:id', authenticate, guard, handle((req, res) => { store.trash(req.params.id); res.json({ success: true }); }));
  app.post('/api/admin/posts/:id/restore', authenticate, guard, handle((req, res) => { res.json(store.trash(req.params.id, true)); }));

  const origin = () => new URL(siteUrl()).origin;
  app.get('/sitemap.xml', handle((_req, res) => {
    const base = origin();
    const entries = [`<url><loc>${escape(base)}/news</loc></url>`, ...store.all().filter(p => p.status === 'published').map(p => `<url><loc>${escape(base)}/news/${p.slug}</loc><lastmod>${p.updatedAt}</lastmod></url>`)];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`);
  }));
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin()}/sitemap.xml\n`));

  // Serve the same app shell with article content and metadata before React starts.
  app.get(['/news', '/news/:slug'], async (req, res) => {
    try {
      const base = origin();
      const post = req.params.slug ? store.all().find(p => p.slug === req.params.slug && p.status === 'published') : undefined;
      const missing = Boolean(req.params.slug && !post);
      const category = typeof req.query.category === 'string' && labels[req.query.category] ? req.query.category : '';
      const title = missing ? 'Không tìm thấy bài viết' : post?.seoTitle || post?.title || `${category ? labels[category] : 'Bản tin'} | Saximi Shop`;
      const description = post?.seoDescription || post?.excerpt || 'Thông tin cần biết, sự kiện, khuyến mãi và chính sách từ Saximi Shop.';
      const canonical = `${base}/news${post ? `/${post.slug}` : category ? `?category=${category}` : ''}`;
      const list = store.list({ category: category || undefined, limit: '24' });
      const body = post
        ? `<article><h1>${escape(post.title)}</h1><p>${escape(post.author)} · <time datetime="${post.publishedAt}">${new Date(post.publishedAt!).toLocaleDateString('vi-VN')}</time></p>${post.cover ? `<img src="${escape(post.cover)}" alt="${escape(post.coverAlt)}">` : ''}${post.content}</article>`
        : `<h1>${escape(title)}</h1>${missing ? '<p>Bài viết không tồn tại hoặc đã được gỡ.</p>' : list.items.map(p => `<article><h2><a href="/news/${p.slug}">${escape(p.title)}</a></h2><time datetime="${p.publishedAt}">${new Date(p.publishedAt!).toLocaleDateString('vi-VN')}</time><p>${escape(p.excerpt)}</p></article>`).join('') || '<p>Chưa có bài viết.</p>'}`;
      const structured = post ? { '@context': 'https://schema.org', '@type': post.category === 'policy' ? 'WebPage' : 'Article', headline: post.title, description, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { '@type': 'Organization', name: post.author }, publisher: { '@type': 'Organization', name: 'Saximi Shop' }, url: canonical, ...(post.cover ? { image: new URL(post.cover, base).href } : {}) } : null;
      const metadata = `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:type" content="${post ? 'article' : 'website'}">${post?.cover ? `<meta property="og:image" content="${escape(new URL(post.cover, base).href)}">` : ''}${missing || req.query.q || req.query.cursor ? '<meta name="robots" content="noindex,follow">' : ''}${structured ? `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>` : ''}`;
      const response = await fetch(process.env.POST_APP_SHELL_URL || 'http://web/index.html', { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error('App shell unavailable');
      const shell = await response.text();
      const seoMetadata = metadata + (req.query.saved ? '<meta name="robots" content="noindex,follow">' : '');
      res.status(missing ? 404 : 200).type('html').set('Cache-Control', 'no-cache').send(shell.replace(/<title>[\s\S]*?<\/title>/, () => seoMetadata.replace(/<(meta|link|script) /g, '<$1 data-post-seo="true" ')).replace('<div id="app"></div>', () => `<div id="app"><main>${body}<a href="/news">Bản tin</a></main></div>`));
    } catch (error) {
      console.error('Article render failed', error);
      res.status(503).set('Retry-After', '30').type('html').send('<h1>Bản tin tạm thời chưa tải được</h1><p>Vui lòng thử lại sau.</p>');
    }
  });
}
