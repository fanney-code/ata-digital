'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { PortalLayout } from '@/components/shell/PortalLayout';
import { ManageRegistrarsView } from '@/components/admin/ManageRegistrarsView';
import { UniversalRegistrarSecurityGovernanceView } from '@/components/registrars/UniversalRegistrarSecurityGovernanceView';

export default function RegistrarsPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'ADMINISTRATOR');

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  return (
    <PortalLayout
      currentRole={role}
      onRoleChange={setRole}
      title={
        role === 'UNIVERSAL'
          ? 'Registrar Accounts & Security Governance'
          : 'Registrar Directory & Provisioning'
      }
    >
      {role === 'UNIVERSAL' ? (
        <UniversalRegistrarSecurityGovernanceView />
      ) : (
        <ManageRegistrarsView />
      )}
    </PortalLayout>
  );
}
