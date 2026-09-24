import { useEffect, useState } from "react";
import QRCode from "qrcode";
import CommerceIcon from "./commerce-icon";

type MarketingQrCodeProps = {
  value: string;
  title?: string;
  caption?: string;
  fileName?: string;
  showDownload?: boolean;
  className?: string;
};

export default function MarketingQrCode({
  value,
  title = "QR tiếp thị",
  caption,
  fileName = "saximi-qr-tiep-thi.png",
  showDownload = true,
  className,
}: MarketingQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    setQrDataUrl("");

    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 720,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }).then((dataUrl) => {
      if (mounted) setQrDataUrl(dataUrl);
    });

    return () => {
      mounted = false;
    };
  }, [value]);

  return (
    <div
      className={[
        "rounded-[24px] border border-white/72 bg-white/54 p-3 backdrop-blur-xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="commerce-eyebrow text-primary">{title}</div>
          {caption && (
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {caption}
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-primary">
          <CommerceIcon name="qr" size={20} />
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="rounded-[22px] border border-white/80 bg-white p-3 shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={title}
              className="h-44 w-44 rounded-xl object-contain"
            />
          ) : (
            <div className="h-44 w-44 rounded-xl bg-slate-100 animate-pulse" />
          )}
        </div>
      </div>

      {showDownload && qrDataUrl && (
        <a
          href={qrDataUrl}
          download={fileName}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/70 px-3 py-2.5 text-xs font-black text-primary ring-1 ring-white/80"
        >
          <CommerceIcon name="qr" size={16} />
          Tải QR tiếp thị
        </a>
      )}
    </div>
  );
}
