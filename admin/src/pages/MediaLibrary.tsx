import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Edit2,
  Eye,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../api';
import { MediaAsset, MediaPurpose, MediaSourceType } from '../types';
import { ImageUpload } from '../components/ImageUpload';

const PURPOSE_OPTIONS: Array<{ value: MediaPurpose | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả mục đích' },
  { value: 'PRODUCT_GALLERY', label: 'Kho ảnh sản phẩm' },
  { value: 'CATEGORY', label: 'Danh mục' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'STATION', label: 'Điểm nhận hàng' },
  { value: 'DELIVERY_PROOF', label: 'Bằng chứng giao hàng' },
  { value: 'GENERAL', label: 'Ảnh chung' },
];

const SOURCE_OPTIONS: Array<{ value: MediaSourceType | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả nguồn' },
  { value: 'PRODUCT', label: 'Sản phẩm' },
  { value: 'CATEGORY', label: 'Danh mục' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'STATION', label: 'Điểm nhận hàng' },
  { value: 'DELIVERY', label: 'Giao hàng' },
  { value: 'MANUAL', label: 'Thủ công' },
];

function purposeLabel(purpose: MediaPurpose) {
  return PURPOSE_OPTIONS.find((item) => item.value === purpose)?.label || purpose;
}

function sourceLabel(sourceType: MediaSourceType) {
  return SOURCE_OPTIONS.find((item) => item.value === sourceType)?.label || sourceType;
}

