import { Express, RequestHandler } from 'express';
import { PostStore, PostError, Post } from './posts.js';
import type { Coupon, Product } from './db.js';
import { WebPushService } from './services/web-push.service.js';

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const labels: Record<string, string> = { news: 'Thông tin cần biết', event: 'Sự kiện', promotion: 'Khuyến mãi', policy: 'Chính sách' };
const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value: string, max: number) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  return `${sliced.slice(0, Math.max(0, sliced.lastIndexOf(' '))).trim()}…`;
};
const toAbsoluteUrl = (value: string | undefined, base: string) => value ? new URL(value, base).href : `${base}/icon.png`;
const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

function buildSeoMetadata(input: {
  title: string;
  description: string;
  canonical: string;
  type: 'website' | 'article' | 'product';
  image?: string;
  robots?: string;
  structured?: unknown;
}) {
  const imageMeta = input.image
    ? `<meta property="og:image" content="${escape(input.image)}"><meta property="og:image:secure_url" content="${escape(input.image)}"><meta property="og:image:alt" content="${escape(input.title)}"><meta name="twitter:image" content="${escape(input.image)}">`
    : '';
  return `<title>${escape(input.title)}</title><meta name="description" content="${escape(input.description)}"><link rel="canonical" href="${escape(input.canonical)}"><meta property="og:site_name" content="Saximi Shop"><meta property="og:title" content="${escape(input.title)}"><meta property="og:description" content="${escape(input.description)}"><meta property="og:url" content="${escape(input.canonical)}"><meta property="og:type" content="${input.type === 'product' ? 'product' : input.type}">${imageMeta}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(input.title)}"><meta name="twitter:description" content="${escape(input.description)}">${input.robots ? `<meta name="robots" content="${escape(input.robots)}">` : ''}${input.structured ? `<script type="application/ld+json">${safeJson(input.structured)}</script>` : ''}`;
}

