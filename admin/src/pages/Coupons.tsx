import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tag, X, Percent } from 'lucide-react';
import { api } from '../api';
import { Coupon } from '../types';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [minOrderAmount, setMinOrderAmount] = useState('100000');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    try {
      await api.createCoupon({
        code: code.toUpperCase().trim(),
        discountPercent: parseFloat(discountPercent),
        minOrderAmount: parseFloat(minOrderAmount),
        expiryDate,
        isActive: true,
      });
      setIsModalOpen(false);
      setCode('');
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo mã giảm giá');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Xóa mã giảm giá này?')) {
      try {
        await api.deleteCoupon(id);
        loadCoupons();
      } catch (err: any) {
        alert(err.message || 'Xóa thất bại');
      }
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-400" />
            Mã Giảm Giá & Voucher Khuyến Mãi (Coupons)
          </h3>
          <p className="text-xs text-slate-400">Tạo mã ưu đãi chiết khấu % đơn hàng cho khách áp dụng khi thanh toán</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo Mã Ưu Đãi Mới</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải mã ưu đãi...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-lg text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-xl">
                  {c.code}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Giảm {c.discountPercent}%
                </span>
              </div>

              <div className="my-4 space-y-1 text-xs text-slate-400">
                <div>Đơn tối thiểu: <span className="text-white font-semibold">{formatMoney(c.minOrderAmount)}</span></div>
                <div>Hạn sử dụng: <span className="text-slate-300 font-medium">{c.expiryDate}</span></div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
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
              <h3 className="text-xl font-bold text-white">Tạo Mã Ưu Đãi Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mã Coupon (Code) *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 uppercase font-mono tracking-wider"
                  placeholder="KM2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chiết khấu (%) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Đơn tối thiểu (VND)</label>
                  <input
                    type="number"
                    required
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ngày hết hạn</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
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
                  Lưu Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
