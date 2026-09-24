import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, ExternalLink, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../api';
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

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 'pending').length,
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

  return (
    <div className="p-5 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">OTP Zalo OA</div>
              <div className="mt-1 max-w-2xl text-sm text-slate-400">
                Hệ thống tạo OTP bảo mật, admin copy nội dung và gửi cho khách qua Zalo OA chính thức.
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
          </div>
        </div>

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
                  <div className="text-xs text-slate-500">Tạo: {formatTime(item.createdAt)}</div>
                  <div className="text-xs text-slate-500">Hết hạn: {formatTime(item.expiresAt)}</div>
                </div>

                <div className="rounded-2xl bg-slate-950/70 p-3 text-sm leading-6 text-slate-100 ring-1 ring-white/10">
                  {item.message}
                </div>

                <div className="grid gap-2">
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
