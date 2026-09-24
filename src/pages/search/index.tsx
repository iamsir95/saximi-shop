import Section from "@/components/section";
import { ProductItemSkeleton } from "@/components/skeleton";
import { useAtomValue } from "jotai";
import { HTMLAttributes, Suspense } from "react";
import {
  keywordState,
  recommendedProductsState,
  searchResultState,
} from "@/state";
import { EmptySearchResult } from "@/components/empty";
import ProductDiscovery from "@/components/product-discovery";

export function SearchResult() {
  const searchResult = useAtomValue(searchResultState);

  return (
    <div className="w-full h-full space-y-2 bg-background">
      {searchResult.length ? (
        <ProductDiscovery
          title={`Kết quả (${searchResult.length})`}
          products={searchResult}
          className="m-3"
        />
      ) : (
        <Section
          title="Kết quả"
          className="h-full flex flex-col overflow-y-auto pb-16"
        >
          <EmptySearchResult />
        </Section>
      )}
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <Section title={`Kết quả`}>
      <ProductGridSkeleton />
    </Section>
  );
}

export function ProductGridSkeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={"grid grid-cols-2 px-4 pt-2 pb-8 gap-4 ".concat(
        className ?? ""
      )}
      {...props}
    >
      <ProductItemSkeleton />
      <ProductItemSkeleton />
      <ProductItemSkeleton />
      <ProductItemSkeleton />
    </div>
  );
}

export function RecommendedProducts() {
  const recommendedProducts = useAtomValue(recommendedProductsState);

  return (
    <ProductDiscovery title="Gợi ý sản phẩm" products={recommendedProducts} />
  );
}

export default function SearchPage() {
  const keyword = useAtomValue(keywordState);

  if (keyword) {
    return (
      <Suspense fallback={<SearchResultSkeleton />}>
        <SearchResult />
      </Suspense>
    );
  }
  return <RecommendedProducts />;
}
