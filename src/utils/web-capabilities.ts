import { Location, UserInfo } from "@/types";
import { getApiBaseUrl } from "./request";

export type NotificationSetupResult =
  | "unsupported"
  | "denied"
  | "permission-only"
  | "subscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function getBrowserLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser does not support geolocation"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60 * 1000,
      }
    );
  });
}

export function getNotificationSupport() {
  return {
    notification: "Notification" in window,
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
  };
}

export async function setupWebPushNotifications(userInfo?: Partial<UserInfo>) {
  const support = getNotificationSupport();
  if (!support.notification || !support.serviceWorker) {
    return "unsupported" satisfies NotificationSetupResult;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission === "denied"
      ? ("denied" satisfies NotificationSetupResult)
      : ("permission-only" satisfies NotificationSetupResult);
  }

  const registration = await navigator.serviceWorker.register("/saximi-sw.js");
  await navigator.serviceWorker.ready;

  if (!support.pushManager) {
    registration.showNotification("Saximi shop", {
      body: "Thông báo đã được bật trên trình duyệt này.",
      icon: "/icon.png",
    });
    return "permission-only" satisfies NotificationSetupResult;
  }

  const configResponse = await fetch(`${getApiBaseUrl()}/web-push/config`);
  const config = (await configResponse.json()) as {
    enabled: boolean;
    publicKey?: string;
  };

  if (!config.enabled || !config.publicKey) {
    registration.showNotification("Saximi shop", {
      body: "Trình duyệt đã cho phép thông báo. Cấu hình VAPID để gửi push thật từ server.",
      icon: "/icon.png",
    });
    return "permission-only" satisfies NotificationSetupResult;
  }

  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    }));

  await fetch(`${getApiBaseUrl()}/web-push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userInfo?.id,
      userName: userInfo?.name,
      userPhone: userInfo?.phone,
      subscription,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    }),
  });

  return "subscribed" satisfies NotificationSetupResult;
}
