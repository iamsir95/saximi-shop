import CONFIG from "@/config";
import { useFrontendNotification } from "@/hooks";
import { loadableUserInfoState, userInfoKeyState } from "@/state";
import { UserInfo } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import CommerceIcon from "@/components/commerce-icon";
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
  const [changePin, setChangePin] = useState("");
  const [showChangePin, setShowChangePin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savePin = async (event: FormEvent, nextPin = pin) => {
    event.preventDefault();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập bằng mã xác thực trước khi đặt mã PIN.");
      return;
    }
    if (!/^\d{4,6}$/.test(nextPin)) {
      toast.error("Mã PIN cần có 4-6 chữ số.");
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
        body: JSON.stringify({ pin: nextPin }),
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
      setChangePin("");
      setShowChangePin(false);
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
    <div className="liquid-card rounded-[26px] p-4 space-y-3 text-slate-900 min-w-0 overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl secondary-soft shadow-[0_12px_26px_rgba(239,106,140,0.18)]">
          <CommerceIcon name="shield" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="commerce-eyebrow text-primary">Đăng nhập nhanh</div>
          <div className="commerce-title mt-0.5 break-words">
            {currentUser?.hasPin ? "Đổi mã PIN bảo mật" : "Thiết lập mã PIN nhanh"}
          </div>
          <div className="commerce-caption text-subtitle mt-1 leading-5 break-words">
            {currentUser?.hasPin
              ? "Bạn đang dùng mã PIN để đăng nhập nhanh. Có thể đổi mã mới bất cứ lúc nào."
              : isLoggedIn
              ? "Tạo mã PIN 4-6 số một lần để lần sau đăng nhập nhanh hơn trên thiết bị cá nhân."
              : "Đăng nhập bằng số điện thoại để mở khu vực thiết lập mã PIN."}
          </div>
        </div>
      </div>

      {isLoggedIn && !currentUser?.hasPin ? (
        <form className="space-y-3" onSubmit={(event) => savePin(event)}>
          <div className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">Nhập mã PIN mới</span>
            <PinCodeInput value={pin} onChange={setPin} />
          </div>
          <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
            {isSubmitting ? "Đang lưu..." : "Lưu mã PIN"}
          </Button>
        </form>
      ) : isLoggedIn ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-emerald-50/80 border border-white/70 px-3 py-2">
            <div className="text-xs font-black text-emerald-700">Đã bật đăng nhập nhanh</div>
            <div className="commerce-caption text-emerald-700/82 mt-0.5">
              Mã PIN hiện tại không hiển thị lại để bảo mật. Khi cần, hãy tạo mã PIN mới tại đây.
            </div>
          </div>
          {!showChangePin ? (
            <Button
              htmlType="button"
              fullWidth
              variant="secondary"
              className="!rounded-2xl"
              onClick={() => setShowChangePin(true)}
            >
              Mở khu vực đổi mã PIN
            </Button>
          ) : (
            <form className="space-y-3" onSubmit={(event) => savePin(event, changePin)}>
              <div className="grid gap-2 text-sm rounded-[22px] bg-white/56 border border-white/75 p-3">
                <span className="font-semibold text-slate-800">Nhập mã PIN mới</span>
                <PinCodeInput value={changePin} onChange={setChangePin} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  htmlType="button"
                  variant="secondary"
                  className="!rounded-2xl"
                  onClick={() => {
                    setShowChangePin(false);
                    setChangePin("");
                  }}
                >
                  Hủy
                </Button>
                <Button htmlType="submit" disabled={isSubmitting} className="!rounded-2xl">
                  {isSubmitting ? "Đang lưu..." : "Lưu PIN mới"}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/54 border border-white/70 px-3 py-2 commerce-caption text-slate-500">
          Khu vực này sẽ mở sau khi bạn đăng nhập bằng mã xác thực.
        </div>
      )}
    </div>
  );
}
