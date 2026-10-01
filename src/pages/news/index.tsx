import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import CommerceIcon from "@/components/commerce-icon";
import { getApiBaseUrl } from "@/utils/request";
import toast from "react-hot-toast";
import { useAtomValue } from "jotai";
import { platformSettingsState } from "@/state";
import "./news.css";
import { PostVouchers, PostVoucher } from './vouchers';
import DynamicFormEmbed from "@/components/dynamic-form-embed";
import { DynamicForm } from "@/types";

type Post = {
  vouchers?: PostVoucher[];
  id: string; slug: string; title: string; excerpt: string; content?: string;
  category: string; cover: string; coverAlt: string; author: string;
  publishedAt: string; updatedAt: string; seoTitle: string; seoDescription: string;
};
type Page = { items: Post[]; nextCursor: string | null };
const categories = [{ key: "", label: "Tất cả" }, { key: "news", label: "Cần biết" }, { key: "event", label: "Sự kiện" }, { key: "promotion", label: "Khuyến mãi" }, { key: "policy", label: "Chính sách" }];
const date = (value: string) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const label = (key: string) => categories.find(c => c.key === key)?.label || "Bản tin";
function savedIds(): string[] {
  try { const ids = JSON.parse(localStorage.getItem('savedPosts') || '[]'); return Array.isArray(ids) ? ids.filter(id => typeof id === 'string').slice(-200) : []; }
  catch { return []; }
}

function usePostSeo(post?: Post, feed = false) {
  const settings = useAtomValue(platformSettingsState);
  useEffect(() => {
    if (!post && !feed) return;
    document.querySelectorAll('[data-post-seo]').forEach(el => el.remove());
    const title = post?.seoTitle || post?.title || "Bản tin | Saximi Shop";
    document.title = title;
    const tags: HTMLElement[] = [];
    const origin = settings?.publicSiteUrl || 'https://hpn.saximi.com.vn';
    const filters = new URLSearchParams(window.location.search);
    const category = filters.get('category');
    const url = new URL(post ? `/news/${post.slug}` : `/news${category ? `?category=${encodeURIComponent(category)}` : ''}`, origin).href;
    const description = post?.seoDescription || post?.excerpt || "Thông tin cần biết, sự kiện, khuyến mãi và chính sách từ Saximi Shop.";
    for (const [key, content] of Object.entries({ description, "og:description": description, "og:title": title, "og:url": url, "og:type": post ? "article" : "website", ...(post?.cover ? { "og:image": new URL(post.cover, origin).href } : {}) })) {
      const meta = document.createElement("meta");
      meta.setAttribute(key.startsWith("og:") ? "property" : "name", key);
      meta.content = content; meta.dataset.postSeo = "true"; document.head.appendChild(meta); tags.push(meta);
    }
    const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = url; canonical.dataset.postSeo = 'true'; document.head.appendChild(canonical); tags.push(canonical);
    if (!post && (filters.has('saved') || filters.has('q'))) {
      const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex,follow'; robots.dataset.postSeo = 'true'; document.head.appendChild(robots); tags.push(robots);
    }
    if (post) {
      const structured = document.createElement('script'); structured.type = 'application/ld+json'; structured.dataset.postSeo = 'true';
      structured.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': post.category === 'policy' ? 'WebPage' : 'Article', headline: post.title, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { '@type': 'Organization', name: post.author }, url });
      document.head.appendChild(structured); tags.push(structured);
    }
    return () => { tags.forEach(el => el.remove()); document.title = "Saximi Shop"; };
  }, [post, feed, settings?.publicSiteUrl, window.location.search]);
}

