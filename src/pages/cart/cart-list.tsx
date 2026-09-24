import { useAtom, useAtomValue } from "jotai";
import { cartNoteState, cartState } from "@/state";
import CartItem from "./cart-item";
import Section from "@/components/section";
import HorizontalDivider from "@/components/horizontal-divider";
import CommerceIcon from "@/components/commerce-icon";

export default function CartList() {
  const cart = useAtomValue(cartState);
  const [note, setNote] = useAtom(cartNoteState);

  return (
    <Section
      title={
        <div className="flex items-start gap-2">
          <CommerceIcon
            name="calendar"
            size={20}
            className="mt-0.5 shrink-0 text-primary"
          />
          <div className="min-w-0">
            <div className="commerce-title">
              Thời gian nhận dự kiến
            </div>
            <div className="commerce-caption text-slate-500">
              Shop sẽ xác nhận khung giờ sau khi đặt hàng
            </div>
          </div>
        </div>
      }
      className="flex-1 overflow-y-auto"
    >
      <div className="w-full">
        {cart.map((item) => (
          <CartItem key={item.product.id} {...item} />
        ))}
      </div>
      <HorizontalDivider />
      <div className="flex items-center px-4 pt-3 pb-3 gap-3">
        <div className="commerce-title">Ghi chú</div>
        <input
          type="text"
          placeholder="Lưu ý cho shop"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="commerce-body text-right flex-1 focus:outline-none bg-transparent"
        />
      </div>
    </Section>
  );
}
