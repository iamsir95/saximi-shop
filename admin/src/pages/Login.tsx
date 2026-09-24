import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { api, setAuthToken } from '../api';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(username, password);
      setAuthToken(res.token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.72fr)]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[linear-gradient(135deg,#07111f_0%,#0f2535_48%,#083342_100%)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-black tracking-wide">Saximi shop</div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Admin Console</div>
              </div>
            </div>

            <div className="mt-16 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Quản trị vận hành
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-normal text-white">
                Bảng điều khiển thương mại Saximi
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                Quản lý sản phẩm, đơn hàng, hội viên, OTP Zalo OA và vận chuyển trong một không gian bảo mật.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[
              ['Đơn hàng', 'Theo dõi xử lý'],
              ['Hội viên', 'Hoa hồng & tuyến'],
              ['OTP Zalo', 'Hàng chờ gửi OA'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
                <div className="text-sm font-black text-white">{title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{description}</div>
              </div>
            ))}
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#07111f_0%,#0b1728_100%)] p-4 sm:p-6">
          <div className="w-full max-w-[440px]">
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-black">Saximi shop</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin Console</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7">
              <div className="mb-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-normal text-white">Đăng nhập quản trị</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sử dụng tài khoản được cấp để truy cập khu vực vận hành Saximi shop.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-500/12 px-4 py-3 text-sm font-semibold leading-6 text-rose-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                    Tài khoản
                  </span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                      className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-11 pr-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
                      placeholder="Nhập tài khoản quản trị"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                    Mật khẩu
                  </span>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-11 pr-12 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
                      placeholder="Nhập mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/8 hover:text-white"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{loading ? 'Đang xác thực...' : 'Vào trang quản trị'}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-xs leading-5 text-slate-400">
                Khu vực này chỉ dành cho nhân sự được phân quyền. Mọi phiên đăng nhập đều được ghi nhận trong nhật ký hệ thống.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
