import HorizontalDivider from "@/components/horizontal-divider";
import Section from "@/components/section";
import { StationSkeleton } from "@/components/skeleton";
import TransitionLink from "@/components/transition-link";
import CommerceIcon from "@/components/commerce-icon";
import {
  deliveryModeState,
  selectedStationState,
  shippingAddressState,
} from "@/state";
import { useAtom, useAtomValue } from "jotai";
import { Suspense } from "react";
import DeliverySummary from "./delivery-summary";

function ShippingAddressSummary() {
  const shippingAddress = useAtomValue(shippingAddressState);

  if (!shippingAddress) {
    return (
      <TransitionLink
        className="flex flex-col space-y-2 justify-center items-center p-4 w-full"
        to="/shipping-address"
      >
        <CommerceIcon name="map-pin" size={30} className="text-primary" />
        <div className="flex space-x-1 items-center text-center p-2">
          <CommerceIcon name="plus" size={16} strokeWidth={2.4} />
          <span className="text-sm font-medium">Thêm địa chỉ nhận hàng</span>
        </div>
      </TransitionLink>
    );
  }

  return (
    <DeliverySummary
      icon={<CommerceIcon name="map-pin" size={24} className="text-primary" />}
      title="Địa chỉ nhận hàng"
      subtitle={shippingAddress.alias}
      description={shippingAddress.address}
      linkTo="/shipping-address"
    />
  );
}

function SelectedStationSummary() {
  const selectedStation = useAtomValue(selectedStationState);

  if (!selectedStation) {
    return (
      <DeliverySummary
        icon={<CommerceIcon name="home" size={24} className="text-primary" />}
        title="Chọn điểm nhận hàng"
        subtitle="Saximi shop"
        description="Vui lòng chọn điểm tự đến lấy gần bạn"
        linkTo="/stations"
      />
    );
  }

  const title =
    selectedStation.sourceType === "PRESIDENT" ||
    selectedStation.sourceType === "BRANCH_LEADER"
      ? "Tự đến lấy tại địa chỉ hội"
      : "Nhận hàng tại";
  return (
    <DeliverySummary
      icon={<CommerceIcon name="home" size={24} className="text-primary" />}
      title={title}
      subtitle={
        selectedStation.levelName
          ? `${selectedStation.levelName} - ${selectedStation.name}`
          : selectedStation.name
      }
      description={selectedStation.address}
      linkTo="/stations"
    />
  );
}

function Delivery() {
  const [selectedDeliveryMode, setSelectedDeliveryMode] =
    useAtom(deliveryModeState);

  return (
    <Section title="Hình thức nhận hàng">
      <div className="grid grid-cols-2 gap-3 p-4 pt-2">
        {(
          [
            {
              type: "shipping",
              name: "Giao tận nơi",
              icon: <CommerceIcon name="delivery" size={20} />,
            },
            {
              type: "pickup",
              name: "Tự đến lấy",
              icon: <CommerceIcon name="package" size={20} />,
            },
          ] as const
        ).map((option) => (
          <button
            key={option.type}
            className={"flex justify-center items-center gap-2 text-sm font-bold bg-white/72 rounded-[20px] min-h-12 px-3.5 border ".concat(
              selectedDeliveryMode === option.type
                ? "border-primary text-primary shadow-sm"
                : "border-white/80 text-slate-700"
            )}
            onClick={() => setSelectedDeliveryMode(option.type)}
          >
            {option.icon}
            <span>{option.name}</span>
          </button>
        ))}
      </div>
      <HorizontalDivider />
      {selectedDeliveryMode === "shipping" ? (
        <ShippingAddressSummary />
      ) : (
        <Suspense fallback={<StationSkeleton />}>
          <SelectedStationSummary />
        </Suspense>
      )}
    </Section>
  );
}

export default Delivery;
