import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Order, OrderTracking } from "@/types";
import OrderSummary from "./order-summary";
import OrderInfo from "./order-info";
import TrackingTimeline from "./tracking";
import { getApiBaseUrl } from "@/utils/request";

function OrderDetailPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState<Order | undefined>(state as Order);
  const [tracking, setTracking] = useState<OrderTracking | undefined>();
  const [loading, setLoading] = useState(!state);
  const orderId = Number(id || order?.id);

  useEffect(() => {
    if (!orderId) return;

    let mounted = true;
    const loadTracking = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/orders/${orderId}/tracking`);
        if (!response.ok) return;
        const data = (await response.json()) as OrderTracking;
        if (mounted) {
          setTracking(data);
          setOrder(data.order);
          setLoading(false);
        }
      } catch (error) {
        console.warn("Tracking refresh failed", error);
        if (mounted) setLoading(false);
      }
    };

    loadTracking();
    const interval = window.setInterval(loadTracking, 8000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [orderId]);

  if (loading || !order) {
    return (
      <div className="w-full p-4 space-y-2">
        <div className="h-28 rounded-lg bg-skeleton animate-pulse" />
        <div className="h-44 rounded-lg bg-skeleton animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-2">
      <OrderInfo order={order} />
      <TrackingTimeline tracking={tracking} />
      <OrderSummary full order={order} />
    </div>
  );
}

export default OrderDetailPage;
