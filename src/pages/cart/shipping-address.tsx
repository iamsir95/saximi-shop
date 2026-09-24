import { useFrontendNotification } from "@/hooks";
import { browserLocationState, loadableUserInfoState, shippingAddressState } from "@/state";
import { Location, ShippingAddress } from "@/types";
import {
  formatMapLocation,
  reverseGeocodeLocation,
} from "@/utils/map-location";
import {
  buildVietnamAddress,
  VIETNAM_PROVINCES_2025,
} from "@/utils/vietnam-address";
import { getBrowserLocation } from "@/utils/web-capabilities";
import { getApiBaseUrl } from "@/utils/request";
import { useAtom, useAtomValue } from "jotai";
import { useResetAtom } from "jotai/utils";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";

const ADDRESS_TYPES = ["Nhà riêng", "Công ty", "Khác"];
const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

function ShippingAddressPage() {
  const [address, setAddress] = useAtom(shippingAddressState);
  const [browserLocation, setBrowserLocation] = useAtom(browserLocationState);
  const userInfoLoadable = useAtomValue(loadableUserInfoState);
  const resetAddress = useResetAtom(shippingAddressState);
  const navigate = useNavigate();
  const notify = useFrontendNotification();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [addressBook, setAddressBook] = useState<ShippingAddress[]>([]);
  const [loadingAddressBook, setLoadingAddressBook] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(
    address?.location || browserLocation
  );
  const [locationSource, setLocationSource] = useState<
    "CURRENT_LOCATION" | undefined
  >(address?.locationSource === "CURRENT_LOCATION" ? "CURRENT_LOCATION" : undefined);
  const [form, setForm] = useState({
    alias: address?.alias || "Nhà riêng",
    province: address?.province || "Hồ Chí Minh",
    ward: address?.ward || "",
    streetAddress: address?.streetAddress || "",
    name: address?.name || "",
    phone: address?.phone || "",
  });
  const inputClass =
    "h-12 w-full rounded-2xl border border-white/70 bg-white/72 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white";
  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const userInfo = userInfoLoadable.state === "hasData" ? userInfoLoadable.data : undefined;
  const ownerPhone = form.phone || address?.phone || userInfo?.phone || "";
  const applySavedAddress = (savedAddress: ShippingAddress) => {
    setAddress(savedAddress);
    setForm({
      alias: savedAddress.alias || "Nhà riêng",
      province: savedAddress.province || "Hồ Chí Minh",
      ward: savedAddress.ward || "",
      streetAddress: savedAddress.streetAddress || savedAddress.address || "",
      name: savedAddress.name || "",
      phone: savedAddress.phone || ownerPhone,
    });
    setSelectedLocation(savedAddress.location);
    setLocationSource(
      savedAddress.locationSource === "CURRENT_LOCATION" ? "CURRENT_LOCATION" : undefined
    );
  };
  const refreshAddressBook = async (phone = ownerPhone) => {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!/^0\d{9}$/.test(normalizedPhone)) return;
    setLoadingAddressBook(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/user/addresses?phone=${encodeURIComponent(normalizedPhone)}`
      );
      if (!response.ok) throw new Error(`Address book ${response.status}`);
      const data = (await response.json()) as ShippingAddress[];
      setAddressBook(data);
      const defaultAddress = data.find((item) => item.isDefault) || data[0];
      if (!address && defaultAddress) {
        applySavedAddress(defaultAddress);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setLoadingAddressBook(false);
    }
  };
  const deleteSavedAddress = async (savedAddress: ShippingAddress) => {
    if (!savedAddress.id || !ownerPhone) return;
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/user/addresses/${encodeURIComponent(savedAddress.id)}?phone=${encodeURIComponent(ownerPhone)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error(`Delete address ${response.status}`);
      if (address?.id === savedAddress.id) {
        resetAddress();
      }
      await refreshAddressBook();
      toast.success("Đã xóa địa chỉ giao nhận");
    } catch (error) {
      console.warn(error);
      toast.error("Chưa xóa được địa chỉ này");
    }
  };
  const applyLocationToForm = async (
    location: Location,
    source: "CURRENT_LOCATION"
  ) => {
    setSelectedLocation(location);
    setLocationSource(source);
    setBrowserLocation(location);
    setIsResolvingAddress(true);

    try {
      const resolved = await reverseGeocodeLocation(location);
      setForm((current) => ({
        ...current,
        province: resolved?.province || current.province,
        ward: resolved?.ward || current.ward || "Chưa xác định",
        streetAddress:
          resolved?.streetAddress ||
          current.streetAddress ||
          `Vị trí hiện tại (${formatMapLocation(location)})`,
      }));
      toast.success(
        resolved?.displayName
          ? "Đã lấy vị trí và gợi ý địa chỉ"
          : "Đã lưu tọa độ giao hàng"
      );
    } catch (error) {
      console.warn(error);
      setForm((current) => ({
        ...current,
        ward: current.ward || "Chưa xác định",
        streetAddress:
          current.streetAddress ||
          `Vị trí hiện tại (${formatMapLocation(location)})`,
      }));
      toast.success("Đã lưu tọa độ giao hàng");
    } finally {
      setIsResolvingAddress(false);
    }
  };
  const handleUseCurrentLocation = async () => {
    if (isGettingLocation) return;

    if (!navigator.geolocation) {
      toast.error("Trình duyệt này chưa hỗ trợ lấy vị trí.");
      return;
    }

    setIsGettingLocation(true);
    try {
      const location = await getBrowserLocation();
      await applyLocationToForm(location, "CURRENT_LOCATION");
    } catch (error) {
      console.warn(error);
      toast.error("Không lấy được vị trí hiện tại. Bạn có thể nhập địa chỉ thủ công.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    if (!ownerPhone) return;
    refreshAddressBook(ownerPhone);
  }, [userInfo?.phone]);

  return (
    <form
      className="min-h-full flex flex-col justify-between"
      onSubmit={(e) => {
        e.preventDefault();
        const phone = normalizePhone(form.phone || ownerPhone);
        const fullAddress = buildVietnamAddress({
          streetAddress: form.streetAddress,
          ward: form.ward,
          province: form.province,
        });
        if (!form.name.trim()) {
          toast.error("Vui lòng nhập tên người nhận.");
          return;
        }
        if (!/^0\d{9}$/.test(phone)) {
          toast.error("Vui lòng nhập số điện thoại hợp lệ.");
          return;
        }
        if (!form.province.trim() || !form.ward.trim() || !form.streetAddress.trim()) {
          toast.error("Vui lòng nhập đầy đủ địa chỉ nhận hàng.");
          return;
        }
        const newAddress = {
          ...form,
          name: form.name.trim(),
          phone,
          province: form.province.trim(),
          ward: form.ward.trim(),
          streetAddress: form.streetAddress.trim(),
          address: fullAddress,
          location: selectedLocation,
          locationSource,
          isDefault: true,
        };
        setAddress(newAddress as typeof address);
        const savePhone = phone;
        if (/^0\d{9}$/.test(savePhone)) {
          fetch(`${getApiBaseUrl()}/user/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: savePhone,
              address: newAddress,
            }),
          })
            .then((response) => {
              if (!response.ok) throw new Error(`Save address ${response.status}`);
              return response.json();
            })
            .then((savedAddress) => {
              setAddress(savedAddress);
              refreshAddressBook(savePhone);
            })
            .catch((error) => console.warn(error));
        }
        notify({
          title: "Đã cập nhật địa chỉ",
          message: fullAddress || "Địa chỉ giao hàng đã được lưu.",
          kind: "success",
          topic: "delivery",
          actionPath: "/cart",
        });
        navigate(-1);
      }}
    >
      <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto p-4 pb-3 space-y-3 md:grid md:grid-cols-12 md:items-start md:gap-4 md:space-y-0 lg:p-6">
        <div className="liquid-card rounded-[24px] p-4 md:col-span-12">
          <div className="text-[11px] font-bold uppercase text-primary">
            Địa chỉ giao hàng
          </div>
          <div className="mt-1 text-xl font-black leading-6 text-slate-900">
            Bạn muốn nhận hàng ở đâu?
          </div>
          <div className="mt-2 text-xs leading-5 text-subtitle">
            Saximi shop dùng cấu trúc địa chỉ mới: chỉ cần Tỉnh thành,
            Phường/xã và địa chỉ cụ thể.
          </div>
        </div>

        <div className="liquid-card rounded-[24px] p-4 md:col-span-12">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase text-primary">
                Sổ địa chỉ giao nhận
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">
                Chọn nhanh địa chỉ đã lưu
              </div>
            </div>
            {loadingAddressBook && (
              <div className="text-xs font-bold text-subtitle">Đang tải...</div>
            )}
          </div>
          {addressBook.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white/62 px-3 py-3 text-xs leading-5 text-subtitle">
              Chưa có địa chỉ đã lưu. Sau khi lưu địa chỉ đầu tiên, khách hàng có
              thể chọn lại nhanh ở những lần mua sau.
            </div>
          ) : (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {addressBook.map((savedAddress) => (
                <div
                  key={savedAddress.id || savedAddress.address}
                  className="rounded-2xl border border-white/70 bg-white/62 p-3"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => applySavedAddress(savedAddress)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {savedAddress.alias}
                      </span>
                      {savedAddress.isDefault && (
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-black text-primary">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-subtitle">
                      {savedAddress.address}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {savedAddress.name} · {savedAddress.phone}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-danger"
                    onClick={() => deleteSavedAddress(savedAddress)}
                  >
                    Xóa địa chỉ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="liquid-card rounded-[24px] p-4 space-y-4 md:col-span-7 lg:col-span-8">
          <div>
            <div className="mb-2 text-xs font-bold uppercase text-subtitle">
              Nhập địa chỉ giao hàng
            </div>
            <div className="rounded-[22px] bg-white/62 border border-white/80 px-3 py-2 text-xs leading-5 text-slate-600">
              Nhập địa chỉ theo cấu trúc mới: Tỉnh thành, Phường/xã và số nhà,
              tên đường hoặc tòa nhà. Nếu muốn, bạn có thể bấm lấy vị trí hiện
              tại để hệ thống gợi ý nhanh.
            </div>

            {selectedLocation && (
              <div className="mt-2 rounded-[20px] bg-cyan-50 px-3 py-2 text-[11px] leading-5 text-primary">
                Vị trí đã lưu: <strong>{formatMapLocation(selectedLocation)}</strong>
                {locationSource === "CURRENT_LOCATION" && " · vị trí hiện tại"}
              </div>
            )}
          </div>

          <div className="rounded-[22px] border border-white/80 bg-white/62 p-3">
            <div className="text-sm font-black text-slate-900">
              Gợi ý địa chỉ bằng định vị
            </div>
            <div className="mt-1 text-xs leading-5 text-subtitle">
              Trình duyệt chỉ lấy tọa độ hiện tại rồi tự điền gợi ý vào ô địa
              chỉ. Bạn vẫn có thể sửa lại trước khi lưu.
            </div>
            <Button
              htmlType="button"
              fullWidth
              variant="secondary"
              disabled={isResolvingAddress}
              className="!mt-3 !rounded-[20px] !font-bold"
              onClick={handleUseCurrentLocation}
            >
              {isGettingLocation
                ? "Đang định vị..."
                : isResolvingAddress
                ? "Đang nhận diện địa chỉ..."
                : "Lấy vị trí hiện tại"}
            </Button>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold uppercase text-subtitle">
              Lưu địa chỉ này là
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ADDRESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={
                    "rounded-2xl px-3 py-2 text-xs font-bold transition ".concat(
                      form.alias === type
                        ? "bg-primary text-primaryForeground shadow-[0_10px_24px_rgba(0,204,247,0.24)]"
                        : "bg-white/70 text-slate-700"
                    )
                  }
                  onClick={() => updateField("alias", type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-800">
                Tỉnh thành <span className="text-danger">*</span>
              </span>
              <select
                name="province"
                required
                value={form.province}
                className={inputClass}
                onChange={(e) => updateField("province", e.currentTarget.value)}
              >
                {VIETNAM_PROVINCES_2025.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-800">
                Phường/xã <span className="text-danger">*</span>
              </span>
              <input
                name="ward"
                className={inputClass}
                placeholder="Ví dụ: Phường Sài Gòn"
                required
                value={form.ward}
                onChange={(e) => updateField("ward", e.currentTarget.value)}
              />
            </label>

            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="font-semibold text-slate-800">
                Số nhà, đường, tòa nhà <span className="text-danger">*</span>
              </span>
              <input
                name="streetAddress"
                className={inputClass}
                placeholder="Ví dụ: 12 Nguyễn Hữu Cảnh, sảnh A chung cư"
                required
                value={form.streetAddress}
                onChange={(e) =>
                  updateField("streetAddress", e.currentTarget.value)
                }
              />
            </label>
          </div>

          <div className="rounded-2xl bg-cyan-50 px-3 py-2 text-xs leading-5 text-primary">
            Không cần nhập Quận/Huyện. Hệ thống sẽ ghép địa chỉ theo cơ cấu
            mới để shop giao hàng chính xác hơn.
          </div>
        </div>

        <div className="liquid-card rounded-[24px] p-4 space-y-4 md:col-span-5 md:sticky md:top-4 lg:col-span-4">
          <div>
            <div className="text-base font-bold text-slate-900">
              Người nhận hàng
            </div>
            <div className="mt-1 text-xs text-subtitle">
              Shop sẽ dùng thông tin này để liên hệ trước khi giao.
            </div>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">Tên người nhận</span>
            <input
              name="name"
              className={inputClass}
              placeholder="Nhập tên người nhận"
              required
              value={form.name}
              onChange={(e) => updateField("name", e.currentTarget.value)}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-slate-800">Số điện thoại</span>
            <input
              name="phone"
              className={inputClass}
              inputMode="tel"
              placeholder="0912345678"
              required
              pattern="0[0-9]{9}"
              value={form.phone}
              onChange={(e) => updateField("phone", e.currentTarget.value)}
            />
          </label>
        </div>

        <Button
          htmlType="button"
          fullWidth
          className="!bg-white/70 !text-danger !rounded-2xl md:col-span-12"
          type="danger"
          onClick={() => {
            resetAddress();
            notify({
              title: "Đã xóa địa chỉ",
              message: "Bạn có thể thêm địa chỉ mới trước khi đặt hàng.",
              kind: "info",
              topic: "delivery",
            });
            navigate(-1);
          }}
        >
          Xóa địa chỉ này
        </Button>
      </div>
      <div className="liquid-bar border-t border-white/70 p-4 pb-sb">
        <div className="mx-auto w-full max-w-6xl">
          <Button htmlType="submit" fullWidth className="!rounded-2xl">
            Lưu địa chỉ nhận hàng
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ShippingAddressPage;
