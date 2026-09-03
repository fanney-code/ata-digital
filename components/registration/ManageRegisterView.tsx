'use client';

import React, { useState } from 'react';
import { Registration, UserRole } from '@/lib/types';
import { StatusBadge } from '../dashboard/StatusBadge';
import { ExcelImportModal } from './ExcelImportModal';
import { EditRegistrationModal } from './EditRegistrationModal';
import { MobileWebCameraCapture } from './MobileWebCameraCapture';
import { deleteRegistration, deleteRegistrationsBulk } from '@/lib/api/supabase-service';
import {
  FileCheck2,
  Plus,
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Users,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Camera,
} from 'lucide-react';

interface ManageRegisterViewProps {
  registrations: Registration[];
  currentRole: UserRole;
  onSelectRegistration: (reg: Registration) => void;
  onNewRegistration: () => void;
  onReRegisterStudent?: (student: any) => void;
  onReload?: () => void;
}

export const ManageRegisterView: React.FC<ManageRegisterViewProps> = ({
  registrations,
  onSelectRegistration,
  onNewRegistration,
  onReRegisterStudent,
  onReload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [cameraTargetReg, setCameraTargetReg] = useState<Registration | null>(null);

  // Edit Modal State
  const [editingReg, setEditingReg] = useState<Registration | null>(null);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);

  // Single Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;
    const studentName = reg.student
      ? `${reg.student.first_name} ${reg.student.last_name}`
      : '';
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      reg.registration_number.toLowerCase().includes(q) ||
      studentName.toLowerCase().includes(q) ||
      (reg.institution?.name || '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const isAllSelected =
    filteredRegistrations.length > 0 &&
    filteredRegistrations.every((r) => selectedIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Single Delete Execution
  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteRegistration(deleteTarget.id, deleteTarget.student_id);
      setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
      setDeleteTarget(null);
      if (onReload) onReload();
    } catch (err: any) {
      alert(`Failed to delete registration: ${err.message}`);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Bulk Delete Execution
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const selectedRegs = registrations.filter((r) => selectedIds.includes(r.id));
      const studentIds = selectedRegs.map((r) => r.student_id);

      await deleteRegistrationsBulk(selectedIds, studentIds);
      setSelectedIds([]);
      setIsConfirmBulkOpen(false);
      if (onReload) onReload();
    } catch (err: any) {
      alert(`Failed to delete selected registrations: ${err.message}`);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Action Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Manage Register
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono text-xs font-bold border border-blue-200">
              {registrations.length} Total Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
            Register students manually or import bulk student registrations dynamically from Excel spreadsheets. Manage, edit, or remove candidate records in real time.
          </p>
        </div>

        {/* Registrar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-2xs transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Excel File
          </button>

          <button
            onClick={onNewRegistration}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            + Manual Registration
          </button>
        </div>
      </div>

      {/* Filter and Selection Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Select All Checkbox Button */}
          <button
            onClick={handleToggleSelectAll}
            disabled={filteredRegistrations.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shrink-0 disabled:opacity-50"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>Select All ({filteredRegistrations.length})</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reg #, student, institution..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CORRECTION_REQUIRED">Correction Required</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="APPROVED">Approved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-slate-300">
              Bulk actions for selected registration records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={() => setIsConfirmBulkOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Registrations Directory List with Action Column */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-800">No Registrations Found</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Try adjusting your search criteria or register a student using manual form or Excel import.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRegistrations.map((reg) => {
              const isSelected = selectedIds.includes(reg.id);
              return (
                <div
                  key={reg.id}
                  className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Left: Checkbox + Student Info */}
                  <div className="flex items-start gap-3.5">
                    {/* Multi-select checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(reg.id);
                      }}
                      className="mt-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-extrabold text-xs text-slate-900">
                          {reg.registration_number}
                        </span>
                        <StatusBadge status={reg.status} size="sm" />
                      </div>

                      <h3
                        onClick={() => onSelectRegistration(reg)}
                        className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {reg.student ? `${reg.student.first_name} ${reg.student.last_name}` : 'Student Record'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {reg.institution?.name || 'Institution'}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {reg.academic_year}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-slate-400" />
                          {reg.registration_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions Column (Edit, Delete, View Details) */}
                  <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReg(reg);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                      title="Edit student and registration details"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(reg);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs transition-colors"
                      title="Delete student registration"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRegistration(reg);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Single Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Registration?
                </h3>
                <p className="text-xs text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete registration{' '}
              <strong className="font-mono text-slate-900">
                {deleteTarget.registration_number}
              </strong>{' '}
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

      {/* Bulk Delete Confirmation Modal */}
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
                <p className="text-xs text-slate-500">
                  This bulk deletion cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete all{' '}
              <strong className="text-rose-600">{selectedIds.length}</strong> selected
              student registrations from the database?
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
                <span>
                  {isDeletingBulk
                    ? 'Deleting Records...'
                    : `Delete ${selectedIds.length} Registrations`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Web Camera Capture Modal */}
      {cameraTargetReg && (
        <MobileWebCameraCapture
          onClose={() => setCameraTargetReg(null)}
          onCapture={(dataUrl) => {
            alert(`Document image captured successfully for registration ${cameraTargetReg.registration_number}! Record updated.`);
            setCameraTargetReg(null);
          }}
        />
      )}
    </div>
  );
};
