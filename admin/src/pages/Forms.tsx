import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Edit2, GripVertical, Inbox, Plus, Trash2, X } from 'lucide-react';
import { api } from '../api';
import { DynamicForm, DynamicFormField, DynamicFormFieldType, DynamicFormPlacement, DynamicFormSubmission } from '../types';

const PLACEMENTS: { value: DynamicFormPlacement; label: string }[] = [
  { value: 'news', label: 'Bản tin' },
];

const FIELD_TYPES: { value: DynamicFormFieldType; label: string }[] = [
  { value: 'text', label: 'Văn bản' },
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Đoạn văn' },
  { value: 'select', label: 'Lựa chọn' },
  { value: 'checkbox', label: 'Checkbox' },
];

function emptyField(): DynamicFormField {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: 'Trường thông tin',
    type: 'text',
    placeholder: '',
    required: false,
    options: [],
    sortOrder: 1,
  };
}

function defaultForm(): Partial<DynamicForm> {
  return {
    title: 'Form tư vấn',
    description: 'Để lại thông tin, Saximi Shop sẽ liên hệ hỗ trợ.',
    submitLabel: 'Gửi thông tin',
    successMessage: 'Đã nhận yêu cầu. Saximi Shop sẽ liên hệ lại trong thời gian sớm nhất.',
    placements: ['news'],
    fields: [
      { ...emptyField(), label: 'Họ và tên', required: true, sortOrder: 1 },
      { ...emptyField(), label: 'Số điện thoại', type: 'phone', required: true, sortOrder: 2 },
      { ...emptyField(), label: 'Nội dung cần hỗ trợ', type: 'textarea', sortOrder: 3 },
    ],
    isActive: true,
    sortOrder: 1,
  };
}

export const FormsPage: React.FC = () => {
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [submissions, setSubmissions] = useState<DynamicFormSubmission[]>([]);
  const [editing, setEditing] = useState<Partial<DynamicForm> | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'forms' | 'submissions'>('forms');
  const newRequests = submissions.filter((item) => item.status === 'new').length;

  const sortedFields = useMemo(
    () => [...(editing?.fields || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [editing?.fields]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [formData, submissionData] = await Promise.all([
        api.getForms(),
        api.getFormSubmissions(),
      ]);
      setForms(formData);
      setSubmissions(submissionData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (fieldId: string, patch: Partial<DynamicFormField>) => {
    setEditing((current) => ({
      ...current,
      fields: (current?.fields || []).map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field
      ),
    }));
  };

  const reorderFields = (from: number, to: number) => {
    const next = [...sortedFields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setEditing((current) => ({
      ...current,
      fields: next.map((field, index) => ({ ...field, sortOrder: index + 1 })),
    }));
  };

  const saveForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (editing.id) await api.updateForm(editing.id, editing);
    else await api.createForm(editing);
    setEditing(null);
    load();
  };

  const deleteForm = async (form: DynamicForm) => {
    if (!window.confirm(`Xóa form "${form.title}"?`)) return;
    await api.deleteForm(form.id);
    load();
  };

  const togglePlacement = (value: DynamicFormPlacement) => {
    setEditing((current) => {
      const placements = current?.placements || [];
      return {
        ...current,
        placements: placements.includes(value)
          ? placements.filter((item) => item !== value)
          : [...placements, value],
      };
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            Form động kéo thả
          </h3>
          <p className="text-xs text-slate-400">
            Tạo form tùy biến, kéo thả vào bài viết và nhận yêu cầu khách hàng tại đây.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('forms')}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'forms' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'}`}
          >
            Form
          </button>
          <button
            onClick={() => setTab('submissions')}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'submissions' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'}`}
          >
            Yêu cầu khách {newRequests > 0 ? `(${newRequests})` : ''}
          </button>
          <button
            onClick={() => setEditing(defaultForm())}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tạo form
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải dữ liệu...</div>
      ) : tab === 'forms' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {forms.map((form) => (
            <div key={form.id} className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white">{form.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{form.description}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black text-white ${form.isActive ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  {form.isActive ? 'Đang bật' : 'Đã tắt'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {form.placements.map((placement) => (
                  <span key={placement} className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300">
                    {PLACEMENTS.find((item) => item.value === placement)?.label || placement}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-700/50 pt-4">
                <button onClick={() => setEditing(form)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 p-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20">
                  <Edit2 className="h-4 w-4" /> Sửa
                </button>
                <button onClick={() => deleteForm(form)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 p-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20">
                  <Trash2 className="h-4 w-4" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80">
          {submissions.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              Chưa có phản hồi form.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/60">
              {submissions.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{item.formTitle}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.customerName || 'Khách hàng'} {item.customerPhone ? `- ${item.customerPhone}` : ''} · {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <select
                      value={item.status}
                      onChange={async (event) => {
                        await api.updateFormSubmissionStatus(item.id, event.target.value);
                        load();
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                    >
                      <option value="new">Mới</option>
                      <option value="reviewed">Đã xử lý</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {Object.entries(item.values).map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-slate-900/70 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase text-slate-500">{key}</div>
                        <div className="mt-1 text-sm text-slate-200">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={saveForm} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">{editing.id ? 'Sửa form' : 'Tạo form mới'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-400">Tên form</span>
                <input required value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-400">Nút gửi</span>
                <input value={editing.submitLabel || ''} onChange={(e) => setEditing({ ...editing, submitLabel: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-400">Mô tả</span>
                <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-400">Thông báo sau khi khách gửi</span>
                <input value={editing.successMessage || ''} onChange={(e) => setEditing({ ...editing, successMessage: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white" placeholder="Ví dụ: Đã nhận yêu cầu, chúng tôi sẽ liên hệ lại." />
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-bold uppercase text-slate-400">Gắn vào trang</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PLACEMENTS.map((item) => (
                  <label key={item.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                    <input type="checkbox" checked={(editing.placements || []).includes(item.value)} onChange={() => togglePlacement(item.value)} className="accent-blue-500" />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-400">Trường thông tin kéo thả</div>
                <button type="button" onClick={() => setEditing({ ...editing, fields: [...(editing.fields || []), { ...emptyField(), sortOrder: (editing.fields?.length || 0) + 1 }] })} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                  Thêm trường
                </button>
              </div>
              <div className="space-y-3">
                {sortedFields.map((field, index) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null && dragIndex !== index) reorderFields(dragIndex, index);
                      setDragIndex(null);
                    }}
                    className="grid gap-2 rounded-2xl border border-slate-700 bg-slate-800 p-3 md:grid-cols-[auto_1fr_150px_1fr_1fr_auto_auto]"
                  >
                    <GripVertical className="mt-2 h-5 w-5 cursor-grab text-slate-500" />
                    <input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Tên trường" />
                    <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as DynamicFormFieldType })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
                      {FIELD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    <input value={field.placeholder || ''} onChange={(e) => updateField(field.id, { placeholder: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Gợi ý nhập liệu" />
                    <input value={field.options?.join(', ') || ''} onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Lựa chọn, cách nhau dấu phẩy" />
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <input type="checkbox" checked={Boolean(field.required)} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="accent-blue-500" />
                      Bắt buộc
                    </label>
                    <button type="button" onClick={() => setEditing({ ...editing, fields: (editing.fields || []).filter((item) => item.id !== field.id) })} className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300">
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="accent-blue-500" />
                Bật form
              </label>
              <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
                Lưu form
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
