import HorizontalDivider from "@/components/horizontal-divider";
import Section from "@/components/section";
import { Order } from "@/types";
import { formatPrice } from "@/utils/format";
import CollapsibleOrderItems from "./collapsible-order-items";
import { useNavigate } from "react-router-dom";

const orderStatusText = {
  pending: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
};

const paymentStatusText = {
  pending: "Chờ thanh toán",
  success: "Đã thanh toán",
  failed: "Thanh toán lỗi",
};

function formatOrderTime(value?: string) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function OrderSummary(props: { order: Order; full?: boolean }) {
  const navigate = useNavigate();
  return (
    <Section
      title={
        <div className="w-full flex flex-col gap-1 font-normal sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-xs text-inactive">
            Đặt lúc: {formatOrderTime(props.order.createdAt)}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-background px-2 py-1 text-3xs font-medium text-foreground">
              {orderStatusText[props.order.status]}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-3xs font-medium ${
                props.order.paymentStatus === "failed"
                  ? "bg-danger text-white"
                  : props.order.paymentStatus === "success"
                  ? "bg-primary text-primaryForeground"
                  : "bg-background text-foreground"
              }`}
            >
              {paymentStatusText[props.order.paymentStatus]}
            </span>
          </div>
        </div>
      }
      className="flex-1 overflow-y-auto rounded-lg"
      onClick={() => {
        if (!props.full) {
          navigate(`/order/${props.order.id}`, {
            state: props.order,
            viewTransition: true,
          });
        }
      }}
    >
      <div className="w-full">
        <CollapsibleOrderItems
          items={props.order.items}
          defaultExpanded={props.full}
        />
      </div>
      <HorizontalDivider />
      <div className="flex justify-between items-center px-4 py-2 space-x-4">
        <div className="text-xs">Tổng tiền hàng</div>
        <div className="text-sm font-medium">
          {formatPrice(props.order.total)}
        </div>
      </div>
    </Section>
  );
}

export default OrderSummary;
