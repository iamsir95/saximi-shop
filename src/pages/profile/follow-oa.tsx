import { useEffect } from "react";
import { showOAWidget } from "zmp-sdk/apis";
import { isZaloMiniAppRuntime } from "@/utils/platform";

export default function FollowOAWidget() {
  useEffect(() => {
    if (!isZaloMiniAppRuntime()) return;

    showOAWidget({
      id: "oaWidget",
      guidingText: "Quan tâm OA để nhận các đặc quyền ưu đãi",
      color: "#F7F7F8",
    });
  }, []);

  if (!isZaloMiniAppRuntime()) {
    return (
      <div className="liquid-card rounded-[24px] p-4 space-y-1">
        <div className="text-sm font-bold text-slate-900">
          Saximi shop trên website
        </div>
        <div className="text-xs text-subtitle leading-5">
          Bạn đang dùng phiên bản web. Các ưu đãi, đơn hàng và tuyến Hội LHPN
          vẫn được đồng bộ qua backend.
        </div>
      </div>
    );
  }

  return <div id="oaWidget" />;
}
