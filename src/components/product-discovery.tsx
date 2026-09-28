import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import Section from "./section";
import ProductGrid from "./product-grid";
import {
  filterProducts,
  ProductFilterKey,
  ProductSortKey,
  sortProducts,
} from "@/utils/commerce";
import { EmptySearchResult } from "./empty";
import { useMemberPricingEligible } from "@/hooks";

interface ProductDiscoveryProps {
  title: string;
  products: Product[];
  className?: string;
  gridClassName?: string;
  replace?: boolean;
}

const FILTERS: Array<{ key: ProductFilterKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "discount", label: "Đang giảm" },
  { key: "low-stock", label: "Sắp hết" },
];

const SORTS: Array<{ key: ProductSortKey; label: string }> = [
  { key: "featured", label: "Nổi bật" },
  { key: "discount", label: "Giảm mạnh" },
  { key: "price-asc", label: "Giá thấp" },
  { key: "price-desc", label: "Giá cao" },
];

export default function ProductDiscovery({
  title,
  products,
  className,
  gridClassName,
  replace,
}: ProductDiscoveryProps) {
  const [filter, setFilter] = useState<ProductFilterKey>("all");
  const [sort, setSort] = useState<ProductSortKey>("featured");
  const canUseMemberPricing = useMemberPricingEligible();
  const filters = useMemo(
    () =>
      canUseMemberPricing
        ? FILTERS
        : FILTERS.filter((item) => item.key !== "discount"),
    [canUseMemberPricing]
  );
  const sorts = useMemo(
    () =>
      canUseMemberPricing
        ? SORTS
        : SORTS.filter((item) => item.key !== "discount"),
    [canUseMemberPricing]
  );

  useEffect(() => {
    if (!canUseMemberPricing && filter === "discount") {
      setFilter("all");
    }

    if (!canUseMemberPricing && sort === "discount") {
      setSort("featured");
    }
  }, [canUseMemberPricing, filter, sort]);

  const visibleProducts = useMemo(
    () =>
      sortProducts(
        filterProducts(products, filter, canUseMemberPricing),
        sort,
        canUseMemberPricing
      ),
    [canUseMemberPricing, filter, products, sort]
  );

  return (
    <Section
      title={
        <div className="flex items-center justify-between gap-2">
          <span>{title}</span>
          <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-primary">
            {visibleProducts.length} SP
          </span>
        </div>
      }
      className={className}
    >
      <div className="space-y-2 px-4 pb-1">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                "flex-none rounded-full px-3 py-1.5 text-3xs font-semibold transition ".concat(
                  filter === item.key
                    ? "bg-primary text-primaryForeground shadow-[0_8px_20px_rgba(0,204,247,0.24)]"
                    : "bg-white/70 text-slate-700"
                )
              }
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex-none text-[10px] font-semibold uppercase text-subtitle">
            Sắp xếp
          </span>
          {sorts.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                "flex-none rounded-full border px-3 py-1.5 text-3xs font-semibold transition ".concat(
                  sort === item.key
                    ? "border-primary bg-cyan-50 text-primary"
                    : "border-white/70 bg-white/58 text-slate-600"
                )
              }
              onClick={() => setSort(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visibleProducts.length ? (
        <ProductGrid
          products={visibleProducts}
          replace={replace}
          className={gridClassName}
        />
      ) : (
        <EmptySearchResult />
      )}
    </Section>
  );
}
