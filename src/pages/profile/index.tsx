import ProfileActions from "./actions";
import FollowOA from "./follow-oa";
import Points from "./points";
import UserInfo from "./user-info";
import WebCapabilitiesCard from "./web-capabilities";
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
  const currentUser =
    userInfo.state === "hasData" && userInfo.data ? userInfo.data : undefined;
  const activeAffiliate = findAffiliateForUser(affiliates, currentUser);
  const referrerAffiliate = findAffiliateByReferrer(affiliates, referrerId);
  const isAffiliate = Boolean(activeAffiliate);
  const isLoggedIn = Boolean(currentUser?.phone);
  const commissionRate = activeAffiliate
    ? activeAffiliate.role === "PRESIDENT"
      ? activeAffiliate.overridingCommissionRate
      : activeAffiliate.directCommissionRate
    : 0;
  const detailRows = [
    {
      label: "Trạng thái",
      value: isLoggedIn ? "Đã xác thực số điện thoại" : "Chưa đăng nhập",
      tone: isLoggedIn ? "text-emerald-700" : "text-amber-700",
    },
    {
      label: "Loại tài khoản",
      value: getAffiliateRoleLabel(activeAffiliate),
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
            tone: "text-emerald-700",
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
              ? `${referrerAffiliate.name} - ${getAffiliateRoleLabel(referrerAffiliate)}`
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
    <div className="liquid-card text-slate-900 rounded-[24px] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
              activeAffiliate?.role === "PRESIDENT"
                ? "bg-indigo-600/90 text-white shadow-indigo-500/20"
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

          <div className="min-w-0">
            <div className="commerce-eyebrow text-slate-400">
              Nhận diện tài khoản
            </div>
            <div className="commerce-title truncate">
              {getAffiliateRoleLabel(activeAffiliate)}
            </div>
            <div className="commerce-caption text-subtitle mt-0.5">
              {getAffiliateRoleDescription(activeAffiliate)}
            </div>
          </div>
        </div>

        {isAffiliate && (
          <button
            onClick={() => navigate("/affiliate")}
            className="commerce-caption liquid-button text-primary font-bold px-3 py-2 rounded-full whitespace-nowrap min-w-[76px] text-center"
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
            className="commerce-caption liquid-button text-primary font-bold px-3 py-2 rounded-full whitespace-nowrap min-w-[86px] text-center"
          >
            {isLoggedIn ? "Đăng xuất" : "Đăng nhập"}
          </button>
        )}
      </div>

      {isLoggedIn && !isAffiliate && (
        <div className="rounded-2xl bg-emerald-50/80 border border-white/70 px-3 py-2 commerce-caption text-emerald-700">
          Đã đăng nhập bằng số điện thoại{" "}
          <strong>{currentUser?.phone}</strong>. Bạn có thể theo dõi đơn hàng
          và lưu địa chỉ giao hàng trên tài khoản này.
        </div>
      )}

      {referrerAffiliate && !isAffiliate && (
        <div className="rounded-2xl bg-cyan-50/70 border border-white/70 px-3 py-2">
          <div className="commerce-eyebrow text-primary">
            Đang mua qua link giới thiệu
          </div>
          <div className="commerce-caption text-slate-700 mt-0.5">
            Tuyến hỗ trợ:{" "}
            <strong>
              {referrerAffiliate.levelName || getAffiliateRoleLabel(referrerAffiliate)}{" "}
              {referrerAffiliate.name}
            </strong>
          </div>
        </div>
      )}

      {!isAffiliate && !referrerAffiliate && (
        <div className="rounded-2xl bg-white/54 border border-white/70 px-3 py-2 commerce-caption text-slate-500">
          Bạn đang dùng tài khoản hội viên mua hàng. Khi mở app bằng link Chi
          hội/Tổ phụ nữ, hệ thống sẽ tự gắn tuyến hỗ trợ cho đơn hàng.
        </div>
      )}

      <div className="rounded-[22px] bg-white/42 border border-white/70 p-3">
        <div className="commerce-eyebrow text-slate-400">
          Chi tiết nhận diện
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {detailRows.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl bg-white/62 border border-white/70 px-3 py-2"
            >
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {row.label}
              </div>
              <div className={`mt-0.5 text-xs font-black leading-5 truncate ${row.tone}`}>
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
        <div className="commerce-eyebrow text-rose-600">
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
          className="w-full rounded-2xl bg-emerald-50/80 border border-white/70 px-4 py-3 text-left"
        >
          <div className="commerce-eyebrow text-emerald-600">
            Đăng ký làm đại lý
          </div>
          <div className="commerce-title mt-0.5">
            Có link bán hàng riêng, tích điểm từ hoa hồng bán được
          </div>
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-full p-4 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
      <UserInfo>
        <Points />
      </UserInfo>

      <AccountRoleCard />
      <WebCapabilitiesCard />

      <ProfileActions />
      <FollowOA />
    </div>
  );
}
