import { useFrontendNotification } from "@/hooks";
import { AffiliateProfile } from "@/types";
import { buildReferralLink } from "@/utils/platform";
import { useMemo, useState } from "react";
import CommerceIcon from "./commerce-icon";
import MarketingQrCode from "./marketing-qr-code";

type PersonalMarketingLinkProps = {
  profile: AffiliateProfile;
  compact?: boolean;
  embedded?: boolean;
  showQr?: boolean;
};

export default function PersonalMarketingLink({
  profile,
  compact,
  embedded,
  showQr,
}: PersonalMarketingLinkProps) {
  const [copied, setCopied] = useState(false);
  const notify = useFrontendNotification();
  const marketingLink = useMemo(
    () => buildReferralLink(profile.userId),
    [profile.userId]
  );

  const copyLink = async () => {
    await navigator.clipboard.writeText(marketingLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    notify({
      title: "Đã sao chép link tiếp thị",
      message: "Bạn có thể gửi link này cho khách hàng để ghi nhận doanh số.",
      kind: "success",
      topic: "commission",
      actionPath: "/affiliate",
    });
  };

  const shareLink = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    await navigator.share({
      title: "Saximi shop",
      text: `Mua hàng Saximi shop qua link tiếp thị của ${profile.name}`,
      url: marketingLink,
    });
  };

  return (
    <div
      className={
        embedded
          ? "min-w-0 overflow-hidden rounded-[22px] bg-white/42 border border-white/70 p-3 space-y-3"
          : "liquid-card min-w-0 overflow-hidden rounded-[24px] p-4 space-y-3"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="commerce-eyebrow text-primary">
            Link tiếp thị cá nhân
          </div>
          <div className="commerce-title mt-0.5 break-words leading-snug">
            Gắn doanh số cho {profile.name}
          </div>
          {!compact && (
            <div className="commerce-caption mt-1 text-subtitle break-words">
              Khách mở link này sẽ được gắn mã giới thiệu của bạn để tính hoa
              hồng cá nhân.
            </div>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-primary">
          <CommerceIcon name="link" size={22} />
        </div>
      </div>

      <div className="min-w-0 rounded-2xl bg-white/62 border border-white/70 px-3 py-2">
        <div className="text-[10px] font-bold uppercase text-slate-400">
          Mã tiếp thị
        </div>
        <div className="mt-0.5 break-words text-sm font-black text-slate-900">
          {profile.referralCode}
        </div>
      </div>

      <div className="min-w-0 rounded-2xl bg-white/62 border border-white/70 px-3 py-2">
        <div className="text-[10px] font-bold uppercase text-slate-400">
          Đường dẫn cá nhân
        </div>
        <div className="mt-0.5 break-all text-xs font-bold leading-5 text-slate-700">
          {marketingLink}
        </div>
      </div>

      {(showQr ?? !compact) && (
        <MarketingQrCode
          value={marketingLink}
          title="QR tiếp thị cá nhân"
          caption="Khách quét QR này sẽ mở đúng link website chính thức và tự gắn người giới thiệu."
          fileName={`saximi-qr-${profile.userId}.png`}
        />
      )}

      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        <button
          type="button"
          onClick={copyLink}
          className="liquid-button rounded-2xl px-3 py-2.5 text-xs font-black text-primary"
        >
          {copied ? "Đã sao chép" : "Sao chép link"}
        </button>
        <button
          type="button"
          onClick={shareLink}
          className="rounded-2xl bg-primary px-3 py-2.5 text-xs font-black text-primaryForeground"
        >
          Chia sẻ
        </button>
      </div>
    </div>
  );
}
