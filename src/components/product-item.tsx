import { Product } from "@/types";
import { formatPrice } from "@/utils/format";
import TransitionLink from "./transition-link";
import { useState } from "react";
import { Button } from "zmp-ui";
import { useAddToCart } from "@/hooks";
import QuantityInput from "./quantity-input";
import { getDiscountPercent, getStockLabel, isLowStock } from "@/utils/commerce";
import CommerceIcon from "./commerce-icon";

export interface ProductItemProps {
  product: Product;
  /**
   * Whether to replace the current page when user clicks on this product item. Default behavior is to push a new page to the history stack.
   * This prop should be used when navigating to a new product detail from a current product detail page (related products, etc.)
   */
  replace?: boolean;
}

export default function ProductItem(props: ProductItemProps) {
  const [selected, setSelected] = useState(false);
  const { addToCart, cartQuantity } = useAddToCart(props.product);
  const hasDiscount =
    Boolean(props.product.originalPrice) &&
    props.product.originalPrice! > props.product.price;
  const discountPercent = getDiscountPercent(props.product);
  const lowStock = isLowStock(props.product);
  const stockLabel = getStockLabel(props.product);

  return (
    <div
      className="flex flex-col cursor-pointer group liquid-card commerce-card transition-transform active:scale-[0.99]"
      onClick={() => setSelected(true)}
    >
      <TransitionLink
        to={`/product/${props.product.id}`}
        replace={props.replace}
        className="relative block p-2.5 pb-0"
      >
        {({ isTransitioning }) => (
          <>
            <img
              src={props.product.image}
              className="w-full aspect-square object-cover rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              style={{
                viewTransitionName:
                  isTransitioning && selected // only animate the "clicked" product item in related products list
                    ? `product-image-${props.product.id}`
                    : undefined,
              }}
              alt={props.product.name}
            />
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] flex-wrap gap-1">
              {hasDiscount && (
                <span className="rounded-full bg-danger px-2 py-1 text-[11px] leading-4 font-bold text-white shadow-sm">
                  -{discountPercent}%
                </span>
              )}
              <span
                className={
                  "rounded-full px-2 py-1 text-[11px] leading-4 font-bold shadow-sm ".concat(
                    lowStock
                      ? "bg-amber-100 text-amber-700"
                      : "bg-white/80 text-slate-700"
                  )
                }
              >
                {stockLabel}
              </span>
            </div>
            <div className="pt-3 pb-1.5">
              <div className="pb-1">
                <div className="text-sm leading-5 min-h-10 line-clamp-2 font-semibold text-slate-800">
                  {props.product.name}
                </div>
              </div>
              <div className="mt-1 text-base font-black text-primary truncate">
                {formatPrice(props.product.price)}
              </div>
              {hasDiscount && (
                <div className="commerce-caption space-x-1 truncate">
                  <span className="text-subtitle line-through">
                    {formatPrice(props.product.originalPrice)}
                  </span>
                  <span className="text-danger">-{discountPercent}%</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between gap-2 commerce-caption text-slate-500">
                <span className="truncate">{props.product.category?.name}</span>
                <span className="flex-none font-semibold text-emerald-600">
                  Sẵn hàng
                </span>
              </div>
            </div>
          </>
        )}
      </TransitionLink>
      <div className="p-2.5 pt-1.5">
        {cartQuantity === 0 ? (
          <Button
            variant="secondary"
            size="small"
            fullWidth
            className="!rounded-2xl !font-bold !min-h-10"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(1, {
                toast: true,
              });
            }}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary"
                aria-hidden="true"
              >
                <CommerceIcon name="plus" size={15} strokeWidth={2.4} />
              </span>
              Thêm giỏ
            </span>
          </Button>
        ) : (
          <QuantityInput value={cartQuantity} onChange={addToCart} />
        )}
      </div>
    </div>
  );
}
