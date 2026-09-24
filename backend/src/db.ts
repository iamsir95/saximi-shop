import fs from 'fs';
import path from 'path';

export interface Category {
  id: number;
  name: string;
  image: string;
}

export type ProductImageKind = 'MAIN' | 'DETAIL' | 'COLLECTION';

export interface ProductImage {
  id: string;
  url: string;
  label: string;
  kind: ProductImageKind;
  sortOrder: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductSeoContent {
  title?: string;
  description?: string;
  keywords?: string;
  slug?: string;
  article?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: ProductImage[];
  categoryId: number;
  detail?: string;
  promoDescription?: string;
  attributes?: ProductAttribute[];
  seo?: ProductSeoContent;
  sizes?: string[];
  colors?: string[];
  isFlashSale?: boolean;
  isRecommended?: boolean;
  stockQuantity?: number;
  minStockLevel?: number;
}

export interface Station {
  id: number;
  name: string;
  image: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  sourceType?: 'STORE' | 'PRESIDENT' | 'BRANCH_LEADER';
  affiliateId?: string;
  phone?: string;
  levelName?: string;
  presidentId?: string;
}

export interface BannerItem {
  id: number;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
  isActive: boolean;
}

export type MediaSourceType = 'PRODUCT' | 'CATEGORY' | 'BANNER' | 'STATION' | 'DELIVERY' | 'MANUAL';
export type MediaPurpose = 'PRODUCT_GALLERY' | 'CATEGORY' | 'BANNER' | 'STATION' | 'DELIVERY_PROOF' | 'GENERAL';

export interface MediaAsset {
  id: number;
  url: string;
  title: string;
  altText?: string;
  sourceType: MediaSourceType;
  sourceId?: string;
  purpose: MediaPurpose;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface PlatformSettings {
  shopName: string;
  brandColor: string;
  hotline: string;
  supportEmail: string;
  businessAddress: string;
  publicSiteUrl: string;
  zaloOaUrl: string;
  vietQrBankId: string;
  vietQrAccountNo: string;
  vietQrAccountName: string;
  sepayWebhookEnabled: boolean;
  sepayWebhookApiKey: string;
  commissionSettlementMode: 'ORDER_DISCOUNT' | 'MANUAL_PAYOUT';
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: string;
}

export type UserRole = 'CUSTOMER' | 'BRANCH_LEADER' | 'PRESIDENT';

export interface AffiliateProfile {
  userId: string;
  name: string;
  phone: string;
  address?: string;
  avatar: string;
  role: UserRole;
  location?: {
    lat: number;
    lng: number;
  };
  levelName?: string;
  tierLevel?: 1 | 2 | 3;
  commissionLabel?: string;
  parentAffiliateId?: string;
  presidentId?: string;
  referralCode: string;
  qrCodeUrl: string;
  directCommissionRate: number;
  overridingCommissionRate: number;
  walletBalance: number;
  totalSales: number;
}

export interface ConsignmentStock {
  id: number;
  presidentId: string;
  presidentName: string;
  productId: number;
  productName: string;
  allocatedQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  debtAmount: number;
}

export interface FinancialSettlement {
  id: number;
  presidentId: string;
  presidentName: string;
  settlementAmount: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  referenceCode: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userName: string;
  role: string;
  action: string;
  targetId?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export type StaffRole = 'ADMIN' | 'MANAGER' | 'WAREHOUSE' | 'DELIVERY' | 'ACCOUNTANT' | 'SUPPORT';
export type StaffStatus = 'active' | 'inactive';

export interface StaffMember {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  status: StaffStatus;
  department: string;
  managerId?: number | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRecord {
  id: number;
  orderId: number;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryRole: UserRole;
  amount: number;
  type: 'DIRECT_BRANCH_LEADER' | 'OVERRIDING_PRESIDENT' | 'TIER_DIRECT' | 'TIER_ONE_GLOBAL';
  commissionName?: string;
  commissionRate?: number;
  hierarchyPath?: string;
  status: 'pending' | 'available' | 'withdrawn';
  createdAt: string;
}

export interface AffiliatePortalSummary {
  affiliates: AffiliateProfile[];
  consignments: ConsignmentStock[];
  settlements: FinancialSettlement[];
  commissions: CommissionRecord[];
  branchesByPresident: Record<string, AffiliateProfile[]>;
  hierarchy: Array<{
    president: AffiliateProfile;
    branches: AffiliateProfile[];
  }>;
}

export type DeliveryStatus = 'assigned' | 'picking' | 'delivering' | 'delivered' | 'failed';

export interface InHouseDelivery {
  id: number;
  orderId: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  deliveryStatus: DeliveryStatus;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  proofImage?: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'success' | 'failed';
  paymentMethod?: 'ZALOPAY' | 'VIETQR' | 'COD';
  paymentProvider?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentPaidAt?: string;
  paymentCheckedAt?: string;
  commissionSettlementMode?: 'ORDER_DISCOUNT' | 'MANUAL_PAYOUT';
  commissionDiscountAmount?: number;
  commissionDiscountBeneficiaryId?: string;
  createdAt: string;
  receivedAt?: string;
  items: OrderItem[];
  delivery: {
    type: 'shipping' | 'pickup';
    name?: string;
    phone?: string;
    address?: string;
    location?: {
      lat: number;
      lng: number;
    };
    locationSource?: 'CURRENT_LOCATION' | 'MAP_PICKER';
    stationId?: number;
  };
  total: number;
  referrerId?: string;
  couponCode?: string;
  note?: string;
}

export interface DeliveryTrackingEvent {
  key: string;
  label: string;
  description: string;
  status: 'done' | 'current' | 'pending' | 'failed';
  time?: string;
}

export interface OrderTracking {
  order: Order;
  delivery?: InHouseDelivery;
  distribution: {
    president?: Pick<AffiliateProfile, 'userId' | 'name' | 'phone' | 'role' | 'levelName'>;
    branchLeader?: Pick<AffiliateProfile, 'userId' | 'name' | 'phone' | 'role' | 'levelName'>;
    mode: 'DIRECT' | 'AFFILIATE_CHAIN';
    message: string;
  };
  payment: {
    status: Order['paymentStatus'];
    method: Order['paymentMethod'];
    autoCheckEnabled: boolean;
    lastCheckedAt: string;
    message: string;
  };
  timeline: DeliveryTrackingEvent[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email?: string;
  address?: string;
  addresses?: CustomerAddress[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface CustomerAddress {
  id: string;
  alias: string;
  name: string;
  phone: string;
  address: string;
  streetAddress?: string;
  ward?: string;
  province?: string;
  location?: {
    lat: number;
    lng: number;
  };
  locationSource?: 'CURRENT_LOCATION' | 'MAP_PICKER';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebPushSubscriptionRecord {
  id: number;
  endpoint: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  userId?: string;
  userName?: string;
  userPhone?: string;
  userAgent?: string;
  platform?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, '../data');
const MOCK_DIR = path.join(__dirname, '../../src/mock');

function ensureDataFile<T>(filename: string, fallbackMockFilename?: string): T {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch {
      // fallback
    }
  }

  let initialData: any = [];
  if (fallbackMockFilename) {
    const mockPath = path.join(MOCK_DIR, fallbackMockFilename);
    if (fs.existsSync(mockPath)) {
      initialData = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData as T;
}

function saveDataFile<T>(filename: string, data: T) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

function buildReferralUrl(userId: string, publicSiteUrl = process.env.PUBLIC_SITE_URL || 'https://hpn.saximi.com.vn'): string {
  const baseUrl = publicSiteUrl.replace(/\/+$/, '') || 'https://hpn.saximi.com.vn';
  return `${baseUrl}/?ref=${encodeURIComponent(userId)}`;
}

function qrCodeFor(userId: string, publicSiteUrl = process.env.PUBLIC_SITE_URL || 'https://hpn.saximi.com.vn'): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildReferralUrl(userId, publicSiteUrl))}`;
}

function defaultCommissionLabel(role: UserRole): string {
  return role === 'PRESIDENT' ? 'Hoa hồng quản lý' : 'Hoa hồng trực tiếp';
}

function defaultTierConfig(tierLevel: number) {
  if (tierLevel === 1) return { levelName: 'Bậc 1 - Chủ tịch', commissionLabel: 'Hoa hồng toàn tuyến', rate: 5 };
  if (tierLevel === 3) return { levelName: 'Bậc 3 - Hội viên bán hàng', commissionLabel: 'Hoa hồng hội viên', rate: 15 };
  return { levelName: 'Bậc 2 - Chi hội trưởng', commissionLabel: 'Hoa hồng chi hội', rate: 25 };
}

function normalizeVietnamPhone(value?: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (/^84\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
}

function normalizeOrderStatus(value?: string): Order['status'] {
  return value === 'shipping' || value === 'completed' || value === 'cancelled' ? value : 'pending';
}

function normalizePaymentStatus(value?: string): Order['paymentStatus'] {
  return value === 'success' || value === 'failed' ? value : 'pending';
}

function normalizePaymentMethod(value?: string): Order['paymentMethod'] {
  return value === 'ZALOPAY' || value === 'VIETQR' || value === 'COD' ? value : 'COD';
}

function getAffiliateTierLevel(affiliate: Pick<AffiliateProfile, 'role' | 'tierLevel'>): 1 | 2 | 3 {
  return affiliate.tierLevel || (affiliate.role === 'PRESIDENT' ? 1 : 2);
}

function getAffiliateCommissionRate(affiliate: AffiliateProfile): number {
  const tierLevel = getAffiliateTierLevel(affiliate);
  if (tierLevel === 1) {
    return affiliate.overridingCommissionRate || affiliate.directCommissionRate || defaultTierConfig(1).rate;
  }
  return affiliate.directCommissionRate || defaultTierConfig(tierLevel).rate;
}

function affiliateLevelLabel(affiliate?: Pick<AffiliateProfile, 'role' | 'levelName'>): string {
  if (!affiliate) return 'Tuyến hội';
  return affiliate.levelName || (affiliate.role === 'PRESIDENT' ? 'Chủ tịch hội' : 'Chi hội trưởng');
}

function buildCommissionHierarchyPath(
  beneficiary: AffiliateProfile,
  president?: AffiliateProfile
): string {
  const commissionLabel = beneficiary.commissionLabel || defaultCommissionLabel(beneficiary.role);

  if (beneficiary.role === 'PRESIDENT') {
    return `${affiliateLevelLabel(beneficiary)} > ${commissionLabel}`;
  }

  if (president) {
    return `${affiliateLevelLabel(president)} > ${affiliateLevelLabel(beneficiary)} > ${commissionLabel}`;
  }

  return `${affiliateLevelLabel(beneficiary)} > ${commissionLabel}`;
}

function withImageParams(url: string, params: Record<string, string>): string {
  try {
    const imageUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      imageUrl.searchParams.set(key, value);
    });
    return imageUrl.toString();
  } catch {
    return url;
  }
}

export class Database {
  private static banners: (string | BannerItem)[] = [];
  private static categories: Category[] = [];
  private static products: Product[] = [];
  private static stations: Station[] = [];
  private static coupons: Coupon[] = [];
  private static orders: Order[] = [];
  private static users: User[] = [];
  private static affiliates: AffiliateProfile[] = [];
  private static consignmentStocks: ConsignmentStock[] = [];
  private static settlements: FinancialSettlement[] = [];
  private static auditLogs: AuditLog[] = [];
  private static staffMembers: StaffMember[] = [];
  private static commissions: CommissionRecord[] = [];
  private static deliveries: InHouseDelivery[] = [];
  private static mediaLibrary: MediaAsset[] = [];
  private static webPushSubscriptions: WebPushSubscriptionRecord[] = [];
  private static settings: PlatformSettings = {
    shopName: 'Saximi shop',
    brandColor: '#00ccf7',
    hotline: '0908889999',
    supportEmail: 'support@saximi.vn',
    businessAddress: 'Số 13 Tân Thuận Đông, Phường Tân Thuận, Hồ Chí Minh',
    publicSiteUrl: process.env.PUBLIC_SITE_URL || 'https://hpn.saximi.com.vn',
    zaloOaUrl: process.env.ZALO_OA_DASHBOARD_URL || 'https://oa.zalo.me/manage/dashboard#',
    vietQrBankId: process.env.VIETQR_BANK_ID || 'MB',
    vietQrAccountNo: process.env.VIETQR_ACCOUNT_NO || '0908889999',
    vietQrAccountName: process.env.VIETQR_ACCOUNT_NAME || 'SAXIMI SHOP',
    sepayWebhookEnabled: true,
    sepayWebhookApiKey: process.env.SEPAY_WEBHOOK_API_KEY || process.env.SEPAY_WEBHOOK_SECRET || '',
    commissionSettlementMode: 'ORDER_DISCOUNT',
    maintenanceMode: false,
    maintenanceMessage: 'Hệ thống đang bảo trì, vui lòng quay lại sau.',
    updatedAt: new Date().toISOString(),
  };

  private static buildProductImageLibrary(product: Product): ProductImage[] {
    const category = this.categories.find((item) => item.id === product.categoryId);
    const existingImages = (product.images || [])
      .filter((image) => image.url)
      .map((image, index) => ({
        ...image,
        id: image.id && !image.id.startsWith('new-') ? image.id : `${product.id}-${index + 1}`,
        label: image.label || (index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}`),
        kind: image.kind || (index === 0 ? 'MAIN' : 'DETAIL'),
        sortOrder: image.sortOrder ?? index + 1,
      }));

