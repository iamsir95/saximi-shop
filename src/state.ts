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
  Product,
  ShippingAddress,
  Station,
  UserInfo,
} from "@/types";
import { requestWithFallback } from "@/utils/request";
import {
  authorize,
  getLocation,
  getPhoneNumber,
  getSetting,
  getUserInfo,
} from "zmp-sdk/apis";
import toast from "react-hot-toast";
import { calculateDistance } from "./utils/location";
import { formatDistant } from "./utils/format";
import CONFIG from "./config";
import { isZaloMiniAppRuntime } from "./utils/platform";
import { getApiBaseUrl } from "./utils/request";

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
  return result.user;
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
    return {
      id: "web-customer",
      name: "Khách hàng Website",
      avatar:
        "https://ui-avatars.com/api/?name=Saximi%20shop&background=1570ef&color=fff",
      phone: "",
      email: "",
      address: "",
    };
  }

  try {
    const {
      authSetting: {
        "scope.userInfo": initialGrantedUserInfo,
        "scope.userPhonenumber": initialGrantedPhoneNumber,
      },
    } = await getSetting({});
    const isDev = !window.ZJSBridge;
    let grantedUserInfo = initialGrantedUserInfo;
    let grantedPhoneNumber = initialGrantedPhoneNumber;

    if (!isDev && (!grantedUserInfo || !grantedPhoneNumber)) {
      await authorize({
        scopes: ["scope.userInfo", "scope.userPhonenumber"],
      });
      grantedUserInfo = true;
      grantedPhoneNumber = true;
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
    // Phía tích hợp làm theo hướng dẫn tại https://mini.zalo.me/documents/api/getPhoneNumber/ để chuyển đổi token thành số điện thoại người dùng ở server.
    // phone = await decodeToken(token);

    // Các bước bên dưới để demo chức năng, phía tích hợp có thể bỏ đi sau.
    toast(
      "Đã lấy được token chứa số điện thoại người dùng. Phía tích hợp cần decode token này ở server. Giả lập số điện thoại 0912345678...",
      {
        icon: "ℹ",
        duration: 10000,
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    phone = "0912345678";
    // End demo
  } catch (error) {
    console.warn(error);
  }
  return phone;
});

export const bannersState = atom(() =>
  requestWithFallback<string[]>("/banners", [])
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
  >("/products", []);
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
    const products = await get(productsState);
    return products.find((product) => product.id === id);
  })
);

export const cartState = atom<Cart>([]);

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

export const couponsState = atom(() =>
  requestWithFallback<Coupon[]>("/coupons", [])
);

export const affiliatePortalState = atom(() =>
  requestWithFallback<AffiliatePortalSummary | undefined>(
    "/affiliate/portal",
    undefined
  )
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return products.filter((product) =>
    product.name.toLowerCase().includes(keyword.toLowerCase())
  );
});

export const productsByCategoryState = atomFamily((id: String) =>
  atom(async (get) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
      const { token } = await getLocation({});
      // Phía tích hợp làm theo hướng dẫn tại https://mini.zalo.me/documents/api/getLocation/ để chuyển đổi token thành thông tin vị trí người dùng ở server.
      // location = await decodeToken(token);

      // Các bước bên dưới để demo chức năng, phía tích hợp có thể bỏ đi sau.
      toast(
        "Đã lấy được token chứa thông tin vị trí người dùng. Phía tích hợp cần decode token này ở server. Giả lập vị trí tại VNG Campus...",
        {
          icon: "ℹ",
          duration: 10000,
        }
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      location = {
        lat: 10.773756,
        lng: 106.689247,
      };
      // End demo
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

    const params = new URLSearchParams({ status, phone });
    return requestWithFallback<Order[]>(`/orders?${params.toString()}`, []);
  })
);

export const orderState = atomFamily((id: number) =>
  atom(() => requestWithFallback<Order | undefined>(`/orders/${id}`, undefined))
);

export const orderTrackingState = atomFamily((id: number) =>
  atom(() =>
    requestWithFallback<OrderTracking | undefined>(
      `/orders/${id}/tracking`,
      undefined
    )
  )
);

export const deliveryModeState = atomWithStorage<Delivery["type"]>(
  CONFIG.STORAGE_KEYS.DELIVERY,
  "shipping"
);
