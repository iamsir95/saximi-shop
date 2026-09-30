import { useEffect, useState } from 'react';
import { api } from '../api';
import { Coupon } from '../types';

export function VoucherPicker({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); setError(''); api.getCoupons().then(setCoupons).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  return <fieldset className="border-t border-slate-700 pt-4 space-y-3"><legend className="text-sm font-semibold">Nhãn voucher ({value.length}/8)</legend>
    <input aria-label="Tìm voucher" placeholder="Tìm mã voucher" className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
    {loading ? <p className="text-sm">Đang tải voucher…</p> : error ? <p role="alert">{error} <button type="button" onClick={load}>Thử lại</button></p> : <div className="max-h-64 overflow-y-auto space-y-2">
      {coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase())).map(c => <label key={c.id} className="flex gap-3 items-start rounded-lg border border-slate-700 p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={value.includes(c.id)} disabled={!value.includes(c.id) && value.length >= 8} onChange={e => onChange(e.target.checked ? [...value, c.id] : value.filter(id => id !== c.id))} />
        <span className="min-w-0 break-words"><strong>{c.code}</strong> · Giảm {c.discountPercent}%<span className="block text-xs text-slate-400 mt-1">Đơn từ {c.minOrderAmount.toLocaleString('vi-VN')}đ · HSD {c.expiryDate}{!c.isActive ? ' · Đã tắt' : ''}</span></span>
      </label>)}
      {!coupons.length && <p className="text-sm text-slate-400">Chưa có voucher. Tạo voucher trong mục Bán hàng → Voucher.</p>}
      {value.filter(id => !coupons.some(c => c.id === id)).map(id => <button type="button" key={id} className="text-sm text-rose-300" onClick={() => onChange(value.filter(v => v !== id))}>Bỏ voucher không còn tồn tại #{id}</button>)}
    </div>}
  </fieldset>;
}
