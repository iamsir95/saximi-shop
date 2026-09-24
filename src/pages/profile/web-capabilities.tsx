import { browserLocationState, loadableUserInfoState } from "@/state";
import { isWebsiteRuntime } from "@/utils/platform";
import {
  getBrowserLocation,
  getNotificationSupport,
  setupWebPushNotifications,
} from "@/utils/web-capabilities";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useFrontendNotification } from "@/hooks";

function formatLocation(lat?: number, lng?: number) {
  if (lat === undefined || lng === undefined) return "";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function WebCapabilitiesCard() {
  const [location, setLocation] = useAtom(browserLocationState);
  const userInfo = useAtomValue(loadableUserInfoState);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const notify = useFrontendNotification();
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const support = useMemo(() => {
    if (!isWebsiteRuntime()) {
      return { notification: false, serviceWorker: false, pushManager: false };
    }
    return getNotificationSupport();
  }, []);

  if (!isWebsiteRuntime()) return null;

  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const canUseLocation = "geolocation" in navigator;
  const canUsePush = support.notification && support.serviceWorker;

  const handleEnableLocation = async () => {
    if (!canUseLocation) {
      toast.error("Trình duyệt này chưa hỗ trợ lấy vị trí.");
      return;
    }

    setIsGettingLocation(true);
    try {
      const nextLocation = await getBrowserLocation();
      setLocation(nextLocation);
      notify({
        title: "Đã bật vị trí",
        message: "Website sẽ dùng vị trí để gợi ý điểm nhận hàng gần bạn.",
        kind: "success",
        topic: "delivery",
        actionPath: "/stations",
      });
    } catch (error) {
      console.warn(error);
      toast.error("Không lấy được vị trí. Vui lòng kiểm tra quyền trình duyệt.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleEnablePush = async () => {
    if (!canUsePush) {
      toast.error("Trình duyệt này chưa hỗ trợ thông báo đẩy.");
      return;
    }

    setIsEnablingPush(true);
    try {
      const result = await setupWebPushNotifications(currentUser);
      setNotificationPermission(
        typeof Notification === "undefined" ? "unsupported" : Notification.permission
      );

      if (result === "subscribed") {
        notify(
          {
            title: "Đã bật thông báo đẩy",
            message: "Thiết bị này sẽ nhận cập nhật quan trọng từ Saximi shop.",
            kind: "success",
            topic: "system",
          },
          { browser: true }
        );
      } else if (result === "permission-only") {
        notify({
          title: "Đã bật quyền thông báo",
          message: "Trình duyệt đã cho phép Saximi shop gửi thông báo.",
          kind: "success",
          topic: "system",
        });
      } else if (result === "denied") {
        toast.error("Bạn đã chặn thông báo. Hãy mở lại trong cài đặt trình duyệt.");
      } else {
        toast.error("Trình duyệt này chưa hỗ trợ thông báo đẩy.");
      }
    } catch (error) {
      console.warn(error);
      toast.error("Chưa bật được thông báo. Vui lòng thử lại.");
    } finally {
      setIsEnablingPush(false);
    }
  };

  return (
    <div className="liquid-card rounded-[24px] p-4 space-y-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Website hybrid
        </div>
        <div className="text-sm font-bold text-slate-900">
          Vị trí & thông báo trên trình duyệt
        </div>
        <div className="text-xs text-subtitle leading-5 mt-0.5">
          Dùng cho website, Android browser, Chrome, Edge, Firefox và Safari có
          hỗ trợ. Trên iPhone, thông báo đẩy web thường cần thêm website vào màn
          hình chính.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleEnableLocation}
          disabled={isGettingLocation || !canUseLocation}
          className="rounded-2xl bg-white/58 border border-white/70 px-3 py-3 text-left disabled:opacity-60"
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary">
            Vị trí
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1">
            {location ? "Đã bật" : isGettingLocation ? "Đang lấy..." : "Bật vị trí"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 leading-4">
            {location
              ? formatLocation(location.lat, location.lng)
              : canUseLocation
                ? "Tính điểm nhận gần nhất"
                : "Không hỗ trợ"}
          </div>
        </button>

        <button
          onClick={handleEnablePush}
          disabled={isEnablingPush || !canUsePush}
          className="rounded-2xl bg-white/58 border border-white/70 px-3 py-3 text-left disabled:opacity-60"
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            Thông báo
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1">
            {notificationPermission === "granted"
              ? "Đã bật"
              : isEnablingPush
                ? "Đang bật..."
                : "Bật thông báo"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 leading-4">
            {canUsePush
              ? support.pushManager
                ? "Hỗ trợ push"
                : "Hỗ trợ thông báo"
              : "Không hỗ trợ"}
          </div>
        </button>
      </div>
    </div>
  );
}
