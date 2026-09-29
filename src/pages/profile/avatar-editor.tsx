import CONFIG from "@/config";
import CommerceIcon from "@/components/commerce-icon";
import { userInfoKeyState, userInfoState } from "@/state";
import { getApiBaseUrl } from "@/utils/request";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import toast from "react-hot-toast";

async function prepareAvatar(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("Vui lòng chọn ảnh dưới 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Thiết bị chưa hỗ trợ xử lý ảnh.");
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 512, 512);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
    const result = canvas.toDataURL("image/jpeg", 0.8);
    if (result.length > 240 * 1024) throw new Error("Ảnh quá chi tiết. Vui lòng chọn ảnh khác.");
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AvatarEditor() {
  const user = useAtomValue(userInfoState);
  const refresh = useSetAtom(userInfoKeyState);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/user/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN) || ""}`,
        },
        body: JSON.stringify({ avatar: preview }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Chưa lưu được ảnh đại diện.");
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify({ ...user, avatar: result.avatar }));
      refresh((key) => key + 1);
      setPreview("");
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chưa lưu được ảnh. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-wrap items-center gap-4" aria-label="Ảnh đại diện" aria-busy={busy}>
      <img src={preview || user?.avatar} alt="Ảnh đại diện" className="h-20 w-20 flex-none rounded-full object-cover border border-skeleton" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="text-sm font-semibold">Ảnh đại diện</div>
        <label className="relative inline-flex min-h-11 items-center gap-2 rounded-lg border border-skeleton px-3 text-sm text-primary focus-within:ring-2 focus-within:ring-primary">
          <CommerceIcon name="edit" size={18} />
          {busy ? "Đang xử lý..." : "Chọn ảnh"}
          <input type="file" aria-label="Chọn ảnh đại diện" accept="image/jpeg,image/png,image/webp" disabled={busy} className="absolute inset-0 w-full opacity-0 cursor-pointer" onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            setBusy(true);
            try { setPreview(await prepareAvatar(file)); }
            catch (error) { toast.error(error instanceof Error ? error.message : "Không đọc được ảnh."); }
            finally { setBusy(false); }
          }} />
        </label>
        <p className="text-xs text-subtitle">JPG, PNG, WebP · Tối đa 10 MB</p>
        {preview && <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={save} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primaryForeground">Lưu ảnh</button>
          <button type="button" disabled={busy} onClick={() => setPreview("")} className="min-h-11 rounded-lg border border-skeleton px-4 text-sm">Hủy</button>
        </div>}
      </div>
    </section>
  );
}
