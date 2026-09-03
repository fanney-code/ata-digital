import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface UnlockRegistrationModalProps {
  isOpen: boolean;
  registrationNumber: string;
  candidateName: string;
  onClose: () => void;
  onConfirmUnlock: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const UnlockRegistrationModal: React.FC<UnlockRegistrationModalProps> = ({
  isOpen,
  registrationNumber,
  candidateName,
  onClose,
  onConfirmUnlock,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('A mandatory audit reason is required to unlock an approved registration.');
      return;
    }

    setErrorMsg('');
    await onConfirmUnlock(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Unlock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-slate-100">
                Unlock Approved Registration
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Mandatory Admin Audit Requirement
              </p>
            </div>
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
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Unlocking registration <strong className="font-mono">{registrationNumber}</strong> for candidate <strong>{candidateName}</strong> will return it to reviewable/editable status and generate an immutable security audit entry.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              Mandatory Reason for Unlocking <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g., Emergency correction of spelling in candidate national ID per official request..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            {errorMsg && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                {errorMsg}
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Unlocking & Logging Audit...' : 'Confirm Unlock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
