import CommerceIcon from '@/components/commerce-icon';
import toast from 'react-hot-toast';

export type PostVoucher = { id: number; code: string; discountPercent: number; minOrderAmount: number; expiryDate: string; available: boolean };
export function PostVouchers({ vouchers = [] }: { vouchers?: PostVoucher[] }) {
  if (!vouchers.length) return null;
  return <section className="post-vouchers" aria-label="Mã ưu đãi của bài viết">{vouchers.map(v => <div key={v.id} className="post-voucher">
    <CommerceIcon name="ticket" size={24} />
    <div className="post-voucher-info"><strong>{v.code} · Giảm {v.discountPercent}%</strong><span>Đơn từ {v.minOrderAmount.toLocaleString('vi-VN')}đ</span><span>HSD: {new Date(/^\d{4}-\d{2}-\d{2}$/.test(v.expiryDate) ? `${v.expiryDate}T23:59:59+07:00` : v.expiryDate).toLocaleDateString('vi-VN')}</span></div>
    <button type="button" disabled={!v.available} onClick={async () => { try { await navigator.clipboard.writeText(v.code); toast.success('Đã sao chép mã ưu đãi'); } catch { toast.error(`Mã ưu đãi: ${v.code}`); } }}>{v.available ? 'Sao chép mã' : 'Không còn hiệu lực'}</button>
  </div>)}</section>;
}
