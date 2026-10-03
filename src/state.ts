import { atom } from "jotai";
import {
  atomFamily,
  createJSONStorage,
  atomWithRefresh,
  atomWithStorage,
  loadable,
  unwrap,
} from "jotai/utils";
import {
  Cart,
  AffiliatePortalSummary,
  Category,
  Coupon,
  Delivery,
  FrontendNotification,
  Location,
  Order,
  OrderTracking,
  OrderStatus,
  PlatformSettings,
  Product,
  BannerItem,
  ShippingAddress,
  Station,
  UserInfo,
} from "@/types";
import { requestWithFallback, requestWithPost } from "@/utils/request";
import {
  authorize,
  getLocation,
  getPhoneNumber,
  getSetting,
  getUserInfo,
} from "zmp-sdk/apis";
import { calculateDistance } from "./utils/location";
import { formatDistant } from "./utils/format";
import CONFIG from "./config";
import { isZaloMiniAppRuntime } from "./utils/platform";
import { getApiBaseUrl } from "./utils/request";
import { orderAccessHeaders } from "./utils/order-access";

const guestUserInfo: UserInfo = {
  id: "web-customer",
  name: "Khách hàng Website",
  avatar:
    "https://ui-avatars.com/api/?name=Saximi%20shop&background=1570ef&color=fff",
  phone: "",
  email: "",
  address: "",
};

function getAffiliateReferrerFromUrl() {
  if (typeof window === "undefined") return undefined;

  const params = new URLSearchParams(window.location.search);
  return (
    params.get("ref") ||
    params.get("referrerId") ||
    params.get("affiliateId") ||
    undefined
  );
}

const sessionStorageJson = createJSONStorage<string | undefined>(
  () => (typeof window === "undefined" ? undefined : window.sessionStorage)
);

async function loginWithZaloUser(userInfo: UserInfo) {
  if (!userInfo.phone) return userInfo;
  const phoneToken =
    typeof window === "undefined"
      ? ""
      : window.sessionStorage.getItem(CONFIG.STORAGE_KEYS.ZALO_PHONE_TOKEN) || "";

  const response = await fetch(`${getApiBaseUrl()}/auth/zalo-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zaloUserId: userInfo.id,
      name: userInfo.name,
      avatar: userInfo.avatar,
      phone: userInfo.phone,
      phoneToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Zalo login failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    token: string;
    user: UserInfo;
  };
  localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, result.token);
  localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(result.user));
  window.sessionStorage.removeItem(CONFIG.STORAGE_KEYS.ZALO_PHONE_TOKEN);
  return result.user;
}

async function decodeZaloPhoneToken(token: string) {
  if (!token) return "";

  const response = await fetch(`${getApiBaseUrl()}/user/decode-phone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(`Zalo phone decode failed: ${response.status}`);
  }

  const result = (await response.json()) as { phone?: string };
  return String(result.phone || "").replace(/\D/g, "").replace(/^84(?=\d{8,10}$)/, "0");
}

export const userInfoKeyState = atom(0);

export const userInfoState = atom<Promise<UserInfo>>(async (get) => {
  get(userInfoKeyState);

  // Nếu người dùng đã chỉnh sửa thông tin tài khoản trước đó, sử dụng thông tin đã lưu trữ
  const savedUserInfo = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_INFO);
  // Phía tích hợp có thể thay đổi logic này thành fetch từ server
  // const savedUserInfo = await fetchUserInfo({ token: await getAccessToken() });
  if (savedUserInfo) {
    return JSON.parse(savedUserInfo);
  }

  if (!isZaloMiniAppRuntime()) {
    return guestUserInfo;
  }

  try {
    const setting = await getSetting({});
    const authSetting = setting.authSetting || {};
    const isDev = !window.ZJSBridge;
    let grantedUserInfo = Boolean(authSetting["scope.userInfo"]);
    let grantedPhoneNumber = Boolean(authSetting["scope.userPhonenumber"]);

    if (!isDev && (!grantedUserInfo || !grantedPhoneNumber)) {
      try {
        await authorize({
          scopes: ["scope.userInfo", "scope.userPhonenumber"],
        });
        grantedUserInfo = true;
        grantedPhoneNumber = true;
      } catch (error) {
        console.warn("Zalo authorization was skipped or denied", error);
      }
    }

    if (grantedUserInfo || isDev) {
      // Người dùng cho phép truy cập tên và ảnh đại diện
      const { userInfo } = await getUserInfo({});
      const phone =
        grantedPhoneNumber || isDev // Người dùng cho phép truy cập số điện thoại
          ? await get(phoneState)
          : "";
      const zaloUserInfo = {
        id: userInfo.id,
        name: userInfo.name,
        avatar: userInfo.avatar,
        phone,
        email: "",
        address: "",
      };
      return await loginWithZaloUser(zaloUserInfo);
    }
  } catch (error) {
    console.warn(error);
  }

  return {
    ...guestUserInfo,
    id: "zalo-guest",
    name: "Khách hàng Zalo",
  };
});

