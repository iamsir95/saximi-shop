import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, CheckCircle, CreditCard, X, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { AffiliateProfile, FinancialSettlement } from '../types';

export const SettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<FinancialSettlement[]>([]);
  const [presidents, setPresidents] = useState<AffiliateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [presidentId, setPresidentId] = useState('');
  const [amount, setAmount] = useState('1000000');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [referenceCode, setReferenceCode] = useState(`BANK-${Date.now().toString().slice(-6)}`);

  const loadData = async () => {
    try {
      setLoading(true);
      const [setData, affData] = await Promise.all([
        api.getSettlements(),
        api.getAffiliates(),
      ]) as [FinancialSettlement[], AffiliateProfile[]];
      setSettlements(setData);
      const pres = affData.filter((a) => a.role === 'PRESIDENT');
      setPresidents(pres);
      if (pres.length > 0) {
        setPresidentId(pres[0].userId);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presidentId || !amount) return;

    try {
      await api.createSettlement({
        presidentId,
        amount: parseFloat(amount),
        paymentMethod,
        referenceCode,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi đối soát thanh toán');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const editSettlement = async (settlement: FinancialSettlement) => {
    const settlementAmount = Number(window.prompt('Số tiền đối soát', String(settlement.settlementAmount)) || settlement.settlementAmount);
    const referenceCode = window.prompt('Mã giao dịch / ghi chú', settlement.referenceCode) || settlement.referenceCode;
    await api.updateSettlement(settlement.id, { settlementAmount, referenceCode });
    loadData();
  };

  const deleteSettlement = async (settlement: FinancialSettlement) => {
    if (!window.confirm(`Xóa phiếu đối soát #${settlement.id}?`)) return;
    await api.deleteSettlement(settlement.id);
    loadData();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Đối Soát Tài Chính & Thanh Toán Công Nợ Gối Đầu
          </h3>
          <p className="text-xs text-slate-400">Ghi nhận phiếu nộp tiền công nợ gối đầu từ Chủ tịch hội gửi về Công ty</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo Phiếu Nộp Tiền Mới</span>
        </button>
      </div>

      {/* Settlements Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải phiếu đối soát...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Mã phiếu</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Chủ tịch hội nộp tiền</th>
                  <th className="py-3.5 px-4">Hình thức thanh toán</th>
                  <th className="py-3.5 px-4">Số tiền nộp đối soát</th>
                  <th className="py-3.5 px-4 text-right">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">#{s.id}</td>
                    <td className="py-4 px-4 text-slate-400">
                      {new Date(s.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-4 px-4 font-bold text-white">{s.presidentName}</td>
                    <td className="py-4 px-4 text-slate-300">
                      <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono">
                        {s.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'} ({s.referenceCode})
                      </span>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-emerald-400">
                      {formatMoney(s.settlementAmount)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã duyệt & Khấu trừ công nợ
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => editSettlement(s)} className="mr-2 rounded-lg bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteSettlement(s)} className="rounded-lg bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20">
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

      {/* Settlement Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Tạo Phiếu Nộp Tiền Công Nợ Gối Đầu</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chọn Chủ tịch hội *</label>
                <select
                  value={presidentId}
                  onChange={(e) => setPresidentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {presidents.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số tiền thanh toán công nợ (VND) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-extrabold text-emerald-400"
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hình thức thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="TRANSFER">Chuyển khoản Ngân hàng</option>
                  <option value="CASH">Tiền mặt trực tiếp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mã giao dịch / Ghi chú</label>
                <input
                  type="text"
                  required
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30"
                >
                  Xác Nhận Nộp Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