export const MediaLibraryPage: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [purpose, setPurpose] = useState<MediaPurpose | 'all'>('all');
  const [sourceType, setSourceType] = useState<MediaSourceType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [formPurpose, setFormPurpose] = useState<MediaPurpose>('GENERAL');
  const [tags, setTags] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await api.getMediaLibrary({
        q,
        purpose: purpose === 'all' ? undefined : purpose,
        sourceType: sourceType === 'all' ? undefined : sourceType,
      });
      setAssets(data);
    } catch (err) {
      console.error(err);
      alert('Không tải được thư viện ảnh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose, sourceType]);

  const summary = useMemo(() => {
    return {
      total: assets.length,
      active: assets.filter((asset) => asset.isActive).length,
      productGallery: assets.filter((asset) => asset.purpose === 'PRODUCT_GALLERY').length,
      manual: assets.filter((asset) => asset.sourceType === 'MANUAL').length,
    };
  }, [assets]);

  const openCreateModal = () => {
    setEditingAsset(null);
    setTitle('');
    setUrl('');
    setAltText('');
    setFormPurpose('GENERAL');
    setTags('');
    setIsActive(true);
    setUploading(false);
    setInputMode('upload');
    setIsModalOpen(true);
  };

  const openEditModal = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setTitle(asset.title);
    setUrl(asset.url);
    setAltText(asset.altText || '');
    setFormPurpose(asset.purpose);
    setTags(asset.tags.join(', '));
    setIsActive(asset.isActive);
    setUploading(false);
    setInputMode('url');
    setIsModalOpen(true);
  };

  const handleCopy = async (asset: MediaAsset) => {
    await navigator.clipboard.writeText(asset.url);
    alert(`Đã sao chép URL: ${asset.title}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      alert('Vui lòng đợi ảnh tải lên hoàn tất.');
      return;
    }
    const payload = {
      title,
      url,
      altText,
      purpose: formPurpose,
      sourceType: editingAsset?.sourceType || 'MANUAL',
      sourceId: editingAsset?.sourceId,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      isActive,
    };

    try {
      if (editingAsset) {
        await api.updateMediaAsset(editingAsset.id, payload);
      } else {
        await api.createMediaAsset(payload);
      }
      setIsModalOpen(false);
      loadAssets();
    } catch (err: any) {
      alert(err.message || 'Không lưu được ảnh');
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Xóa ảnh "${asset.title}" khỏi thư viện?`)) return;
    try {
      await api.deleteMediaAsset(asset.id);
      loadAssets();
    } catch (err: any) {
      alert(err.message || 'Không xóa được ảnh');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng ảnh', value: summary.total, color: 'text-blue-300' },
          { label: 'Đang dùng', value: summary.active, color: 'text-emerald-300' },
          { label: 'Kho sản phẩm', value: summary.productGallery, color: 'text-purple-300' },
          { label: 'Ảnh thủ công', value: summary.manual, color: 'text-amber-300' },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
            <div className="text-xs text-slate-400 font-semibold uppercase">{item.label}</div>
            <div className={`text-3xl font-black mt-2 ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col xl:flex-row gap-3 justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAssets()}
                placeholder="Tìm theo tên, tag, URL..."
                className="w-full bg-slate-900 border border-slate-700 text-sm rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as MediaPurpose | 'all')}
              className="bg-slate-900 border border-slate-700 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {PURPOSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as MediaSourceType | 'all')}
              className="bg-slate-900 border border-slate-700 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={loadAssets}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 hover:border-blue-500"
            >
              <RefreshCw className="w-4 h-4" />
              Lọc
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm Ảnh</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Đang tải thư viện ảnh...</div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            Không tìm thấy ảnh phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/60">
                <div className="aspect-square bg-slate-950 relative">
                  <img src={asset.url} alt={asset.altText || asset.title} className="w-full h-full object-cover" />
                  <div className="absolute left-3 top-3 px-2 py-1 rounded-full bg-black/55 backdrop-blur text-[10px] font-bold text-white">
                    #{asset.id}
                  </div>
                  {!asset.isActive && (
                    <div className="absolute right-3 top-3 px-2 py-1 rounded-full bg-rose-500/80 text-[10px] font-bold text-white">
                      Tắt
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="font-bold text-white text-sm line-clamp-2">{asset.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">{asset.url}</div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] border border-blue-500/20">
                      {purposeLabel(asset.purpose)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] border border-purple-500/20">
                      {sourceLabel(asset.sourceType)}
                    </span>
                  </div>

                  {asset.tags.length > 0 && (
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                      <Tags className="w-3 h-3 mt-0.5 flex-none" />
                      <span className="line-clamp-2">{asset.tags.slice(0, 5).join(', ')}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex justify-center"
                      title="Xem ảnh"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleCopy(asset)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex justify-center"
                      title="Sao chép URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(asset)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 flex justify-center"
                      title="Sửa ảnh"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex justify-center"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editingAsset ? 'Chỉnh Sửa Ảnh' : 'Thêm Ảnh Vào Thư Viện'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tiêu đề *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Ảnh cận cảnh sản phẩm"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold text-slate-400">Nguồn hình ảnh *</label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1">
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                        inputMode === 'upload' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Tải lên
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('url')}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                        inputMode === 'url' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Dùng URL
                    </button>
                  </div>
                </div>

                {inputMode === 'upload' ? (
                  <div className="space-y-2">
                    <ImageUpload
                      label={uploading ? 'Đang tải ảnh…' : 'Chọn ảnh từ máy tính'}
                      onBusyChange={setUploading}
                      onUploaded={(uploadedUrl) => {
                        setUrl(uploadedUrl);
                        if (!title.trim()) setTitle('Ảnh tải lên');
                        if (!tags.trim()) setTags('upload, media');
                      }}
                    />
                    <p className="text-[11px] text-slate-500">Hỗ trợ JPG, PNG, WebP tối đa 5 MB. Ảnh sẽ được nén tối ưu và lưu vào thư viện.</p>
                  </div>
                ) : (
                  <input
                    required
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                )}

                {url && (
                  <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 sm:grid-cols-[96px_minmax(0,1fr)]">
                    <img src={url} alt={title || 'Ảnh xem trước'} className="h-24 w-24 rounded-xl border border-slate-700 object-cover" />
                    <div className="min-w-0 self-center">
                      <p className="text-xs font-semibold text-slate-300">Ảnh đã chọn</p>
                      <p className="mt-1 break-all text-[11px] text-slate-500">{url}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alt text</label>
                <input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Mô tả ngắn cho ảnh"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mục đích</label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value as MediaPurpose)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {PURPOSE_OPTIONS.filter((item) => item.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-end gap-2 cursor-pointer text-sm text-slate-300 pb-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded"
                  />
                  <span>Đang sử dụng</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="product, banner, campaign"
                />
              </div>

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
                  disabled={uploading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30"
                >
                  {uploading ? 'Đang tải ảnh…' : 'Lưu Ảnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
