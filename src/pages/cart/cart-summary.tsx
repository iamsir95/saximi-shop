import { useAtomValue } from "jotai";
import { cartTotalState } from "@/state";
import { formatPrice } from "@/utils/format";
import Section from "@/components/section";
import HorizontalDivider from "@/components/horizontal-divider";
import { cartState } from "@/state";
import { getSavedAmount } from "@/utils/commerce";

export default function CartSummary() {
  const {
    subtotal,
    discountAmount,
    selectedCoupon,
    isCouponApplied,
    totalAmount,
  } = useAtomValue(cartTotalState);
  const cart = useAtomValue(cartState);
  const productSavings = cart.reduce(
    (total, item) => total + getSavedAmount(item.product) * item.quantity,
    0
  );
  const totalSavings = productSavings + discountAmount;

  return (
    <Section title="Thanh toán" className="rounded-lg">
      <div className="px-4 py-2 space-y-4">
        <table className="table w-full text-sm [&_th]:text-left [&_th]:text-xs [&_th]:text-inactive [&_th]:font-medium [&_td]:text-right">
          <tbody>
            <tr>
              <th>Tạm tính</th>
              <td>{formatPrice(subtotal)}</td>
            </tr>
            {selectedCoupon && isCouponApplied && (
              <tr>
                <th>Voucher ({selectedCoupon.code})</th>
                <td className="text-primary">-{formatPrice(discountAmount)}</td>
              </tr>
            )}
            {selectedCoupon && !isCouponApplied && (
              <tr>
                <th>Voucher ({selectedCoupon.code})</th>
                <td className="text-danger text-xs">
                  Chưa đủ {formatPrice(selectedCoupon.minOrderAmount)}
                </td>
              </tr>
            )}
            <tr>
              <th>Phí vận chuyển</th>
              <td>0 VND</td>
            </tr>
            {productSavings > 0 && (
              <tr>
                <th>Tiết kiệm từ giá niêm yết</th>
                <td className="text-primary">-{formatPrice(productSavings)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <HorizontalDivider />
        {totalSavings > 0 && (
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Đơn này đang tiết kiệm {formatPrice(totalSavings)}
          </div>
        )}
        <div className="flex justify-between font-medium text-sm">
          <div>Tổng thanh toán</div>
          <div>{formatPrice(totalAmount)}</div>
        </div>
      </div>
    </Section>
  );
}
