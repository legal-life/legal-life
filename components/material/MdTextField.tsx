import { useId, type InputHTMLAttributes } from "react";

// Material Design 3 のFilled Text Field相当。フローティングラベルは
// peer-focus/peer-placeholder-shownによるCSSのみの実装(:placeholder-shownを
// 使うためplaceholder=" "を必須にする)。
type MdTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  containerClassName?: string;
};

export default function MdTextField({ label, error, id, containerClassName = "", className = "", ...props }: MdTextFieldProps) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={containerClassName}>
      <div className="relative">
        <input
          id={inputId}
          className={`peer w-full rounded-t-m3-xs border-b-2 bg-md-surface-container-highest px-4 pt-5 pb-1.5 text-m3-body-large text-md-on-surface outline-none transition-colors placeholder-shown:pt-3.5 placeholder-shown:pb-3.5 focus:border-md-primary ${
            error ? "border-md-error" : "border-md-on-surface-variant/50"
          } ${className}`}
          {...props}
          placeholder=" "
        />
        <label
          htmlFor={inputId}
          className={`pointer-events-none absolute left-4 top-1.5 text-m3-body-small transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-m3-body-large peer-focus:top-1.5 peer-focus:text-m3-body-small peer-focus:text-md-primary ${
            error ? "text-md-error" : "text-md-on-surface-variant"
          }`}
        >
          {label}
        </label>
      </div>
      {error && <p className="mt-1 px-4 text-m3-body-small text-md-error">{error}</p>}
    </div>
  );
}
