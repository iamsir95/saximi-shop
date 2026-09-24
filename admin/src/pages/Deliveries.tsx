import React, { useEffect, useState } from 'react';
import { Truck, Plus, CheckCircle, Clock, MapPin, Phone, User, X, Camera, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { InHouseDelivery, Order } from '../types';

export const DeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<InHouseDelivery[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dispatch Form
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);
  const [driverName, setDriverName] = useState('Nguyễn Văn Hùng');
  const [driverPhone, setDriverPhone] = useState('0988777666');
  const [vehicleNumber, setVehicleNumber] = useState('51D-998.88');

  const loadData = async () => {
    try {
      setLoading(true);
      const [delData, orderData] = await Promise.all([
        api.getDeliveries(),
        api.getOrders(),
      ]) as [InHouseDelivery[], Order[]];
      setDeliveries(delData);
      const pend = orderData.filter((o) => o.status === 'pending');
      setPendingOrders(pend);
      if (pend.length > 0) {
        setSelectedOrderId(pend[0].id);
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

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    try {
      await api.assignDelivery({
        orderId: selectedOrderId,
        driverName,
        driverPhone,
        vehicleNumber,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Phân công tài xế thất bại');
    }
  };

  const handleUpdateStatus = async (id: number, status: InHouseDelivery['deliveryStatus']) => {
    try {
      await api.updateDeliveryStatus(id, status);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật tiến độ giao hàng');
    }
  };

  const editDelivery = async (delivery: InHouseDelivery) => {
    const nextDriverName = window.prompt('Tên tài xế', delivery.driverName) || delivery.driverName;
    const nextDriverPhone = window.prompt('SĐT tài xế', delivery.driverPhone) || delivery.driverPhone;
    const nextVehicleNumber = window.prompt('Biển số xe', delivery.vehicleNumber) || delivery.vehicleNumber;
    await api.updateDelivery(delivery.id, {
      driverName: nextDriverName,
      driverPhone: nextDriverPhone,
      vehicleNumber: nextVehicleNumber,
    });
    loadData();
  };

  const deleteDelivery = async (delivery: InHouseDelivery) => {
    if (!window.confirm(`Xóa lịch vận chuyển đơn #${delivery.orderId}?`)) return;
    await api.deleteDelivery(delivery.id);
    loadData();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            Điều Phối Vận Chuyển Tự Thân (In-House Fleet Management)
          </h3>
          <p className="text-xs text-slate-400">Phân công Tài xế nội bộ Công ty đi giao hàng & Quản lý tiến độ giao vận</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={pendingOrders.length === 0}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          <span>Điều Phối Đơn Giao Mới</span>
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải lịch trình giao hàng...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Mã đơn</th>
                  <th className="py-3.5 px-4">Tài xế giao hàng</th>
                  <th className="py-3.5 px-4">Biển số xe</th>
                  <th className="py-3.5 px-4">Người nhận & Địa chỉ</th>
                  <th className="py-3.5 px-4">Trạng thái giao</th>
                  <th className="py-3.5 px-4 text-right">Cập nhật tiến độ</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-blue-400">#{del.orderId}</td>
                    <td className="py-4 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        {del.driverName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{del.driverPhone}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300 font-bold">
                      <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs">
                        {del.vehicleNumber}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{del.recipientName} ({del.recipientPhone})</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {del.recipientAddress}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          del.deliveryStatus === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : del.deliveryStatus === 'delivering'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {del.deliveryStatus === 'delivered'
                          ? 'Đã giao thành công'
                          : del.deliveryStatus === 'delivering'
                          ? 'Đang trên đường giao'
                          : 'Đã phân công xe'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {del.deliveryStatus !== 'delivered' ? (
                        <button
                          onClick={() => handleUpdateStatus(del.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận Đã giao
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium">Hoàn tất</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => editDelivery(del)} className="mr-2 rounded-lg bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteDelivery(del)} className="rounded-lg bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20">
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

      {/* Dispatch Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Điều Phối Giao Hàng Cho Đội Xe</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chọn Đơn hàng cần giao *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                >
                  {pendingOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Đơn #{o.id} - {o.delivery?.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên Tài xế Công ty *</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Nhập tên tài xế"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">SĐT Tài xế *</label>
                <input
                  type="tel"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Biển số xe giao hàng *</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 uppercase font-mono"
                  placeholder="51D-123.45"
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
                  Phân Công Giao Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
