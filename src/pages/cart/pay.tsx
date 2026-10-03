import { useCheckout } from "@/hooks";
import { useAtomValue } from "jotai";
import { cartTotalState, shippingFeeEstimateState } from "@/state";
import { formatPrice } from "@/utils/format";
import { Button } from "zmp-ui";
import { useMemo, useState } from "react";
import PaymentMethodSheet from "./payment-method-sheet";
import type { PaymentMethod } from "@/types";
import { loadable } from "jotai/utils";

export default function Pay() {
  const { totalAmount } = useAtomValue(cartTotalState);
  const shippingEstimate = useAtomValue(
    useMemo(() => loadable(shippingFeeEstimateState), [])
  );
  const payableAmount =
    totalAmount + (shippingEstimate.state === "hasData" ? shippingEstimate.data.fee : 0);
  const checkout = useCheckout();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleSelectMethod = async (method: PaymentMethod) => {
    setPaying(true);
    setSheetVisible(false);
    await checkout(method);
    setPaying(false);
  };

  return (
    <>
      <div className="flex-none flex items-center py-3 px-4 gap-3 bg-section md:justify-end md:gap-4">
        <div className="space-y-0.5 flex-1">
          <div className="text-xs text-subtitle">Tổng thanh toán</div>
          <div className="text-base font-black text-primary">{formatPrice(payableAmount)}</div>
        </div>
        <Button
          onClick={() => setSheetVisible(true)}
          disabled={paying || payableAmount <= 0}
          loading={paying}
          className="!rounded-[18px] !font-bold !min-h-11"
        >
          {paying ? "Đang xử lý..." : "Đặt hàng"}
        </Button>
      </div>

      <PaymentMethodSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelect={handleSelectMethod}
        totalAmount={payableAmount}
        loading={paying}
      />
    </>
  );
}
