import Barcode from "./barcode";
import barcodeIllusLeft from "@/static/barcode-illus-left.svg";
import barcodeIllusRight from "@/static/barcode-illus-right.svg";
import { affiliatePortalState, loadableUserInfoState } from "@/state";
import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useMemo } from "react";
import {
  findAffiliateForUser,
  getAffiliateCommissionPoints,
} from "@/utils/affiliate";
import { formatPrice } from "@/utils/format";
import CommerceIcon from "@/components/commerce-icon";

export default function Points() {
  const userInfo = useAtomValue(loadableUserInfoState);
  const portalLoadable = useAtomValue(
    useMemo(() => loadable(affiliatePortalState), [])
  );
  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const portal =
    portalLoadable.state === "hasData" ? portalLoadable.data : undefined;
  const currentAffiliate = findAffiliateForUser(
    portal?.affiliates || [],
    currentUser
  );
  const commission = getAffiliateCommissionPoints(currentAffiliate, portal);
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const expiryText = expiryDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const pointRemainder = commission.points % 1000;
  const pointProgress =
    commission.points > 0 && pointRemainder === 0
      ? 100
      : Math.min(100, Math.round(pointRemainder / 10));
  const nextMilestone = pointRemainder === 0 ? 0 : 1000 - pointRemainder;
  const stats = [
    {
      label: "Tỷ lệ hoa hồng",
      value: `${commission.commissionRate}%`,
      tone: "text-primary",
    },
    {
      label: "Doanh số tính điểm",
      value: formatPrice(commission.commissionBaseSales),
      tone: "text-emerald-700",
    },
    {
      label: "Hoa hồng tạm tính",
      value: formatPrice(commission.totalCommission),
      tone: "text-rose-700",
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px] text-primaryForeground p-4 bg-cover shadow-[0_18px_48px_rgba(0,204,247,0.28)]"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 204, 247, 0.94), rgba(20, 184, 166, 0.78)), url(${barcodeIllusLeft}), url(${barcodeIllusRight})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top left, bottom right",
        backgroundSize: "auto, auto",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="commerce-eyebrow text-slate-700/72">Ví điểm hoa hồng</div>
          <div className="mt-1 text-[28px] leading-8 font-black tracking-normal">
            {commission.points.toLocaleString("vi-VN")}
          </div>
          <div className="commerce-caption font-semibold text-slate-700/82">
            điểm quy đổi từ hoa hồng bán hàng
          </div>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/26 text-primaryForeground ring-1 ring-white/40 backdrop-blur-xl">
          <CommerceIcon name="wallet" size={24} strokeWidth={2} />
        </div>
      </div>

      <div className="mt-4 rounded-[22px] bg-white/14 p-3 ring-1 ring-white/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="commerce-caption font-bold text-slate-700/72">
              Tiến độ mốc thưởng
            </div>
            <div className="mt-0.5 commerce-caption text-slate-700/88">
              {nextMilestone === 0
                ? "Đã đạt mốc điểm mới"
                : `Còn ${nextMilestone.toLocaleString("vi-VN")} điểm đến mốc tiếp theo`}
            </div>
          </div>
          <div className="rounded-full bg-white px-3 py-1 commerce-caption font-black text-primaryForeground">
            {pointProgress}%
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/24">
          <div
            className="h-full rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]"
            style={{ width: `${pointProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] bg-white/90 px-3 py-2.5 text-left text-slate-900 shadow-sm backdrop-blur-xl"
          >
            <div className="text-[11px] leading-4 font-bold text-slate-500">
              {item.label}
            </div>
            <div className={`mt-0.5 text-sm leading-5 font-black truncate ${item.tone}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[22px] bg-white/92 p-3 text-slate-900 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <div className="commerce-eyebrow text-slate-400">
              {currentAffiliate ? "Mã hội viên đại lý" : "Kích hoạt tích điểm"}
            </div>
            <div className="commerce-caption text-subtitle">
              {currentAffiliate
                ? `Hiệu lực đến ${expiryText}`
                : "Đăng ký đại lý để bắt đầu tích điểm"}
            </div>
          </div>
          <div className="rounded-full bg-cyan-50 px-3 py-1 commerce-caption font-black text-primary">
            1.000đ = 1 điểm
          </div>
        </div>
        <div className="mt-3 flex justify-center overflow-hidden rounded-2xl bg-white px-2 py-2 ring-1 ring-slate-100">
          <Barcode />
        </div>
      </div>
    </div>
  );
}
