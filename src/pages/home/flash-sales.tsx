import ProductDiscovery from "@/components/product-discovery";
import { useAtomValue } from "jotai";
import { flashSaleProductsState } from "@/state";

export default function FlashSales() {
  const products = useAtomValue(flashSaleProductsState);

  return (
    <ProductDiscovery title="Giá tốt hôm nay" products={products} />
  );
}
