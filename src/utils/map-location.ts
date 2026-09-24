import { Location } from "@/types";
import { VIETNAM_PROVINCES_2025 } from "./vietnam-address";

export interface ReverseGeocodeResult {
  displayName: string;
  streetAddress?: string;
  ward?: string;
  province?: string;
}

function pickProvince(address: Record<string, string | undefined>) {
  const rawProvince =
    address.state ||
    address.city ||
    address.province ||
    address.county ||
    "";
  return VIETNAM_PROVINCES_2025.find(
    (province) =>
      rawProvince.includes(province) ||
      rawProvince.replace(/^(Tỉnh|Thành phố)\s+/i, "") === province
  );
}

export async function reverseGeocodeLocation(location: Location): Promise<ReverseGeocodeResult | undefined> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(location.lat));
  url.searchParams.set("lon", String(location.lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "vi");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) return undefined;

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  const address = data.address || {};
  const houseAndRoad = [address.house_number, address.road || address.pedestrian]
    .filter(Boolean)
    .join(" ");

  return {
    displayName: data.display_name || "",
    streetAddress:
      houseAndRoad ||
      address.neighbourhood ||
      address.suburb ||
      data.display_name?.split(",").slice(0, 2).join(", "),
    ward: address.quarter || address.suburb || address.village || address.town,
    province: pickProvince(address),
  };
}

export function formatMapLocation(location?: Location) {
  if (!location) return "";
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
}
