import { useAtomValue } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";
import {
  categoriesStateUpwrapped,
  loadableUserInfoState,
  platformSettingsState,
  shippingAddressState,
} from "@/state";
import { useMemo } from "react";
import { useRouteHandle } from "@/hooks";
import { getConfig } from "@/utils/template";
import SearchBar from "./search-bar";
import TransitionLink from "./transition-link";
import { DefaultUserAvatar } from "./vectors";
import CommerceIcon from "./commerce-icon";
import NotificationCenter from "./notification-center";

export default function Header() {
  const categories = useAtomValue(categoriesStateUpwrapped);
  const navigate = useNavigate();
  const location = useLocation();
  const [handle, match] = useRouteHandle();
  const userInfo = useAtomValue(loadableUserInfoState);
  const platformSettings = useAtomValue(platformSettingsState);
  const shippingAddress = useAtomValue(shippingAddressState);

  const title = useMemo(() => {
    if (handle) {
      if (typeof handle.title === "function") {
        return handle.title({ categories, params: match.params });
      } else {
        return handle.title;
      }
    }
  }, [handle, categories]);

  const showBack = location.key !== "default" && !handle?.noBack;
  const shopName =
    platformSettings?.shopName || getConfig((c) => c.template.shopName);
  const logoUrl =
    platformSettings?.logoUrl || getConfig((c) => c.template.logoUrl);
  const currentShippingAddress =
    shippingAddress?.address ||
    (userInfo.state === "hasData" ? userInfo.data?.address : "") ||
    "Chọn địa chỉ giao hàng";

  return (
    <header className="app-header w-full flex flex-col px-4 pt-st text-slate-900">
      <div className="commerce-header w-full min-h-14 flex gap-3 items-center">
        {handle?.logo ? (
          <>
            <img
              src={logoUrl}
              className="flex-none w-10 h-10 rounded-2xl object-cover bg-white shadow-sm"
              alt={shopName}
            />
            <TransitionLink to="/shipping-address" className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="commerce-title truncate">
                  {shopName}
                </h1>
                <CommerceIcon
                  name="chevron-right"
                  size={17}
                  className="flex-none text-slate-500"
                />
              </div>
              <p className="truncate commerce-caption text-slate-500">
                {currentShippingAddress}
              </p>
            </TransitionLink>
            <NotificationCenter />
          </>
        ) : (
          <>
            {showBack && (
              <div
                className="w-10 h-10 rounded-2xl bg-white/75 flex items-center justify-center cursor-pointer active:scale-95"
                onClick={() => navigate(-1)}
              >
                <CommerceIcon name="arrow-left" size={21} />
              </div>
            )}
            <div className="min-w-0 flex-1 text-lg font-black leading-6 truncate">
              {title}
            </div>
            <NotificationCenter />
          </>
        )}
      </div>
      {handle?.search && (
        <div className="w-full pb-3 pt-1 flex gap-2 items-center">
          <SearchBar
            onFocus={() => {
              if (location.pathname !== "/search") {
                navigate("/search", { viewTransition: true });
              }
            }}
          />
          <TransitionLink to="/profile" className="flex-none">
            {userInfo.state === "hasData" && userInfo.data ? (
              <img
                className="w-10 h-10 rounded-2xl object-cover bg-white shadow-sm"
                src={userInfo.data.avatar}
                alt={userInfo.data.name}
              />
            ) : (
              <DefaultUserAvatar
                width={40}
                height={40}
                className={`rounded-2xl bg-white shadow-sm ${
                  userInfo.state === "loading" ? "animate-pulse" : ""
                }`}
              />
            )}
          </TransitionLink>
        </div>
      )}
    </header>
  );
}
