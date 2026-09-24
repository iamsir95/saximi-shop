import CommerceTrustStrip from "@/components/commerce-trust-strip";
import { couponsState, productsState } from "@/state";
import { getCommerceSummary } from "@/utils/commerce";
import { useAtomValue } from "jotai";

export default function CommerceHighlights() {
  const products = useAtomValue(productsState);
  const coupons = useAtomValue(couponsState);
  const summary = getCommerceSummary(products);
  const bestCoupon = coupons
    .filter((coupon) => coupon.isActive)
    .sort((a, b) => b.discountPercent - a.discountPercent)[0];

  return (
    <div className="space-y-2">
      <div className="liquid-card rounded-[24px] p-4">
        <div className="text-[11px] font-bold uppercase text-primary">
          Trung tâm ưu đãi
        </div>
        <div className="mt-1 text-xl font-black leading-6 text-slate-900">
          Mua nhanh, nhận rõ trạng thái, thanh toán linh hoạt
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/62 p-2">
            <div className="text-lg font-black text-slate-900">
              {summary.discountedCount}
            </div>
            <div className="text-[10px] text-subtitle">đang giảm</div>
          </div>
          <div className="rounded-2xl bg-white/62 p-2">
            <div className="text-lg font-black text-danger">
              -{summary.biggestDealPercent}%
            </div>
            <div className="text-[10px] text-subtitle">giảm mạnh</div>
          </div>
          <div className="rounded-2xl bg-white/62 p-2">
            <div className="text-lg font-black text-slate-900">
              {bestCoupon ? bestCoupon.code : "COD"}
            </div>
            <div className="text-[10px] text-subtitle">
              {bestCoupon ? `voucher ${bestCoupon.discountPercent}%` : "thanh toán"}
            </div>
          </div>
        </div>
      </div>
      <CommerceTrustStrip />
    </div>
  );
}
