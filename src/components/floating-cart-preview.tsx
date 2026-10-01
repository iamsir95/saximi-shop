import { useAtomValue } from "jotai";
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
      className={`floating-cart-preview ${
        handle?.noFooter
          ? "floating-cart-preview--no-footer"
          : "floating-cart-preview--with-footer"
      }`}
    >
      <div className="floating-cart-preview__icon">
        <span className="floating-cart-preview__badge">
          {cart.length > 9 ? "9+" : cart.length}
        </span>
        <CommerceIcon name="bag" size={22} strokeWidth={2} />
      </div>
      <span className="floating-cart-preview__amount">
        {formatPrice(totalAmount)}
      </span>
      <span className="floating-cart-preview__action">Đặt mua</span>
    </TransitionLink>
  );
}

export default FloatingCartPreview;
