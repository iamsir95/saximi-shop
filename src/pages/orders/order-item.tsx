import { CartItem } from "@/types";
import { formatPrice } from "@/utils/format";
import { List } from "zmp-ui";

function OrderItem(props: CartItem) {
  const hasDiscount =
    !props.isGift &&
    Boolean(props.product.originalPrice) &&
    props.product.originalPrice! > props.product.price;

  return (
    <List.Item
      prefix={
        <img src={props.product.image} className="w-14 h-14 rounded-lg" />
      }
      suffix={
        <div className="text-sm font-medium flex items-center h-full">
          x{props.quantity}
        </div>
      }
    >
      <div className="text-sm">{props.product.name}</div>
      {props.isGift && (
        <div className="mt-1 inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-primary">
          Quà tặng kèm
        </div>
      )}
      <div className="text-sm font-bold mt-1">
        {props.isGift ? "0 VND" : formatPrice(props.product.price)}
      </div>
      {hasDiscount && (
        <div className="line-through text-subtitle text-4xs">
          {formatPrice(props.product.originalPrice)}
        </div>
      )}
    </List.Item>
  );
}

export default OrderItem;
