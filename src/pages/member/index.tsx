import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import {
  affiliatePortalState,
  affiliateReferrerIdState,
  loadableUserInfoState,
  userInfoKeyState,
} from "@/state";
import { Order } from "@/types";
import { formatPrice } from "@/utils/format";
import { getApiBaseUrl, requestWithFallback } from "@/utils/request";
import {
  findAffiliateByReferrer,
  findAffiliateForUser,
  getAffiliateRoleLabel,
} from "@/utils/affiliate";
import { useAtomValue, useSetAtom } from "jotai";
import { loadable } from "jotai/utils";
import { useNavigate } from "react-router-dom";
import CommerceIcon, { CommerceIconName } from "@/components/commerce-icon";
import PersonalMarketingLink from "@/components/personal-marketing-link";
import { orderAccessHeaders } from "@/utils/order-access";
import Points from "@/pages/profile/points";
import FollowOA from "@/pages/profile/follow-oa";
import WebCapabilitiesCard from "@/pages/profile/web-capabilities";
import CONFIG from "@/config";
import { useFrontendNotification } from "@/hooks";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const STATUS_TAG_CLASS: Record<Order["status"], string> = {
  pending: "commerce-tag commerce-tag--warning",
  shipping: "commerce-tag commerce-tag--info",
  completed: "commerce-tag commerce-tag--success",
  cancelled: "commerce-tag commerce-tag--muted",
};

function getDeliveryPhone(order: Order) {
  return "phone" in order.delivery ? order.delivery.phone : "";
}

function getDeliveryAddress(order: Order) {
  return "address" in order.delivery ? order.delivery.address : "";
}

function normalizePhone(value?: string) {
  return String(value || "")
    .replace(/\D/g, "")
    .replace(/^84(?=\d{8,10}$)/, "0");
}

