import React from 'react';

interface AcademicYearItem {
  year: string;
  count: number;
  percentage: number;
}

interface AcademicYearDistributionProps {
  distribution: AcademicYearItem[];
}

export const AcademicYearDistribution: React.FC<AcademicYearDistributionProps> = ({
  distribution,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
        Academic Year Distribution
      </h3>

      <div className="space-y-4">
        {distribution.map((item, idx) => (
          <div key={item.year} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{item.year}</span>
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
                    : 'bg-slate-400'
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
