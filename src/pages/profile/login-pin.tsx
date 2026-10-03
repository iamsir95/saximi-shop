import CONFIG from "@/config";
import { useFrontendNotification } from "@/hooks";
import { loadableUserInfoState, userInfoKeyState } from "@/state";
import { UserInfo } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import PinCodeInput from "@/components/pin-code-input";
import { useAtomValue, useSetAtom } from "jotai";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "zmp-ui";

export default function LoginPinCard() {
  const userInfo = useAtomValue(loadableUserInfoState);
  const refreshUserInfo = useSetAtom(userInfoKeyState);
  const notify = useFrontendNotification();
  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const isLoggedIn = Boolean(currentUser?.phone);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savePin = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập bằng OTP trước khi đặt mã PIN.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error("Mã PIN cần có 4-6 chữ số.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Mã PIN nhập lại chưa khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${getApiBaseUrl()}/auth/set-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        user?: UserInfo;
        message?: string;
      };
      if (!response.ok || !result.user) {
        throw new Error(result.message || "Không thể lưu mã PIN");
      }

      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(result.user));
      refreshUserInfo((key) => key + 1);
      setPin("");
      setConfirmPin("");
      notify({
        title: currentUser?.hasPin ? "Đã đổi mã PIN" : "Đã đặt mã PIN",
        message: "Bạn có thể dùng mã PIN để đăng nhập nhanh ở lần sau.",
        kind: "success",
        topic: "account",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu mã PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="liquid-card rounded-[24px] p-4 space-y-3 text-slate-900">
      <div>
        <div className="commerce-eyebrow text-primary">Bảo mật đăng nhập</div>
        <div className="commerce-title mt-0.5">
          {currentUser?.hasPin ? "Đổi mã PIN đăng nhập" : "Đặt mã PIN đăng nhập"}
        </div>
        <div className="commerce-caption text-subtitle mt-1">
          {isLoggedIn
            ? "Mã PIN dùng để đăng nhập nhanh sau khi bạn đã xác thực OTP lần đầu."
            : "Đăng nhập bằng số điện thoại để thiết lập mã PIN cho tài khoản."}
        </div>
      </div>

      {isLoggedIn ? (
        <form className="space-y-3" onSubmit={savePin}>
          <div className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">Mã PIN mới</span>
            <PinCodeInput value={pin} onChange={setPin} />
          </div>
          <div className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">Nhập lại mã PIN</span>
            <PinCodeInput value={confirmPin} onChange={setConfirmPin} />
          </div>
          <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
            {isSubmitting ? "Đang lưu..." : currentUser?.hasPin ? "Đổi mã PIN" : "Lưu mã PIN"}
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl bg-white/54 border border-white/70 px-3 py-2 commerce-caption text-slate-500">
          Khu vực này sẽ mở sau khi bạn đăng nhập bằng OTP.
        </div>
      )}
    </div>
  );
}
