import { Button } from "zmp-ui";
import { useEffect, useState } from "react";
import CommerceIcon from "./commerce-icon";

export interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
}

export default function QuantityInput(props: QuantityInputProps) {
  const [localValue, setLocalValue] = useState(String(props.value));

  useEffect(() => {
    setLocalValue(String(props.value));
  }, [props.value]);

  return (
    <div className="w-full flex items-center">
      <Button
        size="small"
        variant="tertiary"
        className="min-w-0 aspect-square liquid-button"
        onClick={() =>
          props.onChange(Math.max(props.minValue ?? 0, props.value - 1))
        }
      >
        <CommerceIcon name="minus" size={15} strokeWidth={2.4} />
      </Button>
      <input
        style={{ width: `calc(${String(props.value).length}ch + 16px)` }}
        className="flex-1 text-center font-bold commerce-caption px-2 bg-transparent focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        type="number"
        inputMode="numeric"
        value={localValue}
        onChange={(e) => setLocalValue(e.currentTarget.value)}
        onBlur={() =>
          props.onChange(Math.max(props.minValue ?? 0, Number(localValue)))
        }
      />
      <Button
        size="small"
        variant="tertiary"
        className="min-w-0 aspect-square liquid-button"
        onClick={() => props.onChange(props.value + 1)}
      >
        <CommerceIcon name="plus" size={15} strokeWidth={2.4} />
      </Button>
    </div>
  );
}
