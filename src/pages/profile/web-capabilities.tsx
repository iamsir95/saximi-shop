import { loadableUserInfoState } from "@/state";
import { isWebsiteRuntime } from "@/utils/platform";
import {
  getNotificationSupport,
  setupWebPushNotifications,
} from "@/utils/web-capabilities";
import CommerceIcon from "@/components/commerce-icon";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useFrontendNotification } from "@/hooks";

export default function WebCapabilitiesCard() {
  const userInfo = useAtomValue(loadableUserInfoState);
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
  const canUsePush = support.notification && support.serviceWorker && support.pushManager;

  const handleEnablePush = async () => {
    if (!canUsePush) {
      toast.error("Trình duyệt này chưa hỗ trợ nhận thông báo.");
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
            title: "Đã bật nhận thông báo",
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
        toast.error("Trình duyệt này chưa hỗ trợ nhận thông báo.");
      }
    } catch (error) {
      console.warn(error);
      toast.error("Chưa bật được thông báo. Vui lòng thử lại.");
    } finally {
      setIsEnablingPush(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnablePush}
      disabled={isEnablingPush || !canUsePush || notificationPermission === "granted"}
      className="liquid-button w-full rounded-2xl px-4 py-3 text-left disabled:opacity-70"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <CommerceIcon name="bell" size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-900">
            {notificationPermission === "granted"
              ? "Đã bật nhận thông báo"
              : isEnablingPush
                ? "Đang bật thông báo..."
                : "Bật nhận thông báo"}
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-subtitle">
            {canUsePush
              ? "Nhận cập nhật đơn hàng và ưu đãi quan trọng."
              : "Trình duyệt này chưa hỗ trợ nhận thông báo."}
          </span>
        </span>
      </div>
    </button>
  );
}
