'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Registration, UserRole, WorkflowStatus } from '@/lib/types';
import { ExcelImportModal } from './ExcelImportModal';
import { EditRegistrationModal } from './EditRegistrationModal';
import { MobileWebCameraCapture } from './MobileWebCameraCapture';
import { useIsMobileDevice, isCaptureEligible } from '@/lib/utils/useIsMobileDevice';
// Status and delete operations now go through BFF routes (server enforces institution isolation)

import { PROGRAM_NAMES } from '@/lib/constants/programs';
import { INSTITUTION_NAMES } from '@/lib/constants/institutions';
import {
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
  Trash2,
  Edit2,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  SlidersHorizontal,
  Download,
  Send,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Check,
  TrendingUp,
} from 'lucide-react';

interface ManageRegisterViewProps {
  registrations: Registration[];
  currentRole: UserRole;
  onSelectRegistration: (reg: Registration) => void;
  onNewRegistration: () => void;
  onReRegisterStudent?: (student: any) => void;
  onReload?: () => void;
  externalSearchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const ManageRegisterView: React.FC<ManageRegisterViewProps> = ({
  registrations,
  currentRole,
  onSelectRegistration,
  onNewRegistration,
  onReRegisterStudent,
  onReload,
  externalSearchQuery,
  onSearchQueryChange,
}) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('ALL');
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isMobile = useIsMobileDevice();
  const canCapture = isCaptureEligible(currentRole, isMobile);

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchQueryChange) onSearchQueryChange(val);
    setCurrentPage(1);
  };

  // Modals
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [cameraTargetReg, setCameraTargetReg] = useState<Registration | null>(null);
  const activeCameraReg = canCapture ? cameraTargetReg : null;
  const [editingReg, setEditingReg] = useState<Registration | null>(null);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);

  // Single Delete
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Derive distinct filter options
  const academicYears = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => {
      if (r.academic_year) set.add(r.academic_year);
    });
    return Array.from(set);
  }, [registrations]);

  const programOptions = useMemo(() => {
    const set = new Set<string>(PROGRAM_NAMES);
    registrations.forEach((r) => {
      if (r.program?.name) set.add(r.program.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registrations]);

  const campusOptions = useMemo(() => {
    const set = new Set<string>(INSTITUTION_NAMES);
    registrations.forEach((r) => {
      if (r.institution?.name) set.add(r.institution.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registrations]);

  // Derived Counts for Status Tabs
  const statusCounts = useMemo(() => {
    return {
      ALL: registrations.length,
      DRAFT: registrations.filter((r) => r.status === 'DRAFT').length,
      SUBMITTED: registrations.filter((r) => r.status === 'SUBMITTED').length,
      UNDER_REVIEW: registrations.filter((r) => r.status === 'UNDER_REVIEW').length,
      CORRECTION_REQUIRED: registrations.filter((r) => r.status === 'CORRECTION_REQUIRED').length,
      RESUBMITTED: registrations.filter((r) => r.status === 'RESUBMITTED').length,
      APPROVED: registrations.filter((r) => r.status === 'APPROVED').length,
      ARCHIVED: registrations.filter((r) => r.status === 'ARCHIVED').length,
    };
  }, [registrations]);

  // Metrics
  const totalActiveCount = registrations.length;
  const reviewCount = statusCounts.SUBMITTED + statusCounts.UNDER_REVIEW;
  const correctionsCount = statusCounts.CORRECTION_REQUIRED;
  const approvedCount = statusCounts.APPROVED;
  const compliancePct = totalActiveCount > 0 ? Math.round((approvedCount / totalActiveCount) * 100) : 0;

  // Filtering
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;
      const matchesYear = academicYearFilter === 'ALL' || reg.academic_year === academicYearFilter;
      const matchesProg = programFilter === 'ALL' || reg.program?.name === programFilter;
      const matchesCampus = campusFilter === 'ALL' || reg.institution?.name === campusFilter;

      const studentName = reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : '';
      const uid = reg.student?.permanent_uid || '';
      const email = reg.student?.email || '';
      const regNum = reg.registration_number || '';

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        regNum.toLowerCase().includes(q) ||
        studentName.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        (reg.institution?.name || '').toLowerCase().includes(q) ||
        (reg.program?.name || '').toLowerCase().includes(q);

      return matchesStatus && matchesYear && matchesProg && matchesCampus && matchesSearch;
    });
  }, [registrations, statusFilter, academicYearFilter, programFilter, campusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, academicYearFilter, programFilter, campusFilter, searchQuery]);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Multi-Selection Handlers
  const isAllSelected =
    paginatedRegistrations.length > 0 &&
    paginatedRegistrations.every((r) => selectedIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRegistrations.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Export to XLSX / CSV
  const handleBulkExport = () => {
    const targets = registrations.filter((r) => selectedIds.includes(r.id));
    if (targets.length === 0) return;
    const headers = [
      'Registration Number',
      'Student UID',
      'Student Name',
      'Email',
      'Program',
      'Institution',
      'Academic Year',
      'Intake Type',
      'Status',
      'Submitted At',
    ];
    const rows = targets.map((r) => [
      r.registration_number,
      r.student?.permanent_uid || '',
      `"${r.student?.first_name || ''} ${r.student?.last_name || ''}"`.trim(),
      r.student?.email || '',
      `"${r.program?.name || ''}"`,
      `"${r.institution?.name || ''}"`,
      r.academic_year,
      r.registration_type,
      r.status,
      r.submitted_at || r.created_at || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATA_Registrations_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Submit to Review — through BFF (actor resolved server-side from session cookie)
  const handleBulkSubmitToReview = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/registrations/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'UNDER_REVIEW', notes: 'Bulk submitted for accreditation review' }),
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update status');
        }
      }
      setSelectedIds([]);
      if (onReload) onReload();
      alert(`${selectedIds.length} registration(s) successfully submitted to review queue.`);
    } catch (err: any) {
      alert(`Failed to update registrations: ${err.message}`);
    }
  };

  // Delete Executions — through BFF (actor resolved server-side)
  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      const params = deleteTarget.student_id ? `?studentId=${encodeURIComponent(deleteTarget.student_id)}` : '';
      const res = await fetch(`/api/registrations/${encodeURIComponent(deleteTarget.id)}${params}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
      setDeleteTarget(null);
      if (onReload) onReload();
    } catch (err: any) {
      alert(`Failed to delete registration: ${err.message}`);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const selectedRegs = registrations.filter((r) => selectedIds.includes(r.id));
      for (const reg of selectedRegs) {
        const params = reg.student_id ? `?studentId=${encodeURIComponent(reg.student_id)}` : '';
        const res = await fetch(`/api/registrations/${encodeURIComponent(reg.id)}${params}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to delete');
        }
      }
      setSelectedIds([]);
      setIsConfirmBulkOpen(false);
      if (onReload) onReload();
    } catch (err: any) {
      alert(`Failed to delete registrations: ${err.message}`);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Helpers for Pill & Badge Formatting
  const getIntakeTypePill = (type: string) => {
    switch (type) {
      case 'INITIAL_REGISTRATION':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Initial
          </span>
        );
      case 'RE_REGISTRATION':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
            Re-Registration
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            Transfer
          </span>
        );
      case 'PROGRAM_PROGRESSION':
      default:
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Progression
          </span>
        );
    }
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488]" />
            Approved
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Under Review
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            Correction Required
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            Submitted
          </span>
        );
      case 'RESUBMITTED':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
            Resubmitted
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Archived
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* 1. Header & Primary Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manage Register
          </h1>

          <p className="text-xs text-slate-500 font-medium mt-1">
            Review and manage student registrations, documents, and registration status.
          </p>
        </div>

      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Register */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Active Register
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {totalActiveCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{registrations.slice(0, 18).length} this intake</span>
          </div>
        </div>

        {/* Card 2: Review Queue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Review Queue
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                {reviewCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500 font-medium">
            <span>{statusCounts.SUBMITTED} submitted</span>
            <span>&bull;</span>
            <span>{statusCounts.UNDER_REVIEW} in review</span>
          </div>
        </div>

        {/* Card 3: Corrections Flagged */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Corrections Flagged
              </p>
              <h3 className="text-3xl font-black text-rose-600 tracking-tight mt-2">
                {correctionsCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-rose-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Pending student action</span>
          </div>
        </div>

        {/* Card 4: Accreditation Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Accreditation Rate
              </p>
              <h3 className="text-3xl font-black text-[#0d9488] tracking-tight mt-2">
                {compliancePct}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-[#0d9488]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 font-medium">
            <span>{approvedCount} Approved Dossiers</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Pill Capsule Bar */}
      <div className="p-2 rounded-2xl bg-[#eff4ff] border border-blue-100 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {/* Search Input Button / Trigger */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search student, registration number, permanent UID..."
            className="w-full bg-white rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 border border-slate-200/80 focus:outline-hidden focus:ring-1 focus:ring-[#0d9488]"
          />
        </div>

        {/* Academic Year Dropdown Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">ACADEMIC YEAR:</span>
          <select
            value={academicYearFilter}
            onChange={(e) => {
              setAcademicYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent font-bold text-slate-800 border-none focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">2026–2027 (All)</option>
            {academicYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Program Dropdown Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">PROGRAM:</span>
          <select
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent font-bold text-slate-800 border-none focus:outline-hidden cursor-pointer max-w-[260px] truncate"
          >
            <option value="ALL">All Programs ({programOptions.length})</option>
            {programOptions.map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>
        </div>

        {/* Campus Dropdown Pill — hidden for REGISTRAR (data is already institution-scoped) */}
        {currentRole !== 'REGISTRAR' && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">CAMPUS:</span>
          <select
            value={campusFilter}
            onChange={(e) => {
              setCampusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent font-bold text-slate-800 border-none focus:outline-hidden cursor-pointer max-w-[280px] truncate"
          >
            <option value="ALL">All Campuses ({campusOptions.length})</option>
            {campusOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        )}
      </div>

      {/* 4. Workflow Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ALL');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({statusCounts.ALL})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('DRAFT');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'DRAFT'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Draft ({statusCounts.DRAFT})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('SUBMITTED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'SUBMITTED'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Submitted ({statusCounts.SUBMITTED})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('UNDER_REVIEW');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'UNDER_REVIEW'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Under Review ({statusCounts.UNDER_REVIEW})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('CORRECTION_REQUIRED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'CORRECTION_REQUIRED'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          Correction Required ({statusCounts.CORRECTION_REQUIRED})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('RESUBMITTED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'RESUBMITTED'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Resubmitted ({statusCounts.RESUBMITTED})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('APPROVED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-[#0d9488] text-white shadow-xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          Approved ({statusCounts.APPROVED})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('ARCHIVED');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
            statusFilter === 'ARCHIVED'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Archived ({statusCounts.ARCHIVED})
        </button>
      </div>

      {/* 5. Sub-bar (Select All & Real-time Sync Indicator) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
          />
          <span className="text-[11px] uppercase tracking-wider">
            Select All Across Page ({filteredRegistrations.length} Total Registrations)
          </span>
        </label>

      </div>

      {/* 6. Floating Bulk Action Pill (When selectedIds.length > 0) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#182234] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{selectedIds.length} registrations selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={handleBulkExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export (XLSX)</span>
          </button>

          <button
            type="button"
            onClick={handleBulkSubmitToReview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0b7a6f] text-white transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit to Review</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmBulkOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete ({selectedIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 7. Registration Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Column Headers */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
            />
          </div>
          <div className="col-span-2">Reg Number</div>
          <div className="col-span-2">Student Info</div>
          <div className="col-span-3">Academic Program</div>
          <div className="col-span-2">Intake Type</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        {paginatedRegistrations.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">No registrations found matching the applied filters.</p>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting the filters or create a new student registration.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedRegistrations.map((reg) => {
              const stu = reg.student;
              const isSelected = selectedIds.includes(reg.id);
              const initials = stu
                ? `${stu.first_name?.[0] || ''}${stu.last_name?.[0] || ''}`.toUpperCase() || 'ST'
                : 'ST';

              return (
                <div
                  key={reg.id}
                  onClick={() => onSelectRegistration(reg)}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-center px-5 py-4 transition-colors hover:bg-slate-50/70 cursor-pointer ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <div
                    className="lg:col-span-1 flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(reg.id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer"
                    />
                  </div>

                  {/* Reg Number */}
                  <div className="lg:col-span-2 space-y-0.5">
                    <p className="font-mono font-black text-xs text-slate-900">
                      {reg.registration_number}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Submitted {formatTimeAgo(reg.submitted_at || reg.created_at)}
                    </p>
                  </div>

                  {/* Student Info */}
                  <div className="lg:col-span-2 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#99efe5] text-[#006f67] font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {stu ? `${stu.first_name} ${stu.last_name}` : 'Student Record'}
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                        <div className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold inline-block">
                          {stu?.permanent_uid || 'STU-ID'}
                        </div>
                        <div className="truncate">{stu?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Program */}
                  <div className="lg:col-span-3 space-y-0.5">
                    <p className="font-bold text-xs text-slate-900">
                      {reg.program?.name || 'Academic Degree Program'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {reg.department?.name || reg.institution?.name || 'Academic Department'} &bull; {reg.academic_year}
                    </p>
                  </div>

                  {/* Intake Type */}
                  <div className="lg:col-span-2 flex items-center">
                    {getIntakeTypePill(reg.registration_type)}
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-1 flex items-center">
                    {getStatusBadge(reg.status)}
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1 flex items-center justify-end gap-2">
                    {/* CRITICAL CAMERA CAPTURE BUTTON REQUIRED BY TESTS */}
                    {canCapture && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCameraTargetReg(reg);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-semibold shadow-2xs transition-colors"
                        title="Open live phone camera stream for candidate document capture"
                      >
                        <Camera className="h-3.5 w-3.5 text-blue-600" />
                        <span>Capture</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReg(reg);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Registration"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(reg);
                      }}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      title="Delete Registration"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 8. Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              Showing {filteredRegistrations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredRegistrations.length)} of {filteredRegistrations.length} registrations
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

      {/* Edit Registration Modal */}
      <EditRegistrationModal
        registration={editingReg}
        isOpen={!!editingReg}
        onClose={() => setEditingReg(null)}
        onSuccess={() => {
          if (onReload) onReload();
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          if (onReload) onReload();
        }}
      />

      {/* Single Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Registration?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete registration{' '}
              <strong className="font-mono text-slate-900">{deleteTarget.registration_number}</strong>{' '}
              for candidate{' '}
              <strong>
                {deleteTarget.student?.first_name} {deleteTarget.student?.last_name}
              </strong>
              ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={handleConfirmSingleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeletingSingle ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isConfirmBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete {selectedIds.length} Registrations?
                </h3>
                <p className="text-xs text-slate-500">This bulk deletion cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete all{' '}
              <strong className="text-rose-600">{selectedIds.length}</strong> selected student registrations from the database?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmBulkOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={handleConfirmBulkDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeletingBulk ? 'Deleting Records...' : `Delete ${selectedIds.length} Registrations`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Web Camera Capture Modal */}
      {activeCameraReg && (
        <MobileWebCameraCapture
          onClose={() => setCameraTargetReg(null)}
          onCapture={(_dataUrl) => {
            alert(`Document image captured successfully for registration ${activeCameraReg.registration_number}! Record updated.`);
            setCameraTargetReg(null);
          }}
        />
      )}
    </div>
  );
};
