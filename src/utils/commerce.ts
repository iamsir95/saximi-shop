import type { Product } from "@/types";

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

export function getStockLabel(product: Product) {
  if (typeof product.stockQuantity !== "number") {
    return "Sẵn hàng";
  }

  if (product.stockQuantity <= 0) {
    return "Tạm hết";
  }

  if (isLowStock(product)) {
    return `Còn ${product.stockQuantity}`;
  }

  return "Sẵn hàng";
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
