import React, { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin, X, Pencil } from 'lucide-react';
import { api } from '../api';
import { Station } from '../types';

export const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [assignedAffiliateIds, setAssignedAffiliateIds] = useState('');
  const [lat, setLat] = useState('10.773756');
  const [lng, setLng] = useState('106.689247');

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await api.getStations();
      setStations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;
    try {
      const payload = {
        name,
        address,
        image: image || '/icon.png',
        branchName,
        branchPhone,
        assignedAffiliateIds: assignedAffiliateIds
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      };
      if (editing) {
        await api.updateStation(editing.id, payload);
      } else {
        await api.createStation(payload);
      }
      setIsModalOpen(false);
      setEditing(null);
      setName('');
      setAddress('');
      setImage('');
      setBranchName('');
      setBranchPhone('');
      setAssignedAffiliateIds('');
      loadStations();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm điểm nhận');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setAddress('');
    setImage('');
    setBranchName('');
    setBranchPhone('');
    setAssignedAffiliateIds('');
    setLat('10.773756');
    setLng('106.689247');
    setIsModalOpen(true);
  };

  const openEdit = (station: Station) => {
    setEditing(station);
    setName(station.name);
    setAddress(station.address);
    setImage(station.image || '');
    setBranchName(station.branchName || '');
    setBranchPhone(station.branchPhone || station.phone || '');
    setAssignedAffiliateIds((station.assignedAffiliateIds || []).join(', '));
    setLat(String(station.location?.lat || 10.773756));
    setLng(String(station.location?.lng || 106.689247));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Xóa điểm nhận hàng này?')) {
      try {
        await api.deleteStation(id);
        loadStations();
      } catch (err: any) {
        alert(err.message || 'Xóa thất bại');
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Chi Nhánh & Điểm Nhận Hàng (Stations)
          </h3>
          <p className="text-xs text-slate-400">Danh sách cửa hàng/kho cho phép khách chọn tự đến lấy hàng trên Mini App</p>
        </div>

        <button
          onClick={openCreate}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Chi Nhánh Mới</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải danh sách...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((s) => (
            <div
              key={s.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="flex gap-4">
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                />
                <div>
                  <h4 className="font-bold text-white text-base">{s.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    {s.address}
                  </p>
                  {(s.branchName || s.branchPhone) && (
                    <p className="mt-2 text-xs font-semibold text-cyan-200">
                      {s.branchName || s.name}{s.branchPhone ? ` · ${s.branchPhone}` : ''}
                    </p>
                  )}
                  {Boolean(s.assignedAffiliateIds?.length) && (
                    <p className="mt-1 text-[11px] text-amber-200">
                      Gán {s.assignedAffiliateIds?.length} hội viên
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => openEdit(s)}
                  className="p-2 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">{editing ? 'Sửa Điểm Nhận Hàng' : 'Thêm Chi Nhánh Mới'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditing(null); }} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên Chi Nhánh *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Saximi shop - Hồ Chí Minh"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Địa chỉ *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Số nhà, đường, Phường/xã, Tỉnh thành..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Hình ảnh</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tên chi nhánh hiển thị</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Ví dụ: Chi nhánh Quận 7"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">SĐT chi nhánh</label>
                  <input
                    type="tel"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="090..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">ID hội viên được gán</label>
                <textarea
                  value={assignedAffiliateIds}
                  onChange={(e) => setAssignedAffiliateIds(e.target.value)}
                  className="min-h-20 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Nhập userId hội viên, cách nhau bằng dấu phẩy. Ví dụ: aff-1, aff-2"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Nếu có gán hội viên, khách đi qua link hội viên đó sẽ ưu tiên chỉ thấy chi nhánh này.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30"
                >
                  {editing ? 'Lưu Thay Đổi' : 'Lưu Chi Nhánh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
