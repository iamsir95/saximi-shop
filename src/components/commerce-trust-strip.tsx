import CommerceIcon, { CommerceIconName } from "./commerce-icon";

const TRUST_ITEMS = [
  {
    icon: "shield",
    title: "Đổi trả 7 ngày",
    detail: "Yên tâm khi nhận hàng",
  },
  {
    icon: "credit-card",
    title: "Thanh toán an toàn",
    detail: "COD, VietQR, ZaloPay",
  },
  {
    icon: "delivery",
    title: "Theo dõi đơn hàng",
    detail: "Cập nhật vận chuyển tự động",
  },
] satisfies { icon: CommerceIconName; title: string; detail: string }[];

export default function CommerceTrustStrip() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TRUST_ITEMS.map((item) => (
        <div
          key={item.title}
          className="liquid-card rounded-[18px] px-2.5 py-3 text-center"
        >
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CommerceIcon name={item.icon} size={17} />
          </div>
          <div className="text-[11px] font-bold leading-4 text-slate-800">
            {item.title}
          </div>
          <div className="mt-1 text-[10px] leading-3 text-subtitle">
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  );
}
