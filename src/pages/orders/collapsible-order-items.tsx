import { CartItem } from "@/types";
import OrderItem from "./order-item";
import { useState } from "react";
import { List } from "zmp-ui";
import CommerceIcon from "@/components/commerce-icon";

function CollapsibleOrderItems(props: {
  items: CartItem[];
  defaultExpanded?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(
    props.defaultExpanded ? false : true
  );
  const displayItems = collapsed ? props.items.slice(0, 1) : props.items;

  return (
    <>
      <List noSpacing>
        {displayItems.map((item) => (
          <OrderItem key={item.product.id} {...item} />
        ))}
      </List>
      {displayItems.length < props.items.length && (
        <button
          className="w-full flex justify-center items-center space-x-1 text-xs p-2 -mt-4 transition-all relative"
          onClick={(e) => {
            e.stopPropagation();
            document.startViewTransition(() => {
              setCollapsed(false);
            });
          }}
        >
          <span>Xem thêm</span>
          <CommerceIcon name="chevron-down" size={16} />
        </button>
      )}
    </>
  );
}

export default CollapsibleOrderItems;
