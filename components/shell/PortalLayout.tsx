import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface PortalLayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNewRegistration?: () => void;
  onManageRegistrars?: () => void;
  title?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  currentRole,
  onRoleChange,
  onNewRegistration,
  onManageRegistrars,
  title,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f8fafc] flex flex-col lg:flex-row text-slate-900 font-sans antialiased">
      {/* Fixed Non-Scrolling Sidebar */}
      <Sidebar
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        onNewRegistration={onNewRegistration}
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
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
