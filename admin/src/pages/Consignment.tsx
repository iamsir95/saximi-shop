import React, { useEffect, useState } from 'react';
import { Package, Plus, DollarSign, X, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { AffiliateProfile, ConsignmentStock, Product } from '../types';

export const ConsignmentPage: React.FC = () => {
  const [consignments, setConsignments] = useState<ConsignmentStock[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [presidentId, setPresidentId] = useState('');
  const [productId, setProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState('50');

  const loadData = async () => {
    try {
      setLoading(true);
      const [consData, affData, prodData] = await Promise.all([
        api.getConsignments(),
        api.getAffiliates(),
        api.getProducts(),
      ]) as [ConsignmentStock[], AffiliateProfile[], Product[]];
      setConsignments(consData);
      const presidentAffiliates = affData.filter((a) => a.role === 'PRESIDENT');
      setAffiliates(presidentAffiliates);
      setProducts(prodData);
      if (presidentAffiliates.length > 0) {
        setPresidentId(presidentAffiliates[0].userId);
      }
      if (prodData.length > 0) {
        setProductId(prodData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presidentId || !productId || !quantity) return;

    try {
      await api.allocateConsignment(presidentId, productId, parseInt(quantity));
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất hàng ứng trước');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalConsignmentDebt = consignments.reduce((sum, c) => sum + c.debtAmount, 0);

  const editConsignment = async (stock: ConsignmentStock) => {
    const allocatedQuantity = Number(window.prompt('Đã cấp', String(stock.allocatedQuantity)) || stock.allocatedQuantity);
    const soldQuantity = Number(window.prompt('Đã bán', String(stock.soldQuantity)) || stock.soldQuantity);
    const remainingQuantity = Number(window.prompt('Tồn còn lại', String(stock.remainingQuantity)) || stock.remainingQuantity);
    const debtAmount = Number(window.prompt('Công nợ gối đầu', String(stock.debtAmount)) || stock.debtAmount);
    await api.updateConsignment(stock.id, { allocatedQuantity, soldQuantity, remainingQuantity, debtAmount });
    loadData();
  };

  const deleteConsignment = async (stock: ConsignmentStock) => {
    if (!window.confirm(`Xóa gối đầu ${stock.productName} của ${stock.presidentName}?`)) return;
    await api.deleteConsignment(stock.id);
    loadData();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header & Total Debt Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Quản Lý Hàng Gối Đầu (Sản Phẩm Ứng Trước)
          </h3>
          <p className="text-xs text-slate-400">Xuất hàng gối đầu cho cấp Chủ tịch hội & theo dõi công nợ ứng trước</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-slate-900/80 border border-slate-700 px-4 py-2.5 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Tổng công nợ gối đầu</div>
            <div className="text-lg font-extrabold text-amber-400">{formatMoney(totalConsignmentDebt)}</div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Xuất Hàng Ứng Trước</span>
          </button>
        </div>
      </div>

      {/* Consignment Inventory Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách tồn kho gối đầu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Chủ tịch hội</th>
                  <th className="py-3.5 px-4">Sản phẩm gối đầu</th>
                  <th className="py-3.5 px-4">Đã cấp (Ứng trước)</th>
                  <th className="py-3.5 px-4">Đã bán qua tuyến</th>
                  <th className="py-3.5 px-4">Tồn kho còn lại</th>
                  <th className="py-3.5 px-4 text-right">Công nợ gối đầu</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {consignments.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{c.presidentName}</td>
                    <td className="py-4 px-4 text-slate-300 font-semibold">{c.productName}</td>
                    <td className="py-4 px-4 font-bold text-blue-400">{c.allocatedQuantity} hộp/sp</td>
                    <td className="py-4 px-4 font-bold text-emerald-400">{c.soldQuantity} sp</td>
                    <td className="py-4 px-4 font-bold text-amber-400">{c.remainingQuantity} sp</td>
                    <td className="py-4 px-4 text-right font-extrabold text-amber-400">
                      {formatMoney(c.debtAmount)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => editConsignment(c)} className="mr-2 rounded-lg bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteConsignment(c)} className="rounded-lg bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocate Stock Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Xuất Hàng Gối Đầu Cho Chủ Tịch Hội</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chọn Chủ tịch hội *</label>
                <select
                  value={presidentId}
                  onChange={(e) => setPresidentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {affiliates.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chọn Sản phẩm ứng trước *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({formatMoney(prod.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số lượng gối đầu (ứng trước) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: 50"
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
                  Xác Nhận Xuất Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
