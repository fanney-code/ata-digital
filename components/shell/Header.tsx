'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Student, Registration } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchStudents, fetchRegistrations } from '@/lib/api/supabase-service';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  Bell,
  Settings,
  Search,
  Menu,
  X,
  Loader2,
  User,
  FileText,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  title?: string;
  onToggleMobileSidebar?: () => void;
  onSelectRegistration?: (reg: Registration) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  title = 'Dashboard',
  onToggleMobileSidebar,
  onSelectRegistration,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  // Global Header Search States (isolated from in-page filters)
  const [internalQuery, setInternalQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [registrationResults, setRegistrationResults] = useState<Registration[]>([]);
  const [, startTransition] = useTransition();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = internalQuery.trim();
    if (!trimmed) {
      setStudentResults([]);
      setRegistrationResults([]);
      setIsSearching(false);
      setIsDropdownOpen(false);
      return;
    }

    setIsDropdownOpen(true);
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const q = trimmed.toLowerCase();

        // Fetch students and registrations in parallel
        const [students, registrations] = await Promise.all([
          fetchStudents(trimmed).catch(() => [] as Student[]),
          fetchRegistrations().catch(() => [] as Registration[]),
        ]);

        // Filter registrations
        const filteredRegs = registrations.filter((r) => {
          const stuName = r.student
            ? `${r.student.first_name} ${r.student.last_name}`.toLowerCase()
            : '';
          const uid = (r.student?.permanent_uid || '').toLowerCase();
          const email = (r.student?.email || '').toLowerCase();
          const regNum = r.registration_number.toLowerCase();
          const inst = (r.institution?.name || '').toLowerCase();
          const prog = (r.program?.name || '').toLowerCase();

          return (
            stuName.includes(q) ||
            uid.includes(q) ||
            email.includes(q) ||
            regNum.includes(q) ||
            inst.includes(q) ||
            prog.includes(q)
          );
        });

        startTransition(() => {
          setStudentResults(students.slice(0, 5));
          setRegistrationResults(filteredRegs.slice(0, 5));
          setIsSearching(false);
        });
      } catch (err) {
        console.error('Search error:', err);
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [internalQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalQuery(e.target.value);
  };

  const handleClear = () => {
    setInternalQuery('');
    setStudentResults([]);
    setRegistrationResults([]);
    setIsDropdownOpen(false);
  };

  const handleSelectStudent = (student: Student) => {
    setIsDropdownOpen(false);
    router.push(`/students?id=${student.id}`);
  };

  const handleSelectReg = (reg: Registration) => {
    setIsDropdownOpen(false);
    if (onSelectRegistration) {
      onSelectRegistration(reg);
    } else {
      router.push(`/registrations?id=${reg.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (e.key === 'Enter') {
      if (studentResults.length > 0) {
        handleSelectStudent(studentResults[0]);
      } else if (registrationResults.length > 0) {
        handleSelectReg(registrationResults[0]);
      }
    }
  };

  const roleLabelMap: Record<UserRole, string> = {
    UNIVERSAL: 'Universal Access (Read-only)',
    ADMINISTRATOR: 'Role: Administrator',
    REGISTRAR: 'ROLE: REGISTRAR',
  };

  const displayName =
    user?.full_name ||
    (currentRole === 'ADMINISTRATOR'
      ? 'System Admin'
      : currentRole === 'UNIVERSAL'
      ? 'Auditor User'
      : 'Eleanor Vance');

  const displayEmail =
    user?.email ||
    (currentRole === 'ADMINISTRATOR'
      ? 'admin@ataportal.edu'
      : currentRole === 'UNIVERSAL'
      ? 'auditor@ataportal.edu'
      : 'registrar@ataportal.edu');

  const profileDetails = {
    REGISTRAR: {
      roleTitle: 'ATA Registrar',
      roleBadge: 'ATA REGISTRAR',
      institution: 'New India Bible Seminary (NIBS)',
      institutionCode: 'NIBS',
      department: 'Academic Administration & Admissions',
      jurisdiction: 'Candidate Registration & Lifetime Student Dossiers',
      registrarId: 'REG-ATA-2026-084',
      accessClearance: 'Full Write • Batch Import • Candidate Issuance',
      authMethod: 'Two-Factor Auth (2FA) Active',
    },
    ADMINISTRATOR: {
      roleTitle: 'ATA Administrator',
      roleBadge: 'CENTRAL ADMINISTRATOR',
      institution: 'Asia Theological Association Secretariat',
      institutionCode: 'ATA-HQ',
      department: 'Executive Governance & Accreditation',
      jurisdiction: 'System Administration & Registrar Governance',
      registrarId: 'ADM-ATA-2026-001',
      accessClearance: 'Full System Control • Security Clearance',
      authMethod: 'Hardware 2FA Active • Enterprise SSO',
    },
    UNIVERSAL: {
      roleTitle: 'Universal Auditor',
      roleBadge: 'UNIVERSAL AUDITOR',
      institution: 'Asia Theological Association Secretariat',
      institutionCode: 'ATA-ACCR',
      department: 'Academic Standards & Quality Assurance',
      jurisdiction: 'Read-Only Audit & Accreditation Review',
      registrarId: 'AUD-ATA-2026-012',
      accessClearance: 'Universal Read-Only • Historical Archives',
      authMethod: 'Two-Factor Auth (2FA) Active',
    },
  }[currentRole];

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(profileDetails.registrarId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const totalResultsCount = studentResults.length + registrationResults.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between shadow-2xs shrink-0">
      {/* Left Group: Mobile Menu + Title + Role Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
          {title}
        </h1>

        {/* Role Pill Badge */}
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[10px] font-semibold text-slate-600 tracking-tight shrink-0">
          {roleLabelMap[currentRole]}
        </span>
      </div>

      {/* Right Group: Search Input + Action Icons + Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Global Search Input & Dropdown Container */}
        <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={internalQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (internalQuery.trim().length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Global search (candidates, regs)..."
            className="w-full rounded-full border border-slate-200 bg-slate-50/80 pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          {/* Right Action inside input: Spinner or Clear Button */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
            ) : internalQuery ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>

          {/* Instant Search Results Floating Dropdown */}
          {isDropdownOpen && internalQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 lg:w-[440px] bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header */}
              <div className="px-4 py-2.5 bg-slate-50/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    Results for &ldquo;<strong className="text-slate-900">{internalQuery}</strong>&rdquo;
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                  {totalResultsCount} found
                </span>
              </div>

              {/* Scrollable Results List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 p-1">
                {isSearching && totalResultsCount === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">Searching students and registrations...</p>
                  </div>
                ) : totalResultsCount === 0 ? (
                  <div className="p-8 text-center space-y-1.5">
                    <Search className="h-6 w-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      No matching records found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching by student name, UID (e.g. STU-...), or registration #
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Section: Students */}
                    {studentResults.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-blue-500" />
                          <span>Students ({studentResults.length})</span>
                        </div>
                        {studentResults.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => handleSelectStudent(st)}
                            className="px-3 py-2 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {st.first_name[0]}
                                {st.last_name[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                    {st.first_name} {st.last_name}
                                  </h4>
                                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                    {st.permanent_uid}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{st.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <span>View Profile</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Section: Registrations */}
                    {registrationResults.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <FileText className="h-3 w-3 text-indigo-500" />
                          <span>Registrations ({registrationResults.length})</span>
                        </div>
                        {registrationResults.map((reg) => (
                          <div
                            key={reg.id}
                            onClick={() => handleSelectReg(reg)}
                            className="px-3 py-2 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {reg.registration_number}
                                  </span>
                                  <StatusBadge status={reg.status} size="sm" />
                                </div>
                                <p className="text-xs text-slate-700 font-medium truncate">
                                  {reg.student
                                    ? `${reg.student.first_name} ${reg.student.last_name}`
                                    : 'Student Record'}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {reg.institution?.name || 'Institution'} &bull;{' '}
                                  {reg.academic_year}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <span>Details</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="px-4 py-2 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200/80 font-mono text-[9px] text-slate-700">Esc</kbd> to close</span>
                <span>Click any record to inspect</span>
              </div>
            </div>
          )}
        </div>

        {/* Bell Icon with red badge */}
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Settings Gear Icon */}
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <Settings className="h-4 w-4" />
        </button>

        {/* Profile Avatar & Interactive Details Trigger */}
        <div ref={profileContainerRef} className="relative pl-1">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-left"
            aria-expanded={isProfileOpen}
            aria-label="View user profile details"
          >
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-bold text-slate-900 leading-tight">
                {displayName}
              </span>
              <span className="block text-[10px] text-slate-400 font-medium font-mono">
                {displayEmail}
              </span>
            </div>

            <div className="relative h-8 w-8 rounded-full border border-slate-200 p-0.5 overflow-visible bg-slate-100 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
                alt="User profile"
                className="h-full w-full rounded-full object-cover"
              />
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                title="Online & Active"
              />
            </div>
          </button>

          {/* Profile Details Floating Card Popover */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header Banner */}
              <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 p-4 text-white relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close profile card"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full border-2 border-white/20 p-0.5 shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80"
                      alt="User avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  </div>

                  <div className="min-w-0 pr-6">
                    <h3 className="text-sm font-bold text-white truncate leading-snug">
                      {displayName}
                    </h3>
                    <p className="text-[11px] text-blue-200 font-mono truncate">
                      {displayEmail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-[10px] font-bold text-blue-200 tracking-wider">
                        {profileDetails.roleBadge}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        ATA Accredited
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 space-y-3.5 max-h-[calc(100vh-180px)] overflow-y-auto">
                {/* Institutional Placement Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Institutional Placement</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] font-medium text-slate-500 shrink-0">Institution:</span>
                      <span className="text-[11px] font-bold text-slate-900 text-right">
                        {profileDetails.institution}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Institution Code:</span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {profileDetails.institutionCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Department:</span>
                      <span className="text-[11px] font-semibold text-slate-800 text-right">
                        {profileDetails.department}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-2 pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] font-medium text-slate-500 shrink-0">Jurisdiction:</span>
                      <span className="text-[10px] text-slate-600 text-right font-medium">
                        {profileDetails.jurisdiction}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account & Security Credentials Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                    <span>Account & Security Credentials</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Registrar ID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {profileDetails.registrarId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyId}
                          title="Copy Registrar ID"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
                        >
                          {copiedId ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] font-medium text-slate-500 shrink-0">Access Clearance:</span>
                      <span className="text-[10px] font-semibold text-slate-800 text-right">
                        {profileDetails.accessClearance}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Authentication:</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {profileDetails.authMethod}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] font-medium text-slate-500">Current Session:</span>
                      <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active &bull; SSL Secured
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push('/audit-logs');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>View My Audit Logs</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 ml-auto" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Asia Theological Association</span>
                <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200/80 font-mono text-[9px] text-slate-700">Esc</kbd> to close</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
