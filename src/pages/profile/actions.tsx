import CommerceIcon, { CommerceIconName } from "@/components/commerce-icon";
import { OrderStatus } from "@/types";
import { useNavigate } from "react-router-dom";

const PROFILE_ACTIONS: {
  label: string;
  icon: CommerceIconName;
  status: OrderStatus;
}[] = [
  {
    label: "Đang xử lý",
    icon: "ticket",
    status: "pending",
  },
  {
    label: "Đang giao",
    icon: "delivery",
    status: "shipping",
  },
  {
    label: "Lịch sử",
    icon: "receipt",
    status: "completed",
  },
];

export default function ProfileActions() {
  const navigate = useNavigate();
  const goToOrders = (status: OrderStatus) => {
    navigate(`/orders/${status}`);
  };

  return (
    <div className="liquid-card rounded-[24px] p-4 grid grid-cols-3 gap-3">
      {PROFILE_ACTIONS.map((action) => (
        <div
          key={action.label}
          className="flex flex-col gap-2.5 items-center cursor-pointer rounded-2xl px-2 py-1.5 active:scale-[0.98]"
          onClick={() => goToOrders(action.status)}
        >
          <div className="w-11 h-11 rounded-full liquid-button flex items-center justify-center">
            <CommerceIcon name={action.icon} size={21} className="text-primary" />
          </div>
          <div className="commerce-caption font-semibold text-center text-slate-700">
            {action.label}
          </div>
        </div>
      ))}
    </div>
  );
}
