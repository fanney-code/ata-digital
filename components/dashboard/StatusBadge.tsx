import React from 'react';
import { WorkflowStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: WorkflowStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config: Record<WorkflowStatus, { label: string; bg: string; text: string; border: string }> = {
    DRAFT: {
      label: 'DRAFT',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    SUBMITTED: {
      label: 'SUBMITTED',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    UNDER_REVIEW: {
      label: 'UNDER_REVIEW',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    CORRECTION_REQUIRED: {
      label: 'CORRECTION_REQUIRED',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
    },
    RESUBMITTED: {
      label: 'RESUBMITTED',
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
    },
    APPROVED: {
      label: 'APPROVED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    GRADUATED: {
      label: 'GRADUATED',
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
    },
    COMPLETED: {
      label: 'COMPLETED',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
    },
    NOT_COMPLETED: {
      label: 'NOT COMPLETED',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-300',
    },
    TRANSFERRED: {
      label: 'TRANSFERRED',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-300',
    },
    ARCHIVED: {
      label: 'ARCHIVED',
      bg: 'bg-zinc-100',
      text: 'text-zinc-600',
      border: 'border-zinc-200',
    },
  };

  const style = config[status] || config.DRAFT;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs tracking-wider font-bold',
  };

  return (
    <span
      className={`inline-block font-mono uppercase font-semibold rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}`}
    >
      {style.label}
    </span>
  );
};
