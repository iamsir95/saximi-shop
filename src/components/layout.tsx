import { Outlet } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { Suspense, useEffect } from "react";
import { PageSkeleton } from "./skeleton";
import { Toaster } from "react-hot-toast";
import { ScrollRestoration } from "./scroll-restoration";
import FloatingCartPreview from "./floating-cart-preview";
import { useAtomValue, useSetAtom } from "jotai";
import { affiliateReferrerIdState, platformSettingsState } from "@/state";

export default function Layout() {
  const setAffiliateReferrerId = useSetAtom(affiliateReferrerIdState);
  const platformSettings = useAtomValue(platformSettingsState);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referrerId =
      params.get("ref") || params.get("referrerId") || params.get("affiliateId");

    if (referrerId) {
      setAffiliateReferrerId(referrerId);
    }
  }, [setAffiliateReferrerId]);

  useEffect(() => {
    const faviconUrl = platformSettings?.faviconUrl?.trim();

    if (!faviconUrl) {
      return;
    }

    const upsertIconLink = (rel: "icon" | "apple-touch-icon") => {
      let link = document.querySelector<HTMLLinkElement>(
        `link[rel="${rel}"][data-dynamic-favicon="true"]`
      );

      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        link.dataset.dynamicFavicon = "true";
        document.head.appendChild(link);
      }

      link.href = faviconUrl;

      if (rel === "icon") {
        link.sizes = "any";
        link.type = faviconUrl.endsWith(".svg") ? "image/svg+xml" : "";
      }
    };

    upsertIconLink("icon");
    upsertIconLink("apple-touch-icon");
  }, [platformSettings?.faviconUrl]);

  return (
    <div className="app-shell flex flex-col liquid-shell text-foreground">
      <Header />
      <main className="app-scroll flex-1 overflow-y-auto liquid-surface">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <Toaster
        containerClassName="toast-container"
        containerStyle={{
          top: "calc(var(--safe-top) + 12px)",
        }}
        toastOptions={{
          duration: 3600,
          className: "commerce-toast",
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <FloatingCartPreview />
      <ScrollRestoration />
    </div>
  );
}
