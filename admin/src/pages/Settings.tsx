import React, { useEffect, useState } from 'react';
import { BadgePercent, CheckCircle2, Copy, CreditCard, Globe2, KeyRound, Link2, Mail, Palette, Phone, Save, Settings as SettingsIcon, ShieldCheck, Store, Wrench } from 'lucide-react';
import { api } from '../api';
import { PlatformSettings } from '../types';

const emptySettings: PlatformSettings = {
  shopName: 'Saximi shop',
  logoUrl: 'https://photo-logo-mapps.zadn.vn/284fadf20bb7e2e9bba6.jpg',
  brandColor: '#00ccf7',
  hotline: '',
  supportEmail: '',
  businessAddress: '',
  publicSiteUrl: '',
  zaloOaUrl: '',
  vietQrBankId: 'MB',
  vietQrAccountNo: '',
  vietQrAccountName: 'SAXIMI SHOP',
  sepayWebhookEnabled: true,
  sepayWebhookApiKey: '',
  sepayWebhookHasApiKey: false,
  sepayWebhookUrl: '',
  sepayWebhookConfigured: false,
  commissionSettlementMode: 'ORDER_DISCOUNT',
  maintenanceMode: false,
  maintenanceMessage: 'Hệ thống đang bảo trì, vui lòng quay lại sau.',
  updatedAt: '',
};

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const inputClass =
    'w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10';

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings({ ...emptySettings, ...data });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key: keyof PlatformSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const data = await api.updateSettings(settings);
      setSettings(data);
      setNotice('Đã lưu cài đặt nền tảng.');
      window.setTimeout(() => setNotice(''), 2200);
    } catch (error: any) {
      setNotice(error.message || 'Không lưu được cài đặt.');
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl =
    settings.sepayWebhookUrl ||
    `${settings.publicSiteUrl.replace(/\/+$/, '') || 'https://hpn.saximi.com.vn'}/api/payment/sepay/webhook`;

  const copyWebhookUrl = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setNotice('Đã sao chép URL webhook SePay.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Đang tải cài đặt...</div>;
  }

  return (
    <form onSubmit={save} className="p-5 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Cài đặt nền tảng</div>
              <div className="mt-1 max-w-2xl text-sm text-slate-400">
                Quản lý thông tin hiển thị, liên hệ, domain, Zalo OA và trạng thái vận hành.
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Store className="h-5 w-5 text-cyan-300" />
              Thương hiệu
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tên shop" icon={<Store className="h-4 w-4" />}>
                <input className={inputClass} value={settings.shopName} onChange={(e) => update('shopName', e.target.value)} />
              </Field>
              <Field label="URL logo shop" icon={<Store className="h-4 w-4" />}>
                <input
                  className={inputClass}
                  value={settings.logoUrl}
                  onChange={(e) => update('logoUrl', e.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Màu thương hiệu" icon={<Palette className="h-4 w-4" />}>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-12 w-14 rounded-2xl border border-white/10 bg-slate-950/70 p-1"
                    value={settings.brandColor}
                    onChange={(e) => update('brandColor', e.target.value)}
                  />
                  <input className={inputClass} value={settings.brandColor} onChange={(e) => update('brandColor', e.target.value)} />
                </div>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Phone className="h-5 w-5 text-cyan-300" />
              Thông tin liên hệ
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hotline" icon={<Phone className="h-4 w-4" />}>
                <input className={inputClass} value={settings.hotline} onChange={(e) => update('hotline', e.target.value)} />
              </Field>
              <Field label="Email hỗ trợ" icon={<Mail className="h-4 w-4" />}>
                <input className={inputClass} type="email" value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Địa chỉ kinh doanh" icon={<Store className="h-4 w-4" />}>
                  <textarea
                    className={`${inputClass} min-h-24 resize-none`}
                    value={settings.businessAddress}
                    onChange={(e) => update('businessAddress', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Globe2 className="h-5 w-5 text-cyan-300" />
              Kết nối nền tảng
            </div>
            <div className="grid gap-4">
              <Field label="Domain website" icon={<Globe2 className="h-4 w-4" />}>
                <input className={inputClass} value={settings.publicSiteUrl} onChange={(e) => update('publicSiteUrl', e.target.value)} />
              </Field>
              <Field label="Zalo OA dashboard" icon={<Globe2 className="h-4 w-4" />}>
                <input className={inputClass} value={settings.zaloOaUrl} onChange={(e) => update('zaloOaUrl', e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <CreditCard className="h-5 w-5 text-cyan-300" />
                Thanh toán & SePay
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
                settings.sepayWebhookConfigured
                  ? 'bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/20'
                  : 'bg-amber-400/12 text-amber-200 ring-1 ring-amber-300/20'
              }`}>
                <ShieldCheck className="h-4 w-4" />
                {settings.sepayWebhookConfigured ? 'SePay đã sẵn sàng' : 'Chưa đủ API key'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Mã ngân hàng VietQR" icon={<CreditCard className="h-4 w-4" />}>
                <input className={inputClass} value={settings.vietQrBankId} onChange={(e) => update('vietQrBankId', e.target.value.toUpperCase())} placeholder="MB" />
              </Field>
              <Field label="Số tài khoản nhận tiền" icon={<CreditCard className="h-4 w-4" />}>
                <input className={inputClass} value={settings.vietQrAccountNo} onChange={(e) => update('vietQrAccountNo', e.target.value)} placeholder="0908889999" />
              </Field>
              <Field label="Tên tài khoản" icon={<CreditCard className="h-4 w-4" />}>
                <input className={inputClass} value={settings.vietQrAccountName} onChange={(e) => update('vietQrAccountName', e.target.value)} placeholder="SAXIMI SHOP" />
              </Field>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <Field label="SePay API key webhook" icon={<KeyRound className="h-4 w-4" />}>
                <input
                  className={inputClass}
                  type="password"
                  value={settings.sepayWebhookApiKey}
                  onChange={(e) => update('sepayWebhookApiKey', e.target.value)}
                  placeholder={settings.sepayWebhookHasApiKey ? 'Đã có API key, nhập key mới nếu muốn thay' : 'Nhập API key từ SePay'}
                />
              </Field>
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/70 px-4 py-3 ring-1 ring-white/10">
                <span>
                  <span className="block text-sm font-bold text-white">Bật webhook</span>
                  <span className="mt-1 block text-xs text-slate-400">Cho phép SePay xác nhận đơn</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.sepayWebhookEnabled}
                  onChange={(e) => update('sepayWebhookEnabled', e.target.checked)}
                  className="h-5 w-5 accent-cyan-400"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-950/70 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <Link2 className="h-4 w-4" />
                URL webhook nhập trong SePay
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input className={`${inputClass} font-mono text-xs`} value={webhookUrl} readOnly />
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 hover:bg-white/15"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-xs leading-5 text-cyan-100 ring-1 ring-cyan-300/15">
                Header gửi từ SePay: <span className="font-mono font-bold">Authorization: Apikey &lt;API key&gt;</span>. Nội dung chuyển khoản chuẩn: <span className="font-mono font-bold">SAXIMI ORDER {'{mã đơn}'}</span>.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <BadgePercent className="h-5 w-5 text-cyan-300" />
              Cách xử lý hoa hồng
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  value: 'ORDER_DISCOUNT',
                  title: 'Trừ trực tiếp vào tiền hàng',
                  description: 'Khách mua qua link giới thiệu được giảm ngay phần hoa hồng cá nhân.',
                },
                {
                  value: 'MANUAL_PAYOUT',
                  title: 'Nhận thủ công',
                  description: 'Hệ thống ghi nhận hoa hồng vào sổ để admin đối soát/rút tiền sau.',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update('commissionSettlementMode', option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    settings.commissionSettlementMode === option.value
                      ? 'border-cyan-300/70 bg-cyan-400/12 text-cyan-50'
                      : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-black">{option.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{option.description}</div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Wrench className="h-5 w-5 text-cyan-300" />
              Bảo trì
            </div>
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/70 p-4 ring-1 ring-white/10">
              <span>
                <span className="block text-sm font-bold text-white">Chế độ bảo trì</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">Dùng để thông báo khi cần tạm ngưng vận hành.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => update('maintenanceMode', e.target.checked)}
                className="h-5 w-5 accent-cyan-400"
              />
            </label>
            <div className="mt-4">
              <Field label="Thông báo bảo trì" icon={<Wrench className="h-4 w-4" />}>
                <textarea
                  className={`${inputClass} min-h-28 resize-none`}
                  value={settings.maintenanceMessage}
                  onChange={(e) => update('maintenanceMessage', e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="text-sm font-bold text-white">Xem trước</div>
            <div className="mt-4 rounded-2xl bg-slate-950/70 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.shopName}
                    className="h-10 w-10 rounded-xl object-cover"
                    style={{ backgroundColor: settings.brandColor }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: settings.brandColor }} />
                )}
                <div>
                  <div className="font-black text-white">{settings.shopName}</div>
                  <div className="text-xs text-slate-400">{settings.publicSiteUrl}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div>Hotline: <span className="text-slate-200">{settings.hotline}</span></div>
                <div>Email: <span className="text-slate-200">{settings.supportEmail}</span></div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Cập nhật lần cuối: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('vi-VN') : 'Chưa có'}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
