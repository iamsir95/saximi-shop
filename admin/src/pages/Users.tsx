import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Phone, MapPin, Search, UserCheck, Pencil, Trash2, X, Save } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      address: user.address || '',
    });
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    await api.updateUser(editing.id, form);
    setEditing(null);
    loadUsers();
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Xóa khách hàng ${user.name}?`)) return;
    await api.deleteUser(user.id);
    loadUsers();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-400" />
            Danh Sách Khách Hàng Zalo
          </h3>
          <p className="text-xs text-slate-400">Danh sách tài khoản người dùng đã đăng nhập & cấp quyền trên Mini App</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-sm rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách khách hàng...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Chưa có thông tin khách hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Số Điện Thoại</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Địa Chỉ Mặc Định</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <img
                        src={u.avatar || '/icon.png'}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: {u.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        {u.phone || '0912345678'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{u.email || 'N/A'}</td>
                    <td className="py-4 px-4 text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {u.address || 'Chưa cập nhật'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="mr-2 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                        <UserCheck className="w-3.5 h-3.5" />
                        Đã xác thực
                      </span>
                      <button onClick={() => openEdit(u)} className="mr-2 rounded-lg bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteUser(u)} className="rounded-lg bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={saveUser} className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Cập nhật khách hàng</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="grid gap-4">
              {[
                ['name', 'Tên khách hàng'],
                ['phone', 'Số điện thoại'],
                ['email', 'Email'],
                ['address', 'Địa chỉ mặc định'],
              ].map(([key, label]) => (
                <label key={key} className="grid gap-1.5 text-xs font-semibold text-slate-400">
                  {label}
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
              ))}
            </div>
            <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white">
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
