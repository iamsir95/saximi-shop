import { appNotificationsState, unreadNotificationsCountState } from "@/state";
import { FrontendNotification } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommerceIcon, { CommerceIconName } from "./commerce-icon";

const TOPIC_LABELS: Record<FrontendNotification["topic"], string> = {
  account: "Tài khoản",
  cart: "Giỏ hàng",
  commission: "Hoa hồng",
  delivery: "Giao nhận",
  order: "Đơn hàng",
  payment: "Thanh toán",
  system: "Hệ thống",
};

const TOPIC_ICONS: Record<FrontendNotification["topic"], CommerceIconName> = {
  account: "user",
  cart: "bag",
  commission: "wallet",
  delivery: "delivery",
  order: "receipt",
  payment: "credit-card",
  system: "shield",
};

const KIND_META: Record<
  FrontendNotification["kind"],
  { label: string; badge: string; iconBox: string; dot: string }
> = {
  success: {
    label: "Hoàn tất",
    badge: "bg-emerald-50 text-emerald-700",
    iconBox: "bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-500",
  },
  info: {
    label: "Thông tin",
    badge: "bg-cyan-50 text-primary",
    iconBox: "bg-cyan-50 text-primary",
    dot: "bg-cyan-400",
  },
  warning: {
    label: "Cần chú ý",
    badge: "bg-amber-50 text-amber-700",
    iconBox: "bg-amber-50 text-amber-600",
    dot: "bg-amber-500",
  },
  error: {
    label: "Lỗi",
    badge: "bg-rose-50 text-rose-700",
    iconBox: "bg-rose-50 text-rose-600",
    dot: "bg-rose-500",
  },
};

function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useAtom(appNotificationsState);
  const unreadCount = useAtomValue(unreadNotificationsCountState);
  const visibleNotifications =
    filter === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;

  const openCenter = () => {
    setVisible(true);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAllRead = () => {
    setNotifications((items) =>
      items.map((notification) => ({ ...notification, read: true }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((items) =>
      items.filter((notification) => notification.id !== id)
    );
  };

  const openNotification = (notification: FrontendNotification) => {
    setNotifications((items) =>
      items.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
    if (!notification.actionPath) return;
    setVisible(false);
    navigate(notification.actionPath, { viewTransition: true });
  };

  return (
    <>
      <button
        type="button"
        onClick={openCenter}
        className="relative flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/58 text-slate-800 ring-1 ring-white/70 backdrop-blur-xl transition active:scale-95"
        aria-label="Thông báo"
      >
        <CommerceIcon name="bell" size={20} className="text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {visible && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/28 p-0 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Trung tâm thông báo"
          onClick={() => setVisible(false)}
        >
          <div
            className="notification-popup flex w-full flex-col overflow-hidden rounded-none border border-white/72 bg-white/66 shadow-[0_24px_80px_rgba(15,42,64,0.2)] backdrop-blur-2xl sm:max-w-[860px] sm:rounded-b-[30px] lg:max-w-[1120px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/60 px-4 pb-3 pt-[calc(var(--safe-top)+14px)] sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="commerce-eyebrow text-slate-400">
                    Trung tâm thông báo
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    Cập nhật mới nhất
                  </div>
                  <div className="mt-0.5 text-xs leading-5 text-slate-500">
                    {unreadCount > 0
                      ? `${unreadCount} thông báo chưa đọc cần xem`
                      : "Tất cả thông báo đã được xử lý"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  className="flex h-9 shrink-0 items-center justify-center rounded-2xl bg-white/62 px-3 text-xs font-black text-slate-600 ring-1 ring-white/75 transition active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="px-4 py-3 sm:px-6">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <div className="flex rounded-2xl bg-white/58 p-1 ring-1 ring-white/70">
                  {(["all", "unread"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={`h-9 flex-1 rounded-xl px-3 text-xs font-black transition ${
                        filter === item
                          ? "bg-primary text-primaryForeground shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      {item === "all" ? "Tất cả" : "Chưa đọc"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="rounded-2xl bg-white/58 px-3 text-xs font-black text-primary ring-1 ring-white/70 disabled:text-slate-300"
                >
                  Đã đọc
                </button>
                <button
                  type="button"
                  onClick={clearNotifications}
                  disabled={notifications.length === 0}
                  className="rounded-2xl bg-white/58 px-3 text-xs font-black text-slate-500 ring-1 ring-white/70 disabled:text-slate-300"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(var(--safe-bottom)+20px)] sm:px-6">
              {notifications.length === 0 ? (
                <div className="notification-surface-card rounded-[22px] bg-white/58 px-4 py-5 text-center ring-1 ring-white/70">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-primary">
                    <CommerceIcon name="bell" size={22} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-900">
                    Chưa có thông báo
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    Các cập nhật về đơn hàng, thanh toán, giao nhận và hoa hồng
                    sẽ xuất hiện tại đây.
                  </div>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="notification-surface-card rounded-[22px] bg-white/58 px-4 py-5 text-center ring-1 ring-white/70">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CommerceIcon name="check" size={22} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-900">
                    Không còn thông báo chưa đọc
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    Các thông báo mới sẽ tự xuất hiện tại đây khi có cập nhật.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visibleNotifications.map((notification) => {
                    const TopicIcon = TOPIC_ICONS[notification.topic];
                    const kindMeta = KIND_META[notification.kind];

                    return (
                      <div
                        key={notification.id}
                        className={`notification-surface-card w-full rounded-[22px] p-3 text-left ring-1 transition ${
                          notification.read
                            ? "bg-white/54 ring-white/70"
                            : "bg-white/76 ring-cyan-100 shadow-[0_12px_30px_rgba(15,42,64,0.08)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${kindMeta.iconBox}`}
                            aria-label={notification.title}
                          >
                            <CommerceIcon name={TopicIcon} size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${kindMeta.badge}`}
                              >
                                {TOPIC_LABELS[notification.topic]}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {kindMeta.label}
                              </span>
                              {!notification.read && (
                                <span
                                  className={`h-2 w-2 rounded-full ${kindMeta.dot}`}
                                />
                              )}
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900">
                              {notification.title}
                            </div>
                            <div className="mt-0.5 text-xs leading-5 text-slate-600">
                              {notification.message}
                            </div>
                            <div className="mt-2 text-[10px] font-semibold text-slate-400">
                              {formatNotificationTime(notification.createdAt)}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              dismissNotification(notification.id)
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/58 text-slate-400"
                            aria-label="Xóa thông báo"
                          >
                            <CommerceIcon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
