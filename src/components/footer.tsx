import HorizontalDivider from "./horizontal-divider";
import { useAtomValue } from "jotai";
import { cartState } from "@/state";
import TransitionLink from "./transition-link";
import { useRouteHandle } from "@/hooks";
import Badge from "./badge";
import CommerceIcon, { CommerceIconName } from "./commerce-icon";

function NavIcon({
  name,
  active,
}: {
  name: CommerceIconName;
  active?: boolean;
}) {
  return (
    <CommerceIcon
      name={name}
      size={22}
      strokeWidth={active ? 2.2 : 1.8}
      className={active ? "text-primary" : "text-slate-500"}
    />
  );
}

const NAV_ITEMS: { name: string; path: string; icon: CommerceIconName }[] = [
  {
    name: "Trang chủ",
    path: "/",
    icon: "home",
  },
  {
    name: "Danh mục",
    path: "/categories",
    icon: "grid",
  },
  {
    name: "Đơn hàng",
    path: "/orders",
    icon: "package",
  },
  {
    name: "Hội viên",
    path: "/member",
    icon: "user",
  },
  {
    name: "Giỏ hàng",
    path: "/cart",
    icon: "bag",
  },
];

export default function Footer() {
  const [handle] = useRouteHandle();
  const cart = useAtomValue(cartState);

  if (!handle?.noFooter) {
    return (
      <>
        <HorizontalDivider />
        <nav
          className="app-footer w-full px-3 pt-2 grid pb-sb liquid-bar border-t"
          style={{
            gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`,
          }}
        >
          {NAV_ITEMS.map((item) => {
            return (
              <TransitionLink
                to={item.path}
                key={item.path}
                className="min-w-0 flex flex-col items-center space-y-0.5 p-1 pb-0.5 cursor-pointer active:scale-105"
              >
                {({ isActive }) => (
                  <>
                    <div className="w-6 h-6 flex justify-center items-center">
                      {item.path === "/cart" ? (
                        <Badge value={cart.length}>
                          <NavIcon name={item.icon} active={isActive} />
                        </Badge>
                      ) : (
                        <NavIcon name={item.icon} active={isActive} />
                      )}
                    </div>
                    <div
                      className={`max-w-full truncate text-[11px] leading-4 font-semibold ${isActive ? "text-primary" : "text-slate-500"}`}
                    >
                      {item.name}
                    </div>
                  </>
                )}
              </TransitionLink>
            );
          })}
        </nav>
      </>
    );
  }
}
