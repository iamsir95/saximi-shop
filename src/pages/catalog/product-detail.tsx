import HorizontalDivider from "@/components/horizontal-divider";
import { useAtomValue } from "jotai";
import { useNavigate, useParams } from "react-router-dom";
import { platformSettingsState, productsState, productState } from "@/state";
import { formatPrice } from "@/utils/format";
import ShareButton from "./share-buttont";
import RelatedProducts from "./related-products";
import { useAddToCart, useMemberPricingEligible } from "@/hooks";
import { Button } from "zmp-ui";
import Section from "@/components/section";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductImage } from "@/types";
import CommerceTrustStrip from "@/components/commerce-trust-strip";
import CommerceIcon from "@/components/commerce-icon";
import {
  getDiscountPercent,
  getDisplayPrice,
  getSavedAmount,
  getSoldLabel,
  getStockLabel,
  hasMemberPrice,
  isGiftProgramActive,
  isLowStock,
} from "@/utils/commerce";
import { hasHtmlContent, sanitizeRichText } from "@/utils/rich-text";
import { absoluteSeoUrl, applySeoTags, stripSeoText, truncateSeoText } from "@/utils/seo";

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

function RichProductContent({ content }: { content: string }) {
  if (hasHtmlContent(content)) {
    return (
      <div
        className="rich-product-content p-4 pt-2 text-sm leading-6 text-subtitle"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
      />
    );
  }

  return (
    <div className="p-4 pt-2 text-sm whitespace-pre-wrap text-subtitle">
      {content}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = useAtomValue(productState(Number(id)))!;
  const products = useAtomValue(productsState);
  const settings = useAtomValue(platformSettingsState);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const activeVariants = useMemo(
    () => (product.enableVariants ? product.variants || [] : []).filter((variant) => variant.isActive !== false),
    [product.enableVariants, product.variants]
  );
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const gallery = useMemo(() => buildImageLibrary(product), [product]);
  const selectedImage = gallery[selectedImageIndex] || gallery[0];
  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ||
    activeVariants[0];
  const selectedVariantImageIndex = selectedVariant?.imageUrl
    ? gallery.findIndex((image) => image.url === selectedVariant.imageUrl)
    : -1;
  const productForCart = useMemo(() => {
    if (!selectedVariant) return product;
    return {
      ...product,
      name: `${product.name} - ${selectedVariant.name}`,
      price: selectedVariant.price || product.price,
      originalPrice: selectedVariant.originalPrice || product.originalPrice,
      image: selectedVariant.imageUrl || product.image,
      stockQuantity: selectedVariant.stockQuantity ?? product.stockQuantity,
      selectedVariantId: selectedVariant.id,
      selectedVariantName: selectedVariant.name,
      attributes: [
        ...(product.attributes || []),
        ...Object.entries(selectedVariant.attributes || {}).map(([name, value]) => ({
          name,
          value,
        })),
      ],
    };
  }, [product, selectedVariant]);

  const navigate = useNavigate();
  const { addToCart } = useAddToCart(productForCart);
  const canUseMemberPricing = useMemberPricingEligible();
  const hasDiscount = canUseMemberPricing && hasMemberPrice(productForCart);
  const discountPercent = getDiscountPercent(productForCart, canUseMemberPricing);
  const savedAmount = getSavedAmount(productForCart, canUseMemberPricing);
  const displayPrice = getDisplayPrice(productForCart, canUseMemberPricing);
  const lowStock = isLowStock(productForCart);
  const soldQuantity = Math.max(0, Number(productForCart.soldQuantity || 0));
  const promotionLabels = product.promotionLabels || [];
  const hasAttributes = Boolean(product.attributes?.length);
  const seoArticle = product.seo?.article?.trim();
  const giftPrograms = useMemo(
    () =>
      (product.giftPrograms || [])
        .filter((program) => isGiftProgramActive(program))
        .filter((program) => program.showOnProductPage !== false)
        .map((program) => ({
          ...program,
          giftProduct: products.find(
            (item) => item.id === Number(program.giftProductId)
          ),
        }))
        .filter((program) => program.giftProduct),
    [product.giftPrograms, products]
  );

  useEffect(() => {
    const origin = settings?.publicSiteUrl || "https://hpn.saximi.com.vn";
    const canonical = new URL(`/product/${product.id}`, origin).href;
    const seoTitle = truncateSeoText(product.seo?.title || `${product.name} | Saximi Shop`, 65);
    const seoDescription = truncateSeoText(
      product.seo?.description ||
        product.promoDescription ||
        stripSeoText(product.detail) ||
        `${product.name} đang được bán tại Saximi Shop với giao nhận linh hoạt và hỗ trợ khách hàng nhanh.`,
      158
    );
    const image = absoluteSeoUrl(selectedImage?.url || product.image, origin);
    const cleanup = applySeoTags({
      title: seoTitle,
      description: seoDescription,
      canonical,
      type: "product",
      image,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: seoDescription,
        image: gallery.map((item) => absoluteSeoUrl(item.url, origin)),
        sku: `SAXIMI-${product.id}`,
        brand: { "@type": "Brand", name: "Saximi Shop" },
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "VND",
          price: displayPrice,
          availability:
            Number(productForCart.stockQuantity ?? 1) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "Saximi Shop" },
        },
      },
    });
    return () => {
      cleanup();
      document.title = "Saximi Shop";
    };
  }, [displayPrice, gallery, product, productForCart.stockQuantity, selectedImage?.url, settings?.publicSiteUrl]);

  useEffect(() => {
    if (!selectedVariantId && activeVariants[0]) {
      setSelectedVariantId(activeVariants[0].id);
    }
  }, [activeVariants, selectedVariantId]);

  useEffect(() => {
    if (selectedVariantImageIndex >= 0) {
      setSelectedImageIndex(selectedVariantImageIndex);
      galleryRef.current?.children[selectedVariantImageIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedVariantImageIndex]);

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
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-bold text-primary">
                    {formatPrice(displayPrice)}
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
                <div className="flex flex-none flex-col items-end gap-1">
                  <div
                    className={
                      "commerce-tag self-start ".concat(
                        lowStock
                          ? "commerce-tag--warning"
                          : "commerce-tag--success"
                      )
                    }
                  >
                    {getStockLabel(productForCart)}
                  </div>
                  {soldQuantity > 0 && (
                    <div className="text-[11px] font-semibold leading-4 text-slate-400">
                      {getSoldLabel(product)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm mt-1">{product.name}</div>
              {(product.promoDescription || promotionLabels.length > 0) && (
                <div className="promo-spotlight mt-3 rounded-[22px] px-3.5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_24px_rgba(0,204,247,0.28)]">
                      <CommerceIcon name="ticket" size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="commerce-eyebrow text-primary">
                        Chương trình ưu đãi
                      </div>
                      {promotionLabels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {promotionLabels.map((label) => (
                            <span
                              key={label.id}
                              className="commerce-tag !min-h-0 !px-2 !py-1"
                              style={{
                                borderColor: `${label.color}55`,
                                background: `linear-gradient(135deg, rgba(255,255,255,.9), ${label.color}22)`,
                                color: label.color,
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {product.promoDescription && (
                        <div className="mt-2 text-sm font-extrabold leading-5 text-slate-800">
                          {product.promoDescription}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {giftPrograms.length > 0 && (
                <div className="promo-spotlight mt-3 space-y-2 rounded-[22px] px-3.5 py-3 text-xs text-slate-800">
                  <div className="flex items-center gap-2 font-black">
                    <span className="commerce-tag commerce-tag--promo">
                      Quà tặng kèm
                    </span>
                  </div>
                  {giftPrograms.map((program) => (
                    <div key={program.id} className="rounded-2xl bg-white/60 p-3 font-semibold leading-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="commerce-tag commerce-tag--success !min-h-0 !px-2 !py-1">
                          {program.badgeLabel || "Quà tặng"}
                        </span>
                        <span>{program.title}</span>
                      </div>
                      <div className="mt-1 text-slate-600">
                        Mua {program.minQuantity} tặng {program.giftQuantity}{" "}
                        {program.giftProduct?.name}
                      </div>
                      {program.description && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          {program.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {activeVariants.length > 0 && (
                <div className="mt-3 rounded-[22px] bg-white/62 p-3 ring-1 ring-white/70">
                  <div className="commerce-eyebrow text-primary">
                    Chọn biến thể
                  </div>
                  <div className="mt-2 grid gap-2">
                    {activeVariants.map((variant) => {
                      const selected = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`flex items-center gap-3 rounded-2xl border p-2 text-left transition active:scale-[0.99] ${
                            selected
                              ? "border-primary bg-cyan-50/70 shadow-[0_10px_24px_rgba(0,204,247,0.12)]"
                              : "border-slate-200 bg-white/72"
                          }`}
                        >
                          <img
                            src={variant.imageUrl || product.image}
                            alt={variant.name}
                            className="h-12 w-12 rounded-xl object-cover bg-skeleton"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black text-slate-800">
                              {variant.name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              {Object.entries(variant.attributes || {})
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(" · ") || variant.sku || "Biến thể sản phẩm"}
                            </div>
                          </div>
                          <div className="text-right text-xs font-black text-primary">
                            {formatPrice(variant.price || product.price)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-2xl bg-white/62 p-3">
                  <div className="font-bold text-slate-800">Tiết kiệm</div>
                  <div className="mt-1 text-primary">
                    {canUseMemberPricing && savedAmount
                      ? formatPrice(savedAmount)
                      : "Giá niêm yết"}
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
              <RichProductContent content={product.detail} />
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
              <article>
                <RichProductContent content={seoArticle} />
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
