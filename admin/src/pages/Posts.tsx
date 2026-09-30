import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit2, Save, ExternalLink, FileText, Search } from 'lucide-react';
import { api } from '../api';
import { RichTextEditor } from '../components/RichTextEditor';
import { MediaAsset } from '../types';
import { ImageField } from '../components/ImageField';
import { VoucherPicker } from '../components/VoucherPicker';
import { PostWall } from '../components/PostWall';

export type Post = { voucherIds?: number[]; deletedAt?: string; id?: string; title: string; slug: string; category: string; status: string; excerpt: string; content: string; cover: string; coverAlt: string; author: string; seoTitle: string; seoDescription: string; publishedAt?: string | null; updatedAt?: string };
const empty: Post = { title: '', slug: '', category: 'news', status: 'draft', excerpt: '', content: '', cover: '', coverAlt: '', author: 'Saximi Shop', seoTitle: '', seoDescription: '' };
const categories: Record<string, string> = { news: 'Thông tin cần biết', event: 'Sự kiện', promotion: 'Khuyến mãi', policy: 'Chính sách' };
const states: Record<string, string> = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Đã lưu trữ' };
const inputClass = 'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white';
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm';

export function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
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
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const update = (key: keyof Post, value: string) => { setForm(old => old ? { ...old, [key]: value } : old); setDirty(true); };
  const edit = (post: Post) => { setForm({ ...post }); setDirty(false); setError(''); setNotice(''); setTab('content'); };
  const field = (key: keyof Post, title: string, max?: number) => <label className="grid gap-1.5 text-sm"><span>{title}</span><input className={inputClass} value={String(form?.[key] || '')} maxLength={max} onChange={e => update(key, e.target.value)} required={key === 'title'} /></label>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!form || saving) return;
    if (uploads) { setError('Vui lòng đợi ảnh tải lên hoàn tất.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const saved = form.id ? await api.updatePost(form.id, form) : await api.createPost(form);
      setForm(saved); setDirty(false); setNotice(saved.status === 'published' ? 'Bài viết đã được xuất bản.' : 'Đã lưu bài viết.');
      setPosts(old => [saved, ...old.filter(p => p.id !== saved.id)]);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }
  if (form) return <form onSubmit={save} className="space-y-5 max-w-6xl mx-auto p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className={buttonClass} disabled={saving} onClick={() => { if (!dirty || confirm('Bỏ các thay đổi chưa lưu?')) setForm(null); }}><ArrowLeft size={18} />Danh sách bài viết</button><div className="flex flex-wrap gap-2">{form.id && form.status === 'published' && !dirty && <a className={buttonClass} href={`/news/${form.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={16} />Xem bài</a>}<button disabled={saving} className={`${buttonClass} bg-cyan-400 text-slate-950 font-semibold`}><Save size={18} />{saving ? 'Đang lưu…' : 'Lưu bài viết'}</button></div></div>
    {error && <p role="alert" className="text-rose-300">{error}</p>}{notice && <p role="status" className="text-emerald-300">{notice}</p>}
    <h2 className="text-xl font-semibold">{form.id ? 'Chỉnh sửa bài viết' : 'Bài viết mới'}</h2>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">{field('title', 'Tiêu đề', 200)}
        <div className="flex gap-2 border-b border-slate-700 pb-2" role="tablist" aria-label="Soạn bài">{[['content', 'Nội dung'], ['seo', 'SEO']].map(([id, name]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`${buttonClass} ${tab === id ? 'bg-slate-700' : ''}`} onClick={() => setTab(id)}>{name}</button>)}</div>
        {tab === 'content' ? <div className="space-y-5"><label className="grid gap-1.5 text-sm">Tóm tắt<textarea className={inputClass} rows={3} maxLength={500} value={form.excerpt} onChange={e => update('excerpt', e.target.value)} /></label><RichTextEditor onUploadingChange={uploadBusy} label="Nội dung bài viết" value={form.content} onChange={value => update('content', value)} minHeight={400} /></div> : <div className="space-y-5">{field('slug', 'Đường dẫn (để trống để tạo từ tiêu đề)', 160)}{field('seoTitle', 'Tiêu đề SEO', 200)}<label className="grid gap-1.5 text-sm">Mô tả SEO<textarea className={inputClass} rows={4} maxLength={320} value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)} /></label><p className="text-xs text-slate-400">{form.seoDescription.length}/320 ký tự</p><div className="border-t border-slate-700 pt-4"><p className="text-xs text-slate-400">Xem trước kết quả tìm kiếm</p><p className="text-lg text-cyan-300 mt-2 break-words">{form.seoTitle || form.title || 'Tiêu đề bài viết'}</p><p className="text-sm text-slate-400 break-all">/news/{form.slug || 'duong-dan-bai-viet'}</p><p className="text-sm mt-1 break-words">{form.seoDescription || form.excerpt}</p></div></div>}
        <VoucherPicker value={form.voucherIds || []} onChange={voucherIds => { setForm(old => old ? { ...old, voucherIds } : old); setDirty(true); }} />
      </div>
      <aside className="space-y-5 min-w-0">
        <label className="grid gap-1.5 text-sm">Trạng thái<select className={inputClass} value={form.status} onChange={e => update('status', e.target.value)}>{Object.entries(states).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm">Chuyên mục<select className={inputClass} value={form.category} onChange={e => update('category', e.target.value)}>{Object.entries(categories).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        {field('author', 'Tên đơn vị đăng bài', 100)}
        <ImageField label="Ảnh bìa" value={form.cover} onChange={url => update('cover', url)} onBusyChange={uploadBusy} library={
          <select aria-label="Chọn từ kho ảnh" className={inputClass} value="" onChange={e => { const item = media.find(m => String(m.id) === e.target.value); if (item) { update('cover', item.url); update('coverAlt', item.altText || item.title); } }}><option value="">Chọn ảnh</option>{media.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        } />
        {field('coverAlt', 'Mô tả ảnh (alt)', 200)}
        {form.publishedAt && <p className="text-xs text-slate-400">Ngày đăng: {new Date(form.publishedAt).toLocaleString('vi-VN')}</p>}
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
