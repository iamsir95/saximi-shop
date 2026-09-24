import CONFIG from "@/config";
import { shippingAddressState, userInfoKeyState, userInfoState } from "@/state";
import { ShippingAddress } from "@/types";
import { getApiBaseUrl } from "@/utils/request";
import {
  buildVietnamAddress,
  VIETNAM_PROVINCES_2025,
} from "@/utils/vietnam-address";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "zmp-ui";

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

function ProfileEditorPage() {
  const navigate = useNavigate();
  const userInfo = useAtomValue(userInfoState);
  const setUserInfoKey = useSetAtom(userInfoKeyState);
  const setShippingAddress = useSetAtom(shippingAddressState);
  const refreshUserInfo = () => setUserInfoKey((key) => key + 1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: userInfo?.name || "",
    phone: userInfo?.phone || "",
    email: userInfo?.email || "",
    province: userInfo?.province || "Hồ Chí Minh",
    ward: userInfo?.ward || "",
    streetAddress: userInfo?.streetAddress || userInfo?.address || "",
  });
  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="h-full flex flex-col justify-between"
      onSubmit={async (e) => {
        e.preventDefault();
        const phone = normalizePhone(form.phone);
        const fullAddress = buildVietnamAddress({
          streetAddress: form.streetAddress,
          ward: form.ward,
          province: form.province,
        });
        if (!form.name.trim()) {
          toast.error("Vui lòng nhập họ tên.");
          return;
        }
        if (!/^0\d{9}$/.test(phone)) {
          toast.error("Vui lòng nhập số điện thoại hợp lệ.");
          return;
        }
        const newUserInfo = {
          ...userInfo,
          ...form,
          name: form.name.trim(),
          phone,
          email: form.email.trim(),
          province: form.province.trim(),
          ward: form.ward.trim(),
          streetAddress: form.streetAddress.trim(),
          address: fullAddress,
        };
        const defaultShippingAddress: ShippingAddress = {
          alias: "Mặc định",
          name: form.name.trim(),
          phone,
          address: fullAddress,
          streetAddress: form.streetAddress.trim(),
          ward: form.ward.trim(),
          province: form.province.trim(),
          isDefault: true,
        };

        setSaving(true);
        try {
          const profileResponse = await fetch(`${getApiBaseUrl()}/user/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUserInfo),
          });
          if (!profileResponse.ok) throw new Error(`Profile ${profileResponse.status}`);
          const savedUser = await profileResponse.json();

          const addressResponse = await fetch(`${getApiBaseUrl()}/user/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone,
              address: defaultShippingAddress,
            }),
          });
          const savedAddress = addressResponse.ok
            ? ((await addressResponse.json()) as ShippingAddress)
            : defaultShippingAddress;

          localStorage.setItem(
            CONFIG.STORAGE_KEYS.USER_INFO,
            JSON.stringify({ ...newUserInfo, ...savedUser })
          );
          setShippingAddress(savedAddress);
        } catch (error) {
          console.warn(error);
          toast.error("Chưa lưu được thông tin. Vui lòng thử lại.");
          return;
        } finally {
          setSaving(false);
        }
        refreshUserInfo();
        toast.success("Đã cập nhật thông tin và địa chỉ mặc định");
        navigate(-1);
      }}
    >
      <div className="bg-section p-4 grid gap-4">
        <div className="liquid-card rounded-[24px] p-4">
          <div className="commerce-eyebrow text-primary">Hồ sơ mua hàng</div>
          <div className="commerce-title mt-1">Thông tin cá nhân và địa chỉ mặc định</div>
          <div className="commerce-caption mt-1 text-subtitle">
            Thông tin này sẽ được dùng cho đơn hàng và tự điền ở bước giao nhận.
          </div>
        </div>
        <Input name="name" label="Họ tên" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <Input
          name="phone"
          label="Số điện thoại"
          required
          pattern="0[0-9]{9}"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        <Input
          name="email"
          label="Email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <div className="rounded-2xl bg-cyan-50 px-3 py-2 text-xs leading-5 text-primary">
          Địa chỉ bên dưới sẽ được đặt làm địa chỉ nhận hàng mặc định.
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Tỉnh thành</span>
          <select
            name="province"
            value={form.province}
            onChange={(e) => update("province", e.currentTarget.value)}
            className="h-11 w-full rounded-xl border border-skeleton bg-white/70 px-3 text-sm outline-none focus:border-primary"
          >
            {VIETNAM_PROVINCES_2025.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <Input
          name="ward"
          label="Phường/xã"
          placeholder="Ví dụ: Phường Sài Gòn, Xã Bình Hưng"
          value={form.ward}
          onChange={(e) => update("ward", e.target.value)}
        />
        <Input
          name="streetAddress"
          label="Số nhà, đường, tòa nhà"
          placeholder="Ví dụ: 12 Nguyễn Hữu Cảnh"
          value={form.streetAddress}
          onChange={(e) => update("streetAddress", e.target.value)}
        />
      </div>
      <div className="p-6 pt-4 bg-section">
        <Button htmlType="submit" fullWidth disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}

export default ProfileEditorPage;
