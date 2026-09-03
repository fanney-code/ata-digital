import React from 'react';
import { WorkflowStatus } from '@/lib/types';

interface WorkflowItem {
  status: WorkflowStatus;
  label: string;
  count: number;
  percentage: number;
  color?: string;
}

interface WorkflowDistributionProps {
  distribution: WorkflowItem[];
  variant?: 'list' | 'bars';
}

export const WorkflowDistribution: React.FC<WorkflowDistributionProps> = ({
  distribution,
  variant = 'bars',
}) => {
  const formatCount = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  const getBarColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-400';
      case 'SUBMITTED':
        return 'bg-blue-600';
      case 'UNDER_REVIEW':
        return 'bg-purple-600';
      case 'CORRECTION_REQUIRED':
        return 'bg-rose-500';
      case 'RESUBMITTED':
        return 'bg-red-400';
      case 'APPROVED':
        return 'bg-blue-600';
      default:
        return 'bg-slate-500';
    }
  };

  const getDotColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-blue-500';
      case 'SUBMITTED':
        return 'bg-blue-600';
      case 'UNDER_REVIEW':
        return 'bg-slate-700';
      case 'CORRECTION_REQUIRED':
        return 'bg-slate-600';
      case 'RESUBMITTED':
        return 'bg-slate-500';
      case 'APPROVED':
        return 'bg-blue-600';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
        Workflow Distribution
      </h3>

      {variant === 'list' ? (
        <div className="space-y-3.5">
          {distribution.map((item) => (
            <div key={item.status} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${getDotColor(item.status)}`} />
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {distribution.map((item) => (
            <div key={item.status} className="flex items-center gap-3 text-xs">
              <span className="w-32 font-semibold uppercase text-slate-500 text-[10px] tracking-wider truncate text-right">
                {item.status.replace(/_/g, ' ')}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(item.status)} transition-all duration-300`}
                  style={{ width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono font-bold text-slate-900">
                {formatCount(item.count)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
