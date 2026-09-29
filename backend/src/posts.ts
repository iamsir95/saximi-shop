import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';

export const postCategories = ['news', 'event', 'promotion', 'policy'] as const;
export type PostCategory = typeof postCategories[number];
export interface Post {
  id: string; slug: string; title: string; excerpt: string; content: string;
  category: PostCategory; status: 'draft' | 'published' | 'archived';
  cover: string; coverAlt: string; author: string; seoTitle: string; seoDescription: string;
  createdAt: string; updatedAt: string; publishedAt: string | null;
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
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'],
    allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'], '*': ['style'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https', 'http'] },
    allowProtocolRelative: false,
    allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
  });
}

export class PostStore {
  constructor(private file = path.join(__dirname, '../data/posts.json')) {}
  all(): Post[] {
    if (!fs.existsSync(this.file)) return [];
    return JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }
  private write(posts: Post[]) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(posts, null, 2));
    fs.renameSync(`${this.file}.tmp`, this.file);
  }
  save(input: Record<string, unknown>, id?: string): Post {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PostError('Dữ liệu bài viết không hợp lệ.');
    const posts = this.all();
    const previous = id ? posts.find(p => p.id === id) : undefined;
    if (id && !previous) throw new PostError('Không tìm thấy bài viết.', 404);
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
    const content = cleanArticle(field('content', 80000));
    if (status === 'published' && !plainText(content) && !content.includes('<img')) throw new PostError('Bài xuất bản cần có nội dung.');
    const cover = field('cover', 2000);
    if (cover && !/^https?:\/\/[^\s]+$/i.test(cover) && !/^\/(?!\/)[^\s]*$/.test(cover)) throw new PostError('Ảnh bìa phải là URL http/https hoặc đường dẫn trên website.');
    const now = new Date().toISOString();
    const post: Post = {
      id: previous?.id || randomUUID(), slug, title, content, category, status, cover,
      coverAlt: field('coverAlt', 200) || title, author: field('author', 100) || 'Saximi Shop',
      excerpt: field('excerpt', 500) || plainText(content).slice(0, 240),
      seoTitle: field('seoTitle', 200), seoDescription: field('seoDescription', 320),
      createdAt: previous?.createdAt || now, updatedAt: now,
      publishedAt: previous?.publishedAt || (status === 'published' ? now : null),
    };
    this.write(previous ? posts.map(p => p.id === id ? post : p) : [...posts, post]);
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
      items: page.map(({ content, ...post }) => post),
      nextCursor: posts.length > limit && last ? Buffer.from(JSON.stringify({ date: last.publishedAt, id: last.id })).toString('base64url') : null,
    };
  }
}
