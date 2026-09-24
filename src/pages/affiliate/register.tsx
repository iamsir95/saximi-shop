import { useMemo, useState } from "react";
import { Box, Button, Input, Page, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import toast from "react-hot-toast";
import { affiliatePortalState, loadableUserInfoState } from "@/state";
import { AffiliateRegistrationResponse } from "@/types";
import { requestWithPost } from "@/utils/request";
import { findAffiliateForUser } from "@/utils/affiliate";
import { getBasePath } from "@/utils/zma";
import PersonalMarketingLink from "@/components/personal-marketing-link";

export default function AffiliateRegisterPage() {
  const navigate = useNavigate();
  const userInfo = useAtomValue(loadableUserInfoState);
  const portalLoadable = useAtomValue(
    useMemo(() => loadable(affiliatePortalState), [])
  );
  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const affiliates =
    portalLoadable.state === "hasData" ? portalLoadable.data?.affiliates || [] : [];
  const existingAffiliate = findAffiliateForUser(affiliates, currentUser);
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại để đăng ký đại lý.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestWithPost<
        { name: string; phone: string; address: string; note: string },
        AffiliateRegistrationResponse
      >("/affiliate/register", {
        name,
        phone,
        address,
        note,
      });
      toast.success(result.message || "Đã tạo khu vực đại lý");
      window.setTimeout(() => {
        window.location.href = `${getBasePath()}/affiliate`;
      }, 700);
    } catch (error: any) {
      toast.error(error?.message || "Không thể đăng ký đại lý");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page className="min-h-screen pb-24">
      <Box className="p-4 space-y-4">
        <Box
          className="rounded-[28px] p-5 text-white shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 204, 247, 0.92), rgba(20, 184, 166, 0.76))",
            backdropFilter: "blur(24px) saturate(1.35)",
          }}
        >
          <Text className="text-xs uppercase tracking-wide font-bold text-slate-700/72">
            Đăng ký đại lý Saximi shop
          </Text>
          <Text className="mt-2 text-2xl font-black text-primaryForeground">
            Bán hàng, tích điểm hoa hồng
          </Text>
          <Text className="mt-2 text-sm text-slate-700/82 leading-5">
            Sau khi đăng ký, bạn có link giới thiệu riêng. Mỗi đơn phát sinh từ
            link sẽ tạo hoa hồng và quy đổi thành điểm hoa hồng trên tài khoản.
          </Text>
        </Box>

        {existingAffiliate ? (
          <Box className="liquid-card rounded-[24px] p-4 space-y-3">
            <Text className="font-bold text-slate-900">
              Bạn đã có khu vực đại lý
            </Text>
            <Text className="text-xs text-slate-500 leading-5">
              Tài khoản {existingAffiliate.phone} đang là{" "}
              <strong>{existingAffiliate.levelName}</strong>. Vào cổng đại lý
              để lấy link giới thiệu, xem ví hoa hồng và điểm bán hàng.
            </Text>
            <PersonalMarketingLink profile={existingAffiliate} compact embedded />
            <Button
              onClick={() => navigate("/affiliate")}
              className="w-full rounded-2xl bg-primary text-primaryForeground font-bold"
            >
              Vào cổng đại lý
            </Button>
          </Box>
        ) : (
          <Box className="liquid-card rounded-[24px] p-4 space-y-4">
            <Box>
              <Text className="font-bold text-slate-900">Thông tin đăng ký</Text>
              <Text className="text-xs text-slate-500 mt-1 leading-5">
                Saximi shop sẽ tạo bạn thành Đại lý/Chi hội trưởng mới đăng ký.
                Admin có thể duyệt, đổi cấp bậc và gắn tuyến cấp trên sau.
              </Text>
            </Box>

            <Box className="space-y-3">
              <Input
                label="Họ tên đại lý"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nhập họ tên"
              />
              <Input
                label="Số điện thoại"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="VD: 0912345678"
              />
              <Input
                label="Địa chỉ nhận hàng/điểm bán"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Tỉnh thành, Phường/xã, số nhà..."
              />
              <Input.TextArea
                label="Ghi chú"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Khu vực bán hàng, nhu cầu nhập hàng, người giới thiệu..."
                rows={3}
              />
            </Box>

            <Box className="rounded-2xl bg-white/58 border border-white/70 p-3">
              <Text className="text-xs text-slate-600 leading-5">
                Mặc định hoa hồng trực tiếp là 8%. Điểm được tính theo doanh
                số bán được x phần trăm hoa hồng; 1.000 VND hoa hồng = 1 điểm.
              </Text>
            </Box>

            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
              className="w-full rounded-2xl bg-emerald-600 text-white font-bold"
            >
              Đăng ký làm đại lý
            </Button>
          </Box>
        )}
      </Box>
    </Page>
  );
}
