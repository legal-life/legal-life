import type { InputHTMLAttributes } from "react";

// Material Design 3 のSwitch。選択時はトラックがprimary色になり、
// つまみ(handle)が大きくなって右へ移動する(M3仕様通りの挙動)。
type MdSwitchProps = InputHTMLAttributes<HTMLInputElement>;

export default function MdSwitch({ className = "", ...props }: MdSwitchProps) {
  return (
    <label className={`relative inline-flex shrink-0 cursor-pointer items-center ${props.disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        className={`block h-8 w-[52px] rounded-full border-2 border-md-outline bg-md-surface-container-highest transition-colors
          peer-checked:border-md-primary peer-checked:bg-md-primary
          peer-focus-visible:ring-2 peer-focus-visible:ring-md-primary/50 ${className}`}
      />
      <span
        className="absolute left-1 top-2 h-4 w-4 rounded-full bg-md-outline transition-all
          peer-checked:left-[26px] peer-checked:top-1 peer-checked:h-6 peer-checked:w-6 peer-checked:bg-md-on-primary"
      />
    </label>
  );
}
