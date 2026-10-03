import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type PullToRefreshProps = {
  targetSelector: string;
  onRefresh?: () => void | Promise<void>;
};

const PULL_LIMIT = 92;
const REFRESH_THRESHOLD = 64;
const START_THRESHOLD = 12;
const reloadPage = () => window.location.reload();

export default function PullToRefresh({
  targetSelector,
  onRefresh = reloadPage,
}: PullToRefreshProps) {
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(targetSelector);

    if (!target || !("ontouchstart" in window)) {
      return;
    }

    const canPull = () => target.scrollTop <= 0 && !isRefreshing;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !canPull()) {
        return;
      }

      startYRef.current = event.touches[0].clientY;
      startXRef.current = event.touches[0].clientX;
      isPullingRef.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isPullingRef.current || event.touches.length !== 1) {
        return;
      }

      const distance = event.touches[0].clientY - startYRef.current;
      const horizontalDistance = Math.abs(event.touches[0].clientX - startXRef.current);

      if (distance <= START_THRESHOLD || horizontalDistance > distance || !canPull()) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      event.preventDefault();
      const nextDistance = Math.min(PULL_LIMIT, distance * 0.45);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
    };

    const onTouchEnd = async () => {
      if (!isPullingRef.current) {
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= REFRESH_THRESHOLD;
      isPullingRef.current = false;

      if (!shouldRefresh) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      setIsRefreshing(true);
      pullDistanceRef.current = REFRESH_THRESHOLD;
      setPullDistance(REFRESH_THRESHOLD);

      try {
        await onRefresh();
      } finally {
        window.setTimeout(() => {
          setIsRefreshing(false);
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }, 450);
      }
    };

    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchmove", onTouchMove, { passive: false });
    target.addEventListener("touchend", onTouchEnd);
    target.addEventListener("touchcancel", onTouchEnd);

    return () => {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
      target.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isRefreshing, onRefresh, targetSelector]);

  const progress = Math.min(1, pullDistance / REFRESH_THRESHOLD);
  const isVisible = pullDistance > 0 || isRefreshing;

  return (
    <div
      className={`pull-refresh ${isVisible ? "pull-refresh--visible" : ""}`}
      style={{ transform: `translate3d(-50%, ${Math.max(0, pullDistance - 46)}px, 0)` }}
      aria-live="polite"
    >
      <span
        className={`pull-refresh__spinner ${isRefreshing ? "pull-refresh__spinner--active" : ""}`}
        style={{ "--pull-progress": progress } as CSSProperties}
      />
      <span className="pull-refresh__text">
        {isRefreshing ? "Đang cập nhật" : progress >= 1 ? "Thả để cập nhật" : "Kéo xuống để cập nhật"}
      </span>
    </div>
  );
}
