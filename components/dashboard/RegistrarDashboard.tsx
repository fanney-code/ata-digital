'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardMetrics, Registration, WorkflowStatus, DashboardNotice } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { ExcelImportModal } from '@/components/registration/ExcelImportModal';
import { PROGRAM_NAMES } from '@/lib/constants/programs';
import { fetchActiveDashboardNotices, fetchActiveDashboardNotice, updateChecklistItemStatus } from '@/lib/api/notices-service';
import {
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Download,
  Eye,
  Pencil,
  Filter,
  MoreHorizontal,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CheckSquare,
  FolderInput,
} from 'lucide-react';

interface RegistrarDashboardProps {
  metrics: DashboardMetrics;
  registrations: Registration[];
  onNewRegistration: () => void;
  onSelectRegistration: (reg: Registration) => void;
  onViewAllRegistrations?: () => void;
  searchQuery?: string;
}

export const RegistrarDashboard: React.FC<RegistrarDashboardProps> = ({
  metrics,
  registrations,
  onNewRegistration,
  onSelectRegistration,
  onViewAllRegistrations,
  searchQuery = '',
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [isProgramFilterOpen, setIsProgramFilterOpen] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [activeNotice, setActiveNotice] = useState<DashboardNotice | null>(null);
  const [activeNotices, setActiveNotices] = useState<DashboardNotice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let targetNoticeId: string | null = null;
    let shouldOpenChecklist = false;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      targetNoticeId = params.get('noticeId');
      if (params.get('action') === 'checklist') {
        shouldOpenChecklist = true;
      }
    }

    fetchActiveDashboardNotices().then((notices) => {
      setActiveNotices(notices);
      if (notices.length > 0) {
        let chosen = notices[0];
        if (targetNoticeId) {
          const match = notices.find((n) => n.id === targetNoticeId);
          if (match) chosen = match;
        }
        setActiveNotice(chosen);
        if (shouldOpenChecklist) {
          setShowChecklistModal(true);
        }
      }
    });
  }, []);

  const handleToggleChecklistItem = async (itemId: string, currentVal: boolean) => {
    if (!activeNotice) return;
    const newVal = !currentVal;
    const updatedItems = activeNotice.items.map((it) =>
      it.id === itemId ? { ...it, is_completed: newVal } : it
    );
    const updatedNotice = { ...activeNotice, items: updatedItems };
    setActiveNotice(updatedNotice);
    setActiveNotices((prev) =>
      prev.map((n) => (n.id === activeNotice.id ? updatedNotice : n))
    );
    await updateChecklistItemStatus(itemId, newVal);
  };

  // Registrar name and institution sourced dynamically
  const registrarName = user?.full_name || 'registrar';

  const primaryInstitution = useMemo(() => {
    if (registrations.length > 0 && registrations[0].institution?.name) {
      return registrations[0].institution.name;
    }
    const topInst = metrics.institutionDistribution.find((i) => i.count > 0);
    if (topInst) return topInst.name;
    return 'South Asia Institute of Advanced Christian Studies (SAIACS)';
  }, [registrations, metrics.institutionDistribution]);

  const activeAcademicYear = useMemo(() => {
    const yr = metrics.academicYearDistribution[0]?.year || '2026–2027';
    return yr.replace('-', '–');
  }, [metrics.academicYearDistribution]);

  // Derived real-time metrics directly from database
  const totalEnrolled = metrics.totalStudents;
  const activeRegistrationsCount = metrics.totalRegistrations;
  const approvedCount = metrics.approvedRegistrations;
  const actionRequiredCount = metrics.attentionRequiredCount + metrics.registrarTasksCount;

  const correctionsCount = useMemo(() => {
    return registrations.filter((r) => r.status === 'CORRECTION_REQUIRED').length;
  }, [registrations]);

  const draftsCount = useMemo(() => {
    return registrations.filter((r) => r.status === 'DRAFT').length;
  }, [registrations]);

  const complianceRate = useMemo(() => {
    if (activeRegistrationsCount === 0) return 0;
    return Math.round((approvedCount / activeRegistrationsCount) * 100);
  }, [approvedCount, activeRegistrationsCount]);

  // Operational Action Queue derived strictly from DB registrations needing attention
  const actionQueueItems = useMemo(() => {
    return registrations.filter(
      (r) =>
        r.status === 'CORRECTION_REQUIRED' ||
        r.status === 'DRAFT' ||
        r.status === 'SUBMITTED' ||
        r.status === 'UNDER_REVIEW' ||
        r.status === 'RESUBMITTED'
    );
  }, [registrations]);

  // Helper for student initials
  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.trim()?.[0] || '';
    const l = lastName?.trim()?.[0] || '';
    return (f + l).toUpperCase() || 'ST';
  };

  // Helper for status badges matching design
  const getStatusBadgeConfig = (status: WorkflowStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Verified & Approved',
          style: 'bg-[#e6fcf5] text-[#0d9488] border border-emerald-200/70',
          dot: 'bg-[#0d9488]',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          style: 'bg-[#eff4ff] text-blue-700 border border-blue-200/70',
          dot: 'bg-blue-600',
        };
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          style: 'bg-[#eff4ff] text-blue-700 border border-blue-200/70',
          dot: 'bg-blue-600',
        };
      case 'RESUBMITTED':
        return {
          label: 'Resubmitted',
          style: 'bg-[#ecfeff] text-cyan-700 border border-cyan-200/70',
          dot: 'bg-cyan-600',
        };
      case 'CORRECTION_REQUIRED':
        return {
          label: 'Correction Required',
          style: 'bg-rose-50 text-rose-700 border border-rose-200/70',
          dot: 'bg-rose-600',
        };
      case 'DRAFT':
      default:
        return {
          label: 'Draft Saved',
          style: 'bg-slate-100 text-slate-700 border border-slate-200/70',
          dot: 'bg-slate-500',
        };
    }
  };

  // Distinct programs present in database registrations + full master catalog
  const availablePrograms = useMemo(() => {
    const set = new Set<string>(PROGRAM_NAMES);
    registrations.forEach((r) => {
      if (r.program?.name) set.add(r.program.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registrations]);

  // Filtering live registrations
  const filteredList = useMemo(() => {
    let list = registrations;
    if (selectedProgramFilter !== 'ALL') {
      list = list.filter((r) => r.program?.name === selectedProgramFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const name = `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.toLowerCase();
        const uid = (r.student?.permanent_uid || '').toLowerCase();
        const regNo = (r.registration_number || '').toLowerCase();
        const prog = (r.program?.name || '').toLowerCase();
        const inst = (r.institution?.name || '').toLowerCase();
        return name.includes(q) || uid.includes(q) || regNo.includes(q) || prog.includes(q) || inst.includes(q);
      });
    }
    return list;
  }, [registrations, selectedProgramFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProgramFilter, searchQuery]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Workflow distribution segments from real DB metrics
  const approvedStat = metrics.workflowDistribution.find((w) => w.status === 'APPROVED');
  const reviewStat = metrics.workflowDistribution.find((w) => w.status === 'UNDER_REVIEW');
  const submittedStat = metrics.workflowDistribution.find((w) => w.status === 'SUBMITTED');
  const corrStat = metrics.workflowDistribution.find((w) => w.status === 'CORRECTION_REQUIRED');
  const draftStat = metrics.workflowDistribution.find((w) => w.status === 'DRAFT');

  const approvedPct = approvedStat?.percentage || 0;
  const underReviewPct = (reviewStat?.percentage || 0) + (submittedStat?.percentage || 0);
  const corrPct = corrStat?.percentage || 0;
  const draftPct = draftStat?.percentage || 0;

  const underReviewCount = (reviewStat?.count || 0) + (submittedStat?.count || 0);

  // Dynamic degree level breakdown calculated from registrations
  const degreeLevelBreakdown = useMemo(() => {
    if (!registrations || registrations.length === 0) return [];
    const map: Record<string, number> = {};
    registrations.forEach((r) => {
      const name = r.program?.name || 'General Program';
      map[name] = (map[name] || 0) + 1;
    });
    const total = registrations.length;
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [registrations]);

  // Cohort Report CSV Download handler
  const handleDownloadCohortReport = () => {
    if (!registrations || registrations.length === 0) {
      alert('No active registrations available in database to generate report.');
      return;
    }
    const headers = [
      'Registration ID',
      'Student UID',
      'Student Name',
      'Email',
      'Program',
      'Institution',
      'Academic Year',
      'Status',
      'Submitted Date',
    ];
    const rows = registrations.map((r) => [
      r.registration_number,
      r.student?.permanent_uid || '',
      `"${r.student?.first_name || ''} ${r.student?.last_name || ''}"`.trim(),
      r.student?.email || '',
      `"${r.program?.name || ''}"`,
      `"${r.institution?.name || ''}"`,
      r.academic_year,
      r.status,
      r.submitted_at || r.created_at || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATA_Cohort_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Welcome Banner & Session Control */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {registrarName}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Registrar Portal &bull; {primaryInstitution}
          </p>
        </div>

        {/* Right Session Pills & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eff4ff] border border-blue-100 text-xs font-semibold text-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="font-bold text-[11px]">AY {activeAcademicYear}</span>
            <span className="text-slate-400 font-normal">&bull;</span>
            <span className="text-slate-600 text-[11px]">Enrollment Open</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadCohortReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e0f7f4] hover:bg-[#c9f1eb] text-[#006f67] font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Cohort Report</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExcelImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <FolderInput className="h-3.5 w-3.5" />
              <span>Batch Ingest</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Enrolled */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Enrolled Students
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {totalEnrolled.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{totalEnrolled > 0 ? `${totalEnrolled} active` : 'Active'}</span>
            <span className="text-slate-400 font-normal">candidates registered in database</span>
          </div>
        </div>

        {/* Card 2: Active Registrations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Registrations
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {activeRegistrationsCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
              {actionRequiredCount} pending review
            </span>
            <span className="text-slate-400 text-[11px]">in validation queue</span>
          </div>
        </div>

        {/* Card 3: Approved This Cycle */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Approved This Cycle
              </p>
              <h3 className="text-3xl font-black text-[#0d9488] tracking-tight mt-2">
                {approvedCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0d9488]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <span className="font-bold text-[#0d9488]">{complianceRate}%</span>
            <span className="text-slate-400 text-[11px]">accreditation compliance rate</span>
          </div>
        </div>

        {/* Card 4: Action Required / Drafts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Action Required / Drafts
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {actionRequiredCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <span className="font-bold text-rose-600">{correctionsCount} corrections</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500 text-[11px]">{draftsCount} pending drafts</span>
          </div>
        </div>
      </div>

      {/* 3. Action Required */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Action Required</h3>
              <p className="text-xs text-slate-500">
                Student records that need your attention
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            <span>
              {actionQueueItems.length > 0
                ? `${actionQueueItems.length} Action Items`
                : 'All Dossiers Cleared'}
            </span>
          </span>
        </div>

        {actionQueueItems.length === 0 ? (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-8 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 text-[#0d9488] flex items-center justify-center mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Operational Queue Clear</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All student registration dossiers are currently processed and up to date. No pending corrections or drafts requiring registrar intervention.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionQueueItems.slice(0, 3).map((reg) => {
              const stu = reg.student;
              const initials = getInitials(stu?.first_name, stu?.last_name);
              const isCorrection = reg.status === 'CORRECTION_REQUIRED';
              const isDraft = reg.status === 'DRAFT';

              const formatIssueNotice = (rawText: string): string => {
                if (!rawText) return 'Action required';
                const text = rawText.trim();
                if (
                  text.includes('Endorsement letter lacking authorized presbytery countersignature') ||
                  text.includes('Missing endorsement letter')
                ) {
                  return 'Missing endorsement letter';
                }
                if (
                  text.includes('Transcript seal from MCC missing page 2 coursework credits') ||
                  text.includes('Missing transcript page')
                ) {
                  return 'Missing transcript page';
                }
                if (
                  text.includes('Dossier awaiting registrar verification and credential validation') ||
                  text.includes('Dossier ready for verification')
                ) {
                  return 'Dossier ready for verification';
                }
                if (text.includes('Draft Pending: Incomplete student registration dossier awaiting final submission')) {
                  return 'Draft pending submission';
                }
                if (text.includes('Resubmitted: Revised documentation submitted for accreditation verification')) {
                  return 'Resubmitted for verification';
                }
                return text
                  .replace(/^Deficiency:\s*/i, '')
                  .replace(/^Correction Required:\s*/i, '')
                  .replace(/^Draft Pending:\s*/i, '')
                  .replace(/^Resubmitted:\s*/i, '');
              };

              let issueNotice = 'Dossier ready for verification';
              if (isCorrection) {
                issueNotice = formatIssueNotice(
                  reg.notes || reg.rejection_reason || 'Missing documentation required'
                );
              } else if (isDraft) {
                issueNotice = 'Draft pending submission';
              } else if (reg.status === 'RESUBMITTED') {
                issueNotice = 'Resubmitted for verification';
              } else {
                issueNotice = formatIssueNotice(issueNotice);
              }

              return (
                <div
                  key={reg.id}
                  className="p-4 sm:p-4.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-[#fbfcfd] hover:bg-white transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-blue-100 text-blue-700">
                      {initials}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {stu ? `${stu.first_name} ${stu.last_name}` : 'Student Candidate'}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {stu?.permanent_uid || reg.registration_number}
                        </span>
                        <span className="text-xs text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {reg.program?.name || 'Academic Degree'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        {isCorrection ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        ) : isDraft ? (
                          <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        )}
                        <span
                          className={`font-semibold ${
                            isCorrection
                              ? 'text-rose-600'
                              : isDraft
                              ? 'text-slate-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {issueNotice}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400 pt-0.5">
                        <span>Institution: {reg.institution?.name || 'ATA Affiliate'}</span>
                        <span>&bull;</span>
                        <span>
                          Updated: {reg.updated_at ? new Date(reg.updated_at).toLocaleDateString() : 'Active cycle'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectRegistration(reg)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      View Record
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectRegistration(reg)}
                      className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isDraft
                          ? 'bg-black hover:bg-neutral-800'
                          : isCorrection
                          ? 'bg-[#0d9488] hover:bg-[#0b7a6f]'
                          : 'bg-[#0d9488] hover:bg-[#0b7a6f]'
                      }`}
                    >
                      <span>
                        {isDraft
                          ? 'Continue Draft'
                          : isCorrection
                          ? 'Resolve'
                          : 'Verify Dossier'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Two Bottom Distribution Cards (Workflow Status & Enrollment by Degree) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Workflow Status Distribution */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workflow Status Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeRegistrationsCount} total dossier filings in active accreditation cycle
              </p>
            </div>

            {/* Segmented Progress Bar strictly based on database metrics */}
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex mt-5">
              {activeRegistrationsCount === 0 ? (
                <div className="h-full w-full bg-slate-200" title="No dossier filings recorded" />
              ) : (
                <>
                  {approvedPct > 0 && (
                    <div
                      style={{ width: `${approvedPct}%` }}
                      className="h-full bg-[#0d9488]"
                      title={`Approved: ${approvedPct}%`}
                    />
                  )}
                  {underReviewPct > 0 && (
                    <div
                      style={{ width: `${underReviewPct}%` }}
                      className="h-full bg-slate-700"
                      title={`Under Review: ${underReviewPct}%`}
                    />
                  )}
                  {corrPct > 0 && (
                    <div
                      style={{ width: `${corrPct}%` }}
                      className="h-full bg-rose-500"
                      title={`Correction: ${corrPct}%`}
                    />
                  )}
                  {draftPct > 0 && (
                    <div
                      style={{ width: `${draftPct}%` }}
                      className="h-full bg-slate-300"
                      title={`Drafts: ${draftPct}%`}
                    />
                  )}
                </>
              )}
            </div>

            {/* 4 Stat Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
                  <span className="text-[10px] font-bold uppercase text-slate-500">Approved</span>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-1.5">{approvedCount}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{approvedPct}% of total</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  <span className="text-[10px] font-bold uppercase text-slate-500">Under Review</span>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-1.5">{underReviewCount}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{underReviewPct}% of total</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold uppercase text-slate-500">Correction</span>
                </div>
                <p className="text-xl font-bold text-rose-600 mt-1.5">{correctionsCount}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{corrPct}% of total</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold uppercase text-slate-500">Drafts</span>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-1.5">{draftsCount}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{draftPct}% of total</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Enrollment by Degree Level */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enrollment by Degree Level</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution across active academic curricula in database
                </p>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {degreeLevelBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No degree enrollment records available yet for this cycle.
              </div>
            ) : (
              <div className="space-y-3.5 mt-5 text-xs">
                {degreeLevelBreakdown.map((item, idx) => {
                  const barColors = ['bg-[#0d9488]', 'bg-[#0d9488]', 'bg-slate-700', 'bg-slate-900'];
                  const color = barColors[idx % barColors.length];
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between font-semibold text-slate-800 mb-1">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="font-bold shrink-0">
                          {item.count}{' '}
                          <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${Math.max(item.percentage, 5)}%` }}
                          className={`h-full ${color} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <span>
              Capacity utilization: {totalEnrolled > 0 ? 'Active' : '0%'} across{' '}
              {metrics.institutionDistribution.filter((i) => i.count > 0).length || 1} institution node(s)
            </span>
            <span className="font-bold text-slate-900">Total Enrolled: {totalEnrolled}</span>
          </div>
        </div>
      </div>

      {/* 5. Recent Registrations Live Feed */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
            <p className="text-xs text-slate-500">
              Live feed of student dossier filings received across institutional nodes
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dynamic Program Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProgramFilterOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[140px] truncate">
                  {selectedProgramFilter === 'ALL' ? 'Filter Program' : selectedProgramFilter}
                </span>
              </button>

              {isProgramFilterOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 divide-y divide-slate-50 text-xs max-h-72 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedProgramFilter('ALL');
                      setIsProgramFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      selectedProgramFilter === 'ALL'
                        ? 'bg-[#e0f7f4] text-[#006f67] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Degree Programs ({availablePrograms.length})
                  </button>
                  {availablePrograms.map((prog) => (
                    <button
                      key={prog}
                      onClick={() => {
                        setSelectedProgramFilter(prog);
                        setIsProgramFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors truncate ${
                        selectedProgramFilter === prog
                          ? 'bg-[#e0f7f4] text-[#006f67] font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {prog}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/registrations"
              className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center"
            >
              View All Register
            </Link>
          </div>
        </div>

        {/* Column Headers */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60 rounded-xl">
          <div className="col-span-2">Registration ID</div>
          <div className="col-span-3">Student Name</div>
          <div className="col-span-2">Program</div>
          <div className="col-span-2">Institution</div>
          <div className="col-span-1">Submitted Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Live Registrations Table Rows */}
        {paginatedList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-50/50 rounded-xl border border-slate-200/60">
            <p>
              {searchQuery || selectedProgramFilter !== 'ALL'
                ? 'No registrations found matching the applied filter or search query.'
                : 'No student registrations found in database.'}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={onNewRegistration}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white font-semibold text-xs hover:bg-neutral-800 cursor-pointer"
              >
                + Create Registration
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedList.map((reg) => {
              const stu = reg.student;
              const initials = getInitials(stu?.first_name, stu?.last_name);
              const badgeCfg = getStatusBadgeConfig(reg.status);
              const submittedDateStr = reg.submitted_at
                ? new Date(reg.submitted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : reg.created_at
                ? new Date(reg.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Pending';

              return (
                <div
                  key={reg.id}
                  onClick={() => onSelectRegistration(reg)}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center p-3.5 sm:p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all shadow-2xs cursor-pointer group"
                >
                  {/* Reg ID */}
                  <div className="lg:col-span-2">
                    <span className="font-mono font-bold text-xs text-[#006f67]">
                      {reg.registration_number}
                    </span>
                  </div>

                  {/* Student Name */}
                  <div className="lg:col-span-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#99efe5] text-[#006f67] font-bold text-[11px] flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {stu ? `${stu.first_name} ${stu.last_name}` : 'Student Candidate'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        ID: {stu?.permanent_uid || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Program */}
                  <div className="lg:col-span-2 text-xs text-slate-700 font-medium truncate">
                    {reg.program?.name || 'Academic Degree'}
                  </div>

                  {/* Institution */}
                  <div className="lg:col-span-2 text-xs text-slate-600 truncate flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{reg.institution?.name || 'ATA Affiliate'}</span>
                  </div>

                  {/* Submitted Date */}
                  <div className="lg:col-span-1 text-xs text-slate-500 font-medium whitespace-nowrap">
                    {submittedDateStr}
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCfg.style}`}
                    >
                      {badgeCfg.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRegistration(reg);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Inspect Dossier"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRegistration(reg);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Registration"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length} active records
            </p>
            <span>|</span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-black text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === totalPages
                      ? 'bg-black text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Bottom Notice Banners (Rendered dynamically for each assigned active notice) */}
      {activeNotices && activeNotices.length > 0 && (
        <div className="space-y-4">
          {activeNotices.map((notice) => (
            <div
              key={notice.id}
              className="rounded-2xl bg-[#182234] text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-[#2dd4bf] border border-teal-500/30 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{notice.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                    {notice.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                {notice.items && notice.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNotice(notice);
                      setShowChecklistModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Audit Checklist
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onViewAllRegistrations) onViewAllRegistrations();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#006f67] hover:bg-[#005a54] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Affiliate Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Excel Batch Ingest Modal */}
      {isExcelImportOpen && (
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          onSuccess={() => {
            setIsExcelImportOpen(false);
            window.location.reload();
          }}
        />
      )}

      {/* Audit Checklist Modal */}
      {showChecklistModal && activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-bold text-base text-slate-900">
                  {activeNotice.checklist_title || 'ATA Biennial Evaluation Checklist'}
                </h3>
              </div>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              {activeNotice.items && activeNotice.items.length > 0 ? (
                activeNotice.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklistItem(item.id, item.is_completed)}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      item.is_completed
                        ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70'
                    }`}
                  >
                    <CheckSquare
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        item.is_completed ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <p className="font-bold text-slate-900">{item.title}</p>
                      {item.description && (
                        <p className="text-[11px] text-slate-500">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No checklist items assigned.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
