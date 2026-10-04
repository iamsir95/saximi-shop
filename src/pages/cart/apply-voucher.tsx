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
        className="w-full px-4 py-3 text-left cursor-pointer"
        onClick={() => setVisible(true)}
      >
        {selectedCoupon ? (
          <div className="rounded-[22px] border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primaryForeground shadow-sm">
                <CommerceIcon name="ticket" size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words text-sm font-black text-slate-900">
                    {selectedCoupon.code}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-black text-white">
                    Giảm {selectedCoupon.discountPercent}%
                  </span>
                </div>
                <div className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Đơn tối thiểu {formatPrice(selectedCoupon.minOrderAmount)}
                </div>
                <div className="text-xs font-semibold leading-5 text-slate-600">
                  Hạn sử dụng: {selectedCoupon.expiryDate}
                </div>
              </div>
              <CommerceIcon
                name="chevron-right"
                size={18}
                className="mt-2 shrink-0 text-slate-400"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CommerceIcon name="ticket" size={20} className="text-primary" />
              <div className="text-sm font-semibold text-slate-800">
                Chọn mã ưu đãi
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="text-sm font-bold text-primary">Chọn</div>
              <CommerceIcon
                name="chevron-right"
                size={18}
                className="text-slate-400"
              />
            </div>
          </div>
        )}
      </button>
      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        height="calc(100dvh - 12px)"
        handler
        swipeToClose
        unmountOnClose
        modalClassName="voucher-sheet"
        zIndex={1200}
      >
        <div className="flex h-full min-h-0 flex-col px-4 pb-[calc(20px+var(--safe-bottom))] pt-3 md:px-6">
          <div className="shrink-0 border-b border-white/60 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-slate-900">
                  Mã ưu đãi đơn hàng
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">
                  Chọn mã đang còn hiệu lực cho đơn hàng
                </div>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl font-black text-slate-500 ring-1 ring-white/80"
                aria-label="Đóng chọn mã ưu đãi"
                onClick={() => setVisible(false)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1">
            {couponsLoadable.state === "loading" ? (
              <div className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-sm font-semibold text-slate-500 ring-1 ring-white/80">
                Đang tải mã ưu đãi...
              </div>
            ) : availableCoupons.length === 0 ? (
              <div className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-sm font-semibold text-slate-500 ring-1 ring-white/80">
                Hiện chưa có mã ưu đãi phù hợp
              </div>
            ) : (
              <div className="space-y-3">
                {availableCoupons.map((coupon) => {
                  const isSelected = selectedCoupon?.id === coupon.id;

                  return (
                    <button
                      key={coupon.id}
                      className={[
                        "w-full rounded-[22px] border p-4 text-left transition active:scale-[0.99]",
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
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <CommerceIcon name="ticket" size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words text-base font-black text-slate-900">
                              {coupon.code}
                            </span>
                            <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primaryForeground">
                              Giảm {coupon.discountPercent}%
                            </span>
                            {isSelected && (
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-white">
                                Đang áp dụng
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            Đơn tối thiểu {formatPrice(coupon.minOrderAmount)}
                          </div>
                          <div className="text-sm font-semibold leading-6 text-slate-600">
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
                Bỏ mã ưu đãi
              </button>
            </div>
          )}
        </div>
      </Sheet>
    </Section>
  );
}
