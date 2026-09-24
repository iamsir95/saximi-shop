import { StationSkeleton } from "@/components/skeleton";
import { useFrontendNotification } from "@/hooks";
import { selectedStationIndexState, stationsState } from "@/state";
import type { Station } from "@/types";
import { useAtomValue, useSetAtom } from "jotai";
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";

function Station({
  station,
  onSelect,
}: {
  station: Station & { distance?: string };
  onSelect: () => void;
}) {
  const isAffiliateStation =
    station.sourceType === "PRESIDENT" || station.sourceType === "BRANCH_LEADER";
  const badge =
    station.sourceType === "PRESIDENT"
      ? "Chủ tịch hội"
      : station.sourceType === "BRANCH_LEADER"
        ? "Chi hội trưởng"
        : "Điểm cửa hàng";

  return (
    <button
      className="liquid-card flex items-center space-x-4 rounded-[22px] p-3 pr-2 text-left"
      onClick={onSelect}
    >
      <img
        src={station.image}
        className="h-14 w-14 rounded-2xl bg-skeleton object-cover"
        alt={station.name}
      />
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-slate-800">{station.name}</div>
          <span
            className={
              "flex-none rounded-full px-2 py-0.5 text-[10px] font-bold ".concat(
                isAffiliateStation
                  ? "bg-cyan-50 text-primary"
                  : "bg-white/70 text-subtitle"
              )
            }
          >
            {badge}
          </span>
        </div>
        {station.levelName && (
          <div className="text-[11px] font-semibold text-primary">
            {station.levelName}
          </div>
        )}
        <div className="text-xs text-inactive">{station.address}</div>
        {station.phone && (
          <div className="text-xs text-slate-600">Liên hệ: {station.phone}</div>
        )}
        {station.distance && (
          <div className="text-xs text-primary">{station.distance}</div>
        )}
      </div>
    </button>
  );
}

function Stations() {
  const stations = useAtomValue(stationsState);
  const setSelectedStation = useSetAtom(selectedStationIndexState);
  const navigate = useNavigate();
  const notify = useFrontendNotification();

  const affiliateStations = stations.filter(
    (station) =>
      station.sourceType === "PRESIDENT" ||
      station.sourceType === "BRANCH_LEADER"
  );
  const storeStations = stations.filter(
    (station) =>
      station.sourceType !== "PRESIDENT" &&
      station.sourceType !== "BRANCH_LEADER"
  );

  return (
    <>
      <div className="liquid-card rounded-[24px] p-4">
        <div className="text-[11px] font-bold uppercase text-primary">
          Điểm tự đến lấy
        </div>
        {affiliateStations.length > 0 ? (
          <>
            <div className="mt-1 text-lg font-black leading-6 text-slate-900">
              Chọn địa chỉ tuyến Hội LHPN của bạn
            </div>
            <div className="mt-2 text-xs text-subtitle">
              Chỉ hội viên mở link Chi hội/Tổ phụ nữ mới thấy địa chỉ Chi hội
              trưởng hoặc Chủ tịch Hội cấp trên.
            </div>
          </>
        ) : (
          <>
            <div className="mt-1 text-lg font-black leading-6 text-slate-900">
              Chọn điểm nhận Saximi shop gần bạn
            </div>
            <div className="mt-2 text-xs text-subtitle">
              Địa chỉ cấp trên chỉ hiển thị khi bạn mở Saximi shop bằng link
              giới thiệu của Chi hội/Tổ phụ nữ.
            </div>
          </>
        )}
      </div>

      {affiliateStations.length > 0 && (
        <div className="pt-2 text-[11px] font-bold uppercase text-primary">
          Tuyến Hội LHPN của bạn
        </div>
      )}

      {affiliateStations.map((station) => {
        const stationIndex = stations.findIndex((item) => item.id === station.id);
        return (
          <Station
            key={station.id}
            station={station}
            onSelect={() => {
              setSelectedStation(stationIndex);
              notify({
                title: "Đã chọn điểm nhận hàng",
                message: `${station.name} sẽ là điểm tự đến lấy của bạn.`,
                kind: "success",
                topic: "delivery",
                actionPath: "/cart",
              });
              navigate(-1);
            }}
          />
        );
      })}

      {storeStations.length > 0 && (
        <div className="pt-2 text-[11px] font-bold uppercase text-subtitle">
          Điểm nhận cửa hàng
        </div>
      )}
      {storeStations.map((station) => {
        const stationIndex = stations.findIndex((item) => item.id === station.id);
        return (
          <Station
            key={station.id}
            station={station}
            onSelect={() => {
              setSelectedStation(stationIndex);
              notify({
                title: "Đã thay đổi điểm nhận hàng",
                message: `${station.name} sẽ là điểm nhận hàng của bạn.`,
                kind: "success",
                topic: "delivery",
                actionPath: "/cart",
              });
              navigate(-1);
            }}
          />
        );
      })}
    </>
  );
}

function StationsPage() {
  return (
    <div className="p-4 space-y-2 flex flex-col">
      <Suspense
        fallback={
          <>
            <StationSkeleton />
            <StationSkeleton />
            <StationSkeleton />
            <StationSkeleton />
          </>
        }
      >
        <Stations />
      </Suspense>
    </div>
  );
}

export default StationsPage;
