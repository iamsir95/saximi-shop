import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, ExternalLink, Sparkles, Flame, Video, FileText, ShieldCheck, Code2 } from 'lucide-react';
import { api } from '../api';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaAsset, Product } from '../types';
import { ImageField } from '../components/ImageField';
import { VoucherPicker } from '../components/VoucherPicker';
import { PostWall } from '../components/PostWall';
import { DynamicForm } from '../types';
import { VideoUpload } from '../components/VideoUpload';

export type Post = { voucherIds?: number[]; productIds?: number[]; deletedAt?: string; id?: string; title: string; slug: string; category: string; status: string; contentType?: string; videoUrl?: string; flashSaleEndsAt?: string | null; customCode?: string; excerpt: string; content: string; cover: string; coverAlt: string; author: string; seoTitle: string; seoDescription: string; publishedAt?: string | null; updatedAt?: string };
const empty: Post = { title: '', slug: '', category: 'news', status: 'draft', contentType: 'article', excerpt: '', content: '', cover: '', coverAlt: '', author: 'Saximi Shop', seoTitle: '', seoDescription: '' };
const categories: Record<string, string> = { news: 'Thông tin cần biết', event: 'Sự kiện', promotion: 'Khuyến mãi', policy: 'Chính sách' };
const states: Record<string, string> = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Đã lưu trữ' };
const contentTypes: Record<string, string> = { article: 'Bài viết thường', policy: 'Chính sách', video: 'Video ngang', 'short-video': 'Short Video dọc', 'flash-sale': 'Flash Sale', 'custom-code': 'Custom Code an toàn' };
const contentTypeDetails: Record<string, { title: string; description: string; tone: string; icon: React.ReactNode; checklist: string[] }> = {
  article: {
    title: 'Layout bản tin tiêu chuẩn',
    description: 'Dùng cho thông tin cần biết, sự kiện, khuyến mãi và nội dung dài chuẩn SEO.',
    tone: 'border-cyan-500/25 bg-cyan-500/5 text-cyan-100',
    icon: <FileText size={18} />,
    checklist: ['Tiêu đề rõ lợi ích', 'Ảnh bìa 16:9 hoặc 4:6 trên mobile', 'Tóm tắt ngắn trước nội dung chính'],
  },
  policy: {
    title: 'Layout chính sách',
    description: 'Tối ưu cho điều khoản, đổi trả, bảo hành, quyền lợi hội viên và hướng dẫn mua hàng.',
    tone: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-100',
    icon: <ShieldCheck size={18} />,
    checklist: ['Chia mục bằng H2/H3', 'Nêu phạm vi áp dụng', 'Thêm ngày cập nhật khi chỉnh sửa'],
  },
  video: {
    title: 'Layout video ngang',
    description: 'Hiển thị video tỉ lệ 16:9, phù hợp review, hướng dẫn sử dụng và livestream cắt lại.',
    tone: 'border-indigo-500/25 bg-indigo-500/5 text-indigo-100',
    icon: <Video size={18} />,
    checklist: ['Dùng video MP4 hoặc URL hợp lệ', 'Ảnh bìa làm poster', 'Thêm nội dung tóm tắt bên dưới video'],
  },
  'short-video': {
    title: 'Layout Short Video dọc',
    description: 'Hiển thị khung dọc 9:16 cho video ngắn, phù hợp nội dung nhanh trên mobile.',
    tone: 'border-fuchsia-500/25 bg-fuchsia-500/5 text-fuchsia-100',
    icon: <Video size={18} />,
    checklist: ['Video dọc rõ chủ thể', 'Tiêu đề ngắn', 'CTA hoặc voucher đặt sau video'],
  },
  'flash-sale': {
    title: 'Layout Flash Sale',
    description: 'Có countdown, danh sách sản phẩm và voucher đi kèm cho chiến dịch bán nhanh.',
    tone: 'border-rose-500/25 bg-rose-500/5 text-rose-100',
    icon: <Flame size={18} />,
    checklist: ['Chọn thời gian kết thúc', 'Chọn sản phẩm hiển thị', 'Gắn voucher nếu có ưu đãi riêng'],
  },
  'custom-code': {
    title: 'Layout nội dung tùy biến',
    description: 'Dùng HTML/CSS/media đã lọc an toàn cho khối nội dung đặc biệt.',
    tone: 'border-amber-500/25 bg-amber-500/5 text-amber-100',
    icon: <Code2 size={18} />,
    checklist: ['Không hỗ trợ script', 'Dùng CSS inline gọn', 'Kiểm tra lại trên mobile sau khi lưu'],
  },
};
const inputClass = 'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white';
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm';

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140);

