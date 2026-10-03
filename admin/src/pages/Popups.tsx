import React, { useEffect, useState } from 'react';
import { Edit2, Megaphone, Plus, Trash2, X } from 'lucide-react';
import { api } from '../api';
import { ImageField } from '../components/ImageField';
import { PopupCampaign } from '../types';

const emptyPopup = (): Partial<PopupCampaign> => ({
  title: '',
  description: '',
  imageUrl: '',
  layout: 'center',
  ctaLabel: 'Xem ngay',
  ctaUrl: '',
  placement: 'home',
  trigger: 'on-load',
  delaySeconds: 0,
  frequency: 'session',
  isActive: true,
  sortOrder: 1,
});

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400';
const labels = {
  placement: { home: 'Trang chủ', news: 'Bản tin', product: 'Sản phẩm', cart: 'Giỏ hàng', all: 'Toàn website' },
  layout: { center: 'Giữa màn hình', bottom: 'Sheet dưới', fullscreen: 'Toàn màn hình' },
  frequency: { session: 'Một lần mỗi phiên', daily: 'Một lần mỗi ngày', always: 'Luôn hiển thị' },
};

export function PopupsPage() {
  const [items, setItems] = useState<PopupCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [form, setForm] = useState<Partial<PopupCampaign> | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await api.getPopups());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const update = (key: keyof PopupCampaign, value: unknown) => {
    setForm((old) => old ? { ...old, [key]: value } : old);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || uploads > 0) return;
    setSaving(true);
    setError('');
    try {
      if (form.id) await api.updatePopup(form.id, form);
      else await api.createPopup(form);
      setForm(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: PopupCampaign) => {
    if (!confirm(`Xóa popup "${item.title}"?`)) return;
    setSaving(true);
    try {
      await api.deletePopup(item.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Megaphone className="h-5 w-5 text-cyan-300" />
            Popup chiến dịch
          </h3>
          <p className="text-xs text-slate-400">Tùy biến nội dung, ảnh, CTA, vị trí hiển thị và tần suất popup trên giao diện khách hàng.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...emptyPopup(), sortOrder: items.length + 1 })}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
        >
          <Plus className="h-5 w-5" />
          Thêm popup
        </button>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-300">{error}</p>}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải popup...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 py-16 text-center text-slate-400">
          Chưa có popup chiến dịch.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover" />}
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.description || 'Không có mô tả'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                    {item.isActive ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-lg bg-slate-800 px-2 py-1">{labels.placement[item.placement]}</span>
                  <span className="rounded-lg bg-slate-800 px-2 py-1">{labels.layout[item.layout]}</span>
                  <span className="rounded-lg bg-slate-800 px-2 py-1">{labels.frequency[item.frequency]}</span>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  <button type="button" className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300" onClick={() => setForm(item)} title="Sửa popup">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-lg bg-rose-500/10 p-2 text-rose-300" onClick={() => remove(item)} title="Xóa popup">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-3xl space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">{form.id ? 'Chỉnh sửa popup' : 'Popup mới'}</h3>
              <button type="button" onClick={() => setForm(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400 md:col-span-2">Tên popup
                <input className={inputClass} value={form.title || ''} onChange={(e) => update('title', e.target.value)} required />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400 md:col-span-2">Mô tả
                <textarea className={inputClass} rows={3} value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
              </label>
              <div className="md:col-span-2">
                <ImageField label="Ảnh popup" value={form.imageUrl || ''} onChange={(url) => update('imageUrl', url)} onBusyChange={(busy) => setUploads((count) => Math.max(0, count + (busy ? 1 : -1)))} />
              </div>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Bố cục
                <select className={inputClass} value={form.layout || 'center'} onChange={(e) => update('layout', e.target.value)}>
                  <option value="center">Giữa màn hình</option>
                  <option value="bottom">Sheet dưới</option>
                  <option value="fullscreen">Toàn màn hình</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Vị trí hiển thị
                <select className={inputClass} value={form.placement || 'home'} onChange={(e) => update('placement', e.target.value)}>
                  <option value="home">Trang chủ</option>
                  <option value="news">Bản tin</option>
                  <option value="product">Sản phẩm</option>
                  <option value="cart">Giỏ hàng</option>
                  <option value="all">Toàn website</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Nút CTA
                <input className={inputClass} value={form.ctaLabel || ''} onChange={(e) => update('ctaLabel', e.target.value)} placeholder="Xem ngay" />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Liên kết CTA
                <input className={inputClass} value={form.ctaUrl || ''} onChange={(e) => update('ctaUrl', e.target.value)} placeholder="/news/slug hoặc https://..." />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Tần suất
                <select className={inputClass} value={form.frequency || 'session'} onChange={(e) => update('frequency', e.target.value)}>
                  <option value="session">Một lần mỗi phiên</option>
                  <option value="daily">Một lần mỗi ngày</option>
                  <option value="always">Luôn hiển thị</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Trễ sau khi vào trang (giây)
                <input type="number" min={0} max={60} className={inputClass} value={form.delaySeconds || 0} onChange={(e) => update('delaySeconds', Number(e.target.value))} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-400">Thứ tự
                <input type="number" min={1} className={inputClass} value={form.sortOrder || 1} onChange={(e) => update('sortOrder', Number(e.target.value))} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm font-bold text-white">
                Hiển thị popup
                <input type="checkbox" checked={form.isActive !== false} onChange={(e) => update('isActive', e.target.checked)} className="h-5 w-5 accent-cyan-400" />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setForm(null)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800">Hủy</button>
              <button disabled={saving || uploads > 0} className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">
                {uploads > 0 ? 'Đang tải ảnh...' : saving ? 'Đang lưu...' : 'Lưu popup'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
