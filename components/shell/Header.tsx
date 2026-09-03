import React from 'react';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { Bell, Settings, Search, Menu } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  title?: string;
  onToggleMobileSidebar?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  title = 'Dashboard',
  onToggleMobileSidebar,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user } = useAuth();

  const roleLabelMap: Record<UserRole, string> = {
    UNIVERSAL: 'Universal Access (Read-only)',
    ADMINISTRATOR: 'Role: Administrator',
    REGISTRAR: 'ROLE: REGISTRAR',
  };

  const displayName = user?.full_name || (currentRole === 'ADMINISTRATOR' ? 'System Admin' : currentRole === 'UNIVERSAL' ? 'Auditor User' : 'Eleanor Vance');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-2xs shrink-0">
      {/* Left Group: Mobile Menu + Title + Role Badge */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
          {title}
        </h1>

        {/* Role Pill Badge */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 tracking-tight">
          {roleLabelMap[currentRole]}
        </span>
      </div>

      {/* Right Group: Search Input + Action Icons + Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        {onSearchChange && (
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                currentRole === 'ADMINISTRATOR'
                  ? 'Search Registrations...'
                  : 'Search Regs, Students..'
              }
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        )}

        {/* Bell Icon with red badge */}
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Settings Gear Icon */}
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <Settings className="h-4 w-4" />
        </button>

        {/* Profile Avatar with Name */}
        <div className="pl-1 flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-bold text-slate-900 leading-tight">
              {displayName}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium font-mono">
              {user?.email || 'authenticated'}
            </span>
          </div>

          <div className="h-8 w-8 rounded-full border border-slate-200 p-0.5 overflow-hidden bg-slate-100 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
              alt="User profile"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
