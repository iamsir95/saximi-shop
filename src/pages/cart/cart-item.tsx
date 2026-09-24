import { useAddToCart } from "@/hooks";
import { CartItem as CartItemProps } from "@/types";
import { formatPrice } from "@/utils/format";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import type { PointerEvent } from "react";
import CommerceIcon from "@/components/commerce-icon";

const SWIPE_TO_DELETE_OFFSET = 88;

export default function CartItem(props: CartItemProps) {
  const { addToCart } = useAddToCart(props.product);
  const hasDiscount =
    Boolean(props.product.originalPrice) &&
    props.product.originalPrice! > props.product.price;

  // swipe left to delete animation
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const bind = useDrag(
    ({ last, offset: [ox] }) => {
      if (last) {
        if (ox < -SWIPE_TO_DELETE_OFFSET) {
          api.start({ x: -SWIPE_TO_DELETE_OFFSET });
        } else {
          api.start({ x: 0 });
        }
      } else {
        api.start({ x: Math.min(ox, 0), immediate: true });
      }
    },
    {
      from: () => [x.get(), 0],
      axis: "x",
      bounds: { left: -100, right: 0, top: 0, bottom: 0 },
      rubberband: true,
      preventScroll: true,
    }
  );
  const decreaseQuantity = () => addToCart(Math.max(0, props.quantity - 1));
  const increaseQuantity = () => addToCart(props.quantity + 1);
  const removeItem = () => addToCart(0);
  const stopControlDrag = (event: PointerEvent) => event.stopPropagation();

  return (
    <div className="relative overflow-hidden border-b border-slate-100 last:border-b-0">
      <div className="absolute right-0 top-0 bottom-0 z-0 w-[88px] py-px">
        <div
          className="bg-danger text-white/95 w-full h-full flex flex-col gap-1 justify-center items-center cursor-pointer"
          onClick={removeItem}
        >
          <CommerceIcon name="trash" size={21} />
          <div className="commerce-caption font-semibold">Xoá</div>
        </div>
      </div>

      <animated.div
        {...bind()}
        style={{ x }}
        className="relative z-10 bg-white p-4 flex items-center gap-3 shadow-[0_1px_0_rgba(226,232,240,0.55)]"
      >
        <img
          src={props.product.image}
          className="w-16 h-16 rounded-[18px] object-cover bg-skeleton"
          alt={props.product.name}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="commerce-body font-semibold line-clamp-2 text-slate-800">
            {props.product.name}
          </div>
          <div className="flex flex-col">
            <div className="text-base font-black leading-5 text-primary">
              {formatPrice(props.product.price)}
            </div>
            {hasDiscount && (
              <div className="line-through text-subtitle text-4xs">
                {formatPrice(props.product.originalPrice)}
              </div>
            )}
          </div>
        </div>
        <div
          className="shrink-0 flex flex-col items-end gap-2"
          onPointerDown={stopControlDrag}
        >
          <button
            type="button"
            onClick={removeItem}
            className="flex h-8 w-8 items-center justify-center rounded-2xl bg-rose-50 text-danger ring-1 ring-rose-100 active:scale-95"
            aria-label={`Xoá ${props.product.name} khỏi giỏ hàng`}
          >
            <CommerceIcon name="trash" size={17} />
          </button>
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 ring-1 ring-slate-200">
            <button
              type="button"
              onClick={decreaseQuantity}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 active:scale-95"
              aria-label={`Giảm số lượng ${props.product.name}`}
            >
              <CommerceIcon name="minus" size={14} strokeWidth={2.4} />
            </button>
            <div className="min-w-7 px-1 text-center commerce-caption font-black text-slate-800">
              {props.quantity}
            </div>
            <button
              type="button"
              onClick={increaseQuantity}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white active:scale-95"
              aria-label={`Tăng số lượng ${props.product.name}`}
            >
              <CommerceIcon name="plus" size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </animated.div>
    </div>
  );
}
