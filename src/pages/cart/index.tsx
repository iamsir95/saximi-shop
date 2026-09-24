import CartList from "./cart-list";
import ApplyVoucher from "./apply-voucher";
import CartSummary from "./cart-summary";
import { useAtomValue } from "jotai";
import { cartState } from "@/state";
import { EmptyCart } from "@/components/empty";
import Delivery from "./delivery";
import HorizontalDivider from "@/components/horizontal-divider";
import Pay from "./pay";
import CommerceTrustStrip from "@/components/commerce-trust-strip";

export default function CartPage() {
  const cart = useAtomValue(cartState);

  if (!cart.length) {
    return <EmptyCart />;
  }
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 md:grid md:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] md:items-start md:gap-4 md:space-y-0">
        <div className="min-w-0 space-y-3">
          <Delivery />
          <CartList />
        </div>
        <div className="min-w-0 space-y-3 md:sticky md:top-4">
          <ApplyVoucher />
          <CartSummary />
          <CommerceTrustStrip />
        </div>
      </div>
      <HorizontalDivider />
      <Pay />
    </div>
  );
}
