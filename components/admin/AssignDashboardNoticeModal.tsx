'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, DashboardNotice, DashboardChecklistItem } from '@/lib/types';
import {
  saveDashboardNotice,
  deactivateDashboardNotice,
  fetchAllAdminNotices,
} from '@/lib/api/notices-service';
import {
  X,
  ShieldCheck,
  Plus,
  Trash2,
  CheckSquare,
  AlertCircle,
  Loader2,
  Check,
  PowerOff,
} from 'lucide-react';

interface AssignDashboardNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (notice: DashboardNotice) => void;
}

export const AssignDashboardNoticeModal: React.FC<AssignDashboardNoticeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [existingNotice, setExistingNotice] = useState<DashboardNotice | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientRole, setRecipientRole] = useState<UserRole>('REGISTRAR');
  const [isActive, setIsActive] = useState(true);
  const [checklistTitle, setChecklistTitle] = useState('ATA Biennial Evaluation Checklist');
  const [items, setItems] = useState<Array<{ id?: string; title: string; description: string; is_completed: boolean }>>([
    {
      title: 'Student Identity & Permanent UID Integrity',
      description: 'All registered candidates possess verified STU-YYYY-XXXXX records.',
      is_completed: true,
    },
    {
      title: 'Secular & Theological Entrance Credentials',
      description: '10th/12th/BTh/BA marksheets verified and archived in Document Locker.',
      is_completed: false,
    },
    {
      title: 'Faculty Ratio & Departmental Accreditation',
      description: 'Minimum 4 residential faculty holding accredited M.Th/D.Min credentials.',
      is_completed: false,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load any currently active notice for Registrar on modal open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    fetchAllAdminNotices()
      .then((notices) => {
        const active = notices.find((n) => n.recipient_role === 'REGISTRAR' && n.is_active);
        if (active) {
          setExistingNotice(active);
          setTitle(active.title);
          setMessage(active.message);
          setRecipientRole(active.recipient_role);
          setIsActive(active.is_active);
          setChecklistTitle(active.checklist_title || 'ATA Biennial Evaluation Checklist');
          if (active.items && active.items.length > 0) {
            setItems(
              active.items.map((it) => ({
                id: it.id,
                title: it.title,
                description: it.description,
                is_completed: Boolean(it.is_completed),
              }))
            );
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        is_completed: false,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Notice Title is required.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Notice Message / Description is required.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please include at least one checklist item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].title.trim()) {
        setErrorMessage(`Checklist item #${i + 1} is missing a title.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: Partial<DashboardNotice> = {
      title: title.trim(),
      message: message.trim(),
      recipient_role: recipientRole,
      is_active: isActive,
      checklist_title: checklistTitle.trim() || 'Audit Checklist',
      items: items.map((it, idx) => ({
        id: it.id || `item-${Date.now()}-${idx}`,
        title: it.title.trim(),
        description: it.description.trim(),
        is_completed: Boolean(it.is_completed),
        sort_order: idx,
      })),
    };

    const res = await saveDashboardNotice(payload);
    setIsSubmitting(false);

    if (!res.success || !res.notice) {
      setErrorMessage(res.error || 'Failed to assign notice.');
      return;
    }

    setSuccessMessage('Dashboard notice and checklist successfully assigned!');
    setTimeout(() => {
      onSuccess(res.notice!);
      onClose();
    }, 600);
  };

  const handleDeactivate = async () => {
    if (!existingNotice) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const ok = await deactivateDashboardNotice(existingNotice.id);
    setIsSubmitting(false);

    if (ok) {
      setIsActive(false);
      setSuccessMessage('Notice deactivated. It will no longer display on the Registrar dashboard.');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage('Failed to deactivate notice.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-[#006f67] border border-teal-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {existingNotice ? 'Manage Dashboard Notice & Checklist' : 'Assign Dashboard Notice'}
              </h3>
              <p className="text-xs text-slate-500">
                Target dynamic notices and governance checklists to institutional roles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#006f67]" />
            <p className="text-xs">Loading existing notice state...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Row 1: Target Role & Active Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Recipient Role
                </label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006f67]/20"
                >
                  <option value="REGISTRAR">Registrar (Institutional)</option>
                  <option value="ADMINISTRATOR">Administrator (Executive)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#006f67] focus:ring-[#006f67]"
                  />
                  <span className="font-bold text-slate-800">
                    Active & Displayed on Dashboard
                  </span>
                </label>
              </div>
            </div>

            {/* Row 2: Notice Title */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Notice Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ATA 2026 Biennial Evaluation Notice"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006f67]/20"
              />
            </div>

            {/* Row 3: Notice Message */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Notice Message / Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Full curriculum audits for M.Div & M.Th degree extensions are scheduled for March 15. All registrar student dossiers must be in approved status."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006f67]/20"
              />
            </div>

            {/* Row 4: Checklist Title */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Checklist Modal Title
              </label>
              <input
                type="text"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                placeholder="e.g. ATA Biennial Evaluation Checklist"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#006f67]/20"
              />
            </div>

            {/* Checklist Items Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Assigned Checklist Items ({items.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Individual requirement cards displayed to the recipient role
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        placeholder={`Requirement #${idx + 1} Title`}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                        title="Delete requirement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Short explanatory description for registrar candidate verification"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                    />

                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={(e) => handleItemChange(idx, 'is_completed', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mark completed by default</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {existingNotice && existingNotice.is_active ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeactivate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  <span>Deactivate Notice</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Assign Notice</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
