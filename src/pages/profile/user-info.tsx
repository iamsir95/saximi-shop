import { UserInfoSkeleton } from "@/components/skeleton";
import TransitionLink from "@/components/transition-link";
import { loadableUserInfoState } from "@/state";
import { useAtomValue } from "jotai";
import { PropsWithChildren } from "react";
import Register from "./register";
import CommerceIcon from "@/components/commerce-icon";

type UserInfoProps = PropsWithChildren<{
  hideGuestCard?: boolean;
}>;

function UserInfo({ children, hideGuestCard = false }: UserInfoProps) {
  const userInfo = useAtomValue(loadableUserInfoState);

  if (userInfo.state === "hasData" && userInfo.data) {
    const { name, avatar, phone, address } = userInfo.data;
    return (
      <>
        <div className="liquid-card rounded-[26px] p-4 min-w-0 overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <img
                className="h-14 w-14 rounded-[22px] object-cover ring-2 ring-white/85 shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
                src={avatar}
                alt={name}
              />
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primaryForeground ring-2 ring-white">
                <CommerceIcon name="check" size={13} />
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="commerce-eyebrow text-primary">Tài khoản đã xác thực</div>
              <div className="text-lg font-black leading-6 text-slate-950 break-words">
                {name || "Khách hàng Saximi"}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/64 px-2.5 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-white/80">
                  <CommerceIcon name="phone" size={13} className="text-primary" />
                  <span className="min-w-0 break-all">{phone}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-white/80">
                  <CommerceIcon name="id-card" size={13} />
                  Người mua
                </span>
              </div>
              {address && (
                <div className="commerce-caption text-subtitle leading-5 break-words">
                  {address}
                </div>
              )}
            </div>

            <TransitionLink
              to="/profile/edit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl liquid-button"
              aria-label="Chỉnh sửa tài khoản"
            >
              <CommerceIcon name="edit" size={20} className="text-primary" />
            </TransitionLink>
          </div>
        </div>
        {children}
      </>
    );
  }

  if (userInfo.state === "loading") {
    return <UserInfoSkeleton />;
  }

  if (hideGuestCard) return null;

  return <Register />;
}

export default UserInfo;
