import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { MutableRefObject, useLayoutEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { UIMatch, useMatches, useNavigate } from "react-router-dom";
import {
  appNotificationsState,
  cartState,
  cartTotalState,
  cartNoteState,
  deliveryModeState,
  affiliateReferrerIdState,
  ordersState,
  selectedCouponState,
  selectedStationState,
  shippingAddressState,
  userInfoKeyState,
  userInfoState,
} from "@/state";
import { FrontendNotification, Product } from "@/types";
import { getConfig } from "@/utils/template";
import { getApiBaseUrl } from "@/utils/request";
import { authorize, createOrder, openChat } from "zmp-sdk/apis";
import { useAtomCallback } from "jotai/utils";
import { isZaloMiniAppRuntime } from "@/utils/platform";

type NotifyInput = Omit<FrontendNotification, "id" | "createdAt" | "read"> & {
  id?: string;
  createdAt?: string;
};

const MAX_STORED_NOTIFICATIONS = 40;

export function useFrontendNotification() {
  const setNotifications = useSetAtom(appNotificationsState);

  return (
    input: NotifyInput,
    options: { toast?: boolean; browser?: boolean } = { toast: true }
  ) => {
    const notification: FrontendNotification = {
      ...input,
      id: input.id || `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: input.createdAt || new Date().toISOString(),
      read: false,
    };

    setNotifications((items) => [notification, ...items].slice(0, MAX_STORED_NOTIFICATIONS));

    if (options.toast !== false) {
      const toastMessage = `${notification.title}: ${notification.message}`;
      if (notification.kind === "error") {
        toast.error(toastMessage);
      } else if (notification.kind === "success") {
        toast.success(toastMessage);
      } else {
        toast(toastMessage);
      }
    }

    if (
      options.browser &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(notification.title, {
        body: notification.message,
      });
    }

    return notification;
  };
}

export function useRealHeight(
  element: MutableRefObject<HTMLDivElement | null>,
  defaultValue?: number
) {
  const [height, setHeight] = useState(defaultValue ?? 0);
  useLayoutEffect(() => {
    if (element.current && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        const [{ contentRect }] = entries;
        setHeight(contentRect.height);
      });
      ro.observe(element.current);
      return () => ro.disconnect();
    }
    return () => {};
  }, [element.current]);

  if (typeof ResizeObserver === "undefined") {
    return -1;
  }
  return height;
}

export function useRequestInformation() {
  const getStoredUserInfo = useAtomCallback(async (get) => {
    const userInfo = await get(userInfoState);
    return userInfo;
  });
  const setInfoKey = useSetAtom(userInfoKeyState);
  const refreshPermissions = () => setInfoKey((key) => key + 1);

  return async () => {
    const userInfo = await getStoredUserInfo();
    if (!userInfo) {
      if (!isZaloMiniAppRuntime()) {
        refreshPermissions();
        return await getStoredUserInfo();
      }

      await authorize({
        scopes: ["scope.userInfo", "scope.userPhonenumber"],
      }).then(refreshPermissions);
      return await getStoredUserInfo();
    }
    return userInfo;
  };
}

export function useAddToCart(product: Product) {
  const [cart, setCart] = useAtom(cartState);
  const notify = useFrontendNotification();

  const currentCartItem = useMemo(
    () => cart.find((item) => item.product.id === product.id),
    [cart, product.id]
  );

  const addToCart = (
    quantity: number | ((oldQuantity: number) => number),
    options?: { toast: boolean }
  ) => {
    setCart((cart) => {
      const itemIndex = cart.findIndex((item) => item.product.id === product.id);
      const itemInCart = itemIndex > -1 ? cart[itemIndex] : undefined;
      const newQuantity =
        typeof quantity === "function"
          ? quantity(itemInCart?.quantity ?? 0)
          : quantity;
      if (newQuantity <= 0) {
        if (itemIndex > -1) {
          cart.splice(itemIndex, 1);
        }
      } else {
        if (itemInCart) {
          itemInCart.quantity = newQuantity;
        } else {
          cart.push({
            product,
            quantity: newQuantity,
          });
        }
      }
      return [...cart];
    });
    if (options?.toast) {
      notify({
        title: "Giỏ hàng",
        message: `Đã thêm ${product.name}`,
        kind: "success",
        topic: "cart",
        actionPath: "/cart",
      });
    }
  };

  return { addToCart, cartQuantity: currentCartItem?.quantity ?? 0 };
}

export function useCustomerSupport() {
  return () => {
    if (!isZaloMiniAppRuntime()) {
      window.open("tel:0908889999", "_self");
      return;
    }

    openChat({
      type: "oa",
      id: getConfig((config) => config.template.oaIDtoOpenChat),
    });
  };
}

export function useToBeImplemented() {
  const notify = useFrontendNotification();
  return () =>
    notify({
      title: "Tính năng đang phát triển",
      message: "Chức năng này đang chờ tích hợp thêm.",
      kind: "info",
      topic: "system",
    });
}

export function useCheckout() {
  const { isCouponApplied, selectedCoupon: appliedCoupon, totalAmount } =
    useAtomValue(cartTotalState);
  const [cart, setCart] = useAtom(cartState);
  const requestInfo = useRequestInformation();
  const notify = useFrontendNotification();
  const navigate = useNavigate();
  const refreshNewOrders = useSetAtom(ordersState("pending"));
  const setCartNote = useSetAtom(cartNoteState);
  const setSelectedCoupon = useSetAtom(selectedCouponState);
  const getCheckoutSnapshot = useAtomCallback(async (get) => {
    const deliveryMode = get(deliveryModeState);
    const shippingAddress = get(shippingAddressState);
    const selectedStation = await get(selectedStationState);
    const affiliateReferrerId = get(affiliateReferrerIdState);
    const note = get(cartNoteState);
    return {
      deliveryMode,
      shippingAddress,
      selectedStation,
      affiliateReferrerId,
      note,
    };
  });

  return async (paymentMethod: "ZALOPAY" | "VIETQR" | "COD" = "COD") => {
    try {
      // Lấy thông tin người dùng (Zalo auth)
      const userInfo = await requestInfo();
      const {
        deliveryMode,
        shippingAddress,
        selectedStation,
        affiliateReferrerId,
        note,
      } = await getCheckoutSnapshot();

      if (!userInfo?.phone && !isZaloMiniAppRuntime()) {
        notify({
          title: "Cần đăng nhập",
          message: "Vui lòng đăng nhập bằng số điện thoại trước khi đặt hàng.",
          kind: "warning",
          topic: "account",
          actionPath: "/login",
        });
        navigate("/login", { viewTransition: true });
        return;
      }

      if (!cart.length) {
        notify({
          title: "Giỏ hàng trống",
          message: "Vui lòng chọn sản phẩm trước khi đặt hàng.",
          kind: "warning",
          topic: "cart",
          actionPath: "/",
        });
        navigate("/", { viewTransition: true });
        return;
      }

      if (deliveryMode === "shipping") {
        const missingShippingAddress =
          !shippingAddress?.address ||
          !shippingAddress?.name ||
          !/^0\d{9}$/.test((shippingAddress?.phone || "").replace(/\D/g, ""));

        if (missingShippingAddress) {
          notify({
            title: "Thiếu địa chỉ nhận hàng",
            message: "Vui lòng nhập đủ tên, số điện thoại và địa chỉ giao hàng.",
            kind: "warning",
            topic: "delivery",
            actionPath: "/shipping-address",
          });
          navigate("/shipping-address", { viewTransition: true });
          return;
        }
      }

      if (deliveryMode === "pickup" && !selectedStation) {
        notify({
          title: "Chưa chọn điểm nhận",
          message: "Vui lòng chọn điểm tự đến lấy trước khi đặt hàng.",
          kind: "warning",
          topic: "delivery",
          actionPath: "/stations",
        });
        navigate("/stations", { viewTransition: true });
        return;
      }

      const fallbackCustomer = {
        name: userInfo?.name || "Khách hàng Zalo",
        phone: userInfo?.phone || "0912345678",
        address: userInfo?.address || "Địa chỉ giao hàng",
      };
      const delivery =
        deliveryMode === "pickup"
          ? {
              type: "pickup",
              name: selectedStation?.name || fallbackCustomer.name,
              phone: selectedStation?.phone || fallbackCustomer.phone,
              address: selectedStation?.address || fallbackCustomer.address,
              stationId: selectedStation?.id,
            }
          : {
              type: "shipping",
              name: shippingAddress?.name || fallbackCustomer.name,
              phone: shippingAddress?.phone || fallbackCustomer.phone,
              address: shippingAddress?.address || fallbackCustomer.address,
              location: shippingAddress?.location,
              locationSource: shippingAddress?.locationSource,
            };

      // Gọi API backend để tạo đơn hàng
      const response = await fetch(`${getApiBaseUrl()}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            originalPrice: item.product.originalPrice,
            image: item.product.image,
            categoryId: item.product.category?.id,
            quantity: item.quantity,
          })),
          delivery,
          total: totalAmount,
          note,
          couponCode: isCouponApplied ? appliedCoupon?.code : undefined,
          paymentMethod,
          referrerId: affiliateReferrerId ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const order = await response.json();
      setCart([]);
      setCartNote("");
      setSelectedCoupon(undefined);
      refreshNewOrders();
      notify(
        {
          title: "Đã tạo đơn hàng",
          message: `Đơn #${order.id} đã được ghi nhận. Vui lòng hoàn tất thanh toán.`,
          kind: "success",
          topic: "order",
          actionPath: `/payment/${order.id}/${paymentMethod.toLowerCase()}`,
        },
        { browser: true }
      );

      // Route đến trang thanh toán tương ứng
      navigate(`/payment/${order.id}/${paymentMethod.toLowerCase()}`, {
        viewTransition: true,
      });
    } catch (error) {
      console.warn("Checkout error:", error);
      if (!isZaloMiniAppRuntime()) {
        notify({
          title: "Chưa tạo được đơn",
          message: "Chưa kết nối được backend để tạo đơn hàng website.",
          kind: "error",
          topic: "order",
        });
        return;
      }

      // Fallback: nếu backend không chạy, vẫn dùng ZMP createOrder
      try {
        await createOrder({
          amount: totalAmount,
          desc: "Thanh toán đơn hàng Saximi shop",
          item: cart.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        });
        setCart([]);
        refreshNewOrders();
        navigate("/orders", { viewTransition: true });
        notify(
          {
            title: "Thanh toán thành công",
            message: "Cảm ơn bạn đã mua hàng tại Saximi shop.",
            kind: "success",
            topic: "payment",
            actionPath: "/orders",
          },
          { browser: true }
        );
      } catch (fallbackError) {
        console.warn(fallbackError);
        notify({
          title: "Thanh toán thất bại",
          message: "Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.",
          kind: "error",
          topic: "payment",
        });
      }
    }
  };
}

export function useRouteHandle() {
  const matches = useMatches() as UIMatch<
    undefined,
    | {
        title?: string | Function;
        logo?: boolean;
        search?: boolean;
        noFooter?: boolean;
        noBack?: boolean;
        noFloatingCart?: boolean;
        scrollRestoration?: number;
      }
    | undefined
  >[];
  const lastMatch = matches[matches.length - 1];

  return [lastMatch.handle, lastMatch, matches] as const;
}
