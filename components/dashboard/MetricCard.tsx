import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
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
      className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">
          {title}
        </span>
        <div className="p-1.5 rounded-lg border border-blue-100 bg-blue-50/60 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
};
