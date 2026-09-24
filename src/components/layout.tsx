import { Outlet } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { Suspense, useEffect } from "react";
import { PageSkeleton } from "./skeleton";
import { Toaster } from "react-hot-toast";
import { ScrollRestoration } from "./scroll-restoration";
import FloatingCartPreview from "./floating-cart-preview";
import { useSetAtom } from "jotai";
import { affiliateReferrerIdState } from "@/state";

export default function Layout() {
  const setAffiliateReferrerId = useSetAtom(affiliateReferrerIdState);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referrerId =
      params.get("ref") || params.get("referrerId") || params.get("affiliateId");

    if (referrerId) {
      setAffiliateReferrerId(referrerId);
    }
  }, [setAffiliateReferrerId]);

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
