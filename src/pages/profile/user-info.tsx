import { UserInfoSkeleton } from "@/components/skeleton";
import TransitionLink from "@/components/transition-link";
import { loadableUserInfoState } from "@/state";
import { useAtomValue } from "jotai";
import { PropsWithChildren } from "react";
import Register from "./register";
import CommerceIcon from "@/components/commerce-icon";

function UserInfo({ children }: PropsWithChildren) {
  const userInfo = useAtomValue(loadableUserInfoState);

  if (userInfo.state === "hasData" && userInfo.data) {
    const { name, avatar, phone, address } = userInfo.data;
    return (
      <>
        <div className="liquid-card rounded-[24px] p-4 flex items-center gap-3.5">
          <img
            className="rounded-full h-11 w-11 ring-2 ring-white/80 shadow-sm"
            src={avatar}
            alt={name}
          />
          <div className="space-y-0.5 flex-1 overflow-hidden">
            <div className="commerce-title truncate">{name}</div>
            <div className="commerce-caption text-subtitle truncate">{phone}</div>
            {address && (
              <div className="commerce-caption text-subtitle truncate">
                {address}
              </div>
            )}
          </div>
          <TransitionLink
            to="/profile/edit"
            className="flex h-10 w-10 items-center justify-center rounded-2xl liquid-button"
          >
            <CommerceIcon name="edit" size={20} className="text-primary" />
          </TransitionLink>
        </div>
        {children}
      </>
    );
  }

  if (userInfo.state === "loading") {
    return <UserInfoSkeleton />;
  }

  return <Register />;
}

export default UserInfo;
