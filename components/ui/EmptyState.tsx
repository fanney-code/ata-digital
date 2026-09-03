import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "You're all caught up",
  description = "No records match the current criteria.",
  icon: Icon = FileQuestion,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
