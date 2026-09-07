'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Student, Registration, AppNotification } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
// Protected search now goes through /api/search BFF route (session-scoped server-side)
import { fetchUserNotifications, markNotificationRead, acknowledgeNotification } from '@/lib/api/notices-service';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  Bell,
  Search,
  Menu,
  X,
  Loader2,
  User,
  FileText,
  ArrowRight,
  GraduationCap,
  Building2,
  ShieldCheck,
  Copy,
  Check,
  BookOpen,
  Mail,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  title?: string;
  onToggleMobileSidebar?: () => void;
  onSelectRegistration?: (reg: Registration) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  title = 'Dashboard',
  onToggleMobileSidebar,
  onSelectRegistration,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  // Global Header Search States
  const [internalQuery, setInternalQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [registrationResults, setRegistrationResults] = useState<Registration[]>([]);
  const [, startTransition] = useTransition();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const notificationContainerRef = useRef<HTMLDivElement>(null);

  // Profile Modal & Notification State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load authoritative notifications for current user/role
  const loadNotifications = async () => {
    try {
      const data = await fetchUserNotifications();
      setNotifications(data);
    } catch {
      // Safe fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentRole]);

  const handleToggleNotifications = () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    if (next) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // 1. Optimistic read update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );

    // 2. Persist read state to backend
    markNotificationRead(notif.key).catch(() => {});

    // 3. For acknowledgement items (like AUDIT_LOG_SYNC), mark completed and remove
    if (notif.action_type === 'AUDIT_LOG_SYNC') {
      acknowledgeNotification(notif.key).catch(() => {});
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }

    // 4. Close popover
    setIsNotificationsOpen(false);

    // 5. Navigate to target URL
    if (notif.target_url) {
      router.push(notif.target_url);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsDropdownOpen(false);
        setIsNotificationsOpen(false);
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
        // Search goes through /api/search BFF — actor is built server-side from the session cookie.
        // Institution scoping is enforced on the server, not from client state.
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        startTransition(() => {
          setStudentResults((data.students || []).slice(0, 5));
          setRegistrationResults((data.registrations || []).slice(0, 5));
          setIsSearching(false);
        });
      } catch (err) {
        console.error('Search error:', err);
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [internalQuery, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalQuery(e.target.value);
  };

  const handleClear = () => {
    setInternalQuery('');
    setStudentResults([]);
    setRegistrationResults([]);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setIsDropdownOpen(false);
    setInternalQuery('');
    router.push(`/students?query=${encodeURIComponent(student.permanent_uid || student.first_name)}`);
  };

  const handleSelectRegistration = (reg: Registration) => {
    setIsDropdownOpen(false);
    setInternalQuery('');
    if (onSelectRegistration) {
      onSelectRegistration(reg);
    } else {
      router.push(`/registrations?id=${reg.id}`);
    }
  };

  // User Profile details
  const displayName = user?.full_name || 'Dr. Grace Chen';
  const roleDisplayTitle = {
    REGISTRAR: 'Chief Academic Registrar',
    ADMINISTRATOR: 'System Administrator',
    UNIVERSAL: 'Universal Registrar',
  }[currentRole];

  const profileDetails = {
    REGISTRAR: {
      title: 'Chief Academic Registrar',
      department: 'Office of Academic Affairs & Admissions',
      institution: 'Asia Theological Association',
      registrarId: 'REG-ATA-2026-08',
      accessLevel: 'Registrar Level 2',
      authorizedScope: 'Candidate Intake & Enrollment Management',
      authMethod: 'Two-Factor Auth (2FA) Active',
    },
    ADMINISTRATOR: {
      title: 'Chief Academic Administrator / Council Director',
      department: 'Executive Governance Council & Accreditation Board',
      institution: 'Asia Theological Association',
      registrarId: 'ADM-ATA-2026-01',
      accessLevel: 'Tier 1 Administrative & Audit Authority',
      authorizedScope: 'Governance, Record Unlocks & Security',
      authMethod: 'Two-Factor Auth (2FA) Active',
    },
    UNIVERSAL: {
      title: 'Universal Registry Controller',
      department: 'Executive Governance Council',
      institution: 'Asia Theological Association',
      registrarId: 'UNI-ATA-2026-99',
      accessLevel: 'Unrestricted Universal Master Access',
      authorizedScope: 'All Institutions, Degrees & Audit Logs',
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
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 flex items-center shadow-2xs shrink-0">
      {/* Left Section: Brand & ATA Registry (aligns with 64-width Sidebar on desktop) */}
      <div className="w-full lg:w-64 h-full px-4 flex items-center justify-between lg:border-r lg:border-slate-200/90 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile menu hamburger */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Book Icon in Dark Rounded Square */}
          <div className="h-9 w-9 rounded-xl bg-[#0f172a] text-[#2dd4bf] flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="h-4 w-4 stroke-[2.2]" />
          </div>

          {/* ATA PORTAL Title & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1 leading-none">
              <span className="font-black text-slate-900 tracking-tight text-xs">ATA</span>
              <span className="font-extrabold text-[#0d9488] tracking-tight text-xs">PORTAL</span>
            </div>
            <span className="text-[8.5px] text-slate-400 font-medium tracking-tight block mt-0.5 truncate leading-none">
              Asia Theological Association
            </span>
          </div>
        </div>

        {/* ATA Registry / Executive Governance Sub-header */}
        <div className="hidden sm:flex flex-col text-right pl-2 shrink-0">
          {currentRole === 'ADMINISTRATOR' ? (
            <div className="flex flex-col text-right leading-none">
              <span className="font-extrabold text-[11px] text-[#006f67] tracking-tight uppercase">
                EXECUTIVE
              </span>
              <span className="text-[10px] font-black text-[#006f67] tracking-tight uppercase mt-0.5">
                GOVERNANCE
              </span>
            </div>
          ) : (
            <>
              <span className="font-bold text-[11px] text-slate-900 leading-tight">
                ATA Registry
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                THEOLOGICAL COUNCIL
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section: Search Bar + Role Switcher Pills + Notification Bell + User Profile */}
      <div className="flex-1 h-full px-3 sm:px-5 flex items-center justify-between gap-3 min-w-0">
        {/* Search Bar Container */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md lg:max-w-lg min-w-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={internalQuery}
              onChange={handleInputChange}
              onFocus={() => {
                if (internalQuery.trim().length > 0) setIsDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search student name, roll number, ATA ID, degree..."
              className="w-full rounded-2xl border border-transparent bg-[#eff4ff] pl-10 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 animate-spin" />
            ) : internalQuery ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
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
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50 p-1">
                {isSearching && totalResultsCount === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">Searching students and registrations...</p>
                  </div>
                ) : totalResultsCount === 0 ? (
                  <div className="p-8 text-center space-y-1.5">
                    <Search className="h-6 w-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">No matching records found</p>
                    <p className="text-[11px] text-slate-400">
                      Try searching by candidate name, UID (e.g. STU-...), or registration #
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
                              <div className="h-8 w-8 rounded-full bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {st.first_name[0]}
                                {st.last_name ? st.last_name[0] : ''}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                  {st.first_name} {st.last_name}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400">
                                  {st.permanent_uid || 'No UID'} &bull; {st.email}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
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
                            onClick={() => handleSelectRegistration(reg)}
                            className="px-3 py-2 rounded-xl hover:bg-indigo-50/60 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {reg.registration_number}
                                  </span>
                                  <StatusBadge status={reg.status} size="sm" />
                                </div>
                                <p className="text-xs text-slate-700 font-medium truncate">
                                  {reg.student
                                    ? `${reg.student.first_name} ${reg.student.last_name}`
                                    : 'Student Record'}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Icons: Notification Bell + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notification Bell with dynamic badge */}
          <div ref={notificationContainerRef} className="relative">
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100">
                <div className="p-3.5 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#006f67]" />
                    <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  </div>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      All caught up
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto p-2.5 space-y-1.5 text-xs text-slate-600">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-xl transition-all cursor-pointer border ${
                          !notif.is_read
                            ? 'bg-teal-50/60 border-teal-100/80 hover:bg-teal-50'
                            : 'bg-white border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            {!notif.is_read ? (
                              <span className="h-2 w-2 rounded-full bg-[#006f67] mt-1.5 shrink-0" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1.5">
                      <Check className="h-6 w-6 text-emerald-600 mx-auto" />
                      <p className="font-bold text-slate-900">All tasks completed</p>
                      <p className="text-[11px] text-slate-400">
                        No active items requiring your attention right now.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Interactive Details Trigger */}
          <div ref={profileContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
              aria-expanded={isProfileOpen}
              aria-label="View user profile details"
            >
              <div className="hidden sm:block text-right leading-tight">
                <span className="block text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {displayName}
                </span>
                <span className="block text-[10px] font-semibold text-[#0d9488] leading-none mt-0.5">
                  {roleDisplayTitle}
                </span>
              </div>

              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&h=160&q=80"
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              </div>
            </button>

            {/* Profile Popover Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 text-white relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close profile card"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full border-2 border-white/20 p-0.5 shrink-0 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&h=160&q=80"
                        alt={displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{displayName}</h4>
                      <p className="text-xs text-blue-200 font-medium truncate">
                        {profileDetails.title}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {currentRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Registrar ID</p>
                      <p className="font-mono font-bold text-slate-800">{profileDetails.registrarId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-blue-600 transition-colors"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{profileDetails.institution}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{profileDetails.accessLevel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user?.email || 'registrar@ataportal.edu'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">Account Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
