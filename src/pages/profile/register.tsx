import { useRequestInformation } from "@/hooks";
import registerIllusRight from "@/static/register-illus-right.svg";
import { isWebsiteRuntime } from "@/utils/platform";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const requestInfo = useRequestInformation();
  const navigate = useNavigate();

  return (
    <button
      className="w-full text-left rounded-[24px] text-primaryForeground p-4 bg-cover space-y-0.5 shadow-[0_18px_42px_rgba(0,204,247,0.24)]"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 204, 247, 0.92), rgba(20, 184, 166, 0.72)), url(${registerIllusRight})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom right",
        backgroundSize: "auto",
      }}
      onClick={() => {
        if (isWebsiteRuntime()) {
          navigate("/login", { viewTransition: true });
          return;
        }
        requestInfo();
      }}
    >
      <div className="text-lg font-black leading-6">Đăng nhập / đăng ký</div>
      <div className="commerce-caption text-slate-700/82">
        Dùng số điện thoại để theo dõi đơn hàng và ưu đãi
      </div>
    </button>
  );
}
