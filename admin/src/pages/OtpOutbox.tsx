import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Clipboard, ExternalLink, KeyRound, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { api, setupAdminWebPushNotifications } from '../api';
import { OtpOutboxItem } from '../types';

const STATUS_LABELS: Record<OtpOutboxItem['status'], string> = {
  pending: 'Chờ gửi',
  sent: 'Đã gửi',
  expired: 'Hết hạn',
};

const STATUS_STYLES: Record<OtpOutboxItem['status'], string> = {
  pending: 'bg-amber-400/12 text-amber-200 ring-amber-300/20',
  sent: 'bg-emerald-400/12 text-emerald-200 ring-emerald-300/20',
  expired: 'bg-slate-400/12 text-slate-300 ring-slate-300/20',
};

function formatTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function OtpOutboxPage() {
  const [items, setItems] = useState<OtpOutboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 'pending').length,
    [items]
  );
  const latestPending = useMemo(
    () => items.find((item) => item.status === 'pending'),
    [items]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getOtpOutbox();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setMessage(`Đã copy ${label}`);
    window.setTimeout(() => setMessage(''), 1800);
  };

  const markSent = async (id: string) => {
    const updated = await api.markOtpSent(id);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const removeItem = async (id: string) => {
    await api.deleteOtpOutboxItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const enableAdminPush = async () => {
    setIsEnablingPush(true);
    try {
      const result = await setupAdminWebPushNotifications();
      if (result === 'subscribed') {
        await api.testAdminWebPush('Thông báo đẩy OTP đã sẵn sàng trên thiết bị admin này.');
        setMessage('Đã bật và gửi thử thông báo đẩy OTP cho thiết bị admin này.');
      } else if (result === 'permission-only') {
        setMessage('Trình duyệt đã cho phép thông báo, nhưng máy chủ chưa cấu hình VAPID để gửi push nền.');
      } else if (result === 'denied') {
        setMessage('Bạn chưa cấp quyền thông báo cho trình duyệt.');
      } else {
        setMessage('Trình duyệt này chưa hỗ trợ thông báo đẩy.');
      }
      window.setTimeout(() => setMessage(''), 2200);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'Chưa bật được thông báo đẩy.');
      window.setTimeout(() => setMessage(''), 2600);
    } finally {
      setIsEnablingPush(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Thông báo OTP đăng nhập</div>
              <div className="mt-1 max-w-2xl text-sm text-slate-400">
                Khi khách đăng nhập hoặc đăng ký bằng số điện thoại, mã OTP sẽ hiện tại đây để admin copy và gửi qua Zalo OA chính thức.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://oa.zalo.me/manage/dashboard#"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950"
            >
              <ExternalLink className="h-4 w-4" />
              Mở Zalo OA
            </a>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
            <button
              onClick={enableAdminPush}
              disabled={isEnablingPush}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BellRing className="h-4 w-4" />
              {isEnablingPush ? 'Đang bật...' : 'Bật thông báo đẩy OTP'}
            </button>
          </div>
        </div>

        {latestPending && (
          <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-cyan-100">
                    {latestPending.title || 'Khách vừa yêu cầu OTP đăng nhập'}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    SĐT {latestPending.phone} · Tạo lúc {formatTime(latestPending.createdAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyText(latestPending.otpPreview || latestPending.message, latestPending.otpPreview ? 'mã OTP' : 'nội dung OTP')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
              >
                <KeyRound className="h-4 w-4" />
                Copy OTP {latestPending.otpPreview ? latestPending.otpPreview : ''}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chờ gửi</div>
            <div className="mt-2 text-2xl font-black text-white">{pendingCount}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng hàng chờ</div>
            <div className="mt-2 text-2xl font-black text-white">{items.length}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trang gửi</div>
            <div className="mt-2 truncate text-sm font-bold text-cyan-200">oa.zalo.me/manage/dashboard</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/20">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Đang tải OTP...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">Chưa có OTP nào trong hàng chờ.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 p-4 xl:grid-cols-[180px_minmax(0,1fr)_220px] xl:items-start">
                <div className="space-y-2">
                  <div className="text-lg font-black text-white">{item.phone}</div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                  <div className="text-xs font-semibold text-cyan-200">{item.title || 'OTP đăng nhập'}</div>
                  <div className="text-xs text-slate-500">Tạo: {formatTime(item.createdAt)}</div>
                  <div className="text-xs text-slate-500">Hết hạn: {formatTime(item.expiresAt)}</div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/10">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mã OTP đăng nhập</div>
                    <div className="font-mono text-3xl font-black tracking-[0.32em] text-cyan-200">
                      {item.otpPreview || '------'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-3 text-sm leading-6 text-slate-100 ring-1 ring-white/10">
                    {item.message}
                  </div>
                </div>

                <div className="grid gap-2">
                  {item.otpPreview && (
                    <button
                      onClick={() => copyText(item.otpPreview || '', 'mã OTP')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950"
                    >
                      <KeyRound className="h-4 w-4" />
                      Copy mã OTP
                    </button>
                  )}
                  <button
                    onClick={() => copyText(item.phone, 'số điện thoại')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/10"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy SĐT
                  </button>
                  <button
                    onClick={() => copyText(item.message, 'nội dung OTP')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/10"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy tin nhắn
                  </button>
                  <button
                    onClick={() => markSent(item.id)}
                    disabled={item.status !== 'pending'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Đã gửi
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/12 px-3 py-2 text-sm font-bold text-rose-200 ring-1 ring-rose-300/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
