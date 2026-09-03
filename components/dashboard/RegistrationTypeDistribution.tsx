import React from 'react';
import { RegistrationType } from '@/lib/types';

interface TypeItem {
  type: RegistrationType;
  label: string;
  count: number;
  percentage: number;
}

interface RegistrationTypeDistributionProps {
  distribution: TypeItem[];
}

export const RegistrationTypeDistribution: React.FC<RegistrationTypeDistributionProps> = ({
  distribution,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
        Registration Types
      </h3>

      <div className="space-y-4">
        {distribution.map((item, idx) => (
          <div key={item.type} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="font-mono font-bold text-slate-900">
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  idx === 0
                    ? 'bg-blue-600'
                    : idx === 1
                    ? 'bg-slate-900'
                    : idx === 2
                    ? 'bg-slate-700'
                    : 'bg-slate-500'
                }`}
                style={{ width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
