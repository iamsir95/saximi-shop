import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, GitBranch, Mail, Phone, Plus, Search, ShieldCheck, Trash2, UserRoundCheck, UserRoundX, X } from 'lucide-react';
import { api } from '../api';
import { StaffMember, StaffRole, StaffStatus } from '../types';

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Quản trị',
  MANAGER: 'Quản lý',
  WAREHOUSE: 'Kho',
  DELIVERY: 'Giao hàng',
  ACCOUNTANT: 'Kế toán',
  SUPPORT: 'CSKH',
};

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as Array<[StaffRole, string]>;

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  role: 'SUPPORT' as StaffRole,
  status: 'active' as StaffStatus,
  department: 'Vận hành',
  managerId: '',
  note: '',
};

type StaffTreeNode = StaffMember & { children: StaffTreeNode[] };

function buildStaffTree(staff: StaffMember[]): StaffTreeNode[] {
  const nodeMap = new Map<number, StaffTreeNode>();
  staff.forEach((member) => nodeMap.set(member.id, { ...member, children: [] }));

  const roots: StaffTreeNode[] = [];
  nodeMap.forEach((node) => {
    const managerId = node.managerId || undefined;
    const manager = managerId ? nodeMap.get(managerId) : undefined;
    if (manager && manager.id !== node.id) {
      manager.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: StaffTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
}

function getDescendantIds(staff: StaffMember[], memberId: number): Set<number> {
  const childrenByManager = new Map<number, StaffMember[]>();
  staff.forEach((member) => {
    if (!member.managerId) return;
    const children = childrenByManager.get(member.managerId) || [];
    children.push(member);
    childrenByManager.set(member.managerId, children);
  });

  const descendantIds = new Set<number>();
  const stack = [...(childrenByManager.get(memberId) || [])];
  while (stack.length > 0) {
    const child = stack.pop();
    if (!child || descendantIds.has(child.id)) continue;
    descendantIds.add(child.id);
    stack.push(...(childrenByManager.get(child.id) || []));
  }

  return descendantIds;
}

function StaffTree({
  nodes,
  level = 0,
  onEdit,
}: {
  nodes: StaffTreeNode[];
  level?: number;
  onEdit: (member: StaffMember) => void;
}) {
  return (
    <div className={level === 0 ? 'space-y-3' : 'ml-5 mt-3 space-y-3 border-l border-slate-700/70 pl-4'}>
      {nodes.map((node) => (
        <div key={node.id}>
          <button
            onClick={() => onEdit(node)}
            className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 text-left hover:border-blue-500/40 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">{node.name}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {ROLE_LABELS[node.role]} · {node.department}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                node.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-400'
              }`}>
                {node.status === 'active' ? 'Đang làm' : 'Tạm nghỉ'}
              </span>
            </div>
          </button>
          {node.children.length > 0 && (
            <StaffTree nodes={node.children} level={level + 1} onEdit={onEdit} />
          )}
        </div>
      ))}
    </div>
  );
}

export const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff();
      setStaff(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return staff.filter((member) =>
      [member.name, member.phone, member.email, member.department, ROLE_LABELS[member.role]]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [search, staff]);

  const activeCount = staff.filter((member) => member.status === 'active').length;
  const deliveryCount = staff.filter((member) => member.role === 'DELIVERY').length;
  const rootCount = staff.filter((member) => !member.managerId).length;
  const staffTree = useMemo(() => buildStaffTree(filteredStaff), [filteredStaff]);
  const managerOptions = useMemo(() => {
    if (!editing) return staff;
    const blockedIds = getDescendantIds(staff, editing.id);
    blockedIds.add(editing.id);
    return staff.filter((member) => !blockedIds.has(member.id));
  }, [editing, staff]);

  const openCreateForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (member: StaffMember) => {
    setEditing(member);
    setForm({
      name: member.name,
      phone: member.phone,
      email: member.email || '',
      role: member.role,
      status: member.status,
      department: member.department,
      managerId: member.managerId ? String(member.managerId) : '',
      note: member.note || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.saveStaff({
      ...(editing ? { id: editing.id } : {}),
      ...form,
      managerId: form.managerId ? Number(form.managerId) : undefined,
    });
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    loadStaff();
  };

  const toggleStatus = async (member: StaffMember) => {
    await api.updateStaffStatus(member.id, member.status === 'active' ? 'inactive' : 'active');
    loadStaff();
  };

  const deleteStaff = async (member: StaffMember) => {
    if (!window.confirm(`Xóa nhân sự ${member.name}?`)) return;
    try {
      await api.deleteStaff(member.id);
      loadStaff();
    } catch (error: any) {
      alert(error.message || 'Không thể xóa nhân sự');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BriefcaseBusiness className="w-5 h-5 text-blue-400" />
            Quản Lý Nhân Sự
          </h3>
          <p className="text-xs text-slate-400">
            Theo dõi nhân viên nội bộ, vai trò vận hành, kế toán, kho và giao hàng.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, SĐT, bộ phận..."
              className="w-full bg-slate-900 border border-slate-700 text-sm rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
          >
            <Plus className="w-4 h-4" />
            Thêm nhân sự
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5">
          <div className="text-xs text-slate-400">Tổng nhân sự</div>
          <div className="mt-2 text-2xl font-black text-white">{staff.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-xs text-emerald-300">Đang hoạt động</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="text-xs text-blue-300">Đội giao hàng</div>
          <div className="mt-2 text-2xl font-black text-blue-300">{deliveryCount}</div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
          <div className="text-xs text-purple-300">Cấp gốc</div>
          <div className="mt-2 text-2xl font-black text-purple-300">{rootCount}</div>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-bold text-white">Cây cấp bậc nhân sự</h3>
            <p className="text-xs text-slate-400">Thiết lập cấp trên trực tiếp để tạo nhiều tầng quản lý.</p>
          </div>
        </div>
        {staffTree.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
            Chưa có dữ liệu cây nhân sự phù hợp bộ lọc.
          </div>
        ) : (
          <StaffTree nodes={staffTree} onEdit={openEditForm} />
        )}
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách nhân sự...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Chưa có nhân sự phù hợp</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Nhân sự</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4">Bộ phận</th>
                  <th className="py-3.5 px-4">Cấp trên</th>
                  <th className="py-3.5 px-4">Ghi chú</th>
                  <th className="py-3.5 px-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <button onClick={() => openEditForm(member)} className="text-left">
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: {member.id}</div>
                      </button>
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        {member.phone}
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          {member.email}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{member.department}</td>
                    <td className="py-4 px-4 text-slate-400">
                      {staff.find((manager) => manager.id === member.managerId)?.name || 'Cấp gốc'}
                    </td>
                    <td className="py-4 px-4 text-slate-400 max-w-xs truncate">{member.note || '—'}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => toggleStatus(member)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          member.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-700/60 text-slate-400 border-slate-600'
                        }`}
                      >
                        {member.status === 'active' ? <UserRoundCheck className="w-3.5 h-3.5" /> : <UserRoundX className="w-3.5 h-3.5" />}
                        {member.status === 'active' ? 'Đang làm' : 'Tạm nghỉ'}
                      </button>
                      <button
                        onClick={() => deleteStaff(member)}
                        className="ml-2 inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{editing ? 'Cập nhật nhân sự' : 'Thêm nhân sự'}</h3>
                <p className="text-xs text-slate-400">Quản lý hồ sơ nhân sự nội bộ Saximi shop.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-300">Tên nhân sự</span>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-300">Số điện thoại</span>
                <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-300">Email</span>
                <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-300">Bộ phận</span>
                <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-300">Vai trò</span>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500">
                  {ROLE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-300">Trạng thái</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StaffStatus })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500">
                  <option value="active">Đang làm</option>
                  <option value="inactive">Tạm nghỉ</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-300">Cấp trên trực tiếp</span>
                <select value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500">
                  <option value="">Cấp gốc / không trực thuộc ai</option>
                  {managerOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {ROLE_LABELS[member.role]} / {member.department}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-300">Ghi chú</span>
              <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800">
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
                Lưu nhân sự
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
