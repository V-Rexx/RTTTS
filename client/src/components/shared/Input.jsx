import React from 'react';

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-400 select-none uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg text-sm bg-slate-800 border text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400 font-medium select-none animate-fade-in mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
