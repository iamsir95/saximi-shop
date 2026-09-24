import { useAtomValue } from "jotai";
import Badge from "./badge";
import { cartState, cartTotalState } from "@/state";
import { formatPrice } from "@/utils/format";
import TransitionLink from "./transition-link";
import { useRouteHandle } from "@/hooks";
import CommerceIcon from "./commerce-icon";

function FloatingCartPreview() {
  const cart = useAtomValue(cartState);
  const { totalItems, totalAmount } = useAtomValue(cartTotalState);
  const [handle] = useRouteHandle();

  if (totalItems === 0 || handle?.noFloatingCart) {
    return <></>;
  }

  return (
    <TransitionLink
      to="/cart"
      className={`fixed left-4 right-4 ${
        handle?.noFooter ? "bottom-6" : "bottom-16"
      } mb-sb flex items-center space-x-2 text-left text-primaryForeground px-4 py-2 rounded-[22px] shadow-[0_18px_42px_rgba(0,204,247,0.28)]`}
      style={{
        background: "linear-gradient(135deg, rgba(0, 204, 247, 0.94), rgba(20, 184, 166, 0.74))",
        backdropFilter: "blur(22px) saturate(1.35)",
      }}
    >
      <Badge
        value={cart.length}
        style={{
          boxShadow: "none",
        }}
      >
        <CommerceIcon name="bag" size={22} strokeWidth={2} />
      </Badge>
      <span className="text-base font-medium flex-1">
        {formatPrice(totalAmount)}
      </span>
      <span className="text-sm">Đặt mua</span>
    </TransitionLink>
  );
}

export default FloatingCartPreview;
