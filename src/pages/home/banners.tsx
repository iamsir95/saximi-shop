import Carousel from "@/components/carousel";
import { useAtomValue } from "jotai";
import { bannersState } from "@/state";
import { Link } from "react-router-dom";

export default function Banners() {
  const banners = useAtomValue(bannersState);

  return (
    <Carousel
      edgeToEdge
      slides={banners.map((banner, index) => {
        const item =
          typeof banner === "string"
            ? { id: index + 1, imageUrl: banner, title: "Ưu đãi Saximi shop", linkUrl: "", isActive: true }
            : banner;
        const image = (
          <img
            className="w-full aspect-[2.6/1] object-cover"
            src={item.imageUrl}
            alt={item.title || "Ưu đãi Saximi shop"}
          />
        );

        if (!item.linkUrl) return image;
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
