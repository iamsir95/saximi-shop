import React, { useEffect, useState } from 'react';
import { Crown, GitBranch, QrCode, Plus, UserCheck, Percent, X, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { api } from '../api';
import { AffiliateProfile } from '../types';

const TIER_CONFIG: Record<1 | 2 | 3, { levelName: string; commissionLabel: string; rate: number }> = {
  1: { levelName: 'Bậc 1 - Chủ tịch', commissionLabel: 'Hoa hồng toàn tuyến', rate: 5 },
  2: { levelName: 'Bậc 2 - Chi hội trưởng', commissionLabel: 'Hoa hồng chi hội', rate: 25 },
  3: { levelName: 'Bậc 3 - Hội viên bán hàng', commissionLabel: 'Hoa hồng hội viên', rate: 15 },
};

function getTierLevel(profile: AffiliateProfile): 1 | 2 | 3 {
  return profile.tierLevel || (profile.role === 'PRESIDENT' ? 1 : 2);
}

function getCommissionLabel(profile: AffiliateProfile) {
  return profile.commissionLabel || TIER_CONFIG[getTierLevel(profile)].commissionLabel;
}

function getCommissionRate(profile: AffiliateProfile) {
  const tier = getTierLevel(profile);
  return tier === 1
    ? profile.overridingCommissionRate || profile.directCommissionRate || TIER_CONFIG[1].rate
    : profile.directCommissionRate || TIER_CONFIG[tier].rate;
}

function getHierarchyPath(profile: AffiliateProfile, affiliates: AffiliateProfile[]) {
  const chain: AffiliateProfile[] = [];
  let current: AffiliateProfile | undefined = profile;
  const visited = new Set<string>();

  while (current && !visited.has(current.userId)) {
    visited.add(current.userId);
    chain.unshift(current);
    const parentId: string | undefined = current.parentAffiliateId || current.presidentId;
    current = parentId ? affiliates.find((item) => item.userId === parentId) : undefined;
  }

  if (chain.length === 0) {
    chain.push(profile);
  }

  const commissionLabel = getCommissionLabel(profile);
  return chain
    .map((item) => item.levelName || TIER_CONFIG[getTierLevel(item)].levelName)
    .concat(commissionLabel);
}

export const AffiliatesPage: React.FC = () => {
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateProfile | null>(null);
  const [selectedQr, setSelectedQr] = useState<AffiliateProfile | null>(null);
  const [selectedCommissionProfile, setSelectedCommissionProfile] = useState<AffiliateProfile | null>(null);
  const [assignTierLevel, setAssignTierLevel] = useState<1 | 2 | 3>(2);
  const [assignLevelName, setAssignLevelName] = useState('');
  const [assignParentAffiliateId, setAssignParentAffiliateId] = useState('');
  const [assignCommissionLabel, setAssignCommissionLabel] = useState('');
  const [assignCommissionRate, setAssignCommissionRate] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tierLevel, setTierLevel] = useState<1 | 2 | 3>(2);
  const [levelName, setLevelName] = useState(TIER_CONFIG[2].levelName);
  const [parentAffiliateId, setParentAffiliateId] = useState('');

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const data = await api.getAffiliates();
      setAffiliates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliates();
  }, []);

  const presidents = affiliates.filter((a) => getTierLevel(a) === 1);
  const tierTwoAffiliates = affiliates.filter((a) => getTierLevel(a) === 2);
  const hierarchy = presidents.map((president) => ({
    president,
    branches: affiliates
      .filter((affiliate) => getTierLevel(affiliate) === 2 && (affiliate.parentAffiliateId || affiliate.presidentId) === president.userId)
      .map((branch) => ({
        branch,
        children: affiliates.filter((affiliate) => getTierLevel(affiliate) === 3 && affiliate.parentAffiliateId === branch.userId),
      })),
  }));

  const handleTierChange = (nextTier: 1 | 2 | 3) => {
    setTierLevel(nextTier);
    setLevelName(TIER_CONFIG[nextTier].levelName);
    setParentAffiliateId('');
  };

  const resetForm = () => {
    setEditingAffiliate(null);
    setName('');
    setPhone('');
    setAddress('');
    setTierLevel(2);
    setLevelName(TIER_CONFIG[2].levelName);
    setParentAffiliateId('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (profile: AffiliateProfile) => {
    const tier = getTierLevel(profile);
    setEditingAffiliate(profile);
    setName(profile.name);
    setPhone(profile.phone);
    setAddress(profile.address || '');
    setTierLevel(tier);
    setLevelName(profile.levelName || TIER_CONFIG[tier].levelName);
    setParentAffiliateId(profile.parentAffiliateId || profile.presidentId || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    if (tierLevel === 2 && presidents.length > 0 && !parentAffiliateId) {
      alert('Vui lòng chọn Bậc 1 cấp trên cho Bậc 2.');
      return;
    }
    if (tierLevel === 3 && tierTwoAffiliates.length > 0 && !parentAffiliateId) {
      alert('Vui lòng chọn Bậc 2 cấp trên cho Bậc 3.');
      return;
    }

    const userId = editingAffiliate?.userId || `aff-${Date.now()}`;
    const code = `B${tierLevel}-${phone.slice(-4)}`;
    const parent = affiliates.find((affiliate) => affiliate.userId === parentAffiliateId);
    const referralUrl = `${window.location.origin.replace(/\/admin\/?$/, '')}/?ref=${encodeURIComponent(userId)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralUrl)}`;

    try {
      const payload = {
        userId,
        name,
        phone,
        address: address.trim(),
        location: { lat: 10.773756, lng: 106.689247 },
        avatar: editingAffiliate?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: tierLevel === 1 ? 'PRESIDENT' : 'BRANCH_LEADER',
        tierLevel,
        levelName: levelName.trim() || TIER_CONFIG[tierLevel].levelName,
        commissionLabel: editingAffiliate?.commissionLabel || TIER_CONFIG[tierLevel].commissionLabel,
        parentAffiliateId: tierLevel === 1 ? undefined : parentAffiliateId,
        presidentId: tierLevel === 1 ? undefined : tierLevel === 2 ? parentAffiliateId : parent?.presidentId,
        referralCode: editingAffiliate?.referralCode || code,
        qrCodeUrl: editingAffiliate?.qrCodeUrl || qrUrl,
        directCommissionRate: editingAffiliate?.directCommissionRate || TIER_CONFIG[tierLevel].rate,
        overridingCommissionRate: tierLevel === 1 ? (editingAffiliate?.overridingCommissionRate || TIER_CONFIG[tierLevel].rate) : 0,
        walletBalance: editingAffiliate?.walletBalance || 0,
        totalSales: editingAffiliate?.totalSales || 0,
      };
      if (editingAffiliate) {
        await api.updateAffiliate(editingAffiliate.userId, payload);
      } else {
        await api.createAffiliate(payload);
      }
      setIsModalOpen(false);
      resetForm();
      loadAffiliates();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo tài khoản');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const openCommissionModal = (profile: AffiliateProfile) => {
    const tier = getTierLevel(profile);
    setSelectedCommissionProfile(profile);
    setAssignTierLevel(tier);
    setAssignLevelName(profile.levelName || TIER_CONFIG[tier].levelName);
    setAssignParentAffiliateId(profile.parentAffiliateId || profile.presidentId || '');
    setAssignCommissionLabel(getCommissionLabel(profile));
    setAssignCommissionRate(String(getCommissionRate(profile)));
  };

  const deleteAffiliate = async (profile: AffiliateProfile) => {
    if (!window.confirm(`Xóa hội viên ${profile.name}?`)) return;
    try {
      await api.deleteAffiliate(profile.userId);
      loadAffiliates();
    } catch (error: any) {
      alert(error.message || 'Không thể xóa hội viên');
    }
  };

  const handleAssignCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommissionProfile) return;

    try {
      const updated = await api.assignAffiliateCommission(selectedCommissionProfile.userId, {
        tierLevel: assignTierLevel,
        levelName: assignLevelName.trim() || TIER_CONFIG[assignTierLevel].levelName,
        parentAffiliateId: assignTierLevel === 1 ? '' : assignParentAffiliateId,
        commissionLabel: assignCommissionLabel.trim() || getCommissionLabel(selectedCommissionProfile),
        rate: parseFloat(assignCommissionRate) || 0,
      });
      setAffiliates((items) =>
        items.map((affiliate) => affiliate.userId === updated.userId ? updated : affiliate)
      );
      setSelectedCommissionProfile(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gán hoa hồng');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Quản Lý Mạng Lưới Chi Hội Trưởng & Chủ Tịch Hội
          </h3>
          <p className="text-xs text-slate-400">Quản lý cấp bậc, Mã QR Code giới thiệu và Tỷ lệ hoa hồng đa tầng</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Hội Viên Mới</span>
        </button>
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <h4 className="text-base font-bold text-white">Sơ Đồ Cấp Bậc Hội</h4>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Đang dựng sơ đồ cấp bậc...</div>
        ) : hierarchy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
            Chưa có Bậc 1. Hãy tạo Bậc 1 trước, sau đó gắn Bậc 2 và Bậc 3 vào đúng tuyến.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hierarchy.map(({ president, branches }) => (
              <div key={president.userId} className="rounded-xl border border-purple-500/30 bg-slate-900/50 p-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700/70">
                  <div className="w-11 h-11 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-purple-300">
                      {president.levelName || TIER_CONFIG[1].levelName}
                    </div>
                    <div className="font-bold text-white">{president.name}</div>
                    <div className="text-xs text-slate-400">{president.phone}</div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                      <Percent className="w-3 h-3" />
                      {getCommissionLabel(president)} {getCommissionRate(president)}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {branches.length === 0 ? (
                    <div className="rounded-lg bg-slate-800/70 px-3 py-3 text-xs text-slate-400">
                      Chưa có Bậc 2 trực thuộc Bậc 1 này.
                    </div>
                  ) : (
                    branches.map(({ branch, children }) => (
                      <div key={branch.userId} className="ml-4 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 space-y-2">
                        <div className="text-xs font-bold text-blue-300">
                          {branch.levelName || TIER_CONFIG[2].levelName}
                        </div>
                        <div className="text-sm font-semibold text-white">{branch.name}</div>
                        <div className="text-xs text-slate-400">{branch.phone}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] font-semibold text-cyan-100">
                          {getHierarchyPath(branch, affiliates).map((part, index, parts) => (
                            <React.Fragment key={`${branch.userId}-${part}-${index}`}>
                              <span>{part}</span>
                              {index < parts.length - 1 && <ChevronRight className="w-3 h-3 text-slate-500" />}
                            </React.Fragment>
                          ))}
                        </div>
                        {children.map((child) => (
                          <div key={child.userId} className="ml-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                            <div className="text-xs font-bold text-emerald-300">
                              {child.levelName || TIER_CONFIG[3].levelName}
                            </div>
                            <div className="text-sm font-semibold text-white">{child.name}</div>
                            <div className="text-xs text-slate-400">{child.phone}</div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affiliates List */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Nhân sự</th>
                  <th className="py-3.5 px-4">Cấp bậc</th>
                  <th className="py-3.5 px-4">Địa chỉ tự đến lấy</th>
                  <th className="py-3.5 px-4">Tuyến trên</th>
                  <th className="py-3.5 px-4">Cấu hình hoa hồng</th>
                  <th className="py-3.5 px-4">Ví hoa hồng</th>
                  <th className="py-3.5 px-4">Tổng doanh số</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {affiliates.map((aff) => {
                  const parent = affiliates.find((p) => p.userId === (aff.parentAffiliateId || aff.presidentId));
                  const tier = getTierLevel(aff);
                  return (
                    <tr key={aff.userId} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <img
                          src={aff.avatar}
                          alt={aff.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white">{aff.name}</div>
                          <div className="text-xs text-slate-400">{aff.phone}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            tier === 1
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : tier === 2
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {aff.levelName || TIER_CONFIG[tier].levelName}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-xs text-xs text-slate-400">
                        {aff.address || 'Chưa cập nhật địa chỉ'}
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {tier === 1 ? '—' : parent?.name || 'Chưa gắn tuyến trên'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs space-y-0.5">
                          <div className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5" /> {getCommissionLabel(aff)}: {getCommissionRate(aff)}%
                          </div>
                          <div className="flex flex-wrap items-center gap-1 text-slate-400">
                            {getHierarchyPath(aff, affiliates).map((part, index, parts) => (
                              <React.Fragment key={`${aff.userId}-path-${part}-${index}`}>
                                <span>{part}</span>
                                {index < parts.length - 1 && <ChevronRight className="w-3 h-3" />}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-400">
                        {formatMoney(aff.walletBalance)}
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-400">
                        {formatMoney(aff.totalSales)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openCommissionModal(aff)}
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Percent className="w-4 h-4" />
                            Gán hoa hồng
                          </button>
                          <button
                            onClick={() => openEditModal(aff)}
                            className="p-2 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            Sửa
                          </button>
                        <button
                          onClick={() => setSelectedQr(aff)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          Xem QR
                        </button>
                        <button
                          onClick={() => deleteAffiliate(aff)}
                          className="p-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Preview Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base">Mã QR Code Giới Thiệu</h4>
              <button onClick={() => setSelectedQr(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
              <img src={selectedQr.qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <div>
              <div className="font-bold text-white text-lg">{selectedQr.name}</div>
              <div className="text-xs text-blue-400 font-mono mt-0.5">Mã giới thiệu: {selectedQr.referralCode}</div>
              <p className="text-xs text-slate-400 mt-2">
                Khách quét QR này để mua trên Zalo Mini App. Hoa hồng sẽ tự động trích cho {selectedQr.name}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Commission Assignment Modal */}
      {selectedCommissionProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Gán hoa hồng</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedCommissionProfile.name} - {selectedCommissionProfile.levelName || TIER_CONFIG[getTierLevel(selectedCommissionProfile)].levelName}
                </p>
              </div>
              <button onClick={() => setSelectedCommissionProfile(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAssignCommission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bậc áp dụng *</label>
                <select
                  value={assignTierLevel}
                  onChange={(e) => {
                    const nextTier = Number(e.target.value) as 1 | 2 | 3;
                    setAssignTierLevel(nextTier);
                    setAssignLevelName(TIER_CONFIG[nextTier].levelName);
                    setAssignCommissionLabel(TIER_CONFIG[nextTier].commissionLabel);
                    setAssignCommissionRate(String(TIER_CONFIG[nextTier].rate));
                    setAssignParentAffiliateId('');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>Bậc 1 - 5% toàn tuyến</option>
                  <option value={2}>Bậc 2 - 25% bán hàng/tự mua</option>
                  <option value={3}>Bậc 3 - 15% bán hàng/tự mua</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên bậc *</label>
                <input
                  type="text"
                  required
                  value={assignLevelName}
                  onChange={(e) => setAssignLevelName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder={TIER_CONFIG[assignTierLevel].levelName}
                />
              </div>

              {assignTierLevel > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Tuyến trên *
                  </label>
                  <select
                    value={assignParentAffiliateId}
                    onChange={(e) => setAssignParentAffiliateId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn {assignTierLevel === 2 ? 'Bậc 1' : 'Bậc 2'} --</option>
                    {(assignTierLevel === 2 ? presidents : tierTwoAffiliates).map((item) => (
                      <option key={item.userId} value={item.userId}>
                        {item.name} ({item.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên hoa hồng / nhánh *</label>
                <input
                  type="text"
                  required
                  value={assignCommissionLabel}
                  onChange={(e) => setAssignCommissionLabel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder={TIER_CONFIG[assignTierLevel].commissionLabel}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tỷ lệ hoa hồng (%) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={assignCommissionRate}
                  onChange={(e) => setAssignCommissionRate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-[11px] text-slate-400">
                Áp dụng cho đơn hàng phát sinh sau khi gán. Lịch sử hoa hồng cũ vẫn giữ nguyên để đối soát.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCommissionProfile(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30"
                >
                  Lưu hoa hồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">{editingAffiliate ? 'Sửa Hội Viên' : 'Thêm Hội Viên Mới'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="0912345678"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Địa chỉ tự đến lấy *</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[86px]"
                  placeholder="Nhập địa chỉ nhà/kho/điểm nhận của Chủ tịch hội hoặc Chi hội trưởng"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bậc trong cây hoa hồng *</label>
                <select
                  value={tierLevel}
                  onChange={(e) => handleTierChange(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>Bậc 1 - Chủ tịch / 5% toàn tuyến</option>
                  <option value={2}>Bậc 2 - Chi hội trưởng / 25%</option>
                  <option value={3}>Bậc 3 - Hội viên bán hàng / 15%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên cấp bậc hiển thị *</label>
                <input
                  type="text"
                  required
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder={TIER_CONFIG[tierLevel].levelName}
                />
              </div>

              {tierLevel > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Tuyến trên ({tierLevel === 2 ? 'Bậc 1' : 'Bậc 2'})
                  </label>
                  <select
                    value={parentAffiliateId}
                    onChange={(e) => setParentAffiliateId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn {tierLevel === 2 ? 'Bậc 1' : 'Bậc 2'} --</option>
                    {(tierLevel === 2 ? presidents : tierTwoAffiliates).map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.name} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-[11px] text-slate-400">
                Sau khi tạo nhân sự, dùng nút <span className="font-bold text-emerald-300">Gán hoa hồng</span> trong danh sách để thiết lập tên nhánh và tỷ lệ hoa hồng riêng.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30"
                >
                  {editingAffiliate ? 'Lưu Thay Đổi' : 'Lưu Hội Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
