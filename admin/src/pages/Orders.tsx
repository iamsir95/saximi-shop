import React, { useEffect, useState } from 'react';
import { ShoppingCart, Eye, CheckCircle, Truck, Clock, XCircle, X, CreditCard } from 'lucide-react';
import { api } from '../api';
import { Order } from '../types';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'shipping' | 'completed' | 'cancelled'>('all');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: Order['status']) => {
    try {
      const current = orders.find((order) => order.id === id);
      const nextPaymentStatus =
        newStatus === 'completed'
          ? 'success'
          : newStatus === 'cancelled'
          ? 'failed'
          : current?.paymentStatus;

      await api.updateOrderStatus(id, newStatus, nextPaymentStatus);
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          paymentStatus: nextPaymentStatus || selectedOrder.paymentStatus,
        });
      }
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleUpdatePaymentStatus = async (order: Order, paymentStatus: Order['paymentStatus']) => {
    try {
      await api.updateOrderStatus(order.id, order.status, paymentStatus);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, paymentStatus });
      }
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Cập nhật thanh toán thất bại');
    }
  };

  const filteredOrders = orders.filter((o) => activeTab === 'all' || o.status === activeTab);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const paymentLabel = {
    pending: 'Chờ thanh toán',
    success: 'Đã thanh toán',
    failed: 'Thanh toán lỗi',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header & Status Filter Tabs */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              Quản Lý Đơn Hàng
            </h3>
            <p className="text-xs text-slate-400">Xem và cập nhật tiến độ xử lý đơn hàng từ Zalo Mini App</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-slate-700/50 pt-4">
          {[
            { id: 'all', label: 'Tất cả đơn', icon: ShoppingCart },
            { id: 'pending', label: 'Chờ xử lý', icon: Clock },
            { id: 'shipping', label: 'Đang giao', icon: Truck },
            { id: 'completed', label: 'Hoàn thành', icon: CheckCircle },
            { id: 'cancelled', label: 'Đã hủy', icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all' ? orders.length : orders.filter((o) => o.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách đơn hàng...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Mã đơn</th>
                  <th className="py-3.5 px-4">Ngày tạo</th>
                  <th className="py-3.5 px-4">Người nhận</th>
                  <th className="py-3.5 px-4">SĐT</th>
                  <th className="py-3.5 px-4">Tổng tiền</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Thanh toán</th>
                  <th className="py-3.5 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-blue-400">#{order.id}</td>
                    <td className="py-4 px-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-4 px-4 font-medium text-white">
                      {order.delivery?.name || 'Khách hàng Zalo'}
                    </td>
                    <td className="py-4 px-4 text-slate-400">{order.delivery?.phone || '0912345678'}</td>
                    <td className="py-4 px-4 font-bold text-emerald-400">{formatMoney(order.total)}</td>
                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        className={`text-xs font-semibold rounded-lg px-3 py-1.5 border focus:outline-none ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : order.status === 'shipping'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : order.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <option value="pending" className="bg-slate-900 text-amber-400">Chờ xử lý</option>
                        <option value="shipping" className="bg-slate-900 text-blue-400">Đang giao hàng</option>
                        <option value="completed" className="bg-slate-900 text-emerald-400">Hoàn thành</option>
                        <option value="cancelled" className="bg-slate-900 text-rose-400">Đã hủy</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleUpdatePaymentStatus(order, e.target.value as Order['paymentStatus'])}
                        className={`text-xs font-semibold rounded-lg px-3 py-1.5 border focus:outline-none ${
                          order.paymentStatus === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : order.paymentStatus === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        <option value="pending" className="bg-slate-900 text-slate-300">Chờ thanh toán</option>
                        <option value="success" className="bg-slate-900 text-emerald-400">Đã thanh toán</option>
                        <option value="failed" className="bg-slate-900 text-rose-400">Thanh toán lỗi</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 bg-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Chi Tiết Đơn Hàng <span className="text-blue-400 font-mono">#{selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Thời gian đặt: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Người nhận</div>
                <div className="text-sm font-bold text-white">{selectedOrder.delivery?.name || 'Khách hàng'}</div>
                <div className="text-xs text-slate-300 mt-1">{selectedOrder.delivery?.phone || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hình thức nhận hàng</div>
                <div className="text-sm font-medium text-white">
                  {selectedOrder.delivery?.type === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {selectedOrder.delivery?.address || 'Địa chỉ mặc định'}
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thanh toán</div>
                    <div className="text-sm font-bold text-white">{selectedOrder.paymentMethod || 'COD'}</div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedOrder.paymentStatus === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : selectedOrder.paymentStatus === 'failed'
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {paymentLabel[selectedOrder.paymentStatus]}
                </span>
              </div>
            </div>

            {/* Product Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sản phẩm trong đơn</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.image}
                        alt={item.product?.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">{item.product?.name}</div>
                        <div className="text-xs text-slate-400">
                          {formatMoney(item.product?.price || 0)} x {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">
                      {formatMoney((item.product?.price || 0) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Tổng thanh toán: </span>
                <span className="text-xl font-extrabold text-emerald-400">{formatMoney(selectedOrder.total)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
