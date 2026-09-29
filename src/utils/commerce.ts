import type { CartItem, Product, ProductGiftProgram } from "@/types";

export type ProductFilterKey = "all" | "discount" | "low-stock";
export type ProductSortKey = "featured" | "price-asc" | "price-desc" | "discount";

export function hasMemberPrice(product: Product) {
  return Boolean(product.originalPrice) && product.originalPrice! > product.price;
}

export function getRegularPrice(product: Product) {
  return hasMemberPrice(product) ? product.originalPrice! : product.price;
}

export function getDisplayPrice(product: Product, canUseMemberPricing: boolean) {
  return canUseMemberPricing && hasMemberPrice(product)
    ? product.price
    : getRegularPrice(product);
}

export function getPurchasableProduct(
  product: Product,
  canUseMemberPricing: boolean
): Product {
  if (canUseMemberPricing || !hasMemberPrice(product)) {
    return product;
  }

  return {
    ...product,
    price: getRegularPrice(product),
    originalPrice: undefined,
  };
}

export function isGiftProgramActive(program: ProductGiftProgram, now = new Date()) {
  if (!program.isActive) return false;
  if (program.startsAt && new Date(program.startsAt) > now) return false;
  if (program.endsAt && new Date(program.endsAt) < now) return false;
  return true;
}

export function getEligibleGiftItems(
  cart: CartItem[],
  products: Product[]
): CartItem[] {
  const now = new Date();

  return cart.reduce<CartItem[]>((giftItems, item) => {
    if (item.isGift || !item.product.giftPrograms?.length) {
      return giftItems;
    }

    const quantity = Math.max(1, Number(item.quantity || 1));
    item.product.giftPrograms
      .filter((program) => isGiftProgramActive(program, now))
      .forEach((program) => {
        const minQuantity = Math.max(1, Number(program.minQuantity || 1));
        const giftQuantity = Math.max(1, Number(program.giftQuantity || 1));
        const multiplier = Math.floor(quantity / minQuantity);

        if (multiplier <= 0) return;

        const giftProduct = products.find(
          (product) => product.id === Number(program.giftProductId)
        );
        if (!giftProduct) return;

        giftItems.push({
          product: {
            ...giftProduct,
            name: `${giftProduct.name} (Quà tặng)`,
            price: 0,
            originalPrice: giftProduct.originalPrice || giftProduct.price,
          },
          quantity: multiplier * giftQuantity,
          isGift: true,
          giftProgramId: program.id,
          giftForProductId: item.product.id,
          giftProgramTitle: program.title,
        });
      });

    return giftItems;
  }, []);
}

export function getDiscountPercent(
  product: Product,
  canUseMemberPricing = true
) {
  if (!canUseMemberPricing) {
    return 0;
  }

  if (!product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }

  return 100 - Math.round((product.price * 100) / product.originalPrice);
}

export function getSavedAmount(product: Product, canUseMemberPricing = true) {
  if (!canUseMemberPricing) {
    return 0;
  }

  if (!product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }

  return product.originalPrice - product.price;
}

export function isLowStock(product: Product) {
  if (typeof product.stockQuantity !== "number") {
    return false;
  }

  return product.stockQuantity <= (product.minStockLevel ?? 15);
}

export function formatCompactQuantity(value?: number) {
  const quantity = Math.max(0, Number(value || 0));
  const format = (base: number, suffix: string) => {
    const compact = quantity / base;
    const rounded = compact >= 10 ? Math.round(compact) : Math.round(compact * 10) / 10;
    return `${rounded}${suffix}`;
  };

  if (quantity >= 1_000_000) return format(1_000_000, "m");
  if (quantity >= 1_000) return format(1_000, "k");

  return quantity.toLocaleString("vi-VN");
}

export function getStockLabel(product: Product) {
  if (typeof product.stockQuantity !== "number") {
    return "Còn 0";
  }

  if (product.stockQuantity <= 0) {
    return "Tạm hết";
  }

  return `Còn ${formatCompactQuantity(product.stockQuantity)}`;
}

export function getSoldLabel(product: Product) {
  return `Đã bán ${formatCompactQuantity(product.soldQuantity)}`;
}

export function filterProducts(
  products: Product[],
  filter: ProductFilterKey,
  canUseMemberPricing = true
) {
  if (filter === "discount") {
    return canUseMemberPricing
      ? products.filter((product) => getDiscountPercent(product) > 0)
      : [];
  }

  if (filter === "low-stock") {
    return products.filter(isLowStock);
  }

  return products;
}

export function sortProducts(
  products: Product[],
  sort: ProductSortKey,
  canUseMemberPricing = true
) {
  const items = [...products];

  if (sort === "price-asc") {
    return items.sort(
      (a, b) =>
        getDisplayPrice(a, canUseMemberPricing) -
        getDisplayPrice(b, canUseMemberPricing)
    );
  }

  if (sort === "price-desc") {
    return items.sort(
      (a, b) =>
        getDisplayPrice(b, canUseMemberPricing) -
        getDisplayPrice(a, canUseMemberPricing)
    );
  }

  if (sort === "discount" && canUseMemberPricing) {
    return items.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
  }

  return items;
}

export function getCommerceSummary(
  products: Product[],
  canUseMemberPricing = true
) {
  const discountedProducts = products.filter(
    (product) => getDiscountPercent(product, canUseMemberPricing) > 0
  );
  const lowStockProducts = products.filter(isLowStock);
  const biggestDeal = discountedProducts.reduce(
    (best, product) =>
      getDiscountPercent(product, canUseMemberPricing) >
      getDiscountPercent(best, canUseMemberPricing)
        ? product
        : best,
    discountedProducts[0]
  );

  return {
    totalProducts: products.length,
    discountedCount: discountedProducts.length,
    lowStockCount: lowStockProducts.length,
    biggestDealPercent: biggestDeal
      ? getDiscountPercent(biggestDeal, canUseMemberPricing)
      : 0,
  };
}
