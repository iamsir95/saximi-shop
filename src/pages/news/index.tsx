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
import { absoluteSeoUrl, applySeoTags } from "@/utils/seo";

type Post = {
  vouchers?: PostVoucher[];
  products?: Array<{ id: number; name: string; price: number; originalPrice?: number; image: string; isFlashSale?: boolean; isRecommended?: boolean; promotionLabels?: Array<{ id: string; name: string; color: string }> }>;
  id: string; slug: string; title: string; excerpt: string; content?: string;
  contentType?: string; videoUrl?: string; flashSaleEndsAt?: string | null; customCode?: string;
  category: string; cover: string; coverAlt: string; author: string;
  publishedAt: string; updatedAt: string; seoTitle: string; seoDescription: string;
};
type Page = { items: Post[]; nextCursor: string | null };
const categories = [{ key: "", label: "Tất cả" }, { key: "news", label: "Cần biết" }, { key: "event", label: "Sự kiện" }, { key: "promotion", label: "Khuyến mãi" }, { key: "policy", label: "Chính sách" }];
const date = (value: string) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const label = (key: string) => categories.find(c => c.key === key)?.label || "Bản tin";
const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
function savedIds(): string[] {
  try { const ids = JSON.parse(localStorage.getItem('savedPosts') || '[]'); return Array.isArray(ids) ? ids.filter(id => typeof id === 'string').slice(-200) : []; }
  catch { return []; }
}

