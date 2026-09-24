import Section from "@/components/section";
import { couponsState, selectedCouponState } from "@/state";
import { formatPrice } from "@/utils/format";
import { useAtom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useMemo, useState } from "react";
import { Sheet } from "zmp-ui";
import CommerceIcon from "@/components/commerce-icon";

export default function ApplyVoucher() {
  const [selectedCoupon, setSelectedCoupon] = useAtom(selectedCouponState);
  const couponsLoadable = useAtomValue(
    useMemo(() => loadable(couponsState), [])
  );
  const [visible, setVisible] = useState(false);
  const coupons =
    couponsLoadable.state === "hasData" ? couponsLoadable.data : [];

  return (
    <Section title="Ưu đãi đơn hàng">
      <button
        className="w-full flex justify-between items-center py-3 px-4 gap-3 cursor-pointer"
        onClick={() => setVisible(true)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CommerceIcon name="ticket" size={20} className="text-primary" />
          <div className="text-sm flex-1 truncate font-semibold text-slate-800">
            {selectedCoupon ? selectedCoupon.code : "Chọn voucher"}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="text-sm font-bold text-primary">
            {selectedCoupon ? `Giảm ${selectedCoupon.discountPercent}%` : "Chọn"}
          </div>
          <CommerceIcon name="chevron-right" size={18} className="text-slate-400" />
        </div>
      </button>
      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        autoHeight
        handler
        swipeToClose
        unmountOnClose
      >
        <div className="px-4 pb-8 pt-2 space-y-3">
          <div className="text-center pb-2">
            <div className="text-base font-black text-slate-900">Ưu đãi đơn hàng</div>
            <div className="text-xs text-inactive">
              Chọn voucher đang còn hiệu lực cho đơn hàng
            </div>
          </div>

          {couponsLoadable.state === "loading" ? (
            <div className="py-8 text-center text-sm text-inactive">
              Đang tải voucher...
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-8 text-center text-sm text-inactive">
              Hiện chưa có voucher khả dụng
            </div>
          ) : (
            coupons.map((coupon) => (
              <button
                key={coupon.id}
                className="w-full rounded-[20px] border border-white/80 bg-white/76 p-4 text-left active:scale-[0.99]"
                onClick={() => {
                  setSelectedCoupon(coupon);
                  setVisible(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{coupon.code}</span>
                  <span className="text-sm font-semibold">
                    Giảm {coupon.discountPercent}%
                  </span>
                </div>
                <div className="mt-1 text-xs leading-4 text-inactive">
                  Đơn tối thiểu {formatPrice(coupon.minOrderAmount)} · HSD{" "}
                  {coupon.expiryDate}
                </div>
              </button>
            ))
          )}

          {selectedCoupon && (
            <button
              className="w-full rounded-[18px] bg-skeleton py-3 text-sm font-bold"
              onClick={() => {
                setSelectedCoupon(undefined);
                setVisible(false);
              }}
            >
              Bỏ áp dụng voucher
            </button>
          )}
        </div>
      </Sheet>
    </Section>
  );
}
