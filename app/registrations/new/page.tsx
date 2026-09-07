'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Registration } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { NewRegistrationWizard } from '@/components/registration/NewRegistrationWizard';

export default function NewRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role || 'REGISTRAR');

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  const handleSuccess = (newReg: Registration) => {
    router.push(`/registrations?id=${newReg.id}`);
  };

  const handleCancel = () => {
    router.push('/registrations');
  };

  return (
    <PortalLayout
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      title="Institutional Enrollment Wizard"
    >
      {currentRole === 'REGISTRAR' ? (
        <NewRegistrationWizard
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
          <h3 className="text-lg font-bold text-slate-900">Enrollment Restricted to Registrar</h3>
          <p className="text-xs text-slate-600">
            Only institutional Registrars are authorized to initiate new candidate matriculation records. Administrators perform governance reviews, and Universal accounts provide oversight.
          </p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors"
          >
            Return to Registrations
          </button>
        </div>
      )}
    </PortalLayout>
  );
}
