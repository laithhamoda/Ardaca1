import React from 'react';

interface StatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function Stat({ label, value, sublabel, trend, icon, isLoading }: StatProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-semibold text-slate-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-semibold ${
                  trend.direction === 'up' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.direction === 'up' ? '+' : '-'}{trend.value}%
              </span>
            )}
          </div>
          {sublabel && <p className="text-sm text-slate-500 mt-2">{sublabel}</p>}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}
