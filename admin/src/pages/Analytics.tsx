import React, { useEffect, useState } from 'react';
import { Award, AlertTriangle, TrendingUp, DollarSign, Truck, Users } from 'lucide-react';
import { api } from '../api';
import { AffiliateProfile, Product, Stats } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, affData, prodData] = await Promise.all([
          api.getStats(),
          api.getAffiliates(),
          api.getProducts(),
        ]);
        setStats(statsData);
        setAffiliates(affData);
        setProducts(prodData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const lowStockProducts = products.filter(
    (p) => (p.stockQuantity ?? 0) <= (p.minStockLevel ?? 15)
  );

  const sortedAffiliates = [...affiliates].sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div className="p-8 space-y-8">
      {/* Executive Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-blue-300">Tổng doanh thu thực nhận</span>
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{formatMoney(stats?.totalRevenue || 0)}</div>
          <div className="text-xs text-blue-200 mt-2">Dữ liệu từ đơn hàng đã hoàn tất</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/60 to-orange-900/60 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-amber-300">Công nợ gối đầu đang treo</span>
            <TrendingUp className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {formatMoney(stats?.totalConsignmentDebt || 0)}
          </div>
          <div className="text-xs text-amber-200 mt-2">Tổng sản phẩm ứng trước chưa đối soát</div>
        </div>

        <div className="bg-gradient-to-br from-rose-900/60 to-pink-900/60 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-rose-300">Cảnh báo tồn kho an toàn</span>
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">
            {lowStockProducts.length} Sản phẩm
          </div>
          <div className="text-xs text-rose-200 mt-2">Cần nhập thêm vào Tổng Kho Trung Tâm</div>
        </div>
      </div>

      {/* Leaderboard & Low Stock Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KPI Leaderboard */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Bảng Xếp Hạng Doanh Số Chi Hội (KPI Leaderboard)
              </h3>
              <p className="text-xs text-slate-400">Vinh danh các Chi hội trưởng & Chủ tịch hội có doanh số cao nhất</p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedAffiliates.map((aff, idx) => (
              <div
                key={aff.userId}
                className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-yellow-500 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <img
                    src={aff.avatar}
                    alt={aff.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{aff.name}</div>
                    <div className="text-xs text-slate-400">
                      {aff.role === 'PRESIDENT' ? 'Chủ tịch hội' : 'Chi hội trưởng'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-blue-400">{formatMoney(aff.totalSales)}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    Ví HH: {formatMoney(aff.walletBalance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Cảnh Báo Tồn Kho Dưới Ngưỡng An Toàn
              </h3>
              <p className="text-xs text-slate-400">Các mặt hàng trong Tổng kho cần nhập bù số lượng gấp</p>
            </div>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="py-12 text-center text-emerald-400 font-semibold text-sm">
                ✅ Tất cả sản phẩm trong kho đều ở mức an toàn!
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-xs text-rose-300 font-medium">Giá: {formatMoney(p.price)}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-rose-500 text-white font-extrabold text-xs rounded-lg shadow">
                      Còn {p.stockQuantity} sp
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">Mức tối thiểu: {p.minStockLevel} sp</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