export const loadableUserInfoState = loadable(userInfoState);

export const browserLocationState = atomWithStorage<Location | undefined>(
  CONFIG.STORAGE_KEYS.BROWSER_LOCATION,
  undefined
);

export const appNotificationsState = atomWithStorage<FrontendNotification[]>(
  CONFIG.STORAGE_KEYS.APP_NOTIFICATIONS,
  []
);

export const unreadNotificationsCountState = atom((get) =>
  get(appNotificationsState).filter((notification) => !notification.read).length
);

export const phoneState = atom(async () => {
  let phone = "";
  if (!isZaloMiniAppRuntime()) return phone;

  try {
    const { token } = await getPhoneNumber({});
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(CONFIG.STORAGE_KEYS.ZALO_PHONE_TOKEN, token);
    }
    phone = await decodeZaloPhoneToken(token);
  } catch (error) {
    console.warn(error);
  }
  return phone;
});

export const bannersState = atom(() =>
  requestWithFallback<Array<string | BannerItem>>("/banners", [])
);

export const tabsState = atom(["Tất cả", "Nam", "Nữ", "Trẻ em"]);

export const selectedTabIndexState = atom(0);

export const categoriesState = atom(() =>
  requestWithFallback<Category[]>("/categories", [])
);

export const categoriesStateUpwrapped = unwrap(
  categoriesState,
  (prev) => prev ?? []
);

export const productsState = atom(async (get) => {
  const categories = await get(categoriesState);
  const products = await requestWithFallback<
    (Product & { categoryId: number })[]
  >("/products?view=compact", []);
  return products.map((product) => ({
    ...product,
    category: categories.find(
      (category) => category.id === product.categoryId
    )!,
  }));
});

export const flashSaleProductsState = atom((get) => get(productsState));

export const recommendedProductsState = atom((get) => get(productsState));

export const productState = atomFamily((id: number) =>
  atom(async (get) => {
    const categories = await get(categoriesState);
    const compactProducts = await get(productsState);
    const compactProduct = compactProducts.find((product) => product.id === id);
    const product = await requestWithFallback<Product & { categoryId: number }>(
      `/products/${id}`,
      compactProduct as Product & { categoryId: number }
    );
    return {
      ...product,
      category:
        categories.find((category) => category.id === product.categoryId) ||
        compactProduct?.category,
    };
  })
);

export const cartState = atomWithStorage<Cart>(
  CONFIG.STORAGE_KEYS.CART,
  []
);

export const selectedCartItemIdsState = atom<number[]>([]);

export const selectedCouponState = atomWithStorage<Coupon | undefined>(
  "selectedCoupon",
  undefined
);

export const cartNoteState = atomWithStorage("cartNote", "");

export const cartTotalState = atom((get) => {
  const items = get(cartState);
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const selectedCoupon = get(selectedCouponState);
  const canApplyCoupon =
    selectedCoupon?.isActive && subtotal >= selectedCoupon.minOrderAmount;
  const discountAmount = canApplyCoupon
    ? Math.round((subtotal * selectedCoupon.discountPercent) / 100)
    : 0;
  return {
    totalItems: items.length,
    subtotal,
    discountAmount,
    totalAmount: Math.max(0, subtotal - discountAmount),
    selectedCoupon,
    isCouponApplied: Boolean(canApplyCoupon),
  };
});

