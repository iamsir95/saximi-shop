type PinCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
};

export function PinDots({ value, maxLength = 6 }: Pick<PinCodeInputProps, "value" | "maxLength">) {
  return (
    <div className="pin-dots" aria-label={`${value.length} chữ số đã nhập`}>
      {Array.from({ length: maxLength }).map((_, index) => (
        <span key={index} className={index < value.length ? "pin-dot pin-dot--filled" : "pin-dot"} />
      ))}
    </div>
  );
}

export default function PinCodeInput({ value, onChange, maxLength = 6 }: PinCodeInputProps) {
  const addDigit = (digit: string) => {
    if (value.length >= maxLength) return;
    onChange(`${value}${digit}`);
  };

  const removeDigit = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div className="pin-code-input">
      <PinDots value={value} maxLength={maxLength} />
      <div className="number-pad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button key={digit} type="button" className="number-key" onClick={() => addDigit(digit)}>
            {digit}
          </button>
        ))}
        <span />
        <button type="button" className="number-key" onClick={() => addDigit("0")}>
          0
        </button>
        <button type="button" className="number-key number-key--muted" onClick={removeDigit}>
          Xóa
        </button>
      </div>
    </div>
  );
}