function PostActions({ post }: { post: Post }) {
  const settings = useAtomValue(platformSettingsState);
  const [saved, setSaved] = useState(() => savedIds().includes(post.id));
  const toggle = () => {
    try {
      const ids = savedIds();
      localStorage.setItem("savedPosts", JSON.stringify(saved ? ids.filter(id => id !== post.id) : [...new Set([...ids, post.id])].slice(-200)));
      setSaved(!saved); toast.success(saved ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết trên thiết bị");
      window.dispatchEvent(new Event('saximi:saved-posts'));
    } catch { toast.error("Không thể lưu bài viết trên thiết bị này."); }
  };
  const share = async () => {
    const url = new URL(`/news/${post.slug}`, settings?.publicSiteUrl || 'https://hpn.saximi.com.vn').href;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Đã sao chép liên kết"); }
    } catch (error) { if ((error as Error).name !== "AbortError") toast.error("Không thể chia sẻ. Bạn có thể sao chép đường dẫn trên trình duyệt."); }
  };
  return <div className="news-actions"><button type="button" onClick={toggle} aria-pressed={saved}><CommerceIcon name={saved ? "check" : "note"} size={18} />{saved ? "Đã lưu" : "Lưu bài"}</button><button type="button" onClick={share}><CommerceIcon name="link" size={18} />Chia sẻ</button></div>;
}

function normalizeFormTokens(content: string) {
  return content.replace(/<p>\s*\[\[form:(\d+)\]\]\s*<\/p>/g, "[[form:$1]]");
}

function PostContentWithForms({
  content,
  forms,
}: {
  content: string;
  forms: DynamicForm[];
}) {
  const parts = normalizeFormTokens(content || "").split(/(\[\[form:\d+\]\])/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[\[form:(\d+)\]\]$/);
        if (match) {
          const form = forms.find((item) => item.id === Number(match[1]));
          return form ? (
            <DynamicFormEmbed key={`${part}-${index}`} form={form} placement="news" />
          ) : null;
        }
        return part ? (
          <div
            key={index}
            className="news-richtext"
            dangerouslySetInnerHTML={{ __html: part }}
          />
        ) : null;
      })}
    </>
  );
}