    const fallbackImages: ProductImage[] = [
      {
        id: `${product.id}-main`,
        url: withImageParams(product.image, { auto: 'format', fit: 'crop', w: '1200', q: '90' }),
        label: 'Ảnh chính',
        kind: 'MAIN',
        sortOrder: 1,
      },
      {
        id: `${product.id}-detail`,
        url: withImageParams(product.image, { auto: 'format', fit: 'crop', w: '900', h: '900', q: '88' }),
        label: 'Cận cảnh',
        kind: 'DETAIL',
        sortOrder: 2,
      },
      {
        id: `${product.id}-collection`,
        url: withImageParams(category?.image || product.image, { auto: 'format', fit: 'crop', w: '1000', h: '760', q: '88' }),
        label: 'Bộ sưu tập',
        kind: 'COLLECTION',
        sortOrder: 3,
      },
    ];

    const source = existingImages.length > 0 ? existingImages : fallbackImages;
    const seen = new Set<string>();
    return source
      .filter((image) => {
        if (seen.has(image.url)) return false;
        seen.add(image.url);
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private static normalizeTags(tags: string[] = []): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  private static getCouponDiscountAmount(subtotal: number, couponCode?: string): number {
    if (!couponCode) return 0;
    const coupon = this.coupons.find(
      (item) => item.code.toLowerCase() === couponCode.toLowerCase() && item.isActive
    );
    if (!coupon || subtotal < coupon.minOrderAmount) return 0;
    return Math.round((subtotal * coupon.discountPercent) / 100);
  }

  private static calculateOrderTotal(items: OrderItem[], couponCode?: string): number {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      return sum + Number(item.product.price || 0) * quantity;
    }, 0);
    return Math.max(0, subtotal - this.getCouponDiscountAmount(subtotal, couponCode));
  }

  private static normalizeOrderItems(items: Array<OrderItem | any> = []): OrderItem[] {
    return items.reduce<OrderItem[]>((normalizedItems, item: any) => {
      const itemProduct = item.product || item;
      const productId = Number(itemProduct.id || item.id || 0);
      const product = this.products.find((p) => p.id === productId);
      if (!product) return normalizedItems;

      const quantity = Math.max(1, Number(item.quantity || 1));
      normalizedItems.push({
        product: {
          ...product,
          images: product.images || this.buildProductImageLibrary(product),
        },
        quantity,
      });
      return normalizedItems;
    }, []);
  }

  private static normalizeOrderDelivery(order: Partial<Order>, customer: User): Order['delivery'] {
    const delivery = order.delivery || { type: 'shipping' };
    const phone = normalizeVietnamPhone(delivery.phone || customer.phone) || customer.phone || '0912345678';

    return {
      type: delivery.type === 'pickup' ? 'pickup' : 'shipping',
      name: delivery.name || customer.name || 'Khách hàng',
      phone,
      address: delivery.address || customer.address || 'Địa chỉ giao hàng',
      location: delivery.location,
      locationSource: delivery.locationSource,
      stationId: delivery.stationId,
    };
  }

