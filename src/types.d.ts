export type PaymentMethod = "ZALOPAY" | "VIETQR" | "COD";

export interface OrderPaymentDetails {
  orderId: number;
  amount: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  vietQrUrl: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  transferContent: string;
  provider?: string;
  sepayWebhookUrl?: string;
  sepayWebhookConfigured?: boolean;
  zaloPayToken: string;
}

export interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  address: string;
  streetAddress?: string;
  ward?: string;
  province?: string;
}

export type FrontendNotificationKind = "success" | "info" | "warning" | "error";
export type FrontendNotificationTopic =
  | "account"
  | "cart"
  | "commission"
  | "delivery"
  | "order"
  | "payment"
  | "system";

export interface FrontendNotification {
  id: string;
  title: string;
  message: string;
  kind: FrontendNotificationKind;
  topic: FrontendNotificationTopic;
  createdAt: string;
  read?: boolean;
  actionPath?: string;
}

export interface PlatformSettings {
  shopName: string;
  logoUrl?: string;
  brandColor: string;
  hotline: string;
  supportEmail: string;
  businessAddress: string;
  publicSiteUrl: string;
  zaloOaUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export type ProductImageKind = "MAIN" | "DETAIL" | "COLLECTION";

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
  categoryId?: number;
  category: Category;
  detail?: string;
  promoDescription?: string;
  attributes?: ProductAttribute[];
  seo?: ProductSeoContent;
  sizes?: Size[];
  colors?: Color[];
  stockQuantity?: number;
  minStockLevel?: number;
}

export interface Category {
  id: number;
  name: string;
  image: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Cart = CartItem[];

export interface Location {
  lat: number;
  lng: number;
}

export interface ShippingAddress {
  id?: string;
  alias: string;
  address: string;
  streetAddress?: string;
  ward?: string;
  province?: string;
  location?: Location;
  locationSource?: "CURRENT_LOCATION" | "MAP_PICKER";
  name: string;
  phone: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Station {
  id: number;
  name: string;
  image: string;
  address: string;
  location: Location;
  sourceType?: "STORE" | "PRESIDENT" | "BRANCH_LEADER";
  affiliateId?: string;
  phone?: string;
  levelName?: string;
  presidentId?: string;
}

export type Delivery =
  | ({
      type: "shipping";
    } & ShippingAddress)
  | {
      type: "pickup";
      stationId: number;
      name?: string;
      phone?: string;
      address?: string;
    };

export type OrderStatus = "pending" | "shipping" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "success" | "failed";
export type DeliveryStatus =
  | "assigned"
  | "picking"
  | "delivering"
  | "delivered"
  | "failed";

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

export interface DeliveryTrackingEvent {
  key: string;
  label: string;
  description: string;
  status: "done" | "current" | "pending" | "failed";
  time?: string;
}

export interface OrderTracking {
  order: Order;
  delivery?: InHouseDelivery;
  distribution: {
    president?: {
      userId: string;
      name: string;
      phone: string;
      role: "PRESIDENT";
      levelName?: string;
    };
    branchLeader?: {
      userId: string;
      name: string;
      phone: string;
      role: "BRANCH_LEADER";
      levelName?: string;
    };
    mode: "DIRECT" | "AFFILIATE_CHAIN";
    message: string;
  };
  payment: {
    status: PaymentStatus;
    method?: PaymentMethod;
    autoCheckEnabled: boolean;
    lastCheckedAt: string;
    message: string;
  };
  timeline: DeliveryTrackingEvent[];
}

export type UserRole = "CUSTOMER" | "BRANCH_LEADER" | "PRESIDENT";

export interface AffiliateProfile {
  userId: string;
  name: string;
  phone: string;
  address?: string;
  avatar: string;
  role: UserRole;
  location?: Location;
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

export interface CommissionRecord {
  id: number;
  orderId: number;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryRole: UserRole;
  amount: number;
  type:
    | "DIRECT_BRANCH_LEADER"
    | "OVERRIDING_PRESIDENT"
    | "TIER_DIRECT"
    | "TIER_ONE_GLOBAL";
  commissionName?: string;
  commissionRate?: number;
  hierarchyPath?: string;
  status: "pending" | "available" | "withdrawn";
  createdAt: string;
}

export interface FinancialSettlement {
  id: number;
  presidentId: string;
  presidentName: string;
  settlementAmount: number;
  paymentMethod: "TRANSFER" | "CASH";
  referenceCode: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
}

export interface AffiliatePortalSummary {
  affiliates: AffiliateProfile[];
  consignments: ConsignmentStock[];
  settlements: FinancialSettlement[];
  commissions: CommissionRecord[];
  branchesByPresident: Record<string, AffiliateProfile[]>;
  hierarchy: AffiliateHierarchyNode[];
}

export interface AffiliateRegistrationResponse {
  profile: AffiliateProfile;
  message: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentPaidAt?: string;
  paymentCheckedAt?: string;
  commissionSettlementMode?: "ORDER_DISCOUNT" | "MANUAL_PAYOUT";
  commissionDiscountAmount?: number;
  commissionDiscountBeneficiaryId?: string;
  createdAt: string;
  receivedAt?: string;
  items: CartItem[];
  delivery: Delivery;
  total: number;
  note: string;
}
