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
  getAffiliateCommissionLabel,
  getAffiliateCommissionPoints,
  getAffiliateCommissionRate,
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
import LoginPinCard from "@/pages/profile/login-pin";
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

type AccountTab = "overview" | "orders" | "security" | "affiliate" | "support";

const ACCOUNT_TABS: Array<{
  key: AccountTab;
  label: string;
  shortLabel: string;
  icon: CommerceIconName;
}> = [
  { key: "overview", label: "Tổng quan", shortLabel: "Tổng", icon: "grid" },
  { key: "orders", label: "Đơn hàng", shortLabel: "Đơn", icon: "receipt" },
  { key: "security", label: "Bảo mật", shortLabel: "PIN", icon: "shield" },
  { key: "affiliate", label: "Hội viên", shortLabel: "Hội viên", icon: "id-card" },
  { key: "support", label: "Hỗ trợ", shortLabel: "Hỗ trợ", icon: "bell" },
];

export default function MemberPage() {
  const navigate = useNavigate();
  const refreshUserInfo = useSetAtom(userInfoKeyState);
  const notify = useFrontendNotification();
  const [activeTab, setActiveTab] = useState<AccountTab>("overview");
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
      text: "Điểm được quy đổi từ hoa hồng bán hàng. 1.000đ hoa hồng = 1 điểm.",
    },
    {
      icon: "id-card",
      text: "Sau khi đăng ký, tài khoản sẽ mở đầy đủ quyền hội viên/đại lý.",
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
  const affiliateCommission = getAffiliateCommissionPoints(currentAffiliate, portalLoadable.state === "hasData" ? portalLoadable.data : undefined);
  const affiliateCommissionRate = getAffiliateCommissionRate(
    currentAffiliate,
    portalLoadable.state === "hasData" ? portalLoadable.data : undefined
  );
  const affiliateCommissionLabel = getAffiliateCommissionLabel(
    currentAffiliate,
    portalLoadable.state === "hasData" ? portalLoadable.data : undefined
  );
  const personalCommissions = (portalLoadable.state === "hasData" ? portalLoadable.data?.commissions || [] : []).filter(
    (commission) => commission.beneficiaryId === currentAffiliate?.userId
  );
  const pendingCommissionOrders = new Set(
    personalCommissions
      .filter((commission) => commission.status === "pending")
      .map((commission) => commission.orderId)
  ).size;
  const affiliateDashboardStats = [
    {
      label: "Doanh số",
      value: formatPrice(currentAffiliate?.totalSales || 0),
      icon: "receipt" as CommerceIconName,
      tone: "text-primary",
    },
    {
      label: "Ví hoa hồng",
      value: formatPrice(currentAffiliate?.walletBalance || 0),
      icon: "wallet" as CommerceIconName,
      tone: "text-secondaryDark",
    },
    {
      label: "Chờ duyệt",
      value: formatPrice(affiliateCommission.pendingCommission),
      icon: "calendar" as CommerceIconName,
      tone: "text-amber-600",
    },
    {
      label: "Mức hoa hồng",
      value: `${affiliateCommissionRate || 0}%`,
      icon: "percent" as CommerceIconName,
      tone: "text-emerald-600",
    },
  ];
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
      label: "Khu hội viên",
      icon: "id-card",
      path: currentAffiliate ? "/affiliate" : "/affiliate/register",
      tone: "text-secondaryDark",
    },
  ];

  const affiliateCards = currentAffiliate ? (
    <Box className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Box className="space-y-4">
        <PersonalMarketingLink profile={currentAffiliate} />
        <Box className="liquid-card rounded-[26px] p-4 space-y-3">
          <Box className="flex items-start justify-between gap-3">
            <Box className="min-w-0">
              <Text className="font-black text-slate-900">Người giới thiệu</Text>
              <Text className="text-xs text-slate-500 mt-1 leading-5">
                Tuyến hỗ trợ được gắn qua link giới thiệu cá nhân.
              </Text>
            </Box>
            <span className="commerce-tag commerce-tag--info">
              {currentAffiliate.referralCode}
            </span>
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
  ) : (
    <Box className="liquid-card rounded-[26px] p-4 space-y-3">
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Text className="font-black text-slate-900">Đăng ký đại lý</Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">
            Mở khu hội viên, link/QR giới thiệu riêng và ví hoa hồng cá nhân.
          </Text>
        </Box>
        <span className="commerce-tag commerce-tag--info">Có thể đăng ký</span>
      </Box>
      <Box className="grid gap-2 md:grid-cols-2">
        {agentBenefits.map((item) => (
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
  );

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
        <Box className="account-profile-hero liquid-card rounded-[28px] p-3 text-slate-900">
          <Box className="absolute right-[-38px] top-[-44px] h-36 w-36 rounded-full bg-primary/18 blur-xl" />
          <Box className="absolute left-[-44px] bottom-[-52px] h-40 w-40 rounded-full bg-secondary/16 blur-2xl" />
          <Box className="relative z-10 flex items-start gap-2.5">
            <button type="button" onClick={() => navigate(isLoggedIn ? "/profile/edit" : "/login")} className="flex shrink-0 flex-col items-center gap-1" aria-label="Đổi ảnh đại diện">
            <img
              src={accountAvatar}
              alt={accountName}
              className="h-14 w-14 rounded-[20px] object-cover ring-2 ring-white/80 shadow-lg"
            />
            <span className="text-xs font-black text-primary">{isLoggedIn ? "Đổi ảnh" : "Đăng nhập"}</span>
            </button>
            <Box className="min-w-0 flex-1">
              <Box className="flex items-start justify-between gap-2">
                <Box className="min-w-0">
                  <Text className="text-xl font-black leading-6 truncate text-slate-950">
                    {accountName}
                  </Text>
                  <Text className="mt-0.5 text-[13px] font-bold leading-5 text-slate-600 truncate">
                    {accountSubtitle}
                  </Text>
                </Box>
                <button
                  onClick={() =>
                    isLoggedIn
                      ? navigate("/profile/edit", { viewTransition: true })
                      : navigate("/login", { viewTransition: true })
                  }
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/54 text-primary ring-1 ring-white/70 backdrop-blur-xl"
                >
                  <CommerceIcon name={isLoggedIn ? "edit" : "phone"} size={19} />
                </button>
              </Box>

              <Box className="mt-2 flex flex-wrap items-center gap-2">
                <span className="commerce-tag commerce-tag--info account-profile-tag">
                  {accountRole}
                </span>
                <span className="commerce-tag commerce-tag--muted account-profile-tag">
                  {memberCode}
                </span>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="commerce-tag commerce-tag--danger account-profile-tag"
                  >
                    Đăng xuất
                  </button>
                )}
              </Box>
            </Box>
          </Box>

          <Box className="relative z-10 mt-3 grid grid-cols-3 gap-1.5">
            <Box className="account-profile-stat">
              <Text className="text-xs font-black text-slate-500">Đang xử lý</Text>
              <Text className="mt-0.5 text-xl font-black text-primary">{activeOrders}</Text>
            </Box>
            <Box className="account-profile-stat">
              <Text className="text-xs font-black text-slate-500">Hoàn tất</Text>
              <Text className="mt-0.5 text-xl font-black text-primary">{completedOrders}</Text>
            </Box>
            <Box className="account-profile-stat">
              <Text className="text-xs font-black text-slate-500">Tổng mua</Text>
              <Text className="mt-1 text-base font-black text-primary truncate">{formatPrice(totalSpent)}</Text>
            </Box>
          </Box>
        </Box>

        <Box className="sticky top-2 z-20 -mx-1 pb-1 md:overflow-x-auto">
          <Box className="grid w-full grid-cols-5 gap-1 rounded-[22px] border border-white/70 bg-white/56 p-1 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:flex md:w-auto md:min-w-max md:gap-2 md:rounded-[24px]">
            {ACCOUNT_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[16px] px-1 text-[10px] font-black leading-none transition md:h-11 md:flex-row md:gap-2 md:rounded-[19px] md:px-3 md:text-xs ${
                    isActive
                      ? "brand-action text-primaryForeground shadow-[0_12px_28px_rgba(0,204,247,0.2)]"
                      : "text-slate-600 hover:bg-white/62"
                  }`}
                  aria-label={tab.label}
                >
                  <CommerceIcon name={tab.icon} size={18} className="shrink-0 md:h-4 md:w-4" />
                  <span className="max-w-full truncate md:hidden">{tab.shortLabel}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </Box>
        </Box>

        {activeTab === "orders" && (
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
        )}

        {activeTab === "overview" && (
        <Box className="space-y-4">
          <Box className="px-1">
            <Text className="text-xs font-black uppercase tracking-[0.08em] text-primary">
              Tổng quan hội viên
            </Text>
            <Text className="mt-1 text-2xl font-black leading-8 text-slate-950 break-words">
              {currentAffiliate ? currentAffiliate.name : "Kích hoạt đại lý Saximi"}
            </Text>
            <Text className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {currentAffiliate
                ? `${getAffiliateRoleLabel(currentAffiliate)} · ${affiliateCommissionLabel}`
                : "Đăng ký để mở link giới thiệu, QR cá nhân và ví hoa hồng."}
            </Text>
          </Box>

          <Box className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {affiliateDashboardStats.map((item) => (
              <Box key={item.label} className="liquid-card rounded-[22px] px-3 py-3 text-slate-900">
                <Box className="flex items-center justify-between gap-2">
                  <Text className="text-[10px] font-black uppercase text-slate-400">
                    {item.label}
                  </Text>
                  <CommerceIcon name={item.icon} size={16} className={item.tone} />
                </Box>
                <Text className={`mt-1 text-sm font-black leading-5 break-words ${item.tone}`}>
                  {item.value}
                </Text>
              </Box>
            ))}
          </Box>

          <Box className="grid gap-2 min-[430px]:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                currentAffiliate
                  ? navigate("/affiliate", { viewTransition: true })
                  : isLoggedIn
                    ? navigate("/affiliate/register", { viewTransition: true })
                    : navigate("/login", { viewTransition: true })
              }
              className="rounded-[22px] brand-action px-3 py-3 text-left text-primaryForeground shadow-[0_12px_28px_rgba(0,204,247,0.2)]"
            >
              <Text className="text-xs font-black">
                {currentAffiliate ? "Cổng quản lý" : "Đăng ký đại lý"}
              </Text>
              <Text className="mt-0.5 text-[11px] font-bold text-slate-700/82">
                {currentAffiliate ? "Xem tuyến, ví và rút tiền" : "Mở link/QR giới thiệu"}
              </Text>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className="liquid-card rounded-[22px] px-3 py-3 text-left"
            >
              <Text className="text-xs font-black text-slate-900">Đơn có hoa hồng</Text>
              <Text className="mt-0.5 text-[11px] font-bold text-slate-500">
                {pendingCommissionOrders} đơn đang chờ duyệt
              </Text>
            </button>
            <button
              type="button"
              onClick={() => navigate("/shipping-address", { viewTransition: true })}
              className="liquid-card rounded-[22px] px-3 py-3 text-left"
            >
              <Text className="text-xs font-black text-slate-900">Địa chỉ mặc định</Text>
              <Text className="mt-0.5 text-[11px] font-bold text-slate-500">
                Chỉnh địa chỉ nhận hàng
              </Text>
            </button>
          </Box>

          {currentAffiliate && (
            <Box className="grid gap-2 min-[430px]:grid-cols-3">
              {[
                ["Mã giới thiệu", currentAffiliate.referralCode],
                ["Loại hoa hồng", affiliateCommissionLabel],
                ["Điểm quy đổi", `${affiliateCommission.points.toLocaleString("vi-VN")} điểm`],
              ].map(([label, value]) => (
                <Box key={label} className="rounded-[18px] bg-white/58 px-3 py-2 ring-1 ring-white/70">
                  <Text className="text-[10px] font-black uppercase text-slate-400">{label}</Text>
                  <Text className="mt-0.5 text-xs font-black leading-5 text-slate-900 break-words">{value}</Text>
                </Box>
              ))}
            </Box>
          )}

          {affiliateCards}

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
        </Box>
        )}

        {activeTab === "security" && (
        <Box className="space-y-2">
          <Box className="px-1">
            <Text className="text-xs font-black uppercase tracking-[0.08em] text-primary">
              Bảo mật tài khoản
            </Text>
            <Text className="mt-0.5 text-xs leading-5 text-slate-500">
              Thiết lập hoặc đặt lại mã PIN đăng nhập nhanh sau khi đã đăng nhập.
            </Text>
          </Box>
          <LoginPinCard />
        </Box>
        )}

        {activeTab === "affiliate" && (
        <Box className="space-y-4">
          {affiliateCards}
        </Box>
        )}

        {activeTab === "orders" && (
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
              hội viên trên website hoặc Zalo.
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
        )}

        {activeTab === "support" && (
        <Box className="grid gap-4 lg:grid-cols-2">
          <WebCapabilitiesCard />
          <FollowOA />
        </Box>
        )}
      </Box>
    </Page>
  );
}