const truncateText = (value: string, max: number) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  return `${sliced.slice(0, Math.max(0, sliced.lastIndexOf(' '))).trim()}…`;
};

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

export function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dynamicForms, setDynamicForms] = useState<DynamicForm[]>([]);
  const [form, setForm] = useState<Post | null>(null);
  const [tab, setTab] = useState('content');
  const [trash, setTrash] = useState(false);
  const [uploads, setUploads] = useState(0);
  const uploadBusy = (busy: boolean) => setUploads(n => Math.max(0, n + (busy ? 1 : -1)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function reload() {
    setLoading(true); setError('');
    try { setPosts(await api.getPosts(trash)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, [trash]);
  useEffect(() => { api.getMediaLibrary({ activeOnly: true }).then(setMedia).catch(() => {}); }, []);
  useEffect(() => { api.getProducts().then(setProducts).catch(() => {}); }, []);
  useEffect(() => { api.getForms().then(setDynamicForms).catch(() => {}); }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const update = (key: keyof Post, value: string) => { setForm(old => old ? { ...old, [key]: value } : old); setDirty(true); };
  const applyGeneratedVideoThumbnail = (url: string) => {
    setForm(old => {
      if (!old || old.cover) return old;
      return {
        ...old,
        cover: url,
        coverAlt: old.coverAlt || old.title || 'Thumbnail video',
      };
    });
    setDirty(true);
    setNotice('Đã tự tạo ảnh bìa từ frame đầu video.');
  };
  const applyContentType = (contentType: string) => {
    setForm(old => {
      if (!old) return old;
      return {
        ...old,
        contentType,
        category: contentType === 'policy' ? 'policy' : contentType === 'flash-sale' ? 'promotion' : old.category,
        flashSaleEndsAt: contentType === 'flash-sale' ? old.flashSaleEndsAt || null : old.flashSaleEndsAt,
      };
    });
    setDirty(true);
  };
  const edit = (post: Post) => { setForm({ ...post }); setDirty(false); setError(''); setNotice(''); setTab('content'); };
  const generatePostSeo = () => {
    if (!form) return;
    const categoryLabel = categories[form.category] || 'bản tin';
    const plainContent = stripHtml(form.content);
    const source = form.excerpt.trim() || plainContent || `${form.title} từ Saximi Shop.`;
    const categoryPrefix: Record<string, string> = {
      news: 'Thông tin cần biết',
      event: 'Sự kiện',
      promotion: 'Khuyến mãi',
      policy: 'Chính sách',
    };
    const titleBase = form.title.trim() || categoryLabel;
    setForm(old => old ? {
      ...old,
      slug: old.slug || slugify(titleBase),
      seoTitle: truncateText(`${categoryPrefix[old.category] || categoryLabel}: ${titleBase}`, 60),
      seoDescription: truncateText(`${source} Cập nhật từ Saximi Shop, dễ theo dõi và phù hợp nhu cầu mua sắm của khách hàng.`, 158),
      excerpt: old.excerpt || truncateText(source, 220),
    } : old);
    setDirty(true);
  };
  const field = (key: keyof Post, title: string, max?: number) => <label className="grid gap-1.5 text-sm"><span>{title}</span><input className={inputClass} value={String(form?.[key] || '')} maxLength={max} onChange={e => update(key, e.target.value)} required={key === 'title'} /></label>;
  const toggleProduct = (id: number) => {
    setForm(old => {
      if (!old) return old;
      const current = old.productIds || [];
      return { ...old, productIds: current.includes(id) ? current.filter(item => item !== id) : [...current, id].slice(0, 24) };
    });
    setDirty(true);
  };
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!form || saving) return;
    if (uploads) { setError('Vui lòng đợi media tải lên hoàn tất.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const saved = form.id ? await api.updatePost(form.id, form) : await api.createPost(form);
      setForm(saved); setDirty(false); setNotice(saved.status === 'published' ? 'Bài viết đã được xuất bản.' : 'Đã lưu bài viết.');
      setPosts(old => [saved, ...old.filter(p => p.id !== saved.id)]);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }
  const activeContentType = form?.contentType || 'article';
  const activeTypeDetails = contentTypeDetails[activeContentType] || contentTypeDetails.article;
  if (form) return <form onSubmit={save} className="space-y-5 max-w-6xl mx-auto p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className={buttonClass} disabled={saving} onClick={() => { if (!dirty || confirm('Bỏ các thay đổi chưa lưu?')) setForm(null); }}><ArrowLeft size={18} />Danh sách bài viết</button><div className="flex flex-wrap gap-2">{form.id && form.status === 'published' && !dirty && <a className={buttonClass} href={`/news/${form.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={16} />Xem bài</a>}<button disabled={saving} className={`${buttonClass} bg-cyan-400 text-slate-950 font-semibold`}><Save size={18} />{saving ? 'Đang lưu…' : 'Lưu bài viết'}</button></div></div>
    {error && <p role="alert" className="text-rose-300">{error}</p>}{notice && <p role="status" className="text-emerald-300">{notice}</p>}
    <h2 className="text-xl font-semibold">{form.id ? 'Chỉnh sửa bài viết' : 'Bài viết mới'}</h2>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">{field('title', 'Tiêu đề', 200)}
        <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <label className="grid gap-1.5 text-sm"><span>Định dạng bài viết</span><select className={inputClass} value={activeContentType} onChange={e => applyContentType(e.target.value)}>{
            Object.entries(contentTypes).map(([key, value]) => <option key={key} value={key}>{value}</option>)
          }</select></label>
          <div className={`rounded-xl border p-3 text-sm ${activeTypeDetails.tone}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">{activeTypeDetails.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-white">{activeTypeDetails.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{activeTypeDetails.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">{activeTypeDetails.checklist.map(item => <span key={item} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">{item}</span>)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-b border-slate-700 pb-2" role="tablist" aria-label="Soạn bài">{[['content', 'Nội dung'], ['seo', 'SEO']].map(([id, name]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`${buttonClass} ${tab === id ? 'bg-slate-700' : ''}`} onClick={() => setTab(id)}>{name}</button>)}</div>
        {tab === 'content' ? <div className="space-y-5">
          <label className="grid gap-1.5 text-sm">Tóm tắt<textarea className={inputClass} rows={3} maxLength={500} value={form.excerpt} onChange={e => update('excerpt', e.target.value)} /></label>
          {(activeContentType === 'video' || activeContentType === 'short-video') && <div className="space-y-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-indigo-100"><Video size={16} />Cấu hình video {activeContentType === 'short-video' ? 'dọc 9:16' : 'ngang 16:9'}</div><VideoUpload value={form.videoUrl || ''} onChange={url => update('videoUrl', url)} onBusyChange={uploadBusy} onThumbnailGenerated={applyGeneratedVideoThumbnail} /><label className="grid gap-1.5 text-sm"><span>Hoặc dùng đường dẫn video</span><input className={inputClass} value={form.videoUrl || ''} onChange={e => update('videoUrl', e.target.value)} placeholder="https://...mp4 hoặc /api/uploads/video.mp4" /></label><p className="text-xs leading-5 text-slate-400">Có thể tải video từ máy tính hoặc dùng link MP4/WebM/MOV hợp lệ. Nếu bài chưa có ảnh bìa, video tải lên sẽ tự lấy frame đầu làm thumbnail. Nội dung bên dưới dùng để thêm mô tả, CTA, form hoặc voucher.</p></div>}
          {activeContentType === 'policy' && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm leading-6 text-slate-300"><div className="flex items-center gap-2 font-bold text-emerald-100"><ShieldCheck size={16} />Khung chính sách</div><p className="mt-2">Nên chia nội dung theo các mục: phạm vi áp dụng, quyền lợi, điều kiện, quy trình xử lý và thông tin liên hệ. Khi xuất bản, bài sẽ dùng schema WebPage phù hợp SEO.</p></div>}
          {activeContentType === 'flash-sale' && <div className="space-y-3 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-rose-200"><Flame size={16} />Cấu hình Flash Sale</div><label className="grid gap-1.5 text-sm"><span>Thời gian kết thúc countdown</span><input type="datetime-local" className={inputClass} value={toDatetimeLocal(form.flashSaleEndsAt)} onChange={e => update('flashSaleEndsAt', e.target.value)} /></label><div className="grid max-h-80 gap-2 overflow-y-auto pr-1 md:grid-cols-2">{products.map(product => <label key={product.id} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-2 text-sm"><input type="checkbox" className="mt-1" checked={(form.productIds || []).includes(product.id)} onChange={() => toggleProduct(product.id)} /><img src={product.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="min-w-0"><strong className="line-clamp-2">{product.name}</strong><span className="block text-xs text-slate-400">{Number(product.price).toLocaleString('vi-VN')}đ</span></span></label>)}</div></div>}
          <RichTextEditor onUploadingChange={uploadBusy} label="Nội dung bài viết" value={form.content} onChange={value => update('content', value)} minHeight={400} snippets={dynamicForms.filter(item => item.isActive && item.placements.includes('news')).map(item => ({ id: String(item.id), label: `Form: ${item.title}`, html: `<p>[[form:${item.id}]]</p><p><br></p>` }))} />
          {activeContentType === 'custom-code' && <label className="grid gap-1.5 text-sm"><span>Custom Code an toàn</span><textarea className={`${inputClass} font-mono`} rows={10} value={form.customCode || ''} onChange={e => update('customCode', e.target.value)} placeholder="<div style=&quot;text-align:center&quot;>...</div>" /><span className="text-xs text-slate-400">Hỗ trợ HTML/CSS/media đã được lọc. Không chạy script hoặc thuộc tính sự kiện.</span></label>}
        </div> : <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4"><div><p className="text-sm font-semibold text-white">SEO tự động cho bản tin</p><p className="mt-1 text-xs text-slate-400">Tạo slug, tiêu đề, mô tả theo chuyên mục và nội dung đang soạn.</p></div><button type="button" onClick={generatePostSeo} className={`${buttonClass} border-cyan-500/50 bg-cyan-400 text-slate-950 font-semibold`}><Sparkles size={16} />Tự tạo SEO</button></div>{field('slug', 'Đường dẫn (để trống để tạo từ tiêu đề)', 160)}{field('seoTitle', 'Tiêu đề SEO', 200)}<label className="grid gap-1.5 text-sm">Mô tả SEO<textarea className={inputClass} rows={4} maxLength={320} value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)} /></label><p className="text-xs text-slate-400">{form.seoDescription.length}/320 ký tự</p><div className="border-t border-slate-700 pt-4"><p className="text-xs text-slate-400">Xem trước kết quả tìm kiếm</p><p className="text-lg text-cyan-300 mt-2 break-words">{form.seoTitle || form.title || 'Tiêu đề bài viết'}</p><p className="text-sm text-slate-400 break-all">/news/{form.slug || 'duong-dan-bai-viet'}</p><p className="text-sm mt-1 break-words">{form.seoDescription || form.excerpt}</p></div></div>}
        <VoucherPicker value={form.voucherIds || []} onChange={voucherIds => { setForm(old => old ? { ...old, voucherIds } : old); setDirty(true); }} />
      </div>
      <aside className="space-y-5 min-w-0">
        <label className="grid gap-1.5 text-sm">Trạng thái<select className={inputClass} value={form.status} onChange={e => update('status', e.target.value)}>{Object.entries(states).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm">Chuyên mục<select className={inputClass} value={form.category} onChange={e => update('category', e.target.value)}>{Object.entries(categories).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        {form.contentType && <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300"><div className="flex items-center gap-2 font-semibold text-white">{form.contentType.includes('video') ? <Video size={16} /> : form.contentType === 'flash-sale' ? <Flame size={16} /> : <Sparkles size={16} />}{contentTypes[form.contentType] || 'Bài viết'}</div></div>}
        {field('author', 'Tên đơn vị đăng bài', 100)}
        <label className="grid gap-1.5 text-sm">
          <span>Ngày đăng</span>
          <input type="datetime-local" className={inputClass} value={toDatetimeLocal(form.publishedAt)} onChange={e => update('publishedAt', e.target.value)} />
          <span className="text-xs leading-5 text-slate-400">Có thể chỉnh ngày đăng để sắp xếp bản tin, sự kiện, chính sách hoặc khuyến mãi.</span>
        </label>
        <ImageField label="Ảnh bìa" value={form.cover} onChange={url => update('cover', url)} onBusyChange={uploadBusy} library={
          <select aria-label="Chọn từ kho ảnh" className={inputClass} value="" onChange={e => { const item = media.find(m => String(m.id) === e.target.value); if (item) { update('cover', item.url); update('coverAlt', item.altText || item.title); } }}><option value="">Chọn ảnh</option>{media.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        } />
        {field('coverAlt', 'Mô tả ảnh (alt)', 200)}
        {form.publishedAt && <p className="text-xs text-slate-400">Đang đặt ngày: {new Date(form.publishedAt).toLocaleString('vi-VN')}</p>}
      </aside>
    </div>
  </form>;
  const changePost = async (post: Post, restore: boolean) => {
    if (!post.id || saving) return;
    if (!restore && !confirm('Chuyển bài viết vào Thùng rác? Bài sẽ được gỡ khỏi website và có thể khôi phục.')) return;
    setSaving(true); setError(''); setNotice('');
    try {
      if (restore) await api.restorePost(post.id);
      else await api.deletePost(post.id);
      setPosts(old => old.filter(p => p.id !== post.id));
      setNotice(restore ? 'Đã khôi phục bài viết thành bản nháp.' : 'Đã chuyển bài viết vào Thùng rác.');
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };
  return <PostWall posts={posts} loading={loading} error={error} notice={notice} busy={saving}
    trash={trash} onTrash={setTrash} onEdit={edit} onCreate={() => { setTrash(false); edit(empty); }}
    onDelete={post => void changePost(post, false)} onRestore={post => void changePost(post, true)}
    onRetry={reload} />;
}
