import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../api';
import { BannerItem } from '../types';
import { ImageField } from '../components/ImageField';

export const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [mobileAspectRatio, setMobileAspectRatio] = useState<'wide' | 'mobile-4-6'>('wide');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkEnabled, setLinkEnabled] = useState(true);
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const onUploadingChange = (busy: boolean) => setUploads((count) => Math.max(0, count + (busy ? 1 : -1)));
  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400';

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await api.getBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
      alert('Không tải được banner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setImageUrl('');
    setMobileImageUrl('');
    setMobileAspectRatio('wide');
    setTitle('');
    setLinkUrl('');
    setLinkEnabled(true);
    setOpenInNewTab(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: BannerItem) => {
    setEditingBanner(banner);
    setImageUrl(banner.imageUrl);
    setMobileImageUrl(banner.mobileImageUrl || '');
    setMobileAspectRatio(banner.mobileAspectRatio || 'wide');
    setTitle(banner.title || '');
    setLinkUrl(banner.linkUrl || '');
    setLinkEnabled(banner.linkEnabled !== false);
    setOpenInNewTab(banner.openInNewTab === true);
    setIsActive(banner.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploads) {
      alert('Vui lòng đợi ảnh banner tải lên hoàn tất.');
      return;
    }
    if (!imageUrl.trim()) return;

    setSaving(true);
    const payload = {
      imageUrl: imageUrl.trim(),
      mobileImageUrl: mobileImageUrl.trim() || undefined,
      mobileAspectRatio,
      title: title.trim() || 'Banner khuyến mãi',
      linkUrl: linkUrl.trim() || undefined,
      linkEnabled,
      openInNewTab,
      isActive,
    };

    try {
      if (editingBanner) {
        await api.updateBanner(editingBanner.id, payload);
      } else {
        await api.createBanner(payload);
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Không lưu được banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    try {
      await api.deleteBanner(id);
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại');
    }
  };

  const moveBanner = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= banners.length) return;
    const next = [...banners];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setBanners(next);
    try {
      await api.reorderBanners(next.map((banner) => banner.id));
    } catch (err: any) {
      alert(err.message || 'Không sắp xếp được banner');
      loadBanners();
    }
  };

  const toggleBanner = async (banner: BannerItem) => {
    try {
      await api.updateBanner(banner.id, { ...banner, isActive: banner.isActive === false });
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Không cập nhật được trạng thái banner');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-300" />
            Quản lý banner trang chủ
          </h3>
          <p className="text-xs text-slate-400">Thêm ảnh, chỉnh đường dẫn, bật/tắt và sắp xếp thứ tự hiển thị trên slider.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm banner</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải banner...</div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 py-16 text-center text-slate-400">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          Chưa có banner. Hãy thêm banner đầu tiên cho trang chủ.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl hover:border-slate-600 transition-all"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900">
                <img src={banner.imageUrl} alt={banner.title || `Banner #${banner.id}`} className="w-full h-full object-cover" />
                <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                  Thứ tự {index + 1}
                </div>
                <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ${
                  banner.isActive !== false ? 'bg-emerald-500/85 text-white' : 'bg-slate-950/70 text-slate-300'
                }`}>
                  {banner.isActive !== false ? 'Đang hiển thị' : 'Đang tắt'}
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <h4 className="text-sm font-bold text-white">{banner.title || `Banner #${banner.id}`}</h4>
                  <p className="mt-1 truncate text-xs text-slate-400">{banner.imageUrl}</p>
                  {banner.mobileImageUrl && <p className="mt-1 text-xs font-semibold text-cyan-300">Có ảnh mobile {banner.mobileAspectRatio === 'mobile-4-6' ? '4:6' : 'ngang'}</p>}
                  {banner.linkUrl && (
                    <a href={banner.linkUrl} target="_blank" rel="noreferrer" className={`mt-2 inline-flex max-w-full items-center gap-1 text-xs font-semibold ${banner.linkEnabled === false ? 'text-slate-500' : 'text-cyan-300'}`}>
                      <LinkIcon className="h-3.5 w-3.5 flex-none" />
                      <span className="truncate">{banner.linkUrl}</span>
                      {banner.linkEnabled === false && <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">Tắt chuyển hướng</span>}
                      {banner.linkEnabled !== false && banner.openInNewTab && <span className="shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-200">Tab mới</span>}
                      <ExternalLink className="h-3.5 w-3.5 flex-none" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2 border-t border-slate-700/70 pt-3">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveBanner(index, -1)}
                    className="rounded-lg bg-slate-900 p-2 text-slate-300 hover:text-white disabled:opacity-35"
                    title="Đưa lên"
                  >
                    <ArrowUp className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === banners.length - 1}
                    onClick={() => moveBanner(index, 1)}
                    className="rounded-lg bg-slate-900 p-2 text-slate-300 hover:text-white disabled:opacity-35"
                    title="Đưa xuống"
                  >
                    <ArrowDown className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(banner)}
                    className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300 hover:bg-cyan-500/20"
                    title="Sửa banner"
                  >
                    <Edit2 className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBanner(banner)}
                    className="rounded-lg bg-amber-500/10 px-2 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                    title="Bật/tắt nhanh"
                  >
                    Bật/Tắt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    className="rounded-lg bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
                    title="Xóa banner"
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">{editingBanner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tiêu đề banner</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: Siêu sale cuối tuần"
                />
              </div>

              <ImageField label="Ảnh banner" value={imageUrl} onChange={setImageUrl} onBusyChange={onUploadingChange} />

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_190px]">
                <ImageField label="Ảnh banner mobile" value={mobileImageUrl} onChange={setMobileImageUrl} onBusyChange={onUploadingChange} />
                <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
                  Tỷ lệ trên mobile
                  <select className={inputClass} value={mobileAspectRatio} onChange={(e) => setMobileAspectRatio(e.target.value as 'wide' | 'mobile-4-6')}>
                    <option value="wide">Ngang mặc định</option>
                    <option value="mobile-4-6">Dọc 4:6</option>
                  </select>
                  <span className="text-[11px] leading-4 text-slate-500">Dùng 4:6 cho hero mobile dẫn đến bài viết/sản phẩm.</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Đường dẫn khi bấm banner</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://... hoặc /product/5, /news"
                />
              </div>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <span>
                  <span className="block text-sm font-bold text-white">Bật chuyển hướng khi bấm banner</span>
                  <span className="mt-1 block text-xs text-slate-400">Tắt mục này nếu chỉ muốn banner là hình ảnh, không dẫn đến trang khác.</span>
                </span>
                <input type="checkbox" checked={linkEnabled} onChange={(e) => setLinkEnabled(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <span>
                  <span className="block text-sm font-bold text-white">Mở chuyển hướng trong tab mới</span>
                  <span className="mt-1 block text-xs text-slate-400">Phù hợp khi banner dẫn ra website khác hoặc muốn giữ khách ở trang hiện tại.</span>
                </span>
                <input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} disabled={!linkEnabled} className="h-5 w-5 accent-cyan-400 disabled:opacity-40" />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <span>
                  <span className="block text-sm font-bold text-white">Hiển thị banner</span>
                  <span className="mt-1 block text-xs text-slate-400">Tắt khi muốn giữ banner trong admin nhưng chưa hiển thị trên website.</span>
                </span>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || uploads > 0}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-sm shadow-lg shadow-cyan-600/20 disabled:opacity-60"
                >
                  {uploads > 0 ? 'Đang tải ảnh...' : saving ? 'Đang lưu...' : 'Lưu banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