export default function MemberPage() {
  const navigate = useNavigate();
  const refreshUserInfo = useSetAtom(userInfoKeyState);
  const notify = useFrontendNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const userInfo = useAtomValue(loadableUserInfoState);
  const referrerId = useAtomValue(affiliateReferrerIdState);
  const portalLoadable = useAtomValue(
    useMemo(() => loadable(affiliatePortalState), [])
  );

  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const affiliates =
    portalLoadable.state === "hasData" ? portalLoadable.data?.affiliates || [] : [];
  const currentAffiliate = findAffiliateForUser(affiliates, currentUser);
  const referrerAffiliate = findAffiliateByReferrer(affiliates, referrerId);
  const isLoggedIn = Boolean(currentUser?.phone);

  useEffect(() => {
    let mounted = true;
    setLoadingOrders(true);
    const phone = currentUser?.phone?.trim();
    if (!phone) {
      setOrders([]);
      setLoadingOrders(false);
      return () => {
        mounted = false;
      };
    }

    fetch(`${getApiBaseUrl()}/orders`, {
      headers: orderAccessHeaders(),
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!mounted) return;
        setOrders(data);
      })
      .finally(() => {
        if (mounted) setLoadingOrders(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser?.phone]);

  const memberOrders = useMemo(() => {
    if (!currentUser?.phone) return [];
    const currentPhone = normalizePhone(currentUser.phone);
    return orders
      .filter((order) => normalizePhone(getDeliveryPhone(order)) === currentPhone)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [currentUser?.phone, orders]);

  const totalSpent = memberOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const activeOrders = memberOrders.filter((order) =>
    ["pending", "shipping"].includes(order.status)
  ).length;
  const completedOrders = memberOrders.filter(
    (order) => order.status === "completed"
  ).length;
  const memberCode = currentUser?.phone
    ? `HV-${currentUser.phone.slice(-4)}`
    : "HV-WEB";

  const agentBenefits: { icon: CommerceIconName; text: string }[] = [
    {
      icon: "link",
      text: "Có link/QR giới thiệu riêng để chia sẻ cho khách mua hàng.",
    },
    {
      icon: "check",
      text: "Tự động ghi nhận đơn phát sinh từ link của bạn.",
    },
    {
      icon: "percent",
      text: "Điểm = doanh số x phần trăm hoa hồng; 1.000 VND hoa hồng = 1 điểm.",
    },
    {
      icon: "id-card",
      text: "Sau khi đăng ký, dashboard hội viên/đại lý sẽ mở đầy đủ.",
    },
  ];

  const accountName = currentUser?.name || (isLoggedIn ? "Khách hàng Saximi" : "Đăng nhập tài khoản");
  const accountAvatar =
    currentUser?.avatar || "https://zalo-miniapp.github.io/zaui-market/dummy/avatar.png";
  const accountRole = currentAffiliate
    ? getAffiliateRoleLabel(currentAffiliate)
    : isLoggedIn
      ? "Khách mua hàng"
      : "Chưa đăng nhập";
  const accountSubtitle = isLoggedIn
    ? currentUser?.phone || "Đã xác thực tài khoản"
    : "Đăng nhập bằng số điện thoại để theo dõi đơn hàng";
  const orderShortcuts: Array<{
    label: string;
    icon: CommerceIconName;
    value: number;
    path: string;
  }> = [
    {
      label: "Chờ xử lý",
      icon: "ticket",
      value: memberOrders.filter((order) => order.status === "pending").length,
      path: "/orders/pending",
    },
    {
      label: "Đang giao",
      icon: "delivery",
      value: memberOrders.filter((order) => order.status === "shipping").length,
      path: "/orders/shipping",
    },
    {
      label: "Hoàn tất",
      icon: "receipt",
      value: completedOrders,
      path: "/orders/completed",
    },
  ];
  const serviceShortcuts: Array<{
    label: string;
    icon: CommerceIconName;
    path: string;
    tone: string;
  }> = [
    {
      label: "Địa chỉ nhận hàng",
      icon: "map-pin",
      path: "/shipping-address",
      tone: "text-primary",
    },
    {
      label: "Điểm nhận hàng",
      icon: "package",
      path: "/stations",
      tone: "text-primary",
    },
    {
      label: "Cổng cán bộ",
      icon: "id-card",
      path: currentAffiliate ? "/affiliate" : "/affiliate/register",
      tone: "text-secondaryDark",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    refreshUserInfo((key) => key + 1);
    notify({
      title: "Đã đăng xuất",
      message: "Bạn có thể đăng nhập lại bằng số điện thoại bất cứ lúc nào.",
      kind: "info",
      topic: "account",
      actionPath: "/login",
    });
  };

  return (
    <Page className="min-h-screen pb-24">
      <Box className="p-4 space-y-4">
        <Box className="relative overflow-hidden rounded-[30px] brand-gradient p-4 text-primaryForeground shadow-[0_18px_48px_rgba(0,204,247,0.24)]">
          <Box className="absolute right-[-38px] top-[-44px] h-36 w-36 rounded-full bg-white/20 blur-xl" />
          <Box className="relative z-10 flex items-start gap-3">
            <button type="button" onClick={() => navigate(isLoggedIn ? "/profile/edit" : "/login")} className="flex shrink-0 flex-col items-center gap-1" aria-label="Đổi ảnh đại diện">
            <img
              src={accountAvatar}
              alt={accountName}
              className="h-16 w-16 rounded-[24px] object-cover ring-2 ring-white/70 shadow-lg"
            />
            <span className="text-xs font-semibold">{isLoggedIn ? "Đổi ảnh" : "Đăng nhập"}</span>
            </button>
            <Box className="min-w-0 flex-1">
              <Box className="flex items-start justify-between gap-2">
                <Box className="min-w-0">
                  <Text className="text-xl font-black leading-6 truncate text-primaryForeground">
                    {accountName}
                  </Text>
                  <Text className="mt-0.5 text-xs font-bold leading-5 text-slate-700/76 truncate">
                    {accountSubtitle}
                  </Text>
                </Box>
                <button
                  onClick={() =>
                    isLoggedIn
                      ? navigate("/profile/edit", { viewTransition: true })
                      : navigate("/login", { viewTransition: true })
                  }
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/26 text-primaryForeground ring-1 ring-white/40 backdrop-blur-xl"
                >
                  <CommerceIcon name={isLoggedIn ? "edit" : "phone"} size={18} />
                </button>
              </Box>

              <Box className="mt-3 flex flex-wrap items-center gap-2">
                <span className="commerce-tag commerce-tag--info">
                  {accountRole}
                </span>
                <span className="commerce-tag commerce-tag--muted">
                  {memberCode}
                </span>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="commerce-tag commerce-tag--danger"
                  >
                    Đăng xuất
                  </button>
                )}
              </Box>
            </Box>
          </Box>

          <Box className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            <Box className="rounded-[20px] bg-white/24 px-3 py-2 backdrop-blur-xl">
              <Text className="text-[11px] font-bold text-slate-700/72">Đang xử lý</Text>
              <Text className="mt-0.5 text-xl font-black text-primaryForeground">{activeOrders}</Text>
            </Box>
            <Box className="rounded-[20px] bg-white/24 px-3 py-2 backdrop-blur-xl">
              <Text className="text-[11px] font-bold text-slate-700/72">Hoàn tất</Text>
              <Text className="mt-0.5 text-xl font-black text-primaryForeground">{completedOrders}</Text>
            </Box>
            <Box className="rounded-[20px] bg-white/24 px-3 py-2 backdrop-blur-xl">
              <Text className="text-[11px] font-bold text-slate-700/72">Tổng mua</Text>
              <Text className="mt-1 text-sm font-black text-primaryForeground truncate">{formatPrice(totalSpent)}</Text>
            </Box>
          </Box>
        </Box>

        <Box className="liquid-card rounded-[26px] p-4 space-y-3">
          <Box className="flex items-center justify-between gap-3">
            <Text className="font-black text-slate-900">Đơn hàng của tôi</Text>
            <button
              onClick={() =>
                isLoggedIn
                  ? navigate("/orders", { viewTransition: true })
                  : navigate("/login", { viewTransition: true })
              }
              className="text-xs font-black text-primary"
            >
              Xem tất cả
            </button>
          </Box>
          <Box className="grid grid-cols-3 gap-2">
            {orderShortcuts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  isLoggedIn
                    ? navigate(item.path, { viewTransition: true })
                    : navigate("/login", { viewTransition: true })
                }
                className="rounded-[20px] bg-white/62 border border-white/70 px-2 py-3 text-center active:scale-[0.98]"
              >
                <Box className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CommerceIcon name={item.icon} size={21} />
                  {item.value > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                      {item.value}
                    </span>
                  )}
                </Box>
                <Text className="mt-2 text-[11px] font-bold leading-4 text-slate-700">
                  {item.label}
                </Text>
              </button>
            ))}
          </Box>
        </Box>

        <Box className="grid grid-cols-3 gap-2">
          {serviceShortcuts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                item.path === "/affiliate/register" && !isLoggedIn
                  ? navigate("/login", { viewTransition: true })
                  : navigate(item.path, { viewTransition: true })
              }
              className="liquid-card rounded-[22px] px-2 py-3 text-center active:scale-[0.98]"
            >
              <CommerceIcon name={item.icon} size={22} className={item.tone} />
              <Text className="mt-2 text-[11px] font-bold leading-4 text-slate-700">
                {item.label}
              </Text>
            </button>
          ))}
        </Box>

        <Box className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Box className="space-y-4">
            <Box className="liquid-card rounded-[26px] p-4 space-y-3">
              <Box className="flex items-start justify-between gap-3">
                <Box className="min-w-0">
                  <Text className="font-black text-slate-900">
                    {currentAffiliate ? "Khu vực hội viên" : "Đăng ký đại lý"}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-500">
                    {currentAffiliate
                      ? "Quản lý link tiếp thị, tuyến giới thiệu và điểm hoa hồng."
                      : "Mở link/QR giới thiệu riêng, ghi nhận doanh số và tích điểm hoa hồng."}
                  </Text>
                </Box>
                <span className={currentAffiliate ? "commerce-tag commerce-tag--success" : "commerce-tag commerce-tag--info"}>
                  {currentAffiliate ? getAffiliateRoleLabel(currentAffiliate) : "Có thể đăng ký"}
                </span>
              </Box>

              {currentAffiliate ? (
                <Box className="space-y-3">
                  <PersonalMarketingLink profile={currentAffiliate} />
                  <Button
                    onClick={() => navigate("/affiliate", { viewTransition: true })}
                    className="!rounded-[20px] brand-action font-bold"
                    fullWidth
                  >
                    Vào cổng quản lý
                  </Button>
                </Box>
              ) : (
                <Box className="space-y-3">
                  <Box className="grid gap-2">
                    {agentBenefits.slice(0, 3).map((item) => (
                      <Box
                        key={item.text}
                        className="rounded-[18px] bg-white/62 border border-white/70 px-3 py-3 flex gap-3"
                      >
                        <Box className="w-8 h-8 rounded-2xl secondary-soft flex items-center justify-center shrink-0">
                          <CommerceIcon name={item.icon} size={18} />
                        </Box>
                        <Text className="text-xs text-slate-600 leading-5">
                          {item.text}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    onClick={() =>
                      isLoggedIn
                        ? navigate("/affiliate/register", { viewTransition: true })
                        : navigate("/login", { viewTransition: true })
                    }
                    className="!rounded-[20px] brand-action font-bold"
                    fullWidth
                  >
                    {isLoggedIn ? "Đăng ký đại lý" : "Đăng nhập để đăng ký"}
                  </Button>
                </Box>
              )}
            </Box>

            <Box className="liquid-card rounded-[26px] p-4 space-y-3">
              <Box className="flex items-start justify-between gap-3">
                <Box className="min-w-0">
                  <Text className="font-black text-slate-900">Người giới thiệu</Text>
                  <Text className="text-xs text-slate-500 mt-1 leading-5">
                    Hiển thị tuyến hỗ trợ được gắn qua link tiếp thị cá nhân.
                  </Text>
                </Box>
                {currentAffiliate && (
                  <button
                    onClick={() => navigate("/affiliate", { viewTransition: true })}
                    className="liquid-button rounded-full px-3 py-1.5 text-xs font-bold text-primary whitespace-nowrap"
                  >
                    Quản lý
                  </button>
                )}
              </Box>

              {referrerAffiliate ? (
                <Box className="secondary-soft rounded-2xl p-3">
                  <Text className="text-[10px] font-bold text-primary uppercase">
                    {getAffiliateRoleLabel(referrerAffiliate)}
                  </Text>
                  <Text className="text-sm font-bold text-slate-900 mt-0.5">
                    {referrerAffiliate.name}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {referrerAffiliate.phone}
                  </Text>
                </Box>
              ) : (
                <Box className="rounded-2xl bg-white/58 border border-white/70 p-3">
                  <Text className="text-xs text-slate-600 leading-5">
                    Tài khoản này chưa có người giới thiệu được ghi nhận.
                  </Text>
                </Box>
              )}
            </Box>
          </Box>

          <Box className="space-y-4">
            <Points />
          </Box>
        </Box>

        <Box className="liquid-card rounded-[26px] p-4 space-y-3">
          <Box className="flex items-center justify-between">
            <Text className="font-black text-slate-900">Đơn gần đây</Text>
            {!isLoggedIn && (
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold text-primary"
              >
                Đăng nhập
              </button>
            )}
          </Box>

          {loadingOrders ? (
            <Text className="text-xs text-slate-500">Đang tải đơn hàng...</Text>
          ) : !isLoggedIn ? (
            <Text className="text-xs text-slate-500 leading-5">
              Đăng nhập bằng số điện thoại để xem đơn hàng và lưu trạng thái
              hội viên trên website hoặc Zalo Mini App.
            </Text>
          ) : memberOrders.length === 0 ? (
            <Text className="text-xs text-slate-500 leading-5">
              Chưa có đơn hàng nào gắn với số điện thoại {currentUser?.phone}.
            </Text>
          ) : (
            <Box className="space-y-2">
              {memberOrders.slice(0, 3).map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="w-full rounded-2xl bg-white/62 border border-white/70 p-3 text-left"
                >
                  <Box className="flex items-center justify-between gap-3">
                    <Text className="font-bold text-sm text-slate-900">
                      Đơn #{order.id}
                    </Text>
                    <Text className={STATUS_TAG_CLASS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Text>
                  </Box>
                  <Text className="text-xs text-slate-500 mt-1 truncate">
                    {getDeliveryAddress(order) || "Địa chỉ nhận hàng"}
                  </Text>
                  <Text className="text-sm font-black text-rose-600 mt-2">
                    {formatPrice(order.total)}
                  </Text>
                </button>
              ))}
            </Box>
          )}
        </Box>

        <Box className="grid gap-4 lg:grid-cols-2">
          <WebCapabilitiesCard />
          <FollowOA />
        </Box>
      </Box>
    </Page>
  );
}
