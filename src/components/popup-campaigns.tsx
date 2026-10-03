import { PopupCampaign } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getApiBaseUrl } from "@/utils/request";

const storageKey = (popup: PopupCampaign) => `saximi:popup:${popup.id}:${popup.frequency}`;

function canShowPopup(popup: PopupCampaign) {
  if (typeof window === "undefined") return false;
  if (popup.frequency === "always") return true;
  const saved = localStorage.getItem(storageKey(popup));
  if (!saved) return true;
  if (popup.frequency === "session") return sessionStorage.getItem(storageKey(popup)) !== "1";
  const today = new Date().toISOString().slice(0, 10);
  return saved !== today;
}

function rememberPopup(popup: PopupCampaign) {
  if (popup.frequency === "always") return;
  const key = storageKey(popup);
  if (popup.frequency === "session") sessionStorage.setItem(key, "1");
  else localStorage.setItem(key, new Date().toISOString().slice(0, 10));
}

export default function PopupCampaigns() {
  const location = useLocation();
  const [popups, setPopups] = useState<PopupCampaign[]>([]);
  const [active, setActive] = useState<PopupCampaign | null>(null);
  const eligible = useMemo(() => popups.filter((popup) => popup.isActive !== false), [popups]);

  const placement = location.pathname.startsWith("/news")
    ? "news"
    : location.pathname.startsWith("/product")
      ? "product"
      : location.pathname.startsWith("/cart")
        ? "cart"
        : location.pathname === "/"
          ? "home"
          : "all";

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getApiBaseUrl()}/popups?placement=${encodeURIComponent(placement)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPopups(Array.isArray(data) ? data : []))
      .catch(() => setPopups([]));
    setActive(null);
    return () => controller.abort();
  }, [placement, location.pathname]);

  useEffect(() => {
    if (!eligible.length || active) return;
    const popup = eligible.find(canShowPopup);
    if (!popup) return;
    const timeout = window.setTimeout(() => {
      rememberPopup(popup);
      setActive(popup);
    }, Math.max(0, popup.delaySeconds || 0) * 1000);
    return () => window.clearTimeout(timeout);
  }, [eligible, active]);

  if (!active) return null;

  const close = () => setActive(null);
  const cta = active.ctaUrl ? /^https?:\/\//i.test(active.ctaUrl) ? (
    <a className="popup-campaign__cta" href={active.ctaUrl} target="_blank" rel="noreferrer" onClick={close}>
      {active.ctaLabel || "Xem ngay"}
    </a>
  ) : (
    <Link className="popup-campaign__cta" to={active.ctaUrl} onClick={close}>
      {active.ctaLabel || "Xem ngay"}
    </Link>
  ) : null;

  return (
    <div className={`popup-campaign popup-campaign--${active.layout}`} role="dialog" aria-modal="true" aria-label={active.title}>
      <button className="popup-campaign__backdrop" type="button" onClick={close} aria-label="Đóng popup" />
      <section className="popup-campaign__panel">
        <button type="button" className="popup-campaign__close" onClick={close} aria-label="Đóng">
          ×
        </button>
        {active.imageUrl && <img className="popup-campaign__image" src={active.imageUrl} alt={active.title} />}
        <div className="popup-campaign__content">
          <p className="popup-campaign__eyebrow">Saximi Shop</p>
          <h2>{active.title}</h2>
          {active.description && <p>{active.description}</p>}
          <div className="popup-campaign__actions">
            {cta}
            <button type="button" onClick={close}>Để sau</button>
          </div>
        </div>
      </section>
    </div>
  );
}
