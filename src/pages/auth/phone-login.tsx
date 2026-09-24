import CONFIG from "@/config";
import { userInfoKeyState } from "@/state";
import { UserInfo } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import { useSetAtom } from "jotai";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import CommerceIcon from "@/components/commerce-icon";
import { useFrontendNotification } from "@/hooks";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^84/, "0");
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Yêu cầu không thành công");
  }
  return data as T;
}

export default function PhoneLoginPage() {
  const navigate = useNavigate();
  const refreshUserInfo = useSetAtom(userInfoKeyState);
  const notify = useFrontendNotification();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass =
    "auth-glass-field h-12 w-full rounded-2xl px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400";

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      toast.error("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postJson<{
        phone: string;
        demoOtp?: string;
        expiresInSeconds: number;
        message?: string;
        delivery?: {
          status: "pending_manual" | "sent";
          zaloOaUrl?: string;
        };
      }>("/auth/request-otp", { phone: normalizedPhone });
      setPhone(result.phone);
      setDemoOtp(result.demoOtp || "");
      setStep("otp");
      notify({
        title: result.delivery?.status === "pending_manual" ? "Đang gửi OTP qua Zalo" : "Đã gửi mã OTP",
        message: result.message || `Mã xác thực đã được gửi đến ${result.phone}.`,
        kind: "success",
        topic: "account",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không gửi được OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await postJson<{ token: string; user: UserInfo }>(
        "/auth/verify-otp",
        {
          phone,
          otp,
          name,
        }
      );
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, result.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(result.user));
      refreshUserInfo((key) => key + 1);
      notify({
        title: "Đăng nhập thành công",
        message: "Tài khoản của bạn đã sẵn sàng theo dõi đơn hàng và ưu đãi.",
        kind: "success",
        topic: "account",
        actionPath: "/profile",
      });
      navigate("/profile", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP không hợp lệ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full p-4 space-y-3">
      <div className="auth-glass-card rounded-[28px] p-5 space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-white/34 text-primary flex items-center justify-center ring-1 ring-white/60 shadow-[0_14px_30px_rgba(0,204,247,0.18)] backdrop-blur-xl">
          <CommerceIcon name="user" size={23} />
        </div>
        <div className="commerce-eyebrow text-primary">
          Tài khoản Saximi shop
        </div>
        <div className="text-2xl font-black text-slate-900 leading-7">
          Đăng nhập bằng số điện thoại
        </div>
        <div className="commerce-caption text-subtitle">
          Dùng một số điện thoại cho website và Zalo Mini App để theo dõi đơn
          hàng, địa chỉ giao hàng và tuyến Hội LHPN.
        </div>
      </div>

      {step === "phone" ? (
        <form className="auth-glass-card rounded-[28px] p-4 space-y-4" onSubmit={requestOtp}>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">
              Số điện thoại <span className="text-danger">*</span>
            </span>
            <input
              className={inputClass}
              inputMode="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(event) => setPhone(event.currentTarget.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">Tên của bạn</span>
            <input
              className={inputClass}
              placeholder="Nhập tên để tạo tài khoản mới"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
            {isSubmitting ? "Đang gửi OTP..." : "Tiếp tục"}
          </Button>
        </form>
      ) : (
        <form className="auth-glass-card rounded-[28px] p-4 space-y-4" onSubmit={verifyOtp}>
          <div className="rounded-2xl bg-cyan-50/54 px-3 py-2 commerce-caption text-primary ring-1 ring-white/60 backdrop-blur-xl">
            Vui lòng kiểm tra tin nhắn Zalo OA gửi đến số <strong>{phone}</strong>
            {demoOtp && (
              <>
                <br />
                Mã demo local: <strong>{demoOtp}</strong>
              </>
            )}
          </div>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">
              Mã OTP <span className="text-danger">*</span>
            </span>
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(event) => setOtp(event.currentTarget.value)}
              required
            />
          </label>
          <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
            {isSubmitting ? "Đang xác thực..." : "Đăng nhập"}
          </Button>
          <button
            type="button"
            className="w-full rounded-2xl bg-white/36 py-3 commerce-caption font-bold text-slate-700 ring-1 ring-white/60 backdrop-blur-xl"
            onClick={() => setStep("phone")}
          >
            Đổi số điện thoại
          </button>
        </form>
      )}
    </div>
  );
}