export const shippingFeeEstimateState = atom(async (get) => {
  const { totalAmount } = get(cartTotalState);
  const deliveryMode = get(deliveryModeState);
  const shippingAddress = get(shippingAddressState);
  const selectedStation = await get(selectedStationState);
  try {
    return await requestWithPost<
      {
        subtotal: number;
        delivery: {
          type: "shipping" | "pickup";
          address?: string;
          province?: string;
          ward?: string;
          stationId?: number;
        };
      },
      { fee: number; label: string }
    >("/shipping/estimate", {
      subtotal: totalAmount,
      delivery:
        deliveryMode === "pickup"
          ? {
              type: "pickup",
              stationId: selectedStation?.id,
              address: selectedStation?.address,
            }
          : {
              type: "shipping",
              address: shippingAddress?.address,
              province: shippingAddress?.province,
              ward: shippingAddress?.ward,
            },
    });
  } catch (error) {
    console.warn("Cannot estimate shipping fee", error);
    return { fee: 0, label: "Phí vận chuyển" };
  }
});

export const couponsState = atom(() =>
  requestWithFallback<Coupon[]>("/coupons", [])
);

export const affiliatePortalState = atom(() =>
  requestWithFallback<AffiliatePortalSummary | undefined>(
    "/affiliate/portal",
    undefined
  )
);

export const platformSettingsState = atom(() =>
  requestWithFallback<PlatformSettings | undefined>("/settings", undefined)
);

export const affiliateReferrerIdState = atomWithStorage<string | undefined>(
  CONFIG.STORAGE_KEYS.AFFILIATE_REFERRER,
  getAffiliateReferrerFromUrl(),
  sessionStorageJson
);

export const keywordState = atom("");

export const searchResultState = atom(async (get) => {
  const keyword = get(keywordState);
  const products = await get(productsState);
  return products.filter((product) =>
    product.name.toLowerCase().includes(keyword.toLowerCase())
  );
});

export const productsByCategoryState = atomFamily((id: String) =>
  atom(async (get) => {
    const products = await get(productsState);
    return products.filter((product) => String(product.categoryId) === id);
  })
);

export const stationsState = atom(async (get) => {
  const affiliateReferrerId = get(affiliateReferrerIdState);
  const browserLocation = get(browserLocationState);
  let location: Location | undefined;

  if (isZaloMiniAppRuntime()) {
    try {
      await getLocation({});
    } catch (error) {
      console.warn(error);
    }
  } else {
    location = browserLocation;
  }

  const stationPath = affiliateReferrerId
    ? `/stations?referrerId=${encodeURIComponent(affiliateReferrerId)}`
    : "/stations";
  const stations = await requestWithFallback<Station[]>(stationPath, []);
  const stationsWithDistance = stations.map((station) => ({
    ...station,
    distance: location
      ? formatDistant(
          calculateDistance(
            location.lat,
            location.lng,
            station.location.lat,
            station.location.lng
          )
        )
      : undefined,
  }));

  return stationsWithDistance;
});

export const selectedStationIndexState = atom(0);

export const selectedStationState = atom(async (get) => {
  const index = get(selectedStationIndexState);
  const stations = await get(stationsState);
  return stations[index] || stations[0];
});

export const shippingAddressState = atomWithStorage<
  ShippingAddress | undefined
>(CONFIG.STORAGE_KEYS.SHIPPING_ADDRESS, undefined);

export const ordersState = atomFamily((status: OrderStatus) =>
  atomWithRefresh(async (get) => {
    const userInfo = await get(userInfoState);
    const phone = userInfo?.phone?.trim();
    if (!phone) return [];

    try {
      const params = new URLSearchParams({ status });
      const response = await fetch(`${getApiBaseUrl()}/orders?${params.toString()}`, {
        headers: orderAccessHeaders(),
      });
      if (!response.ok) return [];
      return (await response.json()) as Order[];
    } catch {
      return [];
    }
  })
);

export const orderState = atomFamily((id: number) =>
  atom(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/orders/${id}`, {
        headers: orderAccessHeaders(id),
      });
      if (!response.ok) return undefined;
      return (await response.json()) as Order;
    } catch {
      return undefined;
    }
  })
);

export const orderTrackingState = atomFamily((id: number) =>
  atom(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/orders/${id}/tracking`, {
        headers: orderAccessHeaders(id),
      });
      if (!response.ok) return undefined;
      return (await response.json()) as OrderTracking;
    } catch {
      return undefined;
    }
  })
);

export const deliveryModeState = atomWithStorage<Delivery["type"]>(
  CONFIG.STORAGE_KEYS.DELIVERY,
  "shipping"
);
