import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Users,
  Clock,
  CheckCircle2,
  Truck,
  TrendingUp,
  BellRing,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { api, setupAdminWebPushNotifications } from '../api';
import { Order, Stats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'enabled' | 'permission-only' | 'denied' | 'unsupported' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, ordersData] = await Promise.all([
          api.getStats(),
          api.getOrders(),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const enableAdminPush = async () => {
    setPushStatus('loading');
    setPushMessage('');
    try {
      const result = await setupAdminWebPushNotifications();
      setPushStatus(result === 'subscribed' ? 'enabled' : result);
      if (result === 'subscribed') {
        setPushMessage('Đã bật thông báo đẩy cho thiết bị admin này.');
      } else if (result === 'permission-only') {
        setPushMessage('Trình duyệt đã cho phép thông báo, nhưng máy chủ chưa sẵn sàng gửi push nền.');
      } else if (result === 'denied') {
        setPushMessage('Trình duyệt đang chặn quyền thông báo. Hãy mở quyền trong cài đặt trình duyệt.');
      } else {
        setPushMessage('Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo đẩy.');
      }
    } catch (error: any) {
      setPushStatus('error');
      setPushMessage(error?.message || 'Không thể bật thông báo đẩy cho admin.');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng doanh thu"
          value={formatMoney(stats?.totalRevenue || 0)}
          change="12.5%"
          isPositive={true}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-700"
        />
        <StatsCard
          title="Tổng đơn hàng"
          value={stats?.totalOrders || 0}
          change="8.2%"
          isPositive={true}
          icon={ShoppingCart}
          gradient="from-blue-500 to-indigo-700"
        />
        <StatsCard
          title="Sản phẩm đang bán"
          value={stats?.totalProducts || 0}
          icon={ShoppingBag}
          gradient="from-purple-500 to-pink-700"
        />
        <StatsCard
          title="Khách hàng"
          value={stats?.totalUsers || 1}
          change="15.3%"
          isPositive={true}
          icon={Users}
          gradient="from-amber-500 to-orange-700"
        />
      </div>

      {(stats?.pendingOtpCount || 0) > 0 && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-5 shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-black text-white">Có OTP đăng nhập đang chờ gửi</div>
                <div className="mt-1 text-sm text-slate-300">
                  {stats?.pendingOtpCount} khách vừa yêu cầu đăng nhập/đăng ký. Vào mục OTP Zalo để copy mã và gửi cho khách.
                </div>
              </div>
            </div>
            <span className="inline-flex w-fit rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
              Cần xử lý
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black text-white">Thông báo đẩy cho admin</div>
              <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                Nhận cảnh báo khi có đơn hàng mới, OTP đăng nhập, phản hồi form khách hàng và lượt đăng nhập quản trị.
              </div>
              {pushMessage && (
                <div className={`mt-2 text-sm font-semibold ${
                  pushStatus === 'enabled' ? 'text-emerald-300' : pushStatus === 'error' || pushStatus === 'denied' ? 'text-rose-300' : 'text-amber-300'
                }`}>
                  {pushMessage}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={enableAdminPush}
            disabled={pushStatus === 'loading'}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BellRing className="h-4 w-4" />
            {pushStatus === 'loading' ? 'Đang bật...' : pushStatus === 'enabled' ? 'Đã bật thông báo' : 'Bật thông báo'}
          </button>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Đơn chờ xử lý</div>
            <div className="text-2xl font-bold text-white">{stats?.pendingOrders || 0}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Đang vận chuyển</div>
            <div className="text-2xl font-bold text-white">{stats?.shippingOrders || 0}</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Đã hoàn thành</div>
            <div className="text-2xl font-bold text-white">{stats?.completedOrders || 0}</div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Đơn hàng gần đây
            </h3>
            <p className="text-xs text-slate-400">Các đơn hàng mới nhất đặt từ Zalo Mini App</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn</th>
                <th className="py-3.5 px-4">Ngày Đặt</th>
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Tổng Tiền</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-semibold text-blue-400">#{order.id}</td>
                  <td className="py-4 px-4 text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-4 px-4 font-medium text-white">
                    {order.delivery?.name || 'Khách hàng Zalo'}
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400">{formatMoney(order.total)}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'shipping'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {order.status === 'completed'
                        ? 'Hoàn thành'
                        : order.status === 'shipping'
                        ? 'Đang giao'
                        : 'Chờ xử lý'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
