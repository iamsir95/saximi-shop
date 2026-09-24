import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';
import { BannerItem } from '../types';

export const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await api.getBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    try {
      await api.createBanner({ imageUrl, title: title || 'Banner Khuyến Mãi', isActive: true });
      setIsModalOpen(false);
      setImageUrl('');
      setTitle('');
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo banner');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      try {
        await api.deleteBanner(id);
        loadBanners();
      } catch (err: any) {
        alert(err.message || 'Xóa thất bại');
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            Quản Lý Banner Khuyến Mãi
          </h3>
          <p className="text-xs text-slate-400">Danh sách ảnh banner hiển thị trên Slider Trang chủ Zalo Mini App</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Banner Mới</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải banner...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="h-44 overflow-hidden bg-slate-900 relative">
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-400 border border-slate-700">
                  Đang hiển thị
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{b.title || `Banner #${b.id}`}</h4>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{b.imageUrl}</p>
                </div>

                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-medium transition-colors"
                  title="Xóa banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Thêm Banner Khuyến Mãi Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tiêu đề Banner</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Siêu Sale Mùa Hè 50%"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Hình ảnh Banner *</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30"
                >
                  Lưu Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