  private static registerMediaAsset(asset: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }) {
    if (!asset.url) return false;

    const now = new Date().toISOString();
    const existingIndex = this.mediaLibrary.findIndex((item) => item.url === asset.url);
    if (existingIndex > -1) {
      const existing = this.mediaLibrary[existingIndex];
      const mergedTags = this.normalizeTags([...(existing.tags || []), ...(asset.tags || [])]);
      const nextAsset: MediaAsset = {
        ...existing,
        title: existing.title || asset.title,
        altText: existing.altText || asset.altText,
        sourceType: existing.sourceType || asset.sourceType,
        sourceId: existing.sourceId || asset.sourceId,
        purpose: existing.purpose || asset.purpose,
        tags: mergedTags,
        isActive: existing.isActive ?? asset.isActive ?? true,
        updatedAt: existing.updatedAt || now,
      };
      if (JSON.stringify(nextAsset) !== JSON.stringify(existing)) {
        this.mediaLibrary[existingIndex] = nextAsset;
        return true;
      }
      return false;
    }

    const nextId = this.mediaLibrary.length > 0 ? Math.max(...this.mediaLibrary.map((item) => item.id)) + 1 : 1;
    this.mediaLibrary.push({
      id: nextId,
      ...asset,
      tags: this.normalizeTags(asset.tags),
      isActive: asset.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  }

  public static init() {
    this.banners = ensureDataFile<(string | BannerItem)[]>('banners.json', 'banners.json');
    this.categories = ensureDataFile<Category[]>('categories.json', 'categories.json');
    this.products = ensureDataFile<Product[]>('products.json', 'products.json');

    // Add default minStockLevel for products
    this.products = this.products.map((p) => ({
      ...p,
      stockQuantity: p.stockQuantity ?? 100,
      minStockLevel: p.minStockLevel ?? 15,
    }));

    this.stations = ensureDataFile<Station[]>('stations.json', 'stations.json');
    this.coupons = ensureDataFile<Coupon[]>('coupons.json');
    this.orders = ensureDataFile<Order[]>('orders.json', 'orders.json');
    this.users = ensureDataFile<User[]>('users.json');
    this.affiliates = ensureDataFile<AffiliateProfile[]>('affiliates.json');
    this.consignmentStocks = ensureDataFile<ConsignmentStock[]>('consignments.json');
    this.settlements = ensureDataFile<FinancialSettlement[]>('settlements.json');
    this.auditLogs = ensureDataFile<AuditLog[]>('audit_logs.json');
    this.staffMembers = ensureDataFile<StaffMember[]>('staff.json');

    if (this.auditLogs.length === 0) {
      this.auditLogs.push({
        id: 1,
        userName: 'admin',
        role: 'SUPER_ADMIN',
        action: 'SYSTEM_BOOTSTRAP',
        details: 'Khởi tạo hệ thống Enterprise thành công',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
      });
      saveDataFile('audit_logs.json', this.auditLogs);
    }

    this.commissions = ensureDataFile<CommissionRecord[]>('commissions.json');
    this.deliveries = ensureDataFile<InHouseDelivery[]>('deliveries.json');
    this.mediaLibrary = ensureDataFile<MediaAsset[]>('media_library.json');
    this.webPushSubscriptions = ensureDataFile<WebPushSubscriptionRecord[]>('web_push_subscriptions.json');
    this.settings = {
      ...this.settings,
      ...ensureDataFile<Partial<PlatformSettings>>('settings.json'),
      publicSiteUrl: process.env.PUBLIC_SITE_URL || this.settings.publicSiteUrl,
      zaloOaUrl: process.env.ZALO_OA_DASHBOARD_URL || this.settings.zaloOaUrl,
      vietQrBankId: this.settings.vietQrBankId || process.env.VIETQR_BANK_ID || 'MB',
      vietQrAccountNo: this.settings.vietQrAccountNo || process.env.VIETQR_ACCOUNT_NO || '0908889999',
      vietQrAccountName: this.settings.vietQrAccountName || process.env.VIETQR_ACCOUNT_NAME || 'SAXIMI SHOP',
      sepayWebhookEnabled: this.settings.sepayWebhookEnabled ?? true,
      sepayWebhookApiKey:
        this.settings.sepayWebhookApiKey ||
        process.env.SEPAY_WEBHOOK_API_KEY ||
        process.env.SEPAY_WEBHOOK_SECRET ||
        '',
      commissionSettlementMode: this.settings.commissionSettlementMode || 'ORDER_DISCOUNT',
    };
    saveDataFile('settings.json', this.settings);

    this.hydrateMissingBusinessData();
    this.ensureStaffMembers();

    console.log('✅ Database initialized with Enterprise Audit & Financial Settlement Modules');
  }

  private static ensureStaffMembers() {
    if (this.staffMembers.length > 0) {
      let changed = false;
      this.staffMembers = this.staffMembers.map((member) => {
        if (member.id !== 1 && member.managerId === undefined) {
          changed = true;
          return { ...member, managerId: 1 };
        }
        return member;
      });
      if (changed) saveDataFile('staff.json', this.staffMembers);
      return;
    }

    const now = new Date().toISOString();
    this.staffMembers = [
      {
        id: 1,
        name: 'Nguyễn Minh Quân',
        phone: '0901112222',
        email: 'quan@saximi.vn',
        role: 'MANAGER',
        status: 'active',
        department: 'Vận hành',
        managerId: undefined,
        note: 'Quản lý vận hành cửa hàng và đơn hàng',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Trần Thu Ngân',
        phone: '0903334444',
        email: 'ngan@saximi.vn',
        role: 'ACCOUNTANT',
        status: 'active',
        department: 'Kế toán',
        managerId: 1,
        note: 'Đối soát thanh toán và công nợ',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Lê Văn Phúc',
        phone: '0905556666',
        email: 'phuc@saximi.vn',
        role: 'DELIVERY',
        status: 'active',
        department: 'Giao hàng',
        managerId: 1,
        note: 'Tài xế giao hàng nội bộ',
        createdAt: now,
        updatedAt: now,
      },
    ];
    saveDataFile('staff.json', this.staffMembers);
  }

  private static hydrateMissingBusinessData() {
    let productsChanged = false;

    this.products = this.products.map((product, index) => {
      const stockQuantity = product.stockQuantity ?? (index % 9 === 0 ? 8 : index % 7 === 0 ? 14 : 100 - (index % 5) * 7);
      const minStockLevel = product.minStockLevel ?? 15;
      const images = this.buildProductImageLibrary(product);
      const image = product.image || images[0]?.url || '';
      if (
        product.stockQuantity !== stockQuantity ||
        product.minStockLevel !== minStockLevel ||
        product.image !== image ||
        JSON.stringify(product.images || []) !== JSON.stringify(images)
      ) {
        productsChanged = true;
      }
      return {
        ...product,
        image,
        images,
        stockQuantity,
        minStockLevel,
      };
    });

    if (productsChanged) {
      saveDataFile('products.json', this.products);
    }

    this.ensureUsers();
    this.ensureAffiliates();
    this.ensureAffiliateHierarchy();
    this.ensureOrdersAreComplete();
    this.ensureConsignments();
    this.ensureCommissions();
    this.ensureDeliveries();
    this.ensureSettlements();
    this.ensureMediaLibrary();
  }

  private static ensureMediaLibrary() {
    let changed = false;

    this.products.forEach((product) => {
      (product.images || this.buildProductImageLibrary(product)).forEach((image) => {
        changed = this.registerMediaAsset({
          url: image.url,
          title: `${product.name} - ${image.label}`,
          altText: image.label,
          sourceType: 'PRODUCT',
          sourceId: String(product.id),
          purpose: 'PRODUCT_GALLERY',
          tags: ['product', product.name, image.kind.toLowerCase()],
        }) || changed;
      });
    });

    this.categories.forEach((category) => {
      changed = this.registerMediaAsset({
        url: category.image,
        title: `Danh mục ${category.name}`,
        altText: category.name,
        sourceType: 'CATEGORY',
        sourceId: String(category.id),
        purpose: 'CATEGORY',
        tags: ['category', category.name],
      }) || changed;
    });

    this.getBannerItems().forEach((banner) => {
      changed = this.registerMediaAsset({
        url: banner.imageUrl,
        title: banner.title || `Banner #${banner.id}`,
        altText: banner.title,
        sourceType: 'BANNER',
        sourceId: String(banner.id),
        purpose: 'BANNER',
        tags: ['banner'],
        isActive: banner.isActive,
      }) || changed;
    });

    this.stations.forEach((station) => {
      changed = this.registerMediaAsset({
        url: station.image,
        title: `Điểm nhận hàng ${station.name}`,
        altText: station.name,
        sourceType: 'STATION',
        sourceId: String(station.id),
        purpose: 'STATION',
        tags: ['station', station.name],
      }) || changed;
    });

    this.deliveries
      .filter((delivery) => delivery.proofImage)
      .forEach((delivery) => {
        changed = this.registerMediaAsset({
          url: delivery.proofImage!,
          title: `Bằng chứng giao hàng #${delivery.orderId}`,
          altText: `Giao hàng đơn #${delivery.orderId}`,
          sourceType: 'DELIVERY',
          sourceId: String(delivery.id),
          purpose: 'DELIVERY_PROOF',
          tags: ['delivery', `order-${delivery.orderId}`],
        }) || changed;
      });

    if (changed) {
      saveDataFile('media_library.json', this.mediaLibrary);
    }
  }

  private static ensureUsers() {
    if (this.users.length > 0) return;

    this.users = [
      {
        id: 'zalo-u-1001',
        name: 'Nguyễn Hoàng Anh',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phone: '0901234567',
        email: 'anh.nguyen@example.com',
        address: '12 Nguyễn Hữu Cảnh, Phường Thạnh Mỹ Tây, Hồ Chí Minh',
      },
      {
        id: 'zalo-u-1002',
        name: 'Trần Minh Châu',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '0918877665',
        email: 'chau.tran@example.com',
        address: '45 Lê Văn Sỹ, Phường Xuân Hòa, Hồ Chí Minh',
      },
      {
        id: 'zalo-u-1003',
        name: 'Lê Quốc Bảo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '0988123456',
        email: 'bao.le@example.com',
        address: '88 Tân Thuận Đông, Phường Tân Thuận, Hồ Chí Minh',
      },
    ];
    saveDataFile('users.json', this.users);
  }

  private static ensureAffiliates() {
    if (this.affiliates.length > 0) return;

    this.affiliates = [
      {
        userId: 'pres-01',
        name: 'Bà Nguyễn Thị Mai',
        phone: '0908889999',
        address: '12 Nguyễn Hữu Cảnh, Phường Thạnh Mỹ Tây, Hồ Chí Minh',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        role: 'PRESIDENT',
        location: { lat: 10.7892, lng: 106.7217 },
        levelName: 'Bậc 1 - Chủ tịch',
        tierLevel: 1,
        commissionLabel: 'Hoa hồng toàn tuyến',
        referralCode: 'CTH-MAI',
        qrCodeUrl: qrCodeFor('pres-01'),
        directCommissionRate: 5,
        overridingCommissionRate: 5,
        walletBalance: 4500000,
        totalSales: 45000000,
      },
      {
        userId: 'branch-01',
        name: 'Chị Trần Thu Hà',
        phone: '0912333444',
        address: '45 Lê Văn Sỹ, Phường Xuân Hòa, Hồ Chí Minh',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'BRANCH_LEADER',
        location: { lat: 10.7869, lng: 106.6786 },
        levelName: 'Bậc 2 - Chi hội trưởng',
        tierLevel: 2,
        commissionLabel: 'Hoa hồng chi hội',
        parentAffiliateId: 'pres-01',
        presidentId: 'pres-01',
        referralCode: 'CH-HA',
        qrCodeUrl: qrCodeFor('branch-01'),
        directCommissionRate: 25,
        overridingCommissionRate: 0,
        walletBalance: 1200000,
        totalSales: 12000000,
      },
      {
        userId: 'branch-02',
        name: 'Anh Phạm Minh Khang',
        phone: '0933555777',
        address: '88 Tân Thuận Đông, Phường Tân Thuận, Hồ Chí Minh',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        role: 'BRANCH_LEADER',
        location: { lat: 10.7417, lng: 106.7367 },
        levelName: 'Bậc 3 - Hội viên bán hàng',
        tierLevel: 3,
        commissionLabel: 'Hoa hồng hội viên',
        parentAffiliateId: 'branch-01',
        presidentId: 'pres-01',
        referralCode: 'CH-KHANG',
        qrCodeUrl: qrCodeFor('branch-02'),
        directCommissionRate: 15,
        overridingCommissionRate: 0,
        walletBalance: 860000,
        totalSales: 8600000,
      },
    ];
    saveDataFile('affiliates.json', this.affiliates);
  }

  private static ensureAffiliateHierarchy() {
    let changed = false;
    const firstPresident = this.affiliates.find((affiliate) => affiliate.role === 'PRESIDENT');
    const fallbackDetails = [
      {
        address: '12 Nguyễn Hữu Cảnh, Phường Thạnh Mỹ Tây, Hồ Chí Minh',
        location: { lat: 10.7892, lng: 106.7217 },
      },
      {
        address: '45 Lê Văn Sỹ, Phường Xuân Hòa, Hồ Chí Minh',
        location: { lat: 10.7869, lng: 106.6786 },
      },
      {
        address: '88 Tân Thuận Đông, Phường Tân Thuận, Hồ Chí Minh',
        location: { lat: 10.7417, lng: 106.7367 },
      },
      {
        address: '68 Nguyễn Văn Linh, Phường Tân Mỹ, Hồ Chí Minh',
        location: { lat: 10.7299, lng: 106.7014 },
      },
    ];

    this.affiliates = this.affiliates.map((affiliate, index) => {
      const fallback = fallbackDetails[index % fallbackDetails.length];
      const tierLevel = getAffiliateTierLevel(affiliate);
      const tierConfig = defaultTierConfig(tierLevel);
      const expectedQrCodeUrl = qrCodeFor(affiliate.userId, this.settings.publicSiteUrl);
      const shouldRefreshQr =
        !affiliate.qrCodeUrl ||
        affiliate.qrCodeUrl.includes('zalo.me/s/zaui-market') ||
        !affiliate.qrCodeUrl.includes(encodeURIComponent(buildReferralUrl(affiliate.userId, this.settings.publicSiteUrl)));
      if (tierLevel === 1 || affiliate.role === 'PRESIDENT') {
        const normalized = {
          ...affiliate,
          role: 'PRESIDENT' as const,
          tierLevel: 1 as const,
          levelName: affiliate.levelName || tierConfig.levelName,
          commissionLabel: affiliate.commissionLabel || tierConfig.commissionLabel,
          parentAffiliateId: undefined,
          presidentId: undefined,
          address: affiliate.address || fallback.address,
          location: affiliate.location || fallback.location,
          qrCodeUrl: shouldRefreshQr ? expectedQrCodeUrl : affiliate.qrCodeUrl,
          directCommissionRate: affiliate.directCommissionRate || tierConfig.rate,
          overridingCommissionRate: affiliate.overridingCommissionRate || affiliate.directCommissionRate || tierConfig.rate,
        };
        changed =
          changed ||
          normalized.role !== affiliate.role ||
          normalized.tierLevel !== affiliate.tierLevel ||
          normalized.levelName !== affiliate.levelName ||
          normalized.commissionLabel !== affiliate.commissionLabel ||
          affiliate.parentAffiliateId !== undefined ||
          affiliate.presidentId !== undefined ||
          normalized.address !== affiliate.address ||
          normalized.location !== affiliate.location ||
          normalized.qrCodeUrl !== affiliate.qrCodeUrl ||
          normalized.directCommissionRate !== affiliate.directCommissionRate ||
          normalized.overridingCommissionRate !== affiliate.overridingCommissionRate;
        return normalized;
      }

      const parentAffiliateId = affiliate.parentAffiliateId || affiliate.presidentId || firstPresident?.userId;
      const parent = this.affiliates.find((item) => item.userId === parentAffiliateId);
      const presidentId =
        tierLevel === 3
          ? parent?.presidentId || firstPresident?.userId
          : affiliate.presidentId || firstPresident?.userId;
      const normalized = {
        ...affiliate,
        role: 'BRANCH_LEADER' as const,
        tierLevel,
        levelName: affiliate.levelName || tierConfig.levelName,
        commissionLabel: affiliate.commissionLabel || tierConfig.commissionLabel,
        parentAffiliateId,
        presidentId,
        address: affiliate.address || fallback.address,
        location: affiliate.location || fallback.location,
        qrCodeUrl: shouldRefreshQr ? expectedQrCodeUrl : affiliate.qrCodeUrl,
        directCommissionRate: affiliate.directCommissionRate || tierConfig.rate,
        overridingCommissionRate: 0,
      };
      changed =
        changed ||
        normalized.role !== affiliate.role ||
        normalized.tierLevel !== affiliate.tierLevel ||
        normalized.levelName !== affiliate.levelName ||
        normalized.commissionLabel !== affiliate.commissionLabel ||
        normalized.parentAffiliateId !== affiliate.parentAffiliateId ||
        normalized.presidentId !== affiliate.presidentId ||
        normalized.address !== affiliate.address ||
        normalized.location !== affiliate.location ||
        normalized.qrCodeUrl !== affiliate.qrCodeUrl ||
        normalized.directCommissionRate !== affiliate.directCommissionRate ||
        normalized.overridingCommissionRate !== affiliate.overridingCommissionRate;
      return normalized;
    });

    if (changed) {
      saveDataFile('affiliates.json', this.affiliates);
    }
  }

  private static ensureOrdersAreComplete() {
    let changed = false;
    const defaultCustomers = this.users.length > 0 ? this.users : [
      {
        id: 'zalo-u-default',
        name: 'Khách hàng Zalo',
        avatar: DEFAULT_AVATAR,
        phone: '0912345678',
        address: 'Địa chỉ giao hàng mặc định',
      },
    ];

    this.orders = this.orders.map((order, orderIndex) => {
      const customer = defaultCustomers[orderIndex % defaultCustomers.length];
      const normalizedItems = this.normalizeOrderItems(order.items || []);
      const delivery = this.normalizeOrderDelivery(order, customer);
      const status = normalizeOrderStatus(order.status);
      const paymentMethod = normalizePaymentMethod(order.paymentMethod);
      const paymentStatus =
        status === 'completed'
          ? 'success'
          : status === 'cancelled'
            ? 'failed'
            : normalizePaymentStatus(order.paymentStatus);
      const total = this.calculateOrderTotal(normalizedItems, order.couponCode);
      const normalizedOrder: Order = {
        ...order,
        status,
        paymentStatus,
        items: normalizedItems,
        delivery,
        total,
        paymentMethod,
        referrerId: order.referrerId || (orderIndex % 2 === 0 ? 'branch-01' : undefined),
        couponCode: order.couponCode,
        note: order.note,
      };

      if (JSON.stringify(order) !== JSON.stringify(normalizedOrder)) {
        changed = true;
      }
      return normalizedOrder;
    });

    if (changed) {
      saveDataFile('orders.json', this.orders);
    }
  }

  private static ensureConsignments() {
    if (this.consignmentStocks.length > 0) return;

    const president = this.affiliates.find((a) => a.role === 'PRESIDENT');
    const featuredProducts = this.products.slice(0, 3);
    if (!president || featuredProducts.length === 0) return;

    this.consignmentStocks = featuredProducts.map((product, index) => {
      const allocatedQuantity = [100, 80, 60][index] ?? 50;
      const soldQuantity = [35, 18, 12][index] ?? 10;
      const remainingQuantity = allocatedQuantity - soldQuantity;
      return {
        id: index + 1,
        presidentId: president.userId,
        presidentName: president.name,
        productId: product.id,
        productName: product.name,
        allocatedQuantity,
        soldQuantity,
        remainingQuantity,
        debtAmount: remainingQuantity * product.price,
      };
    });
    saveDataFile('consignments.json', this.consignmentStocks);
  }

  private static ensureCommissions() {
    if (this.commissions.length > 0) {
      let changed = false;
      this.commissions = this.commissions.map((commission) => {
        const beneficiary = this.affiliates.find((affiliate) => affiliate.userId === commission.beneficiaryId);
        if (!beneficiary) return commission;
        const order = this.orders.find((item) => item.id === commission.orderId);
        const commissionRate =
          commission.commissionRate ?? getAffiliateCommissionRate(beneficiary);
        const amount = order ? Math.round((order.total * commissionRate) / 100) : commission.amount;
        const status =
          order?.status === 'completed' && commission.status === 'pending'
            ? 'available'
            : commission.status;
        const normalized = {
          ...commission,
          beneficiaryName: beneficiary.name,
          beneficiaryRole: beneficiary.role,
          amount,
          commissionName: commission.commissionName || beneficiary.commissionLabel || defaultTierConfig(getAffiliateTierLevel(beneficiary)).commissionLabel,
          commissionRate,
          hierarchyPath: commission.hierarchyPath || this.buildAffiliateHierarchyPath(beneficiary),
          status,
        };
        changed =
          changed ||
          normalized.beneficiaryName !== commission.beneficiaryName ||
          normalized.beneficiaryRole !== commission.beneficiaryRole ||
          normalized.amount !== commission.amount ||
          normalized.commissionName !== commission.commissionName ||
          normalized.commissionRate !== commission.commissionRate ||
          normalized.hierarchyPath !== commission.hierarchyPath ||
          normalized.status !== commission.status;
        return normalized;
      });
      if (changed) {
        saveDataFile('commissions.json', this.commissions);
      }
      return;
    }

    const completedOrders = this.orders.filter((order) => order.status === 'completed' || order.paymentStatus === 'success');
    const branchLeader = this.affiliates.find((a) => a.role === 'BRANCH_LEADER') || this.affiliates[0];
    if (!branchLeader || completedOrders.length === 0) return;

    const president = branchLeader.presidentId
      ? this.affiliates.find((a) => a.userId === branchLeader.presidentId)
      : this.affiliates.find((a) => a.role === 'PRESIDENT');

    const records: CommissionRecord[] = [];
    completedOrders.slice(0, 4).forEach((order) => {
      records.push({
        id: records.length + 1,
        orderId: order.id,
        beneficiaryId: branchLeader.userId,
        beneficiaryName: branchLeader.name,
        beneficiaryRole: branchLeader.role,
        amount: Math.round((order.total * getAffiliateCommissionRate(branchLeader)) / 100),
        type: 'TIER_DIRECT',
        commissionName: branchLeader.commissionLabel || defaultTierConfig(getAffiliateTierLevel(branchLeader)).commissionLabel,
        commissionRate: getAffiliateCommissionRate(branchLeader),
        hierarchyPath: this.buildAffiliateHierarchyPath(branchLeader),
        status: order.status === 'completed' ? 'available' : 'pending',
        createdAt: order.receivedAt || order.createdAt,
      });

      if (president) {
        records.push({
          id: records.length + 1,
          orderId: order.id,
          beneficiaryId: president.userId,
          beneficiaryName: president.name,
          beneficiaryRole: president.role,
          amount: Math.round((order.total * getAffiliateCommissionRate(president)) / 100),
          type: 'TIER_ONE_GLOBAL',
          commissionName: president.commissionLabel || defaultTierConfig(1).commissionLabel,
          commissionRate: getAffiliateCommissionRate(president),
          hierarchyPath: this.buildAffiliateHierarchyPath(president),
          status: order.status === 'completed' ? 'available' : 'pending',
          createdAt: order.receivedAt || order.createdAt,
        });
      }
    });

    this.commissions = records;
    saveDataFile('commissions.json', this.commissions);
  }

  private static ensureDeliveries() {
    if (this.deliveries.length > 0) return;

    const deliverableOrders = this.orders.filter((order) => order.status === 'shipping' || order.status === 'completed');
    if (deliverableOrders.length === 0) return;

    this.deliveries = deliverableOrders.slice(0, 3).map((order, index) => ({
      id: index + 1,
      orderId: order.id,
      driverName: ['Nguyễn Văn Hùng', 'Lê Minh Quân', 'Trần Quốc Việt'][index] || 'Tài xế nội bộ',
      driverPhone: ['0988777666', '0977666555', '0966555444'][index] || '0988000000',
      vehicleNumber: ['51D-998.88', '51C-456.78', '50H-123.45'][index] || '51D-000.00',
      deliveryStatus: order.status === 'completed' ? 'delivered' : index % 2 === 0 ? 'delivering' : 'assigned',
      recipientName: order.delivery?.name || 'Khách hàng Zalo',
      recipientPhone: order.delivery?.phone || '0912345678',
      recipientAddress: order.delivery?.address || 'Địa chỉ giao hàng',
      proofImage: order.status === 'completed' ? 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600' : undefined,
      updatedAt: order.receivedAt || order.createdAt,
    }));
    saveDataFile('deliveries.json', this.deliveries);
  }

  private static ensureSettlements() {
    if (this.settlements.length > 0) return;

    const president = this.affiliates.find((a) => a.role === 'PRESIDENT');
    if (!president) return;

    this.settlements = [
      {
        id: 1001,
        presidentId: president.userId,
        presidentName: president.name,
        settlementAmount: 2500000,
        paymentMethod: 'TRANSFER',
        referenceCode: 'MB-20260901',
        status: 'verified',
        createdAt: '2026-09-01T09:15:00.000Z',
      },
      {
        id: 1002,
        presidentId: president.userId,
        presidentName: president.name,
        settlementAmount: 1200000,
        paymentMethod: 'CASH',
        referenceCode: 'CASH-20260908',
        status: 'verified',
        createdAt: '2026-09-08T14:30:00.000Z',
      },
    ];
    saveDataFile('settlements.json', this.settlements);
  }

  // Audit Log Service
  public static logAction(userName: string, role: string, action: string, details: string, targetId?: string, ipAddress: string = '127.0.0.1') {
    const newLog: AuditLog = {
      id: this.auditLogs.length > 0 ? Math.max(...this.auditLogs.map((l) => l.id)) + 1 : 1,
      userName,
      role,
      action,
      targetId,
      details,
      ipAddress,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    saveDataFile('audit_logs.json', this.auditLogs);
  }

  public static getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public static getMediaLibrary(filters: { purpose?: string; sourceType?: string; tag?: string; q?: string; activeOnly?: boolean } = {}): MediaAsset[] {
    const query = filters.q?.toLowerCase().trim();
    const tag = filters.tag?.toLowerCase().trim();

    return this.mediaLibrary
      .filter((asset) => !filters.activeOnly || asset.isActive)
      .filter((asset) => !filters.purpose || asset.purpose === filters.purpose)
      .filter((asset) => !filters.sourceType || asset.sourceType === filters.sourceType)
      .filter((asset) => !tag || asset.tags.some((item) => item.toLowerCase() === tag))
      .filter((asset) => {
        if (!query) return true;
        return [
          asset.title,
          asset.altText,
          asset.url,
          asset.sourceId,
          ...(asset.tags || []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public static addMediaAsset(data: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>): MediaAsset {
    const nextId = this.mediaLibrary.length > 0 ? Math.max(...this.mediaLibrary.map((item) => item.id)) + 1 : 1;
    const now = new Date().toISOString();
    const asset: MediaAsset = {
      id: nextId,
      url: data.url,
      title: data.title || 'Ảnh thư viện',
      altText: data.altText,
      sourceType: data.sourceType || 'MANUAL',
      sourceId: data.sourceId,
      purpose: data.purpose || 'GENERAL',
      tags: this.normalizeTags(data.tags || []),
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.mediaLibrary.unshift(asset);
    saveDataFile('media_library.json', this.mediaLibrary);
    this.logAction('admin', 'SUPER_ADMIN', 'ADD_MEDIA_ASSET', `Thêm ảnh thư viện: ${asset.title}`, String(asset.id));
    return asset;
  }

  public static updateMediaAsset(id: number, data: Partial<MediaAsset>): MediaAsset | null {
    const idx = this.mediaLibrary.findIndex((asset) => asset.id === id);
    if (idx === -1) return null;
    this.mediaLibrary[idx] = {
      ...this.mediaLibrary[idx],
      ...data,
      id,
      tags: data.tags ? this.normalizeTags(data.tags) : this.mediaLibrary[idx].tags,
      updatedAt: new Date().toISOString(),
    };
    saveDataFile('media_library.json', this.mediaLibrary);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_MEDIA_ASSET', `Cập nhật ảnh thư viện #${id}`, String(id));
    return this.mediaLibrary[idx];
  }

  public static deleteMediaAsset(id: number): boolean {
    const initialLen = this.mediaLibrary.length;
    this.mediaLibrary = this.mediaLibrary.filter((asset) => asset.id !== id);
    if (this.mediaLibrary.length !== initialLen) {
      saveDataFile('media_library.json', this.mediaLibrary);
      this.logAction('admin', 'SUPER_ADMIN', 'DELETE_MEDIA_ASSET', `Xóa ảnh thư viện #${id}`, String(id));
      return true;
    }
    return false;
  }

  // Financial Settlements
  public static getSettlements(): FinancialSettlement[] {
    return this.settlements;
  }

  public static createSettlement(presidentId: string, amount: number, paymentMethod: 'TRANSFER' | 'CASH', referenceCode: string): FinancialSettlement {
    const president = this.affiliates.find((a) => a.userId === presidentId);
    const pName = president ? president.name : 'Chủ tịch hội';

    const newId = this.settlements.length > 0 ? Math.max(...this.settlements.map((s) => s.id)) + 1 : 1001;
    const newSettlement: FinancialSettlement = {
      id: newId,
      presidentId,
      presidentName: pName,
      settlementAmount: amount,
      paymentMethod,
      referenceCode,
      status: 'verified',
      createdAt: new Date().toISOString(),
    };
    this.settlements.unshift(newSettlement);
    saveDataFile('settlements.json', this.settlements);

    // Deduct debt amount from consignment stocks
    const stocks = this.consignmentStocks.filter((c) => c.presidentId === presidentId);
    let remainingPayment = amount;
    for (const stock of stocks) {
      if (remainingPayment <= 0) break;
      if (stock.debtAmount > 0) {
        const deduct = Math.min(stock.debtAmount, remainingPayment);
        stock.debtAmount -= deduct;
        remainingPayment -= deduct;
      }
    }
    saveDataFile('consignments.json', this.consignmentStocks);

    this.logAction('admin', 'SUPER_ADMIN', 'VERIFY_SETTLEMENT', `Duyệt đối soát ${amount} VND cho Chủ tịch ${pName}`, presidentId);
    return newSettlement;
  }

  public static updateSettlement(id: number, data: Partial<FinancialSettlement>): FinancialSettlement | null {
    const idx = this.settlements.findIndex((settlement) => settlement.id === id);
    if (idx === -1) return null;
    const president = data.presidentId
      ? this.affiliates.find((affiliate) => affiliate.userId === data.presidentId)
      : undefined;
    this.settlements[idx] = {
      ...this.settlements[idx],
      ...data,
      id,
      presidentName: president?.name || data.presidentName || this.settlements[idx].presidentName,
      settlementAmount: Number(data.settlementAmount ?? this.settlements[idx].settlementAmount),
      paymentMethod: data.paymentMethod || this.settlements[idx].paymentMethod,
      referenceCode: data.referenceCode || this.settlements[idx].referenceCode,
      status: data.status || this.settlements[idx].status,
    };
    saveDataFile('settlements.json', this.settlements);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_SETTLEMENT', `Cập nhật đối soát #${id}`, String(id));
    return this.settlements[idx];
  }

  public static deleteSettlement(id: number): boolean {
    const initialLen = this.settlements.length;
    this.settlements = this.settlements.filter((settlement) => settlement.id !== id);
    if (this.settlements.length === initialLen) return false;
    saveDataFile('settlements.json', this.settlements);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_SETTLEMENT', `Xóa đối soát #${id}`, String(id));
    return true;
  }

  // Banners, Categories, Products, Stations, Coupons...
  public static getBanners(): string[] {
    return this.banners.map((b) => (typeof b === 'string' ? b : b.imageUrl));
  }
  public static getBannerItems(): BannerItem[] {
    return this.banners.map((b, idx) => {
      if (typeof b === 'string') {
        return { id: idx + 1, imageUrl: b, title: `Banner #${idx + 1}`, isActive: true };
      }
      return b;
    });
  }
  public static addBanner(banner: Omit<BannerItem, 'id'>): BannerItem {
    const bannerItems = this.getBannerItems();
    const newId = bannerItems.length > 0 ? Math.max(...bannerItems.map((b) => b.id)) + 1 : 1;
    const newBanner: BannerItem = { id: newId, ...banner };
    this.banners.push(newBanner);
    saveDataFile('banners.json', this.banners);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'ADD_BANNER', `Thêm banner mới: ${newBanner.title}`);
    return newBanner;
  }
  public static deleteBanner(id: number): boolean {
    const bannerItems = this.getBannerItems();
    const initialLen = bannerItems.length;
    this.banners = bannerItems.filter((b) => b.id !== id);
    saveDataFile('banners.json', this.banners);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_BANNER', `Xóa banner #${id}`);
    return this.banners.length < initialLen;
  }

  public static getCategories(): Category[] {
    return this.categories;
  }
  public static addCategory(category: Omit<Category, 'id'>): Category {
    const newId = this.categories.length > 0 ? Math.max(...this.categories.map((c) => c.id)) + 1 : 1;
    const newCategory: Category = { id: newId, ...category };
    this.categories.push(newCategory);
    saveDataFile('categories.json', this.categories);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'ADD_CATEGORY', `Thêm danh mục: ${newCategory.name}`);
    return newCategory;
  }
  public static updateCategory(id: number, data: Partial<Category>): Category | null {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...data };
    saveDataFile('categories.json', this.categories);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_CATEGORY', `Sửa danh mục #${id}`);
    return this.categories[idx];
  }
  public static deleteCategory(id: number): boolean {
    const initialLen = this.categories.length;
    this.categories = this.categories.filter((c) => c.id !== id);
    saveDataFile('categories.json', this.categories);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_CATEGORY', `Xóa danh mục #${id}`);
    return this.categories.length < initialLen;
  }

  public static getProducts(): Product[] {
    return this.products;
  }
  public static getProductById(id: number): Product | undefined {
    return this.products.find((p) => p.id === id);
  }
  public static getProductImageGallery(id: number): ProductImage[] | undefined {
    const product = this.getProductById(id);
    return product ? this.buildProductImageLibrary(product) : undefined;
  }
  public static addProduct(product: Omit<Product, 'id'>): Product {
    const newId = this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;
    const newProduct: Product = {
      id: newId,
      stockQuantity: 100,
      minStockLevel: 15,
      ...product,
      image: product.image || product.images?.[0]?.url || '/icon.png',
    };
    newProduct.images = this.buildProductImageLibrary(newProduct);
    this.products.push(newProduct);
    saveDataFile('products.json', this.products);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'ADD_PRODUCT', `Thêm sản phẩm: ${newProduct.name} - ${newProduct.images.length} ảnh - Giá: ${newProduct.price}`);
    return newProduct;
  }
  public static updateProduct(id: number, data: Partial<Product>): Product | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updatedProduct = {
      ...this.products[idx],
      ...data,
      image: data.image || data.images?.[0]?.url || this.products[idx].image,
    };
    updatedProduct.images = this.buildProductImageLibrary(updatedProduct);
    this.products[idx] = updatedProduct;
    saveDataFile('products.json', this.products);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_PRODUCT', `Chỉnh sửa sản phẩm #${id} (${this.products[idx].name}) - ${this.products[idx].images?.length || 0} ảnh`);
    return this.products[idx];
  }
  public static deleteProduct(id: number): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    saveDataFile('products.json', this.products);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_PRODUCT', `Xóa sản phẩm #${id}`);
    return this.products.length < initialLen;
  }

  public static getStations(): Station[] {
    return this.stations;
  }

  private static toAffiliateStation(affiliate: AffiliateProfile, index: number): Station {
    return {
      id: 10000 + index,
      name: affiliate.name,
      image: affiliate.avatar,
      address: affiliate.address || 'Địa chỉ điểm nhận hàng của hội',
      location: affiliate.location || { lat: 10.773756, lng: 106.689247 },
      sourceType: affiliate.role as 'PRESIDENT' | 'BRANCH_LEADER',
      affiliateId: affiliate.userId,
      phone: affiliate.phone,
      levelName: affiliate.levelName || (affiliate.role === 'PRESIDENT' ? 'Chủ tịch hội cấp trên' : 'Chi hội trưởng trực thuộc'),
      presidentId: affiliate.presidentId,
    };
  }

  public static getPickupStations(referrerId?: string): Station[] {
    const storeStations = this.stations.map((station) => ({
      ...station,
      sourceType: 'STORE' as const,
    }));

    if (!referrerId) {
      return storeStations;
    }

    const referrer = this.affiliates.find((affiliate) => affiliate.userId === referrerId);
    if (!referrer || (referrer.role !== 'PRESIDENT' && referrer.role !== 'BRANCH_LEADER')) {
      return storeStations;
    }

    const affiliateChain = [
      referrer,
      ...(referrer.role === 'BRANCH_LEADER' && referrer.presidentId
        ? this.affiliates.filter((affiliate) => affiliate.userId === referrer.presidentId && affiliate.role === 'PRESIDENT')
        : []),
    ];

    const affiliateStations: Station[] = affiliateChain
      .map((affiliate, index) => ({
        ...this.toAffiliateStation(affiliate, index),
      }));

    return [...affiliateStations, ...storeStations];
  }
  public static addStation(station: Omit<Station, 'id'>): Station {
    const newId = this.stations.length > 0 ? Math.max(...this.stations.map((s) => s.id)) + 1 : 1;
    const newStation: Station = { id: newId, ...station };
    this.stations.push(newStation);
    saveDataFile('stations.json', this.stations);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'ADD_STATION', `Thêm điểm nhận: ${newStation.name}`);
    return newStation;
  }
  public static updateStation(id: number, data: Partial<Station>): Station | null {
    const idx = this.stations.findIndex((station) => station.id === id);
    if (idx === -1) return null;
    this.stations[idx] = {
      ...this.stations[idx],
      ...data,
      id,
      location: data.location || this.stations[idx].location,
    };
    saveDataFile('stations.json', this.stations);
    this.ensureMediaLibrary();
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_STATION', `Cập nhật điểm nhận #${id}`, String(id));
    return this.stations[idx];
  }
  public static deleteStation(id: number): boolean {
    const initialLen = this.stations.length;
    this.stations = this.stations.filter((s) => s.id !== id);
    if (this.stations.length === initialLen) return false;
    saveDataFile('stations.json', this.stations);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_STATION', `Xóa điểm nhận #${id}`);
    return true;
  }

  public static getCoupons(): Coupon[] {
    return this.coupons;
  }
  public static addCoupon(coupon: Omit<Coupon, 'id'>): Coupon {
    const newId = this.coupons.length > 0 ? Math.max(...this.coupons.map((c) => c.id)) + 1 : 1;
    const newCoupon: Coupon = { id: newId, ...coupon };
    this.coupons.push(newCoupon);
    saveDataFile('coupons.json', this.coupons);
    this.logAction('admin', 'SUPER_ADMIN', 'ADD_COUPON', `Tạo mã giảm giá: ${newCoupon.code}`);
    return newCoupon;
  }
  public static deleteCoupon(id: number): boolean {
    const initialLen = this.coupons.length;
    this.coupons = this.coupons.filter((c) => c.id !== id);
    saveDataFile('coupons.json', this.coupons);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_COUPON', `Xóa mã coupon #${id}`);
    return this.coupons.length < initialLen;
  }

  public static getAffiliates(): AffiliateProfile[] {
    return this.affiliates;
  }

  private static getAffiliateParent(affiliate: AffiliateProfile): AffiliateProfile | undefined {
    const parentId = affiliate.parentAffiliateId || affiliate.presidentId;
    if (!parentId) return undefined;
    return this.affiliates.find((item) => item.userId === parentId);
  }

  private static getTierOneAncestor(affiliate: AffiliateProfile): AffiliateProfile | undefined {
    if (getAffiliateTierLevel(affiliate) === 1) return affiliate;

    let current: AffiliateProfile | undefined = affiliate;
    const visited = new Set<string>();
    while (current && !visited.has(current.userId)) {
      visited.add(current.userId);
      const parent = this.getAffiliateParent(current);
      if (!parent) break;
      if (getAffiliateTierLevel(parent) === 1) return parent;
      current = parent;
    }

    return affiliate.presidentId
      ? this.affiliates.find((item) => item.userId === affiliate.presidentId && getAffiliateTierLevel(item) === 1)
      : this.affiliates.find((item) => getAffiliateTierLevel(item) === 1);
  }

  private static buildAffiliateHierarchyPath(affiliate: AffiliateProfile): string {
    const chain: AffiliateProfile[] = [];
    let current: AffiliateProfile | undefined = affiliate;
    const visited = new Set<string>();

    while (current && !visited.has(current.userId)) {
      visited.add(current.userId);
      chain.unshift(current);
      current = this.getAffiliateParent(current);
    }

    return chain
      .map((item) => item.levelName || defaultTierConfig(getAffiliateTierLevel(item)).levelName)
      .concat(affiliate.commissionLabel || defaultTierConfig(getAffiliateTierLevel(affiliate)).commissionLabel)
      .join(' > ');
  }

  public static upsertAffiliate(profile: AffiliateProfile): AffiliateProfile {
    const firstPresident = this.affiliates.find((affiliate) => affiliate.role === 'PRESIDENT');
    const tierLevel = profile.tierLevel || (profile.role === 'PRESIDENT' ? 1 : 2);
    const tierConfig = defaultTierConfig(tierLevel);
    const parentAffiliate = profile.parentAffiliateId
      ? this.affiliates.find((affiliate) => affiliate.userId === profile.parentAffiliateId)
      : undefined;
    const presidentId =
      tierLevel === 1
        ? undefined
        : tierLevel === 2
          ? profile.parentAffiliateId || profile.presidentId || firstPresident?.userId
          : parentAffiliate?.presidentId || profile.presidentId || firstPresident?.userId;
    const commissionRate = Number(profile.directCommissionRate || profile.overridingCommissionRate || tierConfig.rate);
    const normalizedProfile: AffiliateProfile = {
      ...profile,
      role: tierLevel === 1 ? 'PRESIDENT' : 'BRANCH_LEADER',
      tierLevel,
      levelName: profile.levelName?.trim() || tierConfig.levelName,
      commissionLabel: profile.commissionLabel?.trim() || tierConfig.commissionLabel,
      address: profile.address?.trim() || 'Địa chỉ điểm nhận hàng của hội',
      location: profile.location || { lat: 10.773756, lng: 106.689247 },
      parentAffiliateId: tierLevel === 1 ? undefined : profile.parentAffiliateId || presidentId,
      presidentId,
      qrCodeUrl: qrCodeFor(profile.userId, this.settings.publicSiteUrl),
      directCommissionRate: commissionRate,
      overridingCommissionRate: tierLevel === 1 ? commissionRate : 0,
    };

    const idx = this.affiliates.findIndex((a) => a.userId === profile.userId);
    if (idx > -1) {
      this.affiliates[idx] = { ...this.affiliates[idx], ...normalizedProfile };
    } else {
      this.affiliates.push(normalizedProfile);
    }
    saveDataFile('affiliates.json', this.affiliates);
    this.logAction('admin', 'SUPER_ADMIN', 'UPSERT_AFFILIATE', `Cập nhật tài khoản ${normalizedProfile.name} (${normalizedProfile.levelName})`);
    return normalizedProfile;
  }

  public static assignAffiliateCommission(
    userId: string,
    data: { commissionLabel?: string; rate?: number; tierLevel?: 1 | 2 | 3; levelName?: string; parentAffiliateId?: string }
  ): AffiliateProfile | null {
    const idx = this.affiliates.findIndex((affiliate) => affiliate.userId === userId);
    if (idx === -1) return null;

    const affiliate = this.affiliates[idx];
    const tierLevel = data.tierLevel || getAffiliateTierLevel(affiliate);
    const tierConfig = defaultTierConfig(tierLevel);
    const parentAffiliate = data.parentAffiliateId
      ? this.affiliates.find((item) => item.userId === data.parentAffiliateId)
      : undefined;
    const firstPresident = this.affiliates.find((item) => item.role === 'PRESIDENT');
    const presidentId =
      tierLevel === 1
        ? undefined
        : tierLevel === 2
          ? data.parentAffiliateId || affiliate.parentAffiliateId || affiliate.presidentId || firstPresident?.userId
          : parentAffiliate?.presidentId || affiliate.presidentId || firstPresident?.userId;
    const nextRate = Math.max(0, Number(data.rate ?? 0));
    const nextProfile: AffiliateProfile = {
      ...affiliate,
      role: tierLevel === 1 ? 'PRESIDENT' : 'BRANCH_LEADER',
      tierLevel,
      levelName: data.levelName?.trim() || affiliate.levelName || tierConfig.levelName,
      commissionLabel: data.commissionLabel?.trim() || affiliate.commissionLabel || tierConfig.commissionLabel,
      parentAffiliateId: tierLevel === 1 ? undefined : data.parentAffiliateId || affiliate.parentAffiliateId || presidentId,
      presidentId,
      qrCodeUrl: qrCodeFor(affiliate.userId, this.settings.publicSiteUrl),
      directCommissionRate: nextRate || tierConfig.rate,
      overridingCommissionRate: tierLevel === 1 ? (nextRate || tierConfig.rate) : 0,
    };

    this.affiliates[idx] = nextProfile;
    saveDataFile('affiliates.json', this.affiliates);
    this.logAction(
      'admin',
      'SUPER_ADMIN',
      'ASSIGN_COMMISSION',
      `Gán ${nextProfile.commissionLabel} ${nextRate}% cho ${nextProfile.name}`,
      userId
    );
    return nextProfile;
  }

  public static deleteAffiliate(userId: string): boolean {
    const hasChildren = this.affiliates.some(
      (affiliate) => affiliate.parentAffiliateId === userId || affiliate.presidentId === userId
    );
    if (hasChildren) {
      throw new Error('Không thể xóa hội viên đang có cấp dưới. Vui lòng chuyển cấp dưới trước.');
    }

    const initialLen = this.affiliates.length;
    this.affiliates = this.affiliates.filter((affiliate) => affiliate.userId !== userId);
    if (this.affiliates.length === initialLen) return false;
    saveDataFile('affiliates.json', this.affiliates);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_AFFILIATE', `Xóa hội viên ${userId}`, userId);
    return true;
  }

  public static registerAffiliateFromCustomer(data: {
    name?: string;
    phone: string;
    address?: string;
    note?: string;
  }): AffiliateProfile {
    const existing = this.affiliates.find((affiliate) => affiliate.phone === data.phone);
    if (existing) {
      return existing;
    }

    const firstPresident = this.affiliates.find((affiliate) => affiliate.role === 'PRESIDENT');
    const firstTierTwo = this.affiliates.find((affiliate) => getAffiliateTierLevel(affiliate) === 2);
    const suffix = data.phone.slice(-6);
    const userId = `agent-${suffix}`;
    const profile: AffiliateProfile = {
      userId,
      name: String(data.name || `Đại lý ${suffix}`).trim(),
      phone: data.phone,
      address: String(data.address || 'Địa chỉ đại lý mới đăng ký').trim(),
      avatar: DEFAULT_AVATAR,
      role: 'BRANCH_LEADER',
      tierLevel: 3,
      levelName: defaultTierConfig(3).levelName,
      commissionLabel: defaultTierConfig(3).commissionLabel,
      parentAffiliateId: firstTierTwo?.userId || firstPresident?.userId,
      presidentId: firstTierTwo?.presidentId || firstPresident?.userId,
      referralCode: `DL-${suffix}`,
      qrCodeUrl: qrCodeFor(userId, this.settings.publicSiteUrl),
      directCommissionRate: defaultTierConfig(3).rate,
      overridingCommissionRate: 0,
      walletBalance: 0,
      totalSales: 0,
    };

    this.affiliates.push(profile);
    saveDataFile('affiliates.json', this.affiliates);
    this.logAction('system', 'SUPER_ADMIN', 'REGISTER_AFFILIATE', `Khách hàng ${profile.name} đăng ký làm đại lý${data.note ? `: ${data.note}` : ''}`);
    return profile;
  }

  public static getConsignmentStocks(): ConsignmentStock[] {
    return this.consignmentStocks;
  }

  public static allocateConsignment(presidentId: string, productId: number, quantity: number): ConsignmentStock {
    const president = this.affiliates.find((a) => a.userId === presidentId);
    const product = this.products.find((p) => p.id === productId);
    const pName = president ? president.name : 'Chủ tịch hội';
    const prodName = product ? product.name : `Sản phẩm #${productId}`;
    const price = product ? product.price : 100000;

    const existingIdx = this.consignmentStocks.findIndex(
      (c) => c.presidentId === presidentId && c.productId === productId
    );

    let resultStock: ConsignmentStock;

    if (existingIdx > -1) {
      this.consignmentStocks[existingIdx].allocatedQuantity += quantity;
      this.consignmentStocks[existingIdx].remainingQuantity += quantity;
      this.consignmentStocks[existingIdx].debtAmount += quantity * price;
      resultStock = this.consignmentStocks[existingIdx];
    } else {
      const newId = this.consignmentStocks.length > 0 ? Math.max(...this.consignmentStocks.map((c) => c.id)) + 1 : 1;
      resultStock = {
        id: newId,
        presidentId,
        presidentName: pName,
        productId,
        productName: prodName,
        allocatedQuantity: quantity,
        soldQuantity: 0,
        remainingQuantity: quantity,
        debtAmount: quantity * price,
      };
      this.consignmentStocks.push(resultStock);
    }

    saveDataFile('consignments.json', this.consignmentStocks);
    this.logAction('admin', 'SUPER_ADMIN', 'ALLOCATE_CONSIGNMENT', `Xuất ứng trước ${quantity} ${prodName} cho Chủ tịch ${pName}`);
    return resultStock;
  }

  public static updateConsignment(id: number, data: Partial<ConsignmentStock>): ConsignmentStock | null {
    const idx = this.consignmentStocks.findIndex((stock) => stock.id === id);
    if (idx === -1) return null;

    const president = data.presidentId
      ? this.affiliates.find((affiliate) => affiliate.userId === data.presidentId)
      : undefined;
    const product = data.productId
      ? this.products.find((item) => item.id === Number(data.productId))
      : undefined;

    this.consignmentStocks[idx] = {
      ...this.consignmentStocks[idx],
      ...data,
      id,
      presidentName: president?.name || data.presidentName || this.consignmentStocks[idx].presidentName,
      productName: product?.name || data.productName || this.consignmentStocks[idx].productName,
      allocatedQuantity: Number(data.allocatedQuantity ?? this.consignmentStocks[idx].allocatedQuantity),
      soldQuantity: Number(data.soldQuantity ?? this.consignmentStocks[idx].soldQuantity),
      remainingQuantity: Number(data.remainingQuantity ?? this.consignmentStocks[idx].remainingQuantity),
      debtAmount: Number(data.debtAmount ?? this.consignmentStocks[idx].debtAmount),
    };

    saveDataFile('consignments.json', this.consignmentStocks);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_CONSIGNMENT', `Cập nhật gối đầu #${id}`, String(id));
    return this.consignmentStocks[idx];
  }

  public static deleteConsignment(id: number): boolean {
    const initialLen = this.consignmentStocks.length;
    this.consignmentStocks = this.consignmentStocks.filter((stock) => stock.id !== id);
    if (this.consignmentStocks.length === initialLen) return false;
    saveDataFile('consignments.json', this.consignmentStocks);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_CONSIGNMENT', `Xóa gối đầu #${id}`, String(id));
    return true;
  }

  public static getDeliveries(): InHouseDelivery[] {
    return this.deliveries;
  }

  public static getDeliveryByOrderId(orderId: number): InHouseDelivery | undefined {
    return this.deliveries.find((d) => d.orderId === orderId);
  }
  public static assignDelivery(orderId: number, driverName: string, driverPhone: string, vehicleNumber: string): InHouseDelivery {
    const order = this.orders.find((o) => o.id === orderId);
    const existingIdx = this.deliveries.findIndex((d) => d.orderId === orderId);

    const deliveryData: InHouseDelivery = {
      id: existingIdx > -1 ? this.deliveries[existingIdx].id : (this.deliveries.length > 0 ? Math.max(...this.deliveries.map((d) => d.id)) + 1 : 1),
      orderId,
      driverName,
      driverPhone,
      vehicleNumber,
      deliveryStatus: 'assigned',
      recipientName: order?.delivery?.name || 'Khách hàng',
      recipientPhone: order?.delivery?.phone || '0912345678',
      recipientAddress: order?.delivery?.address || 'Địa chỉ giao hàng',
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx > -1) {
      this.deliveries[existingIdx] = deliveryData;
    } else {
      this.deliveries.push(deliveryData);
    }
    saveDataFile('deliveries.json', this.deliveries);

    this.updateOrderStatus(orderId, 'shipping');
    this.logAction('admin', 'SUPER_ADMIN', 'ASSIGN_DELIVERY', `Điều phối đơn #${orderId} cho tài xế ${driverName} (${vehicleNumber})`);
    return deliveryData;
  }

  public static updateDelivery(id: number, data: Partial<InHouseDelivery>): InHouseDelivery | null {
    const idx = this.deliveries.findIndex((delivery) => delivery.id === id);
    if (idx === -1) return null;
    this.deliveries[idx] = {
      ...this.deliveries[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    saveDataFile('deliveries.json', this.deliveries);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_DELIVERY', `Cập nhật vận chuyển #${id}`, String(id));
    return this.deliveries[idx];
  }

  public static deleteDelivery(id: number): boolean {
    const initialLen = this.deliveries.length;
    this.deliveries = this.deliveries.filter((delivery) => delivery.id !== id);
    if (this.deliveries.length === initialLen) return false;
    saveDataFile('deliveries.json', this.deliveries);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_DELIVERY', `Xóa vận chuyển #${id}`, String(id));
    return true;
  }

  public static updateDeliveryStatus(id: number, status: DeliveryStatus, proofImage?: string): InHouseDelivery | null {
    const idx = this.deliveries.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.deliveries[idx].deliveryStatus = status;
    this.deliveries[idx].updatedAt = new Date().toISOString();
    if (proofImage) {
      this.deliveries[idx].proofImage = proofImage;
    }
    saveDataFile('deliveries.json', this.deliveries);

    if (status === 'delivered') {
      this.updateOrderStatus(this.deliveries[idx].orderId, 'completed', 'success');
      this.logAction('admin', 'SUPER_ADMIN', 'DELIVERY_SUCCESS', `Giao thành công đơn #${this.deliveries[idx].orderId}`);
    }
    return this.deliveries[idx];
  }

  public static getCommissions(): CommissionRecord[] {
    return this.commissions;
  }

  public static getAffiliatePortalSummary(): AffiliatePortalSummary {
    const branchesByPresident = this.affiliates
      .filter((affiliate) => affiliate.role === 'BRANCH_LEADER' && affiliate.presidentId)
      .reduce<Record<string, AffiliateProfile[]>>((groups, branch) => {
        const presidentId = branch.presidentId!;
        groups[presidentId] = groups[presidentId] || [];
        groups[presidentId].push(branch);
        return groups;
      }, {});

    return {
      affiliates: this.affiliates,
      consignments: this.consignmentStocks,
      settlements: this.settlements,
      commissions: this.commissions,
      branchesByPresident,
      hierarchy: this.affiliates
        .filter((affiliate) => affiliate.role === 'PRESIDENT')
        .map((president) => ({
          president,
          branches: branchesByPresident[president.userId] || [],
        })),
    };
  }

  public static getOrders(status?: string, phone?: string): Order[] {
    const normalizePhone = (value?: string) => {
      const digits = String(value || '').replace(/\D/g, '');
      return digits.replace(/^84(?=\d{8,10}$)/, '0');
    };
    const normalizedPhone = normalizePhone(phone);

    return this.orders.filter((order) => {
      const matchesStatus = !status || order.status === status;
      const matchesPhone = !normalizedPhone || normalizePhone(order.delivery?.phone) === normalizedPhone;
      return matchesStatus && matchesPhone;
    });
  }

  public static getOrderById(id: number): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  public static createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>): Order {
    const normalizedItems = this.normalizeOrderItems(orderData.items);
    if (normalizedItems.length === 0) {
      throw new Error('Đơn hàng cần có ít nhất một sản phẩm hợp lệ');
    }

    const fallbackCustomer: User = {
      id: 'order-customer',
      name: orderData.delivery?.name || 'Khách hàng',
      avatar: DEFAULT_AVATAR,
      phone: normalizeVietnamPhone(orderData.delivery?.phone) || '0912345678',
      address: orderData.delivery?.address || 'Địa chỉ giao hàng',
    };
    const delivery = this.normalizeOrderDelivery(orderData, fallbackCustomer);
    const paymentMethod = normalizePaymentMethod(orderData.paymentMethod);
    const subtotalAfterCoupon = this.calculateOrderTotal(normalizedItems, orderData.couponCode);
    const referrer = orderData.referrerId
      ? this.affiliates.find((a) => a.userId === orderData.referrerId)
      : undefined;
    const commissionSettlementMode = this.settings.commissionSettlementMode || 'ORDER_DISCOUNT';
    const referrerRate = referrer ? getAffiliateCommissionRate(referrer) : 0;
    const commissionDiscountAmount =
      referrer && commissionSettlementMode === 'ORDER_DISCOUNT'
        ? Math.round((subtotalAfterCoupon * referrerRate) / 100)
        : 0;
    const total = Math.max(0, subtotalAfterCoupon - commissionDiscountAmount);
    const newId = this.orders.length > 0 ? Math.max(...this.orders.map((o) => o.id)) + 1 : 10001;
    const newOrder: Order = {
      id: newId,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      ...orderData,
      items: normalizedItems,
      delivery,
      total,
      paymentMethod,
      commissionSettlementMode,
      commissionDiscountAmount,
      commissionDiscountBeneficiaryId: commissionDiscountAmount > 0 ? referrer?.userId : undefined,
    };
    this.orders.unshift(newOrder);
    saveDataFile('orders.json', this.orders);

    // Deduct main stock
    normalizedItems.forEach((item) => {
      const prod = this.products.find((p) => p.id === item.product.id);
      if (prod && prod.stockQuantity) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      }
    });
    saveDataFile('products.json', this.products);

    // Calculate affiliate tier commissions. The referrer always receives their own tier rate;
    // the tier-one ancestor also receives the global network rate for downstream orders.
    if (orderData.referrerId) {
      if (referrer) {
        referrer.totalSales += newOrder.total;

        if (commissionSettlementMode === 'MANUAL_PAYOUT') {
          const comm1: CommissionRecord = {
            id: this.commissions.length + 1,
            orderId: newOrder.id,
            beneficiaryId: referrer.userId,
            beneficiaryName: referrer.name,
            beneficiaryRole: referrer.role,
            amount: Math.round((subtotalAfterCoupon * referrerRate) / 100),
            type: 'TIER_DIRECT',
            commissionName: referrer.commissionLabel || defaultTierConfig(getAffiliateTierLevel(referrer)).commissionLabel,
            commissionRate: referrerRate,
            hierarchyPath: this.buildAffiliateHierarchyPath(referrer),
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          this.commissions.push(comm1);
        }

        const tierOne = this.getTierOneAncestor(referrer);
        if (commissionSettlementMode === 'MANUAL_PAYOUT' && tierOne && tierOne.userId !== referrer.userId) {
            tierOne.totalSales += newOrder.total;
            const tierOneRate = getAffiliateCommissionRate(tierOne);
            const comm2: CommissionRecord = {
              id: this.commissions.length + 1,
              orderId: newOrder.id,
              beneficiaryId: tierOne.userId,
              beneficiaryName: tierOne.name,
              beneficiaryRole: tierOne.role,
              amount: Math.round((subtotalAfterCoupon * tierOneRate) / 100),
              type: 'TIER_ONE_GLOBAL',
              commissionName: tierOne.commissionLabel || defaultTierConfig(1).commissionLabel,
              commissionRate: tierOneRate,
              hierarchyPath: this.buildAffiliateHierarchyPath(tierOne),
              status: 'pending',
              createdAt: new Date().toISOString(),
            };
            this.commissions.push(comm2);

        }

        if (tierOne) {
          normalizedItems.forEach((item) => {
            const cStock = this.consignmentStocks.find(
              (c) => c.presidentId === tierOne.userId && c.productId === item.product.id
            );
            if (cStock) {
              cStock.soldQuantity += item.quantity;
              cStock.remainingQuantity = Math.max(0, cStock.remainingQuantity - item.quantity);
            }
          });
          saveDataFile('consignments.json', this.consignmentStocks);
        }
        saveDataFile('commissions.json', this.commissions);
        saveDataFile('affiliates.json', this.affiliates);
      }
    }

    return newOrder;
  }

  public static checkAndUpdatePaymentStatus(id: number): Order | null {
    const order = this.getOrderById(id);
    if (!order) return null;
    if (order.paymentStatus !== 'pending') return order;

    const method = order.paymentMethod || 'COD';
    if (method === 'COD') return order;

    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    if (process.env.PAYMENT_DEMO_AUTO_CONFIRM === 'true' && elapsedMs >= 20000) {
      order.paymentStatus = 'success';
      order.paymentProvider = 'DEMO_AUTO_CONFIRM';
      order.paymentCheckedAt = new Date().toISOString();
      saveDataFile('orders.json', this.orders);
      this.logAction('system', 'PAYMENT_BOT', 'AUTO_PAYMENT_CONFIRMED', `Tự động xác nhận thanh toán ${method} cho đơn #${id}`, String(id));
    }

    return order;
  }

  public static confirmOrderPayment(
    id: number,
    payment: { provider: string; reference?: string; amount?: number; paidAt?: string }
  ): Order | null {
    const idx = this.orders.findIndex((order) => order.id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    const order = this.orders[idx];
    const wasPending = order.paymentStatus !== 'success';

    this.orders[idx] = {
      ...order,
      paymentStatus: 'success',
      paymentProvider: payment.provider,
      paymentReference: payment.reference || order.paymentReference,
      paymentAmount: payment.amount || order.paymentAmount,
      paymentPaidAt: payment.paidAt || order.paymentPaidAt || now,
      paymentCheckedAt: now,
    };

    saveDataFile('orders.json', this.orders);
    if (wasPending) {
      this.logAction(
        'system',
        'PAYMENT_BOT',
        'PAYMENT_CONFIRMED',
        `Xác nhận thanh toán ${payment.provider} cho đơn #${id}${payment.reference ? ` (${payment.reference})` : ''}`,
        String(id)
      );
    }

    return this.orders[idx];
  }

  public static getOrderTracking(id: number): OrderTracking | null {
    const order = this.checkAndUpdatePaymentStatus(id);
    if (!order) return null;

    const delivery = this.getDeliveryByOrderId(id);
    const deliveryStatus = delivery?.deliveryStatus;
    const isCancelled = order.status === 'cancelled' || deliveryStatus === 'failed';
    const branchLeader = order.referrerId
      ? this.affiliates.find((a) => a.userId === order.referrerId && a.role === 'BRANCH_LEADER')
      : undefined;
    const president = branchLeader?.presidentId
      ? this.affiliates.find((a) => a.userId === branchLeader.presidentId && a.role === 'PRESIDENT')
      : this.affiliates.find((a) => a.userId === order.referrerId && a.role === 'PRESIDENT');
    const hasAffiliateChain = Boolean(president || branchLeader);
    const chainStarted = order.status !== 'pending' || Boolean(delivery);
    const reachedPresident = hasAffiliateChain && chainStarted;
    const reachedBranchLeader = Boolean(branchLeader) && (deliveryStatus === 'delivering' || deliveryStatus === 'delivered' || order.status === 'completed');

    const timeline: DeliveryTrackingEvent[] = [
      {
        key: 'created',
        label: 'Đã đặt hàng',
        description: 'Hệ thống đã ghi nhận đơn hàng của bạn.',
        status: 'done',
        time: order.createdAt,
      },
      {
        key: 'confirmed',
        label: 'Đang xác nhận',
        description: order.paymentStatus === 'success'
          ? 'Thanh toán đã được xác nhận, đơn hàng sẵn sàng xử lý.'
          : 'Đơn hàng đang chờ xác nhận thanh toán hoặc xác nhận từ cửa hàng.',
        status: isCancelled ? 'failed' : order.status === 'pending' ? 'current' : 'done',
      },
      ...(hasAffiliateChain
        ? [
            {
              key: 'president_hub',
              label: `Đã đến ${president?.levelName || 'Chủ tịch hội'}`,
              description: president
                ? `Đơn hàng đã được ghi nhận tại tuyến ${president.levelName || 'Chủ tịch hội'} ${president.name}.`
                : 'Đơn hàng đang được điều phối qua tuyến Chủ tịch hội.',
              status: isCancelled ? 'failed' : reachedPresident ? 'done' : 'pending',
              time: reachedPresident ? delivery?.updatedAt || order.createdAt : undefined,
            } satisfies DeliveryTrackingEvent,
            {
              key: 'branch_leader_hub',
              label: `Đã đến ${branchLeader?.levelName || 'Chi hội trưởng'}`,
              description: branchLeader
                ? `${branchLeader.levelName || 'Chi hội trưởng'} ${branchLeader.name} đang theo dõi và hỗ trợ đơn hàng.`
                : 'Đơn hàng không đi qua Chi hội trưởng cụ thể.',
              status: isCancelled ? 'failed' : reachedBranchLeader ? 'done' : branchLeader ? 'current' : 'pending',
              time: reachedBranchLeader ? delivery?.updatedAt || order.createdAt : undefined,
            } satisfies DeliveryTrackingEvent,
          ]
        : [
            {
              key: 'company_direct',
              label: 'Công ty xử lý trực tiếp',
              description: 'Đơn hàng được xử lý trực tiếp từ cửa hàng/kho trung tâm.',
              status: isCancelled ? 'failed' : order.status === 'pending' ? 'current' : 'done',
              time: order.status === 'pending' ? undefined : order.createdAt,
            } satisfies DeliveryTrackingEvent,
          ]),
      {
        key: 'assigned',
        label: 'Đã phân công giao hàng',
        description: delivery
          ? `${delivery.driverName} (${delivery.vehicleNumber}) đã nhận lịch giao.`
          : 'Cửa hàng sẽ phân công tài xế khi đơn sẵn sàng.',
        status: isCancelled ? 'failed' : delivery ? 'done' : 'pending',
        time: delivery?.updatedAt,
      },
      {
        key: 'delivering',
        label: 'Đang vận chuyển',
        description: deliveryStatus === 'delivering'
          ? 'Tài xế đang trên đường giao hàng đến bạn.'
          : 'Đơn hàng sẽ được cập nhật khi tài xế bắt đầu di chuyển.',
        status: isCancelled ? 'failed' : deliveryStatus === 'delivering' ? 'current' : deliveryStatus === 'delivered' ? 'done' : 'pending',
        time: deliveryStatus === 'delivering' ? delivery?.updatedAt : undefined,
      },
      {
        key: 'delivered',
        label: 'Giao hàng thành công',
        description: deliveryStatus === 'delivered' || order.status === 'completed'
          ? 'Đơn hàng đã hoàn tất. Cảm ơn bạn đã mua hàng.'
          : 'Đang chờ xác nhận giao hàng thành công.',
        status: isCancelled ? 'failed' : deliveryStatus === 'delivered' || order.status === 'completed' ? 'done' : 'pending',
        time: order.receivedAt,
      },
    ];

    return {
      order,
      delivery,
      distribution: {
        president: president
          ? { userId: president.userId, name: president.name, phone: president.phone, role: president.role, levelName: president.levelName }
          : undefined,
        branchLeader: branchLeader
          ? { userId: branchLeader.userId, name: branchLeader.name, phone: branchLeader.phone, role: branchLeader.role, levelName: branchLeader.levelName }
          : undefined,
        mode: hasAffiliateChain ? 'AFFILIATE_CHAIN' : 'DIRECT',
        message: hasAffiliateChain
          ? `Đơn hàng đang đi qua tuyến ${president ? `${president.levelName || 'Chủ tịch hội'} ${president.name}` : 'Chủ tịch hội'}${branchLeader ? ` và ${branchLeader.levelName || 'Chi hội trưởng'} ${branchLeader.name}` : ''}.`
          : 'Đơn hàng được xử lý trực tiếp bởi cửa hàng.',
      },
      payment: {
        status: order.paymentStatus,
        method: order.paymentMethod || 'COD',
        autoCheckEnabled: (order.paymentMethod || 'COD') !== 'COD' && order.paymentStatus === 'pending',
        lastCheckedAt: order.paymentCheckedAt || new Date().toISOString(),
        message:
          order.paymentStatus === 'success'
            ? 'Thanh toán đã được xác nhận qua hệ thống.'
            : (order.paymentMethod || 'COD') === 'COD'
            ? 'Đơn hàng COD sẽ thanh toán khi nhận hàng.'
            : 'Hệ thống đang chờ SePay báo giao dịch khớp mã đơn.',
      },
      timeline,
    };
  }

  public static updateOrderStatus(id: number, status: Order['status'], paymentStatus?: Order['paymentStatus']): Order | null {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.orders[idx].status = status;
    if (paymentStatus) {
      this.orders[idx].paymentStatus = paymentStatus;
    }
    if (status === 'completed') {
      this.orders[idx].receivedAt = new Date().toISOString();
      this.commissions
        .filter((c) => c.orderId === id && c.status === 'pending')
        .forEach((c) => {
          c.status = 'available';
          const aff = this.affiliates.find((a) => a.userId === c.beneficiaryId);
          if (aff) {
            aff.walletBalance += c.amount;
          }
        });
      saveDataFile('commissions.json', this.commissions);
      saveDataFile('affiliates.json', this.affiliates);
    }
    saveDataFile('orders.json', this.orders);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_ORDER_STATUS', `Đổi trạng thái đơn #${id} thành ${status}`);
    return this.orders[idx];
  }

  public static getUsers(): User[] {
    return this.users;
  }

  public static getSettings(): PlatformSettings {
    return this.settings;
  }

  private static maskSecret(value?: string): string {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
  }

  public static getPaymentConfig() {
    return {
      publicSiteUrl: this.settings.publicSiteUrl,
      vietQrBankId: this.settings.vietQrBankId,
      vietQrAccountNo: this.settings.vietQrAccountNo,
      vietQrAccountName: this.settings.vietQrAccountName,
      sepayWebhookEnabled: this.settings.sepayWebhookEnabled,
      sepayWebhookApiKey: this.settings.sepayWebhookApiKey,
    };
  }

  public static getAdminSettings() {
    return {
      ...this.settings,
      sepayWebhookApiKey: this.maskSecret(this.settings.sepayWebhookApiKey),
      sepayWebhookHasApiKey: Boolean(this.settings.sepayWebhookApiKey),
    };
  }

  public static updateSettings(data: Partial<PlatformSettings>): PlatformSettings {
    const incomingSepayKey = data.sepayWebhookApiKey?.trim();
    const shouldKeepSepayKey =
      incomingSepayKey === undefined ||
      incomingSepayKey === '' ||
      incomingSepayKey.includes('••••');

    const nextSettings: PlatformSettings = {
      ...this.settings,
      shopName: data.shopName?.trim() || this.settings.shopName,
      brandColor: data.brandColor?.trim() || this.settings.brandColor,
      hotline: data.hotline?.trim() || this.settings.hotline,
      supportEmail: data.supportEmail?.trim() || this.settings.supportEmail,
      businessAddress: data.businessAddress?.trim() || this.settings.businessAddress,
      publicSiteUrl: data.publicSiteUrl?.trim() || this.settings.publicSiteUrl,
      zaloOaUrl: data.zaloOaUrl?.trim() || this.settings.zaloOaUrl,
      vietQrBankId: data.vietQrBankId?.trim().toUpperCase() || this.settings.vietQrBankId,
      vietQrAccountNo: data.vietQrAccountNo?.trim() || this.settings.vietQrAccountNo,
      vietQrAccountName: data.vietQrAccountName?.trim() || this.settings.vietQrAccountName,
      sepayWebhookEnabled: data.sepayWebhookEnabled ?? this.settings.sepayWebhookEnabled,
      sepayWebhookApiKey: shouldKeepSepayKey ? this.settings.sepayWebhookApiKey : incomingSepayKey,
      commissionSettlementMode:
        data.commissionSettlementMode === 'MANUAL_PAYOUT' ? 'MANUAL_PAYOUT' : 'ORDER_DISCOUNT',
      maintenanceMode: Boolean(data.maintenanceMode),
      maintenanceMessage: data.maintenanceMessage?.trim() || this.settings.maintenanceMessage,
      updatedAt: new Date().toISOString(),
    };
    this.settings = nextSettings;
    saveDataFile('settings.json', this.settings);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_SETTINGS', 'Cập nhật cài đặt nền tảng');
    return this.settings;
  }

  public static getStaffMembers(): StaffMember[] {
    return this.staffMembers.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private static wouldCreateStaffCycle(staffId: number, managerId: number): boolean {
    let currentManagerId: number | null | undefined = managerId;
    const visited = new Set<number>();

    while (currentManagerId) {
      if (currentManagerId === staffId) return true;
      if (visited.has(currentManagerId)) return true;

      visited.add(currentManagerId);
      const manager = this.staffMembers.find((member) => member.id === currentManagerId);
      if (!manager) return false;
      currentManagerId = manager.managerId;
    }

    return false;
  }

  public static upsertStaffMember(data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }): StaffMember {
    const now = new Date().toISOString();
    const staffId = data.id || (this.staffMembers.length > 0 ? Math.max(...this.staffMembers.map((member) => member.id)) + 1 : 1);
    const managerId = data.managerId ? Number(data.managerId) : undefined;

    if (managerId) {
      if (!Number.isFinite(managerId)) {
        throw new Error('Cấp trên trực tiếp không hợp lệ');
      }
      if (managerId === staffId) {
        throw new Error('Nhân sự không thể tự làm cấp trên của chính mình');
      }
      if (!this.staffMembers.some((member) => member.id === managerId)) {
        throw new Error('Cấp trên trực tiếp không tồn tại');
      }
      if (this.wouldCreateStaffCycle(staffId, managerId)) {
        throw new Error('Không thể chọn cấp dưới làm cấp trên trực tiếp');
      }
    }

    const normalized: StaffMember = {
      id: staffId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || '',
      role: data.role || 'SUPPORT',
      status: data.status || 'active',
      department: data.department?.trim() || 'Vận hành',
      managerId,
      note: data.note?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    const idx = this.staffMembers.findIndex((member) => member.id === normalized.id);
    if (idx > -1) {
      normalized.createdAt = this.staffMembers[idx].createdAt;
      this.staffMembers[idx] = normalized;
    } else {
      this.staffMembers.unshift(normalized);
    }

    saveDataFile('staff.json', this.staffMembers);
    this.logAction('admin', 'SUPER_ADMIN', 'UPSERT_STAFF', `Cập nhật nhân sự ${normalized.name} (${normalized.role})`, String(normalized.id));
    return normalized;
  }

  public static updateStaffStatus(id: number, status: StaffStatus): StaffMember | null {
    const idx = this.staffMembers.findIndex((member) => member.id === id);
    if (idx === -1) return null;
    this.staffMembers[idx] = {
      ...this.staffMembers[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    saveDataFile('staff.json', this.staffMembers);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_STAFF_STATUS', `Đổi trạng thái nhân sự #${id} thành ${status}`, String(id));
    return this.staffMembers[idx];
  }

  public static deleteStaffMember(id: number): boolean {
    const hasChildren = this.staffMembers.some((member) => member.managerId === id);
    if (hasChildren) {
      throw new Error('Không thể xóa nhân sự đang là cấp trên. Vui lòng chuyển cấp dưới trước.');
    }
    const initialLen = this.staffMembers.length;
    this.staffMembers = this.staffMembers.filter((member) => member.id !== id);
    if (this.staffMembers.length === initialLen) return false;
    saveDataFile('staff.json', this.staffMembers);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_STAFF', `Xóa nhân sự #${id}`, String(id));
    return true;
  }

  public static findUserByPhone(phone: string): User | undefined {
    return this.users.find((user) => user.phone === phone);
  }

  public static updateUser(id: string, data: Partial<User>): User | null {
    const idx = this.users.findIndex((user) => user.id === id);
    if (idx === -1) return null;
    this.users[idx] = {
      ...this.users[idx],
      ...data,
      id,
      phone: data.phone ? normalizeVietnamPhone(data.phone) || data.phone : this.users[idx].phone,
      name: data.name?.trim() || this.users[idx].name,
      email: data.email?.trim() ?? this.users[idx].email,
      address: data.address?.trim() ?? this.users[idx].address,
    };
    saveDataFile('users.json', this.users);
    this.logAction('admin', 'SUPER_ADMIN', 'UPDATE_USER', `Cập nhật khách hàng ${this.users[idx].name}`, id);
    return this.users[idx];
  }

  public static deleteUser(id: string): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter((user) => user.id !== id);
    if (this.users.length === initialLen) return false;
    saveDataFile('users.json', this.users);
    this.logAction('admin', 'SUPER_ADMIN', 'DELETE_USER', `Xóa khách hàng ${id}`, id);
    return true;
  }

  public static getUserAddresses(phone: string): CustomerAddress[] {
    const normalizedPhone = normalizeVietnamPhone(phone);
    const user = this.users.find((item) => normalizeVietnamPhone(item.phone) === normalizedPhone);
    return user?.addresses || [];
  }

  public static upsertUserAddress(phone: string, data: Partial<CustomerAddress>): CustomerAddress {
    const normalizedPhone = normalizeVietnamPhone(phone);
    const now = new Date().toISOString();
    let user = this.users.find((item) => normalizeVietnamPhone(item.phone) === normalizedPhone);
    if (!user) {
      user = this.upsertPhoneUser({
        phone: normalizedPhone,
        name: data.name || `Khách hàng ${normalizedPhone.slice(-4)}`,
        address: data.address,
      });
    }

    const addresses = user.addresses || [];
    const id = data.id || `addr-${Date.now()}`;
    const idx = addresses.findIndex((address) => address.id === id);
    const nextAddress: CustomerAddress = {
      id,
      alias: data.alias?.trim() || 'Nhà riêng',
      name: data.name?.trim() || user.name,
      phone: normalizeVietnamPhone(data.phone) || user.phone,
      address: data.address?.trim() || user.address || 'Địa chỉ giao hàng',
      streetAddress: data.streetAddress?.trim(),
      ward: data.ward?.trim(),
      province: data.province?.trim(),
      location: data.location,
      locationSource: data.locationSource,
      isDefault: data.isDefault ?? addresses.length === 0,
      createdAt: idx > -1 ? addresses[idx].createdAt : now,
      updatedAt: now,
    };

    const nextAddresses = idx > -1
      ? addresses.map((address) => (address.id === id ? nextAddress : address))
      : [nextAddress, ...addresses];

    user.addresses = nextAddress.isDefault
      ? nextAddresses.map((address) => ({ ...address, isDefault: address.id === id }))
      : nextAddresses;
    if (nextAddress.isDefault) {
      user.address = nextAddress.address;
    }

    saveDataFile('users.json', this.users);
    this.logAction('system', 'CUSTOMER', 'UPSERT_USER_ADDRESS', `Lưu địa chỉ giao nhận cho ${user.phone}`, user.id);
    return nextAddress;
  }

  public static deleteUserAddress(phone: string, addressId: string): boolean {
    const normalizedPhone = normalizeVietnamPhone(phone);
    const user = this.users.find((item) => normalizeVietnamPhone(item.phone) === normalizedPhone);
    if (!user?.addresses) return false;
    const initialLen = user.addresses.length;
    user.addresses = user.addresses.filter((address) => address.id !== addressId);
    if (user.addresses.length === initialLen) return false;
    if (!user.addresses.some((address) => address.isDefault) && user.addresses[0]) {
      user.addresses[0].isDefault = true;
      user.address = user.addresses[0].address;
    }
    saveDataFile('users.json', this.users);
    this.logAction('system', 'CUSTOMER', 'DELETE_USER_ADDRESS', `Xóa địa chỉ giao nhận ${addressId}`, user.id);
    return true;
  }

  public static upsertPhoneUser(data: { phone: string; name?: string; email?: string; id?: string; avatar?: string; address?: string }): User {
    const now = new Date().toISOString();
    const existingIndex = this.users.findIndex((user) => user.phone === data.phone);

    if (existingIndex > -1) {
      const existing = this.users[existingIndex];
      this.users[existingIndex] = {
        ...existing,
        id: existing.id.startsWith('web-u-') && data.id ? data.id : existing.id,
        name: data.name?.trim() || existing.name,
        avatar: data.avatar || existing.avatar,
        email: data.email?.trim() || existing.email,
        address: data.address ?? existing.address,
        lastLoginAt: now,
      };
      saveDataFile('users.json', this.users);
      return this.users[existingIndex];
    }

    const name = data.name?.trim() || `Khách hàng ${data.phone.slice(-4)}`;
    const user: User = {
      id: data.id || `web-u-${Date.now()}`,
      name,
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1570ef&color=fff`,
      phone: data.phone,
      email: data.email?.trim() || '',
      address: data.address || '',
      createdAt: now,
      lastLoginAt: now,
    };
    this.users.unshift(user);
    saveDataFile('users.json', this.users);
    return user;
  }

  public static getWebPushSubscriptions(): WebPushSubscriptionRecord[] {
    return this.webPushSubscriptions;
  }

  public static upsertWebPushSubscription(data: Omit<WebPushSubscriptionRecord, 'id' | 'endpoint' | 'createdAt' | 'updatedAt'>): WebPushSubscriptionRecord {
    const endpoint = data.subscription?.endpoint;
    if (!endpoint) {
      throw new Error('Missing push subscription endpoint');
    }

    const now = new Date().toISOString();
    const existingIndex = this.webPushSubscriptions.findIndex((item) => item.endpoint === endpoint);
    if (existingIndex > -1) {
      this.webPushSubscriptions[existingIndex] = {
        ...this.webPushSubscriptions[existingIndex],
        ...data,
        endpoint,
        updatedAt: now,
      };
      saveDataFile('web_push_subscriptions.json', this.webPushSubscriptions);
      return this.webPushSubscriptions[existingIndex];
    }

    const record: WebPushSubscriptionRecord = {
      id: this.webPushSubscriptions.length > 0 ? Math.max(...this.webPushSubscriptions.map((item) => item.id)) + 1 : 1,
      endpoint,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.webPushSubscriptions.unshift(record);
    saveDataFile('web_push_subscriptions.json', this.webPushSubscriptions);
    return record;
  }
}
