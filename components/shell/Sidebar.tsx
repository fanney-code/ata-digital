'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutGrid,
  UserCheck,
  GraduationCap,
  Landmark,
  FolderClosed,
  ShieldCheck,
  Plus,
  CircleHelp,
  LogOut,
  Building2,
  X,
  ShieldAlert,
  Globe,
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
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    badge?: string;
    onClick?: () => void;
  }

  // Navigation items for Registrar role
  const registrarNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
      isActive: pathname === '/dashboard' || pathname === '/',
    },
    {
      name: 'Manage Register',
      href: '/registrations',
      icon: UserCheck,
      isActive: pathname.startsWith('/registrations'),
    },
    {
      name: 'Student Directory',
      href: '/students',
      icon: GraduationCap,
      isActive: pathname.startsWith('/students'),
    },
    {
      name: 'Institutions & Degrees',
      href: '/institutions',
      icon: Landmark,
      isActive: pathname.startsWith('/institutions'),
    },
    {
      name: 'Document Locker',
      href: '/documents',
      icon: FolderClosed,
      isActive: pathname.startsWith('/documents'),
    },
    {
      name: 'Audit & Governance Logs',
      href: '/audit-logs',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/audit-logs'),
    },
  ];

  // Navigation items for Administrator role (Executive Governance)
  const adminNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
      isActive: pathname === '/dashboard' || pathname === '/',
    },
    {
      name: 'Registrations Directory',
      href: '/registrations',
      icon: UserCheck,
      badge: '3',
      isActive: pathname.startsWith('/registrations'),
    },
    {
      name: 'Student Directory',
      href: '/students',
      icon: GraduationCap,
      isActive: pathname.startsWith('/students'),
    },
    {
      name: 'Institutions & Structure',
      href: '/institutions',
      icon: Landmark,
      isActive: pathname.startsWith('/institutions'),
    },
    {
      name: 'Document Locker',
      href: '/documents',
      icon: FolderClosed,
      isActive: pathname.startsWith('/documents'),
    },
    {
      name: 'Registrar Accounts',
      href: '/registrars',
      icon: Building2,
      onClick: onManageRegistrars,
      isActive: pathname.startsWith('/registrars') || pathname.includes('manage_registrars'),
    },
    {
      name: 'Audit & Governance Logs',
      href: '/audit-logs',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/audit-logs'),
    },
  ];

  // Navigation items for Universal Super-Admin role (Command Center)
  const universalNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
      isActive: pathname === '/dashboard' || pathname === '/',
    },
    {
      name: 'Registrations & Register',
      href: '/registrations',
      icon: UserCheck,
      isActive: pathname.startsWith('/registrations'),
    },
    {
      name: 'Student Master Directory',
      href: '/students',
      icon: GraduationCap,
      isActive: pathname.startsWith('/students'),
    },
    {
      name: 'Institutions & Curricula',
      href: '/institutions',
      icon: Landmark,
      isActive: pathname.startsWith('/institutions'),
    },
    {
      name: 'Document & Credential Vault',
      href: '/documents',
      icon: FolderClosed,
      isActive: pathname.startsWith('/documents'),
    },
    {
      name: 'Registrar Accounts',
      href: '/registrars',
      icon: Building2,
      onClick: onManageRegistrars,
      isActive: pathname.startsWith('/registrars') || pathname.includes('manage_registrars'),
    },
    {
      name: 'System Audit & Governance',
      href: '/audit-logs',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/audit-logs'),
    },
  ];

  const navItems =
    currentRole === 'UNIVERSAL'
      ? universalNavItems
      : currentRole === 'ADMINISTRATOR'
      ? adminNavItems
      : registrarNavItems;

  const handlePrimaryAction = () => {
    if (onNewRegistration) {
      onNewRegistration();
    } else if (onManageRegistrars && currentRole !== 'REGISTRAR') {
      onManageRegistrars();
    } else {
      router.push('/registrations/new');
    }
    if (onCloseMobile) onCloseMobile();
  };

  // Role Context Config for bottom card
  const roleContextConfig = {
    UNIVERSAL: {
      icon: Globe,
      label: 'Consensus Node',
      title: 'Global Council Node: SG-ASIA-01',
    },
    ADMINISTRATOR: {
      icon: ShieldAlert,
      label: 'Administrative Scope',
      title: 'ATA Central Council Secretariat — Asia Regional HQ',
    },
    REGISTRAR: {
      icon: Building2,
      label: 'Assigned Institution',
      title: 'South Asia Institute of Advanced Christian Studies',
    },
  }[currentRole];

  const ContextIcon = roleContextConfig.icon;

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 lg:w-[268px] h-full bg-white border-r border-slate-200/90 text-slate-800 flex flex-col justify-between overflow-hidden shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Group: Primary Action Button + Nav List */}
        <div className="flex flex-col min-h-0 flex-1 p-4 overflow-y-auto">
          {/* Global Action Button (Registrar Style) */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Registration</span>
            </button>
          </div>

          {/* Section Heading */}
          <div className="px-2.5 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {currentRole === 'ADMINISTRATOR'
                ? 'Governance Navigation'
                : currentRole === 'UNIVERSAL'
                ? 'Universal Console'
                : 'Navigation'}
            </p>
          </div>

          {/* Navigation Links (Uniform Registrar Style: #99efe5 / #006f67) */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-colors ${
                    active
                      ? 'bg-[#99efe5] text-[#006f67] font-bold'
                      : 'text-[#45464d] font-semibold hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 ${
                        active ? 'text-[#006f67]' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge ? (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Group: Global Session/Institution Card + Help/SignOut Action Row */}
        <div className="p-4 shrink-0 space-y-3">
          {/* Assigned Context Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-2">
              <ContextIcon className="h-4 w-4 text-[#3c8c8a]" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {roleContextConfig.label}
              </p>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              {roleContextConfig.title}
            </p>
          </div>

          {/* Action Buttons Row (Registrar Style: 2 Equal Width Buttons) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <CircleHelp className="h-4 w-4 text-slate-500" />
              <span>Help</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CircleHelp className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ATA Digital Help & Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
              <p>
                Welcome to the <strong>Asia Theological Association (ATA)</strong> Digital Student Registration & Institutional Records System.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Technical Support & Registrations Desk:
                </p>
                <p>Email: <span className="font-mono text-blue-600">registrar-support@ata-india.org</span></p>
                <p>Helpline: <span className="font-mono">+91 (080) 2548-1234</span></p>
              </div>
              <p className="text-[11px] text-slate-500">
                Operating Hours: Monday – Friday, 9:00 AM – 5:30 PM IST.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
