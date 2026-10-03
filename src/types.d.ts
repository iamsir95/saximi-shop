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
  hasPin?: boolean;
}

export interface AuthSession {
  id: string;
  role: "CUSTOMER" | "SUPER_ADMIN";
  subjectId: string;
  username?: string;
  phone?: string;
  deviceName: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastActiveAt: string;
  revokedAt?: string;
  isCurrent?: boolean;
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

export type DynamicFormFieldType = "text" | "phone" | "email" | "textarea" | "select" | "checkbox";
export type DynamicFormPlacement =
  | "home"
  | "product-detail"
  | "cart"
  | "member"
  | "profile"
  | "affiliate"
  | "shipping-address"
  | "news";

export interface DynamicFormField {
  id: string;
  label: string;
  type: DynamicFormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  sortOrder: number;
}

export interface DynamicForm {
  id: number;
  title: string;
  description?: string;
  submitLabel: string;
  successMessage?: string;
  placements: DynamicFormPlacement[];
  fields: DynamicFormField[];
  isActive: boolean;
  sortOrder: number;
}

export interface PlatformSettings {
  shopName: string;
  logoUrl?: string;
  faviconUrl?: string;
  brandColor: string;
  hotline: string;
  supportEmail: string;
  businessAddress: string;
  publicSiteUrl: string;
  zaloOaUrl: string;
  shippingFee?: ShippingFeeSettings;
  commissionSettings?: CommissionSettings;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export type CommissionSettlementMode = "ORDER_DISCOUNT" | "MANUAL_PAYOUT";

export interface CommissionTierSetting {
  tierLevel: 1 | 2 | 3;
  levelName: string;
  commissionLabel: string;
  rate: number;
  description: string;
  isActive: boolean;
}

export interface CommissionSettings {
  settlementMode: CommissionSettlementMode;
  pointValue: number;
  applyToSelfPurchase: boolean;
  applyToReferralOrders: boolean;
  allowPersonalOverride: boolean;
  tiers: CommissionTierSetting[];
  updatedAt: string;
}

export interface ShippingAreaRule {
  id: string;
  label: string;
  province?: string;
  wardKeyword?: string;
  fee: number;
  isActive: boolean;
}

export interface ShippingStationRule {
  id: string;
  stationId: number;
  fee: number;
  isActive: boolean;
}

export interface ShippingFeeSettings {
  mode: "FIXED" | "AREA" | "STATION";
  fixedFee: number;
  freeShippingMinOrder: number;
  areaRules: ShippingAreaRule[];
  stationRules: ShippingStationRule[];
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

export interface ProductGiftProgram {
  id: string;
  title: string;
  badgeLabel?: string;
  description?: string;
  giftProductId: number;
  minQuantity: number;
  giftQuantity: number;
  isActive: boolean;
  autoAddToCart?: boolean;
  showOnProductPage?: boolean;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  originalPrice?: number;
  stockQuantity?: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
  isActive: boolean;
}

export interface ProductPromotionLabel {
  id: string;
  name: string;
  color: string;
}

export interface BannerItem {
  id: number;
  imageUrl: string;
  title?: string;
  linkUrl?: string;
  isActive: boolean;
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
  promotionLabels?: ProductPromotionLabel[];
  giftPrograms?: ProductGiftProgram[];
  variants?: ProductVariant[];
  enableVariants?: boolean;
  selectedVariantId?: string;
  selectedVariantName?: string;
  attributes?: ProductAttribute[];
  seo?: ProductSeoContent;
  sizes?: Size[];
  colors?: Color[];
  stockQuantity?: number;
  minStockLevel?: number;
  soldQuantity?: number;
  isFlashSale?: boolean;
  isRecommended?: boolean;
}

export interface Category {
  id: number;
  name: string;
  image: string;
  showOnHome?: boolean;
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
  isGift?: boolean;
  giftProgramId?: string;
  giftForProductId?: number;
  giftProgramTitle?: string;
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
  branchName?: string;
  branchPhone?: string;
  assignedAffiliateIds?: string[];
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
  commissionSettings?: CommissionSettings;
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
  subtotal?: number;
  couponDiscountAmount?: number;
  shippingFee?: number;
  shippingFeeLabel?: string;
  total: number;
  note: string;
  accessToken?: string;
}
