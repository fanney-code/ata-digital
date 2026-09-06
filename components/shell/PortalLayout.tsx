import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Registration } from '@/lib/types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NewRegistrationWizard } from '@/components/registration/NewRegistrationWizard';

interface PortalLayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNewRegistration?: () => void;
  onManageRegistrars?: () => void;
  title?: string;
  onSelectRegistration?: (reg: any) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  currentRole,
  onRoleChange,
  onNewRegistration,
  onManageRegistrars,
  title,
  onSelectRegistration,
}) => {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDefaultNewRegModalOpen, setIsDefaultNewRegModalOpen] = useState(false);

  const handleTriggerNewRegistration = () => {
    if (onNewRegistration) {
      onNewRegistration();
    } else {
      setIsDefaultNewRegModalOpen(true);
    }
  };

  const handleModalRegistrationSuccess = (newReg: Registration) => {
    setIsDefaultNewRegModalOpen(false);
    if (onSelectRegistration) {
      onSelectRegistration(newReg);
    } else {
      router.push(`/registrations?id=${newReg.id}`);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f8fafc] flex flex-col lg:flex-row text-slate-900 font-sans antialiased">
      {/* Fixed Non-Scrolling Sidebar */}
      <Sidebar
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        onNewRegistration={handleTriggerNewRegistration}
        onManageRegistrars={onManageRegistrars}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Backdrop for mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Independently Scrollable Right Side Content Container */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentRole={currentRole}
          title={title}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          onSelectRegistration={onSelectRegistration}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global New Registration Wizard Modal */}
      {isDefaultNewRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl my-auto max-h-[92vh] overflow-y-auto">
            <NewRegistrationWizard
              onCancel={() => setIsDefaultNewRegModalOpen(false)}
              onSuccess={handleModalRegistrationSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};
