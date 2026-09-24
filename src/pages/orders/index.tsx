import { Tabs } from "zmp-ui";
import OrderList from "./order-list";
import { ordersState } from "@/state";
import { useNavigate, useParams } from "react-router-dom";
import { OrderStatus } from "@/types";

function OrdersPage() {
  const { status } = useParams();
  const navigate = useNavigate();
  const activeStatus = (
    ["pending", "shipping", "completed"].includes(status || "")
      ? status
      : "pending"
  ) as OrderStatus;

  return (
    <Tabs
      className="h-full flex flex-col"
      activeKey={activeStatus}
      onChange={(status) => navigate(`/orders/${status}`)}
    >
      <Tabs.Tab key="pending" label="Đang xử lý">
        <OrderList ordersState={ordersState("pending")} />
      </Tabs.Tab>
      <Tabs.Tab key="shipping" label="Đang giao">
        <OrderList ordersState={ordersState("shipping")} />
      </Tabs.Tab>
      <Tabs.Tab key="completed" label="Lịch sử">
        <OrderList ordersState={ordersState("completed")} />
      </Tabs.Tab>
    </Tabs>
  );
}

export default OrdersPage;
