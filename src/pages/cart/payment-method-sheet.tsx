import React from "react";
import { Sheet, Button } from "zmp-ui";
import CommerceIcon, { CommerceIconName } from "@/components/commerce-icon";
import type { PaymentMethod } from "@/types";
import { isZaloMiniAppRuntime } from "@/utils/platform";

interface PaymentMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  totalAmount: number;
  loading: boolean;
}

const PAYMENT_OPTIONS: {
  method: PaymentMethod;
  icon: CommerceIconName;
  label: string;
  sublabel: string;
  badge?: string;
  color: string;
  bgColor: string;
}[] = [
  {
    method: "ZALOPAY",
    icon: "wallet",
    label: "ZaloPay",
    sublabel: "Thanh toán nhanh qua ví ZaloPay",
    badge: "Khuyên dùng",
    color: "#008fb3",
    bgColor: "rgba(0, 204, 247, 0.12)",
  },
  {
    method: "VIETQR",
    icon: "qr",
    label: "Chuyển khoản VietQR",
    sublabel: "Quét mã QR bằng ứng dụng ngân hàng",
    color: "#96354f",
    bgColor: "rgba(239, 106, 140, 0.12)",
  },
  {
    method: "COD",
    icon: "delivery",
    label: "Thanh toán khi nhận hàng",
    sublabel: "Thanh toán tiền mặt khi nhận đơn",
    color: "#008fb3",
    bgColor: "rgba(0, 204, 247, 0.12)",
  },
];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const PaymentMethodSheet: React.FC<PaymentMethodSheetProps> = ({
  visible,
  onClose,
  onSelect,
  totalAmount,
  loading,
}) => {
  const isZaloMiniApp = isZaloMiniAppRuntime();
  const paymentOptions = React.useMemo(
    () =>
      PAYMENT_OPTIONS.filter(
        (option) => option.method !== "ZALOPAY" || isZaloMiniApp
      ),
    [isZaloMiniApp]
  );
  const defaultPaymentMethod = isZaloMiniApp ? "ZALOPAY" : "VIETQR";
  const [selected, setSelected] = React.useState<PaymentMethod>(defaultPaymentMethod);

  React.useEffect(() => {
    if (!paymentOptions.some((option) => option.method === selected)) {
      setSelected(defaultPaymentMethod);
    }
  }, [defaultPaymentMethod, paymentOptions, selected]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose as any}
      autoHeight
      handler
      swipeToClose
      unmountOnClose
    >
      <div className="px-4 pb-8 pt-2">
        {/* Header */}
        <div className="text-center mb-5">
          <p className="commerce-eyebrow text-slate-400 mb-1">
            Thanh toán đơn hàng
          </p>
          <p className="text-2xl font-black text-primary">{formatPrice(totalAmount)}</p>
        </div>

        {/* Phương thức thanh toán */}
        <p className="commerce-eyebrow text-slate-500 mb-3">
          Phương thức thanh toán
        </p>

        <div className="space-y-3 mb-5">
          {paymentOptions.map((opt) => (
            <button
              key={opt.method}
              onClick={() => setSelected(opt.method)}
              className={`w-full flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.99] ${
                selected === opt.method
                  ? "border-primary shadow-md bg-white/72"
                  : "border-white/80 bg-white/58"
              }`}
              style={{
                backgroundColor: selected === opt.method ? opt.bgColor : undefined,
                borderColor: selected === opt.method ? opt.color : undefined,
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: opt.bgColor }}
              >
                <CommerceIcon name={opt.icon} size={22} style={{ color: opt.color }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="commerce-title">
                    {opt.label}
                  </span>
                  {opt.badge && (
                    <span className="commerce-tag commerce-tag--promo !min-h-0 !px-2 !py-0.5">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="commerce-caption text-slate-500 mt-0.5">
                  {opt.sublabel}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected === opt.method ? "border-primary" : "border-slate-300"
                }`}
                style={{
                  borderColor: selected === opt.method ? opt.color : undefined,
                }}
              >
                {selected === opt.method && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <Button
          fullWidth
          loading={loading}
          onClick={() => onSelect(selected)}
          className="!rounded-[20px] !font-bold !text-base !min-h-12 !text-primaryForeground"
          style={{ background: "var(--brand-gradient)" }}
        >
          {loading ? "Đang xử lý..." : `Đặt hàng • ${formatPrice(totalAmount)}`}
        </Button>

        <p className="commerce-caption text-slate-400 text-center mt-3">
          Giao dịch được bảo mật qua {isZaloMiniApp ? "ZaloPay, " : ""}VietQR
          và quy trình xác nhận đơn hàng.
        </p>
      </div>
    </Sheet>
  );
};

export default PaymentMethodSheet;
