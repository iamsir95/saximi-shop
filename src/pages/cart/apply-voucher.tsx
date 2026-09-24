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
  const availableCoupons = coupons.filter((coupon) => coupon.isActive);

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
        height="min(74vh, 620px)"
        handler
        swipeToClose
        unmountOnClose
        modalClassName="voucher-sheet"
        zIndex={1200}
      >
        <div className="flex h-full min-h-0 flex-col px-4 pb-[calc(20px+var(--safe-bottom))] pt-2">
          <div className="shrink-0 border-b border-white/60 pb-3 text-center">
            <div className="text-base font-black text-slate-900">
              Ưu đãi đơn hàng
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              Chọn voucher đang còn hiệu lực cho đơn hàng
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-3 pr-1">
            {couponsLoadable.state === "loading" ? (
              <div className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-sm font-semibold text-slate-500 ring-1 ring-white/80">
                Đang tải voucher...
              </div>
            ) : availableCoupons.length === 0 ? (
              <div className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-sm font-semibold text-slate-500 ring-1 ring-white/80">
                Hiện chưa có voucher khả dụng
              </div>
            ) : (
              <div className="space-y-3">
                {availableCoupons.map((coupon) => {
                  const isSelected = selectedCoupon?.id === coupon.id;

                  return (
                    <button
                      key={coupon.id}
                      className={[
                        "w-full rounded-[20px] border p-4 text-left transition active:scale-[0.99]",
                        isSelected
                          ? "border-primary/70 bg-cyan-50/90 shadow-lg shadow-cyan-500/10"
                          : "border-white/80 bg-white/[0.78] shadow-sm shadow-slate-200/60",
                      ].join(" ")}
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setVisible(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <CommerceIcon name="ticket" size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <span className="break-words text-sm font-black text-slate-900">
                              {coupon.code}
                            </span>
                            <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-black text-primaryForeground">
                              -{coupon.discountPercent}%
                            </span>
                          </div>
                          <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            Đơn tối thiểu {formatPrice(coupon.minOrderAmount)}
                          </div>
                          <div className="text-xs font-semibold leading-5 text-slate-500">
                            Hạn sử dụng: {coupon.expiryDate}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedCoupon && (
            <div className="shrink-0 border-t border-white/60 pt-3">
              <button
                className="w-full rounded-[18px] bg-white/[0.76] py-3 text-sm font-black text-slate-700 ring-1 ring-white/80 active:scale-[0.99]"
                onClick={() => {
                  setSelectedCoupon(undefined);
                  setVisible(false);
                }}
              >
                Bỏ áp dụng voucher
              </button>
            </div>
          )}
        </div>
      </Sheet>
    </Section>
  );
}
