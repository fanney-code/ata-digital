import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Unable to load data',
  message = 'Unable to fetch portal information. Please check your connection and try again.',
  onRetry,
}) => {
  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 p-6 text-slate-800 dark:text-slate-200">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">
            {title}
          </h3>
          <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-1">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry Operation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
