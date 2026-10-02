import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { MediaLibraryPage } from './pages/MediaLibrary';
import { Categories } from './pages/Categories';
import { AffiliatesPage } from './pages/Affiliates';
import { ConsignmentPage } from './pages/Consignment';
import { DeliveriesPage } from './pages/Deliveries';
import { AuditLogsPage } from './pages/AuditLogs';
import { SettlementsPage } from './pages/Settlements';
import { AnalyticsPage } from './pages/Analytics';
import { BannersPage } from './pages/Banners';
import { StationsPage } from './pages/Stations';
import { CouponsPage } from './pages/Coupons';
import { Orders } from './pages/Orders';
import { UsersPage } from './pages/Users';
import { StaffPage } from './pages/Staff';
import { OtpOutboxPage } from './pages/OtpOutbox';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';
import { PostsPage } from './pages/Posts';
import { FormsPage } from './pages/Forms';
import { getAuthToken } from './api';
import { PullToRefresh } from './components/PullToRefresh';

const ADMIN_TABS = new Set([
  'posts',
  'forms',
  'dashboard',
  'analytics',
  'orders',
  'products',
  'media-library',
  'categories',
  'affiliates',
  'consignments',
  'settlements',
  'deliveries',
  'audit-logs',
  'banners',
  'stations',
  'coupons',
  'users',
  'otp-outbox',
  'staff',
  'settings',
]);

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab && ADMIN_TABS.has(tab)) {
        setActiveTab(tab);
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'posts': return 'Bản tin & chính sách';
      case 'forms': return 'Form bản tin';
      case 'dashboard':
        return 'Tổng quan';
      case 'analytics':
        return 'Báo cáo KPI';
      case 'orders':
        return 'Đơn hàng';
      case 'products':
        return 'Sản phẩm';
      case 'media-library':
        return 'Thư viện ảnh';
      case 'categories':
        return 'Danh mục';
      case 'affiliates':
        return 'Hội viên & đại lý';
      case 'consignments':
        return 'Hàng gối đầu';
      case 'settlements':
        return 'Đối soát';
      case 'deliveries':
        return 'Vận chuyển';
      case 'audit-logs':
        return 'Nhật ký hệ thống';
      case 'banners':
        return 'Banner';
      case 'stations':
        return 'Điểm nhận hàng';
      case 'coupons':
        return 'Voucher';
      case 'users':
        return 'Khách hàng';
      case 'otp-outbox':
        return 'OTP Zalo OA';
      case 'staff':
        return 'Nhân sự';
      case 'settings':
        return 'Cài đặt';
      default:
        return 'Quản trị';
    }
  };

  return (
    <div className="admin-shell flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="admin-main flex-1 flex flex-col min-w-0">
        <Header title={getTitle()} />
        <main className="admin-content flex-1 overflow-y-auto">
          {activeTab === 'posts' && <PostsPage />}
          {activeTab === 'forms' && <FormsPage />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'orders' && <Orders />}
          {activeTab === 'products' && <Products />}
          {activeTab === 'media-library' && <MediaLibraryPage />}
          {activeTab === 'categories' && <Categories />}
          {activeTab === 'affiliates' && <AffiliatesPage />}
          {activeTab === 'consignments' && <ConsignmentPage />}
          {activeTab === 'settlements' && <SettlementsPage />}
          {activeTab === 'deliveries' && <DeliveriesPage />}
          {activeTab === 'audit-logs' && <AuditLogsPage />}
          {activeTab === 'banners' && <BannersPage />}
          {activeTab === 'stations' && <StationsPage />}
          {activeTab === 'coupons' && <CouponsPage />}
          {activeTab === 'users' && <UsersPage />}
          {activeTab === 'otp-outbox' && <OtpOutboxPage />}
          {activeTab === 'staff' && <StaffPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
        <PullToRefresh targetSelector=".admin-content" />
      </div>
    </div>
  );
}

export default App;
