import { Order } from "@/types";
import { List } from "zmp-ui";
import DeliverySummary from "../cart/delivery-summary";
import CommerceIcon from "@/components/commerce-icon";

function OrderInfo(props: { order: Order }) {
  return (
    <List noSpacing className="bg-section rounded-lg">
      {props.order.delivery.type === "pickup" ? (
        <DeliverySummary
          icon={<CommerceIcon name="home" size={24} className="text-primary" />}
          title="Tự đến lấy"
          subtitle={props.order.delivery.name || "Điểm nhận hàng"}
          description={props.order.delivery.address}
        />
      ) : (
        <DeliverySummary
          icon={<CommerceIcon name="map-pin" size={24} className="text-primary" />}
          title="Giao đến"
          subtitle={props.order.delivery.name || props.order.delivery.alias}
          description={props.order.delivery.address}
        />
      )}
      {props.order.note && (
        <List.Item prefix={<CommerceIcon name="note" size={20} />} title="Ghi chú">
          <span className="text-xs text-inactive">{props.order.note}</span>
        </List.Item>
      )}
    </List>
  );
}

export default OrderInfo;
