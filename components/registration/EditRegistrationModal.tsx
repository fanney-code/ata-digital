'use client';

import React, { useState, useEffect } from 'react';
import { Registration, RegistrationType, WorkflowStatus } from '@/lib/types';
import { updateRegistrationAndStudent } from '@/lib/api/supabase-service';
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface EditRegistrationModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditRegistrationModal: React.FC<EditRegistrationModalProps> = ({
  registration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [regType, setRegType] = useState<RegistrationType>('INITIAL_REGISTRATION');
  const [status, setStatus] = useState<WorkflowStatus>('SUBMITTED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (registration) {
      setFirstName(registration.student?.first_name || '');
      setLastName(registration.student?.last_name || '');
      setEmail(registration.student?.email || '');
      setPhone(registration.student?.phone || '');
      setAcademicYear(registration.academic_year || '2026-2027');
      setRegType(registration.registration_type || 'INITIAL_REGISTRATION');
      setStatus(registration.status || 'SUBMITTED');
      setNotes(registration.notes || '');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [registration]);

  if (!isOpen || !registration) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Student first name and last name are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateRegistrationAndStudent(registration.id, registration.student_id, {
        student: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        },
        registration: {
          academic_year: academicYear,
          registration_type: regType,
          status: status,
          notes: notes.trim(),
        },
      });

      setSuccessMessage('Student registration updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update registration record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Edit Student Registration
              </h3>
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                {registration.registration_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify student information and registration status in real time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback banners */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Student Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">First Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Last Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Academic Year & Registration Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Academic Year</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Registration Type</label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={regType}
                  onChange={(e) => setRegType(e.target.value as RegistrationType)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="INITIAL_REGISTRATION">Initial Registration</option>
                  <option value="RE_REGISTRATION">Re-Registration</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="PROGRAM_PROGRESSION">Program Progression</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Workflow Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Registrar Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes, comments, or verification notes..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