function usePostSeo(post?: Post, feed = false) {
  const settings = useAtomValue(platformSettingsState);
  useEffect(() => {
    if (!post && !feed) return;
    const title = post?.seoTitle || post?.title || "Bản tin | Saximi Shop";
    const origin = settings?.publicSiteUrl || 'https://hpn.saximi.com.vn';
    const filters = new URLSearchParams(window.location.search);
    const category = filters.get('category');
    const url = new URL(post ? `/news/${post.slug}` : `/news${category ? `?category=${encodeURIComponent(category)}` : ''}`, origin).href;
    const description = post?.seoDescription || post?.excerpt || "Thông tin cần biết, sự kiện, khuyến mãi và chính sách từ Saximi Shop.";
    const cleanup = applySeoTags({
      title,
      description,
      canonical: url,
      type: post ? "article" : "website",
      image: absoluteSeoUrl(post?.cover, origin),
      robots: !post && (filters.has('saved') || filters.has('q')) ? "noindex,follow" : undefined,
      structuredData: post ? {
        '@context': 'https://schema.org',
        '@type': post.category === 'policy' ? 'WebPage' : 'Article',
        headline: post.title,
        description,
        image: absoluteSeoUrl(post.cover, origin),
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Organization', name: post.author },
        publisher: { '@type': 'Organization', name: 'Saximi Shop' },
        url,
      } : undefined,
    });
    return () => { cleanup(); document.title = "Saximi Shop"; };
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

function PostFormatBadge({ post }: { post: Post }) {
  const map: Record<string, string> = {
    video: "Video",
    "short-video": "Short Video",
    "flash-sale": "Flash Sale",
    "custom-code": "Nội dung đặc biệt",
    policy: "Chính sách",
  };
  const text = map[post.contentType || ""] || "";
  return text ? <span className={`news-format news-format--${post.contentType}`}>{text}</span> : null;
}

function postLayoutClass(post: Post) {
  return `news-detail__article news-detail__article--${post.contentType || "article"}`;
}

function PostVideoBlock({ post }: { post: Post }) {
  if (!post.videoUrl) return null;
  const vertical = post.contentType === "short-video";
  return (
    <div className={`news-video ${vertical ? "news-video--vertical" : ""}`}>
      <video src={post.videoUrl} poster={post.cover || undefined} controls playsInline preload="metadata" />
    </div>
  );
}

function SuggestedVideoStrip({ posts }: { posts: Post[] }) {
  const videos = posts.filter((item) => item.contentType === "video" && item.videoUrl).slice(0, 6);
  if (!videos.length) return null;
  return (
    <section className="news-video-suggestions" aria-label="Video gợi ý">
      <div className="news-section-heading">
        <span>Video gợi ý</span>
        <strong>Nội dung liên quan</strong>
      </div>
      <div className="news-video-suggestions__rail">
        {videos.map((item) => (
          <Link key={item.id} to={`/news/${item.slug}`} className="news-video-card">
            <div className="news-video-card__thumb">
              {item.cover && <img src={item.cover} alt={item.coverAlt || item.title} loading="lazy" />}
              <span><CommerceIcon name="play" size={14} />Video</span>
            </div>
            <strong>{item.title}</strong>
            <small>{date(item.publishedAt)}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ShortVideoReel({ current, related }: { current: Post; related: Post[] }) {
  const videos = [current, ...related.filter((item) => item.id !== current.id && item.contentType === "short-video" && item.videoUrl)].slice(0, 8);
  if (!current.videoUrl) return null;
  return (
    <section className="news-short-reel" aria-label="Short video">
      {videos.map((item, index) => (
        <article key={item.id} className="news-short-card">
          <video
            src={item.videoUrl}
            poster={item.cover || undefined}
            controls
            playsInline
            preload={index === 0 ? "metadata" : "none"}
          />
          <div className="news-short-card__overlay">
            <Link to={`/news/${item.slug}`}>{item.title}</Link>
            <p>{item.excerpt}</p>
            <span>{item.author} · {date(item.publishedAt)}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function FlashSaleBlock({ post }: { post: Post }) {
  if (post.contentType !== "flash-sale") return null;
  const ends = post.flashSaleEndsAt ? new Date(post.flashSaleEndsAt) : null;
  return (
    <section className="news-flash-sale" aria-label="Flash Sale">
      <div>
        <span>Flash Sale</span>
        <strong>{ends && !Number.isNaN(ends.getTime()) ? `Kết thúc ${ends.toLocaleString("vi-VN")}` : "Ưu đãi đang mở"}</strong>
      </div>
      {!!post.products?.length && (
        <div className="news-flash-sale__products">
          {post.products.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="news-flash-sale__product">
              <img src={product.image} alt={product.name} loading="lazy" />
              <span>{product.name}</span>
              <strong>{money(product.price)}</strong>
              {product.originalPrice && <small>{money(product.originalPrice)}</small>}
            </Link>
          ))}
        </div>
      )}
    </section>
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
        <Link className="news-post-link" to={`/news/${post.slug}`}><div className="news-post-badges"><PostFormatBadge post={post} /></div><h2>{post.title}</h2><p>{post.excerpt}</p>{post.cover && <img loading="lazy" src={post.cover} alt={post.coverAlt} />}<span className="news-read">Đọc tiếp <CommerceIcon name="chevron-right" size={16} /></span></Link>
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
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
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
  useEffect(() => {
    if (!post) {
      setRelatedPosts([]);
      return;
    }
    const controller = new AbortController();
    const filter = new URLSearchParams({ limit: "24", category: post.category });
    fetch(`${getApiBaseUrl()}/posts?${filter}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: Page) => {
        if (controller.signal.aborted) return;
        setRelatedPosts((data.items || []).filter((item) => item.id !== post.id));
      })
      .catch(() => {
        if (!controller.signal.aborted) setRelatedPosts([]);
      });
    return () => controller.abort();
  }, [post?.id, post?.category]);
  return <div className="news-detail"><Link className="news-back" to="/news"><CommerceIcon name="arrow-left" size={18} />Bản tin</Link>{error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(n => n + 1)}>Thử lại</button></div> : !post ? <p role="status">Đang tải bài viết…</p> : <article className={postLayoutClass(post)}>
    <div className="news-detail__meta"><Link className={`news-category news-category--${post.category}`} to={`/news?category=${post.category}`}>{label(post.category)}</Link><PostFormatBadge post={post} /></div>
    <h1>{post.title}</h1><p className="news-byline">{post.author} · Đăng ngày <time dateTime={post.publishedAt}>{date(post.publishedAt)}</time></p>
    <p className="news-intro">{post.excerpt}</p>{post.cover && <img className="news-cover" src={post.cover} alt={post.coverAlt} />}
    {post.contentType === "short-video" ? <ShortVideoReel current={post} related={relatedPosts} /> : <PostVideoBlock post={post} />}
    {post.contentType === "video" && <SuggestedVideoStrip posts={relatedPosts} />}
    <FlashSaleBlock post={post} />
    <PostVouchers vouchers={post.vouchers} />
    <PostContentWithForms content={post.content || ''} forms={forms} />
    {post.customCode && <div className="news-custom-code" dangerouslySetInnerHTML={{ __html: post.customCode }} />}
    {post.updatedAt !== post.publishedAt && <p className="news-byline">Cập nhật: <time dateTime={post.updatedAt}>{date(post.updatedAt)}</time></p>}
    <PostActions key={post.id} post={post} /><Link className="news-back" to={`/news?category=${post.category}`}>Xem bài viết cùng chuyên mục<CommerceIcon name="chevron-right" size={18} /></Link>
  </article>}</div>;
}
