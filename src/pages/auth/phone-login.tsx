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
import PinCodeInput from "@/components/pin-code-input";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^84/, "0");
}

function getAuthDeviceId() {
  const storageKey = "saximiAuthDeviceId";
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deviceId = randomId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  localStorage.setItem(storageKey, deviceId);
  return deviceId;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Saximi-Device-Id": getAuthDeviceId(),
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
  const [authMode, setAuthMode] = useState<"otp" | "pin">("otp");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [pinStep, setPinStep] = useState<"phone" | "pin">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
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

  const completeLogin = (token: string, user: UserInfo, message = "Tài khoản của bạn đã sẵn sàng theo dõi đơn hàng và ưu đãi.") => {
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    refreshUserInfo((key) => key + 1);
    notify({
      title: "Đăng nhập thành công",
      message,
      kind: "success",
      topic: "account",
      actionPath: "/profile",
    });
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
        }
      );
      completeLogin(result.token, result.user);
      if (!result.user.hasPin) {
        setShowPinSetup(true);
        return;
      }
      navigate("/profile", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP không hợp lệ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkPinPhone = async (event: FormEvent) => {
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
        exists: boolean;
        hasPin: boolean;
      }>("/auth/pin-status", { phone: normalizedPhone });

      setPhone(result.phone);
      setPin("");
      if (!result.exists) {
        toast.error("Số điện thoại này chưa có tài khoản. Vui lòng đăng nhập OTP trước.");
        setAuthMode("otp");
        setStep("phone");
        return;
      }
      if (!result.hasPin) {
        toast.error("Tài khoản này chưa đặt mã PIN. Vui lòng đăng nhập OTP để thiết lập PIN.");
        setAuthMode("otp");
        setStep("phone");
        return;
      }
      setPinStep("pin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể kiểm tra số điện thoại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginWithPin = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      toast.error("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error("Mã PIN cần có 4-6 chữ số.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postJson<{ token: string; user: UserInfo }>("/auth/login-pin", {
        phone: normalizedPhone,
        pin,
      });
      setPhone(result.user.phone);
      completeLogin(result.token, result.user, "Bạn đã đăng nhập nhanh bằng mã PIN.");
      navigate("/profile", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng nhập bằng PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  const savePin = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(newPin)) {
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
        body: JSON.stringify({ pin: newPin }),
      });
      const result = (await response.json().catch(() => ({}))) as { user?: UserInfo; message?: string };
      if (!response.ok || !result.user) {
        throw new Error(result.message || "Không thể thiết lập mã PIN");
      }
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(result.user));
      refreshUserInfo((key) => key + 1);
      toast.success("Đã thiết lập mã PIN đăng nhập.");
      navigate("/profile", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thiết lập mã PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page min-h-full p-4">
      <section className="auth-glass-card auth-mobile-card rounded-[28px] p-4">
        <div className="auth-mobile-hero">
          <div className="auth-mobile-icon h-12 w-12 rounded-2xl bg-white/34 text-primary flex items-center justify-center ring-1 ring-white/60 shadow-[0_14px_30px_rgba(0,204,247,0.18)] backdrop-blur-xl">
            <CommerceIcon name="user" size={23} />
          </div>
          <div className="min-w-0">
            <div className="commerce-eyebrow text-primary">
              Tài khoản Saximi shop
            </div>
            <div className="auth-mobile-title text-2xl font-black text-slate-900 leading-7">
              Đăng nhập bằng số điện thoại
            </div>
          </div>
        </div>
        <div className="auth-mobile-desc commerce-caption text-subtitle">
          Dùng số điện thoại để đăng nhập OTP lần đầu, sau đó có thể dùng mã PIN
          cho những lần truy cập tiếp theo.
        </div>

        {showPinSetup ? (
          <form className="auth-mobile-form space-y-4" onSubmit={savePin}>
            <div className="rounded-2xl bg-cyan-50/54 px-3 py-2 commerce-caption text-primary ring-1 ring-white/60 backdrop-blur-xl">
              Tạo mã PIN 4-6 số một lần để lần sau đăng nhập nhanh hơn trên thiết bị của bạn.
            </div>
            <div className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-800">Mã PIN mới</span>
              <PinCodeInput value={newPin} onChange={setNewPin} />
            </div>
            <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
              {isSubmitting ? "Đang lưu PIN..." : "Lưu mã PIN"}
            </Button>
            <button
              type="button"
              className="w-full rounded-2xl bg-white/36 py-3 commerce-caption font-bold text-slate-700 ring-1 ring-white/60 backdrop-blur-xl"
              onClick={() => navigate("/profile", { replace: true })}
            >
              Để sau
            </button>
          </form>
        ) : (
          <>
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={authMode === "otp" ? "auth-mode-tab auth-mode-tab--active" : "auth-mode-tab"}
                onClick={() => {
                  setAuthMode("otp");
                  setStep("phone");
                }}
              >
                OTP
              </button>
              <button
                type="button"
                className={authMode === "pin" ? "auth-mode-tab auth-mode-tab--active" : "auth-mode-tab"}
                onClick={() => {
                  setAuthMode("pin");
                  setPinStep("phone");
                  setPin("");
                }}
              >
                Mã PIN
              </button>
            </div>

        {authMode === "otp" && step === "phone" ? (
          <form className="auth-mobile-form space-y-4" onSubmit={requestOtp}>
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
          <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
            {isSubmitting ? "Đang gửi OTP..." : "Tiếp tục"}
          </Button>
          </form>
        ) : authMode === "otp" ? (
          <form className="auth-mobile-form space-y-4" onSubmit={verifyOtp}>
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
        ) : pinStep === "phone" ? (
          <form className="auth-mobile-form space-y-4" onSubmit={checkPinPhone}>
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
            <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
              {isSubmitting ? "Đang kiểm tra..." : "Tiếp tục"}
            </Button>
            <button
              type="button"
              className="w-full rounded-2xl bg-white/36 py-3 commerce-caption font-bold text-slate-700 ring-1 ring-white/60 backdrop-blur-xl"
              onClick={() => {
                setAuthMode("otp");
                setStep("phone");
              }}
            >
              Đăng nhập bằng OTP
            </button>
          </form>
        ) : (
          <form className="auth-mobile-form space-y-4" onSubmit={loginWithPin}>
            <div className="rounded-2xl bg-cyan-50/54 px-3 py-2 commerce-caption text-primary ring-1 ring-white/60 backdrop-blur-xl">
              Nhập mã PIN của tài khoản <strong>{phone}</strong>
            </div>
            <div className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-800">Mã PIN</span>
              <PinCodeInput value={pin} onChange={setPin} />
            </div>
            <Button htmlType="submit" fullWidth disabled={isSubmitting} className="!rounded-2xl">
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập bằng PIN"}
            </Button>
            <button
              type="button"
              className="w-full rounded-2xl bg-white/36 py-3 commerce-caption font-bold text-slate-700 ring-1 ring-white/60 backdrop-blur-xl"
              onClick={() => {
                setAuthMode("otp");
                setStep("phone");
              }}
            >
              Quên PIN, dùng OTP
            </button>
            <button
              type="button"
              className="w-full rounded-2xl bg-white/36 py-3 commerce-caption font-bold text-slate-700 ring-1 ring-white/60 backdrop-blur-xl"
              onClick={() => {
                setPinStep("phone");
                setPin("");
              }}
            >
              Đổi số điện thoại
            </button>
          </form>
        )}
          </>
        )}
      </section>
    </div>
  );
}
