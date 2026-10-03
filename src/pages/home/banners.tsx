import Carousel from "@/components/carousel";
import { useAtomValue } from "jotai";
import { bannersState } from "@/state";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function useIsMobileBanner() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const listener = () => setMobile(query.matches);
    listener();
    query.addEventListener?.("change", listener);
    return () => query.removeEventListener?.("change", listener);
  }, []);
  return mobile;
}

export default function Banners() {
  const banners = useAtomValue(bannersState);
  const isMobile = useIsMobileBanner();

  return (
    <Carousel
      edgeToEdge
      slides={banners.map((banner, index) => {
        const item =
          typeof banner === "string"
            ? { id: index + 1, imageUrl: banner, title: "Ưu đãi Saximi shop", linkUrl: "", linkEnabled: true, isActive: true }
            : banner;
        const imageUrl = isMobile && item.mobileImageUrl ? item.mobileImageUrl : item.imageUrl;
        const isMobilePortrait = isMobile && item.mobileAspectRatio === "mobile-4-6" && item.mobileImageUrl;
        const image = (
          <img
            className={`w-full object-cover ${isMobilePortrait ? "aspect-[4/6]" : "aspect-[2.6/1]"}`}
            src={imageUrl}
            alt={item.title || "Ưu đãi Saximi shop"}
          />
        );

        if (!item.linkUrl || item.linkEnabled === false) return image;
        if (/^https?:\/\//i.test(item.linkUrl)) {
          return (
            <a href={item.linkUrl} target="_blank" rel="noreferrer" aria-label={item.title || "Xem chương trình"}>
              {image}
            </a>
          );
        }

        return (
          <Link to={item.linkUrl} aria-label={item.title || "Xem chương trình"}>
            {image}
          </Link>
        );
      })}
    />
  );
}
