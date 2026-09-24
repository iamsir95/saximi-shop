import React, { useEffect, useState } from "react";
import { Page } from "zmp-ui";
import { useNavigate, useParams } from "react-router-dom";

import toast from "react-hot-toast";
import CommerceIcon, { CommerceIconName } from "@/components/commerce-icon";
import type { PaymentMethod, OrderPaymentDetails, PaymentStatus } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import { useFrontendNotification } from "@/hooks";

const API_BASE = getApiBaseUrl();

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// ─── Countdown timer component ────────────────────────────────────────────────
function CountdownTimer({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const pct = (timeLeft / seconds) * 100;
  const isUrgent = timeLeft <= 120;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke={isUrgent ? "#EF4444" : "#3B82F6"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black ${isUrgent ? "text-red-500" : "text-primary"}`}>
            {mins}:{secs}
          </span>
        </div>
      </div>
      <p className={`text-xs font-medium ${isUrgent ? "text-red-500" : "text-slate-500"}`}>
        {timeLeft > 0 ? "Thời hạn thanh toán" : "QR đã hết hạn"}
      </p>
    </div>
  );
}

// ─── VietQR Payment View ──────────────────────────────────────────────────────
function VietQRView({ details }: { details: OrderPaymentDetails }) {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Đã sao chép!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center space-y-4">
        <p className="text-sm font-bold text-slate-700">Quét mã QR để chuyển khoản</p>
        <p className="text-xs text-slate-400">Hỗ trợ tất cả app ngân hàng Việt Nam</p>

        <div className="relative inline-block">
          {!imgLoaded && (
            <div className="w-56 h-56 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center mx-auto">
              <span className="text-slate-400 text-xs">Đang tải QR...</span>
            </div>
          )}
          <img
            src={details.vietQrUrl}
            alt="VietQR"
            className={`w-56 h-56 mx-auto rounded-2xl shadow-inner border border-slate-200 ${imgLoaded ? "block" : "hidden"}`}
            onLoad={() => setImgLoaded(true)}
          />
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            NAPAS 247
          </div>
        </div>

        <CountdownTimer seconds={900} />
      </div>

      {/* Bank Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Thông tin chuyển khoản</p>
        </div>
        {[
          { label: "Ngân hàng", value: details.bankName || "MBBank" },
          { label: "Số tài khoản", value: details.accountNo || "0908889999", copyable: true },
          { label: "Chủ tài khoản", value: details.accountName || "CONG TY ZAUI MARKET" },
          { label: "Số tiền", value: formatPrice(details.amount), highlight: true },
          { label: "Nội dung CK", value: details.transferContent || `ZAUI ORDER ${details.orderId}`, copyable: true },
        ].map((row) => (
          <div
            key={row.label}
            className={`flex justify-between items-center px-4 py-3 border-b border-slate-50 last:border-0 ${row.highlight ? "bg-cyan-50" : ""}`}
          >
            <span className="text-xs text-slate-500 flex-shrink-0">{row.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold text-right ${row.highlight ? "text-primary text-sm" : "text-slate-800"}`}>
                {row.value}
              </span>
              {row.copyable && (
                <button
                  onClick={() => handleCopy(row.value)}
                  className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium active:bg-slate-200"
                >
                  {copied ? "Đã copy" : "Copy"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
          <CommerceIcon name="alert" size={15} />
          Lưu ý quan trọng
        </p>
        <p className="text-xs text-amber-600">
          Chuyển khoản <strong>đúng số tiền và nội dung</strong> để hệ thống tự động xác nhận đơn hàng.
          Đơn hàng sẽ được xác nhận trong vòng <strong>5–10 phút</strong> sau khi chuyển khoản thành công.
        </p>
      </div>
    </div>
  );
}

// ─── ZaloPay View ─────────────────────────────────────────────────────────────
function ZaloPayView({ details, onOpenZaloPay }: { details: OrderPaymentDetails; onOpenZaloPay: () => void }) {
  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-primary to-teal-400 rounded-2xl p-6 text-primaryForeground text-center space-y-4 shadow-lg">
        <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
          <CommerceIcon name="wallet" size={30} className="text-primary" strokeWidth={1.9} />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-100">Thanh toán qua ZaloPay</p>
          <p className="text-3xl font-black mt-1">{formatPrice(details.amount)}</p>
        </div>
        <button
          onClick={onOpenZaloPay}
          className="flex w-full items-center justify-center gap-1.5 bg-white text-primary font-black text-base py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          Mở ZaloPay ngay
          <CommerceIcon name="chevron-right" size={18} />
        </button>
        <p className="text-xs text-blue-200">Sẽ chuyển bạn sang ví ZaloPay trong Zalo</p>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ưu điểm ZaloPay</p>
        {[
          { icon: "bolt", text: "Xác nhận tức thì, không cần chờ duyệt" },
          { icon: "shield", text: "Bảo mật xác thực 2 lớp với Face ID / Vân tay" },
          { icon: "wallet", text: "Tích điểm thưởng & hoàn tiền cashback" },
          { icon: "phone", text: "Không cần app riêng — dùng ngay trong Zalo" },
        ].map((b) => (
          <div key={b.text} className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-primary">
              <CommerceIcon name={b.icon as CommerceIconName} size={16} />
            </span>
            <p className="text-xs text-slate-600">{b.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COD View ─────────────────────────────────────────────────────────────────
function CODView({ details }: { details: OrderPaymentDetails }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white text-center space-y-3 shadow-lg">
        <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
          <CommerceIcon name="banknote" size={31} className="text-amber-600" strokeWidth={1.9} />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-100">Chuẩn bị số tiền mặt</p>
          <p className="text-3xl font-black mt-1">{formatPrice(details.amount)}</p>
        </div>
        <div className="bg-black/15 backdrop-blur-sm rounded-xl px-4 py-2">
          <p className="text-xs text-amber-100">
            Thanh toán khi nhận hàng — Không cần chuyển khoản trước
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Hướng dẫn nhận hàng</p>
        {[
          { step: "1", text: "Shipper liên hệ xác nhận trước khi giao" },
          { step: "2", text: "Kiểm tra hàng hóa trước khi thanh toán" },
          { step: "3", text: `Thanh toán ${formatPrice(details.amount)} cho shipper` },
          { step: "4", text: "Ký xác nhận đã nhận hàng thành công" },
        ].map((s) => (
          <div key={s.step} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
              {s.step}
            </div>
            <p className="text-xs text-slate-600 pt-0.5">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
        <p className="flex items-start gap-2 text-xs text-green-700 font-medium">
          <CommerceIcon name="check" size={16} className="mt-0.5 flex-none" />
          <span>
            Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ xác nhận và
            sắp xếp giao hàng sớm nhất!
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Payment Page ────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { orderId, method } = useParams<{ orderId: string; method: string }>();
  const navigate = useNavigate();
  const notify = useFrontendNotification();
  const [details, setDetails] = useState<OrderPaymentDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [lastCheckedAt, setLastCheckedAt] = useState<string>();
  const [loading, setLoading] = useState(true);

  const paymentMethod = (method?.toUpperCase() || "COD") as PaymentMethod;

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetch(`${API_BASE}/payment/details/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetails(data);
        setPaymentStatus(data.paymentStatus || "pending");
      })
      .catch(() => {
        // Fallback mock if backend not running
        setDetails({
          orderId: parseInt(orderId),
          amount: 350000,
          vietQrUrl: `https://img.vietqr.io/image/MB-0908889999-compact2.png?amount=350000&addInfo=ZAUI%20ORDER%20${orderId}&accountName=CONG%20TY%20ZAUI%20MARKET`,
          bankName: "MBBank",
          accountNo: "0908889999",
          accountName: "CONG TY ZAUI MARKET",
          transferContent: `ZAUI ORDER ${orderId}`,
          zaloPayToken: `zalo_token_demo_${orderId}`,
        });
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!orderId || paymentMethod === "COD" || paymentStatus === "success") {
      return;
    }

    let mounted = true;
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/payment/status/${orderId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted) return;
        setLastCheckedAt(data.checkedAt);
        setPaymentStatus(data.paymentStatus || "pending");
        if (data.paymentStatus === "success") {
          notify(
            {
              title: "Thanh toán đã xác nhận",
              message: `Đơn #${orderId} đã được xác nhận thanh toán tự động.`,
              kind: "success",
              topic: "payment",
              actionPath: `/order/${orderId}`,
            },
            { browser: true }
          );
        }
      } catch (error) {
        console.warn("Payment status check failed", error);
      }
    };

    checkPaymentStatus();
    const interval = window.setInterval(checkPaymentStatus, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [orderId, paymentMethod, paymentStatus]);

  const handleOpenZaloPay = () => {
    if (!details?.zaloPayToken) {
      notify({
        title: "Không mở được ZaloPay",
        message: "Không thể khởi tạo ZaloPay. Vui lòng thử lại.",
        kind: "error",
        topic: "payment",
      });
      return;
    }
    try {
      // Zalo Mini App SDK: openWebview or ZaloPay SDK
      if ((window as any).ZJSBridge) {
        (window as any).ZJSBridge.payment.createOrder({
          zpTransToken: details.zaloPayToken,
        }, (data: any) => {
          if (data && data.returnCode === 1) {
            setPaymentStatus("success");
            notify(
              {
                title: "Thanh toán ZaloPay thành công",
                message: `Đơn #${orderId} đã thanh toán thành công.`,
                kind: "success",
                topic: "payment",
                actionPath: `/order/${orderId}`,
              },
              { browser: true }
            );
            navigate(`/order/${orderId}`, { replace: true, viewTransition: true });
          } else {
            notify({
              title: "ZaloPay thất bại",
              message: "Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
              kind: "error",
              topic: "payment",
            });
          }
        });
      } else {
        // Dev fallback — open orderUrl in browser
        toast("ZaloPay demo mode - mở link trên trình duyệt...");
        window.open(`https://qcgateway.zalopay.vn/openinapp?order=${details.zaloPayToken}`, "_blank");
      }
    } catch (e) {
      notify({
        title: "Không thể mở ZaloPay",
        message: "Vui lòng thử lại sau.",
        kind: "error",
        topic: "payment",
      });
    }
  };

  const handleDoneOrders = () => {
    navigate(`/order/${orderId}`, { replace: true, viewTransition: true });
  };

  return (
    <Page className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"
        >
          <CommerceIcon name="arrow-left" size={18} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-black text-slate-800">Thanh toán đơn #{orderId}</p>
          <p className="text-[10px] text-slate-400">
            {paymentMethod === "ZALOPAY" && "Ví ZaloPay"}
            {paymentMethod === "VIETQR" && "Chuyển khoản VietQR"}
            {paymentMethod === "COD" && "Thanh toán khi nhận hàng"}
          </p>
        </div>
        {/* Status Pill */}
        <div
          className={
            "flex items-center gap-1.5 rounded-full border px-3 py-1 ".concat(
              paymentStatus === "success"
                ? "bg-green-50 border-green-200"
                : paymentStatus === "failed"
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            )
          }
        >
          <div
            className={
              "w-1.5 h-1.5 rounded-full ".concat(
                paymentStatus === "success"
                  ? "bg-green-500"
                  : paymentStatus === "failed"
                  ? "bg-red-500"
                  : "bg-amber-400 animate-pulse"
              )
            }
          />
          <span
            className={
              "text-[10px] font-bold ".concat(
                paymentStatus === "success"
                  ? "text-green-600"
                  : paymentStatus === "failed"
                  ? "text-red-600"
                  : "text-amber-600"
              )
            }
          >
            {paymentStatus === "success"
              ? "Đã TT"
              : paymentStatus === "failed"
              ? "Lỗi TT"
              : "Chờ TT"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 pb-32">
        {!loading && paymentMethod !== "COD" && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Theo dõi thanh toán tự động
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {paymentStatus === "success"
                    ? "Hệ thống đã xác nhận giao dịch."
                    : "Đang kiểm tra giao dịch mỗi 5 giây."}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={
                    "text-xs font-black ".concat(
                      paymentStatus === "success"
                        ? "text-green-600"
                        : "text-primary"
                    )
                  }
                >
                  {paymentStatus === "success" ? "Hoàn tất" : "Đang chạy"}
                </p>
                {lastCheckedAt && (
                  <p className="text-[10px] text-slate-400">
                    {new Date(lastCheckedAt).toLocaleTimeString("vi-VN")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {loading || !details ? (
          /* Skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {paymentMethod === "VIETQR" && <VietQRView details={details} />}
            {paymentMethod === "ZALOPAY" && (
              <ZaloPayView details={details} onOpenZaloPay={handleOpenZaloPay} />
            )}
            {paymentMethod === "COD" && <CODView details={details} />}
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 space-y-2 shadow-lg">
        {paymentMethod === "ZALOPAY" && details && (
          <button
            onClick={handleOpenZaloPay}
            className="flex w-full items-center justify-center gap-2 bg-primary text-primaryForeground font-black py-3.5 rounded-2xl shadow-md active:opacity-80 transition"
          >
            <CommerceIcon name="wallet" size={20} />
            Mở ZaloPay thanh toán
          </button>
        )}
        <button
          onClick={handleDoneOrders}
          className="flex w-full items-center justify-center gap-1.5 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl text-sm active:bg-slate-200 transition-colors"
        >
          Theo dõi đơn hàng
          <CommerceIcon name="chevron-right" size={17} />
        </button>
      </div>
    </Page>
  );
}
