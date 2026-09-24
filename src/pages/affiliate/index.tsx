import React, { useEffect, useMemo, useState } from "react";
import { Page, Box, Text, Button } from "zmp-ui";
import { affiliatePortalState, loadableUserInfoState } from "@/state";
import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import {
  findAffiliateForUser,
  getAffiliateCommissionLabel,
  getAffiliateHierarchyPath,
  getAffiliateRoleDescription,
  getAffiliateRoleLabel,
} from "@/utils/affiliate";
import { buildReferralLink } from "@/utils/platform";
import { useFrontendNotification } from "@/hooks";
import PersonalMarketingLink from "@/components/personal-marketing-link";
import MarketingQrCode from "@/components/marketing-qr-code";

type WithdrawalNotice = {
  requestCode: string;
  amount: number;
  submittedAt: string;
};

export const AffiliatePortalPage: React.FC = () => {
  const [role, setRole] = useState<"BRANCH_LEADER" | "PRESIDENT">("BRANCH_LEADER");
  const [copied, setCopied] = useState(false);
  const [withdrawRequested, setWithdrawRequested] = useState(false);
  const [withdrawalNotice, setWithdrawalNotice] = useState<WithdrawalNotice>();
  const notify = useFrontendNotification();
  const portalLoadable = useAtomValue(
    useMemo(() => loadable(affiliatePortalState), [])
  );
  const userInfo = useAtomValue(loadableUserInfoState);
  const portal =
    portalLoadable.state === "hasData" ? portalLoadable.data : undefined;
  const affiliates = portal?.affiliates || [];
  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const currentAffiliate = findAffiliateForUser(affiliates, currentUser);
  const branchProfile =
    currentAffiliate?.role === "BRANCH_LEADER" ? currentAffiliate : undefined;
  const presidentProfile =
    currentAffiliate?.role === "PRESIDENT" ? currentAffiliate : undefined;

  useEffect(() => {
    if (currentAffiliate?.role === "PRESIDENT") {
      setRole("PRESIDENT");
    } else if (currentAffiliate?.role === "BRANCH_LEADER") {
      setRole("BRANCH_LEADER");
    }
  }, [currentAffiliate?.role]);

  const personalCommissions = (portal?.commissions || []).filter(
    (commission) => commission.beneficiaryId === currentAffiliate?.userId
  );
  const pendingCommission = personalCommissions
    .filter((commission) => commission.status === "pending")
    .reduce((sum, commission) => sum + commission.amount, 0);
  const totalCustomers = new Set(
    personalCommissions.map((commission) => commission.orderId)
  ).size;
  const presidentConsignments = (portal?.consignments || []).filter(
    (stock) => stock.presidentId === presidentProfile?.userId
  );
  const consignmentStock = presidentConsignments.reduce(
    (summary, stock) => ({
      allocated: summary.allocated + stock.allocatedQuantity,
      sold: summary.sold + stock.soldQuantity,
      remaining: summary.remaining + stock.remainingQuantity,
      debtAmount: summary.debtAmount + stock.debtAmount,
    }),
    { allocated: 0, sold: 0, remaining: 0, debtAmount: 0 }
  );
  const managedBranches =
    (presidentProfile && portal?.branchesByPresident[presidentProfile.userId]) ||
    [];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(buildReferralLink(currentAffiliate?.userId || ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const notifyWithdrawalRequest = (amount: number, requestCode: string) => {
    const message = `Yêu cầu ${requestCode} trị giá ${formatMoney(amount)} đã gửi đến bộ phận đối soát.`;
    notify(
      {
        title: "Yêu cầu rút tiền đã gửi",
        message,
        kind: "success",
        topic: "commission",
        actionPath: "/affiliate",
      },
      { browser: true }
    );
  };

  const handleWithdrawRequest = () => {
    const amount = currentAffiliate?.walletBalance || 0;
    if (!amount) {
      notify({
        title: "Chưa thể rút tiền",
        message: "Ví hoa hồng chưa có số dư khả dụng để rút.",
        kind: "warning",
        topic: "commission",
      });
      return;
    }

    const requestCode = `RT-${Date.now().toString().slice(-6)}`;
    const notice = {
      requestCode,
      amount,
      submittedAt: new Date().toISOString(),
    };
    setWithdrawRequested(true);
    setWithdrawalNotice(notice);
    notifyWithdrawalRequest(amount, requestCode);
  };

  if (portalLoadable.state === "loading" || userInfo.state === "loading") {
    return (
      <Page className="min-h-screen p-4">
        <Box className="h-28 rounded-[24px] bg-slate-200/50 animate-pulse" />
        <Box className="mt-4 h-56 rounded-[24px] bg-slate-200/50 animate-pulse" />
      </Page>
    );
  }

  if (!currentAffiliate) {
    return (
      <Page className="min-h-screen p-4">
        <Box className="liquid-card rounded-[24px] p-5 space-y-3">
          <Box className="w-12 h-12 rounded-full bg-slate-800/85 text-white flex items-center justify-center font-bold">
            KH
          </Box>
          <Box>
            <Text className="font-bold text-slate-900">
              {getAffiliateRoleLabel()}
            </Text>
            <Text className="text-xs text-slate-500 mt-1 leading-5">
              {getAffiliateRoleDescription()}
            </Text>
          </Box>
          <Box className="rounded-2xl bg-white/58 border border-white/70 px-3 py-2">
            <Text className="text-xs text-slate-600 leading-5">
              Cổng này chỉ mở cho tài khoản được tạo trong Admin với vai trò
              Chi hội trưởng hoặc Chủ tịch hội. Khách hàng thường vẫn mua hàng,
              theo dõi đơn và được gắn tuyến khi mở app bằng link Chi hội/Tổ
              phụ nữ.
            </Text>
          </Box>
        </Box>
      </Page>
    );
  }

  if (!branchProfile && !presidentProfile) {
    return (
      <Page className="min-h-screen p-4">
        <Box className="liquid-card rounded-[24px] p-5 text-center">
          <Text className="font-bold text-slate-800">
            Chưa có dữ liệu Chi hội
          </Text>
          <Text className="text-xs text-slate-500 mt-1">
            Vui lòng tạo Chi hội trưởng hoặc Chủ tịch hội trong Admin.
          </Text>
        </Box>
      </Page>
    );
  }

  const activeProfile = currentAffiliate;
  const roleName =
    activeProfile?.levelName ||
    (role === "BRANCH_LEADER" ? "Chi hội trưởng" : "Chủ tịch Hội");
  const parentPresident = branchProfile?.presidentId
    ? affiliates.find((affiliate) => affiliate.userId === branchProfile.presidentId)
    : undefined;
  const activeHierarchyPath = getAffiliateHierarchyPath(activeProfile, parentPresident);

  return (
    <Page className="min-h-screen pb-24">
      {/* Dynamic Header Banner */}
      <Box
        className="text-white p-5 rounded-b-[28px] shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(0, 204, 247, 0.94), rgba(20, 184, 166, 0.76))",
          backdropFilter: "blur(24px) saturate(1.35)",
        }}
      >
        <Box className="flex justify-between items-center mb-3">
          <Text className="text-xs uppercase font-bold tracking-wider text-slate-700/72">
            Cổng cán bộ Hội LHPN
          </Text>

          <Box className="flex bg-white/24 p-1 rounded-full border border-white/40">
            <span className="bg-white text-primary shadow px-3 py-1 rounded-full text-xs font-bold">
              {roleName}
            </span>
          </Box>
        </Box>

        <Box className="flex items-center gap-3">
          <img
            src={activeProfile?.avatar}
            alt="Avatar"
            className="w-14 h-14 rounded-full border-2 border-white object-cover"
          />
          <Box>
            <Text className="font-extrabold text-lg text-primaryForeground">
              {activeProfile?.name}
            </Text>
            <Text className="text-xs text-slate-700/80 font-medium">
              Chức vụ: <span className="font-bold text-yellow-300">{roleName}</span>
            </Text>
            {activeHierarchyPath.length > 0 && (
              <Text className="mt-1 text-[11px] text-slate-700/70 font-semibold">
                {activeHierarchyPath.join(" > ")}
              </Text>
            )}
          </Box>
        </Box>
      </Box>

      <Box className="px-4 pt-4">
        <PersonalMarketingLink profile={currentAffiliate} />
      </Box>

      {/* BRANCH LEADER DASHBOARD VIEW */}
      {role === "BRANCH_LEADER" && (
        <Box className="p-4 space-y-4">
          {parentPresident && (
            <Box className="liquid-card p-4 rounded-[24px]">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Cấp bậc tuyến hội
              </Text>
              <Box className="mt-3 space-y-2">
                <Box className="rounded-2xl bg-indigo-50/70 border border-white/70 px-3 py-2">
                  <Text className="text-[10px] font-bold text-indigo-600">
                    {parentPresident.levelName || "Chủ tịch hội cấp trên"}
                  </Text>
                  <Text className="text-sm font-bold text-slate-800">
                    {parentPresident.name}
                  </Text>
                </Box>
                <Box className="ml-4 rounded-2xl bg-cyan-50/70 border border-white/70 px-3 py-2">
                  <Text className="text-[10px] font-bold text-primary">
                    {branchProfile?.levelName || "Chi hội trưởng trực thuộc"}
                  </Text>
                  <Text className="text-sm font-bold text-slate-800">
                    {branchProfile?.name}
                  </Text>
                </Box>
                <Box className="rounded-2xl bg-white/62 border border-white/70 px-3 py-2">
                  <Text className="text-[10px] font-bold text-emerald-600">
                    {getAffiliateCommissionLabel(branchProfile)}
                  </Text>
                  <Text className="text-xs font-bold text-slate-700">
                    Tỷ lệ cá nhân {branchProfile?.directCommissionRate || 0}%
                  </Text>
                </Box>
              </Box>
            </Box>
          )}

          {/* Wallet Summary */}
          <Box className="liquid-card p-5 rounded-[24px] space-y-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Ví {getAffiliateCommissionLabel(branchProfile)} ({branchProfile?.directCommissionRate || 0}%)
            </Text>
            <Box className="flex justify-between items-baseline">
              <Text className="text-2xl font-black text-emerald-600">
                {formatMoney(branchProfile?.walletBalance || 0)}
              </Text>
              <Button
                size="small"
                disabled={withdrawRequested || !branchProfile?.walletBalance}
                onClick={handleWithdrawRequest}
                className="bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-60"
              >
                {withdrawRequested ? "Đã gửi" : "Rút Tiền"}
              </Button>
            </Box>

            <Box className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
              <span>Hoa hồng đang chờ duyệt:</span>
              <span className="font-bold text-amber-600">{formatMoney(pendingCommission)}</span>
            </Box>

            {withdrawalNotice && (
              <Box className="rounded-2xl bg-emerald-50/80 border border-emerald-100 px-3 py-3 space-y-2">
                <Box className="flex items-start justify-between gap-3">
                  <Box className="min-w-0">
                    <Text className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                      Thông báo rút tiền
                    </Text>
                    <Text className="text-xs font-bold text-slate-900 mt-0.5">
                      Yêu cầu {withdrawalNotice.requestCode} đã được ghi nhận
                    </Text>
                  </Box>
                  <Box className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-emerald-700">
                    Chờ đối soát
                  </Box>
                </Box>
                <Box className="grid grid-cols-2 gap-2 text-xs">
                  <Box className="rounded-xl bg-white/72 px-3 py-2">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase">
                      Số tiền
                    </Text>
                    <Text className="font-black text-emerald-700">
                      {formatMoney(withdrawalNotice.amount)}
                    </Text>
                  </Box>
                  <Box className="rounded-xl bg-white/72 px-3 py-2">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase">
                      Thời gian gửi
                    </Text>
                    <Text className="font-bold text-slate-700">
                      {new Date(withdrawalNotice.submittedAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </Text>
                  </Box>
                </Box>
                <Text className="text-[11px] leading-5 text-slate-600">
                  Bộ phận đối soát sẽ kiểm tra ví hoa hồng và liên hệ xác nhận trước khi chuyển khoản.
                </Text>
              </Box>
            )}
          </Box>

          {/* QR Code Sharing Block */}
          <Box className="liquid-card p-5 rounded-[24px] text-center space-y-3">
            <Text className="font-bold text-slate-800 text-base">
              Mã QR Độc Quyền Giới Thiệu Khách Mua Hàng
            </Text>
            <Text className="text-xs text-slate-500">
              Đưa mã QR này cho Khách quét để mở Mini App. Đơn hàng sẽ tự động ghi nhận {getAffiliateCommissionLabel(branchProfile).toLowerCase()} cho bạn.
            </Text>

            {branchProfile && (
              <MarketingQrCode
                value={buildReferralLink(branchProfile.userId)}
                title="QR tiếp thị chi hội"
                caption="Khách quét QR sẽ mở đúng link website chính thức và ghi nhận doanh số cho chi hội này."
                fileName={`saximi-qr-${branchProfile.userId}.png`}
                className="text-left"
              />
            )}

            <Box className="pt-2 flex justify-center gap-2">
              <Button onClick={handleCopyLink} size="small" variant="secondary" className="rounded-xl">
                {copied ? "Đã chép Link!" : "Sao Chép Link Giới Thiệu"}
              </Button>
            </Box>
          </Box>

          {/* Stats Overview */}
          <Box className="grid grid-cols-2 gap-3">
            <Box className="liquid-card p-4 rounded-[24px]">
              <Text className="text-xs text-slate-400 font-medium">Tổng doanh số</Text>
              <Text className="text-base font-extrabold text-primary mt-1">
                {formatMoney(branchProfile?.totalSales || 0)}
              </Text>
            </Box>

            <Box className="liquid-card p-4 rounded-[24px]">
              <Text className="text-xs text-slate-400 font-medium">Khách đã giới thiệu</Text>
              <Text className="text-base font-extrabold text-purple-600 mt-1">
                {totalCustomers} Đơn
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* PRESIDENT DASHBOARD VIEW */}
      {role === "PRESIDENT" && (
        <Box className="p-4 space-y-4">
          {/* Consignment Stock & Debt Overview */}
          <Box className="text-white p-5 rounded-[24px] shadow-md space-y-3 bg-gradient-to-br from-amber-500/90 to-orange-600/85 backdrop-blur-xl">
            <Text className="text-xs font-bold text-amber-100 uppercase tracking-wide">
              Quản Lý Hàng Gối Đầu (Ứng Trước Từ Công Ty)
            </Text>

            <Box className="grid grid-cols-3 gap-2 text-center bg-black/15 p-3 rounded-xl backdrop-blur-sm">
              <Box>
                <Text className="text-[10px] text-amber-100">Đã ứng trước</Text>
                <Text className="font-extrabold text-white text-base">
                  {consignmentStock.allocated} sp
                </Text>
              </Box>
              <Box className="border-x border-white/20">
                <Text className="text-[10px] text-amber-100">Đã bán</Text>
                <Text className="font-extrabold text-emerald-300 text-base">
                  {consignmentStock.sold} sp
                </Text>
              </Box>
              <Box>
                <Text className="text-[10px] text-amber-100">Tồn kho còn lại</Text>
                <Text className="font-extrabold text-yellow-200 text-base">
                  {consignmentStock.remaining} sp
                </Text>
              </Box>
            </Box>

            <Box className="pt-2 flex justify-between items-center text-xs">
              <span className="text-amber-100">Công nợ sản phẩm ứng trước:</span>
              <span className="font-black text-white text-sm">
                {formatMoney(consignmentStock.debtAmount)}
              </span>
            </Box>
          </Box>

          {/* Overriding Commission Summary */}
          <Box className="liquid-card p-5 rounded-[24px] space-y-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Ví {getAffiliateCommissionLabel(presidentProfile)} ({presidentProfile?.overridingCommissionRate || 0}%)
            </Text>
            <Text className="text-2xl font-black text-emerald-600">
              {formatMoney(presidentProfile?.walletBalance || 0)}
            </Text>
            <Text className="text-xs text-slate-500">
              Tổng doanh số tuyến Chi hội trưởng: <strong className="text-slate-800">{formatMoney(presidentProfile?.totalSales || 0)}</strong>
            </Text>
          </Box>

          {/* Managed Branch Leaders List */}
          <Box className="liquid-card p-5 rounded-[24px] space-y-3">
            <Text className="font-bold text-slate-800 text-sm">
              Danh sách Chi hội trưởng trực thuộc ({managedBranches.length})
            </Text>

            <Box className="space-y-2.5">
              {managedBranches.map((b) => (
                <Box key={b.userId} className="flex justify-between items-center p-3 bg-white/58 rounded-2xl border border-white/70">
                  <Box>
                    <Text className="text-[10px] font-bold text-primary">
                      {b.levelName || "Chi hội trưởng trực thuộc"}
                    </Text>
                    <Text className="font-bold text-xs text-slate-800">{b.name}</Text>
                    <Text className="text-[10px] text-slate-400">{b.phone}</Text>
                    <Text className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      {getAffiliateCommissionLabel(b)} {b.directCommissionRate || 0}%
                    </Text>
                  </Box>

                  <Box className="text-right">
                    <Text className="text-xs font-bold text-primary">{formatMoney(b.totalSales)}</Text>
                    <Text className="text-[10px] text-emerald-600 font-semibold">
                      Doanh số tuyến
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Page>
  );
};

export default AffiliatePortalPage;
