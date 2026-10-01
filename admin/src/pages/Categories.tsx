import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, FolderTree, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import { Category } from '../types';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [showOnHome, setShowOnHome] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setImage('');
    setShowOnHome(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImage(cat.image);
    setShowOnHome(cat.showOnHome !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, image: image || '/icon.png', showOnHome };

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
      } else {
        await api.createCategory(payload);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await api.deleteCategory(id);
        loadCategories();
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
            <FolderTree className="w-5 h-5 text-blue-400" />
            Danh Mục Sản Phẩm
          </h3>
          <p className="text-xs text-slate-400">Quản lý các danh mục ngành hàng trên Zalo Mini App</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Danh Mục Mới</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải danh mục...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-xl group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-700 p-1 group-hover:scale-105 transition-transform"
                />
                <div>
                  <h4 className="font-bold text-white text-base">{cat.name}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">ID: #{cat.id}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        cat.showOnHome === false
                          ? 'bg-slate-700 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {cat.showOnHome === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {cat.showOnHome === false ? 'Ẩn trang chủ' : 'Hiện trang chủ'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
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
              <h3 className="text-xl font-bold text-white">
                {editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Nước giải khát"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Icon / Hình ảnh</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
                <span>
                  <span className="block text-sm font-bold text-white">Hiển thị ở trang chủ</span>
                  <span className="text-xs text-slate-400">Tắt mục này nếu chỉ muốn giữ danh mục trong hệ thống.</span>
                </span>
                <input
                  type="checkbox"
                  checked={showOnHome}
                  onChange={(e) => setShowOnHome(e.target.checked)}
                  className="h-5 w-5 accent-blue-500"
                />
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30"
                >
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
