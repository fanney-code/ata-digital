import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting?: boolean;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide specific correction instructions for the registrar.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border-b border-amber-200/50 dark:border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Request Correction
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Specify the missing documents or corrections required. The status will be updated to{' '}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              CORRECTION REQUIRED
            </span>{' '}
            and assigned back to the Registrar.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Correction Reason & Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., High school transcript copy is unreadable. Please upload a clear original copy and verify ID number..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            {error && <p className="mt-1 text-[11px] font-semibold text-rose-500">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
