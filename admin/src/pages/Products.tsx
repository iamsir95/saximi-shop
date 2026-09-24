import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Tags, FileText, Sparkles } from 'lucide-react';
import { api } from '../api';
import { Category, Product } from '../types';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [image, setImage] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [detail, setDetail] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [attributesText, setAttributesText] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [seoArticle, setSeoArticle] = useState('');
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);

  const parseAttributes = (value: string) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.includes('|') ? '|' : ':';
        const [rawName, ...rawValue] = line.split(separator);
        return {
          name: rawName.trim(),
          value: rawValue.join(separator).trim(),
        };
      })
      .filter((item) => item.name && item.value);

  const serializeAttributes = (product: Product) =>
    (product.attributes || [])
      .map((item) => `${item.name}: ${item.value}`)
      .join('\n');

  const loadProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setImage('');
    setImageUrls('');
    setDetail('');
    setPromoDescription('');
    setAttributesText('');
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setSeoSlug('');
    setSeoArticle('');
    setIsFlashSale(false);
    setIsRecommended(false);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setCategoryId(product.categoryId);
    setImage(product.image);
    setImageUrls((product.images || []).map((item) => item.url).join('\n'));
    setDetail(product.detail || '');
    setPromoDescription(product.promoDescription || '');
    setAttributesText(serializeAttributes(product));
    setSeoTitle(product.seo?.title || '');
    setSeoDescription(product.seo?.description || '');
    setSeoKeywords(product.seo?.keywords || '');
    setSeoSlug(product.seo?.slug || '');
    setSeoArticle(product.seo?.article || '');
    setIsFlashSale(!!product.isFlashSale);
    setIsRecommended(!!product.isRecommended);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const galleryUrls = imageUrls
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);
    const primaryImage = image || galleryUrls[0] || '/icon.png';
    const shouldPrependPrimary =
      galleryUrls.length > 0 &&
      primaryImage !== editingProduct?.image &&
      !galleryUrls.includes(primaryImage);
    const allImageUrls =
      galleryUrls.length > 0
        ? shouldPrependPrimary
          ? [primaryImage, ...galleryUrls]
          : galleryUrls
        : [primaryImage];
    const payload = {
      name,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      categoryId,
      image: primaryImage,
      images: allImageUrls.map((url, index) => ({
        id: editingProduct ? `${editingProduct.id}-${index + 1}` : `new-${index + 1}`,
        url,
        label: index === 0 ? 'Ảnh chính' : index === 1 ? 'Cận cảnh' : `Ảnh ${index + 1}`,
        kind: index === 0 ? 'MAIN' : index === 1 ? 'DETAIL' : 'COLLECTION',
        sortOrder: index + 1,
      })),
      detail,
      promoDescription: promoDescription.trim() || undefined,
      attributes: parseAttributes(attributesText),
      seo: {
        title: seoTitle.trim() || undefined,
        description: seoDescription.trim() || undefined,
        keywords: seoKeywords.trim() || undefined,
        slug: seoSlug.trim() || undefined,
        article: seoArticle.trim() || undefined,
      },
      isFlashSale,
      isRecommended,
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setIsModalOpen(false);
      loadProductsAndCategories();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await api.deleteProduct(id);
        loadProductsAndCategories();
      } catch (err: any) {
        alert(err.message || 'Xóa thất bại');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-sm rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Sản Phẩm Mới</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải sản phẩm...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Hình ảnh</th>
                  <th className="py-3.5 px-4">Tên sản phẩm</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Giá bán</th>
                  <th className="py-3.5 px-4">Đặc điểm</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredProducts.map((product) => {
                  const cat = categories.find((c) => c.id === product.categoryId);
                  return (
                    <tr key={product.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700"
                          />
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                            {product.images?.length || 1} ảnh
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{product.name}</td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2.5 py-1 bg-slate-900 rounded-lg text-xs font-medium border border-slate-700">
                          {cat?.name || 'Khác'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formatMoney(product.price)}
                        {product.originalPrice && (
                          <span className="text-xs text-slate-500 line-through block font-normal">
                            {formatMoney(product.originalPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {product.isFlashSale && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded border border-rose-500/30 font-medium">
                              Flash Sale
                            </span>
                          )}
                          {product.isRecommended && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded border border-amber-500/30 font-medium">
                              Gợi ý
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Sửa sản phẩm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Thông tin bán hàng
                </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Táo Envy Mỹ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Giá bán (VND) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="99000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Giá gốc (nếu giảm giá)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="120000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Danh mục sản phẩm *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    Album ảnh sản phẩm
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Hình Ảnh Chính</label>
                    <div className="relative">
                      <ImageIcon className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kho ảnh sản phẩm chuyên nghiệp</label>
                    <textarea
                      rows={6}
                      value={imageUrls}
                      onChange={(e) => setImageUrls(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder={'Mỗi dòng một URL ảnh\nhttps://...\nhttps://...'}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Website sẽ hiển thị album dạng slide trượt ngang theo đúng thứ tự ảnh.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Tags className="w-4 h-4 text-emerald-400" />
                    Thuộc tính & khuyến mãi
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mô tả ngắn chương trình khuyến mãi</label>
                    <textarea
                      rows={3}
                      value={promoDescription}
                      onChange={(e) => setPromoDescription(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Ví dụ: Mua hôm nay giảm 15%, tặng kèm freeship cho đơn từ 2 sản phẩm."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Thuộc tính sản phẩm</label>
                    <textarea
                      rows={6}
                      value={attributesText}
                      onChange={(e) => setAttributesText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder={'Mỗi dòng một thuộc tính\nXuất xứ: Việt Nam\nKhối lượng: 500g\nHạn sử dụng: 12 tháng'}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Hỗ trợ định dạng “Tên: Giá trị” hoặc “Tên | Giá trị”.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Editor nội dung chuẩn SEO
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">SEO title</label>
                    <input
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Tiêu đề SEO khoảng 50-60 ký tự"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Đường dẫn SEO</label>
                    <input
                      value={seoSlug}
                      onChange={(e) => setSeoSlug(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="san-pham-ban-chay"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Meta description</label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Mô tả ngắn 140-160 ký tự để tối ưu hiển thị tìm kiếm."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Từ khóa SEO</label>
                  <input
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="saximi shop, sản phẩm khuyến mãi, hội viên"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mô tả sản phẩm</label>
                  <textarea
                    rows={4}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Nhập thông tin chi tiết..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nội dung bài viết SEO</label>
                  <textarea
                    rows={8}
                    value={seoArticle}
                    onChange={(e) => setSeoArticle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm leading-6 focus:outline-none focus:border-blue-500"
                    placeholder={'Viết nội dung bán hàng chuẩn SEO...\n- Lợi ích nổi bật\n- Cách sử dụng\n- Vì sao nên mua tại Saximi shop'}
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={isFlashSale}
                    onChange={(e) => setIsFlashSale(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded"
                  />
                  <span>Bật Flash Sale</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={isRecommended}
                    onChange={(e) => setIsRecommended(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded"
                  />
                  <span>Sản phẩm gợi ý</span>
                </label>
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
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
