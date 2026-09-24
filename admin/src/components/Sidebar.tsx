import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  Images,
  MapPin,
  Tag,
  UserCheck,
  Package,
  Truck,
  ShieldCheck,
  CreditCard,
  BarChart3,
  LogOut,
  Store,
  BriefcaseBusiness,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { clearAuthToken } from '../api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuGroups = [
  {
    title: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { id: 'analytics', label: 'KPI', icon: BarChart3 },
    ],
  },
  {
    title: 'Bán hàng',
    items: [
      { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
      { id: 'products', label: 'Sản phẩm', icon: ShoppingBag },
      { id: 'categories', label: 'Danh mục', icon: FolderTree },
      { id: 'coupons', label: 'Voucher', icon: Tag },
    ],
  },
  {
    title: 'Nội dung',
    items: [
      { id: 'media-library', label: 'Kho ảnh', icon: Images },
      { id: 'banners', label: 'Banner', icon: ImageIcon },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { id: 'stations', label: 'Điểm nhận', icon: MapPin },
      { id: 'deliveries', label: 'Vận chuyển', icon: Truck },
      { id: 'consignments', label: 'Gối đầu', icon: Package },
      { id: 'settlements', label: 'Đối soát', icon: CreditCard },
    ],
  },
  {
    title: 'Nhân sự',
    items: [
      { id: 'affiliates', label: 'Hội viên', icon: UserCheck },
      { id: 'users', label: 'Khách hàng', icon: Users },
      { id: 'otp-outbox', label: 'OTP Zalo', icon: MessageCircle },
      { id: 'staff', label: 'Nhân sự', icon: BriefcaseBusiness },
      { id: 'audit-logs', label: 'Nhật ký', icon: ShieldCheck },
      { id: 'settings', label: 'Cài đặt', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const handleLogout = () => {
    clearAuthToken();
    window.location.reload();
  };

  return (
    <aside className="admin-sidebar w-[236px] bg-slate-900/82 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="admin-brand px-4 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/16">
            <Store className="w-5 h-5" />
          </div>
          <div className="admin-brand-text">
            <h1 className="font-bold text-base text-white tracking-wide">Saximi shop</h1>
            <p className="text-[11px] text-slate-400 font-medium">Admin Console</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="admin-nav p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-132px)]">
          {menuGroups.map((group) => (
            <div key={group.title} className="admin-nav-group">
              <div className="admin-nav-group-title px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={item.label}
                      className={`admin-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-[13px] transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/6'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span className="admin-nav-label truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="admin-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-[13px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span className="admin-nav-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
