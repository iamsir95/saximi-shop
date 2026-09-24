// Polyfills
import ResizeObserver from "resize-observer-polyfill";
Object.assign(window, { ResizeObserver });

import { ReactNode, useCallback, useEffect, useState } from "react";
import { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export const useDotButton = (
  emblaApi: EmblaCarouselType | undefined
): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};

export interface CarouselProps {
  slides: ReactNode[];
  disabled?: boolean;
  edgeToEdge?: boolean;
}

export default function Carousel(props: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center" }, [
    Autoplay({ active: !props.disabled }),
  ]);
  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div
        className={`flex space-x-3 ${props.edgeToEdge ? "mx-0 mt-0" : "mx-4 mt-2"}`}
      >
        {props.slides.map((slide, i) => (
          <div key={i} className="flex-none basis-full">
            {slide}
          </div>
        ))}
      </div>

      <div className="py-2 flex justify-center items-center space-x-1.5">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => onDotButtonClick(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === selectedIndex && !props.disabled
                ? "w-7 bg-primary"
                : "w-3 bg-slate-300/80"
            }`}
            aria-label={`Chuyển banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
