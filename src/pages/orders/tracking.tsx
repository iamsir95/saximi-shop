import Section from "@/components/section";
import type { OrderTracking } from "@/types";

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function TrackingTimeline({
  tracking,
}: {
  tracking?: OrderTracking;
}) {
  if (!tracking) {
    return (
      <Section title="Theo dõi vận chuyển" className="rounded-lg">
        <div className="p-4 text-sm text-inactive">
          Chưa có dữ liệu theo dõi cho đơn hàng này.
        </div>
      </Section>
    );
  }

  return (
    <Section title="Theo dõi vận chuyển" className="rounded-lg">
      <div className="px-4 py-3 space-y-4">
        <div className="rounded-lg bg-background p-3">
          <div className="text-xs text-inactive">Thanh toán tự động</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="text-sm font-medium">
              {tracking.payment.message}
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2.5 py-1 text-3xs font-semibold ".concat(
                  tracking.payment.status === "success"
                    ? "bg-primary text-primaryForeground"
                    : tracking.payment.status === "failed"
                    ? "bg-danger text-white"
                    : "bg-skeleton text-foreground"
                )
              }
            >
              {tracking.payment.status === "success"
                ? "Đã thanh toán"
                : tracking.payment.status === "failed"
                ? "Thất bại"
                : tracking.payment.autoCheckEnabled
                ? "Đang kiểm tra"
                : "Chờ xử lý"}
            </span>
          </div>
          <div className="mt-1 text-3xs text-inactive">
            Cập nhật: {formatTime(tracking.payment.lastCheckedAt)}
          </div>
        </div>

        {tracking.delivery && (
          <div className="rounded-lg border border-skeleton p-3">
            <div className="text-xs font-medium">
              {tracking.delivery.driverName} · {tracking.delivery.vehicleNumber}
            </div>
            <div className="mt-1 text-3xs text-inactive">
              SĐT tài xế: {tracking.delivery.driverPhone}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-skeleton p-3">
          <div className="text-xs text-inactive">Tuyến giao qua hội</div>
          <div className="mt-1 text-sm font-medium">
            {tracking.distribution.message}
          </div>
          <div className="mt-2 grid gap-2">
            {tracking.distribution.president && (
              <div className="rounded-lg bg-background px-3 py-2">
                <div className="text-3xs font-semibold text-primary">
                  {tracking.distribution.president.levelName || "Chủ tịch hội cấp trên"}
                </div>
                <div className="text-xs font-medium">
                  {tracking.distribution.president.name}
                </div>
                <div className="text-3xs text-inactive">
                  {tracking.distribution.president.phone}
                </div>
              </div>
            )}
            {tracking.distribution.branchLeader && (
              <div className="rounded-lg bg-background px-3 py-2">
                <div className="text-3xs font-semibold text-primary">
                  {tracking.distribution.branchLeader.levelName || "Chi hội trưởng trực thuộc"}
                </div>
                <div className="text-xs font-medium">
                  {tracking.distribution.branchLeader.name}
                </div>
                <div className="text-3xs text-inactive">
                  {tracking.distribution.branchLeader.phone}
                </div>
              </div>
            )}
            {tracking.distribution.mode === "DIRECT" && (
              <div className="rounded-lg bg-background px-3 py-2 text-xs text-inactive">
                Không có tuyến Chủ tịch hội/Chi hội trưởng cho đơn này.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {tracking.timeline.map((event, index) => (
            <div key={event.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={
                    "h-4 w-4 rounded-full border-2 ".concat(
                      event.status === "done"
                        ? "border-primary bg-primary"
                        : event.status === "current"
                        ? "border-primary bg-section"
                        : event.status === "failed"
                        ? "border-danger bg-danger"
                        : "border-skeleton bg-section"
                    )
                  }
                />
                {index < tracking.timeline.length - 1 && (
                  <div className="mt-1 h-10 w-px bg-skeleton" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{event.label}</div>
                  {event.time && (
                    <div className="text-3xs text-inactive">
                      {formatTime(event.time)}
                    </div>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-inactive">
                  {event.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
