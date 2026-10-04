import { useMemo, useState } from "react";

type GuideTab = "android" | "ios";

function detectPreferredTab(): GuideTab {
  if (typeof navigator === "undefined") return "android";
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) ? "ios" : "android";
}

function PhoneMockup({ platform }: { platform: GuideTab }) {
  const isAndroid = platform === "android";
  const accent = isAndroid ? "bg-primary text-primaryForeground" : "secondary-soft";
  const browserLabel = isAndroid ? "Chrome" : "Safari";
  const actionLabel = isAndroid ? "Thêm vào màn hình chính" : "Thêm vào MH chính";
  const iconLabel = isAndroid ? "⋮" : "□↑";

  return (
    <div className="mx-auto w-full max-w-[220px] rounded-[30px] border border-slate-900/10 bg-slate-950 p-2 shadow-[0_18px_44px_rgba(15,23,42,0.2)]">
      <div className="overflow-hidden rounded-[24px] bg-slate-50">
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-auto rounded-full bg-white px-2 py-1 text-[9px] font-black text-slate-500">
            {browserLabel}
          </span>
        </div>
        <div className="space-y-2 p-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl brand-action" />
              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-20 rounded-full bg-slate-200" />
                <div className="mt-1.5 h-2 w-14 rounded-full bg-slate-100" />
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-base font-black ${accent}`}>
                {iconLabel}
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="h-2.5 w-24 rounded-full bg-slate-200" />
            <div className="mt-2 grid gap-1.5">
              <div className="h-2 rounded-full bg-slate-100" />
              <div className="h-2 w-3/4 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-center text-[10px] font-black ${accent}`}>
            {actionLabel}
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {["S", "G", "C", "M"].map((item) => (
              <div key={item} className="flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[10px] font-black text-slate-500 shadow-sm">
                  {item}
                </div>
                <div className="h-1 w-7 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const guides: Record<GuideTab, { title: string; subtitle: string; steps: string[]; note: string }> = {
  android: {
    title: "Android mở bằng Chrome",
    subtitle: "Dùng Chrome để đưa Saximi shop ra màn hình chính như một ứng dụng.",
    steps: [
      "Mở website Saximi shop bằng trình duyệt Chrome.",
      "Bấm biểu tượng ba chấm ở góc trên bên phải.",
      "Chọn Thêm vào màn hình chính hoặc Cài đặt ứng dụng.",
      "Đặt tên Saximi shop, bấm Thêm và mở từ icon mới trên màn hình chính.",
    ],
    note: "Nếu chưa thấy nút thêm, hãy tải lại trang bằng Chrome hoặc kiểm tra website đang mở bằng HTTPS.",
  },
  ios: {
    title: "iPhone/iPad mở bằng Safari",
    subtitle: "iOS cần mở bằng Safari để có nút thêm website ra màn hình chính.",
    steps: [
      "Mở website Saximi shop bằng Safari, không dùng trình duyệt trong Zalo/Facebook.",
      "Bấm nút Chia sẻ ở thanh công cụ Safari.",
      "Kéo xuống và chọn Thêm vào Màn hình chính.",
      "Kiểm tra tên Saximi shop, bấm Thêm và dùng icon ngoài màn hình chính.",
    ],
    note: "Trên iPhone, tính năng nhận thông báo thường hoạt động tốt nhất sau khi website đã được thêm ra màn hình chính.",
  },
};

export default function InstallAppGuide() {
  const initialTab = useMemo(() => detectPreferredTab(), []);
  const [activeTab, setActiveTab] = useState<GuideTab>(initialTab);
  const guide = guides[activeTab];

  return (
    <div className="liquid-card rounded-[24px] p-4 space-y-4 text-slate-900">
      <div>
        <div className="commerce-eyebrow text-secondaryDark">Đưa ứng dụng ra màn hình chính</div>
        <div className="commerce-title mt-0.5">Mở Saximi shop nhanh như app</div>
        <div className="commerce-caption text-subtitle mt-1">
          Chọn đúng thiết bị để xem hướng dẫn trực quan. Sau khi thêm icon, khách có thể mở shop nhanh, nhận thông báo và theo dõi đơn hàng thuận tiện hơn.
        </div>
      </div>

      <div className="grid grid-cols-2 rounded-2xl bg-white/58 p-1 ring-1 ring-white/70">
        {(["android", "ios"] as GuideTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-3 py-2 text-xs font-black transition ${
              activeTab === tab
                ? "brand-action text-primaryForeground shadow-[0_10px_22px_rgba(0,204,247,0.18)]"
                : "text-slate-500"
            }`}
          >
            {tab === "android" ? "Android" : "iPhone/iPad"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        <PhoneMockup platform={activeTab} />
        <div className="space-y-3">
          <div>
            <div className="text-base font-black text-slate-900">{guide.title}</div>
            <div className="commerce-caption text-subtitle mt-1">{guide.subtitle}</div>
          </div>
          <div className="space-y-2">
            {guide.steps.map((step, index) => (
              <div key={step} className="flex gap-2 rounded-2xl bg-white/58 px-3 py-2 ring-1 ring-white/70">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primaryForeground">
                  {index + 1}
                </div>
                <div className="text-xs font-semibold leading-5 text-slate-700">{step}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-cyan-50/75 px-3 py-2 text-xs font-semibold leading-5 text-primary ring-1 ring-white/70">
            {guide.note}
          </div>
        </div>
      </div>
    </div>
  );
}
