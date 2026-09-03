import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  GraduationCap,
  Building2,
  FileText,
  Plus,
  HelpCircle,
  LogOut,
  Landmark,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNewRegistration?: () => void;
  onManageRegistrars?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onNewRegistration,
  onManageRegistrars,
  isOpenMobile,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: currentRole === 'REGISTRAR' ? 'Manage Register' : 'Registrations',
      href: '/registrations',
      icon: FileCheck2,
    },
    { name: 'Students', href: '/students', icon: GraduationCap },
    { name: 'Institutions', href: '/institutions', icon: Building2 },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Audit Logs', href: '/audit-logs', icon: HelpCircle },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 h-full bg-white border-r border-slate-200/90 text-slate-800 flex flex-col justify-between overflow-hidden shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Top Group: Brand + CTA + Nav */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-100 shrink-0">
          <div className="p-2 rounded-lg bg-slate-900 text-white shadow-xs shrink-0">
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
              ATA Portal
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">Academic Management</p>
          </div>
        </div>

        {/* Primary Action Button - Role Specific */}
        {currentRole === 'REGISTRAR' && (
          <div className="px-4 pt-3 pb-1.5 shrink-0">
            <button
              onClick={() => {
                if (onNewRegistration) onNewRegistration();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <Plus className="h-4 w-4" />
              New Registration
            </button>
          </div>
        )}

        {currentRole === 'ADMINISTRATOR' && onManageRegistrars && (
          <div className="px-4 pt-3 pb-1.5 shrink-0">
            <button
              onClick={() => {
                onManageRegistrars();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Manage Registrars
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Group: Footer links */}
      <div className="shrink-0">
        {/* Footer Navigation */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-1 text-xs font-semibold text-slate-600">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100/70 transition-colors text-xs">
            <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold"
          >
            <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
