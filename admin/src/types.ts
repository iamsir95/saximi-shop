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

export interface Location {
  lat: number;
  lng: number;
}

export interface BannerItem {
  id: number;
  imageUrl: string;
  title?: string;
  linkUrl?: string;
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

export interface AffiliateHierarchyNode {
  president: AffiliateProfile;
  branches: AffiliateProfile[];
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
    location?: Location;
    locationSource?: 'CURRENT_LOCATION' | 'MAP_PICKER';
    stationId?: number;
  };
  total: number;
  referrerId?: string;
  couponCode?: string;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email?: string;
  address?: string;
  addresses?: CustomerAddress[];
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
  location?: Location;
  locationSource?: 'CURRENT_LOCATION' | 'MAP_PICKER';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OtpOutboxItem {
  id: string;
  phone: string;
  message: string;
  zaloOaUrl: string;
  status: 'pending' | 'sent' | 'expired';
  createdAt: string;
  expiresAt: string;
  sentAt?: string;
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
  sepayWebhookHasApiKey?: boolean;
  sepayWebhookUrl?: string;
  sepayWebhookConfigured?: boolean;
  commissionSettlementMode: 'ORDER_DISCOUNT' | 'MANUAL_PAYOUT';
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: string;
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

export interface Stats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  shippingOrders: number;
  completedOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalUsers: number;
  totalAffiliates?: number;
  totalConsignmentDebt?: number;
  lowStockCount?: number;
}
