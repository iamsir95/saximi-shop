import type { Product } from "@/types";

export type ProductFilterKey = "all" | "discount" | "low-stock";
export type ProductSortKey = "featured" | "price-asc" | "price-desc" | "discount";

export function getDiscountPercent(product: Product) {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }

  return 100 - Math.round((product.price * 100) / product.originalPrice);
}

export function getSavedAmount(product: Product) {
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

export function filterProducts(products: Product[], filter: ProductFilterKey) {
  if (filter === "discount") {
    return products.filter((product) => getDiscountPercent(product) > 0);
  }

  if (filter === "low-stock") {
    return products.filter(isLowStock);
  }

  return products;
}

export function sortProducts(products: Product[], sort: ProductSortKey) {
  const items = [...products];

  if (sort === "price-asc") {
    return items.sort((a, b) => a.price - b.price);
  }

  if (sort === "price-desc") {
    return items.sort((a, b) => b.price - a.price);
  }

  if (sort === "discount") {
    return items.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
  }

  return items;
}

export function getCommerceSummary(products: Product[]) {
  const discountedProducts = products.filter(
    (product) => getDiscountPercent(product) > 0
  );
  const lowStockProducts = products.filter(isLowStock);
  const biggestDeal = discountedProducts.reduce(
    (best, product) =>
      getDiscountPercent(product) > getDiscountPercent(best) ? product : best,
    discountedProducts[0]
  );

  return {
    totalProducts: products.length,
    discountedCount: discountedProducts.length,
    lowStockCount: lowStockProducts.length,
    biggestDealPercent: biggestDeal ? getDiscountPercent(biggestDeal) : 0,
  };
}
