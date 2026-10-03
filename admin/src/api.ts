const API_BASE = (((import.meta as any).env?.VITE_ADMIN_API_URL as string | undefined) || '/api/admin').replace(/\/$/, '');

export type AdminPushSetupResult =
  | 'unsupported'
  | 'denied'
  | 'permission-only'
  | 'subscribed';

export function getAuthToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function setAdminUser(user: unknown) {
  localStorage.setItem('admin_user', JSON.stringify(user || null));
}

export function getAdminUser(): any | null {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || 'null');
  } catch {
    return null;
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthToken();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed');
  }

  return res.json();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function setupAdminWebPushNotifications(): Promise<AdminPushSetupResult> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return permission === 'denied' ? 'denied' : 'permission-only';
  }

  const registration = await navigator.serviceWorker.register('/saximi-sw.js');
  await navigator.serviceWorker.ready;

  if (!('PushManager' in window)) {
    registration.showNotification('Saximi shop Admin', {
      body: 'Trình duyệt đã bật thông báo, nhưng chưa hỗ trợ push nền.',
      icon: '/icon.png',
    });
    return 'permission-only';
  }

  const config = await request('/web-push/config') as {
    enabled: boolean;
    publicKey?: string;
  };

  if (!config.enabled || !config.publicKey) {
    registration.showNotification('Saximi shop Admin', {
      body: 'Máy chủ chưa cấu hình VAPID để gửi thông báo đẩy.',
      icon: '/icon.png',
    });
    return 'permission-only';
  }

  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    }));

  await api.subscribeAdminWebPush(subscription);
  return 'subscribed';
}

export const api = {
  getPosts: (trash = false) => request(`/posts${trash ? '?trash=true' : ''}`),
  deletePost: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),
  restorePost: (id: string) => request(`/posts/${id}/restore`, { method: 'POST' }),
  uploadImage: (data: string, name: string) => request('/uploads', { method: 'POST', body: JSON.stringify({ data, name }) }),
  createPost: (data: unknown) => request('/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: string, data: unknown) => request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  login: (username: string, password: string) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getStats: () => request('/stats'),
  getProducts: () => request('/products'),
  createProduct: (data: any) =>
    request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: any) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/categories'),
  createCategory: (data: any) =>
    request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request(`/categories/${id}`, { method: 'DELETE' }),
  getBanners: () => request('/banners'),
  createBanner: (data: any) =>
    request('/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id: number, data: any) =>
    request(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderBanners: (ids: number[]) =>
    request('/banners/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  deleteBanner: (id: number) => request(`/banners/${id}`, { method: 'DELETE' }),
  getMediaLibrary: (params: { q?: string; purpose?: string; sourceType?: string; activeOnly?: boolean } = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value));
    });
    const query = search.toString();
    return request(`/media-library${query ? `?${query}` : ''}`);
  },
  createMediaAsset: (data: any) =>
    request('/media-library', { method: 'POST', body: JSON.stringify(data) }),
  updateMediaAsset: (id: number, data: any) =>
    request(`/media-library/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMediaAsset: (id: number) => request(`/media-library/${id}`, { method: 'DELETE' }),
  getStations: () => request('/stations'),
  createStation: (data: any) =>
    request('/stations', { method: 'POST', body: JSON.stringify(data) }),
  updateStation: (id: number, data: any) =>
    request(`/stations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStation: (id: number) => request(`/stations/${id}`, { method: 'DELETE' }),
  getCoupons: () => request('/coupons'),
  createCoupon: (data: any) =>
    request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  deleteCoupon: (id: number) => request(`/coupons/${id}`, { method: 'DELETE' }),
  getAffiliates: () => request('/affiliates'),
  createAffiliate: (data: any) =>
    request('/affiliates', { method: 'POST', body: JSON.stringify(data) }),
  updateAffiliate: (userId: string, data: any) =>
    request(`/affiliates/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAffiliate: (userId: string) => request(`/affiliates/${userId}`, { method: 'DELETE' }),
  assignAffiliateCommission: (userId: string, data: { commissionLabel: string; rate: number; tierLevel?: 1 | 2 | 3; levelName?: string; parentAffiliateId?: string }) =>
    request(`/affiliates/${userId}/commission`, { method: 'PATCH', body: JSON.stringify(data) }),
  getConsignments: () => request('/consignments'),
  allocateConsignment: (presidentId: string, productId: number, quantity: number) =>
    request('/consignments/allocate', {
      method: 'POST',
      body: JSON.stringify({ presidentId, productId, quantity }),
    }),
  updateConsignment: (id: number, data: any) =>
    request(`/consignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConsignment: (id: number) => request(`/consignments/${id}`, { method: 'DELETE' }),
  getDeliveries: () => request('/deliveries'),
  assignDelivery: (data: { orderId: number; driverName: string; driverPhone: string; vehicleNumber: string }) =>
    request('/deliveries/assign', { method: 'POST', body: JSON.stringify(data) }),
  updateDelivery: (id: number, data: any) =>
    request(`/deliveries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDelivery: (id: number) => request(`/deliveries/${id}`, { method: 'DELETE' }),
  updateDeliveryStatus: (id: number, status: string, proofImage?: string) =>
    request(`/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, proofImage }),
    }),
  getAuditLogs: () => request('/audit-logs'),
  getSettlements: () => request('/settlements'),
  createSettlement: (data: { presidentId: string; amount: number; paymentMethod: string; referenceCode: string }) =>
    request('/settlements', { method: 'POST', body: JSON.stringify(data) }),
  updateSettlement: (id: number, data: any) =>
    request(`/settlements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSettlement: (id: number) => request(`/settlements/${id}`, { method: 'DELETE' }),
  getCommissions: () => request('/commissions'),
  getOrders: () => request('/orders'),
  updateOrderStatus: (id: number, status: string, paymentStatus?: string) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paymentStatus }),
    }),
  deleteOrder: (id: number) => request(`/orders/${id}`, { method: 'DELETE' }),
  getUsers: () => request('/users'),
  updateUser: (id: string, data: any) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  getSettings: () => request('/settings'),
  updateSettings: (data: any) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getAuthSessions: () => request('/auth-sessions'),
  revokeAuthSession: (id: string) => request(`/auth-sessions/${id}`, { method: 'DELETE' }),
  getForms: () => request('/forms'),
  createForm: (data: any) =>
    request('/forms', { method: 'POST', body: JSON.stringify(data) }),
  updateForm: (id: number, data: any) =>
    request(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteForm: (id: number) => request(`/forms/${id}`, { method: 'DELETE' }),
  getFormSubmissions: () => request('/form-submissions'),
  updateFormSubmissionStatus: (id: number, status: string) =>
    request(`/form-submissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getOtpOutbox: () => request('/otp-outbox'),
  markOtpSent: (id: string) => request(`/otp-outbox/${id}/sent`, { method: 'PATCH' }),
  deleteOtpOutboxItem: (id: string) => request(`/otp-outbox/${id}`, { method: 'DELETE' }),
  subscribeAdminWebPush: (subscription: PushSubscription) =>
    request('/web-push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      }),
    }),
  testAdminWebPush: (message?: string) =>
    request('/web-push/test', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  getStaff: () => request('/staff'),
  saveStaff: (data: any) =>
    request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaffStatus: (id: number, status: string) =>
    request(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteStaff: (id: number) => request(`/staff/${id}`, { method: 'DELETE' }),
};
