import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">{leftIcon}</div>}
          <input
            ref={ref}
            className={`w-full rounded-xl border ${
              error ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:ring-brand-100'
            } ${leftIcon ? 'pl-10' : 'px-4'} ${rightIcon ? 'pr-10' : ''} py-2.5 text-slate-900 bg-slate-50 outline-none transition focus:border-brand-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              className || ''
            }`}
            {...props}
          />
          {rightIcon && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">{rightIcon}</div>}
        </div>
        {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
        {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
