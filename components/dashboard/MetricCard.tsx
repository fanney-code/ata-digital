import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006f67] flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-2">
        <span className="text-3xl font-extrabold text-[#0f172a] tracking-tight font-sans">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
};
