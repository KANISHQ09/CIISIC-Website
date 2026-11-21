import React, { useId } from 'react';
import { Building, EyeOff, Globe, type LucideIcon } from 'lucide-react';
import { PhoneVisibility } from '../../types';

export const PHONE_VISIBILITY_OPTIONS: { value: PhoneVisibility; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'EVERYONE', label: 'Everyone', hint: 'Anyone viewing the published problem', icon: Globe },
  { value: 'INSTITUTION_SPOCS', label: 'Institution SPOCs only', hint: 'Signed-in partner institutions', icon: Building },
  { value: 'NO_ONE', label: 'No one', hint: 'Only CII can see it', icon: EyeOff },
];

/**
 * Lets an industry choose who can see its mobile number (CII portal review, 16 Nov 2026).
 * CII admins and the company itself can always see it.
 */
export const PhoneVisibilityField: React.FC<{
  value: PhoneVisibility;
  onChange: (value: PhoneVisibility) => void;
  disabled?: boolean;
  className?: string;
}> = ({ value, onChange, disabled = false, className = '' }) => {
  const name = useId();
  return (
    <fieldset className={`space-y-2 ${className}`} disabled={disabled}>
      <legend className="block text-sm font-bold text-stone-700">Who can see your mobile number?</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {PHONE_VISIBILITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'
              } ${
                selected
                  ? 'border-[#063028] bg-[#edf4f0] ring-1 ring-[#063028]'
                  : 'border-stone-300 bg-white hover:border-[#063028]/50'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 accent-[#063028]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#c48825]" aria-hidden="true" />
                  {option.label}
                </span>
                <span className="block mt-0.5 text-xs text-stone-500 leading-snug">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
