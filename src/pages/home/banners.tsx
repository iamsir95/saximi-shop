import Carousel from "@/components/carousel";
import { useAtomValue } from "jotai";
import { bannersState } from "@/state";

export default function Banners() {
  const banners = useAtomValue(bannersState);

  return (
    <Carousel
      edgeToEdge
      slides={banners.map((banner) => (
        <img
          className="w-full aspect-[2.6/1] object-cover"
          src={banner}
          alt="Ưu đãi Saximi shop"
        />
      ))}
    />
  );
}
