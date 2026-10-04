import ProfileActions from "./actions";
import Points from "./points";
import UserInfo from "./user-info";
import WebCapabilitiesCard from "./web-capabilities";
import LoginDevices from "./login-devices";
import LoginPinCard from "./login-pin";
import InstallAppGuide from "./install-app-guide";
import Register from "./register";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import {
  affiliatePortalState,
  affiliateReferrerIdState,
  loadableUserInfoState,
  userInfoKeyState,
} from "@/state";
import { loadable } from "jotai/utils";
import { useMemo } from "react";
import {
  findAffiliateByReferrer,
  findAffiliateForUser,
  getAffiliateCommissionRate,
  getAffiliateRoleDescription,
  getAffiliateRoleLabel,
} from "@/utils/affiliate";
import { formatPrice } from "@/utils/format";
import CONFIG from "@/config";
import { useFrontendNotification } from "@/hooks";
import PersonalMarketingLink from "@/components/personal-marketing-link";

function AccountRoleCard() {
  const navigate = useNavigate();
  const refreshUserInfo = useSetAtom(userInfoKeyState);
  const notify = useFrontendNotification();
  const userInfo = useAtomValue(loadableUserInfoState);
  const referrerId = useAtomValue(affiliateReferrerIdState);
  const portalLoadable = useAtomValue(
    useMemo(() => loadable(affiliatePortalState), [])
  );

  const affiliates =
    portalLoadable.state === "hasData" ? portalLoadable.data.affiliates : [];
  const portal = portalLoadable.state === "hasData" ? portalLoadable.data : undefined;
  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const activeAffiliate = findAffiliateForUser(affiliates, currentUser);
  const referrerAffiliate = findAffiliateByReferrer(affiliates, referrerId);
  const isAffiliate = Boolean(activeAffiliate);
  const isLoggedIn = Boolean(currentUser?.phone);
  const commissionRate = getAffiliateCommissionRate(activeAffiliate, portal);
  const detailRows = [
    {
      label: "Trạng thái",
      value: isLoggedIn ? "Đã xác thực số điện thoại" : "Chưa đăng nhập",
      tone: isLoggedIn ? "text-primary" : "text-secondaryDark",
    },
    {
      label: "Loại tài khoản",
      value: getAffiliateRoleLabel(activeAffiliate, portal),
      tone: "text-slate-900",
    },
    {
      label: "Số điện thoại",
      value: currentUser?.phone || "Chưa cập nhật",
      tone: "text-slate-700",
    },
    ...(activeAffiliate
      ? [
          {
            label: "Mã giới thiệu",
            value: activeAffiliate.referralCode,
            tone: "text-primary",
          },
          {
            label: "Tỷ lệ hoa hồng",
            value: `${commissionRate || 0}%`,
            tone: "text-primary",
          },
          {
            label: "Doanh số ghi nhận",
            value: formatPrice(activeAffiliate.totalSales || 0),
            tone: "text-rose-700",
          },
        ]
      : [
          {
            label: "Người giới thiệu",
            value: referrerAffiliate
              ? `${referrerAffiliate.name} - ${getAffiliateRoleLabel(referrerAffiliate, portal)}`
              : "Chưa có",
            tone: referrerAffiliate ? "text-primary" : "text-slate-500",
          },
        ]),
  ];
  const handleLogout = () => {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    refreshUserInfo((key) => key + 1);
    notify({
      title: "Đã đăng xuất",
      message: "Bạn có thể đăng nhập lại bằng số điện thoại bất cứ lúc nào.",
      kind: "info",
      topic: "account",
      actionPath: "/login",
    });
  };

  return (
    <div className="liquid-card text-slate-900 rounded-[24px] p-3.5 sm:p-4 space-y-3 min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
              activeAffiliate?.role === "PRESIDENT"
                ? "secondary-soft"
                : activeAffiliate?.role === "BRANCH_LEADER"
                  ? "bg-primary text-primaryForeground shadow-[0_10px_24px_rgba(0,204,247,0.22)]"
                  : "bg-slate-700/85 text-white shadow-slate-500/15"
            }`}
          >
            {activeAffiliate?.role === "PRESIDENT"
              ? "CT"
              : activeAffiliate?.role === "BRANCH_LEADER"
                ? "CH"
                : "KH"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="commerce-eyebrow text-slate-400">
              Nhận diện tài khoản
            </div>
            <div className="commerce-title break-words leading-snug">
              {getAffiliateRoleLabel(activeAffiliate, portal)}
            </div>
            <div className="commerce-caption text-subtitle mt-0.5 break-words">
              {getAffiliateRoleDescription(activeAffiliate, portal)}
            </div>
          </div>
        </div>

        {isAffiliate && (
          <button
            onClick={() => navigate("/affiliate")}
            className="commerce-caption liquid-button text-primary font-bold px-3 py-2 rounded-full whitespace-nowrap min-w-[76px] text-center self-start"
          >
            Quản lý
          </button>
        )}
        {!isAffiliate && (
          <button
            onClick={() => {
              if (isLoggedIn) {
                handleLogout();
                return;
              }
              navigate("/login", { viewTransition: true });
            }}
            className="commerce-caption liquid-button text-primary font-bold px-3 py-2 rounded-full whitespace-nowrap min-w-[86px] text-center self-start"
          >
            {isLoggedIn ? "Đăng xuất" : "Đăng nhập"}
          </button>
        )}
      </div>

      {isLoggedIn && !isAffiliate && (
        <div className="rounded-2xl bg-cyan-50/70 border border-white/70 px-3 py-2 commerce-caption text-primary break-words">
          Đã đăng nhập bằng số điện thoại{" "}
          <strong>{currentUser?.phone}</strong>. Bạn có thể theo dõi đơn hàng
          và lưu địa chỉ giao hàng trên tài khoản này.
        </div>
      )}

      {referrerAffiliate && !isAffiliate && (
        <div className="promo-spotlight rounded-2xl px-3 py-2">
          <div className="commerce-eyebrow text-secondaryDark">
            Đang mua qua link giới thiệu
          </div>
          <div className="commerce-caption text-slate-700 mt-0.5 break-words">
            Tuyến hỗ trợ:{" "}
            <strong>
              {referrerAffiliate.levelName || getAffiliateRoleLabel(referrerAffiliate, portal)}{" "}
              {referrerAffiliate.name}
            </strong>
          </div>
        </div>
      )}

      {!isAffiliate && !referrerAffiliate && (
        <div className="rounded-2xl bg-white/54 border border-white/70 px-3 py-2 commerce-caption text-slate-500 break-words">
          Bạn đang dùng tài khoản hội viên mua hàng. Khi mở app bằng link Chi
          hội/Tổ phụ nữ, hệ thống sẽ tự gắn tuyến hỗ trợ cho đơn hàng.
        </div>
      )}

      <div className="rounded-[22px] bg-white/42 border border-white/70 p-3 min-w-0">
        <div className="commerce-eyebrow text-slate-400">
          Chi tiết nhận diện
        </div>
        <div className="mt-2 grid min-w-0 gap-2 min-[430px]:grid-cols-2">
          {detailRows.map((row) => (
            <div
              key={row.label}
              className="min-w-0 rounded-2xl bg-white/62 border border-white/70 px-3 py-2"
            >
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {row.label}
              </div>
              <div className={`mt-0.5 text-xs font-black leading-5 break-words ${row.tone}`}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeAffiliate && (
        <PersonalMarketingLink profile={activeAffiliate} compact embedded />
      )}

      <button
        onClick={() => navigate("/member")}
        className="w-full liquid-button rounded-2xl px-4 py-3 text-left"
      >
        <div className="commerce-eyebrow text-secondaryDark">
          Dành cho hội viên
        </div>
        <div className="commerce-title mt-0.5">
          Xem thẻ hội viên, tuyến Hội LHPN và đơn hàng của bạn
        </div>
      </button>

      {!isAffiliate && (
        <button
          onClick={() =>
            isLoggedIn
              ? navigate("/affiliate/register", { viewTransition: true })
              : navigate("/login", { viewTransition: true })
          }
          className="w-full promo-spotlight rounded-2xl px-4 py-3 text-left"
        >
          <div className="commerce-eyebrow text-secondaryDark">
            Đăng ký làm đại lý
          </div>
          <div className="commerce-title mt-0.5 break-words">
            Có link bán hàng riêng, tích điểm từ hoa hồng bán được
          </div>
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const userInfo = useAtomValue(loadableUserInfoState);
  const isLoggedIn = userInfo.state === "hasData" && Boolean(userInfo.data?.phone);

  return (
    <div className="min-h-full min-w-0 p-4 space-y-4">
      {!isLoggedIn && userInfo.state !== "loading" && (
        <div className="md:max-w-xl">
          <Register />
        </div>
      )}

      <div className="min-w-0 space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-4 md:space-y-0">
        <section className="space-y-3 min-w-0">
          <div className="px-1">
            <div className="commerce-eyebrow text-primary">Thông tin cá nhân</div>
            <div className="commerce-caption text-subtitle">
              Hồ sơ mua hàng, ảnh đại diện và điểm hoa hồng cá nhân.
            </div>
          </div>
          <UserInfo hideGuestCard={!isLoggedIn}>
            <Points />
          </UserInfo>
        </section>

        <section className="space-y-3 min-w-0">
          <div className="px-1">
            <div className="commerce-eyebrow text-primary">Bảo mật đăng nhập</div>
            <div className="commerce-caption text-subtitle">
              Quản lý mã PIN, thiết bị đăng nhập và thông báo.
            </div>
          </div>
          <LoginPinCard />
          <LoginDevices />
          <WebCapabilitiesCard />
        </section>

        <section className="space-y-3 min-w-0">
          <div className="px-1">
            <div className="commerce-eyebrow text-primary">Địa chỉ & đơn hàng</div>
            <div className="commerce-caption text-subtitle">
              Lưu địa chỉ mặc định, theo dõi đơn và nhận hỗ trợ nhanh.
            </div>
          </div>
          <ProfileActions />
          <InstallAppGuide />
        </section>

        <section className="space-y-3 min-w-0">
          <div className="px-1">
            <div className="commerce-eyebrow text-primary">Hội viên / đại lý</div>
            <div className="commerce-caption text-subtitle">
              Nhận diện tuyến và link tiếp thị cá nhân.
            </div>
          </div>
          <AccountRoleCard />
        </section>
      </div>
    </div>
  );
}
