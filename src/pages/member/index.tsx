import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Page, Text } from "zmp-ui";
import {
  affiliatePortalState,
  affiliateReferrerIdState,
  loadableUserInfoState,
} from "@/state";
import { Order } from "@/types";
import { formatPrice } from "@/utils/format";
import { requestWithFallback } from "@/utils/request";
import {
  findAffiliateByReferrer,
  findAffiliateForUser,
  getAffiliateRoleLabel,
} from "@/utils/affiliate";
import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useNavigate } from "react-router-dom";
import CommerceIcon, { CommerceIconName } from "@/components/commerce-icon";
import PersonalMarketingLink from "@/components/personal-marketing-link";

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
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
  const isOfficer = Boolean(currentAffiliate);

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

    requestWithFallback<Order[]>(
      `/orders?${new URLSearchParams({ phone }).toString()}`,
      []
    )
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

  if (!isOfficer) {
    return (
      <Page className="min-h-screen pb-24">
        <Box className="p-4 space-y-4">
          <Box
            className="rounded-[28px] p-5 text-white shadow-lg overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 204, 247, 0.9), rgba(16, 185, 129, 0.76))",
              backdropFilter: "blur(24px) saturate(1.35)",
            }}
          >
            <Text className="text-xs uppercase tracking-wide font-bold text-emerald-100">
              Khu vực đại lý
            </Text>
            <Text className="mt-2 text-2xl font-black text-white">
              Mở tài khoản đại lý
            </Text>
            <Text className="mt-2 text-sm text-white/82 leading-5">
              Tạo link bán hàng riêng, ghi nhận doanh số tự động và tích điểm
              theo phần trăm hoa hồng.
            </Text>
          </Box>

          <Box className="liquid-card commerce-card p-4 space-y-3">
            <Text className="font-bold text-slate-900">
              Quyền lợi đại lý
            </Text>
            <Box className="grid gap-2">
              {agentBenefits.map((item) => (
                <Box
                  key={item.text}
                  className="rounded-[18px] bg-white/62 border border-white/70 px-3 py-3 flex gap-3"
                >
                  <Box className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CommerceIcon name={item.icon} size={18} />
                  </Box>
                  <Text className="text-xs text-slate-600 leading-5">
                    {item.text}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>

          <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={() =>
                isLoggedIn
                  ? navigate("/affiliate/register")
                  : navigate("/login", { viewTransition: true })
              }
              className="!rounded-[20px] bg-primary text-primaryForeground font-bold"
            >
              {isLoggedIn ? "Đăng ký đại lý" : "Đăng nhập để đăng ký"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="secondary"
              className="!rounded-[20px] font-bold"
            >
              Tiếp tục mua hàng
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  return (
    <Page className="min-h-screen pb-24">
      <Box className="p-4 space-y-4">
        <Box
          className="rounded-[28px] p-5 text-white shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 204, 247, 0.92), rgba(20, 184, 166, 0.78))",
            backdropFilter: "blur(24px) saturate(1.35)",
          }}
        >
          <Text className="text-xs uppercase tracking-wide font-bold text-slate-700/72">
            Khu hội viên
          </Text>
          <Text className="mt-2 text-2xl font-black text-primaryForeground">
            Hội Liên hiệp Phụ nữ Việt Nam
          </Text>
          <Text className="mt-2 text-sm text-slate-700/82 leading-5">
            Theo dõi thẻ hội viên, tuyến hỗ trợ, đơn hàng và điểm nhận hàng
            theo Chi hội/Tổ phụ nữ.
          </Text>

          <Box className="mt-4 rounded-2xl bg-white/18 border border-white/30 p-3">
            <Box className="flex items-center justify-between gap-3">
              <Box className="min-w-0">
                  <Text className="text-[11px] text-slate-700/70 font-bold uppercase">
                    Mã hội viên
                  </Text>
                <Text className="text-lg font-black text-primaryForeground">{memberCode}</Text>
              </Box>
              <Box className="rounded-full bg-white text-primary px-3 py-1 text-xs font-black">
                {isOfficer ? "Cán bộ Hội" : "Hội viên"}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="grid grid-cols-3 gap-3">
          <Box className="liquid-card rounded-[22px] p-3">
            <Text className="text-[11px] text-slate-400 font-semibold">
              Đơn hoạt động
            </Text>
            <Text className="text-xl font-black text-primary mt-1">
              {activeOrders}
            </Text>
          </Box>
          <Box className="liquid-card rounded-[22px] p-3">
            <Text className="text-[11px] text-slate-400 font-semibold">
              Đã hoàn tất
            </Text>
            <Text className="text-xl font-black text-emerald-600 mt-1">
              {completedOrders}
            </Text>
          </Box>
          <Box className="liquid-card rounded-[22px] p-3">
            <Text className="text-[11px] text-slate-400 font-semibold">
              Tổng mua
            </Text>
            <Text className="text-sm font-black text-rose-600 mt-2 truncate">
              {formatPrice(totalSpent)}
            </Text>
          </Box>
        </Box>

        {currentAffiliate && (
          <PersonalMarketingLink profile={currentAffiliate} />
        )}

        <Box className="liquid-card rounded-[24px] p-4 space-y-3">
          <Box className="flex items-start justify-between gap-3">
            <Box className="min-w-0">
              <Text className="font-bold text-slate-900">Người giới thiệu</Text>
              <Text className="text-xs text-slate-500 mt-1 leading-5">
                Trang cán bộ chỉ hiển thị người đã giới thiệu tài khoản này.
              </Text>
            </Box>
            <button
              onClick={() => navigate("/affiliate")}
              className="liquid-button rounded-full px-3 py-1.5 text-xs font-bold text-primary whitespace-nowrap"
            >
              Cổng quản lý
            </button>
          </Box>

          {referrerAffiliate ? (
            <Box className="rounded-2xl bg-cyan-50/70 border border-white/70 p-3">
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
                Tài khoản cán bộ này chưa có người giới thiệu được ghi nhận.
              </Text>
            </Box>
          )}
        </Box>

        <Box className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/orders/pending")}
            className="rounded-2xl bg-primary text-primaryForeground font-bold"
          >
            Theo dõi đơn
          </Button>
          <Button
            onClick={() => navigate("/stations")}
            variant="secondary"
            className="rounded-2xl font-bold"
          >
            Điểm nhận hàng
          </Button>
        </Box>

        <Box className="liquid-card rounded-[24px] p-4 space-y-3">
          <Box className="flex items-center justify-between">
            <Text className="font-bold text-slate-900">Đơn gần đây</Text>
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
                    <Text className="text-xs font-bold text-primary">
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
      </Box>
    </Page>
  );
}
