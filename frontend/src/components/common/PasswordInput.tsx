import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Classes for the <input>; padding for the lock and eye icons is added automatically. */
  inputClassName?: string;
  /** Size of the lock / eye icons. */
  iconSize?: 'sm' | 'md';
};

/**
 * Password field with a lock icon on the left and a show/hide (eye) toggle on the right.
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  inputClassName = '',
  iconSize = 'sm',
  ...inputProps
}) => {
  const [visible, setVisible] = useState(false);
  const icon = iconSize === 'md' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
        <Lock className={icon} />
      </span>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={`${inputClassName} ${iconSize === 'md' ? 'pl-11 pr-11' : 'pl-10 pr-10'}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
      >
        {visible ? <EyeOff className={icon} /> : <Eye className={icon} />}
      </button>
    </div>
  );
};
