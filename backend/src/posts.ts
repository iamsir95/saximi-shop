import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';

export const postCategories = ['news', 'event', 'promotion', 'policy'] as const;
export type PostCategory = typeof postCategories[number];
export const postContentTypes = ['article', 'policy', 'video', 'short-video', 'flash-sale', 'custom-code'] as const;
export type PostContentType = typeof postContentTypes[number];
export interface Post {
  id: string; slug: string; title: string; excerpt: string; content: string;
  category: PostCategory; status: 'draft' | 'published' | 'archived';
  contentType?: PostContentType;
  videoUrl?: string;
  videoOrientation?: 'horizontal' | 'vertical';
  flashSaleEndsAt?: string | null;
  productIds?: number[];
  customCode?: string;
  cover: string; coverAlt: string; author: string; seoTitle: string; seoDescription: string;
  createdAt: string; updatedAt: string; publishedAt: string | null;
  voucherIds?: number[];
  deletedAt?: string;
}
export class PostError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function postSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/, '');
}
export function plainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}
export function cleanArticle(value: string) {
  return sanitizeHtml(value, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'video', 'source', 'iframe'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      video: ['src', 'poster', 'controls', 'playsinline', 'preload'],
      source: ['src', 'type'],
      iframe: ['src', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'],
      '*': ['style', 'class'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https', 'http'], video: ['https', 'http'], source: ['https', 'http'], iframe: ['https', 'http'] },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com'],
    allowProtocolRelative: false,
    allowedStyles: {
      '*': {
        'text-align': [/^(left|right|center|justify)$/],
        'color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(/, /^rgba\(/],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(/, /^rgba\(/],
        'border-color': [/^#[0-9a-f]{3,8}$/i],
      },
    },
  });
}

export class PostStore {
  constructor(private file = path.join(__dirname, '../data/posts.json')) {}
  all(includeDeleted = false): Post[] {
    if (!fs.existsSync(this.file)) return [];
    const posts: Post[] = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    return includeDeleted ? posts : posts.filter(p => !p.deletedAt);
  }
  private write(posts: Post[]) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(posts, null, 2));
    fs.renameSync(`${this.file}.tmp`, this.file);
  }
  save(input: Record<string, unknown>, id?: string): Post {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PostError('Dữ liệu bài viết không hợp lệ.');
    const posts = this.all(true);
    const previous = id ? posts.find(p => p.id === id) : undefined;
    if (id && (!previous || previous.deletedAt)) throw new PostError('Không tìm thấy bài viết.', 404);
    const voucherIds = input.voucherIds ?? previous?.voucherIds ?? [];
    if (!Array.isArray(voucherIds) || voucherIds.length > 8 || voucherIds.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new PostError('Chọn tối đa 8 voucher hợp lệ.');
    const productIds = input.productIds ?? previous?.productIds ?? [];
    if (!Array.isArray(productIds) || productIds.length > 24 || productIds.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new PostError('Chọn tối đa 24 sản phẩm hợp lệ.');
    const field = (key: string, max: number) => {
      const value = input[key];
      if (value !== undefined && typeof value !== 'string') throw new PostError(`Trường ${key} không hợp lệ.`);
      const text = String(value ?? '').trim();
      if (text.length > max) throw new PostError(`Trường ${key} vượt quá ${max} ký tự.`);
      return text;
    };
    const title = field('title', 200);
    const slug = postSlug(field('slug', 160) || title);
    if (!title || !slug) throw new PostError('Vui lòng nhập tiêu đề và đường dẫn hợp lệ.');
    if (posts.some(p => p.slug === slug && p.id !== id)) throw new PostError('Đường dẫn này đã được sử dụng.', 409);
    const category = field('category', 20) as PostCategory;
    const status = field('status', 20) as Post['status'];
    if (!postCategories.includes(category) || !['draft', 'published', 'archived'].includes(status)) throw new PostError('Chuyên mục hoặc trạng thái không hợp lệ.');
    const rawContentType = field('contentType', 30) as PostContentType;
    const contentType: PostContentType = postContentTypes.includes(rawContentType) ? rawContentType : (category === 'policy' ? 'policy' : 'article');
    const videoUrl = field('videoUrl', 2000);
    if (videoUrl && !/^https?:\/\/[^\s]+$/i.test(videoUrl) && !/^\/(?!\/)[^\s]*$/.test(videoUrl)) throw new PostError('Video phải là URL http/https hoặc đường dẫn trên website.');
    const flashSaleEndsAt = field('flashSaleEndsAt', 80) || null;
    if (flashSaleEndsAt && Number.isNaN(Date.parse(flashSaleEndsAt))) throw new PostError('Thời gian countdown Flash Sale không hợp lệ.');
    const content = cleanArticle(field('content', 80000));
    const customCode = cleanArticle(field('customCode', 120000));
    const hasMedia = content.includes('<img') || content.includes('<video') || content.includes('<iframe') || Boolean(videoUrl);
    if (status === 'published' && !plainText(content) && !plainText(customCode) && !hasMedia) throw new PostError('Bài xuất bản cần có nội dung.');
    const cover = field('cover', 2000);
    if (cover && !/^https?:\/\/[^\s]+$/i.test(cover) && !/^\/(?!\/)[^\s]*$/.test(cover)) throw new PostError('Ảnh bìa phải là URL http/https hoặc đường dẫn trên website.');
    const now = new Date().toISOString();
    const post: Post = {
      id: previous?.id || randomUUID(), slug, title, content, category, status, cover,
      contentType,
      videoUrl: videoUrl || undefined,
      videoOrientation: contentType === 'short-video' ? 'vertical' : contentType === 'video' ? 'horizontal' : previous?.videoOrientation,
      flashSaleEndsAt: contentType === 'flash-sale' ? flashSaleEndsAt : null,
      productIds: contentType === 'flash-sale' ? [...new Set(productIds)] : [...new Set(productIds)].slice(0, 24),
      customCode: contentType === 'custom-code' ? customCode : customCode || undefined,
      coverAlt: field('coverAlt', 200) || title, author: field('author', 100) || 'Saximi Shop',
      excerpt: field('excerpt', 500) || plainText(content).slice(0, 240),
      seoTitle: field('seoTitle', 200), seoDescription: field('seoDescription', 320),
      createdAt: previous?.createdAt || now, updatedAt: now,
      publishedAt: previous?.publishedAt || (status === 'published' ? now : null),
      voucherIds: [...new Set(voucherIds)],
    };
    this.write(previous ? posts.map(p => p.id === id ? post : p) : [...posts, post]);
    return post;
  }
  trash(id: string, restore = false) {
    const posts = this.all(true);
    const post = posts.find(p => p.id === id);
    if (!post) throw new PostError('Không tìm thấy bài viết.', 404);
    if (restore) { delete post.deletedAt; post.status = 'draft'; }
    else post.deletedAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();
    this.write(posts);
    return post;
  }
  list(query: { category?: string; q?: string; cursor?: string; limit?: string; ids?: string }) {
    if (query.category && !postCategories.includes(query.category as PostCategory)) throw new PostError('Chuyên mục không hợp lệ.');
    const limit = Math.max(1, Math.min(24, Number(query.limit) || 8));
    let boundary: { date: string; id: string } | undefined;
    if (query.cursor) {
      try {
        boundary = JSON.parse(Buffer.from(query.cursor, 'base64url').toString());
        if (!boundary || typeof boundary.id !== 'string' || typeof boundary.date !== 'string') throw new Error();
      } catch { throw new PostError('Mốc phân trang không hợp lệ.'); }
    }
    const term = (query.q || '').trim().toLocaleLowerCase('vi');
    const selected = query.ids === undefined ? null : new Set(query.ids.split(',').slice(0, 200));
    const posts = this.all().filter(p => p.status === 'published' && p.publishedAt &&
      (!selected || selected.has(p.id)) &&
      (!query.category || p.category === query.category) &&
      (!term || `${p.title} ${p.excerpt}`.toLocaleLowerCase('vi').includes(term)) &&
      (!boundary || p.publishedAt < boundary.date || (p.publishedAt === boundary.date && p.id < boundary.id)))
      .sort((a, b) => b.publishedAt!.localeCompare(a.publishedAt!) || (a.id < b.id ? 1 : -1));
    const page = posts.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(({ content, customCode, ...post }) => post),
      nextCursor: posts.length > limit && last ? Buffer.from(JSON.stringify({ date: last.publishedAt, id: last.id })).toString('base64url') : null,
    };
  }
}