async function renderShell(metadata: string, body: string, status: number) {
  const response = await fetch(process.env.POST_APP_SHELL_URL || 'http://web/index.html', { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error('App shell unavailable');
  const shell = await response.text();
  return {
    status,
    html: shell
      .replace(/<title>[\s\S]*?<\/title>/, () => metadata.replace(/<(meta|link|script) /g, '<$1 data-post-seo="true" '))
      .replace('<div id="app"></div>', () => `<div id="app"><main>${body}</main></div>`),
  };
}

export function mountPostRoutes(app: Express, authenticate: RequestHandler, siteUrl: () => string, store = new PostStore(), getCoupons: () => Coupon[] = () => [], getProducts: () => Product[] = () => []) {
  const vouchers = (post: { voucherIds?: number[] }) => (post.voucherIds || []).flatMap(id => {
    const c = getCoupons().find(coupon => coupon.id === id);
    if (!c) return [];
    const expiry = /^\d{4}-\d{2}-\d{2}$/.test(c.expiryDate) ? `${c.expiryDate}T23:59:59+07:00` : c.expiryDate;
    return [{ ...c, available: c.isActive && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) >= Date.now() }];
  });
  const shouldNotifyCustomers = (body: Record<string, unknown>) =>
    body.notifyCustomersOnPublish === true || body.notifyCustomersOnPublish === 'true';
  const maybeNotifyCustomers = (post: Post, body: Record<string, unknown>) => {
    if (!shouldNotifyCustomers(body) || post.status !== 'published') return;
    WebPushService.notifyCustomersPostPublished(post)
      .then(result => {
        if (result.total > 0) console.info(`Post notification sent for ${post.id}: ${result.sent}/${result.total}`);
      })
      .catch(error => console.error('Failed to send post notification', error));
  };
  const savePost = (body: Record<string, unknown>, id?: string) => {
    if (Array.isArray(body?.voucherIds)) {
      const old = id ? store.all().find(p => p.id === id)?.voucherIds || [] : [];
      if (body.voucherIds.some(v => !getCoupons().some(c => c.id === v) && !old.includes(v))) throw new PostError('Voucher được chọn không tồn tại.');
    }
    if (Array.isArray(body?.productIds)) {
      const old = id ? store.all().find(p => p.id === id)?.productIds || [] : [];
      if (body.productIds.some(v => !getProducts().some(product => product.id === v) && !old.includes(v))) throw new PostError('Sản phẩm Flash Sale được chọn không tồn tại.');
    }
    const post = store.save(body, id);
    maybeNotifyCustomers(post, body);
    return post;
  };
  const relatedProducts = (post: { productIds?: number[] }) => (post.productIds || []).flatMap(id => {
    const product = getProducts().find(item => item.id === id);
    if (!product) return [];
    return [{
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      promotionLabels: product.promotionLabels,
      isFlashSale: product.isFlashSale,
      isRecommended: product.isRecommended,
    }];
  });
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
    res.json({ ...page, items: page.items.map(p => ({ ...p, vouchers: vouchers(p), products: relatedProducts(p) })) });
  }));
  app.get(['/posts/:slug', '/api/posts/:slug'], handle((req, res) => {
    const post = store.all().find(p => p.slug === req.params.slug && p.status === 'published');
    if (!post) return res.status(404).json({ message: 'Bài viết không tồn tại hoặc chưa được xuất bản.' });
    res.json({ ...post, vouchers: vouchers(post), products: relatedProducts(post) });
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
    const productEntries = getProducts().map(p => `<url><loc>${escape(base)}/product/${p.id}</loc></url>`);
    const entries = [`<url><loc>${escape(base)}/news</loc></url>`, ...store.all().filter(p => p.status === 'published').map(p => `<url><loc>${escape(base)}/news/${p.slug}</loc><lastmod>${p.updatedAt}</lastmod></url>`), ...productEntries];
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
      const image = post?.cover ? toAbsoluteUrl(post.cover, base) : toAbsoluteUrl(undefined, base);
      const structured = post ? { '@context': 'https://schema.org', '@type': post.category === 'policy' ? 'WebPage' : 'Article', headline: post.title, description, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { '@type': 'Organization', name: post.author }, publisher: { '@type': 'Organization', name: 'Saximi Shop' }, url: canonical, image } : null;
      const metadata = buildSeoMetadata({ title, description, canonical, type: post ? 'article' : 'website', image, robots: missing || req.query.q || req.query.cursor || req.query.saved ? 'noindex,follow' : undefined, structured });
      const rendered = await renderShell(metadata, `${body}<a href="/news">Bản tin</a>`, missing ? 404 : 200);
      res.status(rendered.status).type('html').set('Cache-Control', 'no-cache').send(rendered.html);
    } catch (error) {
      console.error('Article render failed', error);
      res.status(503).set('Retry-After', '30').type('html').send('<h1>Bản tin tạm thời chưa tải được</h1><p>Vui lòng thử lại sau.</p>');
    }
  });

  app.get('/product/:id', async (req, res) => {
    try {
      const base = origin();
      const id = Number(req.params.id);
      const product = getProducts().find(p => p.id === id);
      const missing = !product;
      const canonical = `${base}/product/${Number.isFinite(id) ? id : ''}`;
      const title = missing ? 'Không tìm thấy sản phẩm | Saximi Shop' : truncate(product.seo?.title || `${product.name} | Saximi Shop`, 65);
      const description = missing
        ? 'Sản phẩm không tồn tại hoặc đã ngừng hiển thị trên Saximi Shop.'
        : truncate(product.seo?.description || product.promoDescription || stripHtml(product.detail) || `${product.name} đang được bán tại Saximi Shop với giao nhận linh hoạt và hỗ trợ khách hàng nhanh.`, 158);
      const image = toAbsoluteUrl(product?.images?.[0]?.url || product?.image, base);
      const availability = (product?.stockQuantity ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
      const structured = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        image: (product.images?.length ? product.images.map(item => toAbsoluteUrl(item.url, base)) : [image]),
        sku: `SAXIMI-${product.id}`,
        brand: { '@type': 'Brand', name: 'Saximi Shop' },
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'VND',
          price: product.price,
          availability,
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: 'Saximi Shop' },
        },
      } : null;
      const body = product
        ? `<article><h1>${escape(product.name)}</h1><img src="${escape(image)}" alt="${escape(product.name)}"><p>${escape(description)}</p><p>${Number(product.price).toLocaleString('vi-VN')} VND</p></article>`
        : '<h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm không tồn tại hoặc đã ngừng hiển thị.</p>';
      const metadata = buildSeoMetadata({ title, description, canonical, type: 'product', image, robots: missing ? 'noindex,follow' : undefined, structured });
      const rendered = await renderShell(metadata, body, missing ? 404 : 200);
      res.status(rendered.status).type('html').set('Cache-Control', 'no-cache').send(rendered.html);
    } catch (error) {
      console.error('Product render failed', error);
      res.status(503).set('Retry-After', '30').type('html').send('<h1>Sản phẩm tạm thời chưa tải được</h1><p>Vui lòng thử lại sau.</p>');
    }
  });
}
