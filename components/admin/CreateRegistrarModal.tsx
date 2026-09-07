import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchInstitutions } from '@/lib/api/supabase-service';
import { Institution } from '@/lib/types';
import { UserCheck, X, CheckCircle2, Building2 } from 'lucide-react';

interface CreateRegistrarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateRegistrarModal: React.FC<CreateRegistrarModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createRegistrar } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchInstitutions()
        .then((insts) => {
          setInstitutions(insts);
          if (insts.length > 0 && !selectedInstitutionId) {
            setSelectedInstitutionId(insts[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setMessage('');
    try {
      await createRegistrar(email.trim(), fullName.trim(), selectedInstitutionId || undefined);
      setMessage(`Registrar account '${fullName}' successfully defined in Supabase!`);
      setFullName('');
      setEmail('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-blue-50/60 border-b border-blue-100">
          <div className="flex items-center gap-2.5">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Define New Registrar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Administrators can define official Registrar accounts and assign their authoritative institution.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registrar Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rev. M. Thomas"
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registrar Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. m.thomas@saiacs.org"
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Institution <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden appearance-none"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Saving to Supabase...' : 'Create Registrar User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