export default function NewsPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const query = params.get("q") || "";
  const onlySaved = params.get('saved') === '1';
  const [search, setSearch] = useState(query);
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => { const refresh = () => { if (onlySaved) setRetry(n => n + 1); }; window.addEventListener('saximi:saved-posts', refresh); return () => window.removeEventListener('saximi:saved-posts', refresh); }, [onlySaved]);
  const sentinel = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController>();
  const busy = useRef(false);
  usePostSeo(undefined, true);
  const load = useCallback(async (next?: string) => {
    if (busy.current) return;
    const controller = new AbortController(); request.current = controller;
    busy.current = true; setLoading(true); setError("");
    try {
      const filter = new URLSearchParams({ limit: "8", ...(onlySaved ? { ids: savedIds().join(',') } : {}), ...(category ? { category } : {}), ...(query ? { q: query } : {}), ...(next ? { cursor: next } : {}) });
      const res = await fetch(`${getApiBaseUrl()}/posts?${filter}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Chưa tải được bản tin. Vui lòng thử lại.");
      const data: Page = await res.json();
      if (controller.signal.aborted) return;
      setItems(old => next ? [...old, ...data.items.filter(p => !old.some(o => o.id === p.id))] : data.items);
      setCursor(data.nextCursor);
    } catch (err) { if (!controller.signal.aborted) setError((err as Error).message); }
    finally { if (request.current === controller) { busy.current = false; setLoading(false); } }
  }, [category, query, onlySaved]);
  useEffect(() => {
    request.current?.abort(); busy.current = false; setItems([]); setCursor(null); setSearch(query); void load();
    return () => { request.current?.abort(); busy.current = false; };
  }, [load, retry]);
  useEffect(() => {
    if (!cursor || loading || error || !sentinel.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) void load(cursor); }, { root: document.querySelector('.app-scroll'), rootMargin: '240px' });
    observer.observe(sentinel.current); return () => observer.disconnect();
  }, [cursor, loading, error, load]);
  return <div className="news-layout">
    <aside className="news-sidebar"><h1>Bản tin</h1><p>Saximi Shop</p><nav aria-label="Chuyên mục bản tin">{categories.slice(1).map(c => <Link key={c.key} to={`/news?category=${c.key}`} aria-current={category === c.key ? "page" : undefined}>{c.label}<CommerceIcon name="chevron-right" size={16} /></Link>)}</nav></aside>
    <section className="news-feed" aria-label="Bản tin Saximi Shop">
      <div className="news-filters"><form onSubmit={e => { e.preventDefault(); setParams({ ...(onlySaved ? { saved: '1' } : {}), ...(category ? { category } : {}), ...(search.trim() ? { q: search.trim() } : {}) }); }}><input aria-label="Tìm bài viết" placeholder="Tìm bài viết…" value={search} onChange={e => setSearch(e.target.value)} /><button type="submit">Tìm kiếm</button></form>
      <nav className="news-tabs" aria-label="Lọc chuyên mục">{categories.map(c => <Link key={c.key} to={`/news${c.key ? `?category=${c.key}` : ''}`} aria-current={!onlySaved && category === c.key ? "page" : undefined}>{c.label}</Link>)}<Link to="/news?saved=1" aria-current={onlySaved ? 'page' : undefined}>Đã lưu</Link></nav></div>
      <div className="news-posts" aria-busy={loading}>{items.map(post => <article className="news-post" key={post.id}>
        <header><div className="news-publisher"><CommerceIcon name="note" size={22} /><div><strong>{post.author}</strong><time dateTime={post.publishedAt}>{date(post.publishedAt)}</time></div></div><Link className={`news-category news-category--${post.category}`} to={`/news?category=${post.category}`}>{label(post.category)}</Link></header>
        <Link className="news-post-link" to={`/news/${post.slug}`}><h2>{post.title}</h2><p>{post.excerpt}</p>{post.cover && <img loading="lazy" src={post.cover} alt={post.coverAlt} />}<span className="news-read">Đọc tiếp <CommerceIcon name="chevron-right" size={16} /></span></Link>
        <PostVouchers vouchers={post.vouchers} />
        <PostActions post={post} />
      </article>)}</div>
      <div ref={sentinel} className="news-feed-status" aria-live="polite">{loading ? <p>Đang tải bài viết…</p> : error ? <><p role="alert">{error}</p><button onClick={() => cursor ? void load(cursor) : setRetry(n => n + 1)}>Thử lại</button></> : !items.length ? <p>{query ? "Không tìm thấy bài viết phù hợp." : "Chưa có bài viết trong chuyên mục này."}</p> : cursor ? <button onClick={() => void load(cursor)}>Xem thêm bài viết</button> : <p>Bạn đã xem hết bài viết.</p>}</div>
    </section>
  </div>;
}

export function NewsDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post>();
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  usePostSeo(post);
  useEffect(() => {
    const controller = new AbortController(); setPost(undefined); setError("");
    fetch(`${getApiBaseUrl()}/posts/${encodeURIComponent(slug || '')}`, { signal: controller.signal }).then(async res => {
      if (!res.ok) throw new Error(res.status === 404 ? "Bài viết không tồn tại hoặc đã được gỡ." : "Chưa tải được bài viết. Vui lòng thử lại.");
      const data = await res.json(); if (!controller.signal.aborted) setPost(data);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [slug, retry]);
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/forms?placement=news`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setForms)
      .catch(() => setForms([]));
  }, []);
  return <div className="news-detail"><Link className="news-back" to="/news"><CommerceIcon name="arrow-left" size={18} />Bản tin</Link>{error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(n => n + 1)}>Thử lại</button></div> : !post ? <p role="status">Đang tải bài viết…</p> : <article>
    <Link className={`news-category news-category--${post.category}`} to={`/news?category=${post.category}`}>{label(post.category)}</Link>
    <h1>{post.title}</h1><p className="news-byline">{post.author} · Đăng ngày <time dateTime={post.publishedAt}>{date(post.publishedAt)}</time></p>
    <p className="news-intro">{post.excerpt}</p>{post.cover && <img className="news-cover" src={post.cover} alt={post.coverAlt} />}
    <PostVouchers vouchers={post.vouchers} />
    <PostContentWithForms content={post.content || ''} forms={forms} />
    {post.updatedAt !== post.publishedAt && <p className="news-byline">Cập nhật: <time dateTime={post.updatedAt}>{date(post.updatedAt)}</time></p>}
    <PostActions key={post.id} post={post} /><Link className="news-back" to={`/news?category=${post.category}`}>Xem bài viết cùng chuyên mục<CommerceIcon name="chevron-right" size={18} /></Link>
  </article>}</div>;
}
