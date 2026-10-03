import React, { useEffect, useMemo, useState } from 'react';
import { BadgePercent, CheckCircle2, GitBranch, Percent, Save, ShieldCheck, WalletCards } from 'lucide-react';
import { api } from '../api';
import { CommissionSettings, CommissionTierSetting } from '../types';

const defaultSettings: CommissionSettings = {
  settlementMode: 'ORDER_DISCOUNT',
  pointValue: 1000,
  applyToSelfPurchase: true,
  applyToReferralOrders: true,
  allowPersonalOverride: true,
  tiers: [
    {
      tierLevel: 1,
      levelName: 'Bậc 1 - Chủ tịch',
      commissionLabel: 'Hoa hồng toàn tuyến',
      rate: 5,
      description: 'Nhận hoa hồng toàn bộ tuyến và đơn tự bán/tự mua.',
      isActive: true,
    },
    {
      tierLevel: 2,
      levelName: 'Bậc 2 - Chi hội trưởng',
      commissionLabel: 'Hoa hồng chi hội',
      rate: 25,
      description: 'Nhận hoa hồng từ bán hàng, tự mua hàng và link/QR giới thiệu.',
      isActive: true,
    },
    {
      tierLevel: 3,
      levelName: 'Bậc 3 - Hội viên bán hàng',
      commissionLabel: 'Hoa hồng hội viên',
      rate: 15,
      description: 'Nhận hoa hồng cá nhân từ bán hàng, tự mua hàng và link/QR giới thiệu.',
      isActive: true,
    },
  ],
  updatedAt: '',
};

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10';

function normalizeSettings(data: Partial<CommissionSettings>): CommissionSettings {
  const incomingTiers = Array.isArray(data.tiers) ? data.tiers : [];
  return {
    ...defaultSettings,
    ...data,
    tiers: defaultSettings.tiers.map((fallback) => ({
      ...fallback,
      ...incomingTiers.find((tier) => tier.tierLevel === fallback.tierLevel),
    })),
  };
}

export function CommissionSettingsPage() {
  const [settings, setSettings] = useState<CommissionSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const totalRate = useMemo(
    () => settings.tiers.filter((tier) => tier.isActive).reduce((sum, tier) => sum + Number(tier.rate || 0), 0),
    [settings.tiers]
  );

  useEffect(() => {
    api.getCommissionSettings()
      .then((data) => setSettings(normalizeSettings(data)))
      .finally(() => setLoading(false));
  }, []);

  const updateTier = (tierLevel: 1 | 2 | 3, patch: Partial<CommissionTierSetting>) => {
    setSettings((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (
        tier.tierLevel === tierLevel ? { ...tier, ...patch } : tier
      )),
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const data = await api.updateCommissionSettings(settings);
      setSettings(normalizeSettings(data));
      setNotice('Đã đồng bộ cấu hình hoa hồng cho toàn bộ nền tảng.');
      window.setTimeout(() => setNotice(''), 2400);
    } catch (error: any) {
      setNotice(error.message || 'Không lưu được cấu hình hoa hồng.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Đang tải cấu hình hoa hồng...</div>;
  }

  return (
    <form onSubmit={save} className="p-5 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <BadgePercent className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Cấu hình hoa hồng</div>
              <div className="mt-1 max-w-2xl text-sm text-slate-400">
                Thiết lập một nguồn chuẩn cho bậc hội viên, tên hoa hồng, tỷ lệ, điểm và cách chi trả.
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu hoa hồng'}
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
              <WalletCards className="h-5 w-5 text-cyan-300" />
              Cách xử lý hoa hồng
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  value: 'ORDER_DISCOUNT',
                  title: 'Trừ trực tiếp vào tiền hàng',
                  description: 'Khách/hội viên đủ điều kiện được giảm ngay phần hoa hồng cá nhân khi đặt hàng.',
                },
                {
                  value: 'MANUAL_PAYOUT',
                  title: 'Chi trả thủ công',
                  description: 'Hệ thống ghi nhận hoa hồng để admin đối soát và duyệt rút tiền sau.',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, settlementMode: option.value as CommissionSettings['settlementMode'] }))}
                  className={`rounded-2xl border p-4 text-left transition ${
                    settings.settlementMode === option.value
                      ? 'border-cyan-300/70 bg-cyan-400/12 text-cyan-50'
                      : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-black">{option.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{option.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ['applyToReferralOrders', 'Tính hoa hồng cho đơn qua link/QR'],
                ['applyToSelfPurchase', 'Tính hoa hồng khi hội viên tự mua'],
                ['allowPersonalOverride', 'Cho phép gán tỷ lệ riêng từng hội viên'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-200">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((settings as any)[key])}
                    onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.checked }))}
                    className="h-5 w-5 accent-cyan-300"
                  />
                </label>
              ))}
              <label className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Quy đổi điểm</span>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={settings.pointValue}
                  onChange={(event) => setSettings((prev) => ({ ...prev, pointValue: Math.max(1, Number(event.target.value || 1)) }))}
                />
                <span className="text-xs text-slate-500">1 điểm = số tiền hoa hồng tương ứng, mặc định 1.000 VND.</span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <GitBranch className="h-5 w-5 text-cyan-300" />
              Cây bậc hoa hồng
            </div>
            <div className="space-y-4">
              {settings.tiers.map((tier) => (
                <div key={tier.tierLevel} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-black text-cyan-100">Bậc {tier.tierLevel}</div>
                      <div className="text-xs text-slate-500">Áp dụng cho hội viên mới và đơn hàng phát sinh sau khi lưu.</div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={tier.isActive}
                        onChange={(event) => updateTier(tier.tierLevel, { isActive: event.target.checked })}
                        className="h-4 w-4 accent-cyan-300"
                      />
                      Đang áp dụng
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Tên bậc</span>
                      <input className={inputClass} value={tier.levelName} onChange={(event) => updateTier(tier.tierLevel, { levelName: event.target.value })} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Tên hoa hồng</span>
                      <input className={inputClass} value={tier.commissionLabel} onChange={(event) => updateTier(tier.tierLevel, { commissionLabel: event.target.value })} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Tỷ lệ %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        className={inputClass}
                        value={tier.rate}
                        onChange={(event) => updateTier(tier.tierLevel, { rate: Math.max(0, Number(event.target.value || 0)) })}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Mô tả</span>
                      <input className={inputClass} value={tier.description} onChange={(event) => updateTier(tier.tierLevel, { description: event.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Percent className="h-5 w-5 text-cyan-300" />
              Tóm tắt
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-950/70 p-4 ring-1 ring-white/10">
                <div className="text-xs text-slate-500">Tổng tỷ lệ đang bật</div>
                <div className="mt-1 text-3xl font-black text-white">{totalRate}%</div>
              </div>
              <div className="rounded-2xl bg-slate-950/70 p-4 text-sm leading-6 text-slate-300 ring-1 ring-white/10">
                Cấu hình này là nguồn chuẩn cho hội viên mới, QR/link tiếp thị, ví hoa hồng, điểm hoa hồng và đơn hàng phát sinh sau khi lưu.
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-amber-400/10 p-4 text-xs leading-5 text-amber-100 ring-1 ring-amber-300/20">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Lịch sử hoa hồng cũ giữ nguyên tỷ lệ đã ghi nhận để đối soát không bị lệch.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}

export default CommissionSettingsPage;
