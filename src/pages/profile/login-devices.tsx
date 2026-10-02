import CONFIG from "@/config";
import { useFrontendNotification } from "@/hooks";
import { userInfoKeyState } from "@/state";
import { AuthSession } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

async function requestSessions(path = "/auth/sessions", options?: RequestInit) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Không tải được thiết bị đăng nhập");
  return data;
}

export default function LoginDevices() {
  const notify = useFrontendNotification();
  const refreshUserInfo = useSetAtom(userInfoKeyState);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN) : "";

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    requestSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return null;

  const revoke = async (id: string) => {
    const isCurrent = sessions.some((item) => item.id === id && item.isCurrent);
    await requestSessions(`/auth/sessions/${id}`, { method: "DELETE" });
    setSessions((items) => items.filter((item) => item.id !== id));
    if (isCurrent) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_INFO);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      refreshUserInfo((key) => key + 1);
    }
    notify({
      title: "Đã đăng xuất thiết bị",
      message: "Thiết bị đã chọn sẽ cần đăng nhập lại khi sử dụng Saximi shop.",
      kind: "success",
      topic: "account",
    });
  };

  return (
    <div className="liquid-card rounded-[24px] p-4 space-y-3 text-slate-900">
      <div>
        <div className="commerce-eyebrow text-primary">Bảo mật tài khoản</div>
        <div className="commerce-title">Thiết bị đăng nhập</div>
        <div className="commerce-caption text-subtitle mt-0.5">
          Phiên đăng nhập được duy trì lâu dài. Bạn có thể đăng xuất thiết bị không còn sử dụng.
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white/58 px-3 py-3 text-xs text-slate-500">
          Đang tải thiết bị...
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl bg-white/58 px-3 py-3 text-xs text-slate-500">
          Chưa có thiết bị nào được ghi nhận.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl bg-white/58 border border-white/70 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-900">
                    {session.deviceName}
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500">
                    Hoạt động: {new Date(session.lastActiveAt).toLocaleString("vi-VN")}
                  </div>
                  {session.isCurrent && (
                    <span className="mt-2 inline-flex rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black text-primary">
                      Thiết bị hiện tại
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => revoke(session.id)}
                  className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-600"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
