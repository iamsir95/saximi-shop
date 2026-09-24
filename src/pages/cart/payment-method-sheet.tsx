import React from "react";
import { Sheet, Button } from "zmp-ui";
import CommerceIcon, { CommerceIconName } from "@/components/commerce-icon";
import type { PaymentMethod } from "@/types";

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
    color: "#0068FF",
    bgColor: "#EBF3FF",
  },
  {
    method: "VIETQR",
    icon: "qr",
    label: "Chuyển khoản VietQR",
    sublabel: "Quét mã QR bằng ứng dụng ngân hàng",
    color: "#009B77",
    bgColor: "#E8F5EC",
  },
  {
    method: "COD",
    icon: "delivery",
    label: "Thanh toán khi nhận hàng",
    sublabel: "Thanh toán tiền mặt khi nhận đơn",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
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
  const [selected, setSelected] = React.useState<PaymentMethod>("ZALOPAY");

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
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.method}
              onClick={() => setSelected(opt.method)}
              className={`w-full flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.99] ${
                selected === opt.method
                  ? "border-blue-500 shadow-md"
                  : "border-slate-100 bg-white"
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
                    <span
                      className="text-[11px] leading-4 font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: opt.color }}
                    >
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
                  selected === opt.method ? "border-blue-500" : "border-slate-300"
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
          style={{ background: "linear-gradient(135deg, #00ccf7 0%, #14b8a6 100%)" }}
        >
          {loading ? "Đang xử lý..." : `Đặt hàng • ${formatPrice(totalAmount)}`}
        </Button>

        <p className="commerce-caption text-slate-400 text-center mt-3">
          Giao dịch được bảo mật qua ZaloPay, VietQR và quy trình xác nhận đơn hàng.
        </p>
      </div>
    </Sheet>
  );
};

export default PaymentMethodSheet;
