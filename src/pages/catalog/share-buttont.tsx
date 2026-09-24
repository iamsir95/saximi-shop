import { ShareDecor } from "@/components/vectors";
import { Product } from "@/types";
import { getPublicAppUrl, isZaloMiniAppRuntime } from "@/utils/platform";
import { openShareSheet } from "zmp-sdk/apis";
import toast from "react-hot-toast";
import CommerceIcon from "@/components/commerce-icon";

export default function ShareButton(props: { product: Product }) {
  const share = async () => {
    const path = `/product/${props.product.id}`;
    const url = getPublicAppUrl(path);

    if (isZaloMiniAppRuntime()) {
      openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: props.product.name,
          thumbnail: props.product.image,
          path,
        },
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: props.product.name,
        text: "Xem sản phẩm tại Saximi shop",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Đã sao chép link sản phẩm");
  };

  return (
    <button
      className="relative w-full h-10 rounded-lg cursor-pointer overflow-hidden"
      onClick={share}
    >
      <div className="absolute inset-0 bg-[var(--zaui-light-button-secondary-background)] opacity-50" />
      <ShareDecor className="absolute inset-0" />
      <div className="relative flex space-x-1 text-primary text-sm font-medium p-2">
        <div>Chia sẻ ngay cho bạn bè</div>
        <CommerceIcon name="chevron-right" size={17} />
      </div>
    </button>
  );
}
