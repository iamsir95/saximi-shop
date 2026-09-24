import HorizontalDivider from "@/components/horizontal-divider";
import { useAtomValue } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { productState } from "@/state";
import { formatPrice } from "@/utils/format";
import ShareButton from "./share-buttont";
import RelatedProducts from "./related-products";
import { useAddToCart } from "@/hooks";
import { Button } from "zmp-ui";
import Section from "@/components/section";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductImage } from "@/types";
import CommerceTrustStrip from "@/components/commerce-trust-strip";
import {
  getDiscountPercent,
  getSavedAmount,
  getStockLabel,
  isLowStock,
} from "@/utils/commerce";

function withImageParams(url: string, params: Record<string, string>) {
  try {
    const imageUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      imageUrl.searchParams.set(key, value);
    });
    return imageUrl.toString();
  } catch {
    return url;
  }
}

function buildImageLibrary(product: Product): ProductImage[] {
  if (product.images?.length) {
    return [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const base = product.image;
  const categoryImage = product.category?.image;
  const gallery = [
    {
      id: `${product.id}-main`,
      url: withImageParams(base, {
        auto: "format",
        fit: "crop",
        w: "1200",
        q: "90",
      }),
      label: "Ảnh chính",
      kind: "MAIN" as const,
      sortOrder: 1,
    },
    {
      id: `${product.id}-detail`,
      url: withImageParams(base, {
        auto: "format",
        fit: "crop",
        w: "900",
        h: "900",
        q: "88",
      }),
      label: "Cận cảnh",
      kind: "DETAIL" as const,
      sortOrder: 2,
    },
    {
      id: `${product.id}-collection`,
      url: withImageParams(categoryImage || base, {
        auto: "format",
        fit: "crop",
        w: "1000",
        h: "760",
        q: "88",
      }),
      label: "Bộ sưu tập",
      kind: "COLLECTION" as const,
      sortOrder: 3,
    },
  ];

  const seen = new Set<string>();
  return gallery.filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = useAtomValue(productState(Number(id)))!;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const gallery = useMemo(() => buildImageLibrary(product), [product]);
  const selectedImage = gallery[selectedImageIndex] || gallery[0];

  const navigate = useNavigate();
  const { addToCart } = useAddToCart(product);
  const hasDiscount =
    Boolean(product.originalPrice) && product.originalPrice! > product.price;
  const discountPercent = getDiscountPercent(product);
  const savedAmount = getSavedAmount(product);
  const lowStock = isLowStock(product);
  const hasAttributes = Boolean(product.attributes?.length);
  const seoArticle = product.seo?.article?.trim();

  useEffect(() => {
    const previousTitle = document.title;
    const seoTitle = product.seo?.title || product.name;
    const seoDescription =
      product.seo?.description ||
      product.promoDescription ||
      product.detail ||
      "Saximi shop";
    document.title = seoTitle;

    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    const previousDescription = metaDescription.content;
    metaDescription.content = seoDescription.slice(0, 170);

    return () => {
      document.title = previousTitle;
      if (metaDescription) metaDescription.content = previousDescription;
    };
  }, [product]);

  const scrollToImage = (index: number) => {
    setSelectedImageIndex(index);
    galleryRef.current?.children[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || !el.clientWidth) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== selectedImageIndex && gallery[index]) {
      setSelectedImageIndex(index);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 pb-2 space-y-4 bg-section lg:grid lg:grid-cols-[minmax(320px,430px)_minmax(0,1fr)] lg:items-start lg:gap-5 lg:space-y-0">
          <div className="liquid-card rounded-[28px] p-2 space-y-2">
            <div
              ref={galleryRef}
              onScroll={handleGalleryScroll}
              className="flex snap-x snap-mandatory overflow-x-auto rounded-[24px] bg-skeleton scroll-smooth"
            >
              {gallery.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  className="relative block w-full flex-none snap-center overflow-hidden text-left"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setIsGalleryOpen(true);
                  }}
                >
                  <img
                    src={image.url}
                    alt={product.name}
                    className="w-full aspect-square object-cover"
                    style={{
                      viewTransitionName:
                        index === selectedImageIndex
                          ? `product-image-${product.id}`
                          : undefined,
                    }}
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-white/72 px-3 py-1 text-3xs font-bold text-slate-800 backdrop-blur-xl">
                    Album ảnh
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/55 px-3 py-1 text-3xs font-semibold text-white backdrop-blur-xl">
                    {index + 1}/{gallery.length}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => scrollToImage(index)}
                  className={
                    "w-24 flex-none overflow-hidden rounded-2xl border bg-white/58 p-1 text-left transition-all ".concat(
                      selectedImageIndex === index
                        ? "border-primary shadow-[0_10px_24px_rgba(0,204,247,0.22)]"
                        : "border-white/70"
                    )
                  }
                >
                  <img
                    src={image.url}
                    alt={image.label}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <div className="px-1 pt-1 text-[10px] font-medium text-slate-600 truncate">
                    {image.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </div>
                  {hasDiscount && (
                    <div className="text-2xs space-x-0.5">
                      <span className="text-subtitle line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className="text-danger">-{discountPercent}%</span>
                    </div>
                  )}
                </div>
                <div
                  className={
                    "rounded-2xl px-3 py-2 text-right text-[11px] font-bold ".concat(
                      lowStock
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    )
                  }
                >
                  {getStockLabel(product)}
                </div>
              </div>
              <div className="text-sm mt-1">{product.name}</div>
              {product.promoDescription && (
                <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/72 px-3 py-2 text-xs font-semibold leading-5 text-primary">
                  {product.promoDescription}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-2xl bg-white/62 p-3">
                  <div className="font-bold text-slate-800">Tiết kiệm</div>
                  <div className="mt-1 text-primary">
                    {savedAmount ? formatPrice(savedAmount) : "Giá tốt mỗi ngày"}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/62 p-3">
                  <div className="font-bold text-slate-800">Nhận hàng</div>
                  <div className="mt-1 text-primary">Theo dõi tự động</div>
                </div>
              </div>
            </div>
            <ShareButton product={product} />
            <CommerceTrustStrip />
          </div>
        </div>
        {product.detail && (
          <>
            <div className="bg-background h-2 w-full"></div>
            <Section title="Mô tả sản phẩm">
              <div className="text-sm whitespace-pre-wrap text-subtitle p-4 pt-2">
                {product.detail}
              </div>
            </Section>
          </>
        )}
        {hasAttributes && (
          <>
            <div className="bg-background h-2 w-full"></div>
            <Section title="Thông số & thuộc tính">
              <div className="grid grid-cols-1 gap-2 p-4 pt-2 sm:grid-cols-2">
                {product.attributes!.map((attribute) => (
                  <div
                    key={`${attribute.name}-${attribute.value}`}
                    className="rounded-2xl bg-white/62 px-3 py-2"
                  >
                    <div className="text-[11px] font-bold uppercase text-slate-400">
                      {attribute.name}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-800">
                      {attribute.value}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
        {seoArticle && (
          <>
            <div className="bg-background h-2 w-full"></div>
            <Section title={product.seo?.title || "Bài viết sản phẩm"}>
              <article className="p-4 pt-2 text-sm leading-6 text-subtitle whitespace-pre-wrap">
                {seoArticle}
              </article>
            </Section>
          </>
        )}
        <div className="bg-background h-2 w-full"></div>
        <Section title="Sản phẩm khác">
          <RelatedProducts currentProductId={product.id} />
        </Section>
      </div>

      <HorizontalDivider />
      <div className="flex-none grid grid-cols-2 gap-2 py-3 px-4 liquid-bar border-t border-white/60">
        <Button
          variant="tertiary"
          className="!rounded-2xl"
          onClick={() => {
            addToCart(1, {
              toast: true,
            });
          }}
        >
          Thêm vào giỏ
        </Button>
        <Button
          className="!rounded-2xl"
          onClick={() => {
            addToCart(1);
            navigate("/cart", {
              viewTransition: true,
            });
          }}
        >
          Mua ngay
        </Button>
      </div>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/72 p-4 pt-st backdrop-blur-2xl">
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="text-xs uppercase font-bold text-white/60">
                  Kho ảnh sản phẩm
                </div>
                <div className="text-base font-bold truncate max-w-[280px]">
                  {product.name}
                </div>
              </div>
              <button
                type="button"
                className="liquid-button rounded-full px-4 py-2 text-xs font-bold text-slate-900"
                onClick={() => setIsGalleryOpen(false)}
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 min-h-0 rounded-[28px] bg-white/12 p-2 backdrop-blur-xl">
              <img
                src={selectedImage?.url}
                alt={selectedImage?.label}
                className="h-full w-full rounded-[22px] object-contain"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-sb">
              {gallery.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={
                    "w-24 flex-none rounded-2xl border p-1 ".concat(
                      selectedImageIndex === index
                        ? "border-white bg-white/30"
                        : "border-white/20 bg-white/10"
                    )
                  }
                >
                  <img
                    src={image.url}
                    alt={image.label}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
